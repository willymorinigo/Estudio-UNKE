/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Budget, Client } from './types';

// Helper to format currency in Argentine Pesos (ARS)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Normalize Spanish accents for standard PDF fonts compatibility
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[Ñ]/g, 'N')
    .replace(/[üÜ]/g, 'u');
}

export function exportBudgetToPDF(budget: Budget, client?: Client) {
  // Create instance of jsPDF (A4 size, portrait, millimeters)
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = { r: 52, g: 135, b: 124 }; // #34877c
  const darkGray = { r: 60, g: 60, b: 60 }; // #3c3c3c
  const mediumGray = { r: 111, g: 111, b: 110 }; // #6f6f6e
  const lightGray = { r: 245, g: 245, b: 245 };

  // Page dimensions: 210mm x 297mm
  
  // --- TOP HEADER ACCENT BAND ---
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, 210, 15, 'F');

  // --- BRANDING SECTION ---
  // Stylized UNKE vector logo
  const logoX = 20;
  const logoY = 24;
  
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  // Outer circular/square speech bubble shape
  doc.ellipse(logoX + 4.5, logoY + 4.5, 4.5, 4.5, 'F');
  doc.rect(logoX + 4.5, logoY + 4.5, 4.5, 4.5, 'F');

  // Inner white U-shape representation
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.0);
  // Left vertical bar of U
  doc.line(logoX + 2.8, logoY + 2.5, logoX + 2.8, logoY + 5.5);
  // Right vertical bar of U
  doc.line(logoX + 6.2, logoY + 2.5, logoX + 6.2, logoY + 5.5);
  // U rounding connection at the bottom
  doc.line(logoX + 2.8, logoY + 5.5, logoX + 2.8, logoY + 6.8);
  doc.line(logoX + 6.2, logoY + 5.5, logoX + 6.2, logoY + 6.8);
  doc.line(logoX + 2.8, logoY + 6.8, logoX + 6.2, logoY + 6.8);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('UNKE', 32, 32);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  doc.text('ESTUDIO DE DISENO Web & Identidad', 32, 37);

  // Studio Details (Top Right Alignment)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text('UNKE Estudio Creativo', 145, 28);
  doc.text('contacto@unke.com.ar', 145, 33);
  doc.text('Argentina - Operaciones Remotas', 145, 38);

  // Thin separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(20, 44, 190, 44);

  // --- DOCUMENT TITLE & INFO SUB-HEADER ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('PRESUPUESTO TECNICO', 20, 53);

  // Budget details box
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text(`NUMERO: ${budget.id}`, 145, 53);
  
  doc.setFont('Helvetica', 'normal');
  doc.text(`Fecha: ${budget.date}`, 145, 58);
  doc.text(`Estado Pago: ${budget.paymentStatus.toUpperCase()}`, 145, 63);

  // --- CLIENT SHEET/INFO SECTION ---
  doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  doc.rect(20, 68, 170, 32, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('CLIENTE:', 25, 74);

  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFont('Helvetica', 'bold');
  doc.text(cleanText(budget.clientName), 45, 74);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Empresa / Proyecto: ${cleanText(client?.company || 'Estudio Particular')}`, 25, 80);
  doc.text(`Email: ${client?.email || 'S/D'}`, 25, 85);
  doc.text(`Telefono: ${client?.phone || 'S/D'}`, 25, 90);
  doc.text(`Domicilio: ${cleanText(client?.address || 'Argentina')}`, 25, 95);

  // --- ESTIMATE ITEMS TABLE ---
  let y = 110;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('DETALLE DEL PRESUPUESTO', 20, y);

  y += 5;
  // Table Header Background
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(20, y, 170, 7, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Item / Servicio', 24, y + 5);
  doc.text('Precio Unit.', 120, y + 5);
  doc.text('Cant.', 153, y + 5);
  doc.text('Subtotal', 172, y + 5);

  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.setFont('Helvetica', 'normal');
  
  y += 7;
  // Loop Items
  budget.items.forEach((item, index) => {
    // Alternating rows
    if (index % 2 === 1) {
      doc.setFillColor(249, 249, 249);
      doc.rect(20, y, 170, 8, 'F');
    }
    
    // Draw lines
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y + 8, 190, y + 8);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    
    // Wrap item name in case it's too long
    const itemText = cleanText(item.name);
    const splitName = doc.splitTextToSize(itemText, 92);
    
    doc.text(splitName, 24, y + 5);
    doc.text(formatCurrency(item.price), 120, y + 5);
    doc.text(item.quantity.toString(), 155, y + 5);
    doc.text(formatCurrency(item.subtotal), 172, y + 5);

    // Increment Y appropriately based on text wrap lines
    const increment = Math.max(8, splitName.length * 4.5 + 2);
    y += increment;
  });

  // --- PAYMENT STATUS & TOTAL BOX ---
  y += 4;
  if (y > 230) {
    // Prevent drawing totals at the absolute bottom edge
    doc.addPage();
    y = 25;
  }

  // Draw notes
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(253, 253, 253);
  doc.rect(20, y, 95, 30, 'FD');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('Condiciones y Notas:', 23, y + 5);

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  
  const notesText = budget.notes 
    ? cleanText(budget.notes) 
    : 'Los valores estan fijados en Pesos Argentinos ($) y estan sujetos a revision cumplidos los 30 dias de emitido. El inicio del servicio esta supeditado a la acreditacion de la sena acordada.';
  
  const splitNotes = doc.splitTextToSize(notesText, 89);
  doc.text(splitNotes, 23, y + 9);

  // Totals Breakdown Table
  let sumPaid = budget.payments.reduce((acc, curr) => acc + curr.amount, 0);
  let balance = budget.total - sumPaid;

  doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  doc.rect(120, y, 70, 30, 'F');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text('Total Presupuestado:', 123, y + 6);
  doc.text(formatCurrency(budget.total), 162, y + 6);

  doc.text('Pagos Registrados:', 123, y + 13);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(`-${formatCurrency(sumPaid)}`, 162, y + 13);

  // Thick accent line in totals box
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.4);
  doc.line(123, y + 17, 187, y + 17);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text('Saldo Pendiente:', 123, y + 23);
  
  // Highlight balance color depending on whether it's fully paid
  if (balance <= 0) {
    doc.setTextColor(34, 139, 34); // Forest green
    doc.text('PAGADO', 162, y + 23);
  } else {
    doc.setTextColor(190, 40, 40); // Soft red
    doc.text(formatCurrency(balance), 162, y + 23);
  }

  // --- FOOTER NOTIFICATION ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(230, 230, 230);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  doc.text('Gracias por confiar en UNKE para sus soluciones de diseno visual y desarrollo web.', 20, pageHeight - 14);
  doc.text('UNKE | www.unke.design | contacto@unke.com.ar', 135, pageHeight - 14);

  // Save the PDF file
  const filename = `UNKE_Presupuesto_${budget.id}_${budget.clientName.replace(/\s+/g, '_').substring(0, 20)}.pdf`;
  doc.save(filename);
}
