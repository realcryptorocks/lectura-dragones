import { claveDia } from './dia.js';
import { nivelTrasRonda, nivelEnCalibracion } from './escalera.js';
import { normalizarVocabulario } from './generador/frases.js';

const CLAVE = 'cria-dragones';
const META_INICIAL = 8;
const META_MAXIMA = 12;
const DIAS_RECIENTES = 5;

export const ESTADO_INICIAL = Object.freeze({
  version: 1,
  nivel: 1,
  calibrado: false,
  huevos: [],
  huevoActual: null,
  estadisticas: { palabras: {}, tipos: {}, trampasCazadas: 0, segundosJugados: 0 },
  vocabulario: [],
  frasesRecientes: [],
  pin: '2026',
  vozActivada: true,
});

function copiaInicial() {
  return JSON.parse(JSON.stringify(ESTADO_INICIAL));
}

function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// Comprueba que un objeto tiene la forma del estado (para importar).
function validar(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'no es un estado';
  if (obj.version !== 1) return 'versión desconocida';
  if (!Array.isArray(obj.huevos)) return 'faltan los huevos';
  if (typeof obj.nivel !== 'number' || obj.nivel < 1 || obj.nivel > 8) return 'nivel inválido';
  if (!obj.estadisticas || typeof obj.estadisticas !== 'object') return 'faltan las estadísticas';
  return null;
}

export function crearEstado(almacen, reloj = () => new Date()) {
  let datos = copiaInicial();
  const hoy = () => claveDia(reloj());

  function guardar() {
    almacen.setItem(CLAVE, JSON.stringify(datos));
  }

  function cargar() {
    datos = copiaInicial();
    try {
      const crudo = almacen.getItem(CLAVE);
      if (crudo) {
        const obj = JSON.parse(crudo);
        if (!validar(obj)) datos = { ...copiaInicial(), ...obj, estadisticas: { ...copiaInicial().estadisticas, ...obj.estadisticas } };
      }
    } catch {
      datos = copiaInicial();
    }
  }

  function nuevoHuevo() {
    return {
      fecha: hoy(), numero: datos.huevos.length + 1, aciertos: 0, meta: META_INICIAL,
      fallosPorFrase: {}, eclosionado: false, aciertosPrimera: 0, respondidas: 0, seguidosPrimera: 0,
    };
  }

  // El huevo activo: el empezado (aunque sea de otro día) o uno nuevo de hoy.
  // Si el de hoy ya eclosionó, null: hasta mañana no hay más.
  function huevoDeHoy() {
    const h = datos.huevoActual;
    if (h && !h.eclosionado) return h;
    if (h && h.eclosionado && h.fechaEclosion === hoy()) return null;
    datos.huevoActual = nuevoHuevo();
    guardar();
    return datos.huevoActual;
  }

  function frasesRecientes() {
    const h = hoy();
    datos.frasesRecientes = datos.frasesRecientes.filter(f => diasEntre(f.fecha, h) < DIAS_RECIENTES);
    return datos.frasesRecientes.map(f => f.frase);
  }

  function registrarRespuesta(ejercicio, { acierto, primeraVez, usoPista }) {
    const h = huevoDeHoy();
    if (!h) return;
    const est = datos.estadisticas;
    if (acierto) {
      h.aciertos++;
      h.respondidas++;
      if (primeraVez) { h.aciertosPrimera++; h.seguidosPrimera++; }
      if (usoPista) est.trampasCazadas++;
      const clave = ejercicio.claveRepeticion || ejercicio.frase;
      if (!datos.frasesRecientes.some(f => f.frase === clave)) {
        datos.frasesRecientes.push({ frase: clave, fecha: hoy() });
      }
    } else {
      h.seguidosPrimera = 0;
      if (primeraVez) {
        h.meta = Math.min(META_MAXIMA, h.meta + 1);
        est.trampasCazadas++;
        est.palabras[ejercicio.palabraClave] = (est.palabras[ejercicio.palabraClave] || 0) + 1;
        est.tipos[ejercicio.tipo] = (est.tipos[ejercicio.tipo] || 0) + 1;
      }
      h.fallosPorFrase[ejercicio.frase] = (h.fallosPorFrase[ejercicio.frase] || 0) + 1;
    }
    guardar();
  }

  // Nivel con el que generar el siguiente ejercicio (en calibración sube en vivo).
  function nivelActual() {
    const h = datos.huevoActual;
    if (!datos.calibrado && h && !h.eclosionado) return nivelEnCalibracion(datos.nivel, h.seguidosPrimera);
    return datos.nivel;
  }

  function eclosionar(nombre, rareza) {
    const h = datos.huevoActual;
    if (!h || h.eclosionado) return;
    h.eclosionado = true;
    h.nombre = nombre;
    h.rareza = rareza;
    h.fechaEclosion = hoy();
    datos.huevos.push({ numero: h.numero, nombre, rareza, fecha: h.fecha, fechaEclosion: h.fechaEclosion });
    datos.nivel = datos.calibrado
      ? nivelTrasRonda(datos.nivel, h.aciertosPrimera, h.respondidas)
      : nivelEnCalibracion(datos.nivel, h.seguidosPrimera);
    datos.calibrado = true;
    guardar();
  }

  function exportar() {
    return JSON.stringify(datos, null, 2);
  }

  function importar(texto) {
    let obj;
    try { obj = JSON.parse(texto); } catch { return { ok: false, error: 'el archivo no es JSON' }; }
    const error = validar(obj);
    if (error) return { ok: false, error };
    datos = { ...copiaInicial(), ...obj };
    guardar();
    return { ok: true };
  }

  function fijarVocabulario(texto) {
    datos.vocabulario = normalizarVocabulario(texto);
    guardar();
    return datos.vocabulario;
  }

  function fijarPin(pin) {
    datos.pin = String(pin);
    guardar();
  }

  function sumarSegundos(s) {
    datos.estadisticas.segundosJugados += s;
    guardar();
  }

  return {
    get datos() { return datos; },
    cargar, guardar, huevoDeHoy, registrarRespuesta, eclosionar, nivelActual,
    frasesRecientes, exportar, importar, fijarVocabulario, fijarPin, sumarSegundos,
  };
}
