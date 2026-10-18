import { crearEstado } from './estado.js';
import { legendariosDe } from './camino.js';
import { vozDisponible } from './voz.js';
import { hoy } from './dia.js';

const estado = crearEstado(localStorage);
estado.cargar();

const $ = id => document.getElementById(id);

const NOMBRES_TIPO = {
  detalle: 'detalle (rasgos)', negacion: 'negación (NO)', nohay: 'aquí no está', orden: 'orden (primero/luego)',
  nombre: 'nombres inventados', palabra: 'palabras de los deberes', mentiroso: 'dragón mentiroso', cuanto: 'cuántos',
};

// Una palabra "dudosa" tiene pinta de error de escritura: sin vocal, muy corta,
// tres letras iguales seguidas o una q sin u. El juego no la corrige: avisa.
function dudosa(p) {
  return p.length < 2 || !/[aeiouáéíóúü]/.test(p) || /(.)\1\1/.test(p) || /q(?!u)/.test(p);
}

// ---------- PIN ----------
$('pin-form').addEventListener('submit', ev => {
  ev.preventDefault();
  if ($('pin-input').value === estado.datos.pin) {
    $('pin-zona').hidden = true;
    $('contenido').hidden = false;
    pintar();
  } else {
    $('pin-error').hidden = false;
    $('pin-input').value = '';
  }
});

// ---------- contenido ----------
function lista(el, pares, formato) {
  el.innerHTML = '';
  if (!pares.length) { el.innerHTML = '<li class="vacio">Nada todavía.</li>'; return; }
  for (const [k, v] of pares) {
    const li = document.createElement('li');
    li.textContent = formato(k, v);
    el.append(li);
  }
}

function ordenados(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 15);
}

async function pintar() {
  const d = estado.datos;
  const est = d.estadisticas;
  const minutos = Math.round(est.segundosJugados / 60);
  $('resumen').innerHTML = [
    ['Huevos eclosionados', d.huevos.length],
    ['Minutos jugados', minutos],
    ['Trampas cazadas', est.trampasCazadas],
    ['Nivel interno', `${d.nivel} / 8`],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  lista($('palabras-dificiles'), ordenados(est.palabras), (k, v) => `${k} — ${v} ${v === 1 ? 'fallo' : 'fallos'}`);
  lista($('tipos-dificiles'), ordenados(est.tipos), (k, v) => `${NOMBRES_TIPO[k] || k} — ${v} ${v === 1 ? 'fallo' : 'fallos'}`);

  $('vocabulario').value = d.vocabulario.join('\n');

  const leg = legendariosDe(d.huevos);
  $('legendarios').innerHTML = leg.length
    ? leg.map(l => `<li><strong>${l.nombre}</strong> (${l.fecha}) · <code>python tools/legendario_stl.py ${l.nombre}</code></li>`).join('')
    : '<li class="vacio">Todavía ninguno. Llega con el huevo 21.</li>';

  $('aviso-voz').hidden = await vozDisponible();
}

$('guardar-vocabulario').addEventListener('click', () => {
  const palabras = estado.fijarVocabulario($('vocabulario').value);
  $('vocabulario').value = palabras.join('\n');
  const dudosas = palabras.filter(dudosa);
  $('vocabulario-resultado').textContent = palabras.length
    ? `${palabras.length} palabras guardadas.` + (dudosas.length ? ` Revisa la ortografía de: ${dudosas.join(', ')}.` : '')
    : 'Sin palabras.';
});

$('exportar').addEventListener('click', () => {
  const blob = new Blob([estado.exportar()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cria-dragones-${hoy()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importar').addEventListener('change', async ev => {
  const archivo = ev.target.files[0];
  if (!archivo) return;
  const r = estado.importar(await archivo.text());
  $('importar-resultado').textContent = r.ok ? 'Progreso importado.' : `No se ha importado: ${r.error}.`;
  $('importar-resultado').classList.toggle('error', !r.ok);
  if (r.ok) pintar();
  ev.target.value = '';
});

$('pin-nuevo-form').addEventListener('submit', ev => {
  ev.preventDefault();
  const pin = $('pin-nuevo').value;
  if (!/^\d{4}$/.test(pin)) { $('pin-nuevo-resultado').textContent = 'Tienen que ser 4 dígitos.'; return; }
  estado.fijarPin(pin);
  $('pin-nuevo').value = '';
  $('pin-nuevo-resultado').textContent = 'PIN cambiado.';
});
