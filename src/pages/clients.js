/* ========================================
   Clients — 고객 관리 페이지
   상품선택, 사업자번호, 순위기록, 계산서, 광고이력 등
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal } from '../main.js';
import {
  CLIENT_STATUS, WORK_TYPES, WORK_METHODS,
  INVOICE_STATUS, PAYMENT_STATUS,
  generateId, formatDate, formatMoney, getDaysUntil, formatBizNumber, getToday
} from '../data.js';
import { renderRankChart } from '../chart.js';
import { generateQuotePDF, generateReportPDF } from '../pdf.js';

let filterStatus = 'all';
let searchQuery = '';

export function renderClients() {
  const { data } = getApp();
  let clients = [...data.clients];

  // Filter
  if (filterStatus !== 'all') {
    clients = clients.filter(c => c.status === filterStatus);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    clients = clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.product || '').toLowerCase().includes(q) ||
      (c.contactName || '').toLowerCase().includes(q) ||
      (c.bizNumber || '').includes(q)
    );
  }

  // Sort: active first
  const order = ['active', 'contract', 'lead', 'proposal', 'paused', 'completed', 'churned'];
  clients.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  const statusCounts = {};
  CLIENT_STATUS.forEach(s => {
    statusCounts[s.value] = data.clients.filter(c => c.status === s.value).length;
  });

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">👥</div>
      <div style="font-size:1.1rem;font-weight:700">고객 관리</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">고객정보 · 상품선택 · 순위기록 · 계산서 · 광고이력</div>
    </div>

    <!-- Search -->
    <div class="ai-input-group fade-in">
      <input class="ai-input" id="clientSearch" placeholder="🔍 고객명 / 상품명 / 사업자번호 검색..." value="${searchQuery}" />
    </div>

    <!-- Status Filter -->
    <div class="status-filter fade-in">
      <button class="filter-chip ${filterStatus === 'all' ? 'active' : ''}" data-filter="all">전체 ${data.clients.length}</button>
      ${CLIENT_STATUS.map(s => `
        <button class="filter-chip ${filterStatus === s.value ? 'active' : ''}" data-filter="${s.value}" style="${filterStatus === s.value ? `background:${s.color}20;border-color:${s.color}` : ''}">
          ${s.emoji} ${s.label} ${statusCounts[s.value] || 0}
        </button>
      `).join('')}
    </div>

    <!-- Add Button -->
    <button class="btn btn-primary btn-full fade-in" id="addClient" style="margin-bottom:20px">
      ➕ 새 고객 등록
    </button>

    <!-- Client List -->
    ${clients.length > 0 ? `
      <div class="stagger">
        ${clients.map(c => {
          const status = CLIENT_STATUS.find(s => s.value === c.status) || CLIENT_STATUS[0];
          const daysLeft = getDaysUntil(c.endDate);
          const workType = WORK_TYPES.find(w => w.value === c.workType);
          const latestRank = c.rankHistory?.length > 0 ? c.rankHistory[c.rankHistory.length - 1] : null;
          const invoiceStatus = INVOICE_STATUS.find(i => i.value === c.invoiceStatus) || INVOICE_STATUS[0];
          const payStatus = PAYMENT_STATUS.find(p => p.value === c.paymentStatus) || PAYMENT_STATUS[0];

          return `
            <div class="client-card fade-in" data-view-client="${c.id}">
              <div class="client-card-header">
                <div class="client-card-name">${c.name}</div>
                <span class="status-badge" style="background:${status.color}20;color:${status.color}">${status.emoji} ${status.label}</span>
              </div>
              ${c.product ? `<div class="client-card-product">${c.product}</div>` : ''}
              <div class="client-card-meta">
                ${workType ? `<span class="meta-tag">${workType.emoji} ${workType.label}</span>` : ''}
                ${c.amount ? `<span class="meta-tag">💰 ${formatMoney(c.amount)}원</span>` : ''}
                ${latestRank ? `<span class="meta-tag">📊 ${latestRank.rank}위</span>` : ''}
                <span class="meta-tag" style="background:${payStatus.color}15;color:${payStatus.color}">${payStatus.emoji} ${payStatus.label}</span>
                <span class="meta-tag" style="background:${invoiceStatus.color}15;color:${invoiceStatus.color}">🧾 ${invoiceStatus.label}</span>
                ${daysLeft !== null && daysLeft >= 0 && c.status !== 'completed' && c.status !== 'churned' ? `<span class="meta-tag ${daysLeft <= 3 ? 'urgent' : ''}">${daysLeft === 0 ? '⚠️ 오늘 마감' : `📅 ${daysLeft}일`}</span>` : ''}
              </div>
              ${c.contactName || c.bizNumber ? `
                <div class="client-card-memo">
                  ${c.contactName ? `👤 ${c.contactName}` : ''} ${c.bizNumber ? `· 📋 ${formatBizNumber(c.bizNumber)}` : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px">📭</div>
        <div>등록된 고객이 없습니다</div>
        <div style="font-size:0.8rem;margin-top:4px">위의 '새 고객 등록' 버튼을 눌러주세요</div>
      </div>
    `}
  `;

  setTimeout(bindClientEvents, 50);
  return html;
}

function bindClientEvents() {
  const { data } = getApp();

  document.getElementById('clientSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    navigate('clients');
  });

  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      filterStatus = el.dataset.filter;
      navigate('clients');
    });
  });

  document.getElementById('addClient')?.addEventListener('click', () => {
    showClientForm();
  });

  document.querySelectorAll('[data-view-client]').forEach(el => {
    el.addEventListener('click', () => {
      const client = data.clients.find(c => c.id === el.dataset.viewClient);
      if (client) showClientDetail(client);
    });
  });
}

/* ========== CLIENT DETAIL (상세 보기) ========== */
function showClientDetail(c) {
  const { data } = getApp();
  const status = CLIENT_STATUS.find(s => s.value === c.status) || CLIENT_STATUS[0];
  const workType = WORK_TYPES.find(w => w.value === c.workType);
  const method = WORK_METHODS.find(m => m.value === c.method);
  const invoiceStatus = INVOICE_STATUS.find(i => i.value === c.invoiceStatus) || INVOICE_STATUS[0];
  const payStatus = PAYMENT_STATUS.find(p => p.value === c.paymentStatus) || PAYMENT_STATUS[0];
  const rankHistory = c.rankHistory || [];
  const campaigns = c.campaigns || [];

  // Build unified timeline
  const timeline = [];
  rankHistory.forEach(r => timeline.push({ date: r.date, type: 'rank', text: `순위 ${r.rank}위`, sub: r.memo || '' }));
  campaigns.forEach(cp => timeline.push({ date: cp.date, type: 'campaign', text: cp.description, sub: cp.amount ? `${formatMoney(cp.amount)}원` : '' }));

  // Find slots for this client
  const clientSlots = (data.slots || []).filter(s =>
    s.company && c.name && s.company.toLowerCase().includes(c.name.toLowerCase())
  );
  clientSlots.forEach(s => timeline.push({
    date: s.date || '',
    type: 'slot',
    text: `${s.typeLabel || s.type} — ${s.work || s.productName || ''}`,
    sub: s.keyword || '',
    copyContent: s.content,
  }));

  // Find revenue for this client
  (data.revenue || []).filter(r => r.clientName && c.name && r.clientName.includes(c.name))
    .forEach(r => timeline.push({ date: r.date, type: 'revenue', text: `입금 ${formatMoney(r.amount)}원`, sub: r.description || '' }));

  timeline.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const modalHtml = `
    <div class="modal-header">
      <h3>${c.name}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <!-- Status & Basic -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
        <span class="status-badge" style="background:${status.color}20;color:${status.color}">${status.emoji} ${status.label}</span>
        ${workType ? `<span class="meta-tag">${workType.emoji} ${workType.label}</span>` : ''}
        ${method ? `<span class="meta-tag">${method.label}</span>` : ''}
      </div>

      <!-- Client Info -->
      <div class="detail-section">
        <div class="detail-title">📋 고객 정보</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">업체명</span><span>${c.name}</span></div>
          ${c.product ? `<div class="detail-item"><span class="detail-label">상품</span><span>${c.product}</span></div>` : ''}
          ${c.contactName ? `<div class="detail-item"><span class="detail-label">담당자</span><span>${c.contactName}</span></div>` : ''}
          ${c.contactPhone ? `<div class="detail-item"><span class="detail-label">연락처</span><span>${c.contactPhone}</span></div>` : ''}
          ${c.bizNumber ? `<div class="detail-item"><span class="detail-label">사업자번호</span><span>${formatBizNumber(c.bizNumber)}</span></div>` : ''}
          ${c.link ? `<div class="detail-item"><span class="detail-label">상품 링크</span><a href="${c.link}" target="_blank" style="color:var(--accent-blue-light);font-size:0.8rem;word-break:break-all">열기 ↗</a></div>` : ''}
        </div>
      </div>

      <!-- Financial -->
      <div class="detail-section">
        <div class="detail-title">💰 금액 & 계산서</div>
        <div class="detail-grid">
          ${c.amount ? `<div class="detail-item"><span class="detail-label">계약금액</span><span style="font-weight:700;color:var(--accent-orange)">${formatMoney(c.amount)}원</span></div>` : ''}
          <div class="detail-item"><span class="detail-label">입금상태</span><span style="color:${payStatus.color}">${payStatus.emoji} ${payStatus.label}</span></div>
          <div class="detail-item"><span class="detail-label">계산서</span><span style="color:${invoiceStatus.color}">🧾 ${invoiceStatus.label}</span></div>
          ${c.invoiceDate ? `<div class="detail-item"><span class="detail-label">발행일</span><span>${c.invoiceDate}</span></div>` : ''}
        </div>
      </div>

      <!-- Dates -->
      <div class="detail-section">
        <div class="detail-title">📅 기간</div>
        <div class="detail-grid">
          ${c.startDate ? `<div class="detail-item"><span class="detail-label">시작일</span><span>${c.startDate}</span></div>` : ''}
          ${c.endDate ? `<div class="detail-item"><span class="detail-label">마감일</span><span>${c.endDate}</span></div>` : ''}
          ${c.slotQty ? `<div class="detail-item"><span class="detail-label">슬롯 수량</span><span>${c.slotQty}개</span></div>` : ''}
          ${c.slotDays ? `<div class="detail-item"><span class="detail-label">슬롯 일수</span><span>${c.slotDays}일</span></div>` : ''}
        </div>
      </div>

      <!-- Rank Chart -->
      ${rankHistory.length >= 2 ? `
        <div class="detail-section" style="padding:8px">
          <canvas id="rankChartCanvas" style="width:100%;height:180px"></canvas>
        </div>
      ` : ''}

      <!-- Rank History -->
      <div class="detail-section">
        <div class="detail-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>📊 순위 기록</span>
          <button class="btn btn-sm btn-secondary" id="addRankRecord">+ 기록 추가</button>
        </div>
        ${c.targetRank ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">🎯 목표: ${c.targetRank}위 ${c.startRank ? `| 시작: ${c.startRank}위` : ''}</div>` : ''}
        ${rankHistory.length > 0 ? `
          <div class="rank-list">
            ${rankHistory.slice().reverse().map(r => `
              <div class="rank-item">
                <span class="rank-date">${r.date}</span>
                <span class="rank-value">${r.rank}위</span>
                ${r.memo ? `<span class="rank-memo">${r.memo}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<div style="font-size:0.8rem;color:var(--text-muted);padding:12px 0">순위 기록이 없습니다</div>'}
      </div>

      <!-- Campaign History (광고 진행 이력) -->
      <div class="detail-section">
        <div class="detail-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>📜 광고 진행 이력</span>
          <button class="btn btn-sm btn-secondary" id="addCampaign">+ 이력 추가</button>
        </div>
        ${campaigns.length > 0 ? `
          <div class="rank-list">
            ${campaigns.slice().reverse().map(cp => `
              <div class="rank-item">
                <span class="rank-date">${cp.date}</span>
                <span style="font-size:0.82rem;flex:1">${cp.description}</span>
                ${cp.amount ? `<span style="font-size:0.78rem;color:var(--accent-orange)">${formatMoney(cp.amount)}원</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<div style="font-size:0.8rem;color:var(--text-muted);padding:12px 0">진행 이력이 없습니다</div>'}
      </div>

      <!-- Memo -->
      ${c.memo ? `
        <div class="detail-section">
          <div class="detail-title">📝 메모</div>
          <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${c.memo}</div>
        </div>
      ` : ''}

      <!-- Unified Timeline -->
      ${timeline.length > 0 ? `
        <div class="detail-section">
          <div class="detail-title">📜 전체 활동 기록 (${timeline.length}건)</div>
          <div class="timeline" style="max-height:250px;overflow-y:auto">
            ${timeline.slice(0, 30).map(t => `
              <div class="timeline-item ${t.type}">
                <div class="timeline-date">${t.date || '-'}</div>
                <div class="timeline-text">${t.type === 'slot' ? '📋' : t.type === 'rank' ? '📊' : t.type === 'revenue' ? '💰' : '📜'} ${t.text}</div>
                ${t.sub ? `<div class="timeline-sub">${t.sub}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- PDF & Actions -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">
        <button class="btn btn-secondary btn-full" id="genQuotePDF">📄 견적서 PDF</button>
        <button class="btn btn-secondary btn-full" id="genReportPDF">📊 보고서 PDF</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <button class="btn btn-primary btn-full" id="editClientBtn">✏️ 수정</button>
        <button class="btn btn-secondary btn-full" id="deleteClientBtn" style="color:var(--accent-red)">🗑️ 삭제</button>
      </div>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    const { data } = getApp();

    // Render rank chart
    if (rankHistory.length >= 2) {
      renderRankChart('rankChartCanvas', rankHistory, c.targetRank);
    }

    // PDF Buttons
    document.getElementById('genQuotePDF')?.addEventListener('click', () => {
      generateQuotePDF(c, data.settings);
    });

    document.getElementById('genReportPDF')?.addEventListener('click', () => {
      const latestWork = data.tasks
        .filter(t => t.clientId === c.id && t.done)
        .slice(-5)
        .map(t => `- ${t.text}`)
        .join('\n') || '- Working in progress';
      generateReportPDF(c, latestWork, data.settings);
    });

    // Edit
    document.getElementById('editClientBtn')?.addEventListener('click', () => {
      closeModal();
      setTimeout(() => showClientForm(c), 200);
    });

    // Delete
    document.getElementById('deleteClientBtn')?.addEventListener('click', () => {
      if (confirm(`"${c.name}" 고객을 삭제하시겠습니까?`)) {
        data.clients = data.clients.filter(x => x.id !== c.id);
        setData(data);
        closeModal();
        navigate('clients');
      }
    });

    // Add Rank Record
    document.getElementById('addRankRecord')?.addEventListener('click', () => {
      closeModal();
      setTimeout(() => showRankForm(c), 200);
    });

    // Add Campaign
    document.getElementById('addCampaign')?.addEventListener('click', () => {
      closeModal();
      setTimeout(() => showCampaignForm(c), 200);
    });
  }, 100);
}

/* ========== RANK RECORD FORM ========== */
function showRankForm(client) {
  const today = getToday();
  const modalHtml = `
    <div class="modal-header">
      <h3>📊 순위 기록 — ${client.name}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <div class="ai-input-group">
        <label class="ai-label">날짜</label>
        <input class="ai-input" id="rk_date" type="date" value="${today}" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">순위</label>
        <input class="ai-input" id="rk_rank" type="number" placeholder="예: 15" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">메모 (선택)</label>
        <input class="ai-input" id="rk_memo" placeholder="예: 트래픽 증가 후 상승" />
      </div>
      <button class="btn btn-primary btn-full" id="rk_save">💾 순위 기록 저장</button>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    document.getElementById('rk_save')?.addEventListener('click', () => {
      const { data } = getApp();
      const rank = parseInt(document.getElementById('rk_rank').value);
      if (!rank) { alert('순위를 입력해주세요'); return; }

      const c = data.clients.find(x => x.id === client.id);
      if (!c) return;

      if (!c.rankHistory) c.rankHistory = [];
      c.rankHistory.push({
        date: document.getElementById('rk_date').value,
        rank,
        memo: document.getElementById('rk_memo').value.trim(),
      });
      c.currentRank = rank;
      setData(data);
      closeModal();
      setTimeout(() => showClientDetail(c), 200);
    });
  }, 100);
}

/* ========== CAMPAIGN HISTORY FORM ========== */
function showCampaignForm(client) {
  const today = getToday();
  const modalHtml = `
    <div class="modal-header">
      <h3>📜 광고 이력 — ${client.name}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <div class="ai-input-group">
        <label class="ai-label">날짜</label>
        <input class="ai-input" id="cp_date" type="date" value="${today}" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">진행 내용</label>
        <input class="ai-input" id="cp_desc" placeholder="예: 스마트스토어 트래픽 10일 진행" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">금액 (선택)</label>
        <input class="ai-input" id="cp_amount" type="number" placeholder="예: 300000" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">비고 (선택)</label>
        <input class="ai-input" id="cp_memo" placeholder="예: 키워드 3개 동시 진행" />
      </div>
      <button class="btn btn-primary btn-full" id="cp_save">💾 이력 저장</button>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    document.getElementById('cp_save')?.addEventListener('click', () => {
      const { data } = getApp();
      const desc = document.getElementById('cp_desc').value.trim();
      if (!desc) { alert('진행 내용을 입력해주세요'); return; }

      const c = data.clients.find(x => x.id === client.id);
      if (!c) return;

      if (!c.campaigns) c.campaigns = [];
      c.campaigns.push({
        id: generateId(),
        date: document.getElementById('cp_date').value,
        description: desc,
        amount: parseInt(document.getElementById('cp_amount').value) || 0,
        memo: document.getElementById('cp_memo').value.trim(),
      });
      setData(data);
      closeModal();
      setTimeout(() => showClientDetail(c), 200);
    });
  }, 100);
}

/* ========== CLIENT FORM (등록/수정) ========== */
function showClientForm(existing = null) {
  const isEdit = !!existing;
  const c = existing || {};

  const modalHtml = `
    <div class="modal-header">
      <h3>${isEdit ? '고객 수정' : '새 고객 등록'}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <!-- 기본 정보 -->
      <div class="form-section-title">📋 기본 정보</div>
      <div class="ai-input-group">
        <label class="ai-label">업체명 / 고객명 *</label>
        <input class="ai-input" id="cf_name" value="${c.name || ''}" placeholder="예: 루멘트" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">담당자명</label>
        <input class="ai-input" id="cf_contactName" value="${c.contactName || ''}" placeholder="예: 김철수 대표" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">연락처</label>
        <input class="ai-input" id="cf_contactPhone" value="${c.contactPhone || ''}" placeholder="예: 010-1234-5678" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">사업자번호</label>
        <input class="ai-input" id="cf_bizNumber" value="${c.bizNumber || ''}" placeholder="예: 123-45-67890" maxlength="12" />
      </div>

      <!-- 상품/작업 선택 -->
      <div class="form-section-title">🛒 상품 & 작업</div>
      <div class="ai-input-group">
        <label class="ai-label">상품 선택 (작업 종류) *</label>
        <select class="ai-select" id="cf_workType">
          <option value="">-- 선택 --</option>
          ${WORK_TYPES.map(w => `<option value="${w.value}" ${c.workType === w.value ? 'selected' : ''}>${w.emoji} ${w.label}</option>`).join('')}
        </select>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">상품명 / 키워드</label>
        <input class="ai-input" id="cf_product" value="${c.product || ''}" placeholder="예: 여성 니트 가디건" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">작업 방법</label>
        <select class="ai-select" id="cf_method">
          <option value="">선택</option>
          ${WORK_METHODS.map(m => `<option value="${m.value}" ${c.method === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">상품 링크</label>
        <input class="ai-input" id="cf_link" value="${c.link || ''}" placeholder="https://smartstore.naver.com/..." />
      </div>

      <!-- 계약 정보 -->
      <div class="form-section-title">📝 계약 정보</div>
      <div class="ai-input-group">
        <label class="ai-label">진행 상태</label>
        <select class="ai-select" id="cf_status">
          ${CLIENT_STATUS.map(s => `<option value="${s.value}" ${c.status === s.value ? 'selected' : ''}>${s.emoji} ${s.label}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">계약 금액 (원)</label>
          <input class="ai-input" id="cf_amount" type="number" value="${c.amount || ''}" placeholder="500000" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">슬롯 수량</label>
          <input class="ai-input" id="cf_slotQty" type="number" value="${c.slotQty || ''}" placeholder="5" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">슬롯 일수</label>
          <input class="ai-input" id="cf_slotDays" type="number" value="${c.slotDays || ''}" placeholder="10" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">시작 순위</label>
          <input class="ai-input" id="cf_startRank" type="number" value="${c.startRank || ''}" placeholder="50" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">목표 순위</label>
          <input class="ai-input" id="cf_targetRank" type="number" value="${c.targetRank || ''}" placeholder="10" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">현재 순위</label>
          <input class="ai-input" id="cf_currentRank" type="number" value="${c.currentRank || ''}" placeholder="25" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">시작일</label>
          <input class="ai-input" id="cf_startDate" type="date" value="${c.startDate || ''}" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">마감일</label>
          <input class="ai-input" id="cf_endDate" type="date" value="${c.endDate || ''}" />
        </div>
      </div>

      <!-- 결제 & 계산서 -->
      <div class="form-section-title">💳 결제 & 계산서</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">입금 상태</label>
          <select class="ai-select" id="cf_paymentStatus">
            ${PAYMENT_STATUS.map(p => `<option value="${p.value}" ${c.paymentStatus === p.value ? 'selected' : ''}>${p.emoji} ${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="ai-input-group">
          <label class="ai-label">계산서 상태</label>
          <select class="ai-select" id="cf_invoiceStatus">
            ${INVOICE_STATUS.map(i => `<option value="${i.value}" ${c.invoiceStatus === i.value ? 'selected' : ''}>${i.emoji} ${i.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">계산서 발행일</label>
        <input class="ai-input" id="cf_invoiceDate" type="date" value="${c.invoiceDate || ''}" />
      </div>

      <!-- 메모 -->
      <div class="form-section-title">📝 메모</div>
      <div class="ai-input-group">
        <textarea class="ai-textarea" id="cf_memo" style="min-height:80px" placeholder="특이사항, 고객 요청 등">${c.memo || ''}</textarea>
      </div>

      <button class="btn btn-primary btn-full" id="cf_save">💾 ${isEdit ? '수정 저장' : '고객 등록'}</button>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    const { data } = getApp();

    // Format biz number on input
    document.getElementById('cf_bizNumber')?.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = formatBizNumber(clean);
    });

    document.getElementById('cf_save')?.addEventListener('click', () => {
      const name = document.getElementById('cf_name').value.trim();
      if (!name) { alert('업체명을 입력해주세요'); return; }

      const clientData = {
        id: c.id || generateId(),
        name,
        contactName: document.getElementById('cf_contactName').value.trim(),
        contactPhone: document.getElementById('cf_contactPhone').value.trim(),
        bizNumber: document.getElementById('cf_bizNumber').value.replace(/[^0-9]/g, ''),
        workType: document.getElementById('cf_workType').value,
        product: document.getElementById('cf_product').value.trim(),
        method: document.getElementById('cf_method').value,
        link: document.getElementById('cf_link').value.trim(),
        status: document.getElementById('cf_status').value,
        amount: parseInt(document.getElementById('cf_amount').value) || 0,
        slotQty: parseInt(document.getElementById('cf_slotQty').value) || 0,
        slotDays: parseInt(document.getElementById('cf_slotDays').value) || 0,
        startRank: parseInt(document.getElementById('cf_startRank').value) || null,
        targetRank: parseInt(document.getElementById('cf_targetRank').value) || null,
        currentRank: parseInt(document.getElementById('cf_currentRank').value) || null,
        startDate: document.getElementById('cf_startDate').value,
        endDate: document.getElementById('cf_endDate').value,
        paymentStatus: document.getElementById('cf_paymentStatus').value || 'unpaid',
        invoiceStatus: document.getElementById('cf_invoiceStatus').value || 'none',
        invoiceDate: document.getElementById('cf_invoiceDate').value,
        memo: document.getElementById('cf_memo').value.trim(),
        rankHistory: c.rankHistory || [],
        campaigns: c.campaigns || [],
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        const idx = data.clients.findIndex(x => x.id === c.id);
        if (idx >= 0) data.clients[idx] = clientData;
      } else {
        data.clients.push(clientData);
      }
      setData(data);
      closeModal();
      navigate('clients');
    });
  }, 100);
}
