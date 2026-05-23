import { COLABS_LIMP } from '../data/users.js';
import { state } from './state.js';
import { show } from './navigation.js';
import { photoUploadWidget } from './photos.js';

const ROPA_ITEMS = [
  'Topper Individual','Topper Matrimonial','Topper King',
  'Forro de cama Individual','Forro de cama Queen','Forro de cama King',
  'Sábana Individual','Sábana Queen','Sábana King',
  'Cubre Duvet Individual','Cubre Duvet Queen','Cubre Duvet King',
  'Duvet Individual','Duvet Queen','Duvet King',
  'Pie de cama',
  'Forro de almohada Standard','Forro de almohada King',
  'Alfombra','Mosquitero Individual','Mosquitero King',
];

const PROPS_MALOCA = [
  'Matts de yoga negros','Blocks de yoga','Correas de yoga','Almohadones (Bolsters)',
];

const PROPS_MOVEMENT = [
  'Matts de yoga verdes','Blocks de yoga','Correas de yoga',
  'Silla de suelo','Almohadones (Bolsters)','Cojines redondos','Cojines grandes','Cojines medianos',
];

const colabOpts = () =>
  `<option value="">— Seleccionar —</option>${COLABS_LIMP.map(n => `<option>${n}</option>`).join('')}`;

const qtyRow = (prefix, item, i) => `
  <div class="inv-item">
    <span class="inv-name">${item}</span>
    <div class="inv-qty">
      <button onclick="adjQty('${prefix}-${i}',-1)">−</button>
      <input type="number" id="${prefix}-${i}" value="0" min="0">
      <button onclick="adjQty('${prefix}-${i}',1)">+</button>
    </div>
  </div>`;

export function openInventarios() {
  document.getElementById('con-title').textContent = 'Inventarios';
  document.getElementById('con-back').onclick = () => window.nav('dept');
  document.getElementById('conbody').innerHTML = `
    <div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1.2rem;">Selecciona el inventario a registrar</div>
    <div class="gcard" onclick="openRopaCama()" style="margin-bottom:.7rem;">
      <div class="ct">Inventario de Ropa de Cama</div>
      <div class="cd">Sábanas, fundas, cobijas, duvets y más</div>
    </div>
    <div class="gcard" onclick="openPropsMenu()">
      <div class="ct">Inventario de Props de Wellness</div>
      <div class="cd">Colchonetas, bloques, correas y accesorios</div>
    </div>`;
  show('con-screen');
}

export function openRopaCama() {
  document.getElementById('con-title').textContent = 'Ropa de Cama';
  document.getElementById('con-back').onclick = () => openInventarios();
  document.getElementById('conbody').innerHTML = `
    <div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1rem;">Registra las cantidades actuales de cada artículo</div>
    <div class="fg"><label>Responsable</label><select id="inv-colab">${colabOpts()}</select></div>
    <div class="fg"><label>Fecha</label><input type="date" id="inv-fecha" value="${today()}"></div>
    ${ROPA_ITEMS.map((item, i) => qtyRow('rc', item, i)).join('')}
    <div class="fg" style="margin-top:1rem"><label>Observaciones</label><textarea id="inv-obs" placeholder="Artículos dañados, faltantes, notas..."></textarea></div>
    ${photoUploadWidget('inv-photos')}
    <button class="btn-sub" id="inv-sub" onclick="submitInventario('ropa-cama')">Guardar Inventario</button>
    <div class="ok-msg" id="inv-ok"><p>✅ Inventario guardado correctamente.</p></div>`;
  show('con-screen');
}

export function openPropsMenu() {
  document.getElementById('con-title').textContent = 'Props de Wellness';
  document.getElementById('con-back').onclick = () => openInventarios();
  document.getElementById('conbody').innerHTML = `
    <div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1.2rem;">Selecciona el espacio a inventariar</div>
    <div class="gcard" onclick="openPropsForm('maloca')" style="margin-bottom:.7rem;">
      <div class="ct">Props Maloca</div><div class="cd">Matts, blocks, correas y bolsters</div>
    </div>
    <div class="gcard" onclick="openPropsForm('movement')">
      <div class="ct">Props Movement Studio</div><div class="cd">Matts, blocks, correas, cojines y sillas</div>
    </div>`;
  show('con-screen');
}

export function openPropsForm(space) {
  const items = space === 'maloca' ? PROPS_MALOCA : PROPS_MOVEMENT;
  const title = space === 'maloca' ? 'Props Maloca' : 'Props Movement Studio';
  document.getElementById('con-title').textContent = title;
  document.getElementById('con-back').onclick = () => openPropsMenu();
  document.getElementById('conbody').innerHTML = `
    <div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1rem;">Registra las cantidades actuales</div>
    <div class="fg"><label>Responsable</label><select id="inv-colab">${colabOpts()}</select></div>
    <div class="fg"><label>Fecha</label><input type="date" id="inv-fecha" value="${today()}"></div>
    ${items.map((item, i) => qtyRow('pr', item, i)).join('')}
    <div class="fg" style="margin-top:1rem"><label>Observaciones</label><textarea id="inv-obs" placeholder="Artículos dañados, faltantes, notas..."></textarea></div>
    ${photoUploadWidget('inv-photos')}
    <button class="btn-sub" id="inv-sub" onclick="submitInventario('props-${space}')">Guardar Inventario</button>
    <div class="ok-msg" id="inv-ok"><p>✅ Inventario guardado correctamente.</p></div>`;
  show('con-screen');
}

export function adjQty(id, delta) {
  const el = document.getElementById(id);
  el.value = Math.max(0, (parseInt(el.value) || 0) + delta);
}

export function submitInventario(type) {
  const colab = document.getElementById('inv-colab')?.value;
  if (!colab) { alert('Por favor selecciona el responsable.'); return; }
  document.getElementById('inv-ok').style.display = 'block';
  document.getElementById('inv-sub').disabled = true;
  // TODO: conectar a backend
}

function today() { return new Date().toISOString().split('T')[0]; }
