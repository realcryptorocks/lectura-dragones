import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearEstado, ESTADO_INICIAL } from '../js/estado.js';

function almacenMemoria(inicial = null) {
  let valor = inicial;
  return { getItem: () => valor, setItem: (_, v) => { valor = v; }, leer: () => valor };
}

const fecha = (s, h = 12) => new Date(`${s}T${String(h).padStart(2, '0')}:00:00`);
const ejercicio = (extra = {}) => ({ tipo: 'detalle', frase: 'Toca el huevo azul', palabraClave: 'azul', ...extra });

test('arranca limpio con almacén vacío o corrupto', () => {
  for (const inicial of [null, '{rota', '[]', '"x"']) {
    const e = crearEstado(almacenMemoria(inicial), () => fecha('2026-10-18'));
    e.cargar();
    assert.equal(e.datos.nivel, 1);
    assert.deepEqual(e.datos.huevos, []);
    assert.equal(e.datos.pin, '2026');
  }
});

test('huevoDeHoy crea el huevo con la fecha de hoy y meta 8', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  const h = e.huevoDeHoy();
  assert.equal(h.fecha, '2026-10-18');
  assert.equal(h.numero, 1);
  assert.equal(h.meta, 8);
  assert.equal(h.aciertos, 0);
});

test('la ronda empezada ayer sigue siendo la activa hoy', () => {
  let ahora = fecha('2026-10-18', 23);
  const e = crearEstado(almacenMemoria(), () => ahora);
  e.cargar();
  e.huevoDeHoy();
  e.registrarRespuesta(ejercicio(), { acierto: true, primeraVez: true, usoPista: false });
  ahora = fecha('2026-10-19', 0);
  const h = e.huevoDeHoy();
  assert.equal(h.fecha, '2026-10-18');
  assert.equal(h.aciertos, 1);
});

test('tras eclosionar hoy no hay huevo hasta mañana', () => {
  let ahora = fecha('2026-10-18');
  const e = crearEstado(almacenMemoria(), () => ahora);
  e.cargar();
  e.huevoDeHoy();
  e.eclosionar('Brulok', 'comun');
  assert.equal(e.huevoDeHoy(), null);
  ahora = fecha('2026-10-19');
  const h = e.huevoDeHoy();
  assert.equal(h.numero, 2);
  assert.equal(h.fecha, '2026-10-19');
  assert.equal(e.datos.huevos.length, 1);
  assert.equal(e.datos.huevos[0].nombre, 'Brulok');
});

test('un fallo sube la meta; solo el primer fallo de cada frase; máximo 12', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  e.huevoDeHoy();
  e.registrarRespuesta(ejercicio({ frase: 'a' }), { acierto: false, primeraVez: true, usoPista: false });
  assert.equal(e.huevoDeHoy().meta, 9);
  e.registrarRespuesta(ejercicio({ frase: 'a' }), { acierto: false, primeraVez: false, usoPista: false });
  assert.equal(e.huevoDeHoy().meta, 9);
  for (let i = 0; i < 10; i++) e.registrarRespuesta(ejercicio({ frase: 'f' + i }), { acierto: false, primeraVez: true, usoPista: false });
  assert.equal(e.huevoDeHoy().meta, 12);
});

test('registrarRespuesta acumula estadísticas y pistas', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  e.huevoDeHoy();
  e.registrarRespuesta(ejercicio(), { acierto: false, primeraVez: true, usoPista: false });
  e.registrarRespuesta(ejercicio(), { acierto: true, primeraVez: false, usoPista: true });
  assert.equal(e.datos.estadisticas.palabras.azul, 1);
  assert.equal(e.datos.estadisticas.tipos.detalle, 1);
  assert.equal(e.datos.estadisticas.trampasCazadas, 2);
  assert.equal(e.huevoDeHoy().aciertos, 1);
});

test('eclosionar recalcula el nivel: calibración el primer día, escalera después', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  e.huevoDeHoy();
  for (let i = 0; i < 8; i++) e.registrarRespuesta(ejercicio({ frase: 'f' + i }), { acierto: true, primeraVez: true, usoPista: false });
  e.eclosionar('Nepo', 'comun');
  assert.equal(e.datos.calibrado, true);
  assert.equal(e.datos.nivel, 5); // 8 aciertos seguidos desde 1 → +4
});

test('eclosionar con 50% de aciertos a la primera mantiene el nivel tras calibrar', () => {
  const e = crearEstado(almacenMemoria(JSON.stringify({ ...ESTADO_INICIAL, nivel: 4, calibrado: true })), () => fecha('2026-10-18'));
  e.cargar();
  e.huevoDeHoy();
  for (let i = 0; i < 4; i++) e.registrarRespuesta(ejercicio({ frase: 'f' + i }), { acierto: true, primeraVez: true, usoPista: false });
  for (let i = 0; i < 4; i++) {
    e.registrarRespuesta(ejercicio({ frase: 'g' + i }), { acierto: false, primeraVez: true, usoPista: false });
    e.registrarRespuesta(ejercicio({ frase: 'g' + i }), { acierto: true, primeraVez: false, usoPista: false });
  }
  e.eclosionar('Lima', 'comun');
  assert.equal(e.datos.nivel, 4);
});

test('frasesRecientes olvida las de hace 6 días', () => {
  let ahora = fecha('2026-10-18');
  const e = crearEstado(almacenMemoria(), () => ahora);
  e.cargar();
  e.huevoDeHoy();
  e.registrarRespuesta(ejercicio({ frase: 'vieja' }), { acierto: true, primeraVez: true, usoPista: false });
  ahora = fecha('2026-10-22');
  e.registrarRespuesta(ejercicio({ frase: 'nueva' }), { acierto: true, primeraVez: true, usoPista: false });
  assert.deepEqual(e.frasesRecientes().sort(), ['nueva', 'vieja']);
  ahora = fecha('2026-10-24');
  assert.deepEqual(e.frasesRecientes(), ['nueva']);
});

test('exportar e importar conservan el estado', () => {
  const a = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  a.cargar();
  a.huevoDeHoy();
  a.fijarVocabulario('Casa\nmesa');
  a.fijarPin('1234');
  const texto = a.exportar();
  const b = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  b.cargar();
  assert.deepEqual(b.importar(texto), { ok: true });
  assert.deepEqual(b.datos.vocabulario, ['casa', 'mesa']);
  assert.equal(b.datos.pin, '1234');
  assert.equal(b.huevoDeHoy().fecha, '2026-10-18');
});

test('importar un JSON inválido no cambia el estado', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  e.fijarPin('9999');
  for (const malo of ['no es json', '{}', '{"version":99}', '[]']) {
    const r = e.importar(malo);
    assert.equal(r.ok, false, malo);
    assert.ok(r.error);
    assert.equal(e.datos.pin, '9999');
  }
});

test('guardar escribe en el almacén', () => {
  const alm = almacenMemoria();
  const e = crearEstado(alm, () => fecha('2026-10-18'));
  e.cargar();
  e.fijarPin('4321');
  assert.equal(JSON.parse(alm.leer()).pin, '4321');
});

test('segundosJugados se acumulan', () => {
  const e = crearEstado(almacenMemoria(), () => fecha('2026-10-18'));
  e.cargar();
  e.sumarSegundos(90);
  e.sumarSegundos(30);
  assert.equal(e.datos.estadisticas.segundosJugados, 120);
});
