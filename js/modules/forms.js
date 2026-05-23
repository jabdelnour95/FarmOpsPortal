import { state } from './state.js';
import { COLABS_LIMP, COLABS_MANTO } from '../data/users.js';
import { stopRec } from './audio.js';
import { photoUploadWidget } from './photos.js';
import { show, nav } from './navigation.js';

function aw(id, ph) {
  return `<div class="aw"><textarea id="ta-${id}" placeholder="${ph}" style="width:100%;border:none;border-bottom:1px solid rgba(84,66,54,.1);padding:.7rem .85rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;resize:none;height:72px;line-height:1.5;display:block;background:white;"></textarea>
  <div class="actl"><button class="bmk" id="mic-${id}" onclick="toggleMic('${id}')">🎙</button>
  <span class="mst" id="ms-${id}">Toca para dictar</span>
  <button class="bclr" onclick="document.getElementById('ta-${id}').value=''">Limpiar</button></div></div>`;
}

const limpOpts = () => COLABS_LIMP.map(n => `<option>${n}</option>`).join('');
const mantoOpts = () => COLABS_MANTO.map(n => `<option>${n}</option>`).join('');

const FORMS = {
  labores: {
    title: 'Reporte de Labores', dept: 'limpieza', btnCls: '',
    html: () => `
      <div class="frow"><div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg"><label>Turno</label><select id="f-turno"><option value="AM">AM (7am–12md)</option><option value="PM">PM (12:30–3pm)</option></select></div></div>
      <div class="fg"><label>Rol</label><select id="f-rol"><option value="Rol 1">Rol 1</option><option value="Rol 2">Rol 2</option></select></div>
      <div class="fg"><label>Colaboradora</label><select id="f-colab"><option value="">— Seleccionar —</option>${limpOpts()}</select></div>
      <div class="fg"><label>Áreas trabajadas</label><textarea id="f-areas" placeholder="Lista las áreas donde trabajaste..."></textarea></div>
      <div class="fg"><label>Duración (h)</label><input type="number" id="f-dur" step="0.5" min="0" placeholder="0"></div>
      <div class="fg"><label>Observaciones</label>${aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('form-photos')}`,
  },
  areas: {
    title: 'Limpieza de Áreas', dept: 'limpieza', btnCls: '',
    html: () => `
      <div class="frow"><div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg"><label>Turno</label><select id="f-turno"><option value="AM">AM (7am–12md)</option><option value="PM">PM (12:30–3pm)</option></select></div></div>
      <div class="fg"><label>Rol</label><select id="f-rol"><option value="Rol 1">Rol 1</option><option value="Rol 2">Rol 2</option></select></div>
      <div class="fg"><label>Área</label><select id="f-area"><option>Recepción</option><option>Habitaciones</option><option>Áreas comunes</option><option>Cocina</option><option>Baños</option><option>Exteriores</option><option>Otra</option></select></div>
      <div class="fg"><label>Colaboradora</label><select id="f-colab"><option value="">— Seleccionar —</option>${limpOpts()}</select></div>
      <div class="fg"><label>Duración (min)</label><input type="number" id="f-dur" min="0" placeholder="0"></div>
      <div class="fg"><label>Estado al terminar</label><select id="f-estado"><option>Excelente</option><option>Bueno</option><option>Regular — requiere seguimiento</option></select></div>
      <div class="fg"><label>Observaciones</label>${aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('form-photos')}`,
  },
  trabajo: {
    title: 'Reporte de Trabajo', dept: 'mantenimiento', btnCls: '',
    html: () => `
      <div class="frow"><div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg"><label>Prioridad</label><select id="f-prior"><option>Normal</option><option>Urgente</option><option>Programado</option></select></div></div>
      <div class="fg"><label>Encargado</label><select id="f-colab"><option value="">— Seleccionar —</option>${mantoOpts()}</select></div>
      <div class="fg"><label>Área / Ubicación</label><input type="text" id="f-ubic" placeholder="Ej: Habitación 3, Piscina..."></div>
      <div class="fg"><label>Estado</label><select id="f-est"><option>Completado</option><option>En proceso</option><option>Pendiente de materiales</option><option>Requiere revisión</option></select></div>
      <div class="fg"><label>Descripción del trabajo</label>${aw('desc', '¿Qué se realizó?...')}</div>
      <div class="fg"><label>Materiales utilizados</label>${aw('mat', 'Lista materiales...')}</div>
      <div class="fg"><label>Observaciones</label>${aw('obs', '¿Acción adicional?...')}</div>
      ${photoUploadWidget('form-photos')}`,
  },
  averia: {
    title: 'Reporte de Avería', dept: 'mantenimiento', btnCls: 'red',
    html: () => `
      <div class="doc-note" style="margin-bottom:1rem;">🔴 Usa este reporte cuando detectes una avería que requiere atención, independientemente de una inspección programada.</div>
      <div class="frow"><div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg"><label>Urgencia</label><select id="f-prior">
        <option value="URGENTE">🔴 Urgente — riesgo inmediato</option>
        <option value="PRIORIDAD">🟡 Prioridad — resolver en 24h</option>
        <option value="PROGRAMAR">🟢 Programar</option>
      </select></div></div>
      <div class="fg"><label>Encargado que reporta</label><select id="f-colab"><option value="">— Seleccionar —</option>${mantoOpts()}</select></div>
      <div class="fg"><label>Área / Ubicación exacta</label><input type="text" id="f-ubic" placeholder="Ej: Toensmeier, Puente colgante..."></div>
      <div class="fg"><label>Descripción de la avería</label>${aw('desc', 'Describe la avería con detalle...')}</div>
      <div class="fg"><label>Acciones tomadas de inmediato</label>${aw('obs', '¿Se acordonó el área, se cerró una válvula?...')}</div>
      ${photoUploadWidget('form-photos')}`,
  },
  materiales: {
    title: 'Solicitud de Materiales', dept: 'mantenimiento', btnCls: 'green',
    html: () => `
      <div class="frow"><div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg"><label>Prioridad</label><select id="f-prior"><option>Normal</option><option>Urgente</option></select></div></div>
      <div class="fg"><label>Solicitante</label><select id="f-colab"><option value="">— Seleccionar —</option>${mantoOpts()}</select></div>
      <div class="fg"><label>Área de uso</label><input type="text" id="f-ubic" placeholder="¿Para qué área o proyecto?"></div>
      <div class="fg"><label>Materiales solicitados</label>${aw('mat', 'Lista los materiales que necesitas con cantidad aproximada...')}</div>
      <div class="fg"><label>Justificación / Notas</label>${aw('obs', '¿Por qué se necesitan? ¿Hay algún plazo?...')}</div>
      ${photoUploadWidget('form-photos')}`,
  },
};

export function openForm(formId) {
  stopRec();
  const f = FORMS[formId];
  document.getElementById('ft').textContent = f.title;
  document.getElementById('fs-back').onclick = () => nav('dept');
  document.getElementById('fbody').innerHTML = `
    <h2 style="font-size:1.05rem;font-weight:normal;font-style:italic;color:var(--brown);margin-bottom:1.1rem;">${f.title}</h2>
    ${f.html()}
    <button class="btn-sub ${f.btnCls}" id="btn-sub" onclick="submitForm('${formId}','${f.dept}')">Enviar</button>
    <div class="fnote">Los datos y fotos se guardarán en Google Sheets / Drive</div>
    <div class="ok-msg" id="ok-msg"><p>✅ Enviado correctamente.</p></div>`;
  const d = document.getElementById('f-fecha');
  if (d) d.value = new Date().toISOString().split('T')[0];
  show('fs');
}

export function submitForm(formId, dept) {
  stopRec();
  const colab = document.getElementById('f-colab')?.value;
  if (!colab) { alert('Por favor selecciona el colaborador.'); return; }
  const photos = window._photos?.['form-photos'] || [];
  const entry = {
    id: Date.now(), type: 'form', formId, colaborador: colab,
    fecha:   document.getElementById('f-fecha')?.value  || '',
    turno:   document.getElementById('f-turno')?.value  || '',
    rol:     document.getElementById('f-rol')?.value    || '',
    prior:   document.getElementById('f-prior')?.value  || '',
    obs:     document.getElementById('ta-obs')?.value   || '',
    desc:    document.getElementById('ta-desc')?.value  || '',
    mat:     document.getElementById('ta-mat')?.value   || '',
    area:    document.getElementById('f-area')?.value   || document.getElementById('f-ubic')?.value || '',
    estado:  document.getElementById('f-est')?.value    || document.getElementById('f-estado')?.value || '',
    dur:     document.getElementById('f-dur')?.value    || '',
    photoCount: photos.length,
    timestamp: new Date().toLocaleString('es-CR'),
  };
  state.stored[dept].push(entry);
  document.getElementById('ok-msg').style.display = 'block';
  document.getElementById('btn-sub').disabled = true;
  // TODO: conectar a backend
}
