/* ========================================
   AD COMMANDER v4.0 — 광고대행사 관제탑
   50대 혁신 개선사항 적용
   지휘관 박성혁 전용 시스템
   ======================================== */
import './style.css';
import {
  loadData, saveData, SLOT_TYPES, formatMoney,
  undo, redo, canUndo, canRedo,
  showToast, initKeyboardShortcuts,
  getOverdueTasks, getUnpaidClients, getInvoiceMissing
} from './data.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderClients } from './pages/clients.js';
import { renderTasks } from './pages/tasks.js';
import { renderSlots } from './pages/slots.js';
import { renderReports } from './pages/reports.js';
import { renderSettings } from './pages/settings.js';

export let data = loadData();
export let currentPage = 'dashboard';
export let modalStack = [];

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

export function getApp() { return { data, currentPage, DAYS_KR, modalStack }; }
export function setData(d) { data = d; saveData(d); }
export function navigate(page) {
  currentPage = page;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========== #3 DARK MODE ========== */
function initDarkMode() {
  const saved = data.settings?.darkMode;
  if (saved) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function toggleDarkMode() {
  const isDark = document.documentElement.hasAttribute('data-theme');
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    data.settings.darkMode = false;
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    data.settings.darkMode = true;
  }
  saveData(data);
  showToast(data.settings.darkMode ? '🌙 다크모드 ON' : '☀️ 라이트모드 ON', 'info', 1500);
}

/* ========== MODAL SYSTEM ========== */
export function showModal(html) {
  modalStack.push(html);
  renderModal();
}

export function closeModal() {
  modalStack.pop();
  renderModal();
}

function renderModal() {
  let overlay = document.getElementById('modal-overlay');
  if (modalStack.length === 0) {
    if (overlay) {
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
    }
    return;
  }
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="modal-content">${modalStack[modalStack.length - 1]}</div>`;
  overlay.style.display = 'flex';

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelectorAll('[data-close-modal]').forEach(el =>
    el.addEventListener('click', () => closeModal())
  );
}

/* ========== GLOBAL SEARCH (#7) ========== */
function showGlobalSearch() {
  const modalHtml = `
    <div class="modal-header">
      <h3>🔍 전체 검색 <span class="kbd">Ctrl+K</span></h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <div class="ai-input-group">
        <input class="ai-input" id="globalSearchInput" placeholder="고객명, 키워드, 업체명, 담당자..." autofocus style="font-size:1rem" />
      </div>
      <div id="searchResults" style="margin-top:8px"></div>
    </div>
  `;
  showModal(modalHtml);

  setTimeout(() => {
    const input = document.getElementById('globalSearchInput');
    input?.focus();
    input?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (q.length < 1) {
        document.getElementById('searchResults').innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:0.82rem">검색어를 입력하세요</div>';
        return;
      }
      renderSearchResults(q);
    });
  }, 150);
}

function renderSearchResults(q) {
  const results = [];

  data.clients.forEach(c => {
    const match = [c.name, c.product, c.contactName, c.bizNumber, c.memo].filter(Boolean).join(' ').toLowerCase();
    if (match.includes(q)) {
      results.push({ type: '👥 고객', title: c.name, sub: [c.product, c.contactName].filter(Boolean).join(' · '), action: () => { closeModal(); navigate('clients'); } });
    }
  });

  (data.slots || []).forEach(s => {
    const match = [s.company, s.keyword, s.work, s.productName, s.manager, s.payer].filter(Boolean).join(' ').toLowerCase();
    if (match.includes(q)) {
      results.push({ type: '📋 슬롯', title: `${s.typeLabel || s.type} — ${s.company || '-'}`, sub: `${s.date || ''} · ${s.work || s.productName || ''}`, copyContent: s.content });
    }
  });

  data.tasks.forEach(t => {
    const match = [t.text, t.clientName, t.memo].filter(Boolean).join(' ').toLowerCase();
    if (match.includes(q)) {
      results.push({ type: t.done ? '✅ 완료' : '📝 업무', title: t.text, sub: [t.clientName, t.date].filter(Boolean).join(' · ') });
    }
  });

  (data.revenue || []).forEach(r => {
    const match = [r.clientName, r.description].filter(Boolean).join(' ').toLowerCase();
    if (match.includes(q)) {
      results.push({ type: '💰 매출', title: r.clientName || '-', sub: `${formatMoney(r.amount)}원 · ${r.date || ''}` });
    }
  });

  const el = document.getElementById('searchResults');
  if (results.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:0.82rem">검색 결과가 없습니다</div>';
    return;
  }

  el.innerHTML = `
    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px">${results.length}건 발견</div>
    ${results.slice(0, 20).map((r, i) => `
      <div class="search-result-item" data-sr="${i}" ${r.copyContent ? `data-copy-content="${i}"` : ''}>
        <span class="search-result-type">${r.type}</span>
        <div class="search-result-body">
          <div class="search-result-title">${r.title}</div>
          ${r.sub ? `<div class="search-result-sub">${r.sub}</div>` : ''}
        </div>
        ${r.copyContent ? '<span class="btn btn-sm btn-secondary" style="font-size:0.65rem">복사</span>' : ''}
      </div>
    `).join('')}
  `;

  el.querySelectorAll('[data-copy-content]').forEach(item => {
    item.addEventListener('click', (e) => {
      const idx = parseInt(item.dataset.copyContent);
      const r = results[idx];
      if (r?.copyContent) {
        navigator.clipboard.writeText(r.copyContent);
        showToast('📋 복사되었습니다!', 'success', 1500);
      }
    });
  });

  el.querySelectorAll('[data-sr]').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return;
      const idx = parseInt(item.dataset.sr);
      const r = results[idx];
      if (r?.action) r.action();
    });
  });
}

/* ========== #49 UNDO/REDO HANDLER ========== */
function handleUndo() {
  const prev = undo();
  if (prev) {
    data = prev;
    render();
    showToast('↩️ 실행 취소', 'info', 1500);
  }
}

function handleRedo() {
  const next = redo();
  if (next) {
    data = next;
    render();
    showToast('↪️ 다시 실행', 'info', 1500);
  }
}

/* ========== RENDER ========== */
export function render() {
  const app = document.getElementById('app');
  const pages = { dashboard: renderDashboard, clients: renderClients, tasks: renderTasks, slots: renderSlots, reports: renderReports, settings: renderSettings };
  const overdueTasks = getOverdueTasks(data);
  const unpaidClients = getUnpaidClients(data);
  const invoiceMissing = getInvoiceMissing(data);
  const alertCount = overdueTasks.length + unpaidClients.length + invoiceMissing.length;

  app.innerHTML = `
    <header class="app-header">
      <div class="app-logo"><div class="app-logo-icon">⚡</div><span>AD Commander</span><span style="font-size:0.55rem;color:var(--text-muted);font-weight:400;margin-left:4px">v4.0</span></div>
      <div class="header-actions">
        <button class="header-btn" id="globalSearchBtn" title="검색 (Ctrl+K)">🔍</button>
        <button class="header-btn" id="darkModeBtn" title="다크/라이트 모드">${data.settings?.darkMode ? '☀️' : '🌙'}</button>
        <button class="header-btn" id="undoBtn" title="실행 취소 (Ctrl+Z)" ${!canUndo() ? 'style="opacity:0.3"' : ''}>↩️</button>
      </div>
    </header>
    <main class="app-main">${pages[currentPage]()}</main>
    <nav class="bottom-nav">
      ${[
        { id: 'dashboard', icon: '🏠', label: '홈' },
        { id: 'clients', icon: '👥', label: '고객' },
        { id: 'tasks', icon: '✅', label: '업무', badge: overdueTasks.length || null },
        { id: 'slots', icon: '📋', label: '슬롯' },
        { id: 'reports', icon: '📊', label: '보고서' },
        { id: 'settings', icon: '⚙️', label: '설정', badge: alertCount > 0 ? alertCount : null },
      ].map(it => `
        <button class="nav-item ${currentPage === it.id ? 'active' : ''}" data-nav="${it.id}">
          <span class="nav-icon">${it.icon}</span>
          <span>${it.label}</span>
          ${it.badge ? `<span class="nav-badge">${it.badge > 9 ? '9+' : it.badge}</span>` : ''}
        </button>
      `).join('')}
    </nav>
  `;
  bindGlobalEvents();
}

function bindGlobalEvents() {
  document.querySelectorAll('[data-nav]').forEach(el =>
    el.addEventListener('click', () => navigate(el.dataset.nav))
  );
  document.querySelectorAll('[data-goto]').forEach(el =>
    el.addEventListener('click', () => navigate(el.dataset.goto))
  );
  document.getElementById('globalSearchBtn')?.addEventListener('click', () => showGlobalSearch());
  document.getElementById('darkModeBtn')?.addEventListener('click', () => {
    toggleDarkMode();
    render();
  });
  document.getElementById('undoBtn')?.addEventListener('click', () => handleUndo());
}

/* ========== INIT ========== */
initDarkMode();
initKeyboardShortcuts({
  search: showGlobalSearch,
  undo: handleUndo,
  redo: handleRedo,
  closeModal: closeModal,
});
render();

// Show startup notification
const h = new Date().getHours();
const greeting = h < 6 ? '새벽' : h < 12 ? '좋은 아침' : h < 18 ? '좋은 오후' : '수고했어요';
showToast(`${greeting}! AD Commander V4.0 준비 완료 ⚡`, 'success', 2500);
