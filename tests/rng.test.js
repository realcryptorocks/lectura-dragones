import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearRng, elegir, barajar } from '../js/util/rng.js';

test('misma semilla, misma secuencia', () => {
  const a = crearRng(7), b = crearRng(7);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test('los valores están en [0,1)', () => {
  const rng = crearRng(3);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test('barajar no muta y conserva elementos', () => {
  const lista = [1, 2, 3, 4, 5];
  const copia = barajar(lista, crearRng(1));
  assert.deepEqual(lista, [1, 2, 3, 4, 5]);
  assert.deepEqual([...copia].sort(), [1, 2, 3, 4, 5]);
});

test('elegir devuelve un elemento de la lista', () => {
  const rng = crearRng(9);
  for (let i = 0; i < 50; i++) assert.ok(['a', 'b', 'c'].includes(elegir(['a', 'b', 'c'], rng)));
});
