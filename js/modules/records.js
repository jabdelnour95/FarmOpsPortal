import { state } from './state.js';
import { show } from './navigation.js';
import { openFoodForm } from './food.js';
import { openBioForm } from './bio.js';
import { openNurseryForm } from './nursery.js';

const API = 'https://tierramor-api.jabdelnour95.workers.dev';

async function _api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.accessToken}`,
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Error ${res.status}`);
  return data;
}

function _esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── RESOURCE CONFIG ────────────────────────────────────────────────────────
// Cada tipo de registro: dónde vive (endpoint del Worker) y cómo resumirlo en
// la lista. summary()/sub() reciben la fila tal cual la devuelve el GET.

const FOOD_RESOURCES = [
  {
    key: 'siembra', label: 'Siembra', endpoint: '/api/food/plantings',
    summary: r => _esc([r.crops?.name || '—', r.beds?.code].filter(Boolean).join(' · ')),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'prep-cama', label: 'Preparar Cama', endpoint: '/api/food/bed-preparations',
    summary: r => _esc(`Cama ${r.beds?.code || '—'}`),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'aplic-insumos', label: 'Aplicar Insumos', endpoint: '/api/food/input-applications',
    summary: r => _esc([r.productive_areas?.name || '—', r.method].filter(Boolean).join(' · ')),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'mantenimiento', label: 'Mantenimiento', endpoint: '/api/food/area-maintenance',
    summary: r => _esc([r.productive_areas?.name || '—', (r.maintenance_types || []).join(', ')].filter(Boolean).join(' · ')),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'disponibilidad', label: 'Disponibilidad', endpoint: '/api/food/availability',
    summary: r => _esc(`Semana ${r.week_ref || '—'}`),
    sub: r => {
      const n = (r.weekly_availability_items || []).length;
      return _esc(`${n} cultivo${n === 1 ? '' : 's'}`);
    },
  },
  {
    key: 'cosecha', label: 'Cosecha', endpoint: '/api/food/harvests',
    summary: r => _esc(`${r.crops?.name || '—'} — ${r.real_quantity ?? ''} ${r.unit || ''}`.trim()),
    sub: r => _esc([r.beds?.code, r.date].filter(Boolean).join(' · ')),
  },
];

const BIO_RESOURCES = [
  {
    key: 'entrada', label: 'Entrada de Materia Prima', endpoint: '/api/bio/raw-material-entries',
    summary: r => _esc(`${r.bio_raw_materials?.name || '—'} — ${r.quantity ?? ''} ${r.unit || ''}`.trim()),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'abrir-lote', label: 'Lotes de Producción', endpoint: '/api/bio/batches',
    summary: r => _esc(`${r.batch_code || '—'} · ${r.bio_finished_products?.name || '—'}`),
    sub: r => _esc(`${r.status === 'closed' ? 'Cerrado' : 'En proceso'} · ${r.date_start || ''}`),
  },
  {
    key: 'salida', label: 'Salidas', endpoint: '/api/bio/outputs',
    summary: r => _esc(`${r.bio_finished_products?.name || '—'} — ${r.quantity ?? ''}`),
    sub: r => _esc(`${r.output_type === 'external_sale' ? 'Venta externa' : 'Uso interno'} · ${r.date || ''}`),
  },
];

const NURSERY_STATUS_LABEL = { germination: 'Germinación', active: 'Activo', graduated: 'Graduado', closed: 'Cerrado' };

const NURSERY_RESOURCES = [
  {
    key: 'entrada', label: 'Entrada de Materia Prima', endpoint: '/api/nursery/raw-material-entries',
    summary: r => _esc(`${r.nursery_raw_materials?.name || '—'} — ${r.quantity ?? ''} ${r.unit || ''}`.trim()),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'sustrato', label: 'Sustrato Preparado', endpoint: '/api/nursery/substrate-batches',
    summary: r => _esc(`${r.batch_id || '—'} · ${r.substrate_types?.name || '—'}`),
    sub: r => _esc(`${r.quantity_produced ?? ''} ${r.unit || ''} · ${r.date || ''}`),
  },
  {
    key: 'llenado', label: 'Llenado de Contenedores', endpoint: '/api/nursery/container-fills',
    summary: r => _esc(`${r.container_types?.name || '—'} — ${r.containers_filled ?? ''} u.`),
    sub: r => _esc(r.date || ''),
  },
  {
    key: 'crear-lote', label: 'Lotes de Plantas', endpoint: '/api/nursery/lots',
    summary: r => _esc(`${r.lot_id || '—'} · ${r.nursery_species?.name || '—'}`),
    sub: r => _esc(`${NURSERY_STATUS_LABEL[r.status] || r.status} · ${r.date_start || ''}`),
  },
];

const MODULES = {
  alimentos: {
    label: 'Producción de Alimentos',
    resources: FOOD_RESOURCES,
    openForm: (type, record) => openFoodForm(type, record),
  },
  biofabrica: {
    label: 'Biofábrica',
    resources: BIO_RESOURCES,
    openForm: (type, record) => openBioForm(type, record),
  },
  vivero: {
    label: 'Vivero',
    resources: NURSERY_RESOURCES,
    openForm: (type, record) => openNurseryForm(type, record),
  },
};

// ─── STATE ──────────────────────────────────────────────────────────────────

let _currentRows = [];
let _lastList     = null; // { moduleKey, resourceKey }

// ─── HOME (elegir módulo + tipo de registro) ───────────────────────────────

export function openRecordsHome() {
  if (state.currentUser?.profile?.role !== 'admin') return;

  document.getElementById('con-title').textContent = 'Reportes — Registros';
  document.getElementById('con-back').onclick = () => show('finca-home');

  const html = Object.entries(MODULES).map(([modKey, mod]) => `
    <div class="rg">
      <h2>${_esc(mod.label)}</h2>
      <div class="grid">
        ${mod.resources.map(r => `
          <div class="gcard" onclick="openRecordsList('${modKey}','${r.key}')">
            <div class="ct">${_esc(r.label)}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  document.getElementById('conbody').innerHTML = html;
  show('con-screen');
}

// ─── LISTA de registros de un tipo ─────────────────────────────────────────

export async function openRecordsList(moduleKey, resourceKey) {
  _lastList = { moduleKey, resourceKey };
  const resCfg = MODULES[moduleKey]?.resources.find(r => r.key === resourceKey);
  if (!resCfg) return;

  document.getElementById('con-title').textContent = resCfg.label;
  document.getElementById('con-back').onclick = () => openRecordsHome();
  document.getElementById('conbody').innerHTML = `<div id="records-list-body" style="font-size:.8rem;font-family:sans-serif;color:var(--tm);font-style:italic;">Cargando…</div>`;
  show('con-screen');

  try {
    const rows = await _api(resCfg.endpoint);
    _renderRecordsList(moduleKey, resourceKey, rows);
  } catch (e) {
    const body = document.getElementById('records-list-body');
    if (body) body.textContent = `Error al cargar: ${e.message}`;
  }
}

function _renderRecordsList(moduleKey, resourceKey, rows) {
  const resCfg = MODULES[moduleKey].resources.find(r => r.key === resourceKey);
  const body = document.getElementById('records-list-body');
  if (!body) return;

  _currentRows = rows.slice().sort((a, b) =>
    (b.date || b.survey_date || b.created_at || '').localeCompare(a.date || a.survey_date || a.created_at || ''));

  if (!_currentRows.length) {
    body.innerHTML = `<div style="font-size:.8rem;font-family:sans-serif;color:var(--tm);font-style:italic;">Sin registros todavía.</div>`;
    return;
  }

  body.innerHTML = _currentRows.map((r, i) => `
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.75rem .9rem;
                margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:center;gap:.6rem;">
      <div style="min-width:0;">
        <div style="font-size:.85rem;font-family:sans-serif;color:var(--brown);">${resCfg.summary(r)}</div>
        <div style="font-size:.68rem;font-family:sans-serif;color:var(--tm);margin-top:.15rem;">${resCfg.sub(r)}</div>
      </div>
      <div style="display:flex;gap:.7rem;flex-shrink:0;">
        <button onclick="window._recEdit(${i})"
                style="background:none;border:none;color:var(--brown);font-size:.75rem;font-family:sans-serif;
                       cursor:pointer;text-decoration:underline;">Editar</button>
        <button onclick="window._recDelete(${i})"
                style="background:none;border:none;color:var(--clay);font-size:.75rem;font-family:sans-serif;
                       cursor:pointer;text-decoration:underline;">Borrar</button>
      </div>
    </div>`).join('');
}

window._recEdit = (i) => {
  const r = _currentRows[i];
  if (!r || !_lastList) return;
  editRecord(_lastList.moduleKey, _lastList.resourceKey, r);
};

window._recDelete = (i) => {
  const r = _currentRows[i];
  if (!r || !_lastList) return;
  deleteRecord(_lastList.moduleKey, _lastList.resourceKey, r.id);
};

window._backToRecordsList = () => {
  if (_lastList) openRecordsList(_lastList.moduleKey, _lastList.resourceKey);
  else openRecordsHome();
};

// ─── EDITAR / BORRAR ────────────────────────────────────────────────────────

export function editRecord(moduleKey, resourceKey, record) {
  MODULES[moduleKey]?.openForm(resourceKey, record);
}

export async function deleteRecord(moduleKey, resourceKey, id) {
  if (!confirm('¿Seguro que querés borrar este registro? Esta acción no se puede deshacer.')) return;
  const resCfg = MODULES[moduleKey]?.resources.find(r => r.key === resourceKey);
  if (!resCfg) return;
  try {
    await _api(`${resCfg.endpoint}/${id}`, 'DELETE');
    openRecordsList(moduleKey, resourceKey);
  } catch (e) {
    alert(`No se pudo borrar: ${e.message}`);
  }
}
