/* ========================================
   Settings — 설정 & 매출 관리
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal } from '../main.js';
import { generateId, formatMoney, getRevenueThisMonth } from '../data.js';
import { exportAllToExcel, exportClientsToExcel, exportTasksToExcel, exportRevenueToExcel, exportSalesReportToExcel } from '../excel.js';
import { generateSettlementPDF } from '../pdf.js';

export function renderSettings() {
  const { data } = getApp();
  const revenue = data.revenue || [];
  const monthRevenue = getRevenueThisMonth(data);

  // Monthly breakdown
  const monthlyMap = {};
  revenue.forEach(r => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = 0;
    monthlyMap[key] += r.amount || 0;
  });
  const months = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]));

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">⚙️</div>
      <div style="font-size:1.1rem;font-weight:700">설정 & 매출</div>
    </div>

    <!-- Revenue Section -->
    <div class="section-header fade-in"><div class="section-title">💰 매출 관리</div></div>
    <div class="card fade-in" style="margin-bottom:16px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:0.8rem;color:var(--text-muted)">이번달 매출</div>
        <div style="font-size:2rem;font-weight:800;color:var(--accent-orange)">${formatMoney(monthRevenue)}원</div>
      </div>
      <button class="btn btn-primary btn-full" id="addRevenue" style="margin-bottom:8px">➡️ 매출 입력</button>
      <button class="btn btn-secondary btn-full" id="settlementPDF">📄 이번달 정산서 PDF</button>
    </div>

    <!-- Recent Revenue -->
    ${revenue.length > 0 ? `
      <div class="stagger" style="margin-bottom:24px">
        ${revenue.slice(-10).reverse().map(r => `
          <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-weight:600;font-size:0.85rem">${r.clientName || '-'}</span>
                <span style="font-size:0.7rem;color:var(--text-muted);margin-left:6px">${r.description || ''}</span>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:var(--accent-green);font-size:0.9rem">+${formatMoney(r.amount)}원</div>
                <div style="font-size:0.65rem;color:var(--text-muted)">${r.date || ''}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Monthly Summary -->
    ${months.length > 0 ? `
      <div class="section-header fade-in"><div class="section-title">📅 월별 합계</div></div>
      <div class="stagger" style="margin-bottom:24px">
        ${months.map(([month, total]) => `
          <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.85rem;font-weight:600">${month}</span>
            <span style="font-weight:700;color:var(--accent-orange)">${formatMoney(total)}원</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Profile -->
    <div class="section-header fade-in"><div class="section-title">👤 프로필</div></div>
    <div class="card fade-in" style="margin-bottom:16px;padding:16px">
      <div class="ai-input-group">
        <label class="ai-label">이름</label>
        <input class="ai-input" id="sName" value="${data.settings.userName}" />
      </div>
      <div class="ai-input-group" style="margin-bottom:0">
        <label class="ai-label">회사명</label>
        <input class="ai-input" id="sCompany" value="${data.settings.companyName || ''}" />
      </div>
    </div>

    <!-- Slot Defaults -->
    <div class="section-header fade-in"><div class="section-title">📋 슬롯 기본값</div></div>
    <div class="card fade-in" style="margin-bottom:16px;padding:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">기본 ID</label>
          <input class="ai-input" id="sSlotId" value="${data.settings.defaultSlotId || 'stylepsh'}" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">기본 PW</label>
          <input class="ai-input" id="sSlotPw" value="${data.settings.defaultSlotPw || '123456'}" />
        </div>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">기본 담당자</label>
        <input class="ai-input" id="sManager" value="${data.settings.defaultManager || ''}" />
      </div>
      <div class="ai-input-group" style="margin-bottom:0">
        <label class="ai-label">기본 입금자</label>
        <input class="ai-input" id="sPayer" value="${data.settings.defaultPayer || ''}" />
      </div>
    </div>

    <button class="btn btn-primary btn-full fade-in" id="saveAll" style="margin-top:12px">💾 설정 저장</button>

    <!-- Excel Export -->
    <div class="section-header fade-in" style="margin-top:24px"><div class="section-title">📊 엑셀 내보내기</div></div>
    <button class="btn btn-primary btn-full fade-in" id="exportExcelAll" style="margin-bottom:8px;background:var(--gradient-success)">📊 전체 데이터 엑셀 다운로드</button>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px" class="fade-in">
      <button class="btn btn-secondary btn-sm" id="exportExcelClients">👥 고객</button>
      <button class="btn btn-secondary btn-sm" id="exportExcelTasks">✅ 업무</button>
      <button class="btn btn-secondary btn-sm" id="exportExcelRevenue">💰 매출</button>
    </div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;padding:0 4px">전체: 매출보고 + 고객현황 + 업무 + 매출 + 슬롯 + 일일일지 + 순위변동 (7개 시트)</div>
    <button class="btn btn-secondary btn-full fade-in" id="exportSalesReport" style="margin-top:8px;border-color:var(--accent-orange);color:var(--accent-orange)">💰 회사 매출보고 엑셀 (일자/담당자/키워드/단가/부가세/리셀러/정산/수수료/3.3금제/실송)</button>

    <!-- Data Management -->
    <div class="section-header fade-in" style="margin-top:24px"><div class="section-title">💾 데이터 관리</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" class="fade-in">
      <div class="settings-item" style="cursor:pointer;justify-content:center" id="exportD"><div class="settings-item-label">📥 JSON 백업</div></div>
      <div class="settings-item" style="cursor:pointer;justify-content:center" id="importD"><div class="settings-item-label">📤 복원</div></div>
    </div>
    <div class="settings-item fade-in" style="cursor:pointer;justify-content:center;margin-top:8px" id="resetD">
      <div class="settings-item-label" style="color:var(--accent-red)">🗑️ 전체 초기화</div>
    </div>
    <input type="file" id="importFile" accept=".json" style="display:none" />

    <div style="text-align:center;margin-top:28px;color:var(--text-muted);font-size:0.7rem">AD Commander v3.0 — 광고대행사 AI 비서</div>
  `;

  setTimeout(bindSettingsEvents, 50);
  return html;
}

function bindSettingsEvents() {
  const { data } = getApp();

  // Excel Export
  document.getElementById('exportExcelAll')?.addEventListener('click', () => exportAllToExcel(data));
  document.getElementById('exportExcelClients')?.addEventListener('click', () => exportClientsToExcel(data));
  document.getElementById('exportExcelTasks')?.addEventListener('click', () => exportTasksToExcel(data));
  document.getElementById('exportExcelRevenue')?.addEventListener('click', () => exportRevenueToExcel(data));

  // Settlement PDF
  document.getElementById('settlementPDF')?.addEventListener('click', () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    generateSettlementPDF(data, month, data.settings);
  });

  // Sales Report Excel (회사 매출보고)
  document.getElementById('exportSalesReport')?.addEventListener('click', () => exportSalesReportToExcel(data));

  // Add Revenue
  document.getElementById('addRevenue')?.addEventListener('click', () => {
    const clients = data.clients || [];
    const modalHtml = `
      <div class="modal-header">
        <h3>💰 매출 입력</h3>
        <button class="modal-close" data-close-modal>✕</button>
      </div>
      <div class="modal-body">
        <div class="ai-input-group">
          <label class="ai-label">고객</label>
          <select class="ai-select" id="rv_client">
            <option value="">직접 입력</option>
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="ai-input-group">
          <label class="ai-label">고객명 (직접 입력)</label>
          <input class="ai-input" id="rv_name" placeholder="고객명" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">금액 (원)</label>
          <input class="ai-input" id="rv_amount" type="number" placeholder="500000" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">날짜</label>
          <input class="ai-input" id="rv_date" type="date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">내용</label>
          <input class="ai-input" id="rv_desc" placeholder="예: 3월 스마트스토어 마케팅 비용" />
        </div>
        <button class="btn btn-primary btn-full" id="rv_save">💾 매출 등록</button>
      </div>
    `;

    showModal(modalHtml);

    setTimeout(() => {
      // Auto-fill name from client select
      document.getElementById('rv_client')?.addEventListener('change', (e) => {
        const client = data.clients.find(c => c.id === e.target.value);
        if (client) {
          document.getElementById('rv_name').value = client.name;
        }
      });

      document.getElementById('rv_save')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('rv_amount').value);
        if (!amount) { alert('금액을 입력해주세요'); return; }

        const clientId = document.getElementById('rv_client').value;
        const clientName = document.getElementById('rv_name').value || '미지정';

        if (!data.revenue) data.revenue = [];
        data.revenue.push({
          id: generateId(),
          clientId,
          clientName,
          amount,
          date: document.getElementById('rv_date').value,
          description: document.getElementById('rv_desc').value,
          created: new Date().toISOString(),
        });
        setData(data);
        closeModal();
        navigate('settings');
      });
    }, 100);
  });

  // Save all settings
  document.getElementById('saveAll')?.addEventListener('click', () => {
    data.settings.userName = document.getElementById('sName').value || '지휘관';
    data.settings.companyName = document.getElementById('sCompany').value || '';
    data.settings.defaultSlotId = document.getElementById('sSlotId').value || 'stylepsh';
    data.settings.defaultSlotPw = document.getElementById('sSlotPw').value || '123456';
    data.settings.defaultManager = document.getElementById('sManager').value || '';
    data.settings.defaultPayer = document.getElementById('sPayer').value || '';
    setData(data);
    const btn = document.getElementById('saveAll');
    btn.textContent = '✅ 저장 완료!';
    setTimeout(() => btn.textContent = '💾 설정 저장', 2000);
  });

  // Export
  document.getElementById('exportD')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `adcommander_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  });

  // Import
  document.getElementById('importD')?.addEventListener('click', () => {
    document.getElementById('importFile')?.click();
  });

  document.getElementById('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (confirm('백업 데이터를 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.')) {
          Object.assign(data, imported);
          setData(data);
          location.reload();
        }
      } catch (err) {
        alert('유효하지 않은 파일입니다.');
      }
    };
    reader.readAsText(file);
  });

  // Reset
  document.getElementById('resetD')?.addEventListener('click', () => {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('adcommander_v3_data');
      location.reload();
    }
  });
}
