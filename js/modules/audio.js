import { state } from './state.js';

export function toggleMic(wid) {
  if (state.activeRec && state.activeRec.wid === wid) { stopRec(); return; }
  stopRec();
  startRec(wid);
}

export function startRec(wid) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { setMs(wid, '❌ Navegador no soporta dictado', false); return; }
  const rec = new SR();
  rec.lang = 'es-CR'; rec.continuous = true; rec.interimResults = true;
  const btn = document.getElementById('mic-' + wid);
  const ta  = document.getElementById('ta-'  + wid);
  if (!btn || !ta) return;
  btn.classList.add('rec'); btn.innerHTML = '⏹';
  setMs(wid, '🔴 Grabando...', true);
  let base = ta.value;
  rec.onresult = e => {
    let fi = '', interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) fi += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    if (fi) base += fi;
    ta.value = base + interim;
  };
  rec.onerror = () => { setMs(wid, 'Error al grabar.', false); cleanMic(wid); state.activeRec = null; };
  rec.onend   = () => { ta.value = base.trim(); setMs(wid, '✅ Guardado.', false); cleanMic(wid); state.activeRec = null; };
  rec.start();
  state.activeRec = { rec, wid };
  btn.onclick = () => stopRec();
}

export function stopRec() {
  if (state.activeRec) {
    try { state.activeRec.rec.stop(); } catch (e) {}
    cleanMic(state.activeRec.wid);
    state.activeRec = null;
  }
}

function setMs(wid, msg, on) {
  const el = document.getElementById('ms-' + wid);
  if (!el) return;
  el.textContent = msg;
  on ? el.classList.add('on') : el.classList.remove('on');
}

function cleanMic(wid) {
  const b = document.getElementById('mic-' + wid);
  if (!b) return;
  b.classList.remove('rec');
  b.innerHTML = '🎙';
  b.onclick = () => toggleMic(wid);
}
