// Generador de dragones por especies. Cada nombre produce siempre el mismo
// dragón; dos nombres distintos dan dragones que no se parecen.
// Los ejercicios siguen usando sprites.js (rasgos controlados); esto es para
// los dragones nacidos: eclosión, dormido y dragonario.

import { crearRng, elegir } from './util/rng.js';

export const ESPECIES = ['rechoncho', 'serpiente', 'cuellilargo', 'murcielago', 'bebe', 'acorazado'];

const PALETA = [
  { id: 'rojo', base: '#d9413f', claro: '#ff8a7a', oscuro: '#7a1f22', tripa: '#ffd9a8' },
  { id: 'azul', base: '#3b7dd8', claro: '#8ec3ff', oscuro: '#1b3f7a', tripa: '#d6f0ff' },
  { id: 'verde', base: '#3fa34d', claro: '#9be37f', oscuro: '#1d5a2a', tripa: '#f0f7b0' },
  { id: 'morado', base: '#8e5bd9', claro: '#c9a3ff', oscuro: '#45267a', tripa: '#ffd6f2' },
  { id: 'naranja', base: '#f08a3c', claro: '#ffc37a', oscuro: '#8a4312', tripa: '#fff0c2' },
  { id: 'turquesa', base: '#2bb5a8', claro: '#8cf2e6', oscuro: '#125e58', tripa: '#e2fff9' },
  { id: 'rosa', base: '#e8609b', claro: '#ffa8cf', oscuro: '#7f2452', tripa: '#fff0f6' },
  { id: 'gris', base: '#6f7a8c', claro: '#b8c2d1', oscuro: '#2f3744', tripa: '#e9edf2' },
  { id: 'negro', base: '#2d2a3a', claro: '#6d6885', oscuro: '#0c0a14', tripa: '#9c93c2' },
];

const ORO = { id: 'oro', base: '#f2c14e', claro: '#fff2b0', oscuro: '#9a6a12', tripa: '#fff8dc' };

function hash(s) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

// ---------- rasgos a partir del nombre ----------
export function rasgosDeDragon(nombre, rareza = 'comun') {
  const rng = crearRng(hash(nombre));
  const r = {
    nombre, rareza,
    especie: elegir(ESPECIES, rng),
    color: elegir(PALETA, rng),
    patron: elegir(['liso', 'manchas', 'rayas', 'escamas'], rng),
    cuernos: elegir(['ninguno', 'uno', 'dos', 'curvos'], rng),
    cresta: elegir(['ninguna', 'pinchos', 'aleta'], rng),
    cola: elegir(['flecha', 'bola', 'pincho'], rng),
    ojos: elegir(['redondos', 'rasgados', 'grandes'], rng),
    hocico: elegir(['corto', 'largo'], rng),
    alas: rng() < 0.75 ? 'si' : 'no',
    giro: Math.round((rng() - 0.5) * 8),
  };
  if (rareza === 'raro') { r.alas = 'si'; r.cresta = 'pinchos'; r.cuernos = 'curvos'; }
  if (rareza === 'legendario') {
    r.color = ORO; r.alas = 'si'; r.cresta = 'aleta'; r.cuernos = 'corona'; r.patron = 'escamas';
  }
  return r;
}

// ---------- dibujo ----------
const P = (d, attrs = '') => `<path d="${d}" ${attrs}/>`;

function cuerpo(r) {
  switch (r.especie) {
    case 'rechoncho': return { d: 'M120 106 C170 106 176 190 120 194 C64 190 70 106 120 106 Z', tripa: 'M126 128 C156 130 158 186 124 188 C96 186 98 132 126 128 Z', cabeza: [150, 92, 30], patas: [[96, 190], [142, 190]], colaEn: [72, 170], alasEn: [112, 128] };
    case 'serpiente': return { d: 'M40 196 C60 150 110 150 120 120 C130 92 170 90 182 110 C196 132 160 140 150 150 C130 170 100 186 60 206 Z', tripa: 'M60 194 C80 160 118 158 126 128 C132 108 162 106 170 118 C176 130 154 136 146 146 C126 166 100 178 70 200 Z', cabeza: [176, 96, 26], patas: [], colaEn: [44, 198], alasEn: [128, 118] };
    case 'cuellilargo': return { d: 'M110 134 C150 134 160 200 110 200 C66 200 66 134 110 134 Z M128 148 C130 120 150 96 168 82 L186 96 C168 110 156 134 150 162 Z', tripa: 'M112 150 C136 152 140 192 112 194 C86 192 88 152 112 150 Z', cabeza: [180, 72, 22], patas: [[92, 196], [128, 196]], colaEn: [70, 178], alasEn: [104, 146] };
    case 'murcielago': return { d: 'M120 112 C156 112 160 200 120 200 C80 200 84 112 120 112 Z', tripa: 'M122 136 C144 138 146 190 122 192 C98 190 100 138 122 136 Z', cabeza: [144, 94, 28], patas: [[102, 196], [138, 196]], colaEn: [84, 176], alasEn: [120, 124] };
    case 'bebe': return { d: 'M120 150 C156 150 158 202 120 202 C82 202 84 150 120 150 Z', tripa: 'M122 166 C142 168 144 196 122 198 C102 196 104 168 122 166 Z', cabeza: [124, 108, 44], patas: [[100, 198], [140, 198]], colaEn: [86, 184], alasEn: [112, 156] };
    default: /* acorazado */ return { d: 'M120 116 C176 116 178 196 120 198 C62 196 64 116 120 116 Z', tripa: 'M126 140 C154 142 156 190 124 192 C96 190 98 142 126 140 Z', cabeza: [156, 100, 30], patas: [[92, 194], [148, 194]], colaEn: [66, 176], alasEn: [110, 130], placas: true };
  }
}

function alas(r, en) {
  if (r.alas !== 'si') return '';
  const [x, y] = en;
  const grande = r.especie === 'murcielago' || r.rareza === 'legendario';
  const s = grande ? 1.45 : 1;
  const ala = `M0 0 C-30 -40 -80 -46 -96 -20 C-80 -16 -70 -8 -60 4 C-72 2 -84 10 -94 24 C-76 22 -64 24 -52 34 C-62 40 -68 50 -70 62 C-50 48 -24 40 0 30 Z`;
  const membrana = `fill="${r.color.oscuro}" stroke="${r.color.oscuro}" stroke-width="3" stroke-linejoin="round"`;
  const nervios = `M0 0 L-60 4 M0 0 L-52 34 M0 0 L-70 62`;
  return `<g transform="translate(${x} ${y}) scale(${s})">`
    + P(ala, membrana) + P(nervios, `stroke="${r.color.claro}" stroke-opacity=".35" stroke-width="2" fill="none"`)
    + `</g>`;
}

function cola(r, en) {
  const [x, y] = en;
  const d = `M${x} ${y} C${x - 30} ${y + 10} ${x - 50} ${y - 10} ${x - 40} ${y - 36}`;
  const puntaX = x - 40, puntaY = y - 36;
  let punta = '';
  if (r.cola === 'flecha') punta = P(`M${puntaX - 10} ${puntaY + 8} L${puntaX + 2} ${puntaY - 16} L${puntaX + 12} ${puntaY + 6} Z`, `fill="${r.color.oscuro}"`);
  if (r.cola === 'bola') punta = `<circle cx="${puntaX}" cy="${puntaY - 4}" r="9" fill="${r.color.oscuro}"/>`;
  if (r.cola === 'pincho') punta = P(`M${puntaX - 6} ${puntaY + 4} L${puntaX} ${puntaY - 22} L${puntaX + 7} ${puntaY + 2} Z M${puntaX - 14} ${puntaY + 8} L${puntaX - 10} ${puntaY - 10} L${puntaX - 2} ${puntaY + 6} Z`, `fill="${r.color.oscuro}"`);
  return P(d, `stroke="${r.color.base}" stroke-width="16" fill="none" stroke-linecap="round"`)
    + P(d, `stroke="${r.color.oscuro}" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity=".5"`)
    + punta;
}

function patas(r, lista) {
  return lista.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="11" fill="${r.color.base}" stroke="${r.color.oscuro}" stroke-width="3"/>`
    + `<path d="M${x - 8} ${y + 9} l-3 6 M${x} ${y + 11} l0 6 M${x + 8} ${y + 9} l3 6" stroke="${r.color.oscuro}" stroke-width="3" stroke-linecap="round"/>`).join('');
}

function cabeza(r, [cx, cy, rad], gradId) {
  const largo = r.hocico === 'largo' ? 1.35 : 1;
  const hocico = `<ellipse cx="${cx + rad * 0.8}" cy="${cy + rad * 0.15}" rx="${rad * 0.62 * largo}" ry="${rad * 0.42}" fill="url(#${gradId})" stroke="${r.color.oscuro}" stroke-width="3"/>`
    + `<circle cx="${cx + rad * 1.2 * largo}" cy="${cy + rad * 0.12}" r="2.5" fill="${r.color.oscuro}"/>`
    + `<path d="M${cx + rad * 0.35} ${cy + rad * 0.42} q${rad * 0.35} ${rad * 0.18} ${rad * 0.75 * largo} 0" stroke="${r.color.oscuro}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const craneo = `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#${gradId})" stroke="${r.color.oscuro}" stroke-width="3"/>`;

  let ojo = '';
  const ox = cx + rad * 0.3, oy = cy - rad * 0.25;
  if (r.ojos === 'redondos') ojo = `<circle cx="${ox}" cy="${oy}" r="${rad * 0.22}" fill="#fff"/><circle cx="${ox + 2}" cy="${oy}" r="${rad * 0.11}" fill="#111"/><circle cx="${ox + 3.5}" cy="${oy - 2}" r="1.6" fill="#fff"/>`;
  if (r.ojos === 'grandes') ojo = `<circle cx="${ox}" cy="${oy}" r="${rad * 0.32}" fill="#fff"/><circle cx="${ox + 3}" cy="${oy + 1}" r="${rad * 0.18}" fill="#1c3a6b"/><circle cx="${ox + 5}" cy="${oy - 2}" r="2.4" fill="#fff"/>`;
  if (r.ojos === 'rasgados') ojo = `<ellipse cx="${ox}" cy="${oy}" rx="${rad * 0.26}" ry="${rad * 0.16}" fill="#ffe36b"/><ellipse cx="${ox + 1}" cy="${oy}" rx="${rad * 0.06}" ry="${rad * 0.15}" fill="#111"/>`;

  let cuernos = '';
  const c = `fill="${r.color.oscuro}" stroke="${r.color.oscuro}" stroke-width="2" stroke-linejoin="round"`;
  const hx = cx - rad * 0.2, hy = cy - rad * 0.85;
  if (r.cuernos === 'uno') cuernos = P(`M${hx + 6} ${hy + 8} L${hx + 10} ${hy - 22} L${hx + 20} ${hy + 6} Z`, c);
  if (r.cuernos === 'dos') cuernos = P(`M${hx - 8} ${hy + 10} L${hx - 10} ${hy - 18} L${hx + 6} ${hy + 6} Z M${hx + 14} ${hy + 6} L${hx + 22} ${hy - 18} L${hx + 28} ${hy + 10} Z`, c);
  if (r.cuernos === 'curvos') cuernos = P(`M${hx - 6} ${hy + 10} C${hx - 20} ${hy - 6} ${hx - 10} ${hy - 30} ${hx + 4} ${hy - 26} C${hx - 4} ${hy - 16} ${hx - 2} ${hy - 4} ${hx + 8} ${hy + 6} Z M${hx + 16} ${hy + 6} C${hx + 8} ${hy - 12} ${hx + 20} ${hy - 32} ${hx + 32} ${hy - 24} C${hx + 22} ${hy - 18} ${hx + 24} ${hy - 6} ${hx + 30} ${hy + 10} Z`, c);
  if (r.cuernos === 'corona') cuernos = P(`M${hx - 10} ${hy + 10} L${hx - 8} ${hy - 20} L${hx + 2} ${hy + 4} Z M${hx + 6} ${hy + 2} L${hx + 10} ${hy - 32} L${hx + 18} ${hy + 2} Z M${hx + 22} ${hy + 6} L${hx + 30} ${hy - 20} L${hx + 34} ${hy + 10} Z`, `fill="#fff2b0" stroke="${r.color.oscuro}" stroke-width="2" stroke-linejoin="round"`);

  let cresta = '';
  const kx = cx - rad * 0.9, ky = cy - rad * 0.2;
  if (r.cresta === 'pinchos') cresta = P(`M${kx + 6} ${ky - 14} L${kx - 16} ${ky - 22} L${kx + 2} ${ky - 2} Z M${kx + 4} ${ky + 4} L${kx - 18} ${ky + 2} L${kx + 4} ${ky + 16} Z`, c);
  if (r.cresta === 'aleta') cresta = P(`M${kx + 8} ${ky - 18} C${kx - 24} ${ky - 30} ${kx - 26} ${ky + 16} ${kx + 6} ${ky + 18} Z`, `fill="${r.color.claro}" stroke="${r.color.oscuro}" stroke-width="3" stroke-linejoin="round"`)
    + P(`M${kx + 2} ${ky - 12} L${kx - 14} ${ky - 6} M${kx} ${ky + 2} L${kx - 16} ${ky + 6}`, `stroke="${r.color.oscuro}" stroke-width="2" stroke-opacity=".5"`);

  return cresta + cuernos + craneo + hocico + ojo;
}

function patron(r, clipId) {
  const col = r.color.oscuro;
  const g = `<g clip-path="url(#${clipId})" fill="${col}" fill-opacity=".35" stroke="none">`;
  if (r.patron === 'manchas') return g + [[100, 140, 9], [136, 150, 7], [112, 172, 8], [138, 182, 6], [92, 170, 5], [152, 126, 6]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}"/>`).join('') + '</g>';
  if (r.patron === 'rayas') return g + [120, 136, 152, 168, 184].map(y => `<path d="M60 ${y} C100 ${y - 12} 150 ${y + 12} 190 ${y}" stroke="${col}" stroke-opacity=".4" stroke-width="7" fill="none"/>`).join('') + '</g>';
  if (r.patron === 'escamas') {
    let s = '';
    for (let y = 120; y < 200; y += 12) for (let x = 60 + ((y / 12) % 2) * 7; x < 190; x += 14) s += `<path d="M${x} ${y} a7 7 0 0 0 14 0" stroke="${col}" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
    return g + s + '</g>';
  }
  return '';
}

function placas(r) {
  if (r.especie !== 'acorazado') return '';
  return P('M86 122 L96 98 L108 120 Z M110 116 L120 90 L132 116 Z M136 118 L148 96 L156 120 Z', `fill="${r.color.claro}" stroke="${r.color.oscuro}" stroke-width="3" stroke-linejoin="round"`);
}

function aura(r) {
  if (r.rareza === 'legendario') {
    return `<circle cx="120" cy="140" r="104" fill="url(#aura)" class="aura-legendaria"/>`
      + [[40, 60], [200, 50], [30, 190], [210, 200], [120, 20], [60, 230]].map(([x, y], i) =>
        `<path class="chispa" style="animation-delay:${i * 0.35}s" d="M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z" fill="#fff2b0"/>`).join('');
  }
  if (r.rareza === 'raro') return `<circle cx="120" cy="140" r="98" fill="url(#aura-rara)"/>`;
  return '';
}

export function svgDragon(nombre, rareza = 'comun') {
  const r = rasgosDeDragon(nombre, rareza);
  const id = `d${hash(nombre).toString(36)}`;
  const gradId = `${id}g`, clipId = `${id}c`;
  const c = cuerpo(r);
  const defs = `<defs>
    <radialGradient id="${gradId}" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="${r.color.claro}"/><stop offset=".55" stop-color="${r.color.base}"/><stop offset="1" stop-color="${r.color.oscuro}"/></radialGradient>
    <radialGradient id="aura"><stop offset="0" stop-color="#ffd86a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd86a" stop-opacity="0"/></radialGradient>
    <radialGradient id="aura-rara"><stop offset="0" stop-color="#7fb6ff" stop-opacity=".35"/><stop offset="1" stop-color="#7fb6ff" stop-opacity="0"/></radialGradient>
    <clipPath id="${clipId}"><path d="${c.d}"/></clipPath>
  </defs>`;
  const cuerpoSvg = P(c.d, `fill="url(#${gradId})" stroke="${r.color.oscuro}" stroke-width="3.5" stroke-linejoin="round"`)
    + P(c.tripa, `fill="${r.color.tripa}" fill-opacity=".9"`)
    + patron(r, clipId);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${nombre}">${defs}`
    + aura(r)
    + `<g transform="rotate(${r.giro} 120 150)">`
    + alas(r, c.alasEn) + cola(r, c.colaEn) + placas(r) + cuerpoSvg + patas(r, c.patas) + cabeza(r, c.cabeza, gradId)
    + '</g></svg>';
}

// Las animaciones de chispa y aura están en css/juego.css.
