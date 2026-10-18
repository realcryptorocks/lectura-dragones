import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarEjercicio, normalizarVocabulario, cumpleRasgos, EXENTAS } from '../js/generador/frases.js';
import { PLANTILLAS } from '../js/bancos/plantillas.js';
import { permitida } from '../js/grafias.js';
import { crearRng } from '../js/util/rng.js';

const ctx = (extra = {}) => ({ conVoz: true, vocabulario: [], frasesRecientes: [], ...extra });
const palabrasDe = frase => frase.toLowerCase().replace(/[¿?¡!.,:]/g, '').split(/\s+/).filter(Boolean);

test('detalle: la correcta es la única opción que cumple los rasgos de la frase', () => {
  const rng = crearRng(1);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('detalle', 8, rng, ctx());
    assert.equal(e.tipo, 'detalle');
    assert.equal(e.correcta.length, 1);
    const conSprite = e.opciones.filter(o => o.sprite);
    assert.ok(conSprite.length >= 3);
    const cumplen = conSprite.filter(o => cumpleRasgos(o.sprite, e.rasgos));
    assert.equal(cumplen.length, 1, e.frase);
    assert.equal(cumplen[0].id, e.correcta[0]);
    assert.ok(e.opciones.some(o => o.id === 'nohay'));
    assert.ok(palabrasDe(e.frase).includes(e.palabraClave.split(' ').pop()), `${e.frase} / ${e.palabraClave}`);
  }
});

test('negacion: exactamente una opción no cumple el rasgo negado', () => {
  const rng = crearRng(2);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('negacion', 8, rng, ctx());
    assert.match(e.frase, /\bNO\b/);
    const conSprite = e.opciones.filter(o => o.sprite);
    const noCumplen = conSprite.filter(o => !cumpleRasgos(o.sprite, e.rasgos));
    assert.equal(noCumplen.length, 1, e.frase);
    assert.deepEqual(e.correcta, [noCumplen[0].id]);
    assert.equal(e.palabraClave, 'no');
  }
});

test('nohay: ninguna opción cumple y la correcta es nohay', () => {
  const rng = crearRng(3);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('nohay', 8, rng, ctx());
    const conSprite = e.opciones.filter(o => o.sprite);
    assert.ok(conSprite.length >= 3);
    assert.equal(conSprite.filter(o => cumpleRasgos(o.sprite, e.rasgos)).length, 0, e.frase);
    assert.deepEqual(e.correcta, ['nohay']);
  }
});

test('orden: dos ids en orden, ambos presentes en las opciones, y la frase los nombra en ese orden', () => {
  const rng = crearRng(4);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('orden', 8, rng, ctx());
    assert.equal(e.correcta.length, 2);
    assert.notEqual(e.correcta[0], e.correcta[1]);
    const ids = e.opciones.map(o => o.id);
    e.correcta.forEach(id => assert.ok(ids.includes(id)));
    assert.ok(e.opciones.length >= 3);
    const [a, b] = e.correcta.map(id => e.opciones.find(o => o.id === id).lugarTexto);
    assert.ok(e.frase.indexOf(a) < e.frase.indexOf(b), e.frase);
  }
});

test('nombre: 3 opciones de texto distintas y la correcta es la de la frase', () => {
  const rng = crearRng(5);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('nombre', 5, rng, ctx());
    assert.equal(e.opciones.length, 3);
    assert.equal(new Set(e.opciones.map(o => o.texto)).size, 3);
    const correcta = e.opciones.find(o => o.id === e.correcta[0]);
    assert.ok(e.frase.includes(correcta.texto), e.frase);
    assert.equal(e.palabraClave, correcta.texto);
  }
});

test('mentiroso: la frase escrita difiere de la voz en exactamente una palabra, que es la correcta', () => {
  const rng = crearRng(6);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('mentiroso', 8, rng, ctx());
    const voz = palabrasDe(e.voz), escrita = palabrasDe(e.frase);
    assert.equal(voz.length, escrita.length, `${e.voz} / ${e.frase}`);
    const distintas = escrita.map((p, i) => (p !== voz[i] ? i : -1)).filter(i => i >= 0);
    assert.equal(distintas.length, 1, `${e.voz} / ${e.frase}`);
    assert.deepEqual(e.correcta, [String(distintas[0])]);
    assert.equal(e.opciones.length, escrita.length);
    assert.equal(e.opciones[distintas[0]].texto.toLowerCase().replace(/[.,]/g, ''), escrita[distintas[0]]);
    assert.equal(e.palabraClave.toLowerCase(), escrita[distintas[0]]);
    assert.ok(e.escena.sprite && e.escena.lugar);
  }
});

test('cuanto: el número de criaturas no coincide con el pedido y correcta pide ese número', () => {
  const rng = crearRng(7);
  for (let i = 0; i < 100; i++) {
    const e = generarEjercicio('cuanto', 8, rng, ctx());
    const n = e.cantidad;
    assert.ok(n >= 1 && n <= 6);
    const sprites = e.opciones.filter(o => o.sprite);
    assert.notEqual(sprites.length, n);
    assert.ok(sprites.length >= 3 && sprites.length <= 6);
    assert.deepEqual(e.correcta, [`cualquiera:${n}`]);
    assert.ok(e.frase.includes(e.palabraClave));
  }
});

test('palabra: usa el vocabulario, la voz dice la palabra y hay 3 escrituras distintas', () => {
  const rng = crearRng(8);
  const e = generarEjercicio('palabra', 3, rng, ctx({ vocabulario: ['biblioteca'] }));
  assert.equal(e.voz, 'biblioteca');
  assert.equal(e.opciones.length, 3);
  assert.equal(new Set(e.opciones.map(o => o.texto)).size, 3);
  assert.equal(e.opciones.find(o => o.id === e.correcta[0]).texto, 'biblioteca');
});

test('palabra sin vocabulario lanza error', () => {
  assert.throws(() => generarEjercicio('palabra', 3, crearRng(1), ctx()));
});

test('todas las palabras de un ejercicio de nivel 2 están permitidas en nivel 2 (salvo las fijas)', () => {
  const rng = crearRng(9);
  for (const tipo of ['detalle', 'negacion', 'nohay', 'cuanto', 'nombre']) {
    for (let i = 0; i < 60; i++) {
      const e = generarEjercicio(tipo, 2, rng, ctx());
      for (const p of palabrasDe(e.frase)) {
        if (EXENTAS.has(p)) continue;
        assert.ok(permitida(p, 2), `${tipo}: "${p}" en "${e.frase}"`);
      }
    }
  }
});

test('nivel 2 no usa nombres con grafías difíciles', () => {
  const rng = crearRng(10);
  for (let i = 0; i < 30; i++) {
    const e = generarEjercicio('nombre', 2, rng, ctx());
    assert.ok(permitida(e.palabraClave, 2), e.palabraClave);
  }
});

test('normalizarVocabulario limpia espacios, mayúsculas, duplicados y basura', () => {
  assert.deepEqual(normalizarVocabulario(' Biblioteca\n\n casa  \ncasa\n123\nniño'), ['biblioteca', 'casa', 'niño']);
  assert.deepEqual(normalizarVocabulario('uno, dos; tres'), ['uno', 'dos', 'tres']);
  assert.deepEqual(normalizarVocabulario(''), []);
});

test('hay al menos 150 plantillas y cada tipo cumple su mínimo', () => {
  assert.ok(PLANTILLAS.length >= 150, String(PLANTILLAS.length));
  const minimos = { detalle: 40, negacion: 25, orden: 20, nohay: 20, cuanto: 20, mentiroso: 25 };
  for (const [tipo, min] of Object.entries(minimos)) {
    const n = PLANTILLAS.filter(p => p.tipo === tipo).length;
    assert.ok(n >= min, `${tipo}: ${n} < ${min}`);
  }
  PLANTILLAS.forEach(p => assert.ok(p.nivelMin >= 1 && p.nivelMin <= 8, p.texto));
});

test('cada tipo tiene plantillas de nivel 1', () => {
  for (const tipo of ['detalle', 'negacion', 'nohay', 'cuanto']) {
    assert.ok(PLANTILLAS.some(p => p.tipo === tipo && p.nivelMin === 1), tipo);
  }
});

test('ningún ejercicio repite una frase de frasesRecientes', () => {
  const rng = crearRng(11);
  const primera = generarEjercicio('nombre', 3, crearRng(11), ctx());
  for (let i = 0; i < 20; i++) {
    const e = generarEjercicio('nombre', 3, rng, ctx({ frasesRecientes: [primera.frase] }));
    assert.notEqual(e.frase, primera.frase);
  }
});
