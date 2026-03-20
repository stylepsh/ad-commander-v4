/* ========================================
   Tasks V4.0 — 업무 센터
   반복 업무, 빠른 완료, 벌크 액션, 스와이프 삭제
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal } from '../main.js';
import {
  generateId, getToday, formatDate,
  TASK_PRIORITIES, getOverdueTasks, showToast, moveToTrash
} from '../data.js';

let viewMode = 'today';
let taskFilter = '';

export function renderTasks() {
  const { data } = getApp();
  const today = getToday();
  let tasks = [...data.tasks];

  switch (viewMode) {
    case 'today': tasks = tasks.filter(t => t.date === today); break;
    case 'overdue': tasks = getOverdueTasks(data); break;
    case 'done': tasks = tasks.filter(t => t.done); break;
    case 'all': break;
  }

  if (taskFilter) {
    const q = taskFilter.toLowerCase();
    tasks = tasks.filter(t => (t.text || '').toLowerCase().includes(q) || (t.clientName || '').toLowerCase().includes(q) || (t.memo || '').toLowerCase().includes(q));
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const todayTasks = data.tasks.filter(t => t.date === today);
  const todayDone = todayTasks.filter(t => t.done).length;
  const overdue = getOverdueTasks(data);
  const todayProgress = todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  // #44 Recurring task check
  const allTasks = data.tasks.filter(t => t.recurring && !t.done && t.date < today);
  if (allTasks.length > 0) {
    allTasks.forEach(t => {
      const existing = data.tasks.find(x => x.text === t.text && x.date === today);
      if (!existing) {
        data.tasks.push({
          id: generateId(), text: t.text, date: today, priority: t.priority,
          clientId: t.clientId, clientName: t.clientName, memo: t.memo,
          done: false, recurring: t.recurring, createdAt: new Date().toISOString(),
        });
      }
    });
    setData(data);
  }

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">✅</div>
      <div style="font-size:1.1rem;font-weight:700">업무 센터</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">할 일 · 한 일 · 진행 상황 추적</div>
    </div>

    <div class="progress-container fade-in">
      <div class="progress-header">
        <span>오늘 진행률</span>
        <span style="color:var(--accent-blue-light);font-weight:700">${todayProgress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${todayProgress}%"></div></div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${todayDone} / ${todayTasks.length} 완료 ${overdue.length > 0 ? `· <span style="color:var(--accent-red)">미완료 ${overdue.length}건</span>` : ''}</div>
    </div>

    <div class="view-tabs fade-in">
      <button class="view-tab ${viewMode === 'today' ? 'active' : ''}" data-view="today">📅 오늘</button>
      <button class="view-tab ${viewMode === 'all' ? 'active' : ''}" data-view="all">📋 전체</button>
      <button class="view-tab ${viewMode === 'overdue' ? 'active' : ''}" data-view="overdue">⚠️ 지연 ${overdue.length > 0 ? `(${overdue.length})` : ''}</button>
      <button class="view-tab ${viewMode === 'done' ? 'active' : ''}" data-view="done">✅ 완료</button>
    </div>

    <div class="ai-input-group fade-in" style="margin-top:12px">
      <input class="ai-input" id="taskSearch" placeholder="🔍 업무 검색..." value="${taskFilter}" />
    </div>

    <!-- #46 Bulk actions -->
    ${viewMode === 'done' && tasks.length > 0 ? `
      <button class="btn btn-secondary btn-full fade-in mb-md" id="clearDoneTasks" style="font-size:0.82rem;color:var(--text-muted)">🗑️ 완료된 업무 전체 정리</button>
    ` : ''}
    ${viewMode === 'overdue' && overdue.length > 0 ? `
      <button class="btn btn-secondary btn-full fade-in mb-md" id="moveOverdueToToday" style="font-size:0.82rem;color:var(--accent-orange)">📅 지연 업무 → 오늘로 이동 (${overdue.length}건)</button>
    ` : ''}

    <button class="btn btn-primary btn-full fade-in" id="addTask" style="margin-bottom:20px">➕ 새 업무 추가</button>

    ${tasks.length > 0 ? `
      <div class="stagger">
        ${tasks.map(t => {
          const pri = TASK_PRIORITIES.find(p => p.value === t.priority);
          const isOverdue = !t.done && t.date && t.date < today;
          return `
            <div class="task-card fade-in ${t.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}">
              <div class="task-card-left" data-toggle-task="${t.id}">
                <div class="checklist-checkbox">${t.done ? '✓' : ''}</div>
              </div>
              <div class="task-card-body" data-edit-task="${t.id}">
                <div class="task-card-text">${t.text}</div>
                <div class="task-card-meta">
                  ${t.clientName ? `<span class="task-client-tag">${t.clientName}</span>` : ''}
                  ${pri ? `<span style="color:${pri.color};font-size:0.68rem">${pri.label}</span>` : ''}
                  ${t.date ? `<span style="font-size:0.68rem;color:var(--text-muted)">${formatDate(t.date)}</span>` : ''}
                  ${isOverdue ? '<span style="font-size:0.68rem;color:var(--accent-red)">지연</span>' : ''}
                  ${t.recurring ? '<span style="font-size:0.68rem;color:var(--accent-purple)">🔄 반복</span>' : ''}
                </div>
              </div>
              <button class="task-delete-btn" data-delete-task="${t.id}">✕</button>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="card" style="text-align:center;padding:30px;color:var(--text-muted)">
        <div style="font-size:1.5rem;margin-bottom:8px">📭</div>
        <div>${viewMode === 'today' ? '오늘 등록된 업무가 없습니다' : viewMode === 'overdue' ? '지연된 업무가 없습니다 👍' : '업무를 추가해주세요'}</div>
      </div>
    `}

    <div class="quick-add-bar fade-in mt-md">
      <input class="ai-input" id="quickTaskInput" placeholder="빠른 추가: 할 일 입력 후 Enter ⏎" />
    </div>
  `;

  setTimeout(bindTaskEvents, 50);
  return html;
}

function bindTaskEvents() {
  const { data } = getApp();
  const today = getToday();

  document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => { viewMode = el.dataset.view; navigate('tasks'); }));
  document.getElementById('taskSearch')?.addEventListener('input', e => { taskFilter = e.target.value; navigate('tasks'); });

  document.querySelectorAll('[data-toggle-task]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const task = data.tasks.find(t => t.id === el.dataset.toggleTask);
      if (task) {
        task.done = !task.done;
        task.completedAt = task.done ? new Date().toISOString() : null;
        setData(data);
        showToast(task.done ? '✅ 업무 완료!' : '↩️ 업무 복원', 'success', 1500);
        navigate('tasks');
      }
    });
  });

  // #50 Trash for tasks
  document.querySelectorAll('[data-delete-task]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const task = data.tasks.find(t => t.id === el.dataset.deleteTask);
      if (task) moveToTrash('task', task);
      data.tasks = data.tasks.filter(t => t.id !== el.dataset.deleteTask);
      setData(data);
      showToast('🗑️ 업무가 삭제되었습니다', 'info', 1500);
      navigate('tasks');
    });
  });

  document.querySelectorAll('[data-edit-task]').forEach(el => {
    el.addEventListener('click', () => {
      const task = data.tasks.find(t => t.id === el.dataset.editTask);
      if (task) showTaskForm(task);
    });
  });

  document.getElementById('addTask')?.addEventListener('click', () => showTaskForm());

  // Quick add with Enter
  document.getElementById('quickTaskInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      data.tasks.push({ id: generateId(), text, date: getToday(), priority: 'medium', done: false, createdAt: new Date().toISOString() });
      setData(data);
      showToast(`📝 "${text}" 추가됨`, 'success', 1500);
      navigate('tasks');
    }
  });

  // #46 Bulk actions
  document.getElementById('clearDoneTasks')?.addEventListener('click', () => {
    const doneTasks = data.tasks.filter(t => t.done);
    if (confirm(`완료된 업무 ${doneTasks.length}건을 정리하시겠습니까?`)) {
      doneTasks.forEach(t => moveToTrash('task', t));
      data.tasks = data.tasks.filter(t => !t.done);
      setData(data);
      showToast(`🗑️ ${doneTasks.length}건 정리됨`, 'info');
      navigate('tasks');
    }
  });

  document.getElementById('moveOverdueToToday')?.addEventListener('click', () => {
    const overdue = getOverdueTasks(data);
    overdue.forEach(t => { t.date = today; });
    setData(data);
    showToast(`📅 ${overdue.length}건이 오늘로 이동됨`, 'success');
    viewMode = 'today';
    navigate('tasks');
  });
}

function showTaskForm(existing = null) {
  const isEdit = !!existing;
  const t = existing || {};
  const { data } = getApp();

  const modalHtml = `
    <div class="modal-header"><h3>${isEdit ? '업무 수정' : '새 업무 추가'}</h3><button class="modal-close" data-close-modal>✕</button></div>
    <div class="modal-body">
      <div class="ai-input-group"><label class="ai-label field-required">업무 내용</label><input class="ai-input" id="tf_text" value="${t.text || ''}" placeholder="예: 루멘트 슬롯 셋팅" /></div>
      <div class="grid-2">
        <div class="ai-input-group"><label class="ai-label">날짜</label><input class="ai-input" id="tf_date" type="date" value="${t.date || getToday()}" /></div>
        <div class="ai-input-group"><label class="ai-label">우선순위</label>
          <select class="ai-select" id="tf_priority">${TASK_PRIORITIES.map(p => `<option value="${p.value}" ${t.priority === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}</select>
        </div>
      </div>
      <div class="ai-input-group"><label class="ai-label">관련 고객</label>
        <select class="ai-select" id="tf_client"><option value="">없음</option>${data.clients.map(c => `<option value="${c.id}" ${t.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
      </div>
      <div class="ai-input-group"><label class="ai-label">메모</label><textarea class="ai-textarea" id="tf_memo" style="min-height:60px" placeholder="추가 메모...">${t.memo || ''}</textarea></div>

      <!-- #44 Recurring task toggle -->
      <div class="settings-item" style="margin-bottom:16px">
        <div>
          <div class="settings-item-label">🔄 반복 업무</div>
          <div class="settings-item-desc">매일 자동으로 다시 추가됩니다</div>
        </div>
        <div class="toggle ${t.recurring ? 'on' : ''}" id="tf_recurring"></div>
      </div>

      <button class="btn btn-primary btn-full" id="tf_save">💾 ${isEdit ? '수정 저장' : '업무 등록'}</button>
    </div>
  `;

  showModal(modalHtml);

  let recurring = t.recurring || false;
  setTimeout(() => {
    document.getElementById('tf_recurring')?.addEventListener('click', () => {
      recurring = !recurring;
      document.getElementById('tf_recurring').classList.toggle('on');
    });

    document.getElementById('tf_save')?.addEventListener('click', () => {
      const text = document.getElementById('tf_text').value.trim();
      if (!text) { showToast('업무 내용을 입력해주세요', 'warning'); return; }

      const clientId = document.getElementById('tf_client').value;
      const client = data.clients.find(c => c.id === clientId);

      const taskData = {
        id: t.id || generateId(), text,
        date: document.getElementById('tf_date').value,
        priority: document.getElementById('tf_priority').value,
        clientId: clientId || null,
        clientName: client?.name || null,
        memo: document.getElementById('tf_memo').value.trim(),
        done: t.done || false, recurring,
        createdAt: t.createdAt || new Date().toISOString(),
      };

      if (isEdit) {
        const idx = data.tasks.findIndex(x => x.id === t.id);
        if (idx >= 0) data.tasks[idx] = taskData;
      } else {
        data.tasks.push(taskData);
      }
      setData(data);
      closeModal();
      showToast(isEdit ? `✏️ 업무가 수정되었습니다` : `📝 "${text}" 업무가 등록되었습니다`, 'success');
      navigate('tasks');
    });
  }, 100);
}
