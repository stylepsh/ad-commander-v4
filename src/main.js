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

/* ========== PIN GATE — 박성혁 전용 ========== */
const AUTH_KEY = 'adcommander_v4_auth';
const PIN_KEY = 'adcommander_v4_pin';
const AUTH_EXPIRY_DAYS = 30;
const DEFAULT_PIN = '0003'; // 기본 PIN (연락처 뒷 4자리)

function getPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function isAuthenticated() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (!auth) return false;
    const expiry = new Date(auth.expiry);
    if (expiry < new Date()) { localStorage.removeItem(AUTH_KEY); return false; }
    return true;
  } catch { return false; }
}

function setAuthenticated() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + AUTH_EXPIRY_DAYS);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ expiry: expiry.toISOString() }));
}

export function changePin(newPin) {
  if (newPin && newPin.length === 4 && /^\d{4}$/.test(newPin)) {
    localStorage.setItem(PIN_KEY, newPin);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

function renderPinScreen() {
  let entered = '';
  const appEl = document.getElementById('app');

  function updateDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      if (dot) {
        dot.style.background = i < entered.length ? 'var(--accent-blue)' : 'var(--bg-input)';
        dot.style.transform = i < entered.length ? 'scale(1.2)' : 'scale(1)';
        dot.style.boxShadow = i < entered.length ? '0 0 8px rgba(99,102,241,0.4)' : 'none';
      }
    }
  }

  function handleDigit(digit) {
    if (entered.length >= 4) return;
    entered += digit;
    updateDots();
    if (entered.length === 4) {
      setTimeout(() => {
        if (entered === getPin()) {
          setAuthenticated();
          bootApp();
        } else {
          const errEl = document.getElementById('pinError');
          if (errEl) { errEl.textContent = 'PIN이 올바르지 않습니다'; errEl.style.display = 'block'; }
          entered = '';
          updateDots();
          // Shake animation
          const dotsWrap = document.getElementById('pinDotsWrap');
          if (dotsWrap) { dotsWrap.style.animation = 'shake 0.4s ease'; setTimeout(() => dotsWrap.style.animation = '', 400); }
        }
      }, 150);
    }
  }

  appEl.innerHTML = `
    <style>
      @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      .pin-pad { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;margin:0 auto }
      .pin-key { width:100%;aspect-ratio:1.4;border-radius:16px;border:none;font-size:1.5rem;font-weight:700;cursor:pointer;transition:all 0.15s;
        background:var(--bg-card);color:var(--text-primary);box-shadow:0 2px 8px rgba(0,0,0,0.06) }
      .pin-key:active { transform:scale(0.92);background:var(--accent-blue);color:#fff }
      .pin-key.fn { font-size:1rem;font-weight:500;color:var(--text-muted);background:transparent;box-shadow:none }
      .pin-dot { width:16px;height:16px;border-radius:50%;transition:all 0.2s ease;border:2px solid var(--border-glass) }
    </style>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);padding:20px">
      <div style="width:100%;max-width:340px;text-align:center">
        <div style="font-size:3rem;margin-bottom:12px">${(() => {
          const h = new Date().getHours();
          if (h < 6) return '🌙';
          if (h < 9) return '🌅';
          if (h < 12) return '☀️';
          if (h < 18) return '⚡';
          if (h < 22) return '🌆';
          return '🌙';
        })()}</div>
        <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:6px;color:var(--text-primary);line-height:1.6">${(() => {
          const h = new Date().getHours();
          if (h < 6) return '늦은 시간까지 수고하세요<br>박성혁 팀장님 💪';
          if (h < 9) return '좋은 아침이에요!<br>박성혁 팀장님 ☀️';
          if (h < 12) return '고객지원팀 박성혁 팀장님<br>안녕하세요! 👋';
          if (h < 14) return '점심은 드셨나요?<br>박성혁 팀장님 🍚';
          if (h < 18) return '오늘도 힘내세요!<br>박성혁 팀장님 💪';
          if (h < 22) return '오늘 하루도 수고 많으셨어요<br>박성혁 팀장님 🌟';
          return '늦은 시간까지 수고하세요<br>박성혁 팀장님 💪';
        })()}</h1>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:24px">루멘트 광고관제 시스템</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:28px">PIN 4자리를 입력하세요</div>
        
        <div id="pinDotsWrap" style="display:flex;gap:16px;justify-content:center;margin-bottom:12px">
          <div class="pin-dot" id="pin-dot-0"></div>
          <div class="pin-dot" id="pin-dot-1"></div>
          <div class="pin-dot" id="pin-dot-2"></div>
          <div class="pin-dot" id="pin-dot-3"></div>
        </div>
        <div id="pinError" style="font-size:0.75rem;color:var(--accent-red);margin-bottom:20px;height:18px;display:none"></div>

        <div class="pin-pad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="pin-key" data-pin="${n}">${n}</button>`).join('')}
          <button class="pin-key fn" id="pinClear">지우기</button>
          <button class="pin-key" data-pin="0">0</button>
          <button class="pin-key fn" id="pinBackspace">←</button>
        </div>

        <div style="margin-top:28px;font-size:0.6rem;color:var(--text-muted)">© 루멘트 | 인가된 사용자만 접근 가능</div>
      </div>
    </div>
  `;

  // Bind pin pad events
  document.querySelectorAll('[data-pin]').forEach(el => {
    el.addEventListener('click', () => handleDigit(el.dataset.pin));
  });
  document.getElementById('pinBackspace')?.addEventListener('click', () => {
    entered = entered.slice(0, -1);
    updateDots();
    document.getElementById('pinError').style.display = 'none';
  });
  document.getElementById('pinClear')?.addEventListener('click', () => {
    entered = '';
    updateDots();
    document.getElementById('pinError').style.display = 'none';
  });

  // Keyboard support
  document.addEventListener('keydown', function pinKeyHandler(e) {
    if (isAuthenticated()) { document.removeEventListener('keydown', pinKeyHandler); return; }
    if (/^\d$/.test(e.key)) handleDigit(e.key);
    else if (e.key === 'Backspace') { entered = entered.slice(0, -1); updateDots(); }
  });
}

/* ========== BOOT APP ========== */
function bootApp() {
  initDarkMode();
  initKeyboardShortcuts({
    search: showGlobalSearch,
    undo: handleUndo,
    redo: handleRedo,
    closeModal: closeModal,
  });

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <div style="padding:20px">
      <div class="skeleton" style="height:48px;border-radius:12px;margin-bottom:16px"></div>
      <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>
      <div class="skeleton" style="height:120px;border-radius:12px;margin-bottom:12px"></div>
    </div>
  `;
  setTimeout(() => {
    render();
    const h = new Date().getHours();
    const greeting = h < 6 ? '새벽' : h < 12 ? '좋은 아침' : h < 18 ? '좋은 오후' : '수고했어요';
    showToast(`${greeting}! AD Commander V4.0 준비 완료 ⚡`, 'success', 2500);
  }, 120);
}

/* ========== INIT ========== */
if (isAuthenticated()) {
  bootApp();
} else {
  renderPinScreen();
}

// #41 PWA Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW failed:', err));
  });
}

