import { COLORES } from './bancos/palabras.js';

// Sprites SVG por capas. Todo lo que distingue a dos criaturas (color,
// manchas, alas, cuernos, tamaño) tiene que verse claro a dos metros.

const ABRIR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">';

function hexDe(colorId) {
  const c = COLORES.find(x => x.id === colorId);
  if (!c) throw new Error(`color desconocido: ${colorId}`);
  return c.hex;
}

// Oscurece un hex para contornos y manchas.
function oscuro(hex, factor = 0.6) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function capaManchas(hex) {
  const f = oscuro(hex);
  return `<g data-capa="manchas" fill="${f}">`
    + '<circle cx="80" cy="95" r="11"/><circle cx="118" cy="120" r="9"/>'
    + '<circle cx="104" cy="72" r="7"/><circle cx="88" cy="140" r="8"/></g>';
}

function capaCuernos(hex) {
  const f = oscuro(hex, 0.45);
  return `<g data-capa="cuernos" fill="${f}">`
    + '<path d="M78 46 L70 14 L92 40 Z"/><path d="M122 46 L130 14 L108 40 Z"/></g>';
}

function capaAlas(hex) {
  const f = oscuro(hex, 0.75);
  return `<g data-capa="alas" fill="${f}" stroke="${oscuro(hex, 0.4)}" stroke-width="3">`
    + '<path d="M62 90 C20 60 10 100 30 130 C45 118 55 112 66 118 Z"/>'
    + '<path d="M138 90 C180 60 190 100 170 130 C155 118 145 112 134 118 Z"/></g>';
}

function cuerpoHuevo(hex) {
  const borde = oscuro(hex, 0.5);
  return `<path data-parte="cuerpo" d="M100 28 C62 28 44 86 44 124 C44 160 70 182 100 182 C130 182 156 160 156 124 C156 86 138 28 100 28 Z" fill="${hex}" stroke="${borde}" stroke-width="4"/>`
    + '<ellipse cx="82" cy="70" rx="10" ry="18" fill="#ffffff" fill-opacity="0.35"/>';
}

function cuerpoDragon(hex) {
  const borde = oscuro(hex, 0.5);
  return `<g data-parte="cuerpo" fill="${hex}" stroke="${borde}" stroke-width="4" stroke-linejoin="round">`
    // cola, cuerpo y cabeza
    + '<path d="M58 150 C30 160 18 140 26 122 C34 136 46 138 56 132 Z"/>'
    + '<ellipse cx="100" cy="122" rx="44" ry="40"/>'
    + '<ellipse cx="100" cy="64" rx="30" ry="26"/>'
    // hocico
    + '<path d="M126 68 C146 62 150 76 132 82 Z"/>'
    // patas
    + '<ellipse cx="78" cy="166" rx="12" ry="9"/><ellipse cx="122" cy="166" rx="12" ry="9"/>'
    + '</g>'
    // ojos y tripa clara
    + '<ellipse cx="100" cy="128" rx="26" ry="24" fill="#ffffff" fill-opacity="0.35"/>'
    + '<circle cx="92" cy="60" r="5" fill="#1b1b1b"/><circle cx="112" cy="60" r="5" fill="#1b1b1b"/>'
    + '<circle cx="93" cy="58" r="1.6" fill="#ffffff"/><circle cx="113" cy="58" r="1.6" fill="#ffffff"/>';
}

export function svgCriatura(spec) {
  const hex = hexDe(spec.color);
  const cuerpo = spec.tipo === 'dragon' ? cuerpoDragon(hex) : cuerpoHuevo(hex);
  let capas = '';
  if (spec.alas) capas += capaAlas(hex);
  capas += cuerpo;
  if (spec.cuernos) capas += capaCuernos(hex);
  if (spec.manchas) capas += capaManchas(hex);
  const contenido = spec.tamano === 'pequeno'
    ? `<g transform="translate(35 35) scale(0.65)">${capas}</g>`
    : capas;
  return `${ABRIR}${contenido}</svg>`;
}

const LUGARES_SVG = {
  cueva: '<path d="M20 180 L20 110 C20 50 180 50 180 110 L180 180 Z" fill="#6b5a4e" stroke="#3d322b" stroke-width="4"/>'
    + '<path d="M60 180 L60 125 C60 85 140 85 140 125 L140 180 Z" fill="#1d1a19"/>',
  nido: '<ellipse cx="100" cy="135" rx="80" ry="32" fill="#a67c52" stroke="#5c4228" stroke-width="4"/>'
    + '<ellipse cx="100" cy="125" rx="58" ry="18" fill="#5c4228"/>'
    + '<path d="M30 130 l25 -22 M170 130 l-25 -22 M60 160 l30 -10 M140 160 l-30 -10" stroke="#5c4228" stroke-width="5" stroke-linecap="round"/>',
  rio: '<path d="M0 90 C40 70 60 110 100 90 C140 70 160 110 200 90 L200 150 C160 170 140 130 100 150 C60 170 40 130 0 150 Z" fill="#4aa3df" stroke="#1f6aa5" stroke-width="4"/>'
    + '<path d="M20 112 C45 100 60 124 95 112 M105 112 C130 100 150 124 185 112" stroke="#ffffff" stroke-opacity="0.6" stroke-width="4" fill="none" stroke-linecap="round"/>',
  roca: '<path d="M30 170 L45 110 L85 80 L135 86 L170 125 L165 170 Z" fill="#9a9a9a" stroke="#4f4f4f" stroke-width="4" stroke-linejoin="round"/>'
    + '<path d="M60 160 L75 118 L110 100" stroke="#cfcfcf" stroke-width="4" fill="none" stroke-linecap="round"/>',
  arbol: '<rect x="88" y="120" width="24" height="60" fill="#7a4e2a" stroke="#4a2e17" stroke-width="4"/>'
    + '<circle cx="100" cy="90" r="46" fill="#4f9d3a" stroke="#2f6b22" stroke-width="4"/>'
    + '<circle cx="70" cy="110" r="28" fill="#4f9d3a" stroke="#2f6b22" stroke-width="4"/>'
    + '<circle cx="132" cy="110" r="28" fill="#4f9d3a" stroke="#2f6b22" stroke-width="4"/>',
  cama: '<rect x="20" y="100" width="160" height="60" rx="8" fill="#e36f8a" stroke="#8c3a50" stroke-width="4"/>'
    + '<rect x="20" y="70" width="34" height="90" rx="6" fill="#8c5a3c" stroke="#4a2e17" stroke-width="4"/>'
    + '<rect x="60" y="86" width="44" height="22" rx="8" fill="#ffffff" stroke="#bdbdbd" stroke-width="3"/>'
    + '<rect x="24" y="160" width="12" height="20" fill="#4a2e17"/><rect x="164" y="160" width="12" height="20" fill="#4a2e17"/>',
};

export function svgLugar(id) {
  const dibujo = LUGARES_SVG[id];
  if (!dibujo) throw new Error(`lugar desconocido: ${id}`);
  return `${ABRIR}${dibujo}</svg>`;
}
