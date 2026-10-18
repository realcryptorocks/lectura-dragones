import { SILABAS, FINALES } from '../bancos/silabas.js';
import { permitida } from '../grafias.js';
import { elegir, barajar } from '../util/rng.js';

// Pares de confusión típicos. Cada uno se aplica en ambos sentidos.
const CONFUSIONES = [
  ['b', 'v'], ['c', 'qu'], ['g', 'gu'], ['j', 'g'],
  ['r', 'l'], ['m', 'n'], ['d', 't'], ['p', 'b'], ['s', 'z'],
];

function silabasHasta(nivel) {
  return Object.entries(SILABAS)
    .filter(([n]) => Number(n) <= nivel)
    .flatMap(([, lista]) => lista);
}

function capitalizar(p) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function generarNombre(nivel, rng) {
  const pool = silabasHasta(nivel);
  for (let intento = 0; intento < 100; intento++) {
    const cuantas = rng() < 0.5 ? 2 : 3;
    let nombre = '';
    for (let i = 0; i < cuantas; i++) nombre += elegir(pool, rng);
    nombre += elegir(FINALES, rng);
    if (nombre.length < 4 || nombre.length > 8) continue;
    if (!permitida(nombre, nivel)) continue;
    if (nivel < 7 && /ge|gi|qu/.test(nombre)) continue;
    return capitalizar(nombre);
  }
  return capitalizar(pool[0] + pool[1]);
}

// Todas las escrituras alternativas de una palabra: una sustitución de un
// par de confusión, o un intercambio de dos letras adyacentes.
// Devuelve primero las sustituciones (parecen palabras de verdad) y después
// los intercambios de letras adyacentes (de relleno, se notan más).
function candidatos(palabra) {
  const base = palabra.toLowerCase();
  const sustituciones = new Set();
  const intercambios = new Set();
  for (const [a, b] of CONFUSIONES) {
    for (const [de, a_] of [[a, b], [b, a]]) {
      let i = base.indexOf(de);
      while (i !== -1) {
        // "ch" es un sonido propio: no se confunde su c con qu.
        const esCh = de === 'c' && base[i + 1] === 'h';
        if (!esCh) sustituciones.add(base.slice(0, i) + a_ + base.slice(i + de.length));
        i = base.indexOf(de, i + 1);
      }
    }
  }
  for (let i = 1; i < base.length - 1; i++) {
    if (base[i] === base[i + 1]) continue;
    intercambios.add(base.slice(0, i) + base[i + 1] + base[i] + base.slice(i + 2));
  }
  sustituciones.delete(base);
  intercambios.delete(base);
  const mayus = palabra[0] === palabra[0].toUpperCase() && palabra[0] !== palabra[0].toLowerCase();
  const forma = c => (mayus ? capitalizar(c) : c);
  return { sustituciones: [...sustituciones].map(forma), intercambios: [...intercambios].map(forma) };
}

// Baraja cada grupo por separado y concatena: sustituciones primero.
function ordenados(palabra, rng, filtro = () => true) {
  const { sustituciones, intercambios } = candidatos(palabra);
  return [...barajar(sustituciones.filter(filtro), rng), ...barajar(intercambios.filter(filtro), rng)];
}

export function variantesEscritura(palabra, rng) {
  const lista = ordenados(palabra, rng);
  if (lista.length >= 2) return lista.slice(0, 2);
  // Palabras muy cortas: duplicar una letra como último recurso.
  const extra = palabra.slice(0, 1) + palabra.slice(0, 1).toLowerCase() + palabra.slice(1);
  return [...lista, extra].slice(0, 2);
}

export function distractoresNombre(nombre, nivel, rng) {
  // Prioriza las confusiones del nivel actual: mismo filtro que el nombre.
  const largo = c => Math.abs(c.length - nombre.length) <= 1;
  const delNivel = ordenados(nombre, rng, c => largo(c) && permitida(c, Math.max(nivel, 6)));
  const lista = delNivel.length >= 2 ? delNivel : ordenados(nombre, rng, largo);
  return lista.slice(0, 2);
}
