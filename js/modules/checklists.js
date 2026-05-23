import { state } from './state.js';
import { CL_LIMPIEZA } from '../data/checklists-limpieza.js';
import { CL_MANTO_CLUSTERS } from '../data/checklists-manto.js';
import { COLABS_LIMP, COLABS_MANTO } from '../data/users.js';
import { show, nav } from './navigation.js';
import { photoUploadWidget } from './photos.js';
import { toggleMic } from './audio.js';

export function openChecklistMenu(resourceId) {
  document.getElementById('cl-title').textContent = 'Checklist';
  document.getElementById('cl-back').onclick = () => nav('dept');
  let html = '';
  if (state.currentDept === 'limpieza') {
    html = `<div class="glbl">Selecciona el área a inspeccionar</div><div class="area-grid">
      ${CL_LIMPIEZA.map(a => `<div class="area-card" onclick="promptChecklist('${a.id}','limpieza')">
        <div class="acn">${a.name}</div><div class="acs">${a.sub}</div></div>`).join('')}
    </div>`;
  } else {
    html = `<div class="glbl">Selecciona el cluster a inspeccionar</div>`;
    CL_MANTO_CLUSTERS.forEach(cl => {
      html += `<div class="cluster-card" onclick="promptChecklist('${cl.id}','mantenimiento')">
        <div class="cc-title">${cl.name}</div><div class="cc-sub">${cl.sub}</div>
        ${cl.note ? `<div style="font-size:.67rem;font-family:sans-serif;color:var(--clay);margin-top:.3rem;">${cl.note}</div>` : ''}
      </div>`;
    });
  }
  document.getElementById('cl-body').innerHTML = html;
  show('cl-screen');
}

export function promptChecklist(id, dept) {
  let name = '', sub = '';
  if (dept === 'limpieza') { const a = CL_LIMPIEZA.find(x => x.id === id); name = a.name; sub = a.sub; }
  else { const cl = CL_MANTO_CLUSTERS.find(x => x.id === id); name = cl.name; sub = cl.sub; }
  state.pendingChecklist = { id, dept };
  document.getElementById('modal-sub').innerHTML = `Vas a iniciar el checklist de inspección para:<br><strong style="color:var(--brown)">${name}</strong><br><span style="font-size:.75rem;color:var(--tm);">${sub}</span><br><br>Asegúrate de estar en el área indicada.`;
  document.getElementById('modal').classList.add('show');
}

export function closeModal() {
  document.getElementById('modal').classList.remove('show');
  state.pendingChecklist = null;
}

export function confirmChecklist() {
  document.getElementById('modal').classList.remove('show');
  if (state.pendingChecklist) startChecklist(state.pendingChecklist.id, state.pendingChecklist.dept);
}

function clItem(si, ii, item, total) {
  return `<div class="cl-item"><div class="cl-cb" id="cb-${si}-${ii}" onclick="toggleCB(${si},${ii},${total})"></div>
    <div style="flex:1"><div class="cl-txt">${item}</div>
    <div class="cl-note"><input type="text" placeholder="Nota opcional..." id="cn-${si}-${ii}"></div></div></div>`;
}

export function toggleCB(si, ii, total) {
  const k = `${si}-${ii}`;
  state.checkedMap[k] = !state.checkedMap[k];
  const cb = document.getElementById(`cb-${si}-${ii}`);
  state.checkedMap[k] ? cb.classList.add('checked') : cb.classList.remove('checked');
  const done = Object.values(state.checkedMap).filter(Boolean).length;
  document.getElementById('prog-txt').textContent = `${done} / ${total} ítems completados`;
  document.getElementById('prog-bar').style.width = `${(done / total) * 100}%`;
}

export function startChecklist(id, dept) {
  state.checkedMap = {};
  let obj, allItems = [], name = '';

  if (dept === 'limpieza') {
    obj = CL_LIMPIEZA.find(a => a.id === id); name = obj.name;
    obj.sections.forEach((sec, si) => sec.items.forEach((item, ii) => allItems.push({ si, ii, item })));
  } else {
    obj = CL_MANTO_CLUSTERS.find(cl => cl.id === id); name = obj.name;
    obj.areas.forEach((area, ai) => area.items.forEach((item, ii) => allItems.push({ si: ai, ii, item })));
  }
  const total = allItems.length;

  let sectionsHtml = '';
  if (dept === 'limpieza') {
    if (obj.note) sectionsHtml += `<div class="doc-note">${obj.note}</div>`;
    obj.sections.forEach((sec, si) => {
      sectionsHtml += `<div class="cl-section">
        ${sec.title ? `<div class="cl-sec-title">${sec.title}</div>` : ''}
        ${sec.desc  ? `<p style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:.5rem;">${sec.desc}</p>` : ''}
        ${sec.items.map((item, ii) => clItem(si, ii, item, total)).join('')}
        ${sec.note  ? `<div class="doc-note">📌 ${sec.note}</div>` : ''}
      </div>`;
    });
    if (obj.criterios) {
      sectionsHtml += `<div class="crit-box" style="margin-bottom:1rem;"><div class="crit-lbl">Criterios de limpieza esperada</div>${obj.criterios.map(c => `<div class="crit-row">✓ ${c}</div>`).join('')}</div>`;
    }
  } else {
    if (obj.note) sectionsHtml += `<div class="doc-note">${obj.note}</div>`;
    obj.areas.forEach((area, ai) => {
      sectionsHtml += `<div class="cl-section"><div class="cl-sec-title">${area.name}${area.note ? ` — <span style="color:var(--clay);font-size:.65rem;">${area.note}</span>` : ''}</div>
        ${area.items.map((item, ii) => clItem(ai, ii, item, total)).join('')}
      </div>`;
    });
  }

  const colabOpts = dept === 'limpieza'
    ? COLABS_LIMP.map(n  => `<option>${n}</option>`).join('')
    : COLABS_MANTO.map(n => `<option>${n}</option>`).join('');

  document.getElementById('cl-title').textContent = name;
  document.getElementById('cl-back').onclick = () => openChecklistMenu(dept === 'limpieza' ? 'checklist-limp' : 'checklist-manto');
  document.getElementById('cl-body').innerHTML = `
    <div class="cl-header-info">
      <div class="cl-area-name">${name}</div>
      <div class="fg" style="margin-bottom:.6rem"><label>Encargado</label>
        <select id="cl-colab"><option value="">— Seleccionar —</option>${colabOpts}</select></div>
      ${dept === 'limpieza' ? `<div class="fg" style="margin-bottom:.6rem"><label>Turno</label>
        <select id="cl-turno"><option value="AM">AM — 7:00am a 12:00md</option><option value="PM">PM — 12:30pm a 3:00pm</option></select></div>` : ''}
      <div class="fg" style="margin-bottom:0"><label>Fecha</label>
        <input type="date" id="cl-fecha" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="cl-prog-txt" id="prog-txt">0 / ${total} ítems completados</div>
    <div class="cl-progress"><div class="cl-prog-bar" id="prog-bar" style="width:0%"></div></div>
    ${sectionsHtml}
    <div class="fg" style="margin-top:.5rem"><label>Observaciones generales</label>
      <div class="aw"><textarea id="ta-cl-obs" placeholder="Observaciones generales..." style="width:100%;border:none;padding:.7rem .85rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;resize:none;height:72px;line-height:1.5;display:block;background:white;border-bottom:1px solid rgba(84,66,54,.1);"></textarea>
      <div class="actl"><button class="bmk" id="mic-cl" onclick="toggleMic('cl')">🎙</button>
      <span class="mst" id="ms-cl">Toca para dictar</span>
      <button class="bclr" onclick="document.getElementById('ta-cl-obs').value=''">Limpiar</button></div></div>
    </div>
    ${photoUploadWidget('cl-photos')}
    <button class="btn-sub" id="cl-submit" onclick="submitChecklist('${id}','${dept}')">Enviar Reporte de Inspección</button>
    <div class="fnote">Los datos y fotos se guardarán en Google Drive / Sheets</div>
    <div class="ok-msg" id="cl-ok"><p>✅ Reporte de inspección enviado correctamente.</p></div>`;
  show('cl-screen');
}

export function submitChecklist(id, dept) {
  const colab = document.getElementById('cl-colab')?.value;
  if (!colab) { alert('Por favor selecciona el encargado.'); return; }
  let obj, allItems = [];
  if (dept === 'limpieza') {
    obj = CL_LIMPIEZA.find(a => a.id === id);
    obj.sections.forEach((s, si) => s.items.forEach((item, ii) => allItems.push({ item, checked: !!state.checkedMap[`${si}-${ii}`], nota: document.getElementById(`cn-${si}-${ii}`)?.value || '' })));
  } else {
    obj = CL_MANTO_CLUSTERS.find(cl => cl.id === id);
    obj.areas.forEach((area, ai) => area.items.forEach((item, ii) => allItems.push({ item, checked: !!state.checkedMap[`${ai}-${ii}`], nota: document.getElementById(`cn-${ai}-${ii}`)?.value || '' })));
  }
  const photos = window._photos?.['cl-photos'] || [];
  const entry = {
    id: Date.now(), type: 'checklist', area: obj.name, areaId: id, colaborador: colab,
    turno: document.getElementById('cl-turno')?.value || '',
    fecha: document.getElementById('cl-fecha')?.value || '',
    obs:   document.getElementById('ta-cl-obs')?.value || '',
    items: allItems, total: allItems.length, done: allItems.filter(i => i.checked).length,
    photoCount: photos.length, timestamp: new Date().toLocaleString('es-CR'),
  };
  state.stored[dept].push(entry);
  state.checkedMap = {};
  document.getElementById('cl-ok').style.display = 'block';
  document.getElementById('cl-submit').disabled = true;
  // TODO: conectar a backend
}
