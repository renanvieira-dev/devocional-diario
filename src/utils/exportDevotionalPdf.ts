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
  let cursorY = 20;

  // Paleta Kerygma Devocional
  const colors = {
    primary: [140, 74, 47] as [number, number, number],      // Terracota / Âmbar escuro (#8C4A2F)
    cardBg: [250, 247, 242] as [number, number, number],      // Fundo suave quente (#FAF7F2)
    cardBorder: [226, 213, 195] as [number, number, number],  // Borda elegante (#E2D5C3)
    textPrimary: [44, 36, 29] as [number, number, number],    // Grafite quente (#2C241D)
    textSecondary: [107, 90, 75] as [number, number, number], // Marrom médio (#6B5A4B)
    accentBox: [244, 238, 230] as [number, number, number],   // Fundo de destaque (#F4EEE6)
    emerald: [16, 120, 80] as [number, number, number],       // Verde para desafios/conclusão
  };

  // Controle inteligente de quebra de página
  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 22) {
      doc.addPage();
      cursorY = 22;
    }
  };

  // Desenha um Card com cantos arredondados
  const drawCard = (x: number, y: number, w: number, h: number, bg = colors.cardBg, border = colors.cardBorder) => {
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  };

  // ---------------------------------------------------------------------------
  // 1. TOPO: BADGE DO LOCUS TEOLÓGICO + DATA
  // ---------------------------------------------------------------------------
  const locusName = (devotional.theologicalTheme?.locus || 'DEVOCIONAL BÍBLICO').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  
  // Pílula do Tema
  const badgeWidth = doc.getTextWidth(locusName) + 8;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, cursorY - 4, badgeWidth, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(locusName, margin + 4, cursorY + 0.3);

  // Data à direita
  if (devotional.date) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(devotional.date, pageWidth - margin, cursorY, { align: 'right' });
  }

  cursorY += 8;

  // ---------------------------------------------------------------------------
  // 2. TÍTULO PRINCIPAL E SUBTÍTULO
  // ---------------------------------------------------------------------------
  doc.setFont('times', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const titleLines = doc.splitTextToSize(devotional.title, contentWidth);
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
  // 3. CARD: TEXTO BÍBLICO BASE (COM BARRA LATERAL TERRICOTA)
  // ---------------------------------------------------------------------------
  const keyVerse = devotional.scripture?.keyVerse ? `"${devotional.scripture.keyVerse}"` : '';
  const refHeader = `${devotional.scripture?.reference || ''} (${devotional.scripture?.version || 'NVT'})`.toUpperCase();

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12.5);
  const verseLines = doc.splitTextToSize(keyVerse, contentWidth - 14);

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const fullScriptureLines = devotional.scripture?.fullText
    ? doc.splitTextToSize(devotional.scripture.fullText, contentWidth - 14)
    : [];

  const verseBlockHeight = 12 + (verseLines.length * 5.5) + (fullScriptureLines.length ? fullScriptureLines.length * 4.5 + 6 : 0);
  ensureSpace(verseBlockHeight + 6);

  // Fundo do Card Bíblico
  drawCard(margin, cursorY, contentWidth, verseBlockHeight, colors.cardBg, colors.cardBorder);

  // Barra lateral esquerda terracota (estilo Kerygma)
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, cursorY, 2.5, verseBlockHeight, 1, 1, 'F');

  // Cabeçalho da Referência Bíblica
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(refHeader, margin + 7, cursorY + 7);

  // Versículo-chave destacado
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(verseLines, margin + 7, cursorY + 13);

  // Texto corrido (se houver)
  if (fullScriptureLines.length > 0) {
    const textStartY = cursorY + 13 + (verseLines.length * 5.5);
    doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
    doc.setLineWidth(0.2);
    doc.line(margin + 7, textStartY - 1, pageWidth - margin - 7, textStartY - 1);

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(fullScriptureLines, margin + 7, textStartY + 4);
  }

  cursorY += verseBlockHeight + 7;

  // ---------------------------------------------------------------------------
  // 4. PANORAMA & CONTEXTO HISTÓRICO-REDENTIVO (SE HOUVER)
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
  // 5. VOCABULÁRIO & EXEGESE NOS ORIGINAIS (SE HOUVER)
  // ---------------------------------------------------------------------------
  if (devotional.exegesisInsights && devotional.exegesisInsights.length > 0) {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('PALAVRAS-CHAVE NOS ORIGINAIS', margin, cursorY);
    cursorY += 4.5;

    devotional.exegesisInsights.forEach((item) => {
      const headerText = `${item.transliteration || item.originalWord} (${item.morphology || 'Termo Bíblico'})`;
      const defText = `Definição: ${item.definition || ''}`;
      
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

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      doc.text(defText, margin + 6, cursorY + 9.5);

      if (ctxLines.length > 0) {
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        doc.text(ctxLines, margin + 6, cursorY + 13.5);
      }

      cursorY += itemHeight + 3.5;
    });

    cursorY += 2;
  }

  // ---------------------------------------------------------------------------
  // 6. EXPOSIÇÃO DA PALAVRA
  // ---------------------------------------------------------------------------
  if (devotional.expositionSections && devotional.expositionSections.length > 0) {
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
      doc.text(section.heading, margin, cursorY);
      cursorY += 6;

      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);

      section.paragraphs.forEach((p) => {
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
  // 7. DESAFIOS PRÁTICOS PARA A VIDA (CARDS COM CHECKBOX)
  // ---------------------------------------------------------------------------
  if (devotional.practicalChallenges && devotional.practicalChallenges.length > 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
    doc.text('DESAFIOS PRÁTICOS PARA A VIDA', margin, cursorY);
    cursorY += 5;

    devotional.practicalChallenges.forEach((ch, idx) => {
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      const chLines = doc.splitTextToSize(ch.challenge, contentWidth - 18);
      const cardHeight = 11 + (chLines.length * 4.6);

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
      const headerTitle = `[${ch.category.toUpperCase()}] ${ch.title}`;
      doc.text(headerTitle, margin + 12, cursorY + 7.5);

      // Descrição da ação prática
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      doc.text(chLines, margin + 12, cursorY + 12);

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

    // Linha divisória de rodapé
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

  // Nome do arquivo gerado
  const safeTitle = (devotional.title || 'devocional')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 35);

  doc.save(`${devotional.date || 'estudo'}-${safeTitle}.pdf`);
}