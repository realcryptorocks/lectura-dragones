import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svgCriatura, svgLugar } from '../js/sprites.js';
import { LUGARES, COLORES } from '../js/bancos/palabras.js';

const base = { tipo: 'huevo', color: 'azul', manchas: false, alas: false, cuernos: false, tamano: 'grande' };

test('el cuerpo lleva el hex del color', () => {
  const hex = COLORES.find(c => c.id === 'azul').hex;
  assert.ok(svgCriatura(base).includes(`fill="${hex}"`));
  assert.match(svgCriatura(base), /^<svg[^>]*viewBox="0 0 200 200"/);
});

test('manchas, alas y cuernos solo cuando se piden', () => {
  for (const capa of ['manchas', 'alas', 'cuernos']) {
    assert.ok(svgCriatura({ ...base, [capa]: true }).includes(`data-capa="${capa}"`), capa);
    assert.ok(!svgCriatura({ ...base, [capa]: false }).includes(`data-capa="${capa}"`), capa);
  }
});

test('el pequeño se dibuja a escala 0.65', () => {
  assert.ok(svgCriatura({ ...base, tamano: 'pequeno' }).includes('scale(0.65)'));
  assert.ok(!svgCriatura(base).includes('scale(0.65)'));
});

test('el dragón y el huevo son dibujos distintos', () => {
  assert.notEqual(svgCriatura(base), svgCriatura({ ...base, tipo: 'dragon' }));
});

test('cada lugar devuelve un svg', () => {
  LUGARES.forEach(l => assert.match(svgLugar(l.id), /^<svg/, l.id));
});

test('un lugar desconocido lanza error', () => {
  assert.throws(() => svgLugar('castillo'));
});
