// Camino de 21 casillas: raros en 4, 8, 12, 16 y 20; legendario en la 21.
// Al eclosionar el legendario empieza otro camino igual.
export const LARGO = 21;
const RAROS = new Set([4, 8, 12, 16, 20]);

function posicionEnCamino(numeroHuevo) {
  return ((numeroHuevo - 1) % LARGO) + 1;
}

export function rarezaDe(numeroHuevo) {
  const pos = posicionEnCamino(numeroHuevo);
  if (pos === LARGO) return 'legendario';
  if (RAROS.has(pos)) return 'raro';
  return 'comun';
}

export function casillasCamino(numeroHuevoActual) {
  const posicion = posicionEnCamino(numeroHuevoActual);
  const camino = Math.floor((numeroHuevoActual - 1) / LARGO) + 1;
  const casillas = Array.from({ length: LARGO }, (_, i) => {
    const pos = i + 1;
    return { n: (camino - 1) * LARGO + pos, rareza: rarezaDe(pos), hecha: pos < posicion };
  });
  return { posicion, camino, casillas };
}

export function legendariosDe(huevos) {
  return huevos.filter(h => h.rareza === 'legendario').map(h => ({ nombre: h.nombre, fecha: h.fecha }));
}
