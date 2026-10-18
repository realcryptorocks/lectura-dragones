import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grafiasDe, nivelMinimo, permitida } from '../js/grafias.js';

test('casa es c/qu, nivel 3', () => {
  assert.ok(grafiasDe('casa').has('cq'));
  assert.equal(nivelMinimo('casa'), 3);
});

test('queso y quiso son c/qu', () => {
  assert.ok(grafiasDe('queso').has('cq'));
  assert.ok(grafiasDe('quiso').has('cq'));
});

test('gato y guerra son g/gu, nivel 4', () => {
  assert.equal(nivelMinimo('gato'), 4);
  assert.equal(nivelMinimo('guerra'), 4);
});

test('jamón es j/g, nivel 5', () => assert.equal(nivelMinimo('jamón'), 5));

test('verde es b/v, nivel 6', () => assert.equal(nivelMinimo('verde'), 6));

test('girar tiene ge/gi y j/g, nivel 7', () => {
  assert.ok(grafiasDe('girar').has('gegi'));
  assert.ok(grafiasDe('girar').has('jg'));
  assert.equal(nivelMinimo('girar'), 7);
});

test('dragón es grupo consonántico, nivel 7', () => {
  assert.ok(grafiasDe('dragón').has('grupo'));
  assert.equal(nivelMinimo('dragón'), 7);
});

test('nido no tiene grafías difíciles, nivel 1', () => {
  assert.equal(grafiasDe('nido').size, 0);
  assert.equal(nivelMinimo('nido'), 1);
});

test('amarillo es nivel 1 (ll no es grupo)', () => assert.equal(nivelMinimo('amarillo'), 1));

test('permitida compara con el nivel', () => {
  assert.ok(permitida('casa', 3));
  assert.ok(!permitida('casa', 2));
  assert.ok(permitida('nido', 1));
});

test('acepta mayúsculas', () => assert.equal(nivelMinimo('Casa'), 3));
