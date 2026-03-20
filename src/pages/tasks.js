/* ========================================
   Tasks — 업무 센터 (할일/한일 관리)
   ======================================== */
import { getApp, setData, navigate, showModal, closeModal } from '../main.js';
import {
  generateId, getToday, formatDate,
  TASK_PRIORITIES, getOverdueTasks
} from '../data.js';

let viewMode = 'today'; // today, all, done, overdue
let taskFilter = '';

export function renderTasks() {
  const { data } = getApp();
  const today = getToday();
  let tasks = [...data.tasks];

  // Filter
  switch (viewMode) {
    case 'today': tasks = tasks.filter(t => t.date === today); break;
    case 'overdue': tasks = getOverdueTasks(data); break;
    case 'done': tasks = tasks.filter(t => t.done); break;
    case 'all': break;
  }

  if (taskFilter) {
    const q = taskFilter.toLowerCase();
    tasks = tasks.filter(t =>
      (t.text || '').toLowerCase().includes(q) ||
      (t.clientName || '').toLowerCase().includes(q)
    );
  }

  // Sort: undone first, then by priority, then by time
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const todayTasks = data.tasks.filter(t => t.date === today);
  const todayDone = todayTasks.filter(t => t.done).length;
  const overdue = getOverdueTasks(data);
  const todayProgress = todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  const html = `
    <div class="card fade-in" style="margin-bottom:20px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">✅</div>
      <div style="font-size:1.1rem;font-weight:700">업무 센터</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">할 일 · 한 일 · 진행 상황 추적</div>
    </div>

    <!-- Today Progress -->
    <div class="progress-container fade-in">
      <div class="progress-header">
        <span>오늘 진행률</span>
        <span style="color:var(--accent-blue-light);font-weight:700">${todayProgress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${todayProgress}%"></div></div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${todayDone} / ${todayTasks.length} 완료 ${overdue.length > 0 ? `· <span style="color:var(--accent-red)">미완료 ${overdue.length}건</span>` : ''}</div>
    </div>

    <!-- View Tabs -->
    <div class="view-tabs fade-in">
      <button class="view-tab ${viewMode === 'today' ? 'active' : ''}" data-view="today">📅 오늘</button>
      <button class="view-tab ${viewMode === 'all' ? 'active' : ''}" data-view="all">📋 전체</button>
      <button class="view-tab ${viewMode === 'overdue' ? 'active' : ''}" data-view="overdue">⚠️ 지연 ${overdue.length > 0 ? `(${overdue.length})` : ''}</button>
      <button class="view-tab ${viewMode === 'done' ? 'active' : ''}" data-view="done">✅ 완료</button>
    </div>

    <!-- Search -->
    <div class="ai-input-group fade-in" style="margin-top:12px">
      <input class="ai-input" id="taskSearch" placeholder="🔍 업무 검색..." value="${taskFilter}" />
    </div>

    <!-- Add Button -->
    <button class="btn btn-primary btn-full fade-in" id="addTask" style="margin-bottom:20px">
      ➕ 새 업무 추가
    </button>

    <!-- Task List -->
    ${tasks.length > 0 ? `
      <div class="stagger">
        ${tasks.map(t => {
          const pri = TASK_PRIORITIES.find(p => p.value === t.priority);
          const isOverdue = !t.done && t.date && t.date < today;
          return `
            <div class="task-card fade-in ${t.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}" >
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

    <!-- Quick Add -->
    <div class="quick-add-bar fade-in" style="margin-top:16px">
      <input class="ai-input" id="quickTaskInput" placeholder="빠른 추가: 할 일 입력 후 Enter" />
    </div>
  `;

  setTimeout(bindTaskEvents, 50);
  return html;
}

function bindTaskEvents() {
  const { data } = getApp();

  // View mode
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      viewMode = el.dataset.view;
      navigate('tasks');
    });
  });

  // Search
  document.getElementById('taskSearch')?.addEventListener('input', (e) => {
    taskFilter = e.target.value;
    navigate('tasks');
  });

  // Toggle task
  document.querySelectorAll('[data-toggle-task]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = data.tasks.find(t => t.id === el.dataset.toggleTask);
      if (task) {
        task.done = !task.done;
        task.completedAt = task.done ? new Date().toISOString() : null;
        setData(data);
        navigate('tasks');
      }
    });
  });

  // Delete task
  document.querySelectorAll('[data-delete-task]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      data.tasks = data.tasks.filter(t => t.id !== el.dataset.deleteTask);
      setData(data);
      navigate('tasks');
    });
  });

  // Edit task
  document.querySelectorAll('[data-edit-task]').forEach(el => {
    el.addEventListener('click', () => {
      const task = data.tasks.find(t => t.id === el.dataset.editTask);
      if (task) showTaskForm(task);
    });
  });

  // Add task
  document.getElementById('addTask')?.addEventListener('click', () => {
    showTaskForm();
  });

  // Quick add
  document.getElementById('quickTaskInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      data.tasks.push({
        id: generateId(),
        text,
        date: getToday(),
        priority: 'medium',
        done: false,
        createdAt: new Date().toISOString(),
      });
      setData(data);
      navigate('tasks');
    }
  });
}

function showTaskForm(existing = null) {
  const isEdit = !!existing;
  const t = existing || {};
  const { data } = getApp();

  const modalHtml = `
    <div class="modal-header">
      <h3>${isEdit ? '업무 수정' : '새 업무 추가'}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <div class="ai-input-group">
        <label class="ai-label">업무 내용 *</label>
        <input class="ai-input" id="tf_text" value="${t.text || ''}" placeholder="예: 루멘트 슬롯 셋팅" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="ai-input-group">
          <label class="ai-label">날짜</label>
          <input class="ai-input" id="tf_date" type="date" value="${t.date || getToday()}" />
        </div>
        <div class="ai-input-group">
          <label class="ai-label">우선순위</label>
          <select class="ai-select" id="tf_priority">
            ${TASK_PRIORITIES.map(p => `<option value="${p.value}" ${t.priority === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">관련 고객</label>
        <select class="ai-select" id="tf_client">
          <option value="">없음</option>
          ${data.clients.map(c => `<option value="${c.id}" ${t.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="ai-input-group">
        <label class="ai-label">메모</label>
        <textarea class="ai-textarea" id="tf_memo" style="min-height:60px" placeholder="추가 메모...">${t.memo || ''}</textarea>
      </div>
      <button class="btn btn-primary btn-full" id="tf_save">💾 ${isEdit ? '수정 저장' : '업무 등록'}</button>
    </div>
  `;

  showModal(modalHtml);

  setTimeout(() => {
    document.getElementById('tf_save')?.addEventListener('click', () => {
      const text = document.getElementById('tf_text').value.trim();
      if (!text) { alert('업무 내용을 입력해주세요'); return; }

      const clientId = document.getElementById('tf_client').value;
      const client = data.clients.find(c => c.id === clientId);

      const taskData = {
        id: t.id || generateId(),
        text,
        date: document.getElementById('tf_date').value,
        priority: document.getElementById('tf_priority').value,
        clientId: clientId || null,
        clientName: client?.name || null,
        memo: document.getElementById('tf_memo').value.trim(),
        done: t.done || false,
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
      navigate('tasks');
    });
  }, 100);
}
