// Grafías que le cuestan, y el nivel de la escalera en que entra cada una.
// cq: ca/co/cu/que/qui · gg: ga/go/gu/gue/gui/güe/güi · jg: j, ge, gi
// bv: b o v · gegi: ge, gi · grupo: consonante + l/r + vocal (tr, pl, br…)
const NIVEL_POR_GRAFIA = { cq: 3, gg: 4, jg: 5, bv: 6, gegi: 7, grupo: 7 };

const REGLAS = [
  ['cq', /ca|co|cu|que|qui/],
  ['gg', /ga|go|gu|gü/],
  ['jg', /j|ge|gi/],
  ['gegi', /ge|gi/],
  ['bv', /[bv]/],
  ['grupo', /[tpbcfgd][lr](?=[aeiouáéíóú])/],
];

export function grafiasDe(palabra) {
  const p = palabra.toLowerCase();
  const set = new Set();
  for (const [grafia, re] of REGLAS) if (re.test(p)) set.add(grafia);
  return set;
}

export function nivelMinimo(palabra) {
  let nivel = 1;
  for (const g of grafiasDe(palabra)) nivel = Math.max(nivel, NIVEL_POR_GRAFIA[g]);
  return nivel;
}

export function permitida(palabra, nivel) {
  return nivelMinimo(palabra) <= nivel;
}
