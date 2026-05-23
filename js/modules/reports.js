import { state } from './state.js';
import { COLABS_LIMP, COLABS_MANTO } from '../data/users.js';
import { show } from './navigation.js';

const DEPT_LABELS = { limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' };
const FORM_NAMES  = {
  labores:   'Reporte de Labores',
  areas:     'Limpieza de Áreas',
  trabajo:   'Reporte de Trabajo',
  checklist: 'Reporte de Inspección',
  averia:    'Reporte de Avería',
  materiales:'Solicitud de Materiales',
};

export function openReports() {
  let html = '';
  for (const dept of ['limpieza', 'mantenimiento']) {
    html += `<div class="rg"><h2>${DEPT_LABELS[dept]}</h2>`;
    const colabs = dept === 'limpieza' ? COLABS_LIMP : COLABS_MANTO;
    for (const person of colabs) {
      const ini  = person.split(' ').slice(0, 2).map(w => w[0]).join('');
      const reps = state.stored[dept].filter(r => r.colaborador === person);
      html += `<div class="acc"><div class="acc-hdr" onclick="toggleAcc(this)">
        <div class="pav">${ini}</div><span class="pnm">${person}</span>
        <span style="font-size:.68rem;font-family:sans-serif;color:var(--tm);margin-right:.4rem;">${reps.length} reporte${reps.length !== 1 ? 's' : ''}</span>
        <span class="parr">›</span></div><div class="acc-body">`;
      if (!reps.length) {
        html += `<div class="no-rep">Sin reportes aún.</div>`;
      } else {
        reps.slice().reverse().forEach(r => {
          const lbl   = r.type === 'checklist' ? `Inspección — ${r.area}` : (FORM_NAMES[r.formId] || r.formId);
          const extra = [r.turno ? `Turno ${r.turno}` : '', r.rol || '', r.photoCount ? `📷 ${r.photoCount} foto${r.photoCount !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
          html += `<div class="ritem" onclick="viewReport(${r.id},'${dept}')"><div class="ri-lbl">${lbl}</div><div class="ri-dt">${r.timestamp}${extra ? ' · ' + extra : ''}</div></div>`;
        });
      }
      html += `</div></div>`;
    }
    html += `</div>`;
  }
  document.getElementById('rep-body').innerHTML = html;
  show('rep-screen');
}

export function toggleAcc(hdr) {
  hdr.nextElementSibling.classList.toggle('open');
  hdr.querySelector('.parr').classList.toggle('open');
}

export function viewReport(id, dept) {
  const r = state.stored[dept].find(x => x.id === id);
  if (!r) return;
  let rows = [['Colaborador', r.colaborador], ['Fecha', r.fecha], ['Enviado', r.timestamp]];
  if (r.turno)      rows.push(['Turno', r.turno]);
  if (r.rol)        rows.push(['Rol', r.rol]);
  if (r.photoCount) rows.push(['Fotos adjuntas', `${r.photoCount} foto${r.photoCount !== 1 ? 's' : ''} (en Google Drive)`]);

  const rowHtml = rows => rows.map(([k, v]) => `<div style="padding:.5rem 0;border-bottom:1px solid rgba(84,66,54,.08);display:flex;gap:.75rem;"><span style="font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--tm);font-family:sans-serif;min-width:90px;flex-shrink:0;">${k}</span><span style="font-size:.83rem;font-family:sans-serif;color:var(--brown);line-height:1.5;">${v || '—'}</span></div>`).join('');

  if (r.type === 'checklist') {
    rows.unshift(['Área', r.area]);
    rows.push(['Completado', `${r.done} / ${r.total} ítems`]);
    if (r.obs) rows.push(['Observaciones', r.obs]);
    const itemsHtml = r.items.map(i => `<div style="display:flex;gap:.5rem;align-items:flex-start;padding:.3rem 0;border-bottom:1px solid rgba(84,66,54,.05);"><span>${i.checked ? '✅' : '⬜'}</span><span style="font-size:.77rem;font-family:sans-serif;color:${i.checked ? 'var(--brown)' : 'var(--tm)'};flex:1;line-height:1.4;">${i.item}${i.nota ? `<br><span style="color:var(--tm);font-size:.7rem;font-style:italic;">→ ${i.nota}</span>` : ''}</span></div>`).join('');
    document.getElementById('con-title').textContent = `Inspección — ${r.area}`;
    document.getElementById('conbody').innerHTML = `<div class="doc-viewer">${rowHtml(rows)}<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--tm);font-family:sans-serif;margin-top:.8rem;margin-bottom:.4rem;">Ítems</div>${itemsHtml}</div>`;
  } else {
    const fn = { labores: 'Reporte de Labores', areas: 'Limpieza de Áreas', trabajo: 'Reporte de Trabajo', averia: 'Reporte de Avería', materiales: 'Solicitud de Materiales' };
    if (r.prior)  rows.push(['Prioridad', r.prior]);
    if (r.area)   rows.push(['Área', r.area]);
    if (r.estado) rows.push(['Estado', r.estado]);
    if (r.dur)    rows.push(['Duración', r.dur]);
    if (r.desc)   rows.push(['Descripción', r.desc]);
    if (r.mat)    rows.push(['Materiales', r.mat]);
    if (r.obs)    rows.push(['Observaciones', r.obs]);
    document.getElementById('con-title').textContent = fn[r.formId] || r.formId;
    document.getElementById('conbody').innerHTML = `<div class="doc-viewer">${rowHtml(rows)}</div>`;
  }
  document.getElementById('con-back').onclick = () => openReports();
  show('con-screen');
}
