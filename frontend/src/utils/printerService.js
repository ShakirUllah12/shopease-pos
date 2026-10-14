import { formatPKR, formatReceiptTime } from './formatters';

/**
 * Generates an aligned plain-text thermal receipt.
 * @param {object} sale - Completed sale record
 * @param {object} storeSettings - Store configuration
 * @param {string} paperWidth - '80mm' or '58mm'
 * @returns {string} Formatted monospace string
 */
export function generatePlainTextReceipt(sale, storeSettings = {}, paperWidth = '80mm') {
  if (!sale) return '';

  const is58mm = paperWidth === '58mm';
  const width = is58mm ? 32 : 48; // Standard char count for thermal rolls
  const sep = '='.repeat(width);
  const thinSep = '-'.repeat(width);

  const shopName = (storeSettings.shopName || 'ShopEase POS').toUpperCase();
  const tagline = storeSettings.tagline || 'Clothing & General Store';
  const address = storeSettings.address || '';
  const phone = storeSettings.phone || '';
  const footer = storeSettings.receiptFooter || 'Thank you for shopping! Exchanges within 7 days with receipt.';

  const center = (text) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const justify = (left, right) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };

  const lines = [];
  lines.push(sep);
  lines.push(center(shopName));
  if (tagline) lines.push(center(tagline));
  if (address) lines.push(center(address));
  if (phone) lines.push(center(`Ph: ${phone}`));
  lines.push(sep);

  lines.push(justify('RECEIPT #:', sale.receiptNumber || 'N/A'));
  lines.push(justify('DATE/TIME:', formatReceiptTime(sale.createdAt)));
  lines.push(justify('CASHIER:', sale.cashierName || 'Staff'));
  if (sale.customerName && sale.customerName !== 'Walk-in Customer') {
    lines.push(justify('CUSTOMER:', sale.customerName));
    if (sale.customerPhone) {
      lines.push(justify('PHONE:', sale.customerPhone));
    }
  }
  lines.push(thinSep);

  // Items Header
  if (is58mm) {
    lines.push('ITEM               QTY    AMOUNT');
  } else {
    lines.push('ITEM / VARIANT            QTY    RATE     AMOUNT');
  }
  lines.push(thinSep);

  sale.items?.forEach((item) => {
    const variantDesc = [item.color, item.size].filter(Boolean).join('/');
    const title = `${item.productName}${variantDesc ? ` (${variantDesc})` : ''}`;

    if (is58mm) {
      lines.push(title.substring(0, width));
      const qtyStr = String(item.quantity).padStart(4);
      const totalStr = formatPKR(item.lineTotal, false).padStart(9);
      lines.push(`              ${qtyStr}  ${totalStr}`);
    } else {
      let shortTitle = title;
      if (shortTitle.length > 24) shortTitle = shortTitle.substring(0, 23) + '…';
      const colTitle = shortTitle.padEnd(24);
      const colQty = String(item.quantity).padStart(4);
      const colRate = formatPKR(item.unitPrice, false).padStart(8);
      const colAmt = formatPKR(item.lineTotal, false).padStart(9);
      lines.push(`${colTitle} ${colQty} ${colRate} ${colAmt}`);
    }
  });

  lines.push(thinSep);

  // Totals
  lines.push(justify('Subtotal:', formatPKR(sale.subtotal, true)));
  if (sale.orderDiscount > 0) {
    lines.push(justify('Order Discount:', `-${formatPKR(sale.orderDiscount, true)}`));
  }
  if (sale.taxAmount > 0) {
    lines.push(justify('Tax / GST:', formatPKR(sale.taxAmount, true)));
  }
  lines.push(sep);
  lines.push(justify('NET TOTAL:', formatPKR(sale.totalAmount, true)));
  lines.push(sep);

  // Payment Breakdown
  if (sale.payments && sale.payments.length > 0) {
    sale.payments.forEach((p) => {
      const method = (p.method || 'cash').toUpperCase();
      const ref = p.referenceNumber ? ` (${p.referenceNumber})` : '';
      lines.push(justify(`Paid (${method}${ref}):`, formatPKR(p.amount, true)));
    });
  } else {
    lines.push(justify('Amount Paid:', formatPKR(sale.amountPaid, true)));
  }

  if (sale.changeGiven > 0) {
    lines.push(justify('Change Returned:', formatPKR(sale.changeGiven, true)));
  }

  lines.push(thinSep);
  lines.push(center(footer));
  lines.push(center(`* * * ${sale.receiptNumber} * * *`));
  lines.push(sep);

  return lines.join('\n');
}

/**
 * Generates raw ESC/POS binary buffer for thermal printers.
 */
export function generateEscPosBuffer(sale, storeSettings = {}, paperWidth = '80mm') {
  const encoder = new TextEncoder();
  const text = generatePlainTextReceipt(sale, storeSettings, paperWidth);

  // ESC/POS Command sequences:
  // ESC @: Initialize printer
  const init = new Uint8Array([0x1b, 0x40]);
  // GS V A 0: Paper cut
  const cut = new Uint8Array([0x1d, 0x56, 0x41, 0x00]);
  // ESC p 0 25 250: Open cash drawer
  const kickDrawer = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

  const bodyBytes = encoder.encode(text + '\n\n\n');

  // Concatenate bytes
  const totalLength = init.length + kickDrawer.length + bodyBytes.length + cut.length;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  combined.set(init, offset);
  offset += init.length;

  combined.set(kickDrawer, offset);
  offset += kickDrawer.length;

  combined.set(bodyBytes, offset);
  offset += bodyBytes.length;

  combined.set(cut, offset);

  return combined;
}

/**
 * Downloads receipt as plain text or raw binary ESC/POS file.
 */
export function downloadReceiptFile(sale, storeSettings = {}, paperWidth = '80mm', isRawBinary = false) {
  const receiptNum = sale?.receiptNumber || 'receipt';
  if (isRawBinary) {
    const buffer = generateEscPosBuffer(sale, storeSettings, paperWidth);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receiptNum}-thermal.bin`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const text = generatePlainTextReceipt(sale, storeSettings, paperWidth);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receiptNum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Open WhatsApp with pre-formatted receipt message
 */
export function openWhatsAppReceipt(sale, storeSettings = {}) {
  const text = generatePlainTextReceipt(sale, storeSettings, '80mm');
  const encodedText = encodeURIComponent(
    `*${storeSettings?.shopName || 'ShopEase POS'} - Receipt #${sale.receiptNumber}*\n\n` + text
  );

  let phone = (sale.customerPhone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1); // Standardize to Pakistan country code +92
  }

  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, '_blank');
}

/**
 * WebUSB direct print attempt (if browser supports WebUSB and device is available).
 */
export async function printDirectWebUSB(sale, storeSettings = {}, paperWidth = '80mm') {
  if (!navigator.usb) {
    throw new Error('WebUSB is not supported in this browser. Please use Standard System Print or Chrome/Edge over HTTPS/localhost.');
  }

  // Request or get paired USB thermal printer
  const device = await navigator.usb.requestDevice({
    filters: [
      { classCode: 7 }, // USB Printer Class
    ],
  });

  if (!device) {
    throw new Error('No USB thermal printer was selected.');
  }

  await device.open();
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }
  await device.claimInterface(0);

  // Find OUT bulk endpoint
  const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
    (e) => e.direction === 'out'
  );

  if (!endpoint) {
    throw new Error('Could not detect bulk OUT print endpoint on the selected USB device.');
  }

  const buffer = generateEscPosBuffer(sale, storeSettings, paperWidth);
  await device.transferOut(endpoint.endpointNumber, buffer);
  await device.close();

  return true;
}
