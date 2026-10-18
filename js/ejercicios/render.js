import { svgCriatura, svgLugar } from '../sprites.js';
import { LUGARES } from '../bancos/palabras.js';

// Pinta un ejercicio y recoge la respuesta. No juzga: eso lo hace app.js.
// callbacks: { alResponder(ids), alPedirPista(), alRepetirVoz() }
export function pintarEjercicio(contenedor, ejercicio, callbacks, opciones = {}) {
  contenedor.innerHTML = '';
  const { conVoz } = opciones;
  // Un "pop" al tocar cualquier botón del ejercicio (la respuesta suena aparte).
  if (callbacks.alTocar) contenedor.addEventListener('click', ev => { if (ev.target.closest('button')) callbacks.alTocar(); });

  // --- cabecera: frase + altavoz ---
  const cabecera = el('div', 'cabecera-frase');
  const frase = el('p', 'frase');
  frase.textContent = ejercicio.frase;
  if (ejercicio.voz && conVoz) {
    const altavoz = boton('icono', '🔊', 'Escuchar otra vez');
    altavoz.addEventListener('click', () => callbacks.alRepetirVoz && callbacks.alRepetirVoz());
    cabecera.append(altavoz);
  }
  cabecera.append(frase);
  contenedor.append(cabecera);

  // --- escena fija (mentiroso) ---
  if (ejercicio.escena) {
    const escena = el('div', 'escena');
    escena.innerHTML = svgLugar(ejercicio.escena.lugar) + svgCriatura(ejercicio.escena.sprite);
    contenedor.append(escena);
  }

  // --- opciones según el tipo ---
  const pie = el('div', 'pie-ejercicio');
  const pista = boton('icono boton-pista', '👂', 'Pista');
  pista.hidden = true;
  pista.addEventListener('click', () => callbacks.alPedirPista && callbacks.alPedirPista());

  if (ejercicio.tipo === 'mentiroso') {
    const zona = el('div', 'palabras');
    for (const o of ejercicio.opciones) {
      const b = boton('palabra', o.texto);
      b.addEventListener('click', () => callbacks.alResponder([o.id]));
      zona.append(b);
    }
    contenedor.append(zona);
  } else if (ejercicio.tipo === 'cuanto') {
    const zona = el('div', 'opciones');
    const elegidas = new Set();
    for (const o of ejercicio.opciones) {
      const b = boton('opcion', '');
      b.innerHTML = svgCriatura(o.sprite);
      b.addEventListener('click', () => {
        if (elegidas.has(o.id)) { elegidas.delete(o.id); b.classList.remove('seleccionada'); }
        else { elegidas.add(o.id); b.classList.add('seleccionada'); }
      });
      zona.append(b);
    }
    contenedor.append(zona);
    const listo = boton('icono grande boton-listo', '✓', 'Listo');
    listo.addEventListener('click', () => callbacks.alResponder([...elegidas]));
    pie.append(listo);
  } else if (ejercicio.tipo === 'orden') {
    const zona = el('div', 'opciones');
    const secuencia = [];
    for (const o of ejercicio.opciones) {
      const b = boton('opcion lugar', '');
      const nombre = LUGARES.find(l => l.id === o.lugar);
      b.innerHTML = svgLugar(o.lugar) + `<span class="etiqueta-lugar">${nombre ? nombre.texto : ''}</span>`;
      b.addEventListener('click', () => {
        if (secuencia.includes(o.id)) return;
        secuencia.push(o.id);
        b.classList.add('seleccionada');
        const esperado = ejercicio.correcta[secuencia.length - 1];
        // Falla en el primer toque equivocado; acierta al completar la secuencia.
        if (o.id !== esperado || secuencia.length === ejercicio.correcta.length) callbacks.alResponder([...secuencia]);
      });
      zona.append(b);
    }
    contenedor.append(zona);
  } else {
    // detalle, negacion, nohay, nombre, palabra
    const zona = el('div', 'opciones');
    for (const o of ejercicio.opciones) {
      const b = boton(o.id === 'nohay' ? 'opcion nohay' : 'opcion', '');
      if (o.sprite) b.innerHTML = svgCriatura(o.sprite);
      else b.textContent = o.id === 'nohay' ? `✋ ${o.texto}` : o.texto;
      b.addEventListener('click', () => callbacks.alResponder([o.id]));
      zona.append(b);
    }
    contenedor.append(zona);
  }

  pie.append(pista);
  contenedor.append(pie);

  return {
    mostrarPista() { pista.hidden = false; },
    iluminar(palabra) { frase.innerHTML = resaltar(ejercicio.frase, palabra, 'pista-luz'); },
    destruir() { contenedor.innerHTML = ''; },
  };
}

// Devuelve la frase con la palabra (o grupo de palabras) clave envuelta.
export function resaltar(frase, palabra, clase = '') {
  const escapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^\\p{L}])(${escapada})(?=[^\\p{L}]|$)`, 'iu');
  const seguro = escapar(frase);
  if (!re.test(seguro)) return seguro;
  const etiqueta = clase ? `<mark class="${clase}">` : '<mark>';
  return seguro.replace(re, `$1${etiqueta}$2</mark>`);
}

function escapar(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function el(tag, clase) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  return n;
}

function boton(clase, texto, aria) {
  const b = el('button', clase);
  b.type = 'button';
  b.textContent = texto;
  if (aria) b.setAttribute('aria-label', aria);
  return b;
}
