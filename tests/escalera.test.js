import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nivelTrasRonda, nivelEnCalibracion } from '../js/escalera.js';

test('80% sube, 50% mantiene, 40% baja', () => {
  assert.equal(nivelTrasRonda(3, 8, 10), 4);
  assert.equal(nivelTrasRonda(3, 5, 10), 3);
  assert.equal(nivelTrasRonda(3, 4, 10), 2);
});

test('acotado entre 1 y 8', () => {
  assert.equal(nivelTrasRonda(8, 10, 10), 8);
  assert.equal(nivelTrasRonda(1, 0, 10), 1);
});

test('sin ejercicios no cambia', () => assert.equal(nivelTrasRonda(4, 0, 0), 4));

test('calibración sube cada 2 aciertos seguidos', () => {
  assert.equal(nivelEnCalibracion(1, 1), 1);
  assert.equal(nivelEnCalibracion(1, 2), 2);
  assert.equal(nivelEnCalibracion(1, 3), 2);
  assert.equal(nivelEnCalibracion(1, 4), 3);
  assert.equal(nivelEnCalibracion(7, 6), 8);
});
