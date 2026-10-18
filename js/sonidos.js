// Efectos de sonido sintetizados con Web Audio: sin archivos, funcionan sin
// conexión. El contexto se crea en el primer toque (lo exige Android).
let ctx = null;

function contexto() {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Una nota: frecuencia inicial → final, duración y volumen, con envolvente suave.
function nota(c, { de, a = de, dur = 0.12, vol = 0.25, tipo = 'sine', en = 0 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + en;
  o.type = tipo;
  o.frequency.setValueAtTime(de, t);
  if (a !== de) o.frequency.exponentialRampToValueAtTime(a, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Ruido corto (para la grieta del huevo).
function ruido(c, { dur = 0.08, vol = 0.3, en = 0 }) {
  const n = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, n, c.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = vol;
  const filtro = c.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 1800;
  src.connect(filtro).connect(g).connect(c.destination);
  src.start(c.currentTime + en);
}

export const sonidos = {
  // Toque en una opción: un "pop" corto.
  toque() { const c = contexto(); if (c) nota(c, { de: 520, a: 380, dur: 0.07, vol: 0.15, tipo: 'triangle' }); },
  // Acierto: dos notas que suben.
  acierto() {
    const c = contexto(); if (!c) return;
    nota(c, { de: 660, dur: 0.1, vol: 0.2 });
    nota(c, { de: 990, dur: 0.18, vol: 0.2, en: 0.1 });
  },
  // Grieta del huevo: crujido + golpe seco.
  grieta() {
    const c = contexto(); if (!c) return;
    ruido(c, { dur: 0.09, vol: 0.35 });
    nota(c, { de: 180, a: 90, dur: 0.1, vol: 0.2, tipo: 'square' });
  },
  // Trampa: un "¡uy!" descendente, suave, sin sonar a castigo.
  trampa() {
    const c = contexto(); if (!c) return;
    nota(c, { de: 420, a: 300, dur: 0.22, vol: 0.18, tipo: 'triangle' });
    nota(c, { de: 300, a: 260, dur: 0.18, vol: 0.12, tipo: 'triangle', en: 0.22 });
  },
  // "Léelo otra vez": dos toquecitos iguales.
  otraVez() {
    const c = contexto(); if (!c) return;
    nota(c, { de: 440, dur: 0.06, vol: 0.12, tipo: 'triangle' });
    nota(c, { de: 440, dur: 0.06, vol: 0.12, tipo: 'triangle', en: 0.1 });
  },
  // Pista: brillo breve.
  pista() {
    const c = contexto(); if (!c) return;
    nota(c, { de: 880, a: 1320, dur: 0.25, vol: 0.14 });
  },
  // Eclosión: fanfarria corta (más larga y aguda para el legendario).
  eclosion(legendario = false) {
    const c = contexto(); if (!c) return;
    ruido(c, { dur: 0.12, vol: 0.4 });
    const escala = legendario ? [523, 659, 784, 1047, 1319, 1568] : [523, 659, 784, 1047];
    escala.forEach((f, i) => nota(c, { de: f, dur: 0.22, vol: 0.22, en: 0.15 + i * 0.12 }));
    if (legendario) [1568, 1976, 2349].forEach((f, i) => nota(c, { de: f, dur: 0.6, vol: 0.12, en: 1.0 + i * 0.05 }));
  },
};
