import jsPDF from 'jspdf';
import type { DevotionalDay } from '../types/devotional';

// Constrói o documento PDF com retrocompatibilidade total para estudos antigos e novos
export function buildDevotionalPdfDoc(devotional: DevotionalDay): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  // Paleta Kerygma Devocional
  const colors = {
    primary: [140, 74, 47] as [number, number, number],      // Terracota / Âmbar escuro (#8C4A2F)
    cardBg: [250, 247, 242] as [number, number, number],      // Fundo suave quente (#FAF7F2)
    cardBorder: [226, 213, 195] as [number, number, number],  // Borda elegante (#E2D5C3)
    textPrimary: [44, 36, 29] as [number, number, number],    // Grafite quente (#2C241D)
    textSecondary: [107, 90, 75] as [number, number, number], // Marrom médio (#6B5A4B)
    accentBox: [244, 238, 230] as [number, number, number],   // Fundo de destaque (#F4EEE6)
    emerald: [16, 120, 80] as [number, number, number],       // Verde para desafios (#107850)
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 22) {
      doc.addPage();
      cursorY = 22;
    }
  };

  const drawCard = (x: number, y: number, w: number, h: number, bg = colors.cardBg, border = colors.cardBorder) => {
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  };

  // ---------------------------------------------------------------------------
  // 1. TOPO: BADGE DO LOCUS TEOLÓGICO + DATA (COM FALLBACKS)
  // ---------------------------------------------------------------------------
  const locusName = (devotional.theologicalTheme?.locus || 'DEVOCIONAL BÍBLICO').toUpperCase();
  const dateStr = devotional.date || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  
  const badgeWidth = doc.getTextWidth(locusName) + 8;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, cursorY - 4, badgeWidth, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(locusName, margin + 4, cursorY + 0.3);

  if (dateStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(dateStr, pageWidth - margin, cursorY, { align: 'right' });
  }

  cursorY += 8;

  // ---------------------------------------------------------------------------
  // 2. TÍTULO PRINCIPAL E SUBTÍTULO
  // ---------------------------------------------------------------------------
  const safeTitle = devotional.title || 'Estudo Devocional';
  doc.setFont('times', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const titleLines = doc.splitTextToSize(safeTitle, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 7.5 + 1;

  if (devotional.theologicalTheme?.subtitle) {
    doc.setFont('times', 'italic');
    doc.setFontSize(11.5);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    const subtitleLines = doc.splitTextToSize(devotional.theologicalTheme.subtitle, contentWidth);
    doc.text(subtitleLines, margin, cursorY);
    cursorY += subtitleLines.length * 5.2 + 4;
  }

  cursorY += 2;

  // ---------------------------------------------------------------------------
  // 3. CARD DO TEXTO BÍBLICO (SEJA NOVO OU ANTIGO)
  // ---------------------------------------------------------------------------
  const keyVerseText = devotional.scripture?.keyVerse ? `"${devotional.scripture.keyVerse}"` : '';
  const refHeader = `${devotional.scripture?.reference || 'PASSAGEM BÍBLICA'} (${devotional.scripture?.version || 'BÍBLIA SAGRADA'})`.toUpperCase();

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  const verseLines = keyVerseText ? doc.splitTextToSize(keyVerseText, contentWidth - 14) : [];

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const fullScriptureLines = devotional.scripture?.fullText
    ? doc.splitTextToSize(devotional.scripture.fullText, contentWidth - 14)
    : [];

  if (verseLines.length > 0 || fullScriptureLines.length > 0) {
    const verseBlockHeight = 12 + (verseLines.length * 5.5) + (fullScriptureLines.length ? fullScriptureLines.length * 4.5 + 6 : 0);
    ensureSpace(verseBlockHeight + 6);

    drawCard(margin, cursorY, contentWidth, verseBlockHeight, colors.cardBg, colors.cardBorder);

    // Faixa lateral terracota
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, cursorY, 2.5, verseBlockHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(refHeader, margin + 7, cursorY + 7);

    if (verseLines.length > 0) {
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(12);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      doc.text(verseLines, margin + 7, cursorY + 13);
    }

    if (fullScriptureLines.length > 0) {
      const textStartY = cursorY + (verseLines.length > 0 ? 13 + (verseLines.length * 5.5) : 10);
      if (verseLines.length > 0) {
        doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
        doc.setLineWidth(0.2);
        doc.line(margin + 7, textStartY - 1, pageWidth - margin - 7, textStartY - 1);
      }

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(fullScriptureLines, margin + 7, textStartY + 4);
    }

    cursorY += verseBlockHeight + 7;
  }

  // ---------------------------------------------------------------------------
  // 4. PANORAMA & CONTEXTO HISTÓRICO (SE EXISTIR NO OBJETO)
  // ---------------------------------------------------------------------------
  if (devotional.historicalRedemptiveContext) {
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const contextLines = doc.splitTextToSize(devotional.historicalRedemptiveContext, contentWidth - 12);
    const contextHeight = contextLines.length * 4.6 + 12;

    ensureSpace(contextHeight + 4);
    drawCard(margin, cursorY, contentWidth, contextHeight, colors.accentBox, colors.cardBorder);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('PANORAMA & CONTEXTO BÍBLICO', margin + 6, cursorY + 6);

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(contextLines, margin + 6, cursorY + 11);

    cursorY += contextHeight + 6;
  }

  // ---------------------------------------------------------------------------
  // 5. PALAVRAS-CHAVE NOS ORIGINAIS (SE EXISTIR)
  // ---------------------------------------------------------------------------
  if (Array.isArray(devotional.exegesisInsights) && devotional.exegesisInsights.length > 0) {
    ensureSpace(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('PALAVRAS-CHAVE NOS ORIGINAIS', margin, cursorY);
    cursorY += 4.5;

    devotional.exegesisInsights.forEach((item) => {
      const headerText = `${item.transliteration || item.originalWord || 'Original'} (${item.morphology || 'Termo Bíblico'})`;
      const defText = item.definition ? `Definição: ${item.definition}` : '';
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const ctxLines = item.exegeticalContext ? doc.splitTextToSize(item.exegeticalContext, contentWidth - 12) : [];
      const itemHeight = 11 + (ctxLines.length * 4.2);

      ensureSpace(itemHeight + 4);
      drawCard(margin, cursorY, contentWidth, itemHeight, colors.cardBg, colors.cardBorder);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(headerText, margin + 6, cursorY + 5.5);

      if (defText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
        doc.text(defText, margin + 6, cursorY + 9.5);
      }

      if (ctxLines.length > 0) {
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        doc.text(ctxLines, margin + 6, cursorY + 13.5);
      }

      cursorY += itemHeight + 3.5;
    });

    cursorY += 2;
  }

  // ---------------------------------------------------------------------------
  // 6. EXPOSIÇÃO DA PALAVRA (SUPORTA SEÇÕES OU FORMATO ANTIGO)
  // ---------------------------------------------------------------------------
  if (Array.isArray(devotional.expositionSections) && devotional.expositionSections.length > 0) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('EXPOSIÇÃO DA PALAVRA', margin, cursorY);
    cursorY += 5;

    devotional.expositionSections.forEach((section) => {
      ensureSpace(14);
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      doc.text(section.heading || 'Reflexão Bíblica', margin, cursorY);
      cursorY += 6;

      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);

      const paragraphs = Array.isArray(section.paragraphs)
        ? section.paragraphs
        : section.paragraphs
        ? [String(section.paragraphs)]
        : [];

      paragraphs.forEach((p) => {
        const pLines = doc.splitTextToSize(p, contentWidth);
        const pHeight = pLines.length * 5.2;
        ensureSpace(pHeight + 4);
        doc.text(pLines, margin, cursorY);
        cursorY += pHeight + 3.5;
      });

      cursorY += 2;
    });
  }

  // ---------------------------------------------------------------------------
  // 7. DESAFIOS PRÁTICOS (COMPATÍVEL COM QUALQUER SCHEMA ANTERIOR)
  // ---------------------------------------------------------------------------
  if (Array.isArray(devotional.practicalChallenges) && devotional.practicalChallenges.length > 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
    doc.text('DESAFIOS PRÁTICOS PARA A VIDA', margin, cursorY);
    cursorY += 5;

    devotional.practicalChallenges.forEach((ch, idx) => {
      const category = (ch.category || 'Ação Prática').toUpperCase();
      const title = ch.title || `Desafio ${idx + 1}`;
      const desc = ch.challenge || (ch as any).description || (ch as any).action || '';

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      const chLines = desc ? doc.splitTextToSize(desc, contentWidth - 18) : [];
      const cardHeight = Math.max(12, 11 + (chLines.length * 4.6));

      ensureSpace(cardHeight + 4);
      drawCard(margin, cursorY, contentWidth, cardHeight, colors.cardBg, colors.cardBorder);

      // Checkbox visual [ ]
      doc.setDrawColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.setLineWidth(0.4);
      doc.rect(margin + 5, cursorY + 4.5, 4, 4);

      // Categoria + Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
      doc.text(`[${category}] ${title}`, margin + 12, cursorY + 7.5);

      if (chLines.length > 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
        doc.text(chLines, margin + 12, cursorY + 12);
      }

      cursorY += cardHeight + 3.5;
    });

    cursorY += 3;
  }

  // ---------------------------------------------------------------------------
  // 8. ORAÇÃO GUIADA
  // ---------------------------------------------------------------------------
  if (devotional.guidedPrayer) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    const prayerLines = doc.splitTextToSize(`"${devotional.guidedPrayer}"`, contentWidth - 14);
    const prayerHeight = prayerLines.length * 5 + 13;

    ensureSpace(prayerHeight + 6);
    drawCard(margin, cursorY, contentWidth, prayerHeight, colors.accentBox, colors.primary);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('ORAÇÃO GUIADA', margin + 7, cursorY + 6.5);

    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(prayerLines, margin + 7, cursorY + 12);

    cursorY += prayerHeight + 6;
  }

  // ---------------------------------------------------------------------------
  // 9. RODAPÉ INSTITUCIONAL EM TODAS AS PÁGINAS
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text('Kerygma Devocional • Teologia & Prática Diária', margin, pageHeight - 9);

    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 9,
      { align: 'right' }
    );
  }

  return doc;
}

export function getDevotionalPdfBlobUrl(devotional: DevotionalDay): string {
  const doc = buildDevotionalPdfDoc(devotional);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export function exportDevotionalToPdf(devotional: DevotionalDay) {
  const doc = buildDevotionalPdfDoc(devotional);
  const fileTitle = (devotional.title || 'devocional')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 35);

  doc.save(`${devotional.date || 'estudo'}-${fileTitle}.pdf`);
}