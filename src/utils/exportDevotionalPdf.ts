import jsPDF from 'jspdf';
import type { DevotionalDay } from '../types/devotional';

export function exportDevotionalToPdf(devotional: DevotionalDay) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 22;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // 1. Cabeçalho / Tema Teológico
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(140, 74, 47); // Tom terracota/âmbar
  const locusHeader = `${devotional.date || ''} • ${devotional.theologicalTheme?.locus || 'DEVOCIONAL'}`.toUpperCase();
  doc.text(locusHeader, margin, cursorY);
  cursorY += 7;

  // 2. Título Principal
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  const titleLines = doc.splitTextToSize(devotional.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 8 + 2;

  // 3. Subtítulo
  if (devotional.theologicalTheme?.subtitle) {
    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(90, 80, 70);
    const subLines = doc.splitTextToSize(devotional.theologicalTheme.subtitle, contentWidth);
    doc.text(subLines, margin, cursorY);
    cursorY += subLines.length * 6 + 6;
  }

  // Linha divisória
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // 4. Versículo Chave & Referência
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(120, 50, 25);
  const verseText = `"${devotional.scripture?.keyVerse}" — ${devotional.scripture?.reference} (${devotional.scripture?.version || 'NVT'})`;
  const verseLines = doc.splitTextToSize(verseText, contentWidth);
  checkPageBreak(verseLines.length * 6 + 4);
  doc.text(verseLines, margin, cursorY);
  cursorY += verseLines.length * 6 + 6;

  // Texto bíblico completo
  if (devotional.scripture?.fullText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const fullScriptureLines = doc.splitTextToSize(devotional.scripture.fullText, contentWidth);
    checkPageBreak(fullScriptureLines.length * 5 + 4);
    doc.text(fullScriptureLines, margin, cursorY);
    cursorY += fullScriptureLines.length * 5 + 8;
  }

  // 5. Exposição Doutrinária
  if (devotional.expositionSections && devotional.expositionSections.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    checkPageBreak(8);
    doc.text('EXPOSIÇÃO DA PALAVRA', margin, cursorY);
    cursorY += 6;

    devotional.expositionSections.forEach((section) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(120, 50, 25);
      doc.text(section.heading, margin, cursorY);
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      section.paragraphs.forEach((p) => {
        const pLines = doc.splitTextToSize(p, contentWidth);
        checkPageBreak(pLines.length * 5 + 4);
        doc.text(pLines, margin, cursorY);
        cursorY += pLines.length * 5 + 4;
      });
      cursorY += 2;
    });
  }

  // 6. Desafios Práticos
  if (devotional.practicalChallenges && devotional.practicalChallenges.length > 0) {
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('DESAFIOS PRÁTICOS PARA A VIDA', margin, cursorY);
    cursorY += 6;

    devotional.practicalChallenges.forEach((ch, idx) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(140, 74, 47);
      doc.text(`${idx + 1}. [${ch.category.toUpperCase()}] ${ch.title}`, margin, cursorY);
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      const challengeLines = doc.splitTextToSize(ch.challenge, contentWidth);
      doc.text(challengeLines, margin, cursorY);
      cursorY += challengeLines.length * 4.8 + 4;
    });
  }

  // 7. Oração Guiada
  if (devotional.guidedPrayer) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(120, 50, 25);
    doc.text('ORAÇÃO GUIADA', margin, cursorY);
    cursorY += 5;

    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const prayerLines = doc.splitTextToSize(`"${devotional.guidedPrayer}"`, contentWidth);
    doc.text(prayerLines, margin, cursorY);
    cursorY += prayerLines.length * 5 + 6;
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Kerygma Devocional • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Sanitização do nome do arquivo
  const safeTitle = (devotional.title || 'devocional')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 35);

  doc.save(`${devotional.date || 'estudo'}-${safeTitle}.pdf`);
}