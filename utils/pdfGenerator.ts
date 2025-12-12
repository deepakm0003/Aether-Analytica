import { jsPDF } from "jspdf";
import { AnalysisResult } from "../types";

export const generatePDFReport = (
  result: AnalysisResult, 
  userImages?: string[] | null
) => {
  const doc = new jsPDF();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const MARGIN = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
  
  let cursorY = 20;

  // --- Helper: Check Page Break ---
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN; // Reset cursor to top margin
    }
  };

  // --- Helper: Add Section Title ---
  const addSectionTitle = (title: string, color: [number, number, number] = [15, 23, 42]) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, MARGIN, cursorY);
    cursorY += 8;
  };

  // --- Helper: Add Wrapped Text ---
  const addBodyText = (text: string, fontSize = 10, color: [number, number, number] = [51, 65, 85]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    const lineHeight = fontSize * 0.5; // Approx for PDF units
    const blockHeight = lines.length * lineHeight;
    
    checkPageBreak(blockHeight + 5);
    doc.text(lines, MARGIN, cursorY);
    cursorY += blockHeight + 5;
  };

  // --- Helper: Add Bullet Point ---
  const addBullet = (text: string) => {
    const bulletIndent = 5;
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - bulletIndent);
    const lineHeight = 5; 
    const blockHeight = lines.length * lineHeight;
    
    checkPageBreak(blockHeight + 2);
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("•", MARGIN, cursorY);
    doc.text(lines, MARGIN + bulletIndent, cursorY);
    cursorY += blockHeight + 2;
  };

  // --- 1. HEADER ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AETHER ANALYTICA", MARGIN, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("INTELLIGENCE REPORT", MARGIN, 33);
  
  const dateStr = new Date().toLocaleString();
  doc.text(dateStr, PAGE_WIDTH - MARGIN, 25, { align: "right" });
  
  cursorY = 55; 

  // --- 2. IMAGE GRID LAYOUT ---
  const imagesToPrint = userImages || [];
  
  if (imagesToPrint.length > 0) {
    // Header for images
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("ANALYSIS INPUTS", MARGIN, cursorY - 5);

    // Score Badge
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(PAGE_WIDTH - MARGIN - 60, cursorY, 60, 30, 3, 3, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text("SCORE", PAGE_WIDTH - MARGIN - 30, cursorY + 10, { align: "center" });
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    if (result.score > 75) doc.setTextColor(16, 185, 129);
    else if (result.score > 50) doc.setTextColor(245, 158, 11);
    else doc.setTextColor(239, 68, 68);
    doc.text(result.score.toString(), PAGE_WIDTH - MARGIN - 30, cursorY + 22, { align: "center" });

    // Grid Layout Logic
    const COL_COUNT = 2;
    const GAP = 10;
    const IMG_WIDTH = (CONTENT_WIDTH - GAP) / COL_COUNT;
    let currentRowHeight = 0;
    let startY = cursorY;

    // Filter valid images only
    const validImages = imagesToPrint.filter(img => img && img.length > 100);

    for (let i = 0; i < validImages.length; i++) {
        const imgData = validImages[i];
        try {
            const imgProps = doc.getImageProperties(imgData);
            const ratio = imgProps.width / imgProps.height;
            const targetHeight = IMG_WIDTH / ratio;
            
            // Calculate Position
            const colIndex = i % COL_COUNT;
            const xPos = MARGIN + (colIndex * (IMG_WIDTH + GAP));
            
            // If starting a new row, verify space
            if (colIndex === 0 && i > 0) {
                cursorY += currentRowHeight + GAP;
                checkPageBreak(targetHeight + GAP); // Check if next row fits
                currentRowHeight = 0; // Reset for new row
            }

            // Update row height to max image in this row
            if (targetHeight > currentRowHeight) {
                currentRowHeight = targetHeight;
            }

            // If a single image is huge, might break page on its own
            if (cursorY + targetHeight > PAGE_HEIGHT - MARGIN) {
                 doc.addPage();
                 cursorY = MARGIN;
            }

            // Draw
            doc.addImage(imgData, 'JPEG', xPos, cursorY, IMG_WIDTH, targetHeight);
            doc.setDrawColor(200, 200, 200);
            doc.rect(xPos, cursorY, IMG_WIDTH, targetHeight);

        } catch (e) {
            console.warn("PDF Image Error", e);
        }
    }
    
    // Final cursor update after images
    cursorY += currentRowHeight + 20;
  } else {
      cursorY += 10;
  }

  // --- 3. EXECUTIVE SUMMARY ---
  addSectionTitle("EXECUTIVE SUMMARY");
  addBodyText(result.summary, 11);

  // --- 4. KEY INSIGHTS ---
  addSectionTitle("STRATEGIC INSIGHTS", [37, 99, 235]); // Blue
  result.insights.forEach(insight => addBullet(insight));
  cursorY += 5;

  // --- 5. ACTION PLAN ---
  addSectionTitle("RECOMMENDED ACTIONS", [16, 185, 129]); // Green
  result.actionPlan.forEach(action => addBullet(action));
  cursorY += 5;

  // --- 6. CONSEQUENCES (Temporal) ---
  if (result.consequences && result.consequences.length > 0) {
      addSectionTitle("FUTURE CONSEQUENCES", [147, 51, 234]); // Purple
      
      const timeframes = ['immediate', 'short_term', 'long_term'];
      const labels = { immediate: "Immediate (1 Week)", short_term: "Short Term (1 Month)", long_term: "Long Term (1 Year)" };
      
      timeframes.forEach(tf => {
          const items = result.consequences?.filter(c => c.timeframe === tf);
          if (items && items.length > 0) {
             checkPageBreak(15);
             doc.setFontSize(11);
             doc.setFont("helvetica", "bold");
             doc.setTextColor(80, 80, 80);
             // @ts-ignore
             doc.text(labels[tf] || tf, MARGIN, cursorY);
             cursorY += 6;
             
             items.forEach(cons => {
                const text = `[${cons.severity.toUpperCase()}] ${cons.domain}: ${cons.prediction}`;
                addBullet(text);
             });
             cursorY += 4;
          }
      });
  }

  // --- 7. MERGE INTELLIGENCE (If Applicable) ---
  if (result.mergeConnections && result.mergeConnections.length > 0) {
      addSectionTitle("REALITY MERGE ANALYSIS", [236, 72, 153]); // Pink
      result.mergeConnections.forEach(conn => {
          const text = `${conn.type.toUpperCase()}: ${conn.source1} vs ${conn.source2} -> ${conn.insight}`;
          addBullet(text);
      });
      cursorY += 5;
  }

  // --- 8. RISKS & OPPORTUNITIES ---
  checkPageBreak(60); 
  const startY = cursorY;
  
  // Risks Column
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68); // Red
  doc.text("RISKS", MARGIN, cursorY);
  cursorY += 6;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  const riskLines = result.risks || ["None detected."];
  riskLines.forEach(r => {
      const lines = doc.splitTextToSize(`• ${r}`, (CONTENT_WIDTH / 2) - 10);
      doc.text(lines, MARGIN, cursorY);
      cursorY += (lines.length * 5) + 2;
  });

  // Opportunities Column (Reset Y but keep max for next)
  let riskEndY = cursorY;
  cursorY = startY; 
  const col2X = MARGIN + (CONTENT_WIDTH / 2) + 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Green
  doc.text("OPPORTUNITIES", col2X, cursorY);
  cursorY += 6;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  const oppLines = result.opportunities || ["None detected."];
  oppLines.forEach(o => {
      const lines = doc.splitTextToSize(`• ${o}`, (CONTENT_WIDTH / 2) - 10);
      doc.text(lines, col2X, cursorY);
      cursorY += (lines.length * 5) + 2;
  });

  // --- FOOTER ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated by Aether Analytica - Page ${i} of ${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
  }

  doc.save("Aether-Analysis-Report.pdf");
};