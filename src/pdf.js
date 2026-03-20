/* ========================================
   PDF 생성 모듈 — 견적서, 제안서, 보고서, 정산서
   ======================================== */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WORK_TYPES, formatMoney, formatBizNumber } from './data.js';

/* ========= 한글 폰트 설정 (기본 sans-serif 사용) ========= */
function initDoc(orientation = 'portrait') {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  // 기본 폰트 대신 Helvetica 사용 (한글은 unicode escape로 처리)
  return doc;
}

/* ========= 공통 헤더 ========= */
function drawHeader(doc, title, companyName = '') {
  // 상단 바
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 12, 'F');

  // 회사명
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName || 'AD Commander', 15, 8);

  // 제목
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 46);
  doc.text(title, 15, 28);

  // 발행일
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text(dateStr, 195, 28, { align: 'right' });

  return 35;
}

/* ========= 공통 푸터 ========= */
function drawFooter(doc, managerName = '') {
  const h = doc.internal.pageSize.height;
  doc.setFillColor(248, 246, 243);
  doc.rect(0, h - 15, 210, 15, 'F');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 165);
  doc.text(`${managerName || 'AD Commander'} | Confidential`, 105, h - 6, { align: 'center' });
}

/* ================================
   1. 견적서 PDF
   ================================ */
export function generateQuotePDF(client, settings = {}) {
  const doc = initDoc();
  let y = drawHeader(doc, 'QUOTATION', settings.companyName);

  // 고객 / 발신자 정보
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 46);

  // 왼쪽: 고객사
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('TO (Client)', 15, y);
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 46);
  doc.text(client.name || '-', 15, y + 5);
  if (client.contactName) doc.text(client.contactName, 15, y + 10);
  if (client.bizNumber) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text(`BRN: ${formatBizNumber(client.bizNumber)}`, 15, y + 15);
  }

  // 오른쪽: 발신자
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('FROM', 130, y);
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 46);
  doc.text(settings.userName || 'AD Commander', 130, y + 5);
  if (settings.companyName) doc.text(settings.companyName, 130, y + 10);

  y += 25;

  // 구분선
  doc.setDrawColor(230, 230, 235);
  doc.line(15, y, 195, y);
  y += 8;

  // 서비스 내역 테이블
  const workType = WORK_TYPES.find(w => w.value === client.workType);
  const items = [];

  items.push([
    workType ? `${workType.emoji} ${workType.label}` : 'Service',
    client.product || '-',
    client.slotQty ? `${client.slotQty}` : '1',
    client.slotDays ? `${client.slotDays} days` : '-',
    client.amount ? formatMoney(client.amount) : '-'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Service', 'Product / Keyword', 'Qty', 'Duration', 'Amount (KRW)']],
    body: items,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 46],
    },
    alternateRowStyles: {
      fillColor: [248, 246, 243],
    },
    margin: { left: 15, right: 15 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // 합계
  doc.setFillColor(248, 246, 243);
  doc.roundedRect(120, y, 75, 28, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text('Subtotal', 125, y + 7);
  doc.text('VAT (10%)', 125, y + 14);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 46);
  doc.text('Total', 125, y + 23);

  const amount = client.amount || 0;
  const vat = Math.round(amount * 0.1);
  const total = amount + vat;

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 46);
  doc.text(`${formatMoney(amount)}`, 190, y + 7, { align: 'right' });
  doc.text(`${formatMoney(vat)}`, 190, y + 14, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text(`${formatMoney(total)} KRW`, 190, y + 23, { align: 'right' });

  y += 38;

  // 비고
  if (client.memo) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text('Notes', 15, y);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 100);
    const memoLines = doc.splitTextToSize(client.memo, 180);
    doc.text(memoLines, 15, y + 5);
    y += 5 + memoLines.length * 4;
  }

  // 기간
  if (client.startDate || client.endDate) {
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text('Duration', 15, y);
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 46);
    doc.text(`${client.startDate || 'TBD'} ~ ${client.endDate || 'TBD'}`, 15, y + 5);
  }

  // 서명 영역
  y = 240;
  doc.setDrawColor(200, 200, 210);
  doc.line(15, y, 85, y);
  doc.line(125, y, 195, y);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 165);
  doc.text('Client Signature', 50, y + 5, { align: 'center' });
  doc.text(settings.userName || 'Manager', 160, y + 5, { align: 'center' });

  drawFooter(doc, settings.userName);
  doc.save(`Quote_${client.name || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ================================
   2. 보고서 PDF
   ================================ */
export function generateReportPDF(client, reportContent, settings = {}) {
  const doc = initDoc();
  let y = drawHeader(doc, 'REPORT', settings.companyName);

  // 고객 정보
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('Client', 15, y);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 46);
  doc.text(client.name || '-', 15, y + 6);

  if (client.product) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 120);
    doc.text(client.product, 15, y + 12);
  }

  y += 20;
  doc.setDrawColor(230, 230, 235);
  doc.line(15, y, 195, y);
  y += 8;

  // 보고 내용
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 46);
  const lines = doc.splitTextToSize(reportContent || '', 175);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 10;

  // 순위 테이블
  if (client.rankHistory?.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text('Rank History', 15, y);
    y += 5;

    const rankRows = client.rankHistory.slice(-10).map(r => [
      r.date, `${r.rank}`, r.memo || ''
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Rank', 'Note']],
      body: rankRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    });
  }

  drawFooter(doc, settings.userName);
  doc.save(`Report_${client.name || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ================================
   3. 정산서 PDF
   ================================ */
export function generateSettlementPDF(data, month, settings = {}) {
  const doc = initDoc();
  let y = drawHeader(doc, 'SETTLEMENT', settings.companyName);

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 46);
  doc.text(`${month} Settlement`, 15, y);
  y += 10;

  // 고객별 매출 집계
  const monthRevenue = (data.revenue || []).filter(r => {
    return r.date && r.date.startsWith(month);
  });

  const clientMap = {};
  monthRevenue.forEach(r => {
    if (!clientMap[r.clientName]) clientMap[r.clientName] = 0;
    clientMap[r.clientName] += r.amount || 0;
  });

  const rows = Object.entries(clientMap).map(([name, amount]) => [
    name, formatMoney(amount), formatMoney(Math.round(amount * 0.1)), formatMoney(Math.round(amount * 1.1))
  ]);

  const totalAmount = Object.values(clientMap).reduce((s, a) => s + a, 0);

  rows.push(['TOTAL', formatMoney(totalAmount), formatMoney(Math.round(totalAmount * 0.1)), formatMoney(Math.round(totalAmount * 1.1))]);

  autoTable(doc, {
    startY: y,
    head: [['Client', 'Amount', 'VAT (10%)', 'Total']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    foot: [],
    margin: { left: 15, right: 15 },
    didParseCell: function (data) {
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 246, 243];
      }
    }
  });

  drawFooter(doc, settings.userName);
  doc.save(`Settlement_${month}.pdf`);
}
