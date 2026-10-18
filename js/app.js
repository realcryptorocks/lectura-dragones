import { crearEstado } from './estado.js';
import { crearRng } from './util/rng.js';
import { claveDia } from './dia.js';
import { armarRonda, tiposPermitidos } from './generador/ronda.js';
import { generarEjercicio } from './generador/frases.js';
import { generarNombre } from './generador/nombres.js';
import { rarezaDe, casillasCamino, LARGO } from './camino.js';
import { svgCriatura } from './sprites.js';
import { svgDragon } from './dragones.js';
import { pintarEjercicio, resaltar } from './ejercicios/render.js';
import { vozDisponible, decir } from './voz.js';
import { sonidos } from './sonidos.js';

// ---------- parámetros de prueba: ?fecha=AAAA-MM-DD&semilla=N&sinvoz=1 ----------
const params = new URLSearchParams(location.search);
const fechaForzada = params.get('fecha');
const reloj = () => {
  if (!fechaForzada) return new Date();
  const ahora = new Date();
  const [a, m, d] = fechaForzada.split('-').map(Number);
  return new Date(a, m - 1, d, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());
};

const SEGUNDOS_POR_PALABRA = 0.25;
const SEGUNDOS_PISTA = 20;
const FALLOS_PISTA = 2;
const MS_TRAMPA = 2500;

const estado = crearEstado(localStorage, reloj);
estado.cargar();
let conVoz = false;

// ---------- pantallas ----------
const pantallas = Object.fromEntries([...document.querySelectorAll('[data-pantalla]')].map(s => [s.dataset.pantalla, s]));
function mostrar(nombre) {
  for (const [n, s] of Object.entries(pantallas)) s.hidden = n !== nombre;
}
document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));

function ir(nombre) {
  if (nombre === 'inicio') return pintarInicio();
  if (nombre === 'dragonario') return pintarDragonario();
  if (nombre === 'camino') return pintarCamino();
  mostrar(nombre);
}

// ---------- huevo del día (los dragones nacidos los dibuja dragones.js) ----------
function hash(s) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
const COLORES_IDS = ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja'];

function svgHuevoDelDia(numero, grietas = 0) {
  const spec = { tipo: 'huevo', color: COLORES_IDS[(numero * 7) % 6], manchas: numero % 3 === 0, alas: false, cuernos: false, tamano: 'grande' };
  const svg = svgCriatura(spec);
  // Las grietas se insertan al final del SVG; el CSS las destapa según data-grietas.
  const lineas = [
    'M100 40 L92 70 L104 90', 'M104 90 L96 118', 'M70 100 L86 112 L80 134', 'M130 96 L116 110 L124 130',
    'M96 118 L108 144 L98 166', 'M60 140 L82 150', 'M140 136 L118 150', 'M80 134 L100 150 L124 130',
  ].map(d => `<path class="grieta" d="${d}"/>`).join('');
  return svg.replace('</svg>', `<g data-grietas="${grietas}">${lineas}</g></svg>`);
}

// ---------- inicio ----------
function pintarInicio() {
  const huevo = estado.huevoDeHoy();
  if (!huevo) return pintarDormido();
  const { posicion } = casillasCamino(huevo.numero);
  document.getElementById('huevo-inicio').innerHTML = svgHuevoDelDia(huevo.numero, grietasDe(huevo));
  document.getElementById('inicio-texto').textContent = huevo.aciertos ? 'Tu huevo sigue con hambre' : 'Tu huevo tiene hambre';
  const rareza = rarezaDe(huevo.numero);
  document.getElementById('inicio-camino').textContent =
    rareza === 'legendario' ? '¡Es el huevo legendario!' : `Huevo ${posicion} de ${LARGO}`;
  mostrar('inicio');
}

function pintarDormido() {
  const ultimo = estado.datos.huevos[estado.datos.huevos.length - 1];
  document.getElementById('dormido-sprite').innerHTML = ultimo ? svgDragon(ultimo.nombre, ultimo.rareza) : '';
  document.getElementById('dormido-nombre').textContent = ultimo ? ultimo.nombre : '';
  mostrar('dormido');
}

function grietasDe(huevo) {
  return Math.min(8, Math.round((huevo.aciertos / huevo.meta) * 8));
}

// ---------- ronda ----------
let ronda = [];
let indice = 0;
let actual = null;      // { ejercicio, fallos, mostradoEn, usoPista, vista, temporizador }

function contexto() {
  return { conVoz, vocabulario: estado.datos.vocabulario, frasesRecientes: estado.frasesRecientes() };
}

function semillaDe(huevo) {
  if (params.get('semilla')) return Number(params.get('semilla'));
  return hash(`${huevo.fecha}-${huevo.numero}`);
}

function empezarRonda() {
  const huevo = estado.huevoDeHoy();
  if (!huevo) return pintarDormido();
  const rng = crearRng(semillaDe(huevo) + huevo.aciertos * 101);
  // En calibración (primer día) los ejercicios se generan de uno en uno con el nivel vivo.
  ronda = estado.datos.calibrado ? armarRonda(estado.datos.nivel, contexto(), rng) : [];
  indice = 0;
  mostrar('ejercicio');
  siguienteEjercicio();
}

function siguienteEjercicio() {
  const huevo = estado.huevoDeHoy();
  if (!huevo) return pintarDormido();
  if (huevo.aciertos >= huevo.meta) return eclosionar(huevo);

  let ejercicio;
  if (ronda.length && indice < ronda.length) {
    ejercicio = ronda[indice++];
  } else {
    const nivel = estado.nivelActual();
    const rng = crearRng(semillaDe(huevo) + huevo.aciertos * 101 + indice * 7);
    const tipos = tiposPermitidos(nivel, conVoz, estado.datos.vocabulario.length > 0);
    const tipo = tipos[Math.floor(rng() * tipos.length)];
    ejercicio = generarEjercicio(tipo, nivel, rng, contexto());
    indice++;
  }
  actual = { ejercicio, fallos: 0, mostradoEn: Date.now(), usoPista: false, vista: null, temporizador: null };
  pintarActual();
}

function pintarActual() {
  const { ejercicio } = actual;
  const huevo = estado.huevoDeHoy();
  document.getElementById('huevo-progreso').innerHTML = svgHuevoDelDia(huevo.numero, grietasDe(huevo));
  document.getElementById('progreso-texto').textContent = `${huevo.aciertos} / ${huevo.meta}`;
  actual.vista = pintarEjercicio(document.getElementById('zona-ejercicio'), ejercicio, {
    alResponder: responder,
    alPedirPista: darPista,
    alTocar: () => sonidos.toque(),
    alRepetirVoz: () => ejercicio.voz && decir(ejercicio.voz),
  }, { conVoz });
  actual.mostradoEn = Date.now();
  clearTimeout(actual.temporizador);
  actual.temporizador = setTimeout(() => actual.vista.mostrarPista(), SEGUNDOS_PISTA * 1000);
  if (actual.fallos >= FALLOS_PISTA) actual.vista.mostrarPista();
  if (ejercicio.voz && conVoz) decir(ejercicio.voz);
}

function esCorrecta(ejercicio, ids) {
  const c = ejercicio.correcta;
  if (c[0].startsWith('cualquiera:')) return ids.length === Number(c[0].split(':')[1]);
  if (ejercicio.tipo === 'orden') return ids.length === c.length && ids.every((id, i) => id === c[i]);
  return ids.length === 1 && ids[0] === c[0];
}

function responder(ids) {
  const { ejercicio } = actual;
  const segundos = (Date.now() - actual.mostradoEn) / 1000;
  const minimo = ejercicio.frase.split(/\s+/).length * SEGUNDOS_POR_PALABRA;
  if (segundos < minimo) {
    sonidos.otraVez();
    avisar('Léelo otra vez');
    // Sin penalización: se vuelve a pintar el mismo ejercicio.
    if (['cuanto', 'orden'].includes(ejercicio.tipo)) pintarActual();
    return;
  }
  estado.sumarSegundos(Math.round(segundos));
  clearTimeout(actual.temporizador);
  const primeraVez = actual.fallos === 0;
  if (esCorrecta(ejercicio, ids)) {
    estado.registrarRespuesta(ejercicio, { acierto: true, primeraVez, usoPista: actual.usoPista });
    sonidos.acierto();
    const h = estado.huevoDeHoy();
    if (h && h.aciertos < h.meta) setTimeout(() => sonidos.grieta(), 220); // el huevo se agrieta un poco más
    siguienteEjercicio();
  } else {
    estado.registrarRespuesta(ejercicio, { acierto: false, primeraVez, usoPista: false });
    actual.fallos++;
    sonidos.trampa();
    mostrarTrampa(ejercicio);
  }
}

function mostrarTrampa(ejercicio) {
  document.getElementById('trampa-frase').innerHTML = resaltar(ejercicio.frase, ejercicio.palabraClave);
  mostrar('trampa');
  setTimeout(() => { mostrar('ejercicio'); pintarActual(); }, MS_TRAMPA);
}

function darPista() {
  const { ejercicio } = actual;
  actual.usoPista = true;
  sonidos.pista();
  if (ejercicio.tipo === 'mentiroso') {
    // Iluminar la mentira sería regalar la respuesta: se repite la verdad.
    if (conVoz) decir(ejercicio.voz);
    return;
  }
  actual.vista.iluminar(ejercicio.palabraClave);
  if (conVoz) decir(ejercicio.palabraClave);
}

let avisoTemporizador = null;
function avisar(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => { aviso.hidden = true; }, 1500);
}

// ---------- eclosión ----------
function eclosionar(huevo) {
  const rareza = rarezaDe(huevo.numero);
  const rng = crearRng(semillaDe(huevo) + 999);
  const nombre = generarNombre(estado.nivelActual(), rng);
  estado.eclosionar(nombre, rareza);

  const pantalla = pantallas.eclosion;
  pantalla.classList.toggle('legendario', rareza === 'legendario');
  const huevoEl = document.getElementById('eclosion-huevo');
  const dragonEl = document.getElementById('eclosion-dragon');
  const seguir = document.getElementById('eclosion-seguir');
  const extra = document.getElementById('eclosion-extra');
  huevoEl.innerHTML = svgHuevoDelDia(huevo.numero, 8);
  huevoEl.hidden = false;
  huevoEl.classList.add('temblando');
  sonidos.grieta();
  setTimeout(() => sonidos.grieta(), 700);
  setTimeout(() => sonidos.eclosion(rareza === 'legendario'), 2000);
  dragonEl.hidden = true;
  seguir.hidden = true;
  extra.hidden = true;
  document.getElementById('eclosion-nombre').textContent = '';
  document.getElementById('eclosion-rareza').textContent = { comun: 'Ha nacido un dragón', raro: '¡Un dragón raro!', legendario: '¡¡EL DRAGÓN LEGENDARIO!!' }[rareza];
  mostrar('eclosion');

  setTimeout(() => {
    huevoEl.hidden = true;
    huevoEl.classList.remove('temblando');
    dragonEl.innerHTML = svgDragon(nombre, rareza);
    dragonEl.hidden = false;
    dragonEl.classList.add('apareciendo');
    document.getElementById('eclosion-nombre').textContent = nombre;
    if (rareza === 'legendario') {
      extra.textContent = 'Este dragón es tan especial que puede salir de la tablet.';
      extra.hidden = false;
    }
    seguir.hidden = false;
  }, 2200);
}
document.getElementById('eclosion-seguir').addEventListener('click', pintarInicio);

// ---------- dragonario y camino ----------
function pintarDragonario() {
  const lista = document.getElementById('dragonario-lista');
  const huevos = estado.datos.huevos;
  lista.innerHTML = huevos.length ? '' : '<p class="vacio">Todavía no ha nacido ningún dragón.</p>';
  for (const h of [...huevos].reverse()) {
    const ficha = document.createElement('div');
    ficha.className = `ficha ${h.rareza}`;
    ficha.innerHTML = svgDragon(h.nombre, h.rareza) + '<p class="nombre"></p><p class="rareza"></p>';
    ficha.querySelector('.nombre').textContent = h.nombre;
    ficha.querySelector('.rareza').textContent = { comun: 'común', raro: 'raro', legendario: 'legendario' }[h.rareza];
    lista.append(ficha);
  }
  mostrar('dragonario');
}

function pintarCamino() {
  const huevo = estado.huevoDeHoy() || estado.datos.huevoActual;
  const numero = huevo ? huevo.numero : 1;
  const { posicion, casillas } = casillasCamino(numero);
  const lista = document.getElementById('camino-lista');
  lista.innerHTML = '';
  const hoyEclosionado = huevo && huevo.eclosionado;
  casillas.forEach((c, i) => {
    const d = document.createElement('div');
    const hecha = c.hecha || (hoyEclosionado && i + 1 === posicion);
    d.className = `casilla ${c.rareza} ${hecha ? 'hecha' : ''} ${i + 1 === posicion && !hecha ? 'actual' : ''}`;
    d.textContent = c.rareza === 'legendario' ? '🐲' : (c.rareza === 'raro' ? '★' : String(i + 1));
    lista.append(d);
  });
  const faltan = LARGO - posicion + (hoyEclosionado ? 0 : 1);
  document.getElementById('camino-texto').textContent = faltan <= 0
    ? 'El legendario ya es tuyo.' : `Faltan ${faltan} huevos para el legendario.`;
  mostrar('camino');
}

// ---------- arranque ----------
document.getElementById('huevo-inicio').addEventListener('click', empezarRonda);

// Al volver del panel (atrás de Android, bfcache) o al reanudar la app al día
// siguiente, se relee el almacén para no pisar lo que cambió el padre y para
// que aparezca el huevo nuevo sin recargar.
function refrescarSiEstaParado() {
  const enReposo = !pantallas.inicio.hidden || !pantallas.dormido.hidden;
  if (!enReposo) return;
  estado.cargar();
  pintarInicio();
}
window.addEventListener('pageshow', ev => { if (ev.persisted) refrescarSiEstaParado(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refrescarSiEstaParado(); });

(async () => {
  conVoz = params.get('sinvoz') ? false : await vozDisponible();
  // ?debug=1 expone el estado para pruebas desde la consola.
  if (params.get('debug')) window.cria = { estado, sonidos, actual: () => actual, get conVoz() { return conVoz; } };
  pintarInicio();
})();
