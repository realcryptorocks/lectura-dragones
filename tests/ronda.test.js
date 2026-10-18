import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarRonda, tiposPermitidos } from '../js/generador/ronda.js';
import { crearRng } from '../js/util/rng.js';

const ctx = (extra = {}) => ({ conVoz: true, vocabulario: [], frasesRecientes: [], ...extra });

test('nivel 2 no trae mentiroso ni orden', () => {
  const tipos = tiposPermitidos(2, true, true);
  assert.ok(!tipos.includes('mentiroso'));
  assert.ok(!tipos.includes('orden'));
  assert.ok(tipos.includes('detalle'));
  const ronda = armarRonda(2, ctx({ vocabulario: ['casa'] }), crearRng(1));
  ronda.forEach(e => assert.ok(!['mentiroso', 'orden'].includes(e.tipo), e.tipo));
});

test('nivel 4 ya permite mentiroso y orden', () => {
  const tipos = tiposPermitidos(4, true, false);
  assert.ok(tipos.includes('mentiroso'));
  assert.ok(tipos.includes('orden'));
});

test('sin voz no salen tipos que la necesiten', () => {
  const tipos = tiposPermitidos(8, false, true);
  assert.ok(!tipos.includes('mentiroso'));
  assert.ok(!tipos.includes('palabra'));
  assert.ok(tipos.includes('nombre'));
  const ronda = armarRonda(8, ctx({ conVoz: false, vocabulario: ['casa'] }), crearRng(2));
  assert.equal(ronda.length, 12);
  ronda.forEach(e => assert.equal(e.voz, null, e.tipo));
});

test('sin vocabulario no sale palabra', () => {
  assert.ok(!tiposPermitidos(8, true, false).includes('palabra'));
});

test('12 ejercicios, frases únicas, al menos 4 tipos distintos', () => {
  for (let s = 1; s <= 10; s++) {
    const ronda = armarRonda(8, ctx(), crearRng(s));
    assert.equal(ronda.length, 12);
    assert.equal(new Set(ronda.map(e => e.frase)).size, 12);
    assert.ok(new Set(ronda.map(e => e.tipo)).size >= 4);
  }
});

test('no repite frases de frasesRecientes', () => {
  const previa = armarRonda(3, ctx(), crearRng(5));
  const recientes = previa.map(e => e.frase);
  const ronda = armarRonda(3, ctx({ frasesRecientes: recientes }), crearRng(5));
  ronda.forEach(e => assert.ok(!recientes.includes(e.frase), e.frase));
});

test('la posición de la correcta nunca se repite 3 veces seguidas', () => {
  for (let s = 1; s <= 30; s++) {
    const ronda = armarRonda(8, ctx(), crearRng(s));
    let seguidas = 1;
    let anterior = null;
    for (const e of ronda) {
      if (e.correcta.length !== 1 || e.correcta[0].startsWith('cualquiera')) { anterior = null; seguidas = 1; continue; }
      const pos = e.opciones.findIndex(o => o.id === e.correcta[0]);
      if (pos === anterior) seguidas++; else seguidas = 1;
      assert.ok(seguidas < 3, `semilla ${s}: posición ${pos} tres veces`);
      anterior = pos;
    }
  }
});

test('como mucho 2 ejercicios de vocabulario', () => {
  for (let s = 1; s <= 10; s++) {
    const ronda = armarRonda(8, ctx({ vocabulario: ['casa', 'mesa'] }), crearRng(s));
    assert.ok(ronda.filter(e => e.tipo === 'palabra').length <= 2);
  }
});
