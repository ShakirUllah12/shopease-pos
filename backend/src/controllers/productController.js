const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Category = require('../models/Category');
const StockMovement = require('../models/StockMovement');
const { STOCK_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Get products with filters and variants populated
 */
async function getProducts(req, res, next) {
  try {
    const {
      search,
      categoryId,
      isClothing,
      isActive = 'true',
      lowStock,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (isClothing !== undefined && isClothing !== '') {
      query.isClothing = isClothing === 'true';
    }

    // Search filter across product name or description
    if (search && search.trim()) {
      const term = search.trim();
      // First check if any variant matches SKU or barcode
      const matchedVariants = await ProductVariant.find({
        $or: [
          { sku: new RegExp(term, 'i') },
          { barcode: new RegExp(term, 'i') },
        ],
      }).select('productId');

      const productIdsFromVariants = matchedVariants.map((v) => v.productId);

      query.$or = [
        { name: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
        { _id: { $in: productIdsFromVariants } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .populate('variants')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Product.countDocuments(query),
    ]);

    // If lowStock requested, filter products that have at least one variant with currentStock <= minStockAlert
    let results = products;
    if (lowStock === 'true') {
      results = results.filter((p) =>
        p.variants && p.variants.some((v) => v.currentStock <= v.minStockAlert)
      );
    }

    res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take),
      products: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fast search for Point of Sale (POS)
 */
async function searchPosProducts(req, res, next) {
  try {
    const { query = '' } = req.query;
    const term = query.trim();

    const productFilter = { isActive: true };

    if (term) {
      // Find matching variants by SKU or Barcode
      const matchingVariants = await ProductVariant.find({
        isActive: true,
        $or: [
          { sku: new RegExp(term, 'i') },
          { barcode: term },
        ],
      }).select('productId');

      const variantProductIds = matchingVariants.map((v) => v.productId);

      productFilter.$or = [
        { name: new RegExp(term, 'i') },
        { _id: { $in: variantProductIds } },
      ];
    }

    const products = await Product.find(productFilter)
      .populate('categoryId', 'name')
      .populate({
        path: 'variants',
        match: { isActive: true },
      })
      .sort({ name: 1 })
      .limit(60)
      .lean();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get product by ID with full details
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('variants')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product with variants (Owner only)
 */
async function createProduct(req, res, next) {
  try {
    const {
      name,
      categoryId,
      description = '',
      isClothing = false,
      trackStock = true,
      variants = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist' });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one variant or default pricing specification is required',
      });
    }

    // Validate SKUs uniqueness within the submission
    const skus = variants.map((v) => (v.sku || '').trim().toUpperCase());
    for (const sku of skus) {
      if (!sku) {
        return res.status(400).json({ success: false, message: 'All variants must have a non-empty SKU' });
      }
    }
    const duplicateInPayload = skus.find((sku, idx) => skus.indexOf(sku) !== idx);
    if (duplicateInPayload) {
      return res.status(400).json({
        success: false,
        message: `Duplicate SKU found in submission: "${duplicateInPayload}"`,
      });
    }

    // Check if any SKU already exists in database
    const existingSkus = await ProductVariant.find({ sku: { $in: skus } }).select('sku');
    if (existingSkus.length > 0) {
      const conflictList = existingSkus.map((e) => e.sku).join(', ');
      return res.status(409).json({
        success: false,
        message: `The following SKU(s) already exist: ${conflictList}. Please assign unique SKUs.`,
      });
    }

    // Validate prices
    for (const v of variants) {
      if (Number(v.costPrice) < 0 || Number(v.sellingPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cost price and selling price cannot be negative.',
        });
      }
    }

    // Create parent Product
    const newProduct = await Product.create({
      name: name.trim(),
      categoryId: category._id,
      categoryName: category.name,
      description: description.trim(),
      isClothing: Boolean(isClothing),
      trackStock: Boolean(trackStock),
      isActive: true,
    });

    // Create variants and initial stock movements
    const createdVariants = [];
    for (const v of variants) {
      const initialStock = Number(v.stockQuantity !== undefined ? v.stockQuantity : (v.initialStock !== undefined ? v.initialStock : (v.currentStock !== undefined ? v.currentStock : 0))) || 0;
      const threshold = v.lowStockThreshold !== undefined ? Number(v.lowStockThreshold) : (v.minStockAlert !== undefined ? Number(v.minStockAlert) : 5);

      const variantDoc = await ProductVariant.create({
        productId: newProduct._id,
        sku: v.sku.trim().toUpperCase(),
        barcode: v.barcode ? v.barcode.trim() : undefined,
        variantName: v.variantName || (isClothing ? `${v.color || ''} / ${v.size || ''}`.trim() : 'Default'),
        size: isClothing ? (v.size || '').trim() : '',
        color: isClothing ? (v.color || '').trim() : '',
        costPrice: Math.round(Number(v.costPrice) * 100) / 100,
        sellingPrice: Math.round(Number(v.sellingPrice) * 100) / 100,
        stockQuantity: initialStock,
        currentStock: initialStock,
        lowStockThreshold: threshold >= 0 ? threshold : 5,
        minStockAlert: threshold >= 0 ? threshold : 5,
        isActive: true,
      });

      createdVariants.push(variantDoc);

      // Record Opening Stock Movement if initial stock provided
      if (initialStock > 0) {
        await StockMovement.create({
          variantId: variantDoc._id,
          productId: newProduct._id,
          productName: newProduct.name,
          sku: variantDoc.sku,
          type: STOCK_MOVEMENT_TYPE.OPENING_STOCK,
          quantityChange: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Initial Opening Stock during product registration',
          createdBy: req.user._id,
          createdByName: req.user.fullName || req.user.username,
        });
      }
    }

    const populatedProduct = await Product.findById(newProduct._id)
      .populate('categoryId', 'name')
      .populate('variants')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Product and variants created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing product and its variants (Owner only)
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      description,
      isClothing,
      trackStock,
      isActive,
      variants = [],
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name && name.trim()) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (trackStock !== undefined) product.trackStock = Boolean(trackStock);
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    if (categoryId && categoryId !== product.categoryId.toString()) {
      const cat = await Category.findById(categoryId);
      if (cat) {
        product.categoryId = cat._id;
        product.categoryName = cat.name;
      }
    }

    await product.save();

    // Process variants updates or additions
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v._id) {
          // Existing variant update
          const existingVariant = await ProductVariant.findOne({
            _id: v._id,
            productId: product._id,
          });

          if (existingVariant) {
            if (v.sku && v.sku.trim().toUpperCase() !== existingVariant.sku) {
              const skuCheck = await ProductVariant.findOne({
                sku: v.sku.trim().toUpperCase(),
                _id: { $ne: existingVariant._id },
              });
              if (skuCheck) {
                return res.status(409).json({
                  success: false,
                  message: `SKU "${v.sku}" is already assigned to another variant.`,
                });
              }
              existingVariant.sku = v.sku.trim().toUpperCase();
            }

            if (v.costPrice !== undefined) existingVariant.costPrice = Math.max(0, Number(v.costPrice));
            if (v.sellingPrice !== undefined) existingVariant.sellingPrice = Math.max(0, Number(v.sellingPrice));
            if (v.lowStockThreshold !== undefined) {
              existingVariant.lowStockThreshold = Math.max(0, Number(v.lowStockThreshold));
              existingVariant.minStockAlert = existingVariant.lowStockThreshold;
            } else if (v.minStockAlert !== undefined) {
              existingVariant.minStockAlert = Math.max(0, Number(v.minStockAlert));
              existingVariant.lowStockThreshold = existingVariant.minStockAlert;
            }
            if (v.stockQuantity !== undefined) {
              existingVariant.stockQuantity = Math.max(0, Number(v.stockQuantity));
              existingVariant.currentStock = existingVariant.stockQuantity;
            } else if (v.currentStock !== undefined) {
              existingVariant.currentStock = Math.max(0, Number(v.currentStock));
              existingVariant.stockQuantity = existingVariant.currentStock;
            }
            if (v.barcode !== undefined) existingVariant.barcode = v.barcode.trim();
            if (v.size !== undefined) existingVariant.size = v.size.trim();
            if (v.color !== undefined) existingVariant.color = v.color.trim();
            if (v.variantName !== undefined) existingVariant.variantName = v.variantName.trim();
            if (typeof v.isActive === 'boolean') existingVariant.isActive = v.isActive;

            await existingVariant.save();
          }
        } else {
          // New variant addition to existing product
          const newSku = (v.sku || '').trim().toUpperCase();
          if (!newSku) {
            return res.status(400).json({ success: false, message: 'New variant requires a valid SKU' });
          }

          const skuConflict = await ProductVariant.findOne({ sku: newSku });
          if (skuConflict) {
            return res.status(409).json({
              success: false,
              message: `SKU "${newSku}" already exists in the system.`,
            });
          }

          const initialStock = Number(v.stockQuantity !== undefined ? v.stockQuantity : (v.initialStock !== undefined ? v.initialStock : 0));
          const threshold = v.lowStockThreshold !== undefined ? Number(v.lowStockThreshold) : (v.minStockAlert !== undefined ? Number(v.minStockAlert) : 5);
          const newVariant = await ProductVariant.create({
            productId: product._id,
            sku: newSku,
            barcode: v.barcode ? v.barcode.trim() : undefined,
            variantName: v.variantName || `${v.color || ''} ${v.size || ''}`.trim() || 'Default',
            size: (v.size || '').trim(),
            color: (v.color || '').trim(),
            costPrice: Math.max(0, Number(v.costPrice) || 0),
            sellingPrice: Math.max(0, Number(v.sellingPrice) || 0),
            stockQuantity: initialStock,
            currentStock: initialStock,
            lowStockThreshold: Math.max(0, threshold),
            minStockAlert: Math.max(0, threshold),
            isActive: true,
          });

          if (initialStock > 0) {
            await StockMovement.create({
              variantId: newVariant._id,
              productId: product._id,
              productName: product.name,
              sku: newVariant.sku,
              type: STOCK_MOVEMENT_TYPE.OPENING_STOCK,
              quantityChange: initialStock,
              previousStock: 0,
              newStock: initialStock,
              reason: 'Opening stock for newly added product variant',
              createdBy: req.user._id,
              createdByName: req.user.fullName || req.user.username,
            });
          }
        }
      }
    }

    const updated = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('variants')
      .lean();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle active status of product (and its variants)
 */
async function toggleProductStatus(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (typeof req.body.isActive === 'boolean') {
      product.isActive = req.body.isActive;
    } else {
      product.isActive = !product.isActive;
    }
    await product.save();

    // Cascade active status to variants
    await ProductVariant.updateMany(
      { productId: product._id },
      { $set: { isActive: product.isActive } }
    );

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: product.isActive,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  searchPosProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
};
