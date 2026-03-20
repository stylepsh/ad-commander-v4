/* ========================================
   AD COMMANDER v3.0 — 광고대행사 관제탑 데이터 스토어
   고객지원팀장 박성혁 전용 시스템
   ======================================== */

const STORAGE_KEY = 'adcommander_v3_data';

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
  }
};

/* ========= DATA MANAGEMENT ========= */
const DEFAULT_DATA = {
  settings: {
    userName: '고객지원팀장 박성혁',
    companyName: '',
    notificationsEnabled: true,
    startDate: new Date().toISOString().split('T')[0],
    defaultSlotId: 'stylepsh',
    defaultSlotPw: '123456',
    defaultManager: '',
    defaultPayer: '',
  },
  clients: [],       // 고객 목록
  tasks: [],         // 할일/한일
  slots: [],         // 슬롯 기록
  revenue: [],       // 매출 기록
  reportHistory: [], // 보고서 기록
  dailyLogs: {},     // 일일 체크
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...saved,
        settings: { ...DEFAULT_DATA.settings, ...(saved.settings || {}) },
        clients: saved.clients || [],
        tasks: saved.tasks || [],
        slots: saved.slots || [],
        revenue: saved.revenue || [],
        reportHistory: saved.reportHistory || [],
      };
    }
  } catch (e) { console.error(e); }
  return { ...DEFAULT_DATA };
}

export function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
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

/* ========= FORMAT BUSINESS NUMBER ========= */
export function formatBizNumber(num) {
  if (!num) return '';
  const clean = num.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 10)}`;
}
