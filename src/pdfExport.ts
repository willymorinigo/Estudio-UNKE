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

// Helper to format date string YYYY-MM-DD or full ISO date to DD/MM/YYYY
export function formatDateDMY(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// Keep real accents and Spanish characters intact so they display beautifully on standard Helvetica fonts
function cleanText(text: string): string {
  return text || '';
}

// Render SVG path to PNG Base64 for clean PDF visualization
export function renderSvgToPng(svgString: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Scale by 4 for crystal clear printing resolution
          canvas.width = width * 4;
          canvas.height = height * 4;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(4, 4);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } else {
            URL.revokeObjectURL(url);
            resolve('');
          }
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve('');
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch (error) {
      resolve('');
    }
  });
}

export async function exportBudgetToPDF(budget: Budget, client?: Client) {
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
  const logoX = 20;
  const logoY = 26.5;
  const logoWidth = 10;
  const logoHeight = 9.5;

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 236.63 224.5"><path fill="#34877c" d="M191.27,39.31C150.98-.97,85.66-.97,45.38,39.31c-40.29,40.29-40.29,105.6,0,145.89,37.46,37.46,96.55,40.07,137.05,7.86h16.7v-16.71c32.21-40.5,29.6-99.59-7.86-137.05ZM73.8,138.53c-4.61,4.61-10.28,6.88-16.74,6.88s-12.05-2.27-16.66-6.88c-4.61-4.61-6.88-10.28-6.88-16.73v-33.11h9.43v33.11c0,3.9,1.35,7.23,4.04,9.93,2.77,2.83,6.17,4.18,10.07,4.18s7.23-1.41,10-4.18c2.77-2.77,4.25-6.1,4.25-9.93h.02l8.27,7.44c-1.11,3.44-3.02,6.55-5.81,9.3ZM118.32,145.27v.14l-47.15-42.39v-14.32l37.72,33.96v-33.96h9.43v56.57ZM161.83,145.41h-13.33l-24.53-24.39-3.97-3.9,3.97-3.97,24.53-24.46h13.33l-28.36,28.36,28.36,28.36ZM201.38,145.41h-37.79v-9.5h37.79v9.5ZM201.38,121.8h-37.79v-9.43h37.79v9.43ZM163.59,98.19v-9.5h37.79v9.5h-37.79Z"/></svg>`;

  try {
    const pngDataUrl = await renderSvgToPng(svgString, 236.63, 224.5);
    if (pngDataUrl) {
      doc.addImage(pngDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } else {
      throw new Error("Canvas render produced empty result");
    }
  } catch (err) {
    console.warn("Fallback to basic vector drawing", err);
    // Draw pretty circular medallion fallback
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.ellipse(logoX + 4.75, logoY + 4.75, 4.75, 4.75, 'F');
    doc.setFillColor(255, 255, 255);
    doc.ellipse(logoX + 4.75, logoY + 4.75, 2.2, 2.2, 'F');
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('UNKE', 32, 31.5);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mediumGray.r, mediumGray.g, mediumGray.b);
  doc.text('Estudio de Diseño Web & Identidad', 32, 36.5);

  // Studio Details (Top Right Alignment)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text('UNKE Estudio Creativo', 145, 28);
  doc.text('contacto@unke.com.ar', 145, 33);
  doc.text('La Plata, BS. AS., Argentina', 145, 38);

  // Thin separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(20, 44, 190, 44);

  // --- DOCUMENT TITLE & INFO SUB-HEADER ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('PRESUPUESTO', 20, 53);
  if (budget.isMonthly) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text('(ABONO MENSUAL RECURRENTE)', 20, 58);
  }

  // Budget details box
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  doc.text(`NÚMERO: ${budget.id}`, 145, 53);
  
  doc.setFont('Helvetica', 'normal');
  doc.text(`Fecha: ${formatDateDMY(budget.date)}`, 145, 58);
  doc.text(`Estado: ${budget.paymentStatus.toUpperCase() === 'PAID' ? 'PAGADO' : budget.paymentStatus.toUpperCase() === 'PENDING' ? 'PENDIENTE' : budget.paymentStatus.toUpperCase()}`, 145, 63);

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
  doc.text(`Teléfono: ${client?.phone || 'S/D'}`, 25, 90);
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
    : 'Los valores están fijados en Pesos Argentinos ($) y están sujetos a revisión cumplidos los 30 días de emitido. El inicio del servicio está supeditado a la acreditación de la seña acordada.';
  
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
  doc.text('Gracias por confiar en UNKE para sus soluciones de diseño visual y desarrollo web.', 20, pageHeight - 14);
  doc.text('UNKE | www.unke.com.ar | contacto@unke.com.ar', 135, pageHeight - 14);

  // Save the PDF file
  const filename = `UNKE_Presupuesto_${budget.id}_${budget.clientName.replace(/\s+/g, '_').substring(0, 20)}.pdf`;
  doc.save(filename);
}
