import type { DbOrderRecord } from '@/services/ordersService';

function sanitizePdfText(input: string): string {
  return input
    .replace(/[—–]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function formatLkr(amount: number): string {
  return `Rs. ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generates a clean, valid PDF 1.4 invoice blob using built-in Helvetica fonts
 * with zero external dependencies, and triggers a browser .pdf download.
 */
export function downloadOrderInvoicePdf(order: DbOrderRecord): void {
  const ops: string[] = [];

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
  ) => {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x} ${y} ${w} ${h} re f`);
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r = 0.85,
    g = 0.88,
    b = 0.92,
    width = 0.8,
  ) => {
    ops.push(`${width} w`);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    bold = false,
    r = 0.09,
    g = 0.13,
    b = 0.2,
  ) => {
    const font = bold ? 'F2' : 'F1';
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`);
  };

  // Page size: A4 (595 x 842 pt)
  // 1. Dark Navy Header Banner
  drawRect(0, 725, 595, 117, 0.04, 0.07, 0.13);
  drawRect(0, 722, 595, 3, 0.01, 0.52, 0.78);

  drawText('NextGenSolution', 44, 795, 22, true, 1, 1, 1);
  drawText(
    'Enterprise Hardware, Software Licensing & Precision Repairs',
    44,
    775,
    9.5,
    false,
    0.58,
    0.78,
    0.95,
  );
  drawText(
    '130/55, Wijaya Sewana, Honnanthara South, Piliyandala  |  WhatsApp: +94 76 033 6703',
    44,
    756,
    8.5,
    false,
    0.7,
    0.76,
    0.84,
  );

  drawText('INVOICE / RECEIPT', 410, 795, 15, true, 0.22, 0.74, 0.97);
  drawText(`#${order.order_number}`, 410, 775, 11, true, 1, 1, 1);

  const issueDate = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
  drawText(`Date: ${issueDate}`, 410, 757, 9, false, 0.78, 0.84, 0.9);

  // 2. Customer & Order Status Cards
  drawRect(44, 610, 248, 92, 0.97, 0.98, 0.99);
  drawRect(303, 610, 248, 92, 0.97, 0.98, 0.99);

  drawText('BILL TO / CUSTOMER', 56, 684, 8, true, 0.01, 0.52, 0.78);
  drawText(order.customer_name || 'Customer', 56, 667, 11, true, 0.06, 0.09, 0.16);
  drawText(order.customer_email || '-', 56, 651, 9, false, 0.3, 0.36, 0.45);
  const addressLines = wrapText(
    order.shipping_address || 'Piliyandala Service Hub Pickup / Local Delivery',
    38,
  );
  addressLines.slice(0, 2).forEach((line, idx) => {
    drawText(line, 56, 635 - idx * 12, 8.5, false, 0.35, 0.42, 0.5);
  });

  drawText('ORDER STATUS', 315, 684, 8, true, 0.01, 0.52, 0.78);
  drawText(`Order Ref: #${order.order_number}`, 315, 667, 9.5, true, 0.06, 0.09, 0.16);
  drawText(`Payment: ${order.payment_status}`, 315, 650, 9.5, false, 0.25, 0.32, 0.42);
  drawText(
    `Fulfillment: ${order.fulfillment_status}`,
    315,
    633,
    9.5,
    true,
    0.04,
    0.55,
    0.34,
  );

  // 3. Items Table Header
  let cursorY = 576;
  drawRect(44, cursorY, 507, 24, 0.05, 0.09, 0.15);
  drawText('#', 54, cursorY + 8, 8.5, true, 1, 1, 1);
  drawText('ITEM DESCRIPTION', 76, cursorY + 8, 8.5, true, 1, 1, 1);
  drawText('QTY', 338, cursorY + 8, 8.5, true, 1, 1, 1);
  drawText('UNIT PRICE', 380, cursorY + 8, 8.5, true, 1, 1, 1);
  drawText('TOTAL', 470, cursorY + 8, 8.5, true, 1, 1, 1);

  cursorY -= 22;

  const items =
    order.order_items && order.order_items.length > 0
      ? order.order_items
      : [{ item_name: 'Hardware Order', quantity: 1, unit_price: order.total }];

  let computedSubtotal = 0;

  items.forEach((item, index) => {
    const lineTotal = item.unit_price * item.quantity;
    computedSubtotal += lineTotal;

    const nameLines = wrapText(item.item_name, 42);
    const rowHeight = Math.max(24, nameLines.length * 13 + 10);

    if (index % 2 === 1) {
      drawRect(44, cursorY - rowHeight + 16, 507, rowHeight, 0.98, 0.99, 1);
    }

    drawText(String(index + 1), 54, cursorY, 9, false, 0.3, 0.36, 0.45);
    nameLines.forEach((line, lineIdx) => {
      drawText(line, 76, cursorY - lineIdx * 13, 9.5, lineIdx === 0, 0.08, 0.12, 0.2);
    });
    drawText(String(item.quantity), 342, cursorY, 9.5, false, 0.15, 0.2, 0.3);
    drawText(formatLkr(item.unit_price), 380, cursorY, 9, false, 0.25, 0.32, 0.42);
    drawText(formatLkr(lineTotal), 470, cursorY, 9.5, true, 0.06, 0.09, 0.16);

    cursorY -= rowHeight;
    drawLine(44, cursorY + 14, 551, cursorY + 14, 0.9, 0.92, 0.95, 0.6);
  });

  // 4. Summary Totals Box
  const summaryTop = Math.max(170, cursorY - 14);
  const taxAndShipping = Math.max(0, Number(order.total) - computedSubtotal);

  drawRect(318, summaryTop - 72, 233, 86, 0.96, 0.98, 1);
  drawLine(318, summaryTop + 14, 551, summaryTop + 14, 0.78, 0.86, 0.94, 1);

  drawText('Items Subtotal:', 332, summaryTop - 4, 9.5, false, 0.35, 0.42, 0.5);
  drawText(formatLkr(computedSubtotal), 445, summaryTop - 4, 9.5, true, 0.1, 0.14, 0.22);

  drawText('Tax & Dispatch:', 332, summaryTop - 22, 9.5, false, 0.35, 0.42, 0.5);
  drawText(formatLkr(taxAndShipping), 445, summaryTop - 22, 9.5, true, 0.1, 0.14, 0.22);

  drawLine(330, summaryTop - 34, 540, summaryTop - 34, 0.82, 0.88, 0.94, 0.8);

  drawText('GRAND TOTAL:', 332, summaryTop - 54, 11, true, 0.04, 0.07, 0.13);
  drawText(
    formatLkr(order.total),
    438,
    summaryTop - 54,
    12,
    true,
    0.01,
    0.52,
    0.78,
  );

  // 5. Footer Warranty & Thank-You Note
  drawLine(44, 95, 551, 95, 0.85, 0.89, 0.93, 0.8);
  drawText(
    'Thank you for choosing NextGenSolution! All certified hardware includes official or seller warranty coverage.',
    44,
    78,
    8.5,
    false,
    0.35,
    0.42,
    0.5,
  );
  drawText(
    'For support, warranty claims, or delivery inquiries, message us on WhatsApp at +94 76 033 6703.',
    44,
    64,
    8.5,
    false,
    0.35,
    0.42,
    0.5,
  );
  drawText(
    'This is a computer-generated invoice from NextGenSolution (Piliyandala Service Hub).',
    44,
    46,
    7.5,
    false,
    0.55,
    0.6,
    0.68,
  );

  // Assemble PDF 1.4 Binary Structure
  const streamContent = ops.join('\n');
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(streamContent);

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${order.order_number}-invoice.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
