# Cría de dragones — plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una web estática para tablet Android en la que un niño de 7 años incuba un huevo al día leyendo frases cortas con trampa, colecciona dragones de nombre inventado y a los 21 huevos desbloquea un dragón legendario que se imprime en 3D con su nombre.

**Architecture:** HTML + CSS + JavaScript en módulos ES sin bundler ni servidor; toda la lógica (bancos, generador de ejercicios, escalera adaptativa, estado, camino) vive en módulos puros sin DOM, probados con `node --test`; la interfaz (`app.js`, `render.js`, `panel.js`) solo pinta y llama a esos módulos. El progreso se guarda en `localStorage` con exportación a archivo. El STL del legendario lo genera un script Python aparte (`tools/legendario_stl.py`) a partir del nombre del dragón.

**Tech Stack:** HTML5, CSS, JavaScript ES2022 (módulos nativos), `node:test` (Node 24), SVG inline por capas para sprites, Web Speech API (`speechSynthesis`) para la voz, service worker + manifest para "añadir a pantalla de inicio" y uso sin conexión. Python 3.13 con `trimesh`, `manifold3d`, `shapely`, `matplotlib` para el STL. Publicación en GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-18-cria-de-dragones-design.md`

## Global Constraints

- Web estática: nada de servidor, cuentas ni dependencias de red en tiempo de juego. Funciona sin conexión una vez cargada.
- Objetivo: Chrome en tablet Android, táctil, horizontal y vertical.
- Todo el texto en español de España; letra de imprenta, minúsculas salvo inicio de frase y nombres propios.
- Ningún ejercicio se puede acertar mirando la imagen: la frase decide siempre.
- Nunca "incorrecto", ni vidas, ni pérdida de progreso. El fallo se llama "trampa" y enseña la palabra clave.
- Un huevo por día como máximo; la sesión termina sola al eclosionar.
- Huevo: meta 8 aciertos; cada fallo a la primera en una frase suma 1 a la meta; meta máxima 12.
- Tiempo mínimo de lectura antes de aceptar respuesta: `0.25 s × número de palabras de la frase`.
- Pista (pronunciar solo la palabra clave): aparece tras 2 fallos en la misma frase o 20 s sin responder. Cuenta como trampa cazada, no como fallo.
- Escalera de nivel 1–8, invisible. Sube con ≥80 % de aciertos a la primera en la ronda; baja con <50 %. Primer día: calibración, sube un peldaño cada 2 aciertos a la primera dentro de la ronda.
- Grafías eje: nivel 1–2 sin c/qu, g/gu/gü, j/g, b/v ni ge/gi; nivel 3 añade c/qu; 4 añade g/gu; 5 añade j/g; 6 añade b/v; 7–8 mezclan todo, grupos consonánticos (tr, pl, br, cl, fr…) y frases de 6–8 palabras. Nombres inventados sin ge/gi ni qu hasta el nivel 7.
- Tipos `mentiroso` y `orden` solo a partir del nivel 4.
- Posición de la opción correcta aleatoria; nunca 3 veces seguidas en la misma posición. Una frase no vuelve a salir hasta pasados 5 días.
- Camino de 21 casillas. Huevos 4, 8, 12, 16 y 20 son raros; el 21 es legendario; al eclosionarlo empieza un camino nuevo con otro legendario.
- Bancos escritos a mano, dimensionados para ≥6 semanas: ≥150 plantillas de frase y ≥60 nombres generables sin repetir.
- Panel del padre protegido con PIN de 4 dígitos (por defecto `2026`, cambiable en el panel).
- Pieza 3D: dragón/huevo sobre peana con el nombre en relieve, ≤100 mm en su lado mayor, malla cerrada (watertight), imprimible en FDM sin soportes complicados.

## Review Focus

1. **La medianoche cae en mitad de una ronda.** El huevo que se empezó debe terminar aunque la fecha haya cambiado; el huevo del día siguiente aparece al volver a abrir. Test en Tarea 8 (`estado.test.js: 'la ronda empezada ayer sigue siendo la activa hoy'`).
2. **Almacenamiento vacío, borrado o corrupto.** Si `localStorage` devuelve `null` o JSON inválido, el juego arranca con estado nuevo sin romperse, y la importación de un archivo mal formado se rechaza con mensaje sin tocar el estado actual. Test en Tarea 8.
3. **Vocabulario del padre sucio.** Líneas vacías, espacios, mayúsculas, palabras repetidas o con números: se normalizan a minúsculas sin espacios, se descartan vacías y no alfabéticas, y nunca generan un ejercicio sin distractores válidos. Test en Tarea 6 (`frases.test.js`) y Tarea 12.
4. **Tablet sin voz en español.** La ronda sigue teniendo 8 ejercicios, ninguno de tipo `mentiroso` ni `palabra`, y la `nombre` funciona (es solo texto). Test en Tarea 7 (`ronda.test.js: 'sin voz no salen tipos que la necesiten'`).
5. **Nombres con ñ y acentos en el STL** (Zaftín, Ñorak). El texto se graba correctamente y el nombre de archivo no contiene caracteres problemáticos. Test en Tarea 13.

---

## Estructura de archivos

```
lectura-dragones/
  index.html                 juego (una sola página, pantallas por secciones)
  panel.html                 panel del padre
  manifest.webmanifest       nombre, iconos, pantalla completa
  sw.js                      service worker: caché de todos los archivos
  css/juego.css              estilos del juego (letra grande, fondo limpio, táctil)
  css/panel.css
  js/util/rng.js             crearRng(semilla) → función () → [0,1); elegir(lista, rng); barajar(lista, rng)
  js/dia.js                  claveDia(fecha) → 'AAAA-MM-DD'; hoy()
  js/grafias.js              grafiasDe(palabra) → Set; permitida(palabra, nivel) → boolean; nivelMinimo(palabra)
  js/bancos/palabras.js      criaturas, colores, rasgos, lugares, números en letras, con grafías implícitas
  js/bancos/plantillas.js    plantillas de frase por tipo, con nivel mínimo y huecos
  js/bancos/silabas.js       sílabas para nombres inventados, por nivel
  js/generador/nombres.js    generarNombre(nivel, rng); distractoresNombre(nombre, nivel, rng); variantesEscritura(palabra, rng)
  js/generador/escena.js     variantesSprite(spec, rasgoClave, rng); specAleatorio(nivel, rng)
  js/generador/frases.js     generarEjercicio(tipo, nivel, rng, contexto) → Ejercicio
  js/generador/ronda.js      armarRonda(nivel, contexto, rng) → Ejercicio[]; tiposPermitidos(nivel, conVoz)
  js/escalera.js             nivelTrasRonda(nivel, aciertosPrimera, total); nivelEnCalibracion(nivel, aciertosPrimeraSeguidos)
  js/estado.js               crearEstado(almacen) → { cargar, guardar, exportar, importar, huevoDeHoy, registrarRespuesta, ... }
  js/camino.js               rarezaDe(numeroHuevo); casillasCamino(numeroHuevo)
  js/sprites.js              svgCriatura(spec) → string SVG; svgLugar(nombre) → string SVG
  js/voz.js                  vozDisponible() → Promise<boolean>; decir(texto) → Promise<void>
  js/ejercicios/render.js    pintarEjercicio(contenedor, ejercicio, callbacks) → { destruir }
  js/app.js                  arranque, pantallas, bucle del día
  js/panel.js                panel del padre
  tests/*.test.js            node --test
  tools/legendario_stl.py    python tools/legendario_stl.py <nombre> [--salida ruta]
  tools/requirements.txt
  README.md
```

### Modelo de datos (compartido por todas las tareas)

```js
// Spec de una criatura/objeto para el sprite y los distractores
// { tipo: 'dragon'|'huevo', color: 'rojo'|'azul'|'verde'|'amarillo'|'morado'|'naranja',
//   manchas: boolean, alas: boolean, cuernos: boolean, tamano: 'grande'|'pequeno' }
// Un lugar: 'cueva'|'nido'|'rio'|'roca'|'arbol'|'cama'

// Ejercicio
// { tipo: 'detalle'|'negacion'|'orden'|'nohay'|'nombre'|'palabra'|'mentiroso'|'cuanto',
//   frase: string,                 // texto que lee el niño
//   voz: string|null,              // lo que dice el dragón en voz (mentiroso, palabra); null si no hay
//   opciones: Opcion[],            // 3-4 (más la de 'nohay' cuando aplica)
//   correcta: string[],            // ids de opción; en 'orden' es la secuencia; en 'nohay' es ['nohay']
//   palabraClave: string,          // la palabra que marca la trampa
//   nivel: number }
// Opcion = { id: string, texto?: string, sprite?: SpecCriatura, lugar?: string }
// En 'mentiroso' las opciones son las palabras de la frase escrita, id = índice en texto.

// Contexto que recibe el generador
// { conVoz: boolean, vocabulario: string[], frasesRecientes: string[] }
```

---

### Tarea 1: Esqueleto del proyecto y día

**Files:**
- Create: `package.json`, `README.md`, `.gitignore`, `js/util/rng.js`, `js/dia.js`, `tests/rng.test.js`, `tests/dia.test.js`

**Interfaces:**
- Produces: `crearRng(semilla: number): () => number` (mulberry32, determinista); `elegir(lista, rng)`; `barajar(lista, rng)` (copia barajada). `claveDia(fecha: Date): string` → `'AAAA-MM-DD'` en hora local; `hoy(): string`.

- [ ] **Step 1: `git init` en `C:\Users\Usuario\lectura-dragones`, crear `package.json`** con `"type": "module"`, `"scripts": { "test": "node --test tests/", "servir": "python -m http.server 8765" }`, sin dependencias. `.gitignore` con `node_modules/`, `tools/__pycache__/`, `salida/`.

- [ ] **Step 2: Test fallando**

```js
// tests/rng.test.js
test('misma semilla, misma secuencia', () => {
  const a = crearRng(7), b = crearRng(7);
  assert.equal(a(), b()); assert.equal(a(), b());
});
test('barajar no muta y conserva elementos', () => { ... });
// tests/dia.test.js
test('claveDia usa hora local', () => {
  assert.equal(claveDia(new Date(2026, 9, 18, 23, 59)), '2026-10-18');
});
```

- [ ] **Step 3: Ejecutar `npm test`** → FAIL (módulos no existen).
- [ ] **Step 4: Implementar `js/util/rng.js` y `js/dia.js`.**
- [ ] **Step 5: `npm test`** → PASS.
- [ ] **Step 6: Commit** `chore: esqueleto del proyecto, rng determinista y clave de día` (y añadir los dos documentos de `docs/`).

---

### Tarea 2: Grafías y bancos de palabras

**Files:**
- Create: `js/grafias.js`, `js/bancos/palabras.js`, `tests/grafias.test.js`, `tests/palabras.test.js`

**Interfaces:**
- Produces: `grafiasDe(palabra): Set<'cq'|'gg'|'jg'|'bv'|'gegi'|'grupo'>`; `nivelMinimo(palabra): number` (1 si ninguna grafía; cq→3, gg→4, jg→5, bv→6, gegi/grupo→7; el máximo de las presentes); `permitida(palabra, nivel): boolean` = `nivelMinimo(palabra) <= nivel`.
- Produces en `palabras.js`: `COLORES` (6 ids con `{id, texto, hex}`), `RASGOS` (`manchas`, `alas`, `cuernos`, `tamano` con textos: "con manchas"/"sin manchas", "con alas"/"sin alas", "con cuernos"/"sin cuernos", "grande"/"pequeño"), `LUGARES` (6 `{id, texto, preposicion}` p. ej. `en la cueva`), `NUMEROS` (`{n: 1..6, texto}`), `CRIATURAS` (`dragon`→"dragón", `huevo`→"huevo").

Reglas de `grafiasDe`: `cq` si contiene `ca|co|cu|que|qui`; `gg` si `ga|go|gu|gue|gui|güe|güi`; `jg` si `j` o `ge|gi`; `gegi` si `ge|gi`; `bv` si `b` o `v`; `grupo` si consonante+`l|r` seguida de vocal (`tr, pl, br, cl, fr, gr, dr, pr, bl, fl, cr, gl`).

- [ ] **Step 1: Tests fallando**

```js
test('casa es c/qu, nivel 3', () => { assert.ok(grafiasDe('casa').has('cq')); assert.equal(nivelMinimo('casa'), 3); });
test('dragón es grupo, nivel 7', () => assert.equal(nivelMinimo('dragón'), 7));
test('nido no tiene grafías difíciles', () => assert.equal(nivelMinimo('nido'), 1));
test('verde es b/v, nivel 6', () => assert.equal(nivelMinimo('verde'), 6));
test('girar tiene ge/gi y j/g', () => assert.equal(nivelMinimo('girar'), 7));
test('todos los textos del banco son minúsculas sin espacios finales', ...);
test('hay al menos 2 colores de nivel 1 para que el peldaño 1 tenga frases', () =>
  assert.ok(COLORES.filter(c => permitida(c.texto, 1)).length >= 2));
```

Nota: "dragón" es nivel 7 por el grupo `dr`; por eso el banco incluye también criaturas de nivel bajo o el sprite `dragon` se nombra "dragón" solo desde nivel 7 y antes "huevo"/"nido". Decisión: en niveles 1–6 las frases con imagen usan `huevo` y lugares; `dragón` como palabra entra en el nivel 7. Los colores de nivel 1: rojo, azul (sin `cq/gg/jg/bv`: rojo tiene `j` → nivel 5; azul nivel 1; amarillo nivel 1 — `ll` no es grupo; morado nivel 1; naranja nivel 5; verde nivel 6). Hay ≥2 de nivel 1 (azul, amarillo, morado).

- [ ] **Step 2: `npm test`** → FAIL.
- [ ] **Step 3: Implementar `grafias.js` y rellenar `palabras.js`.**
- [ ] **Step 4: `npm test`** → PASS.
- [ ] **Step 5: Commit** `feat: grafías por nivel y banco de palabras`.

---

### Tarea 3: Nombres inventados y variantes de escritura

**Files:**
- Create: `js/bancos/silabas.js`, `js/generador/nombres.js`, `tests/nombres.test.js`

**Interfaces:**
- Consumes: `grafiasDe`, `permitida`, `crearRng`, `elegir`.
- Produces: `generarNombre(nivel, rng): string` (2–3 sílabas, primera en mayúscula, cumple `permitida(nombre, nivel)`; nunca `ge/gi/qu` si nivel < 7); `distractoresNombre(nombre, nivel, rng): string[]` (2 variantes distintas del nombre y entre sí, cada una con exactamente una sustitución de la tabla de confusiones adecuada al nivel: `b↔v`, `c↔qu`, `g↔gu`, `j↔g`, `r↔l`, `m↔n`, intercambio de dos letras adyacentes); `variantesEscritura(palabra, rng): string[]` (lo mismo para una palabra cualquiera del padre, sin filtro de nivel).
- `silabas.js` exporta `SILABAS` agrupadas por nivel mínimo.

- [ ] **Step 1: Tests fallando**

```js
test('nombre de nivel 2 no tiene grafías difíciles', () => {
  const rng = crearRng(1);
  for (let i = 0; i < 50; i++) assert.ok(permitida(generarNombre(2, rng).toLowerCase(), 2));
});
test('nombre empieza por mayúscula y tiene 4-8 letras', ...);
test('distractores: dos, distintos del nombre y entre sí, misma longitud ±1', ...);
test('en 60 nombres de nivel 5 hay al menos 55 distintos', ...);
test('variantesEscritura("biblioteca") devuelve 2 palabras distintas de la original', ...);
```

- [ ] **Step 2: `npm test`** → FAIL.
- [ ] **Step 3: Implementar.** Para las sustituciones: localizar en el nombre las posiciones donde aplica cada confusión; si no hay ninguna aplicable, usar el intercambio de letras adyacentes.
- [ ] **Step 4: `npm test`** → PASS.
- [ ] **Step 5: Commit** `feat: nombres inventados con distractores por confusión`.

---

### Tarea 4: Sprites SVG por capas

**Files:**
- Create: `js/sprites.js`, `tests/sprites.test.js`

**Interfaces:**
- Consumes: `COLORES` (hex).
- Produces: `svgCriatura(spec): string` (SVG completo con `viewBox="0 0 200 200"`, cuerpo relleno con el hex del color, capas opcionales con `data-capa="manchas|alas|cuernos"`, escala 1 para `grande` y 0.65 para `pequeno`); `svgLugar(id): string` (cueva, nido, rio, roca, arbol, cama; siluetas simples reconocibles).

- [ ] **Step 1: Tests fallando**

```js
test('color del cuerpo', () => assert.match(svgCriatura({tipo:'huevo', color:'azul', manchas:false, alas:false, cuernos:false, tamano:'grande'}), /fill="#/));
test('manchas solo cuando se piden', () => {
  assert.ok(svgCriatura({...base, manchas:true}).includes('data-capa="manchas"'));
  assert.ok(!svgCriatura({...base, manchas:false}).includes('data-capa="manchas"'));
});
test('cada lugar devuelve un svg', () => LUGARES.forEach(l => assert.match(svgLugar(l.id), /^<svg/)));
```

- [ ] **Step 2: FAIL. Step 3: Implementar** (formas con `<ellipse>`, `<path>`, `<circle>`; el huevo es un `<path>` ovoide; el dragón, cuerpo ovoide + cabeza + cola; alas y cuernos como paths encima). **Step 4: PASS.**
- [ ] **Step 5: Comprobar a ojo:** archivo temporal en el scratchpad con los 2 tipos × 6 colores × rasgos, abrir en el navegador integrado y mirar que un huevo rojo liso y uno rojo con manchas se distinguen a 2 metros, y que alas/cuernos se ven en pequeño.
- [ ] **Step 6: Commit** `feat: sprites SVG de huevos, dragones y lugares`.

---

### Tarea 5: Variantes de escena (distractores con imagen)

**Files:**
- Create: `js/generador/escena.js`, `tests/escena.test.js`

**Interfaces:**
- Consumes: `COLORES`, `RASGOS`, `permitida`, `rng`.
- Produces: `specAleatorio(nivel, rng): SpecCriatura` (color permitido en el nivel; tipo `huevo` si nivel < 7, si no al azar); `variantesSprite(spec, rasgoClave, rng): SpecCriatura[]` → exactamente 2: una igual al spec salvo `rasgoClave` (la "trampa visual": comparte todo lo demás) y otra que conserva `rasgoClave` pero cambia otro rasgo visible; ninguna igual al spec; `rasgoClave ∈ 'color'|'manchas'|'alas'|'cuernos'|'tamano'`; `textoRasgo(spec, rasgoClave): string` → "rojo", "con manchas", "sin alas", "grande"…

- [ ] **Step 1: Tests fallando**

```js
test('variante 1 difiere solo en el rasgo clave', () => { ... difiere en exactamente 1 campo y es rasgoClave });
test('variante 2 conserva el rasgo clave y cambia otro', ...);
test('ninguna variante es igual al original', ...);
test('specAleatorio nivel 1 nunca usa colores de nivel alto', () => { 100 veces; permitida(texto color, 1) });
```

- [ ] **Step 2: FAIL. Step 3: Implementar. Step 4: PASS.**
- [ ] **Step 5: Commit** `feat: variantes de escena que obligan a leer el rasgo`.

---

### Tarea 6: Plantillas y generador de ejercicios

**Files:**
- Create: `js/bancos/plantillas.js`, `js/generador/frases.js`, `tests/frases.test.js`

**Interfaces:**
- Consumes: Tareas 2, 3, 5.
- Produces: `generarEjercicio(tipo, nivel, rng, contexto): Ejercicio` (ver modelo). `PLANTILLAS` en `plantillas.js`: lista de `{ tipo, nivelMin, texto }` con huecos `{criatura} {color} {rasgo} {lugar} {numero} {nombre} {palabra}`; ≥150 en total repartidas: detalle ≥40, negacion ≥25, orden ≥20, nohay ≥20, cuanto ≥20, mentiroso ≥25 (frases completas con escena de 1 criatura + lugar); `nombre` y `palabra` no usan plantilla. `normalizarVocabulario(texto: string): string[]` (minúsculas, sin espacios, solo letras incl. ñ y acentos, sin duplicados, descarta vacías).

Reglas por tipo:
- `detalle`: spec + `variantesSprite`; frase "Toca el {criatura} {rasgoClave}" u otras plantillas; `correcta = [id del spec]`; `palabraClave = textoRasgo`.
- `negacion`: 3–4 sprites; exactamente uno **no** cumple el rasgo; `palabraClave = 'no'`.
- `orden`: 3 lugares/criaturas tocables; `correcta` = 2 ids en orden; `palabraClave` = "primero" o "luego".
- `nohay`: como detalle pero ninguna opción cumple la frase; se añade `{id:'nohay', texto:'aquí no está'}`; `correcta=['nohay']`. En `detalle` y `negacion` la opción `nohay` también aparece (como distractor), para que su presencia no delate el tipo.
- `nombre`: `frase = 'Tu dragón se llama ' + nombre` (nivel ≥7) o `'Se llama ' + nombre` (niveles bajos; "dragón" es nivel 7); opciones = nombre + 2 distractores en texto; `correcta = [nombre]`.
- `palabra` (requiere `conVoz` y vocabulario): `voz = palabra`; `frase = '¿Cómo se escribe lo que digo?'`; opciones = palabra + `variantesEscritura`.
- `mentiroso` (requiere `conVoz`): `voz` = frase original; `frase` = la misma con una palabra sustituida por otra del banco de la misma categoría (o del vocabulario); opciones = palabras de la frase escrita; `correcta = [índice cambiado]`.
- `cuanto`: `n ∈ 1..6` en letras, escena con `m ≠ n` criaturas (3–6); `correcta` = ids de exactamente n a tocar (cualquier subconjunto de tamaño n vale: se expresa como `correcta: ['cualquiera:' + n]`); `palabraClave = texto del número`.
- Todos: `permitida(cada palabra de la frase, nivel)` salvo las palabras funcionales de la plantilla (que están marcadas por `nivelMin`), y el ejercicio no puede estar en `contexto.frasesRecientes`.

- [ ] **Step 1: Tests fallando** (uno por tipo + transversales)

```js
test('detalle: la correcta es la única que cumple el rasgo clave', ...);
test('negacion: exactamente una opción no cumple', ...);
test('nohay: ninguna opción cumple y correcta es nohay', ...);
test('nombre: 3 opciones distintas y la correcta es la de la frase', ...);
test('mentiroso: frase escrita difiere de la voz en exactamente una palabra, que es la correcta', ...);
test('cuanto: el número de criaturas no coincide con el número pedido', ...);
test('palabra: usa el vocabulario y las opciones son 3 escrituras distintas', ...);
test('todas las palabras de un ejercicio de nivel 2 están permitidas en nivel 2', ...);
test('normalizarVocabulario limpia espacios, mayúsculas, duplicados y basura', () =>
  assert.deepEqual(normalizarVocabulario(' Biblioteca\n\n casa  \ncasa\n123\nniño'), ['biblioteca','casa','niño']));
test('hay al menos 150 plantillas y cada tipo cumple su mínimo', ...);
test('ningún ejercicio repite una frase de frasesRecientes', ...);
```

- [ ] **Step 2: FAIL. Step 3: Implementar `frases.js` y escribir las plantillas** (a mano, revisando ortografía). **Step 4: PASS.**
- [ ] **Step 5: Commit** `feat: generador de ejercicios con 8 tipos de trampa y banco de plantillas`.

---

### Tarea 7: Armar la ronda

**Files:**
- Create: `js/generador/ronda.js`, `tests/ronda.test.js`

**Interfaces:**
- Consumes: `generarEjercicio`, `barajar`.
- Produces: `tiposPermitidos(nivel, conVoz, hayVocabulario): string[]` (sin `mentiroso`/`orden` si nivel < 4; sin `mentiroso`/`palabra` si `!conVoz`; sin `palabra` si no hay vocabulario); `armarRonda(nivel, contexto, rng, cantidad = 12): Ejercicio[]` → `cantidad` ejercicios (se generan 12 porque la meta puede subir hasta 12), con al menos 4 tipos distintos cuando el nivel lo permite, con la posición de la opción correcta barajada y **nunca 3 veces seguidas igual** (para los tipos con una sola correcta), con 2 ejercicios del vocabulario como máximo por ronda, y sin frases repetidas dentro de la ronda ni de `frasesRecientes`.

- [ ] **Step 1: Tests fallando**

```js
test('nivel 2 no trae mentiroso ni orden', ...);
test('sin voz no salen tipos que la necesiten', ...);
test('12 ejercicios, frases únicas', ...);
test('la posición de la correcta nunca se repite 3 veces seguidas', () => { 30 rondas con semillas distintas });
test('como mucho 2 ejercicios de vocabulario', ...);
```

- [ ] **Step 2: FAIL. Step 3: Implementar. Step 4: PASS.**
- [ ] **Step 5: Commit** `feat: armado de rondas con reglas antiadivinación`.

---

### Tarea 8: Escalera y estado persistente

**Files:**
- Create: `js/escalera.js`, `js/estado.js`, `tests/escalera.test.js`, `tests/estado.test.js`

**Interfaces:**
- Produces `escalera.js`: `nivelTrasRonda(nivel, aciertosPrimera, total): number` (≥0.8 → +1, <0.5 → −1, acotado 1–8); `nivelEnCalibracion(nivel, aciertosPrimeraSeguidos): number` (+1 por cada 2 aciertos seguidos, acotado 8).
- Produces `estado.js`: `crearEstado(almacen: {getItem, setItem}, reloj = () => new Date())` → objeto con:
  - `cargar(): void` (si no hay nada o el JSON falla → estado inicial `{version:1, nivel:1, calibrado:false, huevos:[], huevoActual:null, estadisticas:{palabras:{}, tipos:{}, trampasCazadas:0, segundosJugados:0}, vocabulario:[], frasesRecientes:[], pin:'2026', vozActivada:true}`)
  - `huevoDeHoy(): {fecha, numero, aciertos, meta, fallosPorFrase, eclosionado} | null` (devuelve `huevoActual` si existe y no está eclosionado **aunque su fecha sea anterior**; crea uno nuevo con la fecha de hoy si no hay o si el actual eclosionó en una fecha anterior a hoy; devuelve `null` si el de hoy ya eclosionó)
  - `registrarRespuesta(ejercicio, {acierto, primeraVez, usoPista}): void` (acierto suma 1; primer fallo en una frase sube `meta` hasta 12; pista suma a `trampasCazadas`; fallos cuentan en `estadisticas.palabras[palabraClave]` y `estadisticas.tipos[tipo]`; frase a `frasesRecientes` con fecha)
  - `eclosionar(nombreDragon, rareza): void` (marca el huevo, lo añade a `huevos`, recalcula nivel con `nivelTrasRonda` o calibración, marca `calibrado`)
  - `frasesRecientes(): string[]` (solo las de los últimos 5 días)
  - `exportar(): string` (JSON) / `importar(texto): {ok, error?}` (valida `version` y campos; si falla no toca nada)
  - `guardar()`, `fijarVocabulario(texto)`, `fijarPin(pin)`.

- [ ] **Step 1: Tests fallando**

```js
test('80% sube, 50% mantiene, 40% baja, acotado', ...);
test('calibración sube cada 2 aciertos seguidos', ...);
test('arranca limpio con almacén vacío o corrupto', () => { almacén devuelve null; otro devuelve '{rota' });
test('la ronda empezada ayer sigue siendo la activa hoy', () => { reloj a 2026-10-18 23:50 crea huevo; reloj a 2026-10-19 00:10 → huevoDeHoy().fecha === '2026-10-18' });
test('tras eclosionar hoy no hay huevo hasta mañana', ...);
test('un fallo sube la meta hasta 12 como máximo', ...);
test('importar un JSON inválido no cambia el estado', ...);
test('frasesRecientes olvida las de hace 6 días', ...);
```

- [ ] **Step 2: FAIL. Step 3: Implementar. Step 4: PASS.**
- [ ] **Step 5: Commit** `feat: escalera adaptativa y estado persistente con exportación`.

---

### Tarea 9: Camino y rareza

**Files:**
- Create: `js/camino.js`, `tests/camino.test.js`

**Interfaces:**
- Produces: `rarezaDe(numeroHuevo): 'comun'|'raro'|'legendario'` (posición dentro del camino: `((n-1) % 21) + 1`; 4, 8, 12, 16, 20 → raro; 21 → legendario); `casillasCamino(numeroHuevoActual): {posicion: 1..21, camino: number, casillas: [{n, rareza, hecha}]}`; `legendariosDe(huevos): {nombre, fecha}[]`.

- [ ] **Step 1: Tests fallando** (`rarezaDe(21) === 'legendario'`, `rarezaDe(42) === 'legendario'`, `rarezaDe(25) === 'raro'`, `casillasCamino(23).posicion === 2`, `camino === 2`).
- [ ] **Step 2: FAIL. Step 3: Implementar. Step 4: PASS.**
- [ ] **Step 5: Commit** `feat: camino de 21 casillas con raros y legendario`.

---

### Tarea 10: Interfaz del juego

**Files:**
- Create: `index.html`, `css/juego.css`, `js/ejercicios/render.js`, `js/app.js`

**Interfaces:**
- Consumes: todo lo anterior. `pintarEjercicio(contenedor, ejercicio, {alResponder(ids: string[]), alPedirPista()}, {conVoz}) → {marcarTrampa(palabraClave), mostrarPista(), destruir()}`.
- Pantallas en `index.html` (secciones con `data-pantalla`): `inicio` (huevo del día o dragón dormido "hasta mañana", botón de icono Dragonario y Camino, icono engranaje → `panel.html`), `ejercicio`, `trampa` (frase grande con `palabraClave` resaltada y "¡Casi! La trampa estaba aquí"), `eclosion` (animación, nombre del dragón en grande), `dragonario`, `camino`.

Comportamiento que implementa `app.js`:
- Arranque: `cargar()`, `vozDisponible()` (Tarea 11; hasta entonces `false`), `huevoDeHoy()`; si `null` → pantalla "dormido".
- Ronda: `armarRonda(nivel, contexto, rng)` con `rng = crearRng(semilla)` donde la semilla sale de la fecha + número de huevo (y se puede forzar con `?semilla=N` para pruebas; `?fecha=AAAA-MM-DD` fuerza el reloj). Se consumen ejercicios hasta `aciertos >= meta`.
- Por ejercicio: cronómetro; respuestas antes de `0.25 s × palabras` → se ignora y se muestra "léelo otra vez" sin contar; fallo → `registrarRespuesta` + pantalla `trampa` 2,5 s → mismo ejercicio otra vez; 2 fallos o 20 s → botón pista (oreja): `decir(palabraClave)` y la palabra se ilumina; `usoPista: true` al acertar.
- `cuanto`: las criaturas se seleccionan y hay botón "listo"; acierto si se tocaron exactamente n.
- `orden`: acierta si la secuencia de toques coincide; falla en el primer toque equivocado.
- `mentiroso`: botón altavoz para repetir la voz; se toca la palabra.
- Eclosión: `generarNombre(nivel, rng)`, `eclosionar(nombre, rarezaDe(numero))`; si legendario → ceremonia: "Este dragón es tan especial que puede salir de la tablet" y aviso al panel.
- Progreso del huevo: grietas visibles (`data-grietas="0..8"` en el SVG, clases CSS que destapan paths).
- Estilo: fondo oscuro tipo cueva con poca saturación, letra ≥ 40 px en frases, botones ≥ 96 px, fuente `Atkinson Hyperlegible` o `Andika` **descargada en `css/fuentes/`** (sin CDN, debe funcionar sin red); minúsculas con "a" y "g" de una planta.

- [ ] **Step 1: Escribir `index.html`, `css/juego.css`, `render.js`, `app.js`.**
- [ ] **Step 2: Servir (`npm run servir`) y abrir en el navegador integrado `http://localhost:8765/?semilla=1&fecha=2026-10-18`** emulando tablet (`resize_window` 800×1280 y 1280×800). Comprobar: se ve el huevo; una ronda completa de 8 aciertos eclosiona; un fallo muestra la trampa con la palabra resaltada y repite; pulsar antes de tiempo muestra "léelo otra vez"; tras eclosionar, recargar muestra el dragón dormido; con `?fecha=2026-10-19` aparece huevo nuevo con número 2.
- [ ] **Step 3: Comprobar el modelo de la medianoche en la UI:** empezar con `?fecha=2026-10-18`, acertar 3, recargar con `?fecha=2026-10-19` → sigue el mismo huevo con 3 aciertos.
- [ ] **Step 4: `npm test`** sigue en PASS (la UI no rompe los módulos).
- [ ] **Step 5: Commit** `feat: interfaz del juego: huevo del día, ronda, trampas, eclosión, dragonario y camino`.

---

### Tarea 11: Voz

**Files:**
- Create: `js/voz.js`
- Modify: `js/app.js` (sustituir el `false` provisional por `vozDisponible()`; botón altavoz; pista)

**Interfaces:**
- Produces: `vozDisponible(): Promise<boolean>` (espera a `voiceschanged` hasta 1,5 s; `true` si hay alguna voz con `lang` que empiece por `es`); `decir(texto): Promise<void>` (voz `es-ES` si existe, si no la primera `es-*`; `rate 0.9`; resuelve al terminar o a los 6 s).

- [ ] **Step 1: Implementar `voz.js` y conectarlo.**
- [ ] **Step 2: Probar en el navegador integrado** con `?semilla=3&fecha=2026-10-20` tras forzar nivel 4 (en consola: estado con `nivel:4` importado) → aparece un `mentiroso`, la voz suena, la palabra cambiada es la correcta. Probar también desactivando la voz (`?sinvoz=1` fuerza `conVoz=false`) → ninguna ronda trae `mentiroso`/`palabra`.
- [ ] **Step 3: Commit** `feat: voz del dragón con speechSynthesis y detección de voz en español`.

---

### Tarea 12: Panel del padre

**Files:**
- Create: `panel.html`, `css/panel.css`, `js/panel.js`

**Interfaces:**
- Consumes: `crearEstado`, `normalizarVocabulario`, `vozDisponible`, `legendariosDe`.
- Pantalla con PIN (4 dígitos, compara con `estado.pin`); dentro: palabras y tipos ordenados por fallos; minutos jugados, huevos, trampas cazadas, nivel interno; `textarea` de vocabulario (al guardar muestra la lista normalizada y avisa "palabra dudosa" si una palabra no está en el banco, sin corregirla); exportar (descarga `cria-dragones-AAAA-MM-DD.json`) e importar (archivo; muestra el error si lo hay); aviso si no hay voz en español con el texto exacto: "La tablet no tiene voz en español. Ajustes → Sistema → Idiomas → Síntesis de voz → instalar voz en español. Mientras tanto el juego funciona sin los ejercicios de voz."; cambio de PIN; sección **Legendarios** con cada nombre y el comando `python tools/legendario_stl.py <Nombre>`.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Probar en el navegador integrado:** PIN erróneo no entra; vocabulario ` Biblioteca\n\ncasa\n123` queda `biblioteca, casa`; exportar e importar el mismo archivo mantiene el estado; importar un `.txt` cualquiera muestra error y no cambia nada.
- [ ] **Step 3: Commit** `feat: panel del padre con estadísticas, vocabulario, exportación y legendarios`.

---

### Tarea 13: Pieza 3D del legendario

**Files:**
- Create: `tools/legendario_stl.py`, `tools/requirements.txt` (`trimesh`, `manifold3d`, `shapely`, `matplotlib`, `numpy`), `tests_py/test_stl.py` (pytest)

**Interfaces:**
- Produces CLI: `python tools/legendario_stl.py <nombre> [--salida ruta.stl]` → escribe `salida/dragon-<nombre-sin-acentos-minusculas>.stl` por defecto y devuelve 0. Funciones: `construir_pieza(nombre: str) -> trimesh.Trimesh`, `nombre_archivo(nombre: str) -> str`.
- Geometría: peana cilíndrica de Ø70 mm × 8 mm; sobre ella un huevo (esfera escalada 1 : 1 : 1,3, alto 60 mm) con grietas (3 surcos de 1 mm restados) y, en el frente del huevo, un **dragón en relieve** de 1,5 mm extruido desde un polígono 2D definido a mano en el script (silueta de perfil: cabeza, cuello, cuerpo, cola, ala); el nombre en relieve de 1,2 mm en el frente de la peana, fuente DejaVu Sans Bold vía `matplotlib.textpath.TextPath`, escalado para que quepa en 60 mm de ancho. Unión y restas con booleanos de `manifold3d`.

- [ ] **Step 1: Tests fallando**

```python
def test_pieza_cerrada_y_tamano():
    m = construir_pieza("Zaftín")
    assert m.is_watertight and m.volume > 0
    assert max(m.extents) <= 100
def test_nombre_archivo_sin_acentos():
    assert nombre_archivo("Zaftín") == "dragon-zaftin.stl"
    assert nombre_archivo("Ñorak") == "dragon-norak.stl"
def test_nombre_largo_cabe():
    assert max(construir_pieza("Morquelandria").extents) <= 100
```

- [ ] **Step 2: `pip install -r tools/requirements.txt`; `python -m pytest tests_py`** → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: `python -m pytest tests_py`** → PASS. Generar `salida/dragon-zaftin.stl` y renderizar una vista con `trimesh` a PNG en el scratchpad para mirarla (que el dragón se reconozca y el nombre se lea).
- [ ] **Step 5: Commit** `feat: generador STL del dragón legendario con nombre en relieve`.

---

### Tarea 14: Sin conexión y pantalla de inicio (PWA)

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `iconos/icono-192.png`, `iconos/icono-512.png` (huevo con grieta, generados desde el SVG de Tarea 4 con un script en el scratchpad)
- Modify: `index.html`, `panel.html` (enlazar manifest, registrar `sw.js`)

- [ ] **Step 1: Implementar** `sw.js` con caché por versión (`const VERSION = 'v1'`) de la lista explícita de archivos; estrategia "caché primero, red para actualizar".
- [ ] **Step 2: Probar en el navegador integrado:** cargar, luego cortar la red del servidor (`preview_stop`) y recargar → el juego sigue abriéndose.
- [ ] **Step 3: Commit** `feat: funciona sin conexión y se añade a pantalla de inicio`.

---

### Tarea 15: Publicar

**Files:**
- Modify: `README.md` (cómo jugar, cómo entrar al panel, cómo generar el STL, cómo actualizar)

- [ ] **Step 1: Crear repo `thefatherrocker-ctrl/lectura-dragones` en GitHub** (`gh repo create --public --source . --push`). Público porque GitHub Pages gratuito lo requiere; no contiene datos del niño (el progreso vive en la tablet).
- [ ] **Step 2: Activar Pages** desde la rama `main`, raíz. Esperar la URL `https://thefatherrocker-ctrl.github.io/lectura-dragones/`.
- [ ] **Step 3: Abrir la URL en el navegador integrado emulando tablet** y jugar una ronda completa con la fecha real.
- [ ] **Step 4: Commit** `docs: instrucciones de uso y despliegue`.

---

## Autorrevisión (hecha)

- **Cobertura del diseño:** bucle del día (T8, T10), trampa como villano y pantalla de trampa (T10), 7 tipos + `palabra` del vocabulario (T6), reglas transversales (T7, T10), pista (T10, T11), escalera y calibración (T8), rareza/legendario/camino nuevo (T9, T10), premio 3D (T13), panel (T12), sin voz (T7, T11, T12), medianoche (T8, T10), almacenamiento corrupto (T8), vocabulario sucio (T6, T12), offline y pantalla de inicio (T14), catalán/grafías (T2, T3). El experimento de reconocimiento de voz queda fuera a propósito (diseño: opcional).
- **Nombres consistentes:** `generarEjercicio`, `armarRonda`, `crearEstado`, `huevoDeHoy`, `registrarRespuesta`, `eclosionar`, `rarezaDe`, `vozDisponible`, `decir`, `variantesSprite`, `generarNombre`, `distractoresNombre`, `variantesEscritura`, `normalizarVocabulario` se usan con el mismo nombre en todas las tareas.
- **Proporción:** el plan fija interfaces y pruebas; los cuerpos (sprites, plantillas, CSS, polígono del dragón) quedan al constructor.
