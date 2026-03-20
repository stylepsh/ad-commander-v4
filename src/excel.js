/* ========================================
   Excel Export — 엑셀 내보내기 모듈
   일일 업무 기록, 고객 현황, 매출 내역 등
   ======================================== */
import * as XLSX from 'xlsx';
import { CLIENT_STATUS, WORK_TYPES, INVOICE_STATUS, PAYMENT_STATUS, formatBizNumber, formatMoney } from './data.js';
import { ALL_PRODUCTS } from './catalog.js';

/* ========= 전체 데이터 엑셀 내보내기 ========= */
export function exportAllToExcel(data) {
  const wb = XLSX.utils.book_new();

  // 1. 회사 매출 보고 (메인)
  addCompanySalesReport(wb, data);

  // 2. 고객 현황 시트
  addClientSheet(wb, data);

  // 3. 업무 기록 시트
  addTaskSheet(wb, data);

  // 4. 매출 내역 시트
  addRevenueSheet(wb, data);

  // 5. 슬롯 기록 시트
  addSlotSheet(wb, data);

  // 6. 일일 업무 일지 시트
  addDailyLogSheet(wb, data);

  // 7. 순위 변동 시트
  addRankHistorySheet(wb, data);

  // Download
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `AD_Commander_전체데이터_${today}.xlsx`);
}

/* ========= 회사 매출 보고 엑셀 (단독) ========= */
export function exportSalesReportToExcel(data) {
  const wb = XLSX.utils.book_new();
  addCompanySalesReport(wb, data);
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `매출보고_${today}.xlsx`);
}

/* ========= 회사 매출 보고 시트 ========= */
function addCompanySalesReport(wb, data) {
  const slots = data.slots || [];
  const settings = data.settings || {};

  const rows = slots.map(s => {
    const sellPrice = s.sellPrice || 0;
    const costPrice = s.costPrice || 0;
    const qty = s.qty || 1;
    const days = s.days || 10;

    // 리셀러 금액 = 원가 * 수량
    const resellerAmount = costPrice * qty;
    // 정산금액 = 판매단가 * 수량
    const settlementAmount = sellPrice * qty;
    // 수수료 = 정산금액 - 리셀러금액
    const commission = settlementAmount - resellerAmount;
    // 부가세 = 판매단가의 10%
    const vat = Math.round(sellPrice * 0.1);
    // 3.3 금제 = 정산금액 * 3.3%
    const tax33 = Math.round(settlementAmount * 0.033);
    // 실송제금 = 정산금액 - 3.3금제
    const netRemittance = settlementAmount - tax33;

    // 연장날짜 계산
    let extensionDate = '';
    if (s.deadline) {
      extensionDate = s.deadline;
    } else if (s.date && days) {
      // 날짜 파싱 (MM.DD 형식)
      try {
        const year = new Date().getFullYear();
        const parts = s.date.split('.');
        if (parts.length === 2) {
          const d = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
          d.setDate(d.getDate() + days);
          extensionDate = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      } catch (e) { /* skip */ }
    }

    return {
      '일자': s.date || '',
      '담당자': s.manager || settings.defaultManager || '',
      '키워드': s.keyword || '',
      '단가': sellPrice,
      '부가세': vat,
      '입금명(업체명)': s.payer || s.company || '',
      '리셀러': resellerAmount,
      '정산금액': settlementAmount,
      '수수료': commission,
      '3.3금제': tax33,
      '실송제금': netRemittance,
      '작업방식': s.work || s.productName || '',
      '작업일수': days,
      '연장날짜': extensionDate,
      '업체명': s.company || '',
    };
  });

  // Sort by date (newest first)
  rows.sort((a, b) => {
    const da = a['일자'] || '';
    const db = b['일자'] || '';
    return db.localeCompare(da);
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);

  // Add number formatting for money columns
  const moneyColumns = ['D', 'E', 'G', 'H', 'I', 'J', 'K']; // 단가,부가세,리셀러,정산,수수료,3.3,실송
  // Set column format
  if (ws['!cols']) {
    moneyColumns.forEach((col, i) => {
      // format as number with comma
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, '매출보고');
}

/* ========= 고객 현황 시트 ========= */
export function exportClientsToExcel(data) {
  const wb = XLSX.utils.book_new();
  addClientSheet(wb, data);
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `고객현황_${today}.xlsx`);
}

function addClientSheet(wb, data) {
  const rows = data.clients.map(c => {
    const status = CLIENT_STATUS.find(s => s.value === c.status);
    const workType = WORK_TYPES.find(w => w.value === c.workType);
    const invoice = INVOICE_STATUS.find(i => i.value === c.invoiceStatus);
    const payment = PAYMENT_STATUS.find(p => p.value === c.paymentStatus);
    const latestRank = c.rankHistory?.length > 0 ? c.rankHistory[c.rankHistory.length - 1] : null;

    return {
      '업체명': c.name || '',
      '담당자': c.contactName || '',
      '연락처': c.contactPhone || '',
      '사업자번호': formatBizNumber(c.bizNumber) || '',
      '상태': status?.label || c.status || '',
      '상품(작업종류)': workType?.label || '',
      '상품명/키워드': c.product || '',
      '작업방법': c.method || '',
      '상품링크': c.link || '',
      '계약금액': c.amount || 0,
      '슬롯수량': c.slotQty || '',
      '슬롯일수': c.slotDays || '',
      '시작순위': c.startRank || '',
      '현재순위': latestRank?.rank || c.currentRank || '',
      '목표순위': c.targetRank || '',
      '시작일': c.startDate || '',
      '마감일': c.endDate || '',
      '입금상태': payment?.label || '',
      '계산서': invoice?.label || '',
      '계산서발행일': c.invoiceDate || '',
      '메모': c.memo || '',
      '등록일': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '고객현황');
}

/* ========= 업무 기록 시트 ========= */
export function exportTasksToExcel(data) {
  const wb = XLSX.utils.book_new();
  addTaskSheet(wb, data);
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `업무기록_${today}.xlsx`);
}

function addTaskSheet(wb, data) {
  const rows = data.tasks.map(t => ({
    '날짜': t.date || '',
    '업무내용': t.text || '',
    '관련고객': t.clientName || '',
    '우선순위': t.priority || '',
    '완료여부': t.done ? '✅ 완료' : '⬜ 미완료',
    '완료시간': t.completedAt ? new Date(t.completedAt).toLocaleString() : '',
    '메모': t.memo || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '업무기록');
}

/* ========= 매출 내역 시트 ========= */
export function exportRevenueToExcel(data) {
  const wb = XLSX.utils.book_new();
  addRevenueSheet(wb, data);
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `매출내역_${today}.xlsx`);
}

function addRevenueSheet(wb, data) {
  const rows = (data.revenue || []).map(r => ({
    '날짜': r.date || '',
    '고객명': r.clientName || '',
    '금액': r.amount || 0,
    '내용': r.description || '',
    '등록일': r.created ? new Date(r.created).toLocaleDateString() : '',
  }));

  // Add monthly summary
  const monthlyMap = {};
  (data.revenue || []).forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = 0;
    monthlyMap[key] += r.amount || 0;
  });

  const summaryRows = Object.entries(monthlyMap).sort().map(([month, total]) => ({
    '월': month,
    '총매출': total,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '매출내역');

  if (summaryRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(summaryRows);
    autoFitColumns(ws2, summaryRows);
    XLSX.utils.book_append_sheet(wb, ws2, '월별매출요약');
  }
}

/* ========= 슬롯 기록 시트 ========= */
function addSlotSheet(wb, data) {
  const rows = (data.slots || []).map(s => ({
    '날짜': s.date || '',
    '유형': s.typeLabel || s.type || '',
    '업체명': s.company || '',
    '상품명': s.productName || '',
    '원가': s.costPrice || '',
    '판매단가': s.sellPrice || '',
    '마진': (s.sellPrice && s.costPrice) ? s.sellPrice - s.costPrice : '',
    '양식내용': s.content || '',
    '등록일': s.created ? new Date(s.created).toLocaleString() : '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '슬롯기록');
}

/* ========= 일일 업무 일지 시트 ========= */
function addDailyLogSheet(wb, data) {
  const logs = data.dailyLogs || {};
  const rows = [];

  // Collect all dates from tasks
  const dateSet = new Set();
  data.tasks.forEach(t => { if (t.date) dateSet.add(t.date); });
  Object.keys(logs).forEach(d => dateSet.add(d));

  const dates = [...dateSet].sort().reverse();

  dates.forEach(date => {
    const dayTasks = data.tasks.filter(t => t.date === date);
    const done = dayTasks.filter(t => t.done);
    const undone = dayTasks.filter(t => !t.done);
    const log = logs[date] || {};

    rows.push({
      '날짜': date,
      '총 업무': dayTasks.length,
      '완료': done.length,
      '미완료': undone.length,
      '완료율': dayTasks.length > 0 ? Math.round((done.length / dayTasks.length) * 100) + '%' : '-',
      '완료 업무': done.map(t => t.text).join(' / ') || '-',
      '미완료 업무': undone.map(t => t.text).join(' / ') || '-',
      '일지 메모': log.memo || '',
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '일일업무일지');
}

/* ========= 순위 변동 시트 ========= */
function addRankHistorySheet(wb, data) {
  const rows = [];
  data.clients.forEach(c => {
    (c.rankHistory || []).forEach(r => {
      rows.push({
        '업체명': c.name,
        '상품': c.product || '',
        '날짜': r.date,
        '순위': r.rank,
        '메모': r.memo || '',
        '시작순위': c.startRank || '',
        '목표순위': c.targetRank || '',
      });
    });
  });

  rows.sort((a, b) => b['날짜'].localeCompare(a['날짜']));
  const ws = XLSX.utils.json_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, '순위변동');
}

/* ========= 열 너비 자동 맞춤 ========= */
function autoFitColumns(ws, data) {
  if (!data?.length) return;
  const colWidths = {};
  const keys = Object.keys(data[0]);

  keys.forEach(key => {
    const maxLen = Math.max(
      key.length * 2,
      ...data.map(row => String(row[key] || '').length)
    );
    colWidths[key] = Math.min(Math.max(maxLen + 2, 8), 50);
  });

  ws['!cols'] = keys.map(key => ({ wch: colWidths[key] }));
}
