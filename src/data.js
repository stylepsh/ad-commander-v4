/* ========================================
   AD COMMANDER v4.0 — 광고대행사 관제탑 데이터 스토어
   50대 혁신 개선사항 적용
   고객지원팀장 박성혁 전용 시스템
   ======================================== */

const STORAGE_KEY = 'adcommander_v4_data';
const UNDO_KEY = 'adcommander_v4_undo';
const TRASH_KEY = 'adcommander_v4_trash';
const BACKUP_KEY = 'adcommander_v4_backup';
const MAX_UNDO = 30;
const TRASH_DAYS = 30;

/* ========= CLIENT STATUSES ========= */
export const CLIENT_STATUS = [
  { value: 'lead', label: '상담중', color: '#f59e0b', emoji: '💬' },
  { value: 'proposal', label: '제안서', color: '#818cf8', emoji: '📄' },
  { value: 'contract', label: '계약완료', color: '#22c55e', emoji: '✅' },
  { value: 'active', label: '진행중', color: '#06b6d4', emoji: '🔄' },
  { value: 'paused', label: '일시중지', color: '#64748b', emoji: '⏸️' },
  { value: 'completed', label: '완료', color: '#a855f7', emoji: '🏁' },
  { value: 'churned', label: '해지', color: '#ef4444', emoji: '❌' },
];

/* ========= WORK TYPES (상품 종류) ========= */
export const WORK_TYPES = [
  { value: 'smartstore_rank', label: '스마트스토어 순위', emoji: '🟢', platform: 'naver' },
  { value: 'smartstore_traffic', label: '스마트스토어 트래픽', emoji: '📊', platform: 'naver' },
  { value: 'coupang_rank', label: '쿠팡 순위', emoji: '🟠', platform: 'coupang' },
  { value: 'coupang_traffic', label: '쿠팡 트래픽', emoji: '📈', platform: 'coupang' },
  { value: 'place', label: '플레이스 순위', emoji: '📍', platform: 'naver' },
  { value: 'blog', label: '블로그 배포', emoji: '📝', platform: 'naver' },
  { value: 'autocomplete', label: '자동완성', emoji: '🔍', platform: 'naver' },
  { value: 'review', label: '체험단/리뷰', emoji: '⭐', platform: 'all' },
  { value: 'zzim', label: '찜하기', emoji: '❤️', platform: 'all' },
  { value: 'viral', label: '바이럴 마케팅', emoji: '🔥', platform: 'all' },
  { value: 'kakaopf', label: '카카오 플친', emoji: '💬', platform: 'kakao' },
  { value: 'other', label: '기타', emoji: '📦', platform: 'all' },
];

/* ========= WORK METHODS (작업 방법) ========= */
export const WORK_METHODS = [
  { value: 'soboru_plus', label: '소보루 플러스' },
  { value: 'soboru_ai', label: '소보루 AI' },
  { value: 'manual', label: '수동 작업' },
  { value: 'traffic_bot', label: '트래픽 봇' },
  { value: 'blog_deploy', label: '블로그 배포' },
  { value: 'review_team', label: '체험단 모집' },
  { value: 'other', label: '기타' },
];

/* ========= SLOT TYPES ========= */
export const SLOT_TYPES = [
  { value: 'new', label: '신규', emoji: '🆕' },
  { value: 'extend', label: '연장', emoji: '🔄' },
  { value: 'add', label: '기존업체추가', emoji: '➕' },
  { value: 'refund', label: '환불', emoji: '💸' },
  { value: 'freetest', label: '무료테스트', emoji: '🎁' },
];

/* ========= TASK PRIORITIES ========= */
export const TASK_PRIORITIES = [
  { value: 'urgent', label: '🔴 긴급', color: '#ef4444' },
  { value: 'high', label: '🟠 높음', color: '#f59e0b' },
  { value: 'medium', label: '🟡 보통', color: '#eab308' },
  { value: 'low', label: '🟢 낮음', color: '#22c55e' },
];

/* ========= INVOICE STATUS (계산서 상태) ========= */
export const INVOICE_STATUS = [
  { value: 'none', label: '미발행', color: '#64748b', emoji: '⬜' },
  { value: 'pending', label: '발행대기', color: '#f59e0b', emoji: '🟡' },
  { value: 'issued', label: '발행완료', color: '#22c55e', emoji: '✅' },
];

/* ========= PAYMENT STATUS (입금 상태) ========= */
export const PAYMENT_STATUS = [
  { value: 'unpaid', label: '미입금', color: '#ef4444', emoji: '❌' },
  { value: 'partial', label: '부분입금', color: '#f59e0b', emoji: '🟡' },
  { value: 'paid', label: '입금완료', color: '#22c55e', emoji: '✅' },
];

/* ========= REPORT TEMPLATES ========= */
export const REPORT_TEMPLATES = {
  daily: {
    label: '📊 일일 보고',
    template: (client, work) => {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const latestRank = client.rankHistory?.length > 0 ? client.rankHistory[client.rankHistory.length - 1] : null;
      return `[${mm}.${dd} 일일 보고]\n\n업체명: ${client.name}\n상품: ${client.product || '-'}\n\n📊 오늘 작업 내역\n${work || '- 작업 진행중'}\n\n📈 현재 순위: ${latestRank ? latestRank.rank + '위' : (client.currentRank ? client.currentRank + '위' : '확인중')}\n🎯 목표 순위: ${client.targetRank ? client.targetRank + '위' : '-'}\n\n💬 비고: 정상 진행중입니다.\n\n감사합니다.\n고객지원팀장 박성혁`;
    }
  },
  weekly: {
    label: '📈 주간 보고',
    template: (client) => {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const ranks = client.rankHistory || [];
      const last7 = ranks.slice(-7);
      return `[${mm}.${dd} 주간 보고]\n\n업체명: ${client.name}\n상품: ${client.product || '-'}\n\n📊 주간 순위 변동\n${last7.length > 0 ? last7.map(r => `  ${r.date}: ${r.rank}위${r.memo ? ' (' + r.memo + ')' : ''}`).join('\n') : '- 기록 없음'}\n\n📈 순위 변동\n- 시작: ${client.startRank || '-'}위\n- 현재: ${client.currentRank || '-'}위\n- 목표: ${client.targetRank || '-'}위\n\n✅ 다음 주 계획\n- 기존 작업 유지\n\n감사합니다.\n고객지원팀장 박성혁`;
    }
  },
  completion: {
    label: '🏁 완료 보고',
    template: (client) => {
      return `[작업 완료 보고]\n\n업체명: ${client.name}\n상품: ${client.product || '-'}\n\n📊 최종 결과\n- 시작 순위: ${client.startRank || '-'}위\n- 최종 순위: ${client.currentRank || '-'}위\n\n✅ 작업 기간: ${client.startDate || '-'} ~ ${client.endDate || '-'}\n\n감사합니다. 연장 문의는 언제든지 말씀해주세요!\n고객지원팀장 박성혁`;
    }
  },
  extend_notice: {
    label: '🔄 연장 안내',
    template: (client) => {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `[${mm}.${dd} 연장 안내]\n\n안녕하세요. 고객지원팀장 박성혁입니다.\n\n업체명: ${client.name}\n상품: ${client.product || '-'}\n\n현재 진행 중인 작업이 곧 마감 예정입니다.\n마감일: ${client.endDate || '-'}\n\n📊 현재 성과\n- 현재 순위: ${client.currentRank || '-'}위\n- 목표 순위: ${client.targetRank || '-'}위\n\n연장을 희망하시면 말씀해 주세요!\n지속적인 순위 유지를 위해 연장을 추천드립니다.\n\n감사합니다.\n고객지원팀장 박성혁`;
    }
  }
};

/* ========= DATA MANAGEMENT ========= */
const DEFAULT_DATA = {
  settings: {
    userName: '고객지원팀장 박성혁',
    companyName: '',
    notificationsEnabled: true,
    darkMode: false,
    startDate: new Date().toISOString().split('T')[0],
    defaultSlotId: 'stylepsh',
    defaultSlotPw: '123456',
    defaultManager: '',
    defaultPayer: '',
    pinCode: '',
    autoBackup: true,
    widgetOrder: ['kpi', 'tasks', 'slots', 'clients', 'quickActions'],
  },
  clients: [],
  tasks: [],
  slots: [],
  revenue: [],
  reportHistory: [],
  dailyLogs: {},
  csTickets: [],
  accountHistory: [],
};

/* ========= #49 UNDO/REDO SYSTEM ========= */
let undoStack = [];
let redoStack = [];

function pushUndo(data) {
  try {
    undoStack.push(JSON.stringify(data));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  } catch (e) { /* quota exceeded */ }
}

export function undo() {
  if (undoStack.length === 0) return null;
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) redoStack.push(current);
  const prev = undoStack.pop();
  localStorage.setItem(STORAGE_KEY, prev);
  return JSON.parse(prev);
}

export function redo() {
  if (redoStack.length === 0) return null;
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) undoStack.push(current);
  const next = redoStack.pop();
  localStorage.setItem(STORAGE_KEY, next);
  return JSON.parse(next);
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }

/* ========= #50 TRASH SYSTEM ========= */
export function getTrash() {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
}

export function moveToTrash(type, item) {
  const trash = getTrash();
  trash.push({ type, item, deletedAt: new Date().toISOString() });
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
}

export function restoreFromTrash(index) {
  const trash = getTrash();
  if (index < 0 || index >= trash.length) return null;
  const restored = trash.splice(index, 1)[0];
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  return restored;
}

export function cleanTrash() {
  const trash = getTrash();
  const cutoff = Date.now() - (TRASH_DAYS * 24 * 60 * 60 * 1000);
  const cleaned = trash.filter(t => new Date(t.deletedAt).getTime() > cutoff);
  localStorage.setItem(TRASH_KEY, JSON.stringify(cleaned));
}

/* ========= DATA LOAD / SAVE ========= */
export function loadData() {
  cleanTrash();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return deepMerge(DEFAULT_DATA, saved);
    }
    // Try v3 migration
    const v3 = localStorage.getItem('adcommander_v3_data');
    if (v3) {
      const saved = JSON.parse(v3);
      const migrated = deepMerge(DEFAULT_DATA, saved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) { console.error('Load error:', e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (key === 'settings') {
      result.settings = { ...defaults.settings, ...(saved.settings || {}) };
    } else if (Array.isArray(defaults[key])) {
      result[key] = saved[key] || [];
    } else if (typeof defaults[key] === 'object' && defaults[key] !== null) {
      result[key] = { ...defaults[key], ...(saved[key] || {}) };
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

export function saveData(d) {
  pushUndo(d);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  // #38 Auto backup snapshot (daily)
  if (d.settings?.autoBackup) {
    autoBackupCheck(d);
  }
}

/* ========= #38 AUTO BACKUP ========= */
function autoBackupCheck(d) {
  try {
    const lastBackup = localStorage.getItem(BACKUP_KEY + '_last');
    const today = getToday();
    if (lastBackup !== today) {
      localStorage.setItem(BACKUP_KEY + '_' + today, JSON.stringify(d));
      localStorage.setItem(BACKUP_KEY + '_last', today);
      // Keep only last 7 backups
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(BACKUP_KEY + '_2')) keys.push(k);
      }
      keys.sort();
      while (keys.length > 7) {
        localStorage.removeItem(keys.shift());
      }
    }
  } catch (e) { /* quota exceeded, skip */ }
}

export function getBackupList() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(BACKUP_KEY + '_2')) keys.push(k.replace(BACKUP_KEY + '_', ''));
  }
  return keys.sort().reverse();
}

export function restoreBackup(date) {
  const raw = localStorage.getItem(BACKUP_KEY + '_' + date);
  if (raw) {
    localStorage.setItem(STORAGE_KEY, raw);
    return JSON.parse(raw);
  }
  return null;
}

/* ========= UTILITY FUNCTIONS ========= */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
}

export function formatMoney(num) {
  if (!num) return '0';
  return Number(num).toLocaleString();
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

/* ========= CLIENT HELPERS ========= */
export function getActiveClients(data) {
  return data.clients.filter(c => ['contract', 'active'].includes(c.status));
}

export function getTodayTasks(data) {
  const today = getToday();
  return data.tasks.filter(t => t.date === today);
}

export function getOverdueTasks(data) {
  const today = getToday();
  return data.tasks.filter(t => !t.done && t.date && t.date < today);
}

export function getRevenueThisMonth(data) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return data.revenue.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).reduce((sum, r) => sum + (r.amount || 0), 0);
}

/* ========= #37 미수금 현황 ========= */
export function getUnpaidTotal(data) {
  return data.clients
    .filter(c => c.paymentStatus !== 'paid' && c.amount > 0 && !['churned', 'completed'].includes(c.status))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
}

export function getUnpaidClients(data) {
  return data.clients.filter(c =>
    c.paymentStatus !== 'paid' && c.amount > 0 && !['churned', 'completed'].includes(c.status)
  );
}

/* ========= #24 계산서 미발행 트래킹 ========= */
export function getInvoiceMissing(data) {
  return data.clients.filter(c =>
    c.paymentStatus === 'paid' && c.invoiceStatus !== 'issued' && c.amount > 0
  );
}

/* ========= #25 이탈 위험 고객 ========= */
export function getChurnRiskClients(data) {
  const now = new Date();
  return data.clients.filter(c => {
    if (['churned', 'completed'].includes(c.status)) return false;
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    const daysPast = Math.ceil((now - end) / (1000 * 60 * 60 * 24));
    // 마감일이 14일 이상 지나고 연장되지 않은 고객
    return daysPast > 14;
  });
}

/* ========= #17 마진 실시간 분석 ========= */
export function calculateSlotMargin(slot) {
  const cost = slot.costPrice || 0;
  const sell = slot.sellPrice || 0;
  const qty = slot.qty || 1;
  const resellerAmount = cost * qty;
  const settlementAmount = sell * qty;
  const margin = settlementAmount - resellerAmount;
  const marginRate = settlementAmount > 0 ? Math.round((margin / settlementAmount) * 100) : 0;
  const vat = Math.round(sell * 0.1);
  const tax33 = Math.round(settlementAmount * 0.033);
  const netRemittance = settlementAmount - tax33;
  return { resellerAmount, settlementAmount, margin, marginRate, vat, tax33, netRemittance };
}

/* ========= #40 목표 순위 도달률 ========= */
export function getSuccessRate(data) {
  const eligible = data.clients.filter(c => c.targetRank && c.currentRank);
  if (eligible.length === 0) return { rate: 0, reached: 0, total: 0 };
  const reached = eligible.filter(c => c.currentRank <= c.targetRank).length;
  return { rate: Math.round((reached / eligible.length) * 100), reached, total: eligible.length };
}

/* ========= #32 수익 기여 상품 분석 ========= */
export function getRevenueByProduct(data) {
  const map = {};
  (data.slots || []).forEach(s => {
    const key = s.productName || s.work || '기타';
    if (!map[key]) map[key] = { name: key, totalMargin: 0, count: 0 };
    const m = calculateSlotMargin(s);
    map[key].totalMargin += m.margin;
    map[key].count++;
  });
  return Object.values(map).sort((a, b) => b.totalMargin - a.totalMargin);
}

/* ========= #33 담당자별 퍼포먼스 ========= */
export function getPerformanceByManager(data) {
  const map = {};
  (data.slots || []).forEach(s => {
    const mgr = s.manager || '미지정';
    if (!map[mgr]) map[mgr] = { name: mgr, count: 0, totalSell: 0, totalMargin: 0 };
    const m = calculateSlotMargin(s);
    map[mgr].count++;
    map[mgr].totalSell += m.settlementAmount;
    map[mgr].totalMargin += m.margin;
  });
  return Object.values(map).sort((a, b) => b.totalMargin - a.totalMargin);
}

/* ========= FORMAT BUSINESS NUMBER ========= */
export function formatBizNumber(num) {
  if (!num) return '';
  const clean = num.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 10)}`;
}

/* ========= #9 TOAST NOTIFICATION SYSTEM ========= */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ========= #15 URL 자동 파싱 ========= */
export function parseProductUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.includes('smartstore.naver.com')) {
      const parts = u.pathname.split('/');
      return { platform: 'naver', storeName: parts[1] || '', productId: parts[2] || '' };
    }
    if (host.includes('coupang.com')) {
      const match = u.pathname.match(/products\/(\d+)/);
      return { platform: 'coupang', productId: match?.[1] || '' };
    }
    return { platform: 'unknown', url };
  } catch (e) {
    return null;
  }
}

/* ========= #7 KEYBOARD SHORTCUTS ========= */
export function initKeyboardShortcuts(callbacks) {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K → Global search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      callbacks.search?.();
    }
    // Cmd/Ctrl + Z → Undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      callbacks.undo?.();
    }
    // Cmd/Ctrl + Shift + Z → Redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      callbacks.redo?.();
    }
    // Escape → Close modal
    if (e.key === 'Escape') {
      callbacks.closeModal?.();
    }
  });
}
