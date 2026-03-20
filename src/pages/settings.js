/* ========================================
   Settings V4.0 — 설정 & 매출 & 데이터 관리
   담당자 퍼포먼스, 휴지통, 백업, 다크모드 설정 등
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal, toggleDarkMode } from '../main.js';
import {
  generateId, formatMoney, getRevenueThisMonth,
  getPerformanceByManager, getBackupList, restoreBackup,
  getTrash, restoreFromTrash, showToast,
  getUnpaidTotal, getUnpaidClients,
  changePin, logout
} from '../data.js';
import { exportAllToExcel, exportClientsToExcel, exportTasksToExcel, exportRevenueToExcel, exportSalesReportToExcel } from '../excel.js';
import { generateSettlementPDF } from '../pdf.js';

export function renderSettings() {
  const { data } = getApp();
  const revenue = data.revenue || [];
  const monthRevenue = getRevenueThisMonth(data);
  const unpaidTotal = getUnpaidTotal(data);
  const unpaidClients = getUnpaidClients(data);
  const managers = getPerformanceByManager(data);
  const backups = getBackupList();
  const trash = getTrash();

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
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">프로필 · 매출 · 데이터 · 백업 · 휴지통</div>
    </div>

    <!-- Revenue Section -->
    <div class="section-header fade-in"><div class="section-title">💰 매출 관리</div></div>
    <div class="card fade-in mb-md">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:0.8rem;color:var(--text-muted)">이번달 매출</div>
        <div style="font-size:2rem;font-weight:800;color:var(--accent-orange)">${formatMoney(monthRevenue)}원</div>
        ${unpaidTotal > 0 ? `<div style="font-size:0.78rem;color:var(--accent-red);margin-top:4px">미수금: ${formatMoney(unpaidTotal)}원 (${unpaidClients.length}건)</div>` : ''}
      </div>
      <button class="btn btn-primary btn-full mb-sm" id="addRevenue">➡️ 매출 입력</button>
      <button class="btn btn-secondary btn-full" id="settlementPDF">📄 이번달 정산서 PDF</button>
    </div>

    ${revenue.length > 0 ? `
      <div class="stagger mb-lg">
        ${revenue.slice(-10).reverse().map(r => `
          <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px">
            <div class="flex-between">
              <div><span style="font-weight:600;font-size:0.85rem">${r.clientName || '-'}</span><span style="font-size:0.7rem;color:var(--text-muted);margin-left:6px">${r.description || ''}</span></div>
              <div style="text-align:right"><div style="font-weight:700;color:var(--accent-green);font-size:0.9rem">+${formatMoney(r.amount)}원</div><div style="font-size:0.65rem;color:var(--text-muted)">${r.date || ''}</div></div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${months.length > 0 ? `
      <div class="section-header fade-in"><div class="section-title">📅 월별 합계</div></div>
      <div class="stagger mb-lg">
        ${months.map(([month, total]) => `
          <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.85rem;font-weight:600">${month}</span>
            <span style="font-weight:700;color:var(--accent-orange)">${formatMoney(total)}원</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- #33 Manager Performance -->
    ${managers.length > 0 ? `
      <div class="section-header fade-in"><div class="section-title">📊 담당자별 퍼포먼스</div></div>
      <div class="stagger mb-lg">
        ${managers.map(m => `
          <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px">
            <div class="flex-between">
              <div><span style="font-weight:600;font-size:0.88rem">${m.name}</span><span style="font-size:0.72rem;color:var(--text-muted);margin-left:6px">${m.count}건</span></div>
              <div style="text-align:right">
                <div style="font-size:0.82rem;color:var(--text-secondary)">매출 ${formatMoney(m.totalSell)}원</div>
                <div style="font-size:0.78rem;font-weight:700;color:${m.totalMargin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">마진 ${m.totalMargin >= 0 ? '+' : ''}${formatMoney(m.totalMargin)}원</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Profile & Company Info -->
    <div class="section-header fade-in"><div class="section-title">👤 프로필 & 회사 정보</div></div>
    <div class="card fade-in mb-md" style="padding:16px">
      <div class="grid-2">
        <div class="ai-input-group"><label class="ai-label">이름</label><input class="ai-input" id="sName" value="${data.settings.userName}" /></div>
        <div class="ai-input-group"><label class="ai-label">회사명</label><input class="ai-input" id="sCompany" value="${data.settings.companyName || ''}" /></div>
      </div>
      <div class="ai-input-group"><label class="ai-label">사업자등록번호</label><input class="ai-input" id="sBizNumber" value="${data.settings.bizNumber || ''}" placeholder="880-03-03743" /></div>
      <div class="ai-input-group"><label class="ai-label">사업장 주소</label><input class="ai-input" id="sAddress" value="${data.settings.companyAddress || ''}" /></div>
      <div class="grid-2">
        <div class="ai-input-group"><label class="ai-label">업태</label><input class="ai-input" id="sBizType" value="${data.settings.bizType || ''}" /></div>
        <div class="ai-input-group"><label class="ai-label">종목</label><input class="ai-input" id="sBizItem" value="${data.settings.bizItem || ''}" /></div>
      </div>
      <div class="ai-input-group"><label class="ai-label">회사 이메일</label><input class="ai-input" id="sCompanyEmail" value="${data.settings.companyEmail || ''}" /></div>
      <div class="grid-2">
        <div class="ai-input-group"><label class="ai-label">연락처</label><input class="ai-input" id="sPhone" value="${data.settings.managerPhone || ''}" /></div>
        <div class="ai-input-group" style="margin-bottom:0"><label class="ai-label">개인 이메일</label><input class="ai-input" id="sEmail" value="${data.settings.managerEmail || ''}" /></div>
      </div>
    </div>

    <!-- Slot Defaults -->
    <div class="section-header fade-in"><div class="section-title">📋 슬롯 기본값</div></div>
    <div class="card fade-in mb-md" style="padding:16px">
      <div class="grid-2">
        <div class="ai-input-group"><label class="ai-label">기본 ID</label><input class="ai-input" id="sSlotId" value="${data.settings.defaultSlotId || 'stylepsh'}" /></div>
        <div class="ai-input-group"><label class="ai-label">기본 PW</label><input class="ai-input" id="sSlotPw" value="${data.settings.defaultSlotPw || '123456'}" /></div>
      </div>
      <div class="ai-input-group"><label class="ai-label">기본 담당자</label><input class="ai-input" id="sManager" value="${data.settings.defaultManager || ''}" /></div>
      <div class="ai-input-group" style="margin-bottom:0"><label class="ai-label">기본 입금자</label><input class="ai-input" id="sPayer" value="${data.settings.defaultPayer || ''}" /></div>
    </div>

    <!-- #3 Dark Mode Toggle -->
    <div class="section-header fade-in"><div class="section-title">🎨 표시 설정</div></div>
    <div class="settings-item fade-in" id="toggleDarkMode" style="cursor:pointer">
      <div><div class="settings-item-label">${data.settings.darkMode ? '☀️ 라이트모드로 전환' : '🌙 다크모드로 전환'}</div><div class="settings-item-desc">화면 테마를 변경합니다</div></div>
      <div class="toggle ${data.settings.darkMode ? 'on' : ''}"></div>
    </div>

    <!-- PIN & Security -->
    <div class="section-header fade-in"><div class="section-title">🔒 보안</div></div>
    <div class="card fade-in mb-md" style="padding:16px">
      <div class="ai-input-group"><label class="ai-label">PIN 변경 (4자리 숫자)</label><input class="ai-input" id="newPinInput" type="password" maxlength="4" placeholder="새 PIN 입력 (숫자 4자리)" style="text-align:center;font-size:1.2rem;letter-spacing:12px" /></div>
      <button class="btn btn-secondary btn-full" id="changePinBtn">🔑 PIN 변경</button>
    </div>
    <button class="btn btn-full fade-in" id="logoutBtn" style="background:var(--accent-red);color:#fff;margin-bottom:12px">🔒 잠금 (로그아웃)</button>

    <button class="btn btn-primary btn-full fade-in mt-md" id="saveAll">💾 설정 저장</button>

    <!-- Excel Export -->
    <div class="section-header fade-in mt-lg"><div class="section-title">📊 엑셀 내보내기</div></div>
    <button class="btn btn-primary btn-full fade-in mb-sm" id="exportExcelAll" style="background:var(--gradient-success)">📊 전체 데이터 엑셀 다운로드</button>
    <div class="grid-3 fade-in">
      <button class="btn btn-secondary btn-sm" id="exportExcelClients">👥 고객</button>
      <button class="btn btn-secondary btn-sm" id="exportExcelTasks">✅ 업무</button>
      <button class="btn btn-secondary btn-sm" id="exportExcelRevenue">💰 매출</button>
    </div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;padding:0 4px">전체: 매출보고 + 고객현황 + 업무 + 매출 + 슬롯 + 일일일지 + 순위변동 (7개 시트)</div>
    <button class="btn btn-secondary btn-full fade-in mt-sm" id="exportSalesReport" style="border-color:var(--accent-orange);color:var(--accent-orange)">💰 회사 매출보고 엑셀</button>

    <!-- Data Management -->
    <div class="section-header fade-in mt-lg"><div class="section-title">💾 데이터 관리</div></div>
    <div class="grid-2 fade-in">
      <div class="settings-item" style="cursor:pointer;justify-content:center" id="exportD"><div class="settings-item-label">📥 JSON 백업</div></div>
      <div class="settings-item" style="cursor:pointer;justify-content:center" id="importD"><div class="settings-item-label">📤 복원</div></div>
    </div>

    <!-- #38 Auto Backup List -->
    ${backups.length > 0 ? `
      <div class="section-header fade-in mt-md"><div class="section-title">🔄 자동 백업 (${backups.length}건)</div></div>
      <div class="stagger">
        ${backups.slice(0, 5).map(date => `
          <div class="card fade-in" style="margin-bottom:6px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.82rem;font-weight:500">${date}</span>
            <button class="btn btn-sm btn-secondary" data-restore-backup="${date}">복원</button>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- #50 Trash Management -->
    ${trash.length > 0 ? `
      <div class="section-header fade-in mt-md"><div class="section-title">🗑️ 휴지통 (${trash.length}건)</div></div>
      <div class="stagger">
        ${trash.slice(-5).reverse().map((t, i) => `
          <div class="card fade-in" style="margin-bottom:6px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:0.72rem;padding:2px 6px;border-radius:var(--radius-full);background:var(--bg-input);color:var(--text-muted)">${t.type}</span>
              <span style="font-size:0.82rem;font-weight:500;margin-left:6px">${t.item?.name || t.item?.text || '-'}</span>
            </div>
            <button class="btn btn-sm btn-secondary" data-restore-trash="${trash.length - 1 - i}">복원</button>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="settings-item fade-in mt-md" style="cursor:pointer;justify-content:center" id="resetD">
      <div class="settings-item-label" style="color:var(--accent-red)">🗑️ 전체 초기화</div>
    </div>
    <input type="file" id="importFile" accept=".json" style="display:none" />

    <div style="text-align:center;margin-top:28px;color:var(--text-muted);font-size:0.7rem">AD Commander v4.0 — 광고대행사 AI 관제탑</div>
  `;

  setTimeout(bindSettingsEvents, 50);
  return html;
}

function bindSettingsEvents() {
  const { data } = getApp();

  document.getElementById('exportExcelAll')?.addEventListener('click', () => { exportAllToExcel(data); showToast('📊 엑셀 다운로드 중...', 'success'); });
  document.getElementById('exportExcelClients')?.addEventListener('click', () => { exportClientsToExcel(data); showToast('👥 고객 엑셀 다운로드', 'success'); });
  document.getElementById('exportExcelTasks')?.addEventListener('click', () => { exportTasksToExcel(data); showToast('✅ 업무 엑셀 다운로드', 'success'); });
  document.getElementById('exportExcelRevenue')?.addEventListener('click', () => { exportRevenueToExcel(data); showToast('💰 매출 엑셀 다운로드', 'success'); });
  document.getElementById('exportSalesReport')?.addEventListener('click', () => { exportSalesReportToExcel(data); showToast('💰 매출보고 엑셀 다운로드', 'success'); });
  document.getElementById('settlementPDF')?.addEventListener('click', () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    generateSettlementPDF(data, month, data.settings);
    showToast('📄 정산서 PDF 생성 중...', 'success');
  });

  // #3 Dark Mode
  document.getElementById('toggleDarkMode')?.addEventListener('click', () => { toggleDarkMode(); navigate('settings'); });

  // PIN change
  document.getElementById('changePinBtn')?.addEventListener('click', () => {
    const newPin = document.getElementById('newPinInput')?.value;
    if (changePin(newPin)) {
      showToast('🔑 PIN이 변경되었습니다!', 'success');
      document.getElementById('newPinInput').value = '';
    } else {
      showToast('❌ 숫자 4자리를 입력해주세요', 'error');
    }
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('앱을 잠금합니다. PIN을 다시 입력해야 합니다.')) {
      logout();
    }
  });

  // Add Revenue
  document.getElementById('addRevenue')?.addEventListener('click', () => {
    const clients = data.clients || [];
    const modalHtml = `
      <div class="modal-header"><h3>💰 매출 입력</h3><button class="modal-close" data-close-modal>✕</button></div>
      <div class="modal-body">
        <div class="ai-input-group"><label class="ai-label">고객</label><select class="ai-select" id="rv_client"><option value="">직접 입력</option>${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div class="ai-input-group"><label class="ai-label">고객명 (직접 입력)</label><input class="ai-input" id="rv_name" placeholder="고객명" /></div>
        <div class="ai-input-group"><label class="ai-label field-required">금액 (원)</label><input class="ai-input" id="rv_amount" type="number" placeholder="500000" /></div>
        <div class="ai-input-group"><label class="ai-label">날짜</label><input class="ai-input" id="rv_date" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
        <div class="ai-input-group"><label class="ai-label">내용</label><input class="ai-input" id="rv_desc" placeholder="예: 3월 스마트스토어 마케팅 비용" /></div>
        <button class="btn btn-primary btn-full" id="rv_save">💾 매출 등록</button>
      </div>
    `;
    showModal(modalHtml);
    setTimeout(() => {
      document.getElementById('rv_client')?.addEventListener('change', (e) => {
        const client = data.clients.find(c => c.id === e.target.value);
        if (client) document.getElementById('rv_name').value = client.name;
      });
      document.getElementById('rv_save')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('rv_amount').value);
        if (!amount) { showToast('금액을 입력해주세요', 'warning'); return; }
        const clientId = document.getElementById('rv_client').value;
        const clientName = document.getElementById('rv_name').value || '미지정';
        if (!data.revenue) data.revenue = [];
        data.revenue.push({ id: generateId(), clientId, clientName, amount, date: document.getElementById('rv_date').value, description: document.getElementById('rv_desc').value, created: new Date().toISOString() });
        setData(data);
        closeModal();
        showToast(`💰 ${clientName} 매출 ${formatMoney(amount)}원 등록!`, 'success');
        navigate('settings');
      });
    }, 100);
  });

  // Save settings
  document.getElementById('saveAll')?.addEventListener('click', () => {
    data.settings.userName = document.getElementById('sName').value || '박성혁';
    data.settings.companyName = document.getElementById('sCompany').value || '';
    data.settings.bizNumber = document.getElementById('sBizNumber').value || '';
    data.settings.companyAddress = document.getElementById('sAddress').value || '';
    data.settings.bizType = document.getElementById('sBizType').value || '';
    data.settings.bizItem = document.getElementById('sBizItem').value || '';
    data.settings.companyEmail = document.getElementById('sCompanyEmail').value || '';
    data.settings.managerPhone = document.getElementById('sPhone').value || '';
    data.settings.managerEmail = document.getElementById('sEmail').value || '';
    data.settings.defaultSlotId = document.getElementById('sSlotId').value || 'stylepsh';
    data.settings.defaultSlotPw = document.getElementById('sSlotPw').value || '123456';
    data.settings.defaultManager = document.getElementById('sManager').value || '';
    data.settings.defaultPayer = document.getElementById('sPayer').value || '';
    setData(data);
    showToast('💾 설정이 저장되었습니다!', 'success');
  });

  // Export JSON
  document.getElementById('exportD')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `adcommander_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('📥 JSON 백업 다운로드', 'success');
  });

  // Import JSON
  document.getElementById('importD')?.addEventListener('click', () => document.getElementById('importFile')?.click());
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
          showToast('📤 데이터가 복원되었습니다!', 'success');
          location.reload();
        }
      } catch (err) { showToast('유효하지 않은 파일입니다', 'error'); }
    };
    reader.readAsText(file);
  });

  // #38 Restore backup
  document.querySelectorAll('[data-restore-backup]').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.restoreBackup;
      if (confirm(`${date} 백업을 복원하시겠습니까?`)) {
        const restored = restoreBackup(date);
        if (restored) { showToast(`🔄 ${date} 백업이 복원되었습니다!`, 'success'); location.reload(); }
        else showToast('복원 실패', 'error');
      }
    });
  });

  // #50 Restore from trash
  document.querySelectorAll('[data-restore-trash]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.restoreTrash);
      const restored = restoreFromTrash(idx);
      if (restored) {
        if (restored.type === 'client') data.clients.push(restored.item);
        else if (restored.type === 'task') data.tasks.push(restored.item);
        setData(data);
        showToast(`↩️ "${restored.item?.name || restored.item?.text}" 복원됨`, 'success');
        navigate('settings');
      }
    });
  });

  // Reset
  document.getElementById('resetD')?.addEventListener('click', () => {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('adcommander_v4_data');
      localStorage.removeItem('adcommander_v3_data');
      showToast('🗑️ 전체 데이터가 초기화되었습니다', 'warning');
      location.reload();
    }
  });
}
