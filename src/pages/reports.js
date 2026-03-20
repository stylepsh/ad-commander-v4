/* ========================================
   Reports V4.0 — 고객 보고서 생성 (카톡 복사용)
   연장 안내 자동 생성, 일괄 보고, 보고 기록 관리
   ======================================== */
import { getApp, setData, navigate } from '../main.js';
import { REPORT_TEMPLATES, formatDate, generateId, showToast, getDaysUntil } from '../data.js';

export function renderReports() {
  const { data } = getApp();
  const clients = data.clients || [];
  const activeClients = clients.filter(c => ['contract', 'active'].includes(c.status));
  const reportHistory = data.reportHistory || [];

  // #27 Auto-detect clients needing extension notice
  const expiringClients = activeClients.filter(c => {
    const days = getDaysUntil(c.endDate);
    return days !== null && days >= 0 && days <= 5;
  });

  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">📊</div>
      <div style="font-size:1.1rem;font-weight:700">고객 보고서</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">고객별 보고서 작성 → 카톡에 바로 복사</div>
    </div>

    <!-- #27 Extension Notice Alert -->
    ${expiringClients.length > 0 ? `
      <div class="card fade-in" style="margin-bottom:16px;border-left:3px solid var(--accent-orange);padding:14px 16px">
        <div style="font-weight:700;font-size:0.9rem;color:var(--accent-orange);margin-bottom:8px">🔄 연장 안내 필요 고객 (${expiringClients.length}건)</div>
        ${expiringClients.map(c => `
          <div class="flex-between" style="margin-bottom:6px">
            <span style="font-size:0.82rem">${c.name} <span style="color:var(--accent-red);font-size:0.75rem">D-${getDaysUntil(c.endDate)}</span></span>
            <button class="btn btn-sm btn-primary" data-send-extend="${c.id}">연장 안내 →</button>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="ai-input-group fade-in">
      <label class="ai-label">고객 선택</label>
      <select class="ai-select" id="reportClient">
        <option value="">-- 고객 선택 --</option>
        ${activeClients.map(c => `<option value="${c.id}">${c.name} (${c.product || '-'})</option>`).join('')}
        <option disabled>──────────</option>
        ${clients.filter(c => !['contract', 'active'].includes(c.status)).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">보고서 유형</label>
      <select class="ai-select" id="reportType">
        ${Object.entries(REPORT_TEMPLATES).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}
      </select>
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">오늘 작업 내용</label>
      <textarea class="ai-textarea" id="reportWork" style="min-height:80px" placeholder="- 트래픽 작업 3회 진행&#10;- 키워드 순위 확인&#10;- 찜하기 50건 완료"></textarea>
    </div>

    <div class="grid-2 fade-in">
      <div class="ai-input-group"><label class="ai-label">현재 순위</label><input class="ai-input" id="reportCurrentRank" type="number" placeholder="예: 25" /></div>
      <div class="ai-input-group"><label class="ai-label">목표 순위</label><input class="ai-input" id="reportTargetRank" type="number" placeholder="예: 10" /></div>
    </div>

    <div class="ai-input-group fade-in">
      <label class="ai-label">추가 메모 (선택)</label>
      <input class="ai-input" id="reportMemo" placeholder="예: 키워드 변경 요청 있음" />
    </div>

    <button class="btn btn-primary btn-full fade-in mb-sm" id="reportGenerate">📝 보고서 생성</button>

    <div id="reportPreview" class="slot-preview-card fade-in" style="display:none"></div>

    <div class="grid-2 mb-lg">
      <button class="btn btn-secondary btn-full" id="reportCopy" style="display:none">📋 카톡 복사</button>
      <button class="btn btn-secondary btn-full" id="reportSave" style="display:none">💾 기록 저장</button>
    </div>

    ${activeClients.length > 0 ? `
      <div class="section-header"><div class="section-title">⚡ 빠른 보고 (진행중 고객)</div></div>
      <div class="stagger">
        ${activeClients.map(c => `
          <div class="card fade-in" style="margin-bottom:8px;padding:14px 16px;cursor:pointer" data-quick-report="${c.id}">
            <div class="flex-between">
              <div>
                <div style="font-weight:600;font-size:0.9rem">${c.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${c.product || '-'} ${c.currentRank ? `| ${c.currentRank}위` : ''}</div>
              </div>
              <span class="btn btn-sm btn-secondary">보고서 →</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:30px;color:var(--text-muted)">
        <div style="font-size:1.5rem;margin-bottom:8px">📭</div>
        <div>진행중인 고객이 없습니다</div>
        <button class="btn btn-sm btn-primary mt-sm" data-goto="clients">고객 등록하기</button>
      </div>
    `}

    ${reportHistory.length > 0 ? `
      <div class="mt-lg">
        <div class="section-header"><div class="section-title">📚 보고 기록 (${reportHistory.length}건)</div></div>
        ${reportHistory.slice(-10).reverse().map(r => `
          <div class="card fade-in" style="margin-bottom:8px;padding:12px 16px;cursor:pointer" data-load-report="${r.id}">
            <div class="flex-between">
              <div><span style="font-size:0.85rem;font-weight:600">${r.clientName}</span><span style="font-size:0.7rem;color:var(--text-muted);margin-left:6px">${r.typeLabel}</span></div>
              <span style="font-size:0.7rem;color:var(--text-muted)">${r.date}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  setTimeout(bindReportEvents, 50);
  return html;
}

function bindReportEvents() {
  const { data } = getApp();

  // Auto-fill when client selected
  document.getElementById('reportClient')?.addEventListener('change', (e) => {
    const client = data.clients.find(c => c.id === e.target.value);
    if (client) {
      const crEl = document.getElementById('reportCurrentRank');
      const trEl = document.getElementById('reportTargetRank');
      if (crEl && client.currentRank) crEl.value = client.currentRank;
      if (trEl && client.targetRank) trEl.value = client.targetRank;
    }
  });

  // Quick report
  document.querySelectorAll('[data-quick-report]').forEach(el => {
    el.addEventListener('click', () => {
      const select = document.getElementById('reportClient');
      if (select) { select.value = el.dataset.quickReport; select.dispatchEvent(new Event('change')); select.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  });

  // #27 Send extension notice
  document.querySelectorAll('[data-send-extend]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const client = data.clients.find(c => c.id === el.dataset.sendExtend);
      if (client) {
        const template = REPORT_TEMPLATES.extend_notice;
        const content = template.template(client);
        navigator.clipboard.writeText(content);
        showToast(`🔄 ${client.name} 연장 안내가 복사되었습니다!`, 'success');
      }
    });
  });

  // Generate
  document.getElementById('reportGenerate')?.addEventListener('click', () => {
    const clientId = document.getElementById('reportClient').value;
    const reportType = document.getElementById('reportType').value;
    const work = document.getElementById('reportWork').value;
    const currentRank = document.getElementById('reportCurrentRank').value;
    const targetRank = document.getElementById('reportTargetRank').value;
    const memo = document.getElementById('reportMemo').value;
    const client = data.clients.find(c => c.id === clientId) || { name: '미선택' };
    const reportClient = { ...client, currentRank: currentRank || client.currentRank, targetRank: targetRank || client.targetRank };
    const template = REPORT_TEMPLATES[reportType];
    let content = template.template(reportClient, work);
    if (memo) content += `\n\n📌 ${memo}`;
    const preview = document.getElementById('reportPreview');
    if (preview) { preview.textContent = content; preview.style.display = 'block'; }
    const copyBtn = document.getElementById('reportCopy');
    const saveBtn = document.getElementById('reportSave');
    if (copyBtn) copyBtn.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'block';
  });

  // Copy
  document.getElementById('reportCopy')?.addEventListener('click', () => {
    const preview = document.getElementById('reportPreview');
    if (preview?.textContent) {
      navigator.clipboard.writeText(preview.textContent);
      showToast('📋 보고서가 복사되었습니다!', 'success');
    }
  });

  // Save
  document.getElementById('reportSave')?.addEventListener('click', () => {
    const preview = document.getElementById('reportPreview');
    const clientId = document.getElementById('reportClient').value;
    const reportType = document.getElementById('reportType').value;
    const client = data.clients.find(c => c.id === clientId);
    const template = REPORT_TEMPLATES[reportType];
    if (!data.reportHistory) data.reportHistory = [];
    data.reportHistory.push({
      id: generateId(), clientId, clientName: client?.name || '미선택',
      type: reportType, typeLabel: template?.label || reportType,
      content: preview?.textContent || '',
      date: `${new Date().getMonth() + 1}.${String(new Date().getDate()).padStart(2, '0')}`,
      created: new Date().toISOString(),
    });
    setData(data);
    showToast('💾 보고서가 저장되었습니다!', 'success');
  });

  // Load from history
  document.querySelectorAll('[data-load-report]').forEach(el => {
    el.addEventListener('click', () => {
      const report = (data.reportHistory || []).find(r => r.id === el.dataset.loadReport);
      if (report) {
        const preview = document.getElementById('reportPreview');
        if (preview) { preview.textContent = report.content; preview.style.display = 'block'; }
        const copyBtn = document.getElementById('reportCopy');
        const saveBtn = document.getElementById('reportSave');
        if (copyBtn) copyBtn.style.display = 'block';
        if (saveBtn) saveBtn.style.display = 'block';
      }
    });
  });
}
