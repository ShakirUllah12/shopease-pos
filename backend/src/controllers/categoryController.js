const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * List all categories with product count
 */
async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();

    // Attach product counts to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ categoryId: cat._id, isActive: true });
        return {
          ...cat,
          productCount,
        };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new category (Owner only)
 */
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update category (Owner only)
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name && name.trim()) {
      const existing = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Another category with this name already exists.',
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
};
