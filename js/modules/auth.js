import { USERS } from '../data/users.js';
import { state } from './state.js';
import { stopRec } from './audio.js';
import { show } from './navigation.js';

export function doLogin() {
  const u = document.getElementById('lu').value.trim().toLowerCase();
  const p = document.getElementById('lp').value;
  const match = USERS.find(x => x.user === u && x.pass === p);
  if (match) {
    state.currentUser = match;
    document.getElementById('lerr').textContent = '';
    document.getElementById('btn-rep').style.display = match.role === 'admin' ? '' : 'none';
    show('home');
  } else {
    document.getElementById('lerr').textContent = 'Usuario o contraseña incorrectos.';
  }
}

export function logout() {
  state.currentUser = null;
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  stopRec();
  show('ls');
}
