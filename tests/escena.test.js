import { test } from 'node:test';
import assert from 'node:assert/strict';
import { specAleatorio, variantesSprite, textoRasgo, RASGOS_CLAVE } from '../js/generador/escena.js';
import { permitida } from '../js/grafias.js';
import { COLORES } from '../js/bancos/palabras.js';
import { crearRng } from '../js/util/rng.js';

const CAMPOS = ['tipo', 'color', 'manchas', 'alas', 'cuernos', 'tamano'];
const difieren = (a, b) => CAMPOS.filter(c => a[c] !== b[c]);

test('variante 1 difiere solo en el rasgo clave', () => {
  const rng = crearRng(1);
  for (let i = 0; i < 100; i++) {
    const spec = specAleatorio(8, rng);
    for (const rasgo of RASGOS_CLAVE) {
      const [v1] = variantesSprite(spec, rasgo, rng);
      assert.deepEqual(difieren(spec, v1), [rasgo]);
    }
  }
});

test('variante 2 conserva el rasgo clave y cambia otro', () => {
  const rng = crearRng(2);
  for (let i = 0; i < 100; i++) {
    const spec = specAleatorio(8, rng);
    for (const rasgo of RASGOS_CLAVE) {
      const [, v2] = variantesSprite(spec, rasgo, rng);
      const d = difieren(spec, v2);
      assert.equal(d.length, 1);
      assert.notEqual(d[0], rasgo);
      assert.notEqual(d[0], 'tipo');
    }
  }
});

test('ninguna variante es igual al original ni entre sí', () => {
  const rng = crearRng(3);
  for (let i = 0; i < 100; i++) {
    const spec = specAleatorio(8, rng);
    const [v1, v2] = variantesSprite(spec, 'color', rng);
    assert.notDeepEqual(v1, spec);
    assert.notDeepEqual(v2, spec);
    assert.notDeepEqual(v1, v2);
  }
});

test('el color de la variante está permitido en el nivel', () => {
  const rng = crearRng(4);
  for (let i = 0; i < 100; i++) {
    const spec = specAleatorio(1, rng);
    const [v1] = variantesSprite(spec, 'color', rng, 1);
    const texto = COLORES.find(c => c.id === v1.color).texto;
    assert.ok(permitida(texto, 1), texto);
  }
});

test('specAleatorio nivel 1 nunca usa colores de nivel alto', () => {
  const rng = crearRng(5);
  for (let i = 0; i < 100; i++) {
    const s = specAleatorio(1, rng);
    const texto = COLORES.find(c => c.id === s.color).texto;
    assert.ok(permitida(texto, 1), texto);
    assert.ok(['huevo', 'dragon'].includes(s.tipo));
    assert.ok(['grande', 'pequeno'].includes(s.tamano));
  }
});

test('textoRasgo describe el rasgo del spec', () => {
  const spec = { tipo: 'huevo', color: 'rojo', manchas: true, alas: false, cuernos: true, tamano: 'pequeno' };
  assert.equal(textoRasgo(spec, 'color'), 'rojo');
  assert.equal(textoRasgo(spec, 'manchas'), 'con manchas');
  assert.equal(textoRasgo(spec, 'alas'), 'sin alas');
  assert.equal(textoRasgo(spec, 'cuernos'), 'con cuernos');
  assert.equal(textoRasgo(spec, 'tamano'), 'pequeño');
});
