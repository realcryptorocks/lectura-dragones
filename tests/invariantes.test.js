// Barrido de invariantes en todos los niveles y tipos: lo que nunca puede pasar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarEjercicio } from '../js/generador/frases.js';
import { armarRonda } from '../js/generador/ronda.js';
import { crearRng } from '../js/util/rng.js';

const ctx = (extra = {}) => ({ conVoz: true, vocabulario: ['biblioteca', 'ventana'], frasesRecientes: [], ...extra });
const TIPOS = ['detalle', 'negacion', 'nohay', 'orden', 'nombre', 'cuanto', 'mentiroso', 'palabra'];
const CAMPOS = ['tipo', 'color', 'manchas', 'alas', 'cuernos', 'tamano'];
const firma = s => CAMPOS.map(c => String(s[c])).join('|');

function* todos(veces = 150) {
  for (let nivel = 1; nivel <= 8; nivel++) {
    const rng = crearRng(100 + nivel);
    for (const tipo of TIPOS) {
      if (nivel < 4 && ['orden', 'mentiroso'].includes(tipo)) continue;
      for (let i = 0; i < veces; i++) yield [nivel, tipo, generarEjercicio(tipo, nivel, rng, ctx())];
    }
  }
}

test('ningún ejercicio tiene dos sprites visualmente iguales (salvo cuanto, que los repite a propósito)', () => {
  for (const [nivel, tipo, e] of todos()) {
    if (tipo === 'cuanto') continue;
    const firmas = e.opciones.filter(o => o.sprite).map(o => firma(o.sprite));
    assert.equal(new Set(firmas).size, firmas.length, `${nivel} ${tipo}: ${e.frase}`);
    for (const o of e.opciones) if (o.sprite) assert.ok(!('undefined' in o.sprite), 'rasgo fantasma');
  }
});

test('ninguna frase lleva "undefined", "a el", "de el" ni dobles espacios', () => {
  for (const [nivel, tipo, e] of todos()) {
    assert.doesNotMatch(e.frase, /undefined|\ba el\b|\bde el\b| {2}/, `${nivel} ${tipo}: ${e.frase}`);
    if (e.voz) assert.doesNotMatch(e.voz, /undefined|\ba el\b|\bde el\b/, e.voz);
  }
});

test('siempre hay al menos 3 opciones y la clave aparece en la frase', () => {
  for (const [nivel, tipo, e] of todos()) {
    assert.ok(e.opciones.length >= 3, `${nivel} ${tipo}: ${e.frase}`);
    const ultima = e.palabraClave.split(' ').pop().toLowerCase();
    const texto = (tipo === 'palabra' ? e.voz : e.frase).toLowerCase();
    assert.ok(texto.includes(ultima), `${nivel} ${tipo}: "${e.palabraClave}" no está en "${e.frase}"`);
  }
});

test('detalle y nohay tienen la misma cantidad de sprites: no hay pista estructural', () => {
  for (let nivel = 1; nivel <= 8; nivel++) {
    const rng = crearRng(7 + nivel);
    const cuenta = tipo => new Set(Array.from({ length: 40 }, () => generarEjercicio(tipo, nivel, rng, ctx()).opciones.filter(o => o.sprite).length));
    assert.deepEqual([...cuenta('detalle')], [4], `detalle nivel ${nivel}`);
    assert.deepEqual([...cuenta('nohay')], [4], `nohay nivel ${nivel}`);
  }
});

test('cuanto varía el número en todos los niveles (no siempre "dos")', () => {
  for (let nivel = 1; nivel <= 8; nivel++) {
    const rng = crearRng(50 + nivel);
    const numeros = new Set(Array.from({ length: 60 }, () => generarEjercicio('cuanto', nivel, rng, ctx()).cantidad));
    assert.ok(numeros.size >= 3, `nivel ${nivel}: ${[...numeros]}`);
  }
});

test('el vocabulario sale aunque la frase fija "Toca lo que oyes" ya haya salido', () => {
  const ronda = armarRonda(6, ctx({ frasesRecientes: ['Toca lo que oyes', 'palabra:biblioteca'] }), crearRng(3));
  const palabras = ronda.filter(e => e.tipo === 'palabra');
  assert.ok(palabras.length >= 1, 'sin ejercicios de vocabulario');
  palabras.forEach(e => assert.equal(e.claveRepeticion, 'palabra:' + e.palabraClave));
  palabras.forEach(e => assert.notEqual(e.palabraClave, 'biblioteca'));
});
