import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

/**
 * Templao AI PDF Report Generator
 *
 * Generates professional PDF reports from analysis results.
 * Used for:
 * - Document analysis reports
 * - Business insights reports
 * - Data summaries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = 'Rapport MAOS',
      subtitle,
      content,
      sections = [],
      metadata = {},
      analysis,
      summary,
      keyPoints = [],
    } = body;

    console.log('Generating Templao PDF report:', title);

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper function to add page if needed
    const checkNewPage = (requiredSpace: number = 30) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper function to add wrapped text
    const addWrappedText = (text: string, fontSize: number = 10, lineHeight: number = 5) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        checkNewPage(lineHeight);
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      }
    };

    // ========================================
    // HEADER
    // ========================================
    doc.setFillColor(0, 100, 180); // MAOS Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 20);

    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 30);
    }

    // Date
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(dateStr, pageWidth - margin - 60, 30);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // ========================================
    // METADATA BOX
    // ========================================
    if (Object.keys(metadata).length > 0) {
      doc.setFillColor(245, 245, 245);
      const metaHeight = Object.keys(metadata).length * 6 + 10;
      doc.rect(margin, yPos, contentWidth, metaHeight, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      yPos += 6;

      for (const [key, value] of Object.entries(metadata)) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, margin + 5, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), margin + 50, yPos);
        yPos += 5;
      }

      yPos += 10;
    }

    // ========================================
    // SUMMARY
    // ========================================
    if (summary) {
      checkNewPage(30);
      doc.setFillColor(230, 247, 255);
      doc.rect(margin, yPos, contentWidth, 25, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 180);
      doc.text('RESUME', margin + 5, yPos + 7);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(summary, contentWidth - 10);
      let summaryY = yPos + 14;
      for (const line of summaryLines.slice(0, 3)) {
        doc.text(line, margin + 5, summaryY);
        summaryY += 5;
      }

      yPos += 30;
    }

    // ========================================
    // KEY POINTS
    // ========================================
    if (keyPoints.length > 0) {
      checkNewPage(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 180);
      doc.text('POINTS CLES', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      for (const point of keyPoints.slice(0, 5)) {
        checkNewPage(8);
        doc.text('•', margin, yPos);
        const pointLines = doc.splitTextToSize(point, contentWidth - 10);
        doc.text(pointLines[0], margin + 5, yPos);
        yPos += 6;
        for (const line of pointLines.slice(1)) {
          doc.text(line, margin + 5, yPos);
          yPos += 5;
        }
      }

      yPos += 10;
    }

    // ========================================
    // MAIN CONTENT / ANALYSIS
    // ========================================
    if (content || analysis) {
      checkNewPage(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 180);
      doc.text('ANALYSE DETAILLEE', margin, yPos);
      yPos += 8;

      doc.setTextColor(0, 0, 0);
      addWrappedText(content || analysis || '', 10, 5);
      yPos += 5;
    }

    // ========================================
    // SECTIONS
    // ========================================
    for (const section of sections) {
      checkNewPage(40);

      // Section title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 180);
      doc.text(section.title || 'Section', margin, yPos);
      yPos += 7;

      doc.setTextColor(0, 0, 0);

      // Section content
      if (section.content) {
        addWrappedText(section.content, 10, 5);
        yPos += 3;
      }

      // Section bullet points
      if (section.bulletPoints && section.bulletPoints.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        for (const bullet of section.bulletPoints.slice(0, 10)) {
          checkNewPage(8);
          doc.text('•', margin + 2, yPos);
          const bulletLines = doc.splitTextToSize(bullet, contentWidth - 10);
          doc.text(bulletLines[0], margin + 7, yPos);
          yPos += 5;
          for (const line of bulletLines.slice(1)) {
            doc.text(line, margin + 7, yPos);
            yPos += 5;
          }
        }
      }

      // Section table
      if (section.table) {
        checkNewPage(50);
        yPos = addTable(doc, section.table, margin, yPos, contentWidth);
      }

      yPos += 10;
    }

    // ========================================
    // FOOTER
    // ========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `MAOS - Templao AI | Page ${i}/${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate output
    const pdfBuffer = doc.output('arraybuffer');
    const base64 = Buffer.from(pdfBuffer).toString('base64');
    const filename = `maos-rapport-${new Date().toISOString().split('T')[0]}.pdf`;

    console.log('PDF generated:', filename, 'Size:', base64.length);

    return NextResponse.json({
      pdf: {
        data: base64,
        filename,
      },
      success: true,
    });

  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    const message = error instanceof Error ? error.message : 'Erreur generation PDF';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Add a table to the PDF
 */
function addTable(
  doc: jsPDF,
  table: { headers: string[]; rows: string[][] },
  x: number,
  y: number,
  maxWidth: number
): number {
  const { headers, rows } = table;
  if (!headers || !rows || rows.length === 0) return y;

  const colCount = headers.length;
  const colWidth = maxWidth / colCount;
  const rowHeight = 7;

  // Header
  doc.setFillColor(0, 100, 180);
  doc.rect(x, y, maxWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  headers.forEach((header, i) => {
    const text = doc.splitTextToSize(header, colWidth - 4)[0];
    doc.text(text, x + i * colWidth + 2, y + 5);
  });

  y += rowHeight;

  // Rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  rows.slice(0, 20).forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(x, y, maxWidth, rowHeight, 'F');
    }

    row.forEach((cell, i) => {
      const text = doc.splitTextToSize(String(cell || ''), colWidth - 4)[0];
      doc.text(text, x + i * colWidth + 2, y + 5);
    });

    y += rowHeight;
  });

  return y + 5;
}
