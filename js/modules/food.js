import { state } from './state.js';
import { show } from './navigation.js';
import { photoUploadWidget } from './photos.js';
import { stopRec } from './audio.js';

const API = 'https://tierramor-api.jabdelnour95.workers.dev';

// ─── MODULE STATE ──────────────────────────────────────────────────────────

let _cats       = null;  // { beds, crops, areas, subareas, bio }
let _plantings  = null;  // preloaded planting lots for lot-id lookup

let _inputRows    = [];  // bio-product rows (prep-cama, aplic-insumos)
let _availRows    = [];  // availability item rows
let _prepBedRows  = [];  // multiple bed rows for prep-cama
let _applyBedRows = [];  // specific bed rows for aplic-insumos
let _harvestRows  = [];  // one row per canasta in cosecha

let _applyScope = 'area'; // 'area' | 'beds'
let _maintScope = 'area'; // 'area' | 'bed'
let _activeForm = null;

// ─── API ───────────────────────────────────────────────────────────────────

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

// ─── CATALOGS ──────────────────────────────────────────────────────────────

// Orden natural de códigos de cama: "code.asc" del Worker es alfabético (CBA1, CBA10,
// CBA11, CBA2...); acá separamos el prefijo de letras del número final y comparamos
// el número como entero, para que quede CBA1, CBA2, ..., CBA10, CBA11.
function _bedCodeParts(code) {
  const m = /^(.*?)(\d+)$/.exec(code || '');
  return m ? { pre: m[1], num: parseInt(m[2], 10) } : { pre: code || '', num: 0 };
}

function _sortBedsNaturally(beds) {
  return [...(beds || [])].sort((a, b) => {
    const pa = _bedCodeParts(a.code), pb = _bedCodeParts(b.code);
    return pa.pre !== pb.pre ? pa.pre.localeCompare(pb.pre) : pa.num - pb.num;
  });
}

async function _loadCats() {
  if (_cats) return _cats;
  const [beds, crops, areas, subareas, bio, workers] = await Promise.all([
    _api('/api/catalogs/beds'),
    _api('/api/catalogs/crops'),
    _api('/api/catalogs/areas'),
    _api('/api/catalogs/subareas'),
    _api('/api/catalogs/bio-finished-products'),
    _api('/api/farm-workers').catch(() => []),
  ]);
  _cats = { beds: _sortBedsNaturally(beds), crops, areas, subareas, bio, workers };
  return _cats;
}

function _active(arr) {
  return (arr || []).filter(i => i.active !== false);
}

function _opts(arr, label = 'name', val = 'id') {
  return _active(arr).map(i => `<option value="${i[val]}">${i[label]}</option>`).join('');
}

const _cropOpts = () => `<option value="">— Cultivo —</option>${_opts(_cats?.crops || [])}
  <option value="__new__">── Nuevo cultivo ──</option>`;
const _areaOpts = () => `<option value="">— Área —</option>${_opts(_cats?.areas || [])}`;
const _bioOpts  = () => `<option value="">— Producto —</option>${_opts(_cats?.bio  || [])}`;

// Sólo algunas áreas tienen subáreas (ej: SAF Canelo, SAF Basecamp, Huerta, Basecamp Atrás);
// Ojoche y Vivero Greens no las tienen — el select queda vacío en ese caso.
function _subareasForArea(areaId) {
  return areaId ? _active(_cats?.subareas || []).filter(s => s.area_id === areaId) : [];
}

function _subareaOptsByArea(areaId) {
  const subs = _subareasForArea(areaId);
  return `<option value="">${subs.length ? '— Subárea —' : '— Sin subáreas —'}</option>${subs.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;
}

function _bedOptsByArea(areaId, subareaId = '', placeholder = '— Cama —') {
  let filtered = _active(_cats?.beds || []);
  if (areaId)    filtered = filtered.filter(b => b.area_id === areaId);
  if (subareaId) filtered = filtered.filter(b => b.subarea_id === subareaId);
  return `<option value="">${placeholder}</option>${filtered.map(b => `<option value="${b.id}">${b.code}</option>`).join('')}`;
}

// ─── AUDIO WIDGET ──────────────────────────────────────────────────────────

function _aw(id, ph) {
  return `<div class="aw">
    <textarea id="ta-${id}" placeholder="${ph}"
      style="width:100%;border:none;border-bottom:1px solid rgba(84,66,54,.1);padding:.7rem .85rem;
             font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;
             resize:none;height:72px;line-height:1.5;display:block;background:white;"></textarea>
    <div class="actl">
      <button class="bmk" id="mic-${id}" onclick="toggleMic('${id}')">🎙</button>
      <span class="mst" id="ms-${id}">Toca para dictar</span>
      <button class="bclr" onclick="document.getElementById('ta-${id}').value=''">Limpiar</button>
    </div>
  </div>`;
}

// ─── SCOPE TOGGLE WIDGET ───────────────────────────────────────────────────

function _scopeToggle(label, scopeVar, opts, callbackFn) {
  return `<div class="fg">
    <label>${label}</label>
    <div style="display:flex;gap:.5rem;margin-top:.35rem;">
      ${opts.map(([v, l], idx) => `
        <button id="scope-btn-${scopeVar}-${v}" type="button"
                onclick="${callbackFn}('${v}')"
                style="flex:1;padding:.55rem;font-size:.8rem;font-family:sans-serif;
                       border-radius:8px;cursor:pointer;transition:all .15s;
                       ${idx === 0 ? 'background:var(--brown);color:var(--cream);border:1px solid var(--brown);'
                                   : 'background:white;color:var(--brown);border:1px solid rgba(84,66,54,.2);'}">
          ${l}
        </button>`).join('')}
    </div>
  </div>`;
}

// ─── PARTICIPANTS FIELD ────────────────────────────────────────────────────

function _workersField() {
  const workers = _cats?.workers || [];
  const items = workers.length
    ? workers.map(w => `
        <label style="display:flex;align-items:center;gap:.6rem;padding:.5rem .9rem;cursor:pointer;
                       font-size:.85rem;font-family:sans-serif;color:var(--brown);">
          <input type="checkbox" name="worker-participant" value="${w.name}"
                 style="width:16px;height:16px;accent-color:var(--clay);flex-shrink:0;"
                 onchange="window._foodUpdateWorkerLabel()">
          ${w.name}
        </label>`).join('')
    : `<div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);padding:.6rem .9rem;font-style:italic;">Sin trabajadores en el sistema.</div>`;

  return `
    <div class="fg">
      <label>Participantes</label>
      <div style="position:relative;">
        <button type="button" id="workers-btn"
                style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.7rem .85rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);
                       outline:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left;"
                onclick="window._foodToggleWorkerDrop()">
          <span id="workers-label" style="color:rgba(84,66,54,.5);">Seleccionar participantes...</span>
          <span class="wd-arrow" style="font-size:.7rem;margin-left:.5rem;flex-shrink:0;color:var(--tm);">▾</span>
        </button>
        <div id="workers-dropdown"
             style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;
                    background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                    box-shadow:0 4px 16px rgba(0,0,0,.1);z-index:100;max-height:220px;overflow-y:auto;padding:.3rem 0;">
          ${items}
        </div>
      </div>
    </div>`;
}

function _getParticipants() {
  return [...document.querySelectorAll('input[name="worker-participant"]:checked')]
    .map(i => i.value).join(', ');
}

function _buildObs(obsId) {
  const obs = document.getElementById(`ta-${obsId}`)?.value?.trim() || null;
  const p   = _getParticipants() || null;
  if (!p && !obs) return null;
  return [p ? `Participantes: ${p}` : null, obs].filter(Boolean).join('\n\n');
}

// ─── BIO-INPUT ROWS ────────────────────────────────────────────────────────

export function addFoodInputRow() {
  _inputRows.push({ product_id: '', qty: '', total_liquid: '' });
  _renderInputRows();
}

export function removeFoodInputRow(idx) {
  _inputRows.splice(idx, 1);
  _renderInputRows();
}

function _renderInputRows() {
  const el = document.getElementById('food-input-rows');
  if (!el) return;
  if (!_inputRows.length) {
    el.innerHTML = `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;padding:.2rem 0;">Sin insumos agregados.</div>`;
    return;
  }
  // aplic-insumos necesita registrar tanto el ingrediente activo como el volumen total
  // de líquido aplicado (ej: 3 bombas de 18L con 1L de Emulsión c/u = 3L activo / 54L líquido)
  const withLiquid = _activeForm === 'aplic-insumos';
  el.innerHTML = _inputRows.map((row, i) => withLiquid ? `
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.7rem .85rem;margin-bottom:.6rem;">
      <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.55rem;">
        <select style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="fi-prod-${i}" onchange="window._fic(${i},'product_id',this.value); window._foodBioUnit(${i})">${_bioOpts()}</select>
        <button onclick="removeFoodInputRow(${i})"
                style="background:none;border:none;color:var(--clay);font-size:1.25rem;cursor:pointer;padding:.05rem .3rem;line-height:1;flex-shrink:0;">×</button>
      </div>
      <div id="fi-grid-${i}" style="display:grid;grid-template-columns:1fr;gap:.5rem;">
        <div>
          <div style="font-size:.65rem;font-family:sans-serif;color:var(--tm);margin-bottom:.25rem;" id="fi-lbl-qty-${i}">Ingrediente activo</div>
          <input type="number" step="0.01" min="0" placeholder="Cant."
                 style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                        padding:.6rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
                 id="fi-qty-${i}" value="${row.qty}" oninput="window._fic(${i},'qty',this.value)">
        </div>
        <div id="fi-liq-wrap-${i}" style="display:none;">
          <div style="font-size:.65rem;font-family:sans-serif;color:var(--tm);margin-bottom:.25rem;" id="fi-lbl-liq-${i}">Líquido total aplicado</div>
          <input type="number" step="0.01" min="0" placeholder="Total"
                 style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                        padding:.6rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
                 id="fi-liq-${i}" value="${row.total_liquid}" oninput="window._fic(${i},'total_liquid',this.value)">
        </div>
      </div>
    </div>` : `
    <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;">
      <select style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                     padding:.6rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
              id="fi-prod-${i}" onchange="window._fic(${i},'product_id',this.value); window._foodBioUnit(${i})">${_bioOpts()}</select>
      <input type="number" step="0.01" min="0" placeholder="Cant."
             style="width:72px;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                    padding:.6rem .5rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);
                    outline:none;text-align:center;"
             id="fi-qty-${i}" value="${row.qty}" oninput="window._fic(${i},'qty',this.value)">
      <span id="fi-unit-${i}" style="width:34px;flex-shrink:0;font-size:.74rem;font-family:sans-serif;color:var(--tm);text-align:center;"></span>
      <button onclick="removeFoodInputRow(${i})"
              style="background:none;border:none;color:var(--clay);font-size:1.25rem;cursor:pointer;padding:.05rem .3rem;line-height:1;flex-shrink:0;">×</button>
    </div>`).join('');
  _inputRows.forEach((row, i) => {
    const s = document.getElementById(`fi-prod-${i}`);
    if (s && row.product_id) { s.value = row.product_id; window._foodBioUnit(i); }
  });
}

// ─── PREP-BED ROWS (multiple beds for prep-cama) ───────────────────────────

export function addPrepBedRow() {
  _prepBedRows.push({ area_id: '', subarea_id: '', bed_id: '' });
  _renderPrepBedRows();
}

export function removePrepBedRow(idx) {
  _prepBedRows.splice(idx, 1);
  _renderPrepBedRows();
}

function _renderPrepBedRows() {
  const el = document.getElementById('prep-bed-rows');
  if (!el) return;
  el.innerHTML = _prepBedRows.map((row, i) => `
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.6rem .65rem;margin-bottom:.5rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.5rem;">
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="pb-area-${i}"
                onchange="window._foodAreaChanged('pb-area-${i}','pb-sub-${i}','pb-bed-${i}'); window._fpb(${i},'area_id',this.value)">
          ${_areaOpts()}
        </select>
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="pb-sub-${i}"
                onchange="window._foodSubareaChanged('pb-area-${i}','pb-sub-${i}','pb-bed-${i}'); window._fpb(${i},'subarea_id',this.value)">
          <option value="">— Seleccioná el área primero —</option>
        </select>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center;">
        <select style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="pb-bed-${i}" onchange="window._fpb(${i},'bed_id',this.value)">
          <option value="">— Cama —</option>
        </select>
        <button onclick="removePrepBedRow(${i})"
                style="background:none;border:none;color:var(--clay);font-size:1.25rem;cursor:pointer;padding:.05rem .3rem;line-height:1;flex-shrink:0;">×</button>
      </div>
    </div>`).join('');
  _prepBedRows.forEach((row, i) => {
    const a = document.getElementById(`pb-area-${i}`);
    if (a && row.area_id) {
      a.value = row.area_id;
      const s = document.getElementById(`pb-sub-${i}`);
      if (s) {
        s.innerHTML = _subareaOptsByArea(row.area_id);
        if (row.subarea_id) s.value = row.subarea_id;
      }
      const b = document.getElementById(`pb-bed-${i}`);
      if (b) {
        b.innerHTML = _bedOptsByArea(row.area_id, row.subarea_id || '', '— Cama —');
        if (row.bed_id) b.value = row.bed_id;
      }
    }
  });
}

// ─── APPLY-BED ROWS (specific beds for aplic-insumos) ─────────────────────

export function addApplyBedRow() {
  _applyBedRows.push({ bed_id: '' });
  _renderApplyBedRows();
}

export function removeApplyBedRow(idx) {
  _applyBedRows.splice(idx, 1);
  _renderApplyBedRows();
}

function _renderApplyBedRows() {
  const el = document.getElementById('apply-bed-rows');
  if (!el) return;
  const areaId    = document.getElementById('f-area')?.value || '';
  const subareaId = document.getElementById('f-subarea')?.value || '';
  el.innerHTML = _applyBedRows.map((row, i) => `
    <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;">
      <select style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                     padding:.6rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
              id="ab-bed-${i}" onchange="window._fab(${i},'bed_id',this.value)">
        ${_bedOptsByArea(areaId, subareaId, '— Cama —')}
      </select>
      <button onclick="removeApplyBedRow(${i})"
              style="background:none;border:none;color:var(--clay);font-size:1.25rem;cursor:pointer;padding:.05rem .3rem;line-height:1;flex-shrink:0;">×</button>
    </div>`).join('');
  _applyBedRows.forEach((row, i) => {
    const s = document.getElementById(`ab-bed-${i}`);
    if (s && row.bed_id) s.value = row.bed_id;
  });
}

// ─── HARVEST ROWS ──────────────────────────────────────────────────────────

export function addHarvestRow() {
  _harvestRows.push({ crop_id: '', area_id: '', subarea_id: '', bed_id: '', qty: '', unit: '' });
  _renderHarvestRows();
}

export function removeHarvestRow(idx) {
  _harvestRows.splice(idx, 1);
  _renderHarvestRows();
}

function _renderHarvestRows() {
  const el = document.getElementById('harvest-rows');
  if (!el) return;
  if (!_harvestRows.length) {
    el.innerHTML = `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;padding:.2rem 0;">Sin filas agregadas. Agregá una por cada canasta.</div>`;
    return;
  }
  el.innerHTML = _harvestRows.map((row, i) => `
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.75rem .85rem;margin-bottom:.65rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.55rem;">
        <span style="font-size:.68rem;font-family:sans-serif;color:var(--tm);text-transform:uppercase;letter-spacing:.07em;">Registro ${i + 1}</span>
        <button onclick="removeHarvestRow(${i})" style="background:none;border:none;color:var(--clay);font-size:.78rem;font-family:sans-serif;cursor:pointer;">Quitar</button>
      </div>
      <div class="fg" style="margin-bottom:.6rem;">
        <select style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .7rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="hr-crop-${i}" onchange="window._fhr(${i},'crop_id',this.value); window._foodHarvestUnit(${i})">
          ${_cropOpts().replace('<option value="__new__">── Nuevo cultivo ──</option>', '')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.55rem;">
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="hr-area-${i}"
                onchange="window._fhr(${i},'area_id',this.value); window._foodAreaChanged('hr-area-${i}','hr-sub-${i}','hr-bed-${i}')">
          ${_areaOpts()}
        </select>
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="hr-sub-${i}"
                onchange="window._fhr(${i},'subarea_id',this.value); window._foodSubareaChanged('hr-area-${i}','hr-sub-${i}','hr-bed-${i}')">
          <option value="">— Seleccioná el área primero —</option>
        </select>
      </div>
      <div class="fg" style="margin-bottom:.55rem;">
        <select style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.6rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="hr-bed-${i}" onchange="window._fhr(${i},'bed_id',this.value)">
          <option value="">— Cama —</option>
        </select>
      </div>
      <div style="display:flex;gap:.5rem;">
        <input type="number" step="0.001" min="0" placeholder="Cantidad"
               style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                      padding:.6rem .7rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;"
               id="hr-qty-${i}" value="${row.qty}" oninput="window._fhr(${i},'qty',this.value)">
        <input type="text" placeholder="Unidad"
               style="width:72px;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                      padding:.6rem .5rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;"
               id="hr-unit-${i}" value="${row.unit}" oninput="window._fhr(${i},'unit',this.value)">
      </div>
    </div>`).join('');
  _harvestRows.forEach((row, i) => {
    const a = document.getElementById(`hr-area-${i}`);
    if (a && row.area_id) {
      a.value = row.area_id;
      const s = document.getElementById(`hr-sub-${i}`);
      if (s) {
        s.innerHTML = _subareaOptsByArea(row.area_id);
        if (row.subarea_id) s.value = row.subarea_id;
      }
      const b = document.getElementById(`hr-bed-${i}`);
      if (b) {
        b.innerHTML = _bedOptsByArea(row.area_id, row.subarea_id || '', '— Cama —');
        if (row.bed_id) b.value = row.bed_id;
      }
    }
    const cropEl = document.getElementById(`hr-crop-${i}`);
    if (cropEl && row.crop_id) cropEl.value = row.crop_id;
  });
}

// ─── AVAILABILITY ROWS ─────────────────────────────────────────────────────

export function addFoodAvailRow() {
  _availRows.push({ crop_id: '', area_id: '', subarea_id: '', bed_id: '', qty: '', unit: '' });
  _renderAvailRows();
}

export function removeFoodAvailRow(idx) {
  _availRows.splice(idx, 1);
  _renderAvailRows();
}

function _renderAvailRows() {
  const el = document.getElementById('food-input-rows');
  if (!el) return;
  if (!_availRows.length) {
    el.innerHTML = `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;padding:.2rem 0;">Sin cultivos agregados.</div>`;
    return;
  }
  el.innerHTML = _availRows.map((row, i) => `
    <div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.7rem .85rem;margin-bottom:.6rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
        <span style="font-size:.68rem;font-family:sans-serif;color:var(--tm);text-transform:uppercase;letter-spacing:.07em;">Cultivo ${i + 1}</span>
        <button onclick="removeFoodAvailRow(${i})" style="background:none;border:none;color:var(--clay);font-size:.78rem;font-family:sans-serif;cursor:pointer;">Quitar</button>
      </div>
      <div class="fg" style="margin-bottom:.5rem;">
        <select style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.55rem .6rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="av-crop-${i}" onchange="window._fac(${i},'crop_id',this.value); window._foodAvailUnit(${i})">
          ${_cropOpts().replace('<option value="__new__">── Nuevo cultivo ──</option>', '')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.5rem;">
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.55rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="av-area-${i}"
                onchange="window._fac(${i},'area_id',this.value); window._foodAreaChanged('av-area-${i}','av-sub-${i}','av-bed-${i}')">
          ${_areaOpts()}
        </select>
        <select style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.55rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="av-sub-${i}"
                onchange="window._fac(${i},'subarea_id',this.value); window._foodSubareaChanged('av-area-${i}','av-sub-${i}','av-bed-${i}')">
          <option value="">— Seleccioná el área primero —</option>
        </select>
      </div>
      <div class="fg" style="margin-bottom:.5rem;">
        <select style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                       padding:.55rem .6rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);outline:none;"
                id="av-bed-${i}" onchange="window._fac(${i},'bed_id',this.value)">
          <option value="">— Cama —</option>
        </select>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center;">
        <input type="number" step="0.001" min="0" placeholder="Cantidad estimada"
               style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                      padding:.55rem .65rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;"
               id="av-qty-${i}" value="${row.qty}" oninput="window._fac(${i},'qty',this.value)">
        <input type="text" placeholder="Unidad"
               style="width:70px;background:rgba(84,66,54,.05);border:1px solid rgba(84,66,54,.15);border-radius:8px;
                      padding:.55rem .5rem;font-size:.82rem;font-family:sans-serif;color:var(--brown);outline:none;text-align:center;"
               id="av-unit-${i}" value="${row.unit}" oninput="window._fac(${i},'unit',this.value)" readonly>
      </div>
    </div>`).join('');
  _availRows.forEach((row, i) => {
    const a = document.getElementById(`av-area-${i}`);
    if (a && row.area_id) {
      a.value = row.area_id;
      const s = document.getElementById(`av-sub-${i}`);
      if (s) {
        s.innerHTML = _subareaOptsByArea(row.area_id);
        if (row.subarea_id) s.value = row.subarea_id;
      }
      const b = document.getElementById(`av-bed-${i}`);
      if (b) {
        b.innerHTML = _bedOptsByArea(row.area_id, row.subarea_id || '', '— Cama —');
        if (row.bed_id) b.value = row.bed_id;
      }
    }
    const cropEl = document.getElementById(`av-crop-${i}`);
    if (cropEl && row.crop_id) cropEl.value = row.crop_id;
    const uEl = document.getElementById(`av-unit-${i}`);
    if (uEl && row.unit) uEl.value = row.unit;
  });
}

// ─── FOOD SCREEN ───────────────────────────────────────────────────────────

export async function openFood() {
  show('food-screen');
  _loadCats()
    .then(() => _loadRecentHarvests())
    .catch(() => {
      const el = document.getElementById('food-recent-body');
      if (el) el.innerHTML = `<div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;">Sin conexión al servidor.</div>`;
    });
}

async function _loadRecentHarvests() {
  const el = document.getElementById('food-recent-body');
  if (!el) return;
  try {
    const harvests = await _api('/api/food/harvests');
    if (!harvests.length) {
      el.innerHTML = `<div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;padding:.3rem 0;">No hay cosechas registradas aún.</div>`;
      return;
    }
    el.innerHTML = harvests.slice(0, 5).map(h => {
      const crop = (_cats?.crops || []).find(c => c.id === h.crop_id);
      const area = (_cats?.areas || []).find(a => a.id === h.area_id);
      const bed  = (_cats?.beds  || []).find(b => b.id === h.bed_id);
      const loc  = [area?.name, bed?.code].filter(Boolean).join(' · ') || '—';
      return `<div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;
                           padding:.7rem .9rem;margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:.87rem;font-family:sans-serif;color:var(--brown);font-weight:500;">${crop?.name || '—'}</div>
          <div style="font-size:.67rem;font-family:sans-serif;color:var(--tm);margin-top:.1rem;">${loc} · ${h.date}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:.8rem;">
          <div style="font-size:.88rem;font-family:sans-serif;color:var(--clay);font-weight:500;">${h.real_quantity}</div>
          <div style="font-size:.62rem;font-family:sans-serif;color:var(--tm);">${h.unit}</div>
        </div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = `<div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;">Sin datos disponibles.</div>`;
  }
}

// ─── WEEK REF HELPER ───────────────────────────────────────────────────────

function _currentWeekRef() {
  const d  = new Date();
  const dd = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dd.getUTCDay() || 7;
  dd.setUTCDate(dd.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dd.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((dd - yearStart) / 86400000) + 1) / 7);
  return `${dd.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

// ─── FORM DEFINITIONS ──────────────────────────────────────────────────────

const FORMS = {

  siembra: {
    title: 'Registrar Siembra',
    build: () => `
      <div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg">
        <label>Área productiva</label>
        <select id="f-area" onchange="window._foodAreaChanged('f-area','f-subarea','f-bed')">${_areaOpts()}</select>
      </div>
      <div class="fg">
        <label>Subárea</label>
        <select id="f-subarea" onchange="window._foodSubareaChanged('f-area','f-subarea','f-bed')">
          <option value="">— Seleccioná el área primero —</option>
        </select>
      </div>
      <div class="fg">
        <label>Cama</label>
        <select id="f-bed"><option value="">— Seleccioná el área primero —</option></select>
      </div>
      <div class="fg">
        <label>Cultivo</label>
        <select id="f-crop" onchange="window._foodNewCropToggle()">${_cropOpts()}</select>
        <div id="new-crop-form" style="display:none;margin-top:.55rem;background:rgba(153,92,68,.05);
             border:1px dashed rgba(153,92,68,.3);border-radius:8px;padding:.75rem;">
          <div style="font-size:.68rem;font-family:sans-serif;color:var(--tm);text-transform:uppercase;
                      letter-spacing:.07em;margin-bottom:.5rem;">Nuevo cultivo</div>
          <input type="text" id="nc-name" placeholder="Nombre del cultivo *"
                 style="width:100%;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                        padding:.6rem .75rem;font-size:.85rem;font-family:sans-serif;color:var(--brown);
                        outline:none;margin-bottom:.4rem;">
          <div style="display:flex;gap:.5rem;">
            <input type="text" id="nc-unit" placeholder="Unidad de cosecha (ej: kg)"
                   style="flex:1;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                          padding:.6rem .7rem;font-size:.85rem;font-family:sans-serif;color:var(--brown);outline:none;">
            <input type="number" id="nc-price" step="0.01" min="0" placeholder="Precio/unidad"
                   style="width:110px;background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                          padding:.6rem .65rem;font-size:.85rem;font-family:sans-serif;color:var(--brown);outline:none;">
          </div>
        </div>
      </div>
      <div class="fg">
        <label>Tipo de material</label>
        <select id="f-material">
          <option value="">— Seleccionar —</option>
          <option value="semilla">Semilla</option>
          <option value="estaca">Estaca</option>
          <option value="almácigo">Almácigo (transplante)</option>
        </select>
      </div>
      <div class="fg"><label>Densidad / Cantidad</label>
        <input type="text" id="f-density" placeholder="Ej: 200 semillas, 3 plantas/m²"></div>
      ${_workersField()}
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('food-photos')}`,
    afterRender: () => {
      // Load all beds initially (no area filter)
      const bedSel = document.getElementById('f-bed');
      if (bedSel) bedSel.innerHTML = _bedOptsByArea('');
    },
  },

  'prep-cama': {
    title: 'Preparar Cama',
    build: () => `
      <div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg">
        <label>Camas preparadas</label>
        <div id="prep-bed-rows" style="margin-top:.4rem;"></div>
        <button type="button" onclick="addPrepBedRow()" class="add-row-btn">+ Agregar cama</button>
      </div>
      <div class="fg">
        <label>Insumos biológicos aplicados</label>
        <div id="food-input-rows" style="margin-top:.4rem;"></div>
        <button type="button" onclick="addFoodInputRow()" class="add-row-btn">+ Agregar insumo</button>
      </div>
      ${_workersField()}
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('food-photos')}`,
    afterRender: () => {
      addPrepBedRow();
      _renderInputRows();
    },
  },

  'aplic-insumos': {
    title: 'Aplicar Insumos',
    build: () => `
      <div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg">
        <label>Área productiva</label>
        <select id="f-area" onchange="window._foodApplyAreaChanged()">${_areaOpts()}</select>
      </div>
      <div class="fg">
        <label>Subárea</label>
        <div class="doc-note" style="margin-bottom:.35rem;">Opcional — sólo para ubicar más rápido las camas si elegís "Camas específicas".</div>
        <select id="f-subarea" onchange="window._foodApplyScopeAreaChanged()">
          <option value="">— Seleccioná el área primero —</option>
        </select>
      </div>
      <div class="fg"><label>Método de aplicación</label>
        <select id="f-method">
          <option value="">— Seleccionar —</option>
          <option value="foliar">Foliar</option>
          <option value="drench">Drench (suelo empapado)</option>
          <option value="al suelo">Al suelo</option>
          <option value="fertiriego">Fertiriego</option>
        </select>
      </div>
      ${_scopeToggle('Ámbito de aplicación', 'apply',
        [['area','Toda el área'], ['beds','Camas específicas']],
        'window._foodApplyScope')}
      <div id="apply-scope-content" style="margin-top:-.4rem;margin-bottom:.5rem;"></div>
      <div class="fg">
        <label>Insumos biológicos aplicados</label>
        <div class="doc-note" style="margin-bottom:.6rem;">
          Ej: 3 bombas de 18L con 1L de Emulsión de Pescado c/u → Ingrediente activo: <strong>3L</strong> · Líquido total aplicado: <strong>54L</strong>.
        </div>
        <div id="food-input-rows" style="margin-top:.4rem;"></div>
        <button type="button" onclick="addFoodInputRow()" class="add-row-btn">+ Agregar insumo</button>
      </div>
      ${_workersField()}
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('food-photos')}`,
    afterRender: () => {
      _applyScope = 'area';
      _applyBedRows = [];
      _renderInputRows();
      _updateApplyScopeUI();
    },
  },

  mantenimiento: {
    title: 'Mantenimiento de Área',
    build: () => `
      <div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="fg">
        <label>Área productiva</label>
        <select id="f-area" onchange="window._foodAreaChanged('f-area','f-subarea','f-bed')">${_areaOpts()}</select>
      </div>
      ${_scopeToggle('Nivel de actividad', 'maint',
        [['area','Área entera'], ['bed','Cama específica']],
        'window._foodMaintScope')}
      <div id="maint-bed-section" style="display:none;">
        <div class="fg">
          <label>Subárea</label>
          <select id="f-subarea" onchange="window._foodSubareaChanged('f-area','f-subarea','f-bed')">
            <option value="">— Seleccioná el área primero —</option>
          </select>
        </div>
        <div class="fg">
          <label>Cama</label>
          <select id="f-bed"><option value="">— Seleccioná el área primero —</option></select>
        </div>
      </div>
      <div class="fg">
        <label>Actividad realizada</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem .7rem;margin-top:.35rem;">
          ${[['chapea','Chapea'],['weeding','Deshierbe'],['mulch','Mulch'],
             ['pruning','Poda'],['trellis','Tutoreado'],['irrigation','Riego'],
             ['clearing','Limpieza de área']]
            .map(([v, l]) => `
              <label style="display:flex;align-items:center;gap:.45rem;font-size:.82rem;
                            font-family:sans-serif;color:var(--brown);cursor:pointer;padding:.3rem 0;">
                <input type="checkbox" name="mt" value="${v}"
                       style="width:16px;height:16px;accent-color:var(--clay);flex-shrink:0;"> ${l}
              </label>`).join('')}
        </div>
      </div>
      <div class="fg">
        <label>Estado de la tarea</label>
        <select id="f-status">
          <option value="completed">✅ Completada</option>
          <option value="pending">⏳ Quedó pendiente de terminar</option>
        </select>
      </div>
      <div class="fg"><label>Duración (minutos)</label>
        <input type="number" id="f-duration" min="0" placeholder="0"></div>
      ${_workersField()}
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Observaciones o dicta nota de voz...')}</div>
      ${photoUploadWidget('food-photos')}`,
    afterRender: () => {
      _maintScope = 'area';
    },
  },

  disponibilidad: {
    title: 'Disponibilidad Semanal',
    build: () => `
      <div class="fg"><label>Semana</label>
        <input type="week" id="f-week" value="${_currentWeekRef()}"></div>
      <div class="fg">
        <label>Fecha del recorrido</label>
        <div style="font-size:.67rem;font-family:sans-serif;color:var(--tm);margin-bottom:.3rem;">Día en que se recorrió la finca para estimar la disponibilidad.</div>
        <input type="date" id="f-fecha">
      </div>
      <div class="fg">
        <label>Responsable del relevamiento</label>
        <input type="text" id="f-responsible" placeholder="Nombre de quien hizo el recorrido"
               style="background:white;border:1px solid rgba(84,66,54,.2);border-radius:8px;
                      padding:.7rem .85rem;font-size:.88rem;font-family:sans-serif;color:var(--brown);outline:none;width:100%;">
      </div>
      <div class="fg">
        <label>Cultivos disponibles</label>
        <div id="food-input-rows" style="margin-top:.4rem;"></div>
        <button type="button" onclick="addFoodAvailRow()" class="add-row-btn">+ Agregar cultivo</button>
      </div>
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Notas generales...')}</div>`,
    afterRender: () => {
      _renderAvailRows();
    },
  },

  cosecha: {
    title: 'Registrar Cosecha',
    build: () => `
      <div class="fg"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="doc-note" style="margin-bottom:.9rem;">
        Agregá una fila por cada combinación de <strong>cultivo + área + cama</strong>. Si cosechaste el mismo
        cultivo de camas o áreas distintas, agregá una fila separada por cada una.
      </div>
      <div class="fg">
        <label>Registro de cosecha</label>
        <div id="harvest-rows" style="margin-top:.4rem;"></div>
        <button type="button" onclick="addHarvestRow()" class="add-row-btn">+ Agregar registro</button>
      </div>
      ${_workersField()}
      <div class="fg"><label>Observaciones</label>${_aw('obs', 'Observaciones...')}</div>
      ${photoUploadWidget('food-photos')}`,
    afterRender: () => {
      addHarvestRow();
    },
  },
};

// ─── SCOPE UI HELPERS ──────────────────────────────────────────────────────

function _updateScopeBtns(prefix, active) {
  ['area', 'beds', 'bed'].forEach(v => {
    const btn = document.getElementById(`scope-btn-${prefix}-${v}`);
    if (!btn) return;
    const isActive = v === active;
    btn.style.background = isActive ? 'var(--brown)' : 'white';
    btn.style.color      = isActive ? 'var(--cream)' : 'var(--brown)';
    btn.style.border     = isActive ? '1px solid var(--brown)' : '1px solid rgba(84,66,54,.2)';
  });
}

function _updateApplyScopeUI() {
  _updateScopeBtns('apply', _applyScope);
  const el = document.getElementById('apply-scope-content');
  if (!el) return;
  if (_applyScope === 'area') {
    el.innerHTML = `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;padding:.2rem 0 .5rem;">Se registrará como aplicación a toda el área seleccionada.</div>`;
  } else {
    el.innerHTML = `
      <div style="margin-top:.2rem;padding-bottom:.5rem;">
        <div id="apply-bed-rows" style="margin-bottom:.4rem;"></div>
        <button type="button" onclick="addApplyBedRow()" class="add-row-btn">+ Agregar cama</button>
      </div>`;
    if (!_applyBedRows.length) addApplyBedRow();
    else _renderApplyBedRows();
  }
}

// ─── OPEN FORM ─────────────────────────────────────────────────────────────

export function openFoodForm(type) {
  stopRec();
  _activeForm  = type;
  _inputRows   = [];
  _availRows   = [];
  _prepBedRows = [];
  _applyBedRows = [];
  _harvestRows = [];

  const def = FORMS[type];
  if (!def) return;

  document.getElementById('ft').textContent = def.title;
  document.getElementById('fs-back').onclick = () => { stopRec(); openFood(); };
  document.getElementById('fbody').innerHTML = `
    <h2 style="font-size:1.05rem;font-weight:normal;font-style:italic;color:var(--brown);margin-bottom:1.1rem;">${def.title}</h2>
    ${def.build()}
    <button class="btn-sub" id="food-btn-sub" onclick="submitFoodForm()">Guardar registro</button>
    <div class="fnote">Los datos se guardan en la base de datos de Tierramor.</div>
    <div class="ok-msg" id="food-ok">
      <p id="food-ok-txt">✅ Guardado correctamente.</p>
      <button class="btn-sub green" style="margin-top:.7rem;" onclick="openFoodForm('${type}')">Agregar otro registro</button>
    </div>
    <div id="food-err" style="display:none;background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.3);
                              border-radius:10px;padding:1rem;text-align:center;margin-top:.9rem;">
      <p style="font-size:.82rem;font-family:sans-serif;color:#c0392b;" id="food-err-txt"></p>
    </div>`;

  const dateEl = document.getElementById('f-fecha');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);

  if (def.afterRender) def.afterRender();

  show('fs');
}

// ─── SUBMIT ────────────────────────────────────────────────────────────────

export async function submitFoodForm() {
  stopRec();
  const userId = state.currentUser?.id;
  if (!userId) return;

  const btn    = document.getElementById('food-btn-sub');
  const errEl  = document.getElementById('food-err');
  const errTxt = document.getElementById('food-err-txt');
  const okEl   = document.getElementById('food-ok');

  btn.disabled    = true;
  btn.textContent = 'Guardando...';
  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  try {
    const date = document.getElementById('f-fecha')?.value;
    if (!date) throw new Error('Ingresá la fecha.');
    const obs = _buildObs('obs');

    switch (_activeForm) {

      case 'siembra': {
        const area_id  = document.getElementById('f-area')?.value;
        const bed_id   = document.getElementById('f-bed')?.value;
        const material = document.getElementById('f-material')?.value;
        const density  = document.getElementById('f-density')?.value?.trim();
        if (!bed_id) throw new Error('Seleccioná la cama.');

        let crop_id = document.getElementById('f-crop')?.value;
        if (crop_id === '__new__') {
          const name  = document.getElementById('nc-name')?.value?.trim();
          const unit  = document.getElementById('nc-unit')?.value?.trim() || 'unidad';
          const price = parseFloat(document.getElementById('nc-price')?.value) || 0;
          if (!name) throw new Error('Ingresá el nombre del nuevo cultivo.');
          const newCrop = await _api('/api/catalogs/crops', 'POST', {
            name, harvest_unit: unit, internal_price: price, active: true,
          });
          crop_id = newCrop[0]?.id || newCrop.id;
          _cats = null; // invalidate cache so crop appears on next load
        }
        if (!crop_id) throw new Error('Seleccioná el cultivo.');

        const qty_density = [material, density].filter(Boolean).join(' · ') || null;
        await _api('/api/food/plantings', 'POST', {
          date, bed_id, crop_id,
          quantity_density: qty_density,
          performed_by: userId, created_by: userId,
          observations: obs,
        });

        okEl.style.display = 'block';
        document.getElementById('food-ok-txt').textContent = '✅ Siembra registrada. El ID de lote fue generado automáticamente.';
        btn.textContent = 'Guardado ✓';
        break;
      }

      case 'prep-cama': {
        const validBeds = _prepBedRows.filter(r => r.bed_id);
        if (!validBeds.length) throw new Error('Agregá al menos una cama.');
        const inputs = _inputRows
          .filter(r => r.product_id && r.qty)
          .map(r => ({ bio_product_id: r.product_id, quantity: parseFloat(r.qty) }));
        await Promise.all(validBeds.map(r =>
          _api('/api/food/bed-preparations', 'POST', {
            date, bed_id: r.bed_id,
            performed_by: userId, created_by: userId,
            observations: obs, inputs,
          })
        ));
        okEl.style.display = 'block';
        btn.textContent = `Guardado ✓ (${validBeds.length} cama${validBeds.length > 1 ? 's' : ''})`;
        break;
      }

      case 'aplic-insumos': {
        const area_id = document.getElementById('f-area')?.value;
        if (!area_id) throw new Error('Seleccioná el área.');
        const method = document.getElementById('f-method')?.value || null;
        const items  = _inputRows
          .filter(r => r.product_id && r.qty)
          .map(r => ({
            bio_product_id: r.product_id,
            quantity: parseFloat(r.qty),
            total_liquid_quantity: r.total_liquid ? parseFloat(r.total_liquid) : null,
          }));
        // Include specific beds in observations if scope = beds
        const bedNote = _applyScope === 'beds' && _applyBedRows.length
          ? `Camas: ${_applyBedRows.map(r => {
              const b = (_cats?.beds || []).find(b => b.id === r.bed_id);
              return b?.code || r.bed_id;
            }).filter(Boolean).join(', ')}`
          : null;
        const fullObs = [bedNote, document.getElementById('ta-obs')?.value?.trim(),
                         _getParticipants() ? `Participantes: ${_getParticipants()}` : null]
                        .filter(Boolean).join('\n\n') || null;
        await _api('/api/food/input-applications', 'POST', {
          date, area_id, method,
          performed_by: userId, created_by: userId,
          observations: fullObs, items,
        });
        okEl.style.display = 'block';
        btn.textContent = 'Guardado ✓';
        break;
      }

      case 'mantenimiento': {
        const area_id = document.getElementById('f-area')?.value;
        if (!area_id) throw new Error('Seleccioná el área.');
        const types = [...document.querySelectorAll('input[name="mt"]:checked')].map(el => el.value);
        if (!types.length) throw new Error('Seleccioná al menos un tipo de actividad.');
        const status  = document.getElementById('f-status')?.value || 'completed';
        const bedNote = _maintScope === 'bed'
          ? (() => { const b = document.getElementById('f-bed')?.value; const bed = (_cats?.beds||[]).find(x=>x.id===b); return bed ? `Cama: ${bed.code}` : null; })()
          : null;
        const fullObs = [bedNote, status === 'pending' ? '⏳ Quedó pendiente de terminar.' : null,
                         document.getElementById('ta-obs')?.value?.trim(),
                         _getParticipants() ? `Participantes: ${_getParticipants()}` : null]
                        .filter(Boolean).join('\n\n') || null;
        await _api('/api/food/area-maintenance', 'POST', {
          date, area_id,
          maintenance_types: types,
          duration_minutes: parseInt(document.getElementById('f-duration')?.value) || null,
          performed_by: userId, created_by: userId,
          observations: fullObs,
        });
        okEl.style.display = 'block';
        btn.textContent = 'Guardado ✓';
        break;
      }

      case 'disponibilidad': {
        const week_ref    = document.getElementById('f-week')?.value;
        const responsible = document.getElementById('f-responsible')?.value?.trim();
        if (!week_ref) throw new Error('Seleccioná la semana.');
        const check = await _api('/api/food/availability/check', 'POST', { week_ref });
        if (check.exists) throw new Error(`Ya existe una disponibilidad para ${week_ref}.`);
        const items = _availRows
          .filter(r => r.crop_id && r.area_id && r.qty)
          .map(r => ({ crop_id: r.crop_id, area_id: r.area_id, estimated_quantity: parseFloat(r.qty), unit: r.unit || '' }));
        if (!items.length) throw new Error('Agregá al menos un cultivo disponible.');
        const fullObs = [responsible ? `Responsable: ${responsible}` : null,
                         document.getElementById('ta-obs')?.value?.trim()]
                        .filter(Boolean).join('\n\n') || null;
        await _api('/api/food/availability', 'POST', {
          survey_date: date, week_ref,
          created_by: userId,
          observations: fullObs,
          items,
        });
        okEl.style.display = 'block';
        btn.textContent = 'Guardado ✓';
        break;
      }

      case 'cosecha': {
        const validRows = _harvestRows.filter(r => r.crop_id && r.area_id && r.bed_id && r.qty && r.unit);
        if (!validRows.length) throw new Error('Completá al menos una fila con cultivo, área, cama, cantidad y unidad.');
        await Promise.all(validRows.map(r => _api('/api/food/harvests', 'POST', {
          date,
          crop_id: r.crop_id,
          area_id: r.area_id,
          bed_id: r.bed_id,
          real_quantity: parseFloat(r.qty),
          unit: r.unit,
          performed_by: userId,
          created_by: userId,
          observations: obs,
        })));
        okEl.style.display = 'block';
        btn.textContent = `Guardado ✓ (${validRows.length} registro${validRows.length > 1 ? 's' : ''})`;
        _harvestRows = [];
        _loadRecentHarvests();
        break;
      }

      default:
        throw new Error('Tipo de formulario desconocido.');
    }

    _inputRows   = [];
    _availRows   = [];
    _prepBedRows = [];
    _applyBedRows = [];

  } catch (e) {
    errTxt.textContent  = e.message;
    errEl.style.display = 'block';
    btn.disabled        = false;
    btn.textContent     = 'Guardar registro';
  }
}

// ─── WINDOW BINDINGS ──────────────────────────────────────────────────────

// Dynamic row state updates
window._fic = (i, key, val) => { if (_inputRows[i])   _inputRows[i][key]   = val; };
window._fac = (i, key, val) => { if (_availRows[i])   _availRows[i][key]   = val; };
window._fpb = (i, key, val) => { if (_prepBedRows[i]) _prepBedRows[i][key] = val; };
window._fab = (i, key, val) => { if (_applyBedRows[i])_applyBedRows[i][key]= val; };
window._fhr = (i, key, val) => { if (_harvestRows[i]) _harvestRows[i][key] = val; };

// Cascading area (+ optional subarea) → bed filter
window._foodFilterBeds = (bedSelId, areaId, subareaId = '') => {
  const sel = document.getElementById(bedSelId);
  if (!sel) return;
  sel.innerHTML = _bedOptsByArea(areaId, subareaId, '— Cama —');
  sel.value = '';
};

// Area select changed → repopulate its subarea select and reset the bed select
window._foodAreaChanged = (areaSelId, subareaSelId, bedSelId) => {
  const areaId = document.getElementById(areaSelId)?.value || '';
  const subSel = document.getElementById(subareaSelId);
  if (subSel) {
    subSel.innerHTML = _subareaOptsByArea(areaId);
    subSel.value = '';
  }
  window._foodFilterBeds(bedSelId, areaId, '');
};

// Subarea select changed → refilter the bed select
window._foodSubareaChanged = (areaSelId, subareaSelId, bedSelId) => {
  const areaId    = document.getElementById(areaSelId)?.value || '';
  const subareaId = document.getElementById(subareaSelId)?.value || '';
  window._foodFilterBeds(bedSelId, areaId, subareaId);
};

// Area select changed in aplic-insumos → repopulate subarea, then refresh bed rows
window._foodApplyAreaChanged = () => {
  const areaId = document.getElementById('f-area')?.value || '';
  const subSel = document.getElementById('f-subarea');
  if (subSel) {
    subSel.innerHTML = _subareaOptsByArea(areaId);
    subSel.value = '';
  }
  window._foodApplyScopeAreaChanged();
};

// Also update apply-bed rows when area/subarea changes in aplic-insumos
window._foodApplyScopeAreaChanged = () => {
  _applyBedRows = [];
  _renderApplyBedRows();
};

// Scope toggles
window._foodApplyScope = (scope) => {
  _applyScope = scope;
  _updateApplyScopeUI();
};

window._foodMaintScope = (scope) => {
  _maintScope = scope;
  _updateScopeBtns('maint', scope);
  const sec = document.getElementById('maint-bed-section');
  if (sec) sec.style.display = scope === 'bed' ? 'block' : 'none';
};

// New crop inline toggle
window._foodNewCropToggle = () => {
  const val = document.getElementById('f-crop')?.value;
  const nc  = document.getElementById('new-crop-form');
  if (nc) nc.style.display = val === '__new__' ? 'block' : 'none';
};

// Auto-fill unit from crop harvest_unit
window._foodHarvestUnit = (i) => {
  const id   = document.getElementById(`hr-crop-${i}`)?.value;
  const crop = (_cats?.crops || []).find(c => c.id === id);
  if (crop?.harvest_unit) {
    const u = document.getElementById(`hr-unit-${i}`);
    if (u) u.value = crop.harvest_unit;
    if (_harvestRows[i]) _harvestRows[i].unit = crop.harvest_unit;
  }
};

window._foodAvailUnit = (i) => {
  const id   = document.getElementById(`av-crop-${i}`)?.value;
  const crop = (_cats?.crops || []).find(c => c.id === id);
  if (crop?.harvest_unit) {
    const u = document.getElementById(`av-unit-${i}`);
    if (u) { u.value = crop.harvest_unit; u.removeAttribute('readonly'); }
    if (_availRows[i]) _availRows[i].unit = crop.harvest_unit;
  }
};

// Auto-fill unit from bio_finished_products.unit (Preparar Cama / Aplicar Insumos)
window._foodBioUnit = (i) => {
  const id  = document.getElementById(`fi-prod-${i}`)?.value;
  const bio = (_cats?.bio || []).find(b => b.id === id);
  const unit = bio?.unit || '';
  const isLiquid = unit.toLowerCase() === 'l';

  const unitEl = document.getElementById(`fi-unit-${i}`);
  if (unitEl) unitEl.textContent = unit;
  const lblQty = document.getElementById(`fi-lbl-qty-${i}`);
  if (lblQty) lblQty.textContent = unit ? `Ingrediente activo (${unit})` : 'Ingrediente activo';
  const lblLiq = document.getElementById(`fi-lbl-liq-${i}`);
  if (lblLiq) lblLiq.textContent = unit ? `Líquido total aplicado (${unit})` : 'Líquido total aplicado';

  // El campo de líquido total sólo aplica a insumos que se diluyen en agua (medidos en L)
  const grid = document.getElementById(`fi-grid-${i}`);
  const liqWrap = document.getElementById(`fi-liq-wrap-${i}`);
  if (grid) grid.style.gridTemplateColumns = isLiquid ? '1fr 1fr' : '1fr';
  if (liqWrap) liqWrap.style.display = isLiquid ? '' : 'none';
  if (!isLiquid) {
    const liqInput = document.getElementById(`fi-liq-${i}`);
    if (liqInput) liqInput.value = '';
    if (_inputRows[i]) _inputRows[i].total_liquid = '';
  }
};

// Workers multi-select dropdown
window._foodToggleWorkerDrop = () => {
  const dropdown = document.getElementById('workers-dropdown');
  const arrow    = document.querySelector('#workers-btn .wd-arrow');
  if (!dropdown) return;
  const isOpen = dropdown.style.display !== 'none';
  dropdown.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▾' : '▴';
};

window._foodUpdateWorkerLabel = () => {
  const checked = [...document.querySelectorAll('input[name="worker-participant"]:checked')]
    .map(i => i.value);
  const lbl = document.getElementById('workers-label');
  if (!lbl) return;
  if (checked.length) {
    lbl.textContent = checked.join(', ');
    lbl.style.color = 'var(--brown)';
  } else {
    lbl.textContent = 'Seleccionar participantes...';
    lbl.style.color = 'rgba(84,66,54,.5)';
  }
};
