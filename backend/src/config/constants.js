const ROLES = {
  OWNER: 'owner',
  CASHIER: 'cashier',
};

const CATEGORIES = {
  CLOTHING: 'Clothing',
  GENERAL_STORE: 'General Store',
};

const PAYMENT_METHODS = [
  'cash',
  'card',
  'bank_transfer',
  'jazzcash',
  'easypaisa',
  'raast',
  'credit',
  'other',
];

const SALE_STATUS = {
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  VOIDED: 'voided',
};

const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
};

const STOCK_MOVEMENT_TYPE = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  RETURN: 'RETURN',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  OPENING_STOCK: 'OPENING_STOCK',
};

const PURCHASE_STATUS = {
  ORDERED: 'ordered',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
};

const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Transport',
  'Salaries',
  'Supplies',
  'Maintenance',
  'Miscellaneous',
];

module.exports = {
  ROLES,
  CATEGORIES,
  PAYMENT_METHODS,
  SALE_STATUS,
  PAYMENT_STATUS,
  STOCK_MOVEMENT_TYPE,
  PURCHASE_STATUS,
  EXPENSE_CATEGORIES,
};
