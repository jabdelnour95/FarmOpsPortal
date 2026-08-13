import { state } from './state.js';
import { stopRec } from './audio.js';
import { show } from './navigation.js';

const WORKER_URL = 'https://tierramor-api.jabdelnour95.workers.dev';

export async function doLogin() {
  const email    = document.getElementById('lu').value.trim();
  const password = document.getElementById('lp').value;
  const errEl    = document.getElementById('lerr');
  const btn      = document.querySelector('.btn-login');

  errEl.textContent = '';
  btn.disabled      = true;
  btn.textContent   = 'Ingresando...';

  try {
    const res  = await fetch(`${WORKER_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = 'Correo o contraseña incorrectos.';
      return;
    }

    _applySession(data.access_token, data.refresh_token, data.user);
    show('home');
  } catch (err) {
    console.error('[auth] doLogin error:', err);
    errEl.textContent = 'Error de conexión. Intentá de nuevo.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Ingresar';
  }
}

export function logout() {
  state.currentUser  = null;
  state.accessToken  = null;
  state.refreshToken = null;
  _clearStorage();
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  stopRec();
  show('ls');
}

export function restoreSession() {
  const token   = localStorage.getItem('tm_access');
  const userRaw = localStorage.getItem('tm_user');
  if (!token || !userRaw) return;

  try {
    const parts   = token.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      _clearStorage();
      return;
    }
  } catch {
    _clearStorage();
    return;
  }

  const user = JSON.parse(userRaw);
  _applySession(token, localStorage.getItem('tm_refresh'), user);
  show('home');
}

function _applySession(accessToken, refreshToken, user) {
  state.accessToken  = accessToken;
  state.refreshToken = refreshToken;
  state.currentUser  = user;
  localStorage.setItem('tm_access', accessToken);
  if (refreshToken) localStorage.setItem('tm_refresh', refreshToken);
  localStorage.setItem('tm_user', JSON.stringify(user));
}

function _clearStorage() {
  localStorage.removeItem('tm_access');
  localStorage.removeItem('tm_refresh');
  localStorage.removeItem('tm_user');
}

// ─── CAMBIO DE CONTRASEÑA (self-service) ───────────────────────────────────

export function openPasswordModal() {
  const modal = document.getElementById('pwd-modal');
  if (!modal) return;
  document.getElementById('pwd-new').value = '';
  document.getElementById('pwd-confirm').value = '';
  document.getElementById('pwd-err').style.display = 'none';
  const btn = document.getElementById('pwd-save-btn');
  btn.disabled = false;
  btn.textContent = 'Guardar';
  modal.classList.add('show');
}

export function closePasswordModal() {
  document.getElementById('pwd-modal')?.classList.remove('show');
}

export async function submitPasswordChange() {
  const errEl = document.getElementById('pwd-err');
  const btn   = document.getElementById('pwd-save-btn');
  const pwd1  = document.getElementById('pwd-new').value;
  const pwd2  = document.getElementById('pwd-confirm').value;

  errEl.style.display = 'none';

  if (pwd1.length < 6) {
    errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    errEl.style.display = 'block';
    return;
  }
  if (pwd1 !== pwd2) {
    errEl.textContent = 'Las contraseñas no coinciden.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const res = await fetch(`${WORKER_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.accessToken}`,
      },
      body: JSON.stringify({ new_password: pwd1 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Error al cambiar la contraseña.');

    btn.textContent = 'Guardado ✓';
    setTimeout(closePasswordModal, 900);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}
