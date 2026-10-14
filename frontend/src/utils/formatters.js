/**
 * Format currency in Pakistani Rupees (PKR / Rs.)
 * @param {number} amount
 * @param {boolean} showSymbol
 * @returns {string}
 */
export function formatPKR(amount = 0, showSymbol = true) {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return showSymbol ? `Rs. ${formatted}` : formatted;
}

export const formatCurrency = formatPKR;

/**
 * Format Date & Time in Asia/Karachi timezone
 * @param {string|Date} dateInput
 * @param {boolean} includeTime
 * @returns {string}
 */
export function formatDateTime(dateInput, includeTime = true) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);

  const options = {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  };

  return new Intl.DateTimeFormat('en-PK', options).format(d);
}

/**
 * Format compact date for tables (DD/MM/YYYY)
 */
export function formatDate(dateInput) {
  return formatDateTime(dateInput, false);
}

/**
 * Format thermal receipt timestamp
 */
export function formatReceiptTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}
