import { generarEjercicio } from './frases.js';
import { barajar, elegir } from '../util/rng.js';

const TIPOS_BASE = ['detalle', 'negacion', 'nohay', 'nombre', 'cuanto'];
const MAX_VOCABULARIO = 2;

export function tiposPermitidos(nivel, conVoz, hayVocabulario) {
  const tipos = [...TIPOS_BASE];
  if (nivel >= 4) {
    tipos.push('orden');
    if (conVoz) tipos.push('mentiroso');
  }
  if (conVoz && hayVocabulario) tipos.push('palabra');
  return tipos;
}

// Posición de la opción correcta cuando hay una sola (y no es "cualquiera").
function posicionCorrecta(e) {
  if (e.correcta.length !== 1 || e.correcta[0].startsWith('cualquiera')) return null;
  return e.opciones.findIndex(o => o.id === e.correcta[0]);
}

export function armarRonda(nivel, contexto, rng, cantidad = 12) {
  const hayVocabulario = Boolean(contexto.vocabulario && contexto.vocabulario.length);
  const tipos = tiposPermitidos(nivel, contexto.conVoz, hayVocabulario);
  const usadas = new Set(contexto.frasesRecientes || []);
  const ronda = [];
  // Primera vuelta: un ejercicio de cada tipo (variedad garantizada); después, al azar.
  const cola = barajar(tipos, rng);
  let vocabulario = 0;
  let posAnterior = null;
  let seguidas = 0;

  while (ronda.length < cantidad) {
    let tipo = cola.length ? cola.shift() : elegir(tipos, rng);
    if (tipo === 'palabra' && vocabulario >= MAX_VOCABULARIO) tipo = elegir(TIPOS_BASE, rng);

    let e = null;
    for (let intento = 0; intento < 20 && !e; intento++) {
      const candidato = generarEjercicio(tipo, nivel, rng, { ...contexto, frasesRecientes: [...usadas] });
      if (usadas.has(candidato.frase)) continue;
      let pos = posicionCorrecta(candidato);
      // Nunca tres veces seguidas la correcta en la misma posición.
      if (pos !== null && pos === posAnterior && seguidas >= 2) {
        if (tipo === 'mentiroso') continue; // las palabras no se pueden barajar: otra frase
        for (let b = 0; b < 10 && pos === posAnterior; b++) {
          candidato.opciones = barajar(candidato.opciones, rng);
          pos = posicionCorrecta(candidato);
        }
        if (pos === posAnterior) continue;
      }
      e = candidato;
      if (pos === posAnterior && pos !== null) seguidas++; else seguidas = 1;
      posAnterior = pos;
    }
    if (!e) continue;
    if (e.tipo === 'palabra') vocabulario++;
    usadas.add(e.frase);
    ronda.push(e);
  }
  return ronda;
}
