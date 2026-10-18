import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claveDia, hoy } from '../js/dia.js';

test('claveDia usa hora local', () => {
  assert.equal(claveDia(new Date(2026, 9, 18, 23, 59)), '2026-10-18');
  assert.equal(claveDia(new Date(2026, 0, 5, 0, 0)), '2026-01-05');
});

test('hoy devuelve la clave de ahora', () => {
  assert.equal(hoy(), claveDia(new Date()));
});
