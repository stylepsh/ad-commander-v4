/* ========================================
   Slots — 슬롯 관리 + 상품 카탈로그 + 카톡 양식
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal } from '../main.js';
import { SLOT_TYPES, generateId } from '../data.js';
import {
  NAVER_PRODUCTS, COUPANG_PRODUCTS, OHOUSE_PRODUCTS, ALL_PRODUCTS,
  KAKAO_TEMPLATES, FIELD_LABELS
} from '../catalog.js';

let activeTab = 'form'; // form, catalog, templates

export function renderSlots() {
  const { data } = getApp();
  const defaults = data.settings || {};
  const history = data.slots || [];

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">📋</div>
      <div style="font-size:1.1rem;font-weight:700">슬롯 관리</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">상품선택 · 양식생성 · 카톡 복사 · URL 접속</div>
    </div>

    <!-- Tabs -->
    <div class="view-tabs fade-in" style="margin-bottom:16px">
      <button class="view-tab ${activeTab === 'form' ? 'active' : ''}" data-slot-tab="form">📝 양식 생성</button>
      <button class="view-tab ${activeTab === 'catalog' ? 'active' : ''}" data-slot-tab="catalog">📦 상품 목록</button>
      <button class="view-tab ${activeTab === 'templates' ? 'active' : ''}" data-slot-tab="templates">📋 카톡 양식</button>
    </div>

    <div id="slotTabContent">
      ${activeTab === 'form' ? renderFormTab(defaults, history) : ''}
      ${activeTab === 'catalog' ? renderCatalogTab() : ''}
      ${activeTab === 'templates' ? renderTemplatesTab(defaults) : ''}
    </div>
  `;

  setTimeout(bindSlotEvents, 50);
  return html;
}

/* ========== 양식 생성 탭 ========== */
function renderFormTab(defaults, history) {
  return `
    <!-- Product Quick Select -->
    <div class="ai-input-group fade-in">
      <label class="ai-label">🛒 상품 선택 (원가 자동 입력)</label>
      <select class="ai-select" id="productSelect">
        <option value="">-- 상품 선택 --</option>
        <optgroup label="🟢 네이버">
          ${NAVER_PRODUCTS.map((p, i) => `<option value="naver_${i}">${p.type} ${p.name} | ${p.days}일 | 원가 ${p.cost.toLocaleString()}원</option>`).join('')}
        </optgroup>
        <optgroup label="🟠 쿠팡">
          ${COUPANG_PRODUCTS.map((p, i) => `<option value="coupang_${i}">${p.name} | ${p.days}일 | 원가 ${p.cost.toLocaleString()}원</option>`).join('')}
        </optgroup>
        <optgroup label="🏠 오늘의집">
          ${OHOUSE_PRODUCTS.map((p, i) => `<option value="ohouse_${i}">${p.name} | ${p.days}일 | 원가 ${p.cost.toLocaleString()}원</option>`).join('')}
        </optgroup>
      </select>
    </div>

    <!-- Selected Product Info -->
    <div id="selectedProductInfo" class="card fade-in" style="display:none;margin-bottom:16px;padding:14px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div id="spName" style="font-weight:700;font-size:0.9rem"></div>
          <div id="spDetail" style="font-size:0.75rem;color:var(--text-muted);margin-top:2px"></div>
        </div>
        <div style="text-align:right">
          <div id="spCost" style="font-size:0.82rem;color:var(--accent-orange)"></div>
          <a id="spUrl" href="#" target="_blank" class="btn btn-sm btn-primary" style="margin-top:6px;display:none;font-size:0.72rem">🔗 접속</a>
        </div>
      </div>
    </div>

    <!-- Cost & Sell Price -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" class="fade-in">
      <div class="ai-input-group">
        <label class="ai-label">💰 원가</label>
        <input class="ai-input" id="slotCostPrice" type="number" placeholder="원가" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">💵 판매단가</label>
        <input class="ai-input" id="slotSellPrice" type="number" placeholder="판매단가" />
      </div>
    </div>

    <!-- Margin Display -->
    <div id="marginDisplay" class="fade-in" style="display:none;font-size:0.78rem;color:var(--accent-green);margin:-8px 0 12px 4px;font-weight:600"></div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">유형</label>
      <select class="ai-select" id="slotType">
        ${SLOT_TYPES.map(t => `<option value="${t.value}">${t.emoji} ${t.label}</option>`).join('')}
      </select>
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">날짜</label>
      <input class="ai-input" id="slotDate" value="${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}" placeholder="03.15" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">입금여부 (입금자명)</label>
      <input class="ai-input" id="slotPayer" value="${defaults.defaultPayer || ''}" placeholder="예: 그로우빅토리" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">담당자</label>
      <input class="ai-input" id="slotManager" value="${defaults.defaultManager || ''}" placeholder="예: 하영호" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">업체명</label>
      <input class="ai-input" id="slotCompany" placeholder="예: 루멘트" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">작업 방식 (개수 포함)</label>
      <input class="ai-input" id="slotWork" placeholder="예: 소보루 플러스 ai 5개 10일" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">작업 키워드 (미드값 포함)</label>
      <input class="ai-input" id="slotKeyword" placeholder="예: 여성가디건 미드값 150" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">슬롯 번호 (있을 경우)</label>
      <input class="ai-input" id="slotNumbers" placeholder="예: 20701-20703 3개" />
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">마감일 (있을 경우)</label>
      <input class="ai-input" id="slotDeadline" placeholder="예: 03.20" />
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" class="fade-in">
      <div class="ai-input-group">
        <label class="ai-label">ID</label>
        <input class="ai-input" id="slotId" value="${defaults.defaultSlotId || 'stylepsh'}" />
      </div>
      <div class="ai-input-group">
        <label class="ai-label">PW</label>
        <input class="ai-input" id="slotPw" value="${defaults.defaultSlotPw || '123456'}" />
      </div>
    </div>

    <div id="refundCalc" class="ai-input-group fade-in" style="display:none">
      <label class="ai-label">환불 계산 (단가 × 개수 × 일수)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <input class="ai-input" id="refundPrice" type="number" placeholder="단가" />
        <input class="ai-input" id="refundQty" type="number" placeholder="개수" />
        <input class="ai-input" id="refundDays" type="number" placeholder="일수" />
      </div>
      <div id="refundTotal" style="font-size:0.85rem;color:var(--accent-orange);margin-top:6px;font-weight:600"></div>
    </div>

    <div id="slotPreview" class="slot-preview-card fade-in" style="display:none"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <button class="btn btn-primary btn-full" id="slotGenerate">📝 양식 생성</button>
      <button class="btn btn-secondary btn-full" id="slotCopy">📋 복사</button>
    </div>

    <button class="btn btn-secondary btn-full fade-in" id="slotSaveDefaults" style="margin-bottom:24px">💾 기본값 저장</button>

    ${history.length > 0 ? `
      <div class="section-header"><div class="section-title">📚 최근 기록 (${history.length}건)</div></div>
      ${history.slice(-15).reverse().map((h, i) => `
        <div class="card fade-in" style="margin-bottom:8px;padding:12px 16px;cursor:pointer" data-load-slot="${history.length - 1 - i}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span class="slot-type-badge">${h.typeLabel || h.type}</span>
              <span style="font-size:0.85rem;font-weight:600;margin-left:6px">${h.company || '-'}</span>
              ${h.productName ? `<span style="font-size:0.7rem;color:var(--text-muted);margin-left:4px">(${h.productName})</span>` : ''}
            </div>
            <span style="font-size:0.7rem;color:var(--text-muted)">${h.date || ''}</span>
          </div>
        </div>
      `).join('')}
    ` : ''}
  `;
}

/* ========== 상품 카탈로그 탭 ========== */
function renderCatalogTab() {
  return `
    <div class="section-header fade-in"><div class="section-title">🟢 네이버 (${NAVER_PRODUCTS.length}개)</div></div>
    <div class="stagger" style="margin-bottom:20px">
      ${NAVER_PRODUCTS.map(p => renderProductCard(p, '네이버')).join('')}
    </div>

    <div class="section-header fade-in"><div class="section-title">🟠 쿠팡 (${COUPANG_PRODUCTS.length}개)</div></div>
    <div class="stagger" style="margin-bottom:20px">
      ${COUPANG_PRODUCTS.map(p => renderProductCard(p, '쿠팡')).join('')}
    </div>

    <div class="section-header fade-in"><div class="section-title">🏠 오늘의집 (${OHOUSE_PRODUCTS.length}개)</div></div>
    <div class="stagger" style="margin-bottom:20px">
      ${OHOUSE_PRODUCTS.map(p => renderProductCard(p, '오늘의집')).join('')}
    </div>
  `;
}

function renderProductCard(p, platform) {
  return `
    <div class="product-card fade-in">
      <div class="product-card-left">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-type">${p.type} · ${p.days}일 ${p.notes ? `· ${p.notes}` : ''}</div>
      </div>
      <div class="product-card-right">
        <div class="product-card-cost">${p.cost.toLocaleString()}원</div>
        ${p.url ? `<a href="${p.url}" target="_blank" class="product-url-btn">접속 ↗</a>` : '<span class="product-no-url">URL 없음</span>'}
      </div>
    </div>
  `;
}

/* ========== 카톡 양식 탭 ========== */
function renderTemplatesTab(defaults) {
  return `
    <div class="section-header fade-in"><div class="section-title">📋 카톡 보고 양식 선택</div></div>
    <div class="stagger">
      ${Object.entries(KAKAO_TEMPLATES).map(([key, tmpl]) => `
        <div class="card fade-in" style="margin-bottom:8px;padding:14px 16px;cursor:pointer" data-open-template="${key}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:0.9rem">${tmpl.label}</span>
            <span class="btn btn-sm btn-secondary">작성 →</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ========== Event Binding ========== */
function bindSlotEvents() {
  const { data } = getApp();

  // Tab switching
  document.querySelectorAll('[data-slot-tab]').forEach(el => {
    el.addEventListener('click', () => {
      activeTab = el.dataset.slotTab;
      navigate('slots');
    });
  });

  // Template modals
  document.querySelectorAll('[data-open-template]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.openTemplate;
      showTemplateForm(key);
    });
  });

  if (activeTab !== 'form') return;

  // Company name autocomplete from previous records
  const companyInput = document.getElementById('slotCompany');
  companyInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const existing = document.getElementById('companyAutocomplete');
    if (existing) existing.remove();
    if (q.length < 1) return;

    // Find matching previous slots (unique companies)
    const allSlots = data.slots || [];
    const matchMap = {};
    allSlots.forEach(s => {
      if (s.company && s.company.toLowerCase().includes(q) && !matchMap[s.company]) {
        matchMap[s.company] = s;
      }
    });
    // Also check clients
    data.clients.forEach(c => {
      if (c.name && c.name.toLowerCase().includes(q) && !matchMap[c.name]) {
        matchMap[c.name] = { company: c.name, manager: '', work: '', payer: '' };
      }
    });

    const matches = Object.values(matchMap).slice(0, 5);
    if (matches.length === 0) return;

    const list = document.createElement('div');
    list.id = 'companyAutocomplete';
    list.className = 'autocomplete-list';
    list.innerHTML = matches.map((m, i) => `
      <div class="autocomplete-item" data-ac="${i}">
        <div class="autocomplete-item-title">${m.company}</div>
        <div class="autocomplete-item-sub">${[m.manager, m.work].filter(Boolean).join(' · ') || '이전 기록에서 자동완성'}</div>
      </div>
    `).join('');

    companyInput.parentElement.after(list);

    list.querySelectorAll('[data-ac]').forEach(item => {
      item.addEventListener('click', () => {
        const m = matches[parseInt(item.dataset.ac)];
        companyInput.value = m.company;

        // Auto-fill from previous record
        if (m.manager) document.getElementById('slotManager').value = m.manager;
        if (m.payer) document.getElementById('slotPayer').value = m.payer;
        if (m.work) document.getElementById('slotWork').value = m.work;
        if (m.keyword) document.getElementById('slotKeyword').value = m.keyword;

        list.remove();
      });
    });
  });

  // Remove autocomplete on blur (delayed to allow click)
  companyInput?.addEventListener('blur', () => {
    setTimeout(() => document.getElementById('companyAutocomplete')?.remove(), 200);
  });

  // Product select
  document.getElementById('productSelect')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) {
      document.getElementById('selectedProductInfo').style.display = 'none';
      return;
    }

    const [platform, idx] = val.split('_');
    const list = platform === 'naver' ? NAVER_PRODUCTS : platform === 'coupang' ? COUPANG_PRODUCTS : OHOUSE_PRODUCTS;
    const p = list[parseInt(idx)];
    if (!p) return;

    // Show info card
    const info = document.getElementById('selectedProductInfo');
    info.style.display = 'block';
    document.getElementById('spName').textContent = `${p.name} (${platform === 'naver' ? '네이버' : platform === 'coupang' ? '쿠팡' : '오늘의집'})`;
    document.getElementById('spDetail').textContent = `${p.type} · ${p.days}일 ${p.refund === 'O' ? '· 환불가능' : ''} ${p.notes ? '· ' + p.notes : ''}`;
    document.getElementById('spCost').textContent = `원가 ${p.cost.toLocaleString()}원`;

    const urlBtn = document.getElementById('spUrl');
    if (p.url) {
      urlBtn.href = p.url;
      urlBtn.style.display = 'inline-flex';
    } else {
      urlBtn.style.display = 'none';
    }

    // Auto-fill cost price
    document.getElementById('slotCostPrice').value = p.cost;

    // Auto-fill work description
    const workField = document.getElementById('slotWork');
    if (!workField.value) {
      workField.value = `${p.name} ${p.days}일`;
    }

    updateMargin();
  });

  // Margin calculation
  ['slotCostPrice', 'slotSellPrice'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateMargin);
  });

  // Show/hide refund calc
  document.getElementById('slotType')?.addEventListener('change', (e) => {
    const rc = document.getElementById('refundCalc');
    if (rc) rc.style.display = e.target.value === 'refund' ? 'block' : 'none';
  });

  // Refund total calc
  ['refundPrice', 'refundQty', 'refundDays'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const p = parseInt(document.getElementById('refundPrice')?.value) || 0;
      const q = parseInt(document.getElementById('refundQty')?.value) || 0;
      const d = parseInt(document.getElementById('refundDays')?.value) || 0;
      const total = p * q * d;
      const el = document.getElementById('refundTotal');
      if (el && total > 0) el.textContent = `${p.toLocaleString()}×${q}×${d}=${total.toLocaleString()}원`;
    });
  });

  // Generate
  document.getElementById('slotGenerate')?.addEventListener('click', () => {
    const msg = buildSlotMessage();
    const preview = document.getElementById('slotPreview');
    if (preview) { preview.textContent = msg; preview.style.display = 'block'; }
  });

  // Copy
  document.getElementById('slotCopy')?.addEventListener('click', () => {
    const preview = document.getElementById('slotPreview');
    if (preview?.textContent) {
      navigator.clipboard.writeText(preview.textContent);
      const btn = document.getElementById('slotCopy');
      btn.textContent = '✅ 복사됨!';
      setTimeout(() => btn.textContent = '📋 복사', 2000);

      // Save to history with ALL fields for Excel report
      const type = document.getElementById('slotType').value;
      const typeLabel = SLOT_TYPES.find(t => t.value === type)?.label || type;
      const company = document.getElementById('slotCompany').value;
      const date = document.getElementById('slotDate').value;
      const manager = document.getElementById('slotManager').value;
      const payer = document.getElementById('slotPayer').value;
      const keyword = document.getElementById('slotKeyword').value;
      const work = document.getElementById('slotWork').value;
      const deadline = document.getElementById('slotDeadline').value;

      // Extract qty from work text (e.g. "소보루 플러스 ai 3개 10일" → qty=3, days=10)
      const qtyMatch = work.match(/(\d+)\s*개/);
      const daysMatch = work.match(/(\d+)\s*일/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const days = daysMatch ? parseInt(daysMatch[1]) : 10;

      if (!data.slots) data.slots = [];
      data.slots.push({
        id: generateId(),
        type, typeLabel, company, date,
        manager, payer, keyword, work, deadline,
        productName: getSelectedProductName(),
        costPrice: parseInt(document.getElementById('slotCostPrice').value) || 0,
        sellPrice: parseInt(document.getElementById('slotSellPrice').value) || 0,
        qty, days,
        content: preview.textContent,
        created: new Date().toISOString()
      });
      setData(data);
    }
  });

  // Save defaults
  document.getElementById('slotSaveDefaults')?.addEventListener('click', () => {
    data.settings.defaultPayer = document.getElementById('slotPayer').value;
    data.settings.defaultManager = document.getElementById('slotManager').value;
    data.settings.defaultSlotId = document.getElementById('slotId').value;
    data.settings.defaultSlotPw = document.getElementById('slotPw').value;
    setData(data);
    const btn = document.getElementById('slotSaveDefaults');
    btn.textContent = '✅ 저장됨!';
    setTimeout(() => btn.textContent = '💾 기본값 저장', 2000);
  });

  // Load from history
  document.querySelectorAll('[data-load-slot]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.loadSlot);
      const item = data.slots?.[idx];
      if (item) {
        const preview = document.getElementById('slotPreview');
        if (preview) { preview.textContent = item.content; preview.style.display = 'block'; }
      }
    });
  });
}

function updateMargin() {
  const cost = parseInt(document.getElementById('slotCostPrice')?.value) || 0;
  const sell = parseInt(document.getElementById('slotSellPrice')?.value) || 0;
  const el = document.getElementById('marginDisplay');
  if (el && cost > 0 && sell > 0) {
    const margin = sell - cost;
    const pct = Math.round((margin / sell) * 100);
    el.style.display = 'block';
    el.style.color = margin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    el.textContent = `마진: ${margin >= 0 ? '+' : ''}${margin.toLocaleString()}원 (${pct}%)`;
  } else if (el) {
    el.style.display = 'none';
  }
}

function getSelectedProductName() {
  const val = document.getElementById('productSelect')?.value;
  if (!val) return '';
  const [platform, idx] = val.split('_');
  const list = platform === 'naver' ? NAVER_PRODUCTS : platform === 'coupang' ? COUPANG_PRODUCTS : OHOUSE_PRODUCTS;
  return list[parseInt(idx)]?.name || '';
}

function buildSlotMessage() {
  const type = document.getElementById('slotType').value;
  const typeLabel = SLOT_TYPES.find(t => t.value === type)?.label || type;
  const date = document.getElementById('slotDate').value;
  const payer = document.getElementById('slotPayer').value;
  const manager = document.getElementById('slotManager').value;
  const company = document.getElementById('slotCompany').value;
  const work = document.getElementById('slotWork').value;
  const keyword = document.getElementById('slotKeyword').value;
  const numbers = document.getElementById('slotNumbers').value;
  const deadline = document.getElementById('slotDeadline').value;
  const id = document.getElementById('slotId').value;
  const pw = document.getElementById('slotPw').value;

  let msg = `✔ 슬롯 오픈건 ✔\n\n*${typeLabel}\n날짜 ${date}\n\n입금여부(입금자명까지) ${payer}\n\n담당자 : ${manager}\n업체명 : ${company}\n작업 방식 (개수 포함) : ${work}`;

  if (keyword) msg += `\n작업 키워드 (미드값 포함) : ${keyword}`;
  if (numbers) msg += `\n\n${numbers}`;
  if (deadline) msg += `\n\n마감일 ${deadline}`;

  msg += `\n\nid : ${id}\npw : ${pw}`;

  if (type === 'refund') {
    const p = parseInt(document.getElementById('refundPrice')?.value) || 0;
    const q = parseInt(document.getElementById('refundQty')?.value) || 0;
    const d = parseInt(document.getElementById('refundDays')?.value) || 0;
    if (p && q && d) {
      msg += `\n\n${p.toLocaleString()}*${q}*${d}=${(p * q * d).toLocaleString()}원`;
    }
  }

  return msg;
}

/* ========== TEMPLATE FORM MODAL ========== */
function showTemplateForm(templateKey) {
  const tmpl = KAKAO_TEMPLATES[templateKey];
  if (!tmpl) return;
  const { data } = getApp();
  const defaults = data.settings || {};

  const modalHtml = `
    <div class="modal-header">
      <h3>${tmpl.label}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      ${tmpl.fields.map(field => `
        <div class="ai-input-group">
          <label class="ai-label">${FIELD_LABELS[field] || field}</label>
          <input class="ai-input" id="tmpl_${field}" value="${getDefaultForField(field, defaults)}" placeholder="${FIELD_LABELS[field] || field}" />
        </div>
      `).join('')}
      <button class="btn btn-primary btn-full" id="tmplGenerate" style="margin-bottom:8px">📝 양식 생성</button>
      <div id="tmplPreview" class="slot-preview-card" style="display:none"></div>
      <button class="btn btn-secondary btn-full" id="tmplCopy" style="display:none;margin-top:8px">📋 카톡 복사</button>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    document.getElementById('tmplGenerate')?.addEventListener('click', () => {
      const fieldData = {};
      tmpl.fields.forEach(f => {
        fieldData[f] = document.getElementById(`tmpl_${f}`)?.value || '';
      });
      const msg = tmpl.generate(fieldData);
      const preview = document.getElementById('tmplPreview');
      if (preview) { preview.textContent = msg; preview.style.display = 'block'; }
      document.getElementById('tmplCopy').style.display = 'block';
    });

    document.getElementById('tmplCopy')?.addEventListener('click', () => {
      const preview = document.getElementById('tmplPreview');
      if (preview?.textContent) {
        navigator.clipboard.writeText(preview.textContent);
        const btn = document.getElementById('tmplCopy');
        btn.textContent = '✅ 복사됨!';
        setTimeout(() => btn.textContent = '📋 카톡 복사', 2000);
      }
    });
  }, 100);
}

function getDefaultForField(field, defaults) {
  switch (field) {
    case 'manager': return defaults.defaultManager || '';
    case 'payer': return defaults.defaultPayer || '';
    case 'id': return defaults.defaultSlotId || 'stylepsh';
    case 'pw': return defaults.defaultSlotPw || '123456';
    case 'date': {
      const now = new Date();
      return `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    }
    default: return '';
  }
}
