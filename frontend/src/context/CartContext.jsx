import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  // Add item to cart
  const addToCart = (product, variant, qty = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.variantId === variant._id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + qty;

        // Stock check
        if (product.trackStock && newQty > variant.currentStock) {
          throw new Error(`Cannot add more. Available stock for ${variant.sku} is ${variant.currentStock}.`);
        }

        const lineTotal = Math.max(0, newQty * existing.unitPrice - (existing.discount || 0));

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal,
        };
        return updated;
      } else {
        if (product.trackStock && qty > variant.currentStock) {
          throw new Error(`Cannot add to cart. Available stock for ${variant.sku} is ${variant.currentStock}.`);
        }

        const unitPrice = variant.sellingPrice;
        const lineTotal = Math.max(0, qty * unitPrice);

        return [
          ...prevItems,
          {
            variantId: variant._id,
            productId: product._id,
            productName: product.name,
            categoryName: product.categoryName || '',
            sku: variant.sku,
            size: variant.size || '',
            color: variant.color || '',
            unitPrice,
            costPrice: variant.costPrice,
            currentStock: variant.currentStock,
            trackStock: product.trackStock,
            quantity: qty,
            discount: 0,
            lineTotal,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (variantId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.variantId === variantId) {
          if (it.trackStock && qty > it.currentStock) {
            throw new Error(`Only ${it.currentStock} units available in stock.`);
          }
          const lineTotal = Math.max(0, qty * it.unitPrice - (it.discount || 0));
          return { ...it, quantity: qty, lineTotal };
        }
        return it;
      })
    );
  };

  // Update line item discount
  const updateItemDiscount = (variantId, discount) => {
    const d = Math.max(0, Number(discount) || 0);
    setItems((prev) =>
      prev.map((it) => {
        if (it.variantId === variantId) {
          const lineTotal = Math.max(0, it.quantity * it.unitPrice - d);
          return { ...it, discount: d, lineTotal };
        }
        return it;
      })
    );
  };

  // Remove single item
  const removeFromCart = (variantId) => {
    setItems((prev) => prev.filter((it) => it.variantId !== variantId));
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
    setOrderDiscount(0);
  };

  // Calculations
  const { subtotal, totalItemCount } = useMemo(() => {
    let sub = 0;
    let count = 0;
    items.forEach((it) => {
      sub += it.lineTotal;
      count += it.quantity;
    });
    return {
      subtotal: Math.round(sub * 100) / 100,
      totalItemCount: count,
    };
  }, [items]);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    const taxable = Math.max(0, subtotal - orderDiscount);
    return Math.round(((taxable * taxRate) / 100) * 100) / 100;
  }, [subtotal, orderDiscount, taxRate]);

  const totalAmount = useMemo(() => {
    const total = Math.max(0, subtotal - orderDiscount + taxAmount);
    return Math.round(total * 100) / 100;
  }, [subtotal, orderDiscount, taxAmount]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        orderDiscount,
        setOrderDiscount,
        taxRate,
        setTaxRate,
        subtotal,
        taxAmount,
        totalAmount,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
