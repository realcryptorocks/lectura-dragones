// Escalera de dificultad, invisible para el niño: niveles 1 a 8.
const MIN = 1, MAX = 8;
const acotar = n => Math.max(MIN, Math.min(MAX, n));

// Tras una ronda: ≥80 % de aciertos a la primera sube; <50 % baja.
export function nivelTrasRonda(nivel, aciertosPrimera, total) {
  if (!total) return acotar(nivel);
  const tasa = aciertosPrimera / total;
  if (tasa >= 0.8) return acotar(nivel + 1);
  if (tasa < 0.5) return acotar(nivel - 1);
  return acotar(nivel);
}

// Primer día: sube un peldaño cada 2 aciertos seguidos a la primera.
export function nivelEnCalibracion(nivel, aciertosPrimeraSeguidos) {
  return acotar(nivel + Math.floor(aciertosPrimeraSeguidos / 2));
}
