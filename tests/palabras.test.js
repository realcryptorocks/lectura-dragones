import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLORES, RASGOS, LUGARES, NUMEROS, CRIATURAS } from '../js/bancos/palabras.js';
import { permitida } from '../js/grafias.js';

const todosLosTextos = () => [
  ...COLORES.map(c => c.texto),
  ...Object.values(RASGOS).flatMap(r => [r.con, r.sin]),
  ...LUGARES.map(l => l.texto),
  ...NUMEROS.map(n => n.texto),
  ...Object.values(CRIATURAS).map(c => c.texto),
];

test('todos los textos del banco son minúsculas sin espacios sobrantes', () => {
  for (const t of todosLosTextos()) {
    assert.equal(t, t.trim());
    assert.equal(t, t.toLowerCase());
  }
});

test('hay 6 colores con hex y al menos 2 de nivel 1', () => {
  assert.equal(COLORES.length, 6);
  COLORES.forEach(c => assert.match(c.hex, /^#[0-9a-f]{6}$/i));
  assert.ok(COLORES.filter(c => permitida(c.texto, 1)).length >= 2);
});

test('hay 6 lugares con preposición y al menos 2 de nivel 1', () => {
  assert.equal(LUGARES.length, 6);
  LUGARES.forEach(l => assert.ok(l.preposicion.startsWith('en '), l.id));
  assert.ok(LUGARES.filter(l => permitida(l.texto, 1)).length >= 2);
});

test('rasgos: manchas, alas, cuernos y tamaño con texto con/sin', () => {
  assert.deepEqual(Object.keys(RASGOS).sort(), ['alas', 'cuernos', 'manchas', 'tamano']);
  assert.equal(RASGOS.manchas.con, 'con manchas');
  assert.equal(RASGOS.manchas.sin, 'sin manchas');
  assert.equal(RASGOS.tamano.con, 'grande');
  assert.equal(RASGOS.tamano.sin, 'pequeño');
});

test('números del uno al seis', () => {
  assert.deepEqual(NUMEROS.map(n => n.n), [1, 2, 3, 4, 5, 6]);
  assert.equal(NUMEROS[2].texto, 'tres');
});

test('criaturas huevo y dragón', () => {
  assert.equal(CRIATURAS.huevo.texto, 'huevo');
  assert.equal(CRIATURAS.dragon.texto, 'dragón');
});
