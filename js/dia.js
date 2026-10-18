// Clave de día en hora local: 'AAAA-MM-DD'.
export function claveDia(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

export function hoy() {
  return claveDia(new Date());
}
