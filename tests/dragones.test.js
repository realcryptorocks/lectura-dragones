import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svgDragon, rasgosDeDragon, ESPECIES } from '../js/dragones.js';
import { generarNombre } from '../js/generador/nombres.js';
import { crearRng } from '../js/util/rng.js';

test('el mismo nombre da siempre el mismo dragón', () => {
  assert.equal(svgDragon('Brulok'), svgDragon('Brulok'));
  assert.deepEqual(rasgosDeDragon('Zaftín'), rasgosDeDragon('Zaftín'));
});

test('60 nombres dan al menos 50 combinaciones distintas de especie, color y patrón', () => {
  const rng = crearRng(1);
  const combos = new Set();
  for (let i = 0; i < 60; i++) {
    const r = rasgosDeDragon(generarNombre(6, rng));
    combos.add(`${r.especie}|${r.color.id}|${r.patron}|${r.cuernos}|${r.cola}`);
    assert.ok(ESPECIES.includes(r.especie));
  }
  assert.ok(combos.size >= 50, String(combos.size));
});

test('todas las especies aparecen entre 100 nombres', () => {
  const rng = crearRng(2);
  const vistas = new Set();
  for (let i = 0; i < 100; i++) vistas.add(rasgosDeDragon(generarNombre(5, rng)).especie);
  assert.deepEqual([...vistas].sort(), [...ESPECIES].sort());
});

test('el raro lleva alas, cresta de pinchos y cuernos curvos', () => {
  const r = rasgosDeDragon('Gorvix', 'raro');
  assert.equal(r.alas, 'si');
  assert.equal(r.cresta, 'pinchos');
  assert.equal(r.cuernos, 'curvos');
});

test('el legendario es de oro, con corona y aura con chispas', () => {
  const r = rasgosDeDragon('Aurelión', 'legendario');
  assert.equal(r.color.id, 'oro');
  assert.equal(r.cuernos, 'corona');
  const svg = svgDragon('Aurelión', 'legendario');
  assert.ok(svg.includes('class="chispa"'));
  assert.ok(svg.includes('aura-legendaria'));
  assert.ok(!svgDragon('Aurelión', 'comun').includes('chispa'));
});

test('el svg es un documento svg con ids únicos por nombre', () => {
  const a = svgDragon('Nepo'), b = svgDragon('Lima');
  assert.match(a, /^<svg[^>]*viewBox="0 0 240 240"/);
  const idA = a.match(/radialGradient id="([^"]+)"/)[1];
  assert.ok(!b.includes(`id="${idA}"`));
});
