import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rarezaDe, casillasCamino, legendariosDe } from '../js/camino.js';

test('rareza por posición en el camino', () => {
  assert.equal(rarezaDe(1), 'comun');
  assert.equal(rarezaDe(4), 'raro');
  assert.equal(rarezaDe(20), 'raro');
  assert.equal(rarezaDe(21), 'legendario');
  assert.equal(rarezaDe(25), 'raro');
  assert.equal(rarezaDe(42), 'legendario');
  assert.equal(rarezaDe(22), 'comun');
});

test('casillasCamino sitúa el huevo en su camino', () => {
  const c = casillasCamino(23);
  assert.equal(c.posicion, 2);
  assert.equal(c.camino, 2);
  assert.equal(c.casillas.length, 21);
  assert.equal(c.casillas[0].hecha, true);
  assert.equal(c.casillas[1].hecha, false);
  assert.equal(c.casillas[20].rareza, 'legendario');
  assert.equal(casillasCamino(1).camino, 1);
  assert.equal(casillasCamino(21).posicion, 21);
});

test('legendariosDe saca los dragones legendarios', () => {
  const huevos = [
    { numero: 1, nombre: 'Nepo', rareza: 'comun', fecha: '2026-10-18' },
    { numero: 21, nombre: 'Zaftín', rareza: 'legendario', fecha: '2026-11-07' },
  ];
  assert.deepEqual(legendariosDe(huevos), [{ nombre: 'Zaftín', fecha: '2026-11-07' }]);
});
