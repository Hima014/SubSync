import { jsPDF } from 'jspdf';
import { Invoice, Customer } from '@/types';
import { formatMinorUnits } from './billing-engine';

export function generateInvoicePDF(invoice: Invoice, customer?: Customer): void {
  const doc = new jsPDF();

  // Header / Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Emerald green
  doc.text('SUBSYNC', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Every Subscription in Sync. Every Billing Action Protected.', 14, 26);
  doc.text('Billing Integrity Guard Verified Invoice', 14, 31);

  // Invoice Number & Status
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceNumber, 150, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Issue Date: ${invoice.issuedDate}`, 150, 26);
  doc.text(`Due Date: ${invoice.dueDate}`, 150, 31);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 36);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 42, 196, 42);

  // Customer / Bill To Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BILL TO:', 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(customer?.company || customer?.name || 'Customer Account', 14, 56);
  if (customer?.billingAddress?.line1) {
    doc.text(customer.billingAddress.line1, 14, 61);
    doc.text(
      `${customer.billingAddress.city || ''}, ${customer.billingAddress.state || ''} ${customer.billingAddress.postalCode || ''}`,
      14,
      66
    );
  }
  if (customer?.taxId) {
    doc.text(`Tax ID: ${customer.taxId}`, 14, 71);
  }

  // Billing Period
  doc.setFont('helvetica', 'bold');
  doc.text('BILLING PERIOD:', 120, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.billingPeriodStart} to ${invoice.billingPeriodEnd}`, 120, 56);

  // Line items table header
  const tableY = 82;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, tableY, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', 16, tableY + 5.5);
  doc.text('QTY', 110, tableY + 5.5);
  doc.text('UNIT PRICE', 135, tableY + 5.5);
  doc.text('TOTAL', 170, tableY + 5.5);

  // Line items
  let currentY = tableY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  invoice.lineItems.forEach((item) => {
    doc.text(item.description, 16, currentY);
    doc.text(item.quantity.toString(), 112, currentY);
    doc.text(formatMinorUnits(item.unitPriceMinorUnits, invoice.currency), 135, currentY);
    doc.text(formatMinorUnits(item.subtotalMinorUnits, invoice.currency), 170, currentY);
    currentY += 8;
  });

  doc.line(14, currentY, 196, currentY);
  currentY += 8;

  // Totals Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', 130, currentY);
  doc.text(formatMinorUnits(invoice.subtotalMinorUnits, invoice.currency), 170, currentY);
  currentY += 6;

  if (invoice.discountMinorUnits > 0) {
    doc.text('Discount:', 130, currentY);
    doc.text(`-${formatMinorUnits(invoice.discountMinorUnits, invoice.currency)}`, 170, currentY);
    currentY += 6;
  }

  doc.text('Tax:', 130, currentY);
  doc.text(`+${formatMinorUnits(invoice.taxMinorUnits, invoice.currency)}`, 170, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Due:', 130, currentY);
  doc.text(formatMinorUnits(invoice.totalMinorUnits, invoice.currency), 170, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text('Amount Paid:', 130, currentY);
  doc.text(formatMinorUnits(invoice.amountPaidMinorUnits, invoice.currency), 170, currentY);
  currentY += 6;

  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text('Balance Due:', 130, currentY);
  doc.text(formatMinorUnits(invoice.balanceDueMinorUnits, invoice.currency), 170, currentY);

  // Explainable Calculation Passport Seal
  if (invoice.passport) {
    currentY += 16;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, 182, 34, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.text('EXPLAINABLE INVOICE PASSPORT & INTEGRITY SEAL', 20, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Formula: Base (${formatMinorUnits(invoice.passport.baseAmountMinorUnits)}) - Discount ${invoice.passport.discountPercent}% (${formatMinorUnits(invoice.passport.discountMinorUnits)}) + Tax ${invoice.passport.taxRatePercent}% (${formatMinorUnits(invoice.passport.taxMinorUnits)}) = Total ${formatMinorUnits(invoice.passport.totalMinorUnits)}`, 20, currentY + 16);
    doc.text(`Integrity Status: ${invoice.passport.integritySnapshot.status} • Passport Hash: ${invoice.passport.integritySnapshot.hash}`, 20, currentY + 22);
    doc.text(`Immutable Snapshot Issued At: ${invoice.passport.issuedAt}`, 20, currentY + 28);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated autonomously by SUBSYNC Billing Platform • Deterministic Financial Engine', 14, 285);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

