import { COLORES, RASGOS, LUGARES, NUMEROS, CRIATURAS } from '../bancos/palabras.js';
import { plantillasDe, EXENTAS } from '../bancos/plantillas.js';
import { permitida } from '../grafias.js';
import { elegir, barajar } from '../util/rng.js';
import { specAleatorio, variantesSprite, textoRasgo, RASGOS_CLAVE } from './escena.js';
import { generarNombre, distractoresNombre, variantesEscritura } from './nombres.js';

export { EXENTAS };

// ---------- utilidades ----------

function rellenar(texto, valores) {
  return texto.replace(/\{([a-zA-Z]+)\}/g, (_, k) => valores[k]);
}

function capitalizar(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function articuloDe(lugar) {
  return lugar.preposicion.slice(3); // "en la cueva" → "la cueva"
}

// ¿El sprite cumple todos los rasgos pedidos? rasgos = { color: 'rojo', manchas: true, ... }
export function cumpleRasgos(sprite, rasgos) {
  return Object.entries(rasgos).every(([k, v]) => sprite[k] === v);
}

function rasgosPermitidos(spec, nivel) {
  return RASGOS_CLAVE.filter(r => textoRasgo(spec, r).split(' ').every(p => permitida(p, nivel)));
}

// "azul con manchas", "grande sin alas", "rojo pequeño"…: color y tamaño
// delante, los con/sin detrás.
function describir(spec, rasgos) {
  const delante = ['color', 'tamano'].filter(r => rasgos.includes(r)).map(r => textoRasgo(spec, r));
  const detras = ['manchas', 'alas', 'cuernos'].filter(r => rasgos.includes(r)).map(r => textoRasgo(spec, r));
  return [...delante, detras.join(' y ')].filter(Boolean).join(' ');
}

function valorDe(spec, rasgo) {
  return spec[rasgo];
}

function cambiarRasgo(spec, rasgo, rng, nivel) {
  // variantesSprite devuelve primero la que difiere solo en ese rasgo.
  return variantesSprite(spec, rasgo, rng, nivel)[0];
}

const NOHAY = { id: 'nohay', texto: 'aquí no está' };

function opcionesSprite(specs, rng, conNoHay = true) {
  const ops = specs.map((sprite, i) => ({ id: `s${i}`, sprite }));
  const lista = barajar(ops, rng);
  if (conNoHay) lista.push(NOHAY);
  return lista;
}

// ---------- tipos ----------

function detalle(nivel, rng, plantilla) {
  const spec = specAleatorio(nivel, rng);
  const posibles = rasgosPermitidos(spec, nivel);
  const [clave, otro] = barajar(posibles, rng);
  const rasgos = { [clave]: valorDe(spec, clave), [otro]: valorDe(spec, otro) };
  const v1 = cambiarRasgo(spec, clave, rng, nivel);
  const v2 = cambiarRasgo(spec, otro, rng, nivel);
  const opciones = opcionesSprite([spec, v1, v2], rng);
  const correcta = opciones.find(o => o.sprite === spec).id;
  return {
    frase: capitalizar(rellenar(plantilla, { criatura: CRIATURAS[spec.tipo].texto, rasgos: describir(spec, [clave, otro]) })),
    voz: null, opciones, correcta: [correcta], palabraClave: textoRasgo(spec, clave), rasgos,
  };
}

function nohay(nivel, rng, plantilla) {
  const spec = specAleatorio(nivel, rng);
  const [clave, otro] = barajar(rasgosPermitidos(spec, nivel), rng);
  const rasgos = { [clave]: valorDe(spec, clave), [otro]: valorDe(spec, otro) };
  const o1 = cambiarRasgo(spec, clave, rng, nivel);
  const o2 = cambiarRasgo(spec, otro, rng, nivel);
  const o3 = cambiarRasgo(o1, otro, rng, nivel);
  const opciones = opcionesSprite([o1, o2, o3], rng);
  return {
    frase: capitalizar(rellenar(plantilla, { criatura: CRIATURAS[spec.tipo].texto, rasgos: describir(spec, [clave, otro]) })),
    voz: null, opciones, correcta: ['nohay'], palabraClave: textoRasgo(spec, clave), rasgos,
  };
}

function textoNegado(spec, rasgo) {
  if (rasgo === 'color' || rasgo === 'tamano') return `es ${textoRasgo(spec, rasgo)}`;
  return `tiene ${RASGOS[rasgo].con.replace('con ', '')}`;
}

function negacion(nivel, rng, plantilla) {
  let spec = specAleatorio(nivel, rng);
  const posibles = rasgosPermitidos(spec, nivel);
  const clave = elegir(posibles, rng);
  // Los booleanos se niegan en positivo ("que NO tiene alas").
  if (clave !== 'color' && clave !== 'tamano') spec = { ...spec, [clave]: true };
  const rasgos = { [clave]: valorDe(spec, clave) };
  const [otroA, otroB] = barajar(RASGOS_CLAVE.filter(r => r !== clave), rng);
  const cumpleA = cambiarRasgo(spec, otroA, rng, nivel);
  const cumpleB = cambiarRasgo(spec, otroB, rng, nivel);
  const correcta = cambiarRasgo(spec, clave, rng, nivel);
  const opciones = opcionesSprite([spec, cumpleA, cumpleB, correcta], rng);
  return {
    frase: capitalizar(rellenar(plantilla, { criatura: CRIATURAS[spec.tipo].texto, rasgoNeg: textoNegado(spec, clave) })),
    voz: null, opciones, correcta: [opciones.find(o => o.sprite === correcta).id], palabraClave: 'no', rasgos,
  };
}

function orden(nivel, rng, plantilla) {
  const permitidos = LUGARES.filter(l => permitida(l.texto, nivel));
  const pool = permitidos.length >= 3 ? permitidos : LUGARES;
  const [a, b, c] = barajar(pool, rng);
  const opciones = barajar([a, b, c].map(l => ({ id: l.id, lugar: l.id, lugarTexto: articuloDe(l) })), rng);
  return {
    frase: capitalizar(rellenar(plantilla, { lugarA: articuloDe(a), lugarB: articuloDe(b) })),
    voz: null, opciones, correcta: [a.id, b.id], palabraClave: 'primero',
  };
}

function nombre(nivel, rng, plantilla) {
  const n = generarNombre(nivel, rng);
  const distractores = distractoresNombre(n, nivel, rng);
  const opciones = barajar([n, ...distractores].map((texto, i) => ({ id: `n${i}`, texto })), rng);
  return {
    frase: capitalizar(rellenar(plantilla, { nombre: n })),
    voz: null, opciones, correcta: [opciones.find(o => o.texto === n).id], palabraClave: n,
  };
}

function palabra(nivel, rng, contexto) {
  if (!contexto.vocabulario || !contexto.vocabulario.length) throw new Error('palabra: sin vocabulario');
  const p = elegir(contexto.vocabulario, rng);
  const variantes = variantesEscritura(p, rng);
  const opciones = barajar([p, ...variantes].map((texto, i) => ({ id: `p${i}`, texto })), rng);
  return {
    frase: 'Toca lo que oyes',
    voz: p, opciones, correcta: [opciones.find(o => o.texto === p).id], palabraClave: p,
  };
}

function cuanto(nivel, rng, plantilla) {
  // Nunca "uno" (en plural suena mal) ni "seis" (siempre hay más criaturas
  // que las pedidas, y el máximo en pantalla es 6).
  const numeros = NUMEROS.filter(x => x.n >= 2 && x.n <= 5 && permitida(x.texto, nivel));
  const num = elegir(numeros, rng);
  const posibles = [3, 4, 5, 6].filter(m => m > num.n);
  const m = elegir(posibles, rng);
  const spec = specAleatorio(nivel, rng);
  const opciones = Array.from({ length: m }, (_, i) => ({ id: `c${i}`, sprite: spec }));
  const plural = spec.tipo === 'huevo' ? 'huevos' : 'dragones';
  return {
    frase: capitalizar(rellenar(plantilla, { numero: num.texto, criaturas: plural })),
    voz: null, opciones, correcta: [`cualquiera:${num.n}`], palabraClave: num.texto, cantidad: num.n,
  };
}

function mentiroso(nivel, rng, plantilla) {
  const colores = COLORES.filter(c => permitida(c.texto, nivel));
  const tipo = rng() < 0.5 ? 'huevo' : 'dragon';
  const color = elegir(colores, rng);
  const lugar = elegir(LUGARES.filter(l => permitida(l.texto, nivel)).length >= 2
    ? LUGARES.filter(l => permitida(l.texto, nivel)) : LUGARES, rng);
  const valores = { criatura: CRIATURAS[tipo].texto, color: color.texto, lugar: lugar.preposicion };
  const voz = capitalizar(rellenar(plantilla, valores));

  // Cambiar un hueco por otro valor de la misma categoría con el mismo número
  // de palabras (y mismo artículo en los lugares) para que solo cambie una.
  const cambios = [];
  const otrosColores = colores.filter(c => c.id !== color.id);
  if (otrosColores.length) cambios.push(['color', elegir(otrosColores, rng).texto]);
  const articulo = lugar.preposicion.split(' ')[1];
  const otrosLugares = LUGARES.filter(l => l.id !== lugar.id && l.preposicion.split(' ')[1] === articulo
    && permitida(l.texto, Math.max(nivel, 6)));
  if (otrosLugares.length) cambios.push(['lugar', elegir(otrosLugares, rng).preposicion]);
  cambios.push(['criatura', CRIATURAS[tipo === 'huevo' ? 'dragon' : 'huevo'].texto]);
  const [hueco, nuevo] = elegir(cambios, rng);
  const escrita = capitalizar(rellenar(plantilla, { ...valores, [hueco]: nuevo }));

  const limpiar = s => s.toLowerCase().replace(/[¿?¡!.,:]/g, '');
  const palabrasVoz = voz.split(' ');
  const palabrasEscrita = escrita.split(' ');
  const indice = palabrasEscrita.findIndex((p, i) => limpiar(p) !== limpiar(palabrasVoz[i]));
  const opciones = palabrasEscrita.map((texto, i) => ({ id: String(i), texto }));
  return {
    frase: escrita, voz, opciones, correcta: [String(indice)], palabraClave: limpiar(palabrasEscrita[indice]),
    escena: { sprite: { tipo, color: color.id, manchas: false, alas: false, cuernos: false, tamano: 'grande' }, lugar: lugar.id },
  };
}

const GENERADORES = { detalle, nohay, negacion, orden, nombre, cuanto, mentiroso };

// ---------- entrada ----------

export function generarEjercicio(tipo, nivel, rng, contexto = {}) {
  const recientes = new Set(contexto.frasesRecientes || []);
  let ejercicio;
  for (let intento = 0; intento < 40; intento++) {
    if (tipo === 'palabra') {
      ejercicio = palabra(nivel, rng, contexto);
    } else {
      const gen = GENERADORES[tipo];
      if (!gen) throw new Error(`tipo desconocido: ${tipo}`);
      ejercicio = gen(nivel, rng, elegir(plantillasDe(tipo, nivel), rng).texto);
    }
    if (!recientes.has(ejercicio.frase)) break;
  }
  return { tipo, nivel, ...ejercicio };
}

export function normalizarVocabulario(texto) {
  const vistas = new Set();
  const out = [];
  for (const cruda of (texto || '').split(/[\s,;]+/)) {
    const p = cruda.trim().toLowerCase();
    if (!p || !/^[a-zñáéíóúü]+$/.test(p) || vistas.has(p)) continue;
    vistas.add(p);
    out.push(p);
  }
  return out;
}
