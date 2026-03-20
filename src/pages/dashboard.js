/* ========================================
   Dashboard V4.0 — 관제탑 메인 화면
   미수금 패널, 이탈 위험, 마진 분석, D-Day 정렬 등
   ======================================== */
import { getApp, setData, navigate } from '../main.js';
import {
  getActiveClients, getTodayTasks, getOverdueTasks,
  getRevenueThisMonth, formatMoney, getToday, getDaysUntil,
  CLIENT_STATUS, SLOT_TYPES,
  getUnpaidTotal, getUnpaidClients, getInvoiceMissing,
  getChurnRiskClients, getSuccessRate, showToast,
  getRevenueByProduct
} from '../data.js';
import { exportAllToExcel } from '../excel.js';

export function renderDashboard() {
  const { data, DAYS_KR } = getApp();
  const today = new Date();
  const todayStr = getToday();
  const dow = today.getDay();
  const h = today.getHours();
  const greeting = h < 6 ? '새벽이에요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후에요' : '수고했어요';
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const activeClients = getActiveClients(data);
  const todayTasks = getTodayTasks(data);
  const overdueTasks = getOverdueTasks(data);
  const doneTodayTasks = todayTasks.filter(t => t.done).length;
  const monthRevenue = getRevenueThisMonth(data);
  const leads = data.clients.filter(c => c.status === 'lead').length;
  const unpaidTotal = getUnpaidTotal(data);
  const unpaidClients = getUnpaidClients(data);
  const invoiceMissing = getInvoiceMissing(data);
  const churnRisk = getChurnRiskClients(data);
  const successRate = getSuccessRate(data);

  const todaySlots = (data.slots || []).filter(s => s.created?.startsWith(todayStr));
  const expiringClients = data.clients.filter(c => {
    if (!c.endDate || c.status === 'completed' || c.status === 'churned') return false;
    const days = getDaysUntil(c.endDate);
    return days !== null && days >= 0 && days <= 7;
  }).sort((a, b) => getDaysUntil(a.endDate) - getDaysUntil(b.endDate));

  const recentSlots = (data.slots || []).slice(-3).reverse();
  const topProducts = getRevenueByProduct(data).slice(0, 3);

  // Daily report
  const dailyReportLines = [];
  if (todaySlots.length > 0) {
    dailyReportLines.push(`📋 슬롯 작업 ${todaySlots.length}건`);
    todaySlots.forEach(s => dailyReportLines.push(`  · ${SLOT_TYPES.find(t => t.value === s.type)?.label || s.type} — ${s.company || '-'} ${s.productName ? `(${s.productName})` : ''}`));
  }
  if (doneTodayTasks > 0) {
    dailyReportLines.push(`✅ 완료 업무 ${doneTodayTasks}건`);
    todayTasks.filter(t => t.done).forEach(t => dailyReportLines.push(`  · ${t.text}${t.clientName ? ` [${t.clientName}]` : ''}`));
  }
  if (todayTasks.filter(t => !t.done).length > 0) {
    dailyReportLines.push(`📌 진행중 업무 ${todayTasks.filter(t => !t.done).length}건`);
    todayTasks.filter(t => !t.done).forEach(t => dailyReportLines.push(`  · ${t.text}${t.clientName ? ` [${t.clientName}]` : ''}`));
  }
  const hasDailyReport = dailyReportLines.length > 0;

  const html = `
    <div class="greeting fade-in">
      <div class="greeting-time">${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${DAYS_KR[dow]}요일</div>
      <div class="greeting-text">${greeting}, <span>${data.settings.userName}</span>님</div>
    </div>

    <!-- KPI Cards (#6 color coding) -->
    <div class="kpi-grid stagger">
      <div class="card kpi-card fade-in" data-goto="clients">
        <div class="kpi-label">👥 진행중 고객</div>
        <div class="kpi-number" style="color:var(--accent-cyan)">${activeClients.length}</div>
        ${leads > 0 ? `<div class="kpi-sub">+ 상담중 ${leads}건</div>` : ''}
      </div>
      <div class="card kpi-card fade-in" data-goto="tasks">
        <div class="kpi-label">✅ 오늘 업무</div>
        <div class="kpi-number" style="color:var(--accent-green)">${doneTodayTasks}/${todayTasks.length}</div>
        ${overdueTasks.length > 0 ? `<div class="kpi-sub urgent">⚠️ 미완료 ${overdueTasks.length}건</div>` : ''}
      </div>
      <div class="card kpi-card fade-in">
        <div class="kpi-label">💰 이번달 매출</div>
        <div class="kpi-number" style="color:var(--accent-orange)">${formatMoney(monthRevenue)}</div>
        <div class="kpi-sub">원</div>
      </div>
      <div class="card kpi-card fade-in" data-goto="slots">
        <div class="kpi-label">📋 오늘 슬롯</div>
        <div class="kpi-number" style="color:var(--accent-purple)">${todaySlots.length}</div>
        <div class="kpi-sub">전체 ${(data.slots || []).length}건</div>
      </div>
    </div>

    <!-- #37 미수금 현황 패널 -->
    ${unpaidTotal > 0 ? `
      <div class="card fade-in" style="margin-bottom:16px;border-left:3px solid var(--accent-red);padding:14px 16px">
        <div class="flex-between mb-sm">
          <div style="font-weight:700;font-size:0.9rem;color:var(--accent-red)">💸 미수금 현황</div>
          <span style="font-size:1.1rem;font-weight:800;color:var(--accent-red)">${formatMoney(unpaidTotal)}원</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${unpaidClients.length}개 업체 미입금</div>
        ${unpaidClients.slice(0, 3).map(c => `
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px">· ${c.name} — ${formatMoney(c.amount)}원</div>
        `).join('')}
      </div>
    ` : ''}

    <!-- #24 계산서 누락 알림 -->
    ${invoiceMissing.length > 0 ? `
      <div class="card fade-in" style="margin-bottom:16px;border-left:3px solid var(--accent-yellow);padding:14px 16px">
        <div style="font-weight:700;font-size:0.9rem;color:var(--accent-yellow);margin-bottom:6px">🧾 계산서 미발행 (입금완료)</div>
        ${invoiceMissing.slice(0, 3).map(c => `
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px">· ${c.name} — ${formatMoney(c.amount)}원 (입금 완료, 계산서 미발행)</div>
        `).join('')}
      </div>
    ` : ''}

    <!-- #25 이탈 위험 고객 -->
    ${churnRisk.length > 0 ? `
      <div class="card fade-in" style="margin-bottom:16px;border-left:3px solid var(--accent-orange);padding:14px 16px">
        <div style="font-weight:700;font-size:0.9rem;color:var(--accent-orange);margin-bottom:6px">⚠️ 이탈 위험 고객 (${churnRisk.length}명)</div>
        ${churnRisk.slice(0, 3).map(c => `
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px">· ${c.name} — 마감 ${c.endDate} (연장 없음)</div>
        `).join('')}
      </div>
    ` : ''}

    <!-- #14 Expiring Alerts — D-Day 스마트 정렬 -->
    ${expiringClients.length > 0 ? `
      <div class="alert-card fade-in">
        <div class="alert-icon">⏰</div>
        <div class="alert-content">
          <div class="alert-title">마감 임박 고객 (${expiringClients.length}건)</div>
          ${expiringClients.map(c => {
            const days = getDaysUntil(c.endDate);
            return `<div class="alert-item">${c.name} — <span style="color:${days <= 2 ? 'var(--accent-red)' : 'var(--accent-orange)'};font-weight:600">${days === 0 ? '🔴 오늘 마감!' : `D-${days}`}</span></div>`;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- 📊 업무 보고 -->
    <div class="card fade-in" style="margin-bottom:20px;border:1px solid var(--border-active)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-weight:700;font-size:1rem">📊 오늘의 업무 보고</div>
        <span style="font-size:0.72rem;color:var(--text-muted)">${mm}.${dd} ${DAYS_KR[dow]}요일</span>
      </div>
      ${hasDailyReport ? `
        <div id="dailyReportContent" style="font-size:0.82rem;line-height:1.8;color:var(--text-secondary);margin-bottom:12px;white-space:pre-wrap">${dailyReportLines.join('\n')}</div>
        <div class="grid-2">
          <button class="btn btn-primary btn-sm" id="copyDailyReport">📋 카톡 복사</button>
          <button class="btn btn-secondary btn-sm" id="exportDailyExcel">📊 엑셀 저장</button>
        </div>
      ` : `
        <div style="font-size:0.82rem;color:var(--text-muted);padding:12px 0;text-align:center">
          오늘 기록된 작업이 없습니다.<br>슬롯 등록이나 업무를 추가하면 자동으로 보고서가 만들어집니다.
        </div>
      `}
    </div>

    <!-- #40 목표 순위 도달률 -->
    ${successRate.total > 0 ? `
      <div class="card fade-in" style="margin-bottom:20px;padding:14px 16px">
        <div class="flex-between mb-sm">
          <span style="font-weight:700;font-size:0.9rem">🎯 목표 순위 도달률</span>
          <span style="font-size:1.2rem;font-weight:800;color:${successRate.rate >= 70 ? 'var(--accent-green)' : successRate.rate >= 40 ? 'var(--accent-yellow)' : 'var(--accent-red)'}">${successRate.rate}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${successRate.rate}%"></div></div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px">${successRate.reached}/${successRate.total} 업체 목표 달성</div>
      </div>
    ` : ''}

    <!-- Today's Tasks -->
    <div class="section-header">
      <div class="section-title">📋 오늘 할 일</div>
      <button class="btn btn-sm btn-secondary" data-goto="tasks">${todayTasks.length > 0 ? `${doneTodayTasks}/${todayTasks.length}` : '추가'}</button>
    </div>
    ${todayTasks.length > 0 ? `
      <div class="stagger">
        ${todayTasks.slice(0, 5).map(t => `
          <div class="today-task fade-in ${t.done ? 'done' : ''}" data-toggle-task="${t.id}">
            <div class="checklist-checkbox">${t.done ? '✓' : ''}</div>
            ${t.clientName ? `<span class="task-client-tag">${t.clientName}</span>` : ''}
            <span class="task-text">${t.text}</span>
            ${t.priority ? `<span class="priority-dot" style="background:${t.priority === 'urgent' ? '#ef4444' : t.priority === 'high' ? '#f59e0b' : '#64748b'}"></span>` : ''}
          </div>
        `).join('')}
        ${todayTasks.length > 5 ? `<div style="text-align:center;padding:8px;font-size:0.8rem;color:var(--text-muted)">+${todayTasks.length - 5}개 더...</div>` : ''}
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:30px;color:var(--text-muted)">
        <div style="font-size:1.5rem;margin-bottom:8px">🎯</div>
        <div>오늘 등록된 업무가 없습니다</div>
        <button class="btn btn-sm btn-primary" style="margin-top:12px" data-goto="tasks">+ 업무 추가</button>
      </div>
    `}

    <!-- Quick Actions -->
    <div class="mt-lg">
      <div class="section-header"><div class="section-title">⚡ 빠른 실행</div></div>
      <div class="quick-actions stagger">
        <button class="quick-action-btn fade-in" data-goto="clients"><span class="qa-icon">👥</span><span>고객 등록</span></button>
        <button class="quick-action-btn fade-in" data-goto="tasks"><span class="qa-icon">📝</span><span>업무 추가</span></button>
        <button class="quick-action-btn fade-in" data-goto="slots"><span class="qa-icon">📋</span><span>슬롯 등록</span></button>
        <button class="quick-action-btn fade-in" data-goto="reports"><span class="qa-icon">📊</span><span>보고서</span></button>
      </div>
    </div>

    <!-- #32 수익 기여 TOP 상품 -->
    ${topProducts.length > 0 ? `
      <div class="mt-lg">
        <div class="section-header"><div class="section-title">🏆 수익 기여 TOP 상품</div></div>
        <div class="stagger">
          ${topProducts.map((p, i) => `
            <div class="card fade-in" style="margin-bottom:6px;padding:12px 16px">
              <div class="flex-between">
                <div>
                  <span style="font-size:0.72rem;color:var(--text-muted)">${i + 1}위</span>
                  <span style="font-weight:600;font-size:0.88rem;margin-left:6px">${p.name}</span>
                  <span style="font-size:0.72rem;color:var(--text-muted);margin-left:4px">(${p.count}건)</span>
                </div>
                <span style="font-weight:700;color:${p.totalMargin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};font-size:0.88rem">${p.totalMargin >= 0 ? '+' : ''}${formatMoney(p.totalMargin)}원</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Today's Slot Records -->
    ${todaySlots.length > 0 ? `
      <div class="mt-lg">
        <div class="section-header">
          <div class="section-title">📋 오늘 슬롯 기록 (${todaySlots.length}건)</div>
          <button class="btn btn-sm btn-primary" id="copyAllTodaySlots">전체 카톡 복사</button>
        </div>
        <div class="stagger">
          ${todaySlots.map((s, i) => `
            <div class="card fade-in" style="margin-bottom:8px;padding:12px 16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div>
                  <span class="slot-type-badge">${s.typeLabel || s.type}</span>
                  <span style="font-size:0.85rem;font-weight:600;margin-left:6px">${s.company || '-'}</span>
                </div>
                <button class="btn btn-sm btn-secondary" data-copy-slot="${i}">복사</button>
              </div>
              <div style="font-size:0.75rem;color:var(--text-muted);white-space:pre-wrap;max-height:60px;overflow:hidden">${(s.content || '').substring(0, 120)}...</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Recent Slots -->
    ${recentSlots.length > 0 && todaySlots.length === 0 ? `
      <div class="mt-lg">
        <div class="section-header">
          <div class="section-title">📋 최근 슬롯</div>
          <button class="btn btn-sm btn-secondary" data-goto="slots">전체</button>
        </div>
        <div class="stagger">
          ${recentSlots.map(s => `
            <div class="card fade-in" style="margin-bottom:8px;padding:12px 16px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <span class="slot-type-badge">${s.typeLabel || s.type}</span>
                  <span style="font-size:0.85rem;font-weight:600;margin-left:6px">${s.company || '-'}</span>
                </div>
                <span style="font-size:0.7rem;color:var(--text-muted)">${s.date || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Active Client List -->
    ${activeClients.length > 0 ? `
      <div class="mt-lg">
        <div class="section-header">
          <div class="section-title">🔄 진행중 고객</div>
          <button class="btn btn-sm btn-secondary" data-goto="clients">전체</button>
        </div>
        <div class="stagger">
          ${activeClients.slice(0, 5).map(c => `
            <div class="client-mini-card fade-in">
              <div class="client-mini-info">
                <div class="client-mini-name">${c.name}</div>
                <div class="client-mini-product">${c.product || c.workType || '-'}</div>
              </div>
              <div class="client-mini-meta">
                ${c.endDate ? `<span class="client-mini-deadline">${getDaysUntil(c.endDate) >= 0 ? `D-${getDaysUntil(c.endDate)}` : `${Math.abs(getDaysUntil(c.endDate))}일 초과`}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  setTimeout(() => {
    document.querySelectorAll('[data-toggle-task]').forEach(el => {
      el.addEventListener('click', () => {
        const taskId = el.dataset.toggleTask;
        const task = data.tasks.find(t => t.id === taskId);
        if (task) {
          task.done = !task.done;
          task.completedAt = task.done ? new Date().toISOString() : null;
          setData(data);
          showToast(task.done ? '✅ 업무 완료!' : '↩️ 업무 복원', 'success', 1500);
          navigate('dashboard');
        }
      });
    });

    document.getElementById('copyDailyReport')?.addEventListener('click', () => {
      const reportText = `[${mm}.${dd} ${DAYS_KR[dow]}요일 업무 보고]\n\n${dailyReportLines.join('\n')}\n\n고객지원팀장 박성혁`;
      navigator.clipboard.writeText(reportText);
      showToast('📋 업무 보고가 복사되었습니다!', 'success');
      if (!data.dailyLogs) data.dailyLogs = {};
      data.dailyLogs[todayStr] = { memo: reportText, slotsCount: todaySlots.length, tasksCompleted: doneTodayTasks, saved: new Date().toISOString() };
      setData(data);
    });

    document.getElementById('exportDailyExcel')?.addEventListener('click', () => {
      exportAllToExcel(data);
      showToast('📊 엑셀 파일이 다운로드됩니다!', 'success');
    });

    document.getElementById('copyAllTodaySlots')?.addEventListener('click', () => {
      const allContent = todaySlots.map(s => s.content).join('\n\n──────────\n\n');
      navigator.clipboard.writeText(allContent);
      showToast('📋 오늘 슬롯 전체가 복사되었습니다!', 'success');
    });

    document.querySelectorAll('[data-copy-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.copySlot);
        const slot = todaySlots[idx];
        if (slot?.content) {
          navigator.clipboard.writeText(slot.content);
          showToast('📋 슬롯이 복사되었습니다!', 'success', 1500);
        }
      });
    });
  }, 50);

  return html;
}
