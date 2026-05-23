import { state } from './state.js';
import { stopRec } from './audio.js';
import { DEPTS } from '../data/departments.js';
import { CAL_IDS, CAL_LABELS } from '../data/departments.js';

export function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

export function nav(to) {
  stopRec();
  if (to === 'home') show('home');
  else if (to === 'dept') openDept(state.currentDept);
}

export function openDept(dept) {
  state.currentDept = dept;
  const d = DEPTS[dept];
  document.getElementById('dept-title').textContent = d.label;
  document.getElementById('rgrid').innerHTML = d.resources.map(r => `
    <div class="gcard" onclick="openResource('${r.id}','${r.title}','${r.type || 'doc'}')">
      <div class="ct">${r.title}</div><div class="cd">${r.desc || ''}</div>
    </div>`).join('');
  const rl   = document.getElementById('rlist');
  const rlbl = document.getElementById('rlist-lbl');
  if (d.reports.length) {
    rlbl.style.display = '';
    rl.innerHTML = d.reports.map(r => `
      <button class="rbtn ${r.cls}" onclick="openForm('${r.form}')">
        <div class="rdot"></div><span>${r.label}</span><span class="arr">→</span>
      </button>`).join('');
  } else {
    rlbl.style.display = 'none';
    rl.innerHTML = '';
  }
  document.getElementById('si').value = '';
  show('dept');
}

export function filterCards() {
  const q = document.getElementById('si').value.toLowerCase();
  document.querySelectorAll('.gcard').forEach(c => {
    c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

export function openResource(id, title, type) {
  if (type === 'checklist')   { openChecklistMenu(id); return; }
  if (type === 'cal')         { openCalendar(id); return; }
  if (type === 'inventarios') { openInventarios(); return; }
  if (type === 'proveedores') { openProveedores(); return; }
  if (id === 'frases-en') {
    document.getElementById('con-title').textContent = 'Frases Comunes en Inglés';
    document.getElementById('con-back').onclick = () => nav('dept');
    document.getElementById('conbody').innerHTML = `<div class="cs"><div class="csi">🇺🇸</div><h3>Frases Comunes en Inglés</h3><p>Esta sección estará disponible próximamente.</p></div>`;
    show('con-screen'); return;
  }
  document.getElementById('con-title').textContent = title;
  document.getElementById('con-back').onclick = () => nav('dept');
  let html = '';
  if (id === 'manual-limp')  html = renderManualLimp();
  else if (id === 'manual-prev') html = renderManualManto();
  else html = `<div class="cs"><div class="csi">📄</div><h3>${title}</h3><p>El contenido estará disponible aquí próximamente.</p></div>`;
  document.getElementById('conbody').innerHTML = html;
  show('con-screen');
}

export function openCalendar(id) {
  const calId = CAL_IDS[id];
  const label = CAL_LABELS[id];
  const enc   = encodeURIComponent(calId);
  const src   = `https://calendar.google.com/calendar/embed?src=${enc}&ctz=America%2FCosta_Rica&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&mode=MONTH&bgcolor=%23E8E2D1&color=%23995C44`;
  document.getElementById('con-title').textContent = `Calendario — ${label}`;
  document.getElementById('con-back').onclick = () => nav('dept');
  document.getElementById('conbody').innerHTML = `
    <div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:.9rem;">Calendario de ${label} · Solo lectura</div>
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:12px;overflow:hidden;">
      <iframe src="${src}" style="border:none;width:100%;height:520px;display:block;" frameborder="0" scrolling="no"></iframe>
    </div>
    <div style="font-size:.68rem;font-family:sans-serif;color:var(--tm);text-align:center;margin-top:.75rem;line-height:1.5;">Para agregar o editar eventos, hazlo directamente en Google Calendar.</div>`;
  show('con-screen');
}

// Imported lazily by openResource — resolved via app.js bindings
function openChecklistMenu(id) { window._openChecklistMenu(id); }
function openInventarios()     { window._openInventarios(); }
function openProveedores()     { window._openProveedores(); }
function renderManualLimp()    { return window._renderManualLimp(); }
function renderManualManto()   { return window._renderManualManto(); }

export function openReportsScreen() { show('rep-screen'); }
