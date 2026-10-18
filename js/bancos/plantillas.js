import { nivelMinimo } from '../grafias.js';

// Palabras fijas del juego que se ven cada día y quedan fuera del filtro de
// nivel: se convierten en palabras de vista. Todo lo demás, por grafías.
export const EXENTAS = new Set([
  'huevo', 'huevos', 'dragón', 'dragones', 'toca', 'tócalo', 'tócalos',
  'el', 'la', 'los', 'las', 'al', 'del', 'un', 'una', 'que', 'qué', 'no',
  'con', 'sin', 'y', 'o', 'de', 'en', 'a', 'es', 'está', 'están', 'tiene',
  'primero', 'luego', 'después', 'se', 'llama', 'llamo', 'tu', 'este', 'esta',
  'hay', 'aquí', 'cuál', 'dónde', 'cómo', 'lo', 'mi', 'su', 'ni', 'hoy', 'ya',
  'le', 'me', 'te', 'si', 'solo', 'para', 'por', 'ahora', 'más', 'bien', 'oyes',
  // Los números son su fuerte: no pasan el filtro de grafías.
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
]);

// Huecos: {criatura} {criaturas} {rasgos} {rasgoNeg} {lugarA} {lugarB}
// {numero} {color} {lugar} {nombre}
const DETALLE = [
  'Toca el {criatura} {rasgos}',
  'Señala el {criatura} {rasgos}',
  'Despierta al {criatura} {rasgos}',
  'Mira y toca el {criatura} {rasgos}',
  'Pulsa el {criatura} {rasgos}',
  'Dale mimos al {criatura} {rasgos}',
  'El {criatura} {rasgos} tiene sueño. Tócalo',
  '¿Dónde está el {criatura} {rasgos}?',
  'Pon el dedo en el {criatura} {rasgos}',
  'Saluda al {criatura} {rasgos}',
  'Dale de comer al {criatura} {rasgos}',
  'Busca el {criatura} {rasgos}',
  '¿Cuál es el {criatura} {rasgos}?',
  'Elige el {criatura} {rasgos}',
  'Acaricia al {criatura} {rasgos}',
  'El {criatura} {rasgos} quiere jugar. Tócalo',
  'Hoy toca mimar al {criatura} {rasgos}',
  'Lleva a dormir al {criatura} {rasgos}',
  'El {criatura} {rasgos} tiene sed. Tócalo',
  'El {criatura} {rasgos} es tu amigo. Tócalo',
  'Toca solo el {criatura} {rasgos}',
  'Toca el {criatura} {rasgos} una vez',
  'Pide ayuda al {criatura} {rasgos}',
  'Abraza al {criatura} {rasgos}',
  'El {criatura} {rasgos} se ha perdido. Tócalo',
  'Señala con el dedo el {criatura} {rasgos}',
  'Toca el {criatura} {rasgos} y nada más',
  'Dale un premio al {criatura} {rasgos}',
  'Haz una foto al {criatura} {rasgos}',
  'Toca el {criatura} {rasgos} con un dedo',
  'El {criatura} {rasgos} te llama',
  'Toca el {criatura} {rasgos} ahora',
  'El {criatura} {rasgos} tiene miedo. Tócalo',
  'Toca el {criatura} {rasgos} para abrir la puerta',
  'Toca el {criatura} {rasgos} y gana una estrella',
  'El {criatura} {rasgos} está feliz. Tócalo',
  'Lee bien: es el {criatura} {rasgos}',
  'Toca el {criatura} {rasgos} si lo ves',
  'Toca el {criatura} {rasgos} de la fila',
  'Toca el {criatura} {rasgos} y sonríe',
  'Señala el {criatura} {rasgos} y ya está',
  'Dale las buenas noches al {criatura} {rasgos}',
];

const NEGACION = [
  'Toca el {criatura} que NO {rasgoNeg}',
  'Señala el {criatura} que NO {rasgoNeg}',
  'Despierta al {criatura} que NO {rasgoNeg}',
  'Busca el {criatura} que NO {rasgoNeg}',
  '¿Cuál es el {criatura} que NO {rasgoNeg}?',
  'Pulsa el {criatura} que NO {rasgoNeg}',
  'Dale mimos al {criatura} que NO {rasgoNeg}',
  'Mira bien: toca el {criatura} que NO {rasgoNeg}',
  'Hay un {criatura} que NO {rasgoNeg}. Tócalo',
  'Solo un {criatura} NO {rasgoNeg}. Tócalo',
  'Saluda al {criatura} que NO {rasgoNeg}',
  'Dale de comer al {criatura} que NO {rasgoNeg}',
  'Pon el dedo en el {criatura} que NO {rasgoNeg}',
  'Elige el {criatura} que NO {rasgoNeg}',
  'Acaricia al {criatura} que NO {rasgoNeg}',
  'Abraza al {criatura} que NO {rasgoNeg}',
  'El {criatura} que NO {rasgoNeg} tiene sueño. Tócalo',
  'El {criatura} que NO {rasgoNeg} te llama',
  'Toca el {criatura} que NO {rasgoNeg} y gana una estrella',
  'Lleva a dormir al {criatura} que NO {rasgoNeg}',
  'Haz una foto al {criatura} que NO {rasgoNeg}',
  'Toca solo el {criatura} que NO {rasgoNeg}',
  'El {criatura} que NO {rasgoNeg} está feliz. Tócalo',
  'Señala con el dedo el {criatura} que NO {rasgoNeg}',
  'Toca el {criatura} que NO {rasgoNeg} ahora',
  'Dale un premio al {criatura} que NO {rasgoNeg}',
];

const ORDEN = [
  'Primero toca {lugarA}, luego {lugarB}',
  'Toca {lugarA} y luego {lugarB}',
  'Primero {lugarA} y después {lugarB}',
  'Toca {lugarA} y después {lugarB}',
  'Ve a {lugarA} y luego a {lugarB}',
  'Primero {lugarA}. Luego {lugarB}',
  'Toca {lugarA}, después {lugarB}',
  'Empieza en {lugarA} y acaba en {lugarB}',
  'Visita {lugarA} y luego {lugarB}',
  'Toca {lugarA} antes que {lugarB}',
  'Pasa por {lugarA} y luego por {lugarB}',
  'Primero toca {lugarA} y al final {lugarB}',
  'Toca {lugarA} y, para acabar, {lugarB}',
  'Lo primero es {lugarA}. Lo segundo, {lugarB}',
  'Sal de {lugarA} y entra en {lugarB}',
  'El dragón va a {lugarA} y luego a {lugarB}. Toca su camino',
  'Toca {lugarA}. Después toca {lugarB}',
  'Uno: {lugarA}. Dos: {lugarB}',
  'Toca {lugarA} y luego toca {lugarB}',
  'Primero {lugarA}, luego {lugarB}, y ya está',
  'Toca {lugarA} con cuidado. Luego toca {lugarB}',
];

const CUANTO = [
  'Toca {numero} {criaturas}',
  'Señala {numero} {criaturas}',
  'Toca solo {numero} {criaturas}',
  'Despierta a {numero} {criaturas}',
  'Dale mimos a {numero} {criaturas}',
  'Elige {numero} {criaturas}',
  'Pulsa {numero} {criaturas}',
  'Toca {numero} {criaturas}, ni uno más',
  'Hoy comen {numero} {criaturas}. Tócalos',
  'Saluda a {numero} {criaturas}',
  'Busca {numero} {criaturas}',
  'Toca {numero} {criaturas} y para',
  'Lleva a dormir a {numero} {criaturas}',
  'Haz una foto a {numero} {criaturas}',
  'Dale un premio a {numero} {criaturas}',
  'Abraza a {numero} {criaturas}',
  'Acaricia a {numero} {criaturas}',
  'Toca {numero} {criaturas} y gana una estrella',
  'Pon el dedo en {numero} {criaturas}',
  'Solo {numero} {criaturas} tienen sueño. Tócalos',
  'Señala con el dedo {numero} {criaturas}',
  'Toca {numero} {criaturas} y ya está',
];

const MENTIROSO = [
  'El {criatura} {color} está {lugar}',
  'El {criatura} {color} duerme {lugar}',
  'Hay un {criatura} {color} {lugar}',
  'El {criatura} {color} se esconde {lugar}',
  'El {criatura} {color} salta {lugar}',
  'El {criatura} {color} come {lugar}',
  'Mira al {criatura} {color} {lugar}',
  'El {criatura} {color} se ríe {lugar}',
  'El {criatura} {color} juega {lugar}',
  'El {criatura} {color} canta {lugar}',
  'El {criatura} {color} sueña {lugar}',
  'El {criatura} {color} descansa {lugar}',
  'El {criatura} {color} espera {lugar}',
  'El {criatura} {color} vive {lugar}',
  'Un {criatura} {color} se ha perdido {lugar}',
  'El {criatura} {color} tiene su casa {lugar}',
  'El {criatura} {color} se sienta {lugar}',
  'El {criatura} {color} se baña {lugar}',
  'El {criatura} {color} tiene sed {lugar}',
  'El {criatura} {color} se ha dormido {lugar}',
  'El {criatura} {color} pide mimos {lugar}',
  'El {criatura} {color} se pone {lugar}',
  'El {criatura} {color} está solo {lugar}',
  'El {criatura} {color} se queda {lugar}',
  'El {criatura} {color} mira la luna {lugar}',
  'El {criatura} {color} toma el sol {lugar}',
];

const NOMBRE = [
  'Tu dragón se llama {nombre}',
  'Este dragón se llama {nombre}',
  'El huevo se llama {nombre}',
  'Hola, me llamo {nombre}',
  'Mi nombre es {nombre}',
  'Se llama {nombre} y es tu amigo',
];

// El nivel mínimo de una plantilla lo marcan sus palabras fijas no exentas.
function nivelDePlantilla(texto) {
  const palabras = texto.replace(/\{[a-zA-Z]+\}/g, ' ')
    .toLowerCase().replace(/[¿?¡!.,:]/g, '').split(/\s+/).filter(Boolean);
  let nivel = 1;
  for (const p of palabras) if (!EXENTAS.has(p)) nivel = Math.max(nivel, nivelMinimo(p));
  return nivel;
}

function conTipo(tipo, lista) {
  return lista.map(texto => ({ tipo, nivelMin: nivelDePlantilla(texto), texto }));
}

export const PLANTILLAS = [
  ...conTipo('detalle', DETALLE),
  ...conTipo('negacion', NEGACION),
  ...conTipo('orden', ORDEN),
  // "No hay" usa las mismas frases que "detalle": así la frase no delata el tipo.
  ...conTipo('nohay', DETALLE.slice(0, 24)),
  ...conTipo('cuanto', CUANTO),
  ...conTipo('mentiroso', MENTIROSO),
  ...conTipo('nombre', NOMBRE),
];

export function plantillasDe(tipo, nivel) {
  const lista = PLANTILLAS.filter(p => p.tipo === tipo && p.nivelMin <= nivel);
  if (lista.length) return lista;
  // Siempre hay al menos una: la de nivel más bajo del tipo.
  const todas = PLANTILLAS.filter(p => p.tipo === tipo);
  const min = Math.min(...todas.map(p => p.nivelMin));
  return todas.filter(p => p.nivelMin === min);
}
