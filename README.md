# Cría de dragones

Juego de lectura para tablet: un huevo al día que se incuba leyendo frases cortas con trampa. Cada acierto agrieta el huevo; al eclosionar sale un dragón con nombre inventado que se guarda en el Dragonario. A los 21 huevos nace el **legendario**, que se imprime en 3D con su nombre.

- Diseño: `docs/superpowers/specs/2026-10-18-cria-de-dragones-design.md`
- Plan de construcción: `docs/superpowers/plans/2026-10-18-cria-de-dragones.md`

## Cómo se juega

La web vive en **https://realcryptorocks.github.io/lectura-dragones/** (repo `realcryptorocks/lectura-dragones`, rama `main`; cada `git push` la actualiza en un par de minutos).

1. Abre esa dirección en Chrome de la tablet y elige "Añadir a pantalla de inicio": queda como una app y funciona sin conexión.
2. Toca el huevo. Aparece una frase: léela y haz lo que dice (tocar la criatura correcta, encontrar la palabra mentirosa, elegir el nombre bien escrito…).
3. Si cae en la trampa, el juego enseña la palabra clave y repite la frase. Tras dos fallos o 20 segundos aparece la **pista** (👂): el dragón pronuncia solo esa palabra.
4. Con 8 aciertos (más uno por cada fallo, hasta 12) el huevo eclosiona y la sesión termina hasta mañana.

Iconos de arriba: 🗺️ camino de 21 huevos · 🐉 dragonario · ⚙️ panel del padre.

## Panel del padre

`panel.html` (⚙️ en el juego). PIN por defecto: **2026** (cámbialo dentro).

- Qué palabras y qué tipos de trampa le cuestan más, minutos jugados, trampas cazadas, nivel interno (1–8).
- **Vocabulario de la semana**: pega las palabras de los deberes; salen en los ejercicios de voz.
- Exportar/importar el progreso (archivo JSON) por si cambia de tablet.
- Aviso si la tablet no tiene voz en español (Ajustes → Sistema → Idiomas → Síntesis de voz).

## El dragón legendario en 3D

Cuando nazca (huevo 21), el panel muestra su nombre. En el ordenador:

```bash
pip install -r tools/requirements.txt
python tools/legendario_stl.py Zaftín
```

Deja `salida/dragon-zaftin.stl` (76 × 56 × ~60 mm, malla cerrada, sin soportes): la **figura del mismo dragón que vio en la tablet** (misma especie y rasgos: `tools/rasgos_dragon.py` calca el generador `js/dragones.js`), de pie sobre una peana con el nombre en relieve y un sol de rayos detrás. Llévalo a imprimir tal cual. Con `--rareza raro` o `--rareza comun` se puede imprimir cualquier otro dragón del Dragonario.

## Desarrollo

```bash
npm test                     # lógica del juego (node --test)
python -m pytest tests_py    # generador del STL
npm run servir               # http://localhost:8765
```

Parámetros de prueba en la URL: `?fecha=AAAA-MM-DD` (fuerza el día), `?semilla=N` (misma ronda), `?sinvoz=1`, `?debug=1` (expone `window.cria`).

Al cambiar archivos del juego, sube `VERSION` en `sw.js` para que las tablets renueven la caché.
