/* This is a self-contained demonstration; there are no network requests or real user records. */
(() => {
  'use strict';
  const STORE = 'prio-public-demo-v1';
  const samples = [
    {id:1,title:'Review onboarding flow',team:'Product',owner:'Alex Morgan',due:'Today',priority:'High',status:'In progress',description:'Review the revised onboarding screens and share feedback before the team handoff.',mine:true,approval:false},
    {id:2,title:'QA notification states',team:'Engineering',owner:'Alex Morgan',due:'Today',priority:'Medium',status:'To do',description:'Check the updated notifications across empty, unread, and dismissed states.',mine:true,approval:false},
    {id:3,title:'Prepare weekly handoff',team:'Operations',owner:'Alex Morgan',due:'Yesterday',priority:'Low',status:'Completed',description:'Summarise priorities and decisions for the next weekly planning session.',mine:true,approval:false},
    {id:4,title:'Update team capacity notes',team:'Operations',owner:'Alex Morgan',due:'Tomorrow',priority:'Medium',status:'To do',description:'Align the team’s availability with the current release commitments.',mine:true,approval:false},
    {id:5,title:'Approve accessibility pass',team:'Design',owner:'Maya Chen',due:'Today',priority:'High',status:'Needs review',description:'The design team has completed the keyboard and contrast checks. Review and decide whether the work is ready to close.',mine:false,approval:true},
    {id:6,title:'Sign off release checklist',team:'Engineering',owner:'Noah Brooks',due:'Tomorrow',priority:'High',status:'Needs review',description:'Review the checklist for the upcoming release and record a decision.',mine:false,approval:true},
    {id:7,title:'Finalize release notes',team:'Product',owner:'Maya Chen',due:'Friday',priority:'High',status:'In progress',description:'Consolidate the release notes into a short, clear summary for the wider team.',mine:false,approval:false},
    {id:8,title:'Publish deployment guide',team:'Engineering',owner:'Noah Brooks',due:'Thursday',priority:'Medium',status:'Completed',description:'Publish the deployment guide for the engineering team.',mine:false,approval:false},
    {id:9,title:'Confirm testing scope',team:'Engineering',owner:'Iris Patel',due:'Today',priority:'Low',status:'In progress',description:'Confirm the regression scope and owners for the next testing cycle.',mine:false,approval:false},
  ];
  const els = {
    title:document.getElementById('view-title'),subtitle:document.getElementById('view-subtitle'),stats:document.getElementById('stats'),list:document.getElementById('task-list'),search:document.getElementById('task-search'),filter:document.getElementById('task-filter'),listTitle:document.getElementById('list-title'),listSubtitle:document.getElementById('list-subtitle'),countMine:document.getElementById('count-mine'),countApprovals:document.getElementById('count-approvals'),sheet:document.getElementById('detail-sheet'),detail:document.getElementById('detail-content'),create:document.getElementById('create-dialog'),form:document.getElementById('create-form'),toast:document.getElementById('toast')
  };
  const viewMeta = {
    mine:{title:'My work',subtitle:'Tasks assigned to Alex Morgan.',heading:'Assigned tasks',helper:'Sample tasks for Alex Morgan'},
    team:{title:'Team priorities',subtitle:'See the team’s work without asking for a status update.',heading:'All team tasks',helper:'A fictional cross-functional team'},
    approvals:{title:'Approvals',subtitle:'Decisions move work forward.',heading:'Review queue',helper:'Review sample requests and make a decision'}
  };
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['To do', 'In progress', 'Completed', 'Needs review', 'Approved', 'Rejected'];

  function validTask(task) {
    return task && Number.isSafeInteger(task.id) && task.id > 0
      && ['title', 'team', 'owner', 'due', 'description'].every(key => typeof task[key] === 'string')
      && priorities.includes(task.priority) && statuses.includes(task.status)
      && typeof task.mine === 'boolean' && typeof task.approval === 'boolean';
  }

  function loadTasks() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE));
      if (Array.isArray(stored) && stored.every(validTask)
        && new Set(stored.map(task => task.id)).size === stored.length) {
        return stored;
      }
    } catch {
      // The demo also runs with storage disabled.
    }
    return structuredClone(samples);
  }

  let tasks = loadTasks();
  const initialView = new URLSearchParams(location.search).get('view');
  let view = Object.hasOwn(viewMeta, initialView) ? initialView : 'mine';
  let currentId = null;
  let toastTimer;
  const save = () => { try {localStorage.setItem(STORE,JSON.stringify(tasks))} catch {} };
  const esc = (s) => String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const active = t => t.status !== 'Completed' && t.status !== 'Approved' && t.status !== 'Rejected';
  const isApproved = t => t.status === 'Approved';
  function notify(message) {els.toast.textContent = message;els.toast.classList.add('show');clearTimeout(toastTimer);toastTimer = setTimeout(()=>els.toast.classList.remove('show'),2400)}
  function getVisible() {
    const q=els.search.value.toLowerCase().trim();const f=els.filter.value;
    return tasks.filter(t=>view==='mine'?t.mine:view==='approvals'?t.approval:true).filter(t=>!q || [t.title,t.team,t.owner].some(x=>x.toLowerCase().includes(q))).filter(t=>f==='all'||f==='high'&&t.priority==='High'||f==='open'&&active(t)||f==='done'&&!active(t));
  }
  function itemRow(task) {
    const done = !active(task);
    const status = view === 'approvals' ? esc(task.status === 'Rejected' ? 'Changes requested' : task.status) : `${esc(task.team)} · ${esc(task.due)} · ${esc(task.status)}`;
    const marker = task.approval
      ? `<span class="review-marker ${done ? 'resolved' : ''}" aria-hidden="true">${done ? '•' : '↳'}</span>`
      : `<button type="button" class="row-check ${done ? 'done' : ''}" data-toggle="${task.id}" aria-label="${done ? 'Reopen' : 'Complete'} ${esc(task.title)}">${done ? '✓' : ''}</button>`;
    return `<div class="task-row">
      ${marker}
      <button type="button" class="task-info" data-open="${task.id}" aria-haspopup="dialog">
        <b class="${done && !task.approval ? 'done' : ''}">${esc(task.title)}</b><span>${status}</span>
      </button>
      <span class="priority ${task.priority.toLowerCase()}">${esc(task.priority)}</span>
      <span class="row-arrow" aria-hidden="true">›</span>
    </div>`;
  }

  function render(){const m=viewMeta[view];els.title.textContent=m.title;els.subtitle.textContent=m.subtitle;els.listTitle.textContent=m.heading;els.listSubtitle.textContent=m.helper;const mine=tasks.filter(t=>t.mine),inMotion=tasks.filter(t=>t.status==='In progress'),approvals=tasks.filter(t=>t.approval&&t.status==='Needs review');els.countMine.textContent=mine.filter(active).length;els.countApprovals.textContent=approvals.length;
    const openCount=mine.filter(active).length, doneCount=tasks.filter(t=>!active(t)).length;
    const values=view==='approvals'?[[approvals.length,'Awaiting review','Decision required'],[tasks.filter(t=>t.approval&&isApproved(t)).length,'Approved','Decisions recorded'],[tasks.filter(t=>t.approval&&t.status==='Rejected').length,'Changes needed','Sent back']]:view==='team'?[[tasks.filter(active).length,'Open tasks','Across the team'],[inMotion.length,'In progress','Currently moving'],[doneCount,'Resolved','Done or reviewed']]:[[openCount,'Open tasks','Your active tasks'],[inMotion.length,'In motion','Across the team'],[approvals.length,'Approvals','Awaiting decisions']];
    els.stats.innerHTML=values.map(([num,label,hint])=>`<div class="stat-card"><div class="stat-label">${esc(label)}</div><b>${String(num).padStart(2,'0')}</b><small>${esc(hint)}</small></div>`).join('');
    for(const b of document.querySelectorAll('[data-view]')){b.setAttribute('aria-current',b.dataset.view===view?'page':'false')}
    const visible=getVisible();els.list.innerHTML=visible.length?visible.map(itemRow).join('') : '<div class="empty-state"><b>No matching tasks.</b>Try another search or filter.</div>';
  }
  function switchView(nextView) {
    view = nextView;
    els.search.value = '';
    els.filter.value = 'all';
    render();
  }

  function focusRow(attribute, id) {
    const control = els.list.querySelector(`[${attribute}="${id}"]`);
    (control ?? els.search).focus();
  }

  function toggle(id) {
    const task = tasks.find(item => item.id === id);
    if (!task || task.approval) return;
    task.status = active(task) ? 'Completed' : 'To do';
    save();
    render();
    notify(task.status === 'Completed' ? 'Task marked complete' : 'Task reopened');
  }

  function openDetail(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    currentId = id;
    const status = task.status === 'Rejected' ? 'Changes requested' : task.status;
    const actions = task.approval
      ? (task.status === 'Needs review'
        ? '<button class="main-action" type="button" data-decision="approve">Approve</button><button type="button" data-decision="reject">Request changes</button>'
        : '<button class="main-action" type="button" data-decision="review">Return to review</button>')
      : `<button class="main-action" type="button" data-decision="toggle">${active(task) ? 'Mark complete' : 'Reopen task'}</button>`;
    els.detail.innerHTML = `<h2 id="detail-title">${esc(task.title)}</h2>
      <p>${esc(task.description)}</p>
      <dl class="detail-meta">
        <dt>Team</dt><dd>${esc(task.team)}</dd>
        <dt>Owner</dt><dd>${esc(task.owner)}</dd>
        <dt>Priority</dt><dd><span class="priority ${task.priority.toLowerCase()}">${esc(task.priority)}</span></dd>
        <dt>Status</dt><dd>${esc(status)}</dd>
        <dt>Due</dt><dd>${esc(task.due)}</dd>
      </dl>
      <div class="detail-actions">${actions}</div>`;
    els.sheet.showModal();
  }

  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });
  els.search.addEventListener('input', render);
  els.filter.addEventListener('change', render);

  els.list.addEventListener('click', event => {
    const check = event.target.closest('[data-toggle]');
    if (check) {
      const id = Number(check.dataset.toggle);
      toggle(id);
      focusRow('data-toggle', id);
      return;
    }
    const open = event.target.closest('[data-open]');
    if (open) openDetail(Number(open.dataset.open));
  });

  els.detail.addEventListener('click', event => {
    const action = event.target.closest('[data-decision]')?.dataset.decision;
    if (!action) return;
    const task = tasks.find(item => item.id === currentId);
    if (action === 'toggle') {
      toggle(task.id);
    } else {
      const decisions = {
        approve: ['Approved', 'Decision recorded: approved'],
        reject: ['Rejected', 'Decision recorded: changes requested'],
        review: ['Needs review', 'Returned to the review queue'],
      };
      const [status, message] = decisions[action];
      task.status = status;
      save();
      render();
      notify(message);
    }
    els.sheet.close();
  });

  document.getElementById('close-detail').addEventListener('click', () => els.sheet.close());
  els.sheet.addEventListener('close', () => {
    if (els.sheet.open) return;
    focusRow('data-open', currentId);
    currentId = null;
  });

  const titleInput = document.getElementById('new-title');
  const createButton = document.getElementById('open-create');
  createButton.addEventListener('click', () => els.create.showModal());
  document.getElementById('close-create').addEventListener('click', () => els.create.close());
  document.getElementById('cancel-create').addEventListener('click', () => els.create.close());

  for (const dialog of [els.sheet, els.create]) {
    let startedOutside = false;
    function isOutside(event) {
      if (event.target !== dialog) return false;
      const bounds = dialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
    }
    dialog.addEventListener('pointerdown', event => { startedOutside = isOutside(event); });
    dialog.addEventListener('click', event => {
      if (startedOutside && isOutside(event)) dialog.close();
      startedOutside = false;
    });
  }

  els.create.addEventListener('close', () => {
    if (els.create.open) return;
    els.form.reset();
    titleInput.setCustomValidity('');
    createButton.focus();
  });
  titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
  els.form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(els.form);
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity('Enter a task title.');
      titleInput.reportValidity();
      return;
    }
    let id = Date.now();
    while (tasks.some(task => task.id === id)) id++;
    tasks.unshift({
      id, title, team: data.get('team'), owner: 'Alex Morgan',
      due: 'Today', priority: data.get('priority'), status: 'To do',
      description: 'A new sample task created in this browser.', mine: true, approval: false,
    });
    save();
    switchView('mine');
    els.create.close();
    notify('Sample task created');
  });

  document.getElementById('reset-demo').addEventListener('click', () => {
    tasks = structuredClone(samples);
    save();
    switchView('mine');
    notify('Demo reset to original sample data');
  });

  render();
})();
