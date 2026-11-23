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
    title:document.getElementById('view-title'),subtitle:document.getElementById('view-subtitle'),stats:document.getElementById('stats'),list:document.getElementById('task-list'),search:document.getElementById('task-search'),filter:document.getElementById('task-filter'),listTitle:document.getElementById('list-title'),listSubtitle:document.getElementById('list-subtitle'),countMine:document.getElementById('count-mine'),countApprovals:document.getElementById('count-approvals'),sheet:document.getElementById('detail-sheet'),backdrop:document.getElementById('detail-backdrop'),detail:document.getElementById('detail-content'),create:document.getElementById('create-backdrop'),form:document.getElementById('create-form'),toast:document.getElementById('toast')
  };
  const viewMeta = {
    mine:{title:'My work',subtitle:'Everything you need to move forward.',heading:'Needs your attention',helper:'Sample tasks for Alex Morgan'},
    team:{title:'Team priorities',subtitle:'See the team’s work without asking for a status update.',heading:'All team tasks',helper:'A fictional cross-functional team'},
    approvals:{title:'Approvals',subtitle:'Decisions move work forward.',heading:'Waiting for your decision',helper:'Review sample requests and make a decision'}
  };
  let tasks;
  try { const raw = JSON.parse(localStorage.getItem(STORE));tasks = Array.isArray(raw) && raw.every(t => t && typeof t.title === 'string' && typeof t.id === 'number') ? raw : structuredClone(samples); } catch {tasks = structuredClone(samples)}
  let view = 'mine', currentId = null, toastTimer = null, lastFocus = null;
  const save = () => { try {localStorage.setItem(STORE,JSON.stringify(tasks))} catch {} };
  const esc = (s) => String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const active = t => t.status !== 'Completed' && t.status !== 'Approved' && t.status !== 'Rejected';
  const isApproved = t => t.status === 'Approved';
  function notify(message) {els.toast.textContent = message;els.toast.classList.add('show');clearTimeout(toastTimer);toastTimer = setTimeout(()=>els.toast.classList.remove('show'),2400)}
  function getVisible() {
    const q=els.search.value.toLowerCase().trim();const f=els.filter.value;
    return tasks.filter(t=>view==='mine'?t.mine:view==='approvals'?t.approval:true).filter(t=>!q || [t.title,t.team,t.owner].some(x=>x.toLowerCase().includes(q))).filter(t=>f==='all'||f==='high'&&t.priority==='High'||f==='open'&&active(t)||f==='done'&&!active(t));
  }
  function itemRow(t){const done=!active(t);const status = view==='approvals' ? esc(t.status) : esc(t.team) + ' · ' + esc(t.due) + ' · ' + esc(t.status);return `<div class="task-row"><button type="button" class="row-check ${done?'done':''}" data-toggle="${t.id}" aria-label="${done?'Reopen':'Complete'} ${esc(t.title)}" title="${done?'Reopen task':'Mark completed'}">${done?'✓':''}</button><button type="button" class="task-info" data-open="${t.id}"><b class="${done?'done':''}">${esc(t.title)}</b><span>${status}</span></button><span class="priority ${t.priority.toLowerCase()}">${esc(t.priority)}</span><button type="button" class="row-arrow" data-open="${t.id}" aria-label="Inspect ${esc(t.title)}">›</button></div>`;}
  function render(){const m=viewMeta[view];els.title.textContent=m.title;els.subtitle.textContent=m.subtitle;els.listTitle.textContent=m.heading;els.listSubtitle.textContent=m.helper;const mine=tasks.filter(t=>t.mine),inMotion=tasks.filter(t=>t.status==='In progress'),approvals=tasks.filter(t=>t.approval&&t.status==='Needs review');els.countMine.textContent=mine.filter(active).length;els.countApprovals.textContent=approvals.length;
    const openCount=mine.filter(active).length, doneCount=tasks.filter(t=>!active(t)).length;
    const values=view==='approvals'?[[approvals.length,'Awaiting review','Decision required'],[tasks.filter(t=>t.approval&&isApproved(t)).length,'Approved','Decisions recorded'],[tasks.filter(t=>t.approval&&t.status==='Rejected').length,'Changes needed','Sent back']]:view==='team'?[[tasks.filter(active).length,'Open tasks','Across the team'],[inMotion.length,'In progress','Currently moving'],[doneCount,'Resolved','Done or reviewed']]:[[openCount,'To do','Your active tasks'],[inMotion.length,'In motion','Across the team'],[approvals.length,'Approvals','Awaiting decisions']];
    els.stats.innerHTML=values.map(([num,label,hint])=>`<div class="stat-card"><div class="stat-label">${esc(label)}</div><b>${String(num).padStart(2,'0')}</b><small>${esc(hint)}</small></div>`).join('');
    for(const b of document.querySelectorAll('[data-view]')){b.setAttribute('aria-current',b.dataset.view===view?'page':'false')}
    const visible=getVisible();els.list.innerHTML=visible.length?visible.map(itemRow).join(''):'<div class="empty-state"><b>No matching tasks.</b>Try another filter or add a sample task.</div>';
  }
  function switchView(v){if(!viewMeta[v])return;view=v;els.search.value='';els.filter.value='all';render();}
  function setTask(id, patch){const t=tasks.find(x=>x.id===id);if(!t)return;Object.assign(t,patch);save();render();if(currentId===id)showDetail(id);}
  function toggle(id){const t=tasks.find(x=>x.id===id);if(!t)return;const newStatus=active(t)?'Completed':t.approval?'Needs review':'To do';setTask(id,{status:newStatus});notify(newStatus==='Completed'?'Task marked complete':'Task reopened')}
  function showDetail(id){const t=tasks.find(x=>x.id===id);if(!t)return;currentId=id;els.detail.innerHTML=`<span class="demo-kicker">${esc(t.team.toUpperCase())} / SAMPLE TASK</span><h2 id="detail-title">${esc(t.title)}</h2><p>${esc(t.description)}</p><dl class="detail-meta"><dt>Owner</dt><dd>${esc(t.owner)}</dd><dt>Priority</dt><dd><span class="priority ${esc(t.priority.toLowerCase())}">${esc(t.priority)}</span></dd><dt>Status</dt><dd>${esc(t.status)}</dd><dt>Due</dt><dd>${esc(t.due)}</dd></dl><div class="detail-actions">${t.approval&&t.status==='Needs review'?`<button class="main-action" type="button" data-decision="approve">Approve</button><button type="button" data-decision="reject">Request changes</button>`:`<button class="main-action" type="button" data-decision="toggle">${active(t)?'Mark complete':'Reopen task'}</button>`}</div>`;els.backdrop.classList.add('open');els.sheet.classList.add('open');els.sheet.setAttribute('aria-hidden','false');document.getElementById('close-detail').focus()}
  function closeDetail(){els.backdrop.classList.remove('open');els.sheet.classList.remove('open');els.sheet.setAttribute('aria-hidden','true');currentId=null;lastFocus?.focus?.()}
  function showCreate(){lastFocus=document.activeElement;els.create.classList.add('open');document.getElementById('new-title').focus()}
  function closeCreate(){els.create.classList.remove('open');els.form.reset();lastFocus?.focus?.()}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  els.search.addEventListener('input',render);els.filter.addEventListener('change',render);
  els.list.addEventListener('click',e=>{const check=e.target.closest('[data-toggle]');if(check){toggle(Number(check.dataset.toggle));return}const open=e.target.closest('[data-open]');if(open){lastFocus=open;showDetail(Number(open.dataset.open))}});
  els.detail.addEventListener('click',e=>{const a=e.target.closest('[data-decision]');if(!a||currentId==null)return;const id=currentId;const action=a.dataset.decision;if(action==='toggle'){toggle(id)}else{setTask(id,{status:action==='approve'?'Approved':'Rejected'});notify(action==='approve'?'Decision recorded: approved':'Decision recorded: changes requested');closeDetail()}});
  document.getElementById('close-detail').addEventListener('click',closeDetail);els.backdrop.addEventListener('click',closeDetail);
  document.getElementById('open-create').addEventListener('click',showCreate);document.getElementById('close-create').addEventListener('click',closeCreate);document.getElementById('cancel-create').addEventListener('click',closeCreate);els.create.addEventListener('mousedown',e=>{if(e.target===els.create)closeCreate()});
  els.form.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(els.form),title=String(f.get('title')||'').trim();if(!title)return;tasks.unshift({id:Date.now(),title:title.slice(0,90),team:String(f.get('team')),owner:'Alex Morgan',due:'Today',priority:String(f.get('priority')),status:'To do',description:'A new sample task created in this browser.',mine:true,approval:false});save();switchView('mine');closeCreate();notify('Sample task created')});
  document.getElementById('reset-demo').addEventListener('click',()=>{tasks=structuredClone(samples);save();switchView('mine');closeDetail();notify('Demo reset to original sample data')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(els.create.classList.contains('open'))closeCreate();else if(els.sheet.classList.contains('open'))closeDetail()}});
  render();
})();
