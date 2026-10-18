import { COLORES, RASGOS } from '../bancos/palabras.js';
import { permitida } from '../grafias.js';
import { elegir } from '../util/rng.js';

// Rasgos que pueden ser "la trampa" de una frase.
export const RASGOS_CLAVE = ['color', 'manchas', 'alas', 'cuernos', 'tamano'];

function coloresPermitidos(nivel) {
  return COLORES.filter(c => permitida(c.texto, nivel));
}

export function specAleatorio(nivel, rng) {
  return {
    tipo: rng() < 0.5 ? 'huevo' : 'dragon',
    color: elegir(coloresPermitidos(nivel), rng).id,
    manchas: rng() < 0.5,
    alas: rng() < 0.5,
    cuernos: rng() < 0.5,
    tamano: rng() < 0.5 ? 'grande' : 'pequeno',
  };
}

// Copia del spec con un rasgo cambiado (color → otro permitido en el nivel).
function cambiar(spec, rasgo, rng, nivel) {
  const copia = { ...spec };
  if (rasgo === 'color') {
    copia.color = elegir(coloresPermitidos(nivel).filter(c => c.id !== spec.color), rng).id;
  } else if (rasgo === 'tamano') {
    copia.tamano = spec.tamano === 'grande' ? 'pequeno' : 'grande';
  } else {
    copia[rasgo] = !spec[rasgo];
  }
  return copia;
}

// Dos distractores: el primero solo difiere en el rasgo clave (la trampa
// visual), el segundo conserva el rasgo clave y cambia otro.
export function variantesSprite(spec, rasgoClave, rng, nivel = 8) {
  const v1 = cambiar(spec, rasgoClave, rng, nivel);
  const otro = elegir(RASGOS_CLAVE.filter(r => r !== rasgoClave), rng);
  const v2 = cambiar(spec, otro, rng, nivel);
  return [v1, v2];
}

export function textoRasgo(spec, rasgo) {
  if (rasgo === 'color') return COLORES.find(c => c.id === spec.color).texto;
  if (rasgo === 'tamano') return spec.tamano === 'grande' ? RASGOS.tamano.con : RASGOS.tamano.sin;
  return spec[rasgo] ? RASGOS[rasgo].con : RASGOS[rasgo].sin;
}
