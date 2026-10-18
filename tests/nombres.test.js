import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarNombre, distractoresNombre, variantesEscritura } from '../js/generador/nombres.js';
import { permitida } from '../js/grafias.js';
import { crearRng } from '../js/util/rng.js';

test('nombre de nivel 2 no tiene grafías difíciles', () => {
  const rng = crearRng(1);
  for (let i = 0; i < 50; i++) {
    const n = generarNombre(2, rng);
    assert.ok(permitida(n.toLowerCase(), 2), n);
  }
});

test('nombre de nivel 6 nunca lleva ge/gi ni qu', () => {
  const rng = crearRng(2);
  for (let i = 0; i < 100; i++) assert.doesNotMatch(generarNombre(6, rng).toLowerCase(), /ge|gi|qu/);
});

test('nombre empieza por mayúscula y tiene 4-8 letras', () => {
  const rng = crearRng(5);
  for (let i = 0; i < 50; i++) {
    const n = generarNombre(5, rng);
    assert.match(n, /^[A-ZÑ][a-zñáéíóú]{3,7}$/, n);
  }
});

test('distractores: dos, distintos del nombre y entre sí, longitud parecida', () => {
  const rng = crearRng(11);
  for (let i = 0; i < 50; i++) {
    const nombre = generarNombre(5, rng);
    const d = distractoresNombre(nombre, 5, rng);
    assert.equal(d.length, 2);
    assert.notEqual(d[0], nombre);
    assert.notEqual(d[1], nombre);
    assert.notEqual(d[0], d[1]);
    d.forEach(x => assert.ok(Math.abs(x.length - nombre.length) <= 1, `${nombre} → ${x}`));
    d.forEach(x => assert.match(x, /^[A-ZÑ]/));
  }
});

test('en 60 nombres de nivel 5 hay al menos 55 distintos', () => {
  const rng = crearRng(3);
  const set = new Set();
  for (let i = 0; i < 60; i++) set.add(generarNombre(5, rng));
  assert.ok(set.size >= 55, String(set.size));
});

test('variantesEscritura devuelve 2 palabras distintas de la original y entre sí', () => {
  const rng = crearRng(4);
  for (const palabra of ['biblioteca', 'casa', 'niño', 'ventana']) {
    const v = variantesEscritura(palabra, rng);
    assert.equal(v.length, 2);
    assert.notEqual(v[0], palabra);
    assert.notEqual(v[1], palabra);
    assert.notEqual(v[0], v[1]);
  }
});
