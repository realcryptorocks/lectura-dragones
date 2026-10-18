// Voz del dragón: síntesis de voz del navegador, en español. Sin red ni coste.
const ESPERA_VOCES_MS = 1500;
const MAX_MS = 6000;

function vocesEspanol() {
  if (typeof speechSynthesis === 'undefined') return [];
  return speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
}

export function vozDisponible() {
  return new Promise(resolve => {
    if (typeof speechSynthesis === 'undefined') return resolve(false);
    if (vocesEspanol().length) return resolve(true);
    const fin = setTimeout(() => resolve(vocesEspanol().length > 0), ESPERA_VOCES_MS);
    speechSynthesis.addEventListener('voiceschanged', () => {
      if (vocesEspanol().length) { clearTimeout(fin); resolve(true); }
    }, { once: true });
  });
}

export function decir(texto) {
  return new Promise(resolve => {
    const voces = vocesEspanol();
    if (!voces.length) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = voces.find(v => v.lang.toLowerCase() === 'es-es') || voces[0];
    u.lang = u.voice.lang;
    u.rate = 0.9;
    const fin = setTimeout(resolve, MAX_MS);
    u.onend = () => { clearTimeout(fin); resolve(); };
    u.onerror = () => { clearTimeout(fin); resolve(); };
    speechSynthesis.speak(u);
  });
}
