"""Genera el STL del dragón legendario: una figura 3D del mismo dragón que el
niño vio en la tablet (misma especie y rasgos), de pie sobre una peana con su
nombre en relieve.

Uso:  python tools/legendario_stl.py Zaftín [--rareza legendario] [--salida ruta.stl]

Pieza: peana 76 × 56 × 8 mm; figura de unos 55 mm de alto; todo cabe en
100 mm y se imprime sin soportes (alas apoyadas en la peana, cola en el suelo).
"""

import argparse
import math
import unicodedata
from pathlib import Path

import numpy as np
import trimesh
from matplotlib.font_manager import FontProperties
from matplotlib.textpath import TextPath
from shapely.geometry import Polygon
from shapely.ops import unary_union
from trimesh.transformations import rotation_matrix

from rasgos_dragon import rasgos_de_dragon

# --- medidas (mm) ---
PEANA = (76.0, 56.0, 8.0)
FIGURA_ALTO = 54.0
FIGURA_ANCHO = 66.0
FIGURA_FONDO = 48.0
RELIEVE_TEXTO = 1.2
TEXTO_ALTO_MAX = 7.0
TEXTO_ANCHO_MAX = 64.0
TEXTO_Y = -23.5


# ---------- primitivas ----------

def _union(mallas):
    mallas = [m for m in mallas if m is not None]
    return trimesh.boolean.union(mallas, engine="manifold") if len(mallas) > 1 else mallas[0]


def _esfera(c, r, sub=3):
    e = trimesh.creation.icosphere(subdivisions=sub, radius=r)
    e.apply_translation(c)
    return e


def _elipsoide(c, rx, ry, rz, sub=3):
    e = trimesh.creation.icosphere(subdivisions=sub, radius=1.0)
    e.apply_scale((rx, ry, rz))
    e.apply_translation(c)
    return e


def _tubo(p1, p2, r):
    return trimesh.creation.cylinder(radius=r, segment=[p1, p2], sections=24)


def _cono(base, altura, r, giro_y=0.0, giro_x=0.0):
    """Cono con la base en `base` apuntando hacia +Z, inclinado si se pide."""
    c = trimesh.creation.cone(radius=r, height=altura, sections=24)
    if giro_x:
        c.apply_transform(rotation_matrix(math.radians(giro_x), (1, 0, 0)))
    if giro_y:
        c.apply_transform(rotation_matrix(math.radians(giro_y), (0, 1, 0)))
    c.apply_translation(base)
    return c


def _cadena(puntos, radios, sub=2):
    """Cadena de esferas unidas (cola, cuerpo de serpiente)."""
    mallas = []
    for i in range(len(puntos) - 1):
        mallas.append(_esfera(puntos[i], radios[i], sub))
        mallas.append(_tubo(puntos[i], puntos[i + 1], min(radios[i], radios[i + 1]) * 0.95))
    mallas.append(_esfera(puntos[-1], radios[-1], sub))
    return mallas


def _curva(p0, p1, p2, n):
    """Puntos de una curva cuadrática de Bézier."""
    p0, p1, p2 = map(np.array, (p0, p1, p2))
    return [((1 - t) ** 2) * p0 + 2 * (1 - t) * t * p1 + t * t * p2 for t in np.linspace(0, 1, n)]


# ---------- partes del dragón (x hacia delante, z hacia arriba, suelo en z=0) ----------

def _patas(xs, ys, z_cuerpo, r=4.5):
    return [_tubo((x, y, 0.0), (x, y, z_cuerpo), r) for x in xs for y in ys] + \
        [_elipsoide((x, y, 0.0), r * 1.5, r * 1.3, 2.5, 2) for x in xs for y in ys]


def _cola(origen, rasgos, largo=1.0):
    ox, oy, oz = origen
    puntos = _curva((ox, oy, oz), (ox - 16 * largo, oy + 10, 4), (ox - 30 * largo, oy - 8, 4), 14)
    radios = list(np.linspace(6.0, 2.8, 14))
    partes = _cadena(puntos, radios)
    fin = puntos[-1]
    direccion = puntos[-1] - puntos[-2]
    ang = math.degrees(math.atan2(direccion[1], direccion[0]))
    if rasgos["cola"] == "flecha":
        punta = trimesh.creation.extrude_polygon(Polygon([(0, -5), (9, 0), (0, 5)]), height=4.0)
        punta.apply_translation((0, 0, 2.0))
        punta.apply_transform(rotation_matrix(math.radians(ang), (0, 0, 1)))
        punta.apply_translation((fin[0], fin[1], 0))
        partes.append(punta)
    elif rasgos["cola"] == "bola":
        partes.append(_esfera((fin[0], fin[1], 5.0), 5.0))
    else:  # pincho
        partes.append(_cono((fin[0], fin[1], 0.0), 12.0, 3.5))
    return partes


def _alas(hombro, ancho_cuerpo, grande):
    """Dos alas de membrana (placas de 3 mm) que nacen en el hombro, suben
    hacia atrás y apoyan su punta trasera en la peana: sin soportes."""
    sx, sz = hombro
    s = 1.25 if grande else 1.0
    rel = [(0, -4), (4, 6), (-6, 18), (-16, 27), (-30, 30), (-36, 16), (-34, 2), (-26, 6), (-20, 0), (-12, 5), (-8, -8)]
    pts = []
    for dx, dz in rel:
        x, z = sx + dx * s, sz + dz * s
        pts.append((x, max(z, 0.0)))  # nada por debajo del suelo
    # La punta trasera baja hasta el suelo para apoyar.
    pts[6] = (pts[6][0], 0.0)
    forma = Polygon(pts).buffer(0)
    alas = []
    for lado in (-1, 1):
        placa = trimesh.creation.extrude_polygon(forma, height=3.0)
        placa.apply_transform(rotation_matrix(math.radians(90), (1, 0, 0)))      # al plano XZ
        placa.apply_transform(rotation_matrix(math.radians(lado * 12), (1, 0, 0)))  # abiertas hacia fuera
        placa.apply_translation((0, lado * (ancho_cuerpo * 0.7), 0))
        alas.append(placa)
    return alas


def _cuernos(cabeza, r, tipo):
    cx, cy, cz = cabeza
    top = cz + r * 0.8
    if tipo == "uno":
        return [_cono((cx, cy, top), 9, 3)]
    if tipo == "dos":
        return [_cono((cx - 2, cy - r * 0.5, top), 8, 2.6, giro_x=-15), _cono((cx - 2, cy + r * 0.5, top), 8, 2.6, giro_x=15)]
    if tipo == "curvos":
        return [_cono((cx - 3, cy - r * 0.5, top), 11, 2.8, giro_x=-30, giro_y=-25),
                _cono((cx - 3, cy + r * 0.5, top), 11, 2.8, giro_x=30, giro_y=-25)]
    if tipo == "corona":
        return [_cono((cx - 4, cy - r * 0.55, top - 1), 8, 2.6, giro_x=-20), _cono((cx + 1, cy, top), 12, 3.2),
                _cono((cx - 4, cy + r * 0.55, top - 1), 8, 2.6, giro_x=20)]
    return []


def _cresta(cabeza, r, tipo):
    cx, cy, cz = cabeza
    if tipo == "pinchos":
        return [_cono((cx - r * 0.8, cy, cz + r * 0.3), 8, 2.5, giro_y=-50), _cono((cx - r * 0.9, cy, cz - r * 0.2), 7, 2.2, giro_y=-75)]
    if tipo == "aleta":
        aleta = trimesh.creation.extrude_polygon(Polygon([(0, -2), (-10, 2), (-12, 8), (-6, 6), (0, 10)]), height=2.4)
        aleta.apply_translation((0, 0, -1.2))
        aleta.apply_transform(rotation_matrix(math.radians(90), (1, 0, 0)))
        aleta.apply_translation((cx - r * 0.6, cy, cz))
        return [aleta]
    return []


def _cabeza(c, r, rasgos):
    cx, cy, cz = c
    largo = 1.4 if rasgos["hocico"] == "largo" else 1.0
    partes = [_esfera(c, r), _elipsoide((cx + r * 0.75, cy, cz - r * 0.15), r * 0.65 * largo, r * 0.5, r * 0.4)]
    ojo = r * (0.28 if rasgos["ojos"] == "grandes" else 0.2)
    for lado in (-1, 1):
        partes.append(_esfera((cx + r * 0.35, cy + lado * r * 0.6, cz + r * 0.25), ojo, 2))
    partes += _cuernos(c, r, rasgos["cuernos"]) + _cresta(c, r, rasgos["cresta"])
    return partes


def _especie(rasgos):
    """Partes por especie, medio ancho del cuerpo y hombro (x, z) donde nacen las alas."""
    e = rasgos["especie"]
    if e == "rechoncho":
        cuerpo = [_elipsoide((0, 0, 19), 22, 18, 18)]
        cab = ((20, 0, 36), 12)
        return cuerpo + _patas((-9, 9), (-9, 9), 16) + _cola((-18, 0, 12), rasgos) + _cabeza(*cab, rasgos), 18, (2, 34)
    if e == "serpiente":
        puntos = _curva((-30, -8, 7), (-6, 14, 7), (14, -6, 8), 9) + _curva((14, -6, 8), (22, 0, 12), (26, 0, 24), 4)[1:]
        radios = list(np.linspace(7.0, 8.0, 9)) + [7.5, 6.5, 6.0]
        cuerpo = _cadena(puntos, radios)
        cab = ((30, 0, 30), 10)
        return cuerpo + _cola((-30, -8, 7), rasgos, 0.7) + _cabeza(*cab, rasgos), 12, (12, 14)
    if e == "cuellilargo":
        cuerpo = [_elipsoide((-4, 0, 16), 18, 14, 14), _tubo((8, 0, 22), (22, 0, 42), 5.5)]
        cab = ((25, 0, 46), 9)
        return cuerpo + _patas((-12, 6), (-7, 7), 14) + _cola((-20, 0, 10), rasgos) + _cabeza(*cab, rasgos), 14, (0, 28)
    if e == "murcielago":
        cuerpo = [_elipsoide((0, 0, 20), 14, 12, 18), _tubo((6, 0, 32), (12, 0, 38), 6)]
        cab = ((13, 0, 41), 11)
        return cuerpo + _patas((0,), (-7, 7), 12) + _cola((-12, 0, 10), rasgos) + _cabeza(*cab, rasgos), 12, (0, 34)
    if e == "bebe":
        cuerpo = [_elipsoide((0, 0, 13), 14, 12, 12), _tubo((4, 0, 20), (6, 0, 28), 6.5)]
        cab = ((7, 0, 35), 15)
        return cuerpo + _patas((0,), (-7, 7), 10) + _cola((-12, 0, 8), rasgos, 0.8) + _cabeza(*cab, rasgos), 12, (-2, 22)
    # acorazado
    cuerpo = [_elipsoide((0, 0, 18), 22, 17, 16)]
    placas = [_cono((x, 0, 30 - abs(x) * 0.25), 10, 4, giro_y=-20) for x in (-12, -2, 8)]
    cab = ((23, 0, 32), 11)
    return cuerpo + placas + _patas((-10, 10), (-10, 10), 15) + _cola((-20, 0, 12), rasgos) + _cabeza(*cab, rasgos), 17, (0, 30)


def figura_dragon(rasgos):
    """Figura del dragón de pie sobre z = 0, escalada a FIGURA_ALTO × ANCHO × FONDO."""
    partes, ancho, hombro = _especie(rasgos)
    if rasgos["alas"] == "si":
        partes += _alas(hombro, ancho, rasgos["rareza"] == "legendario")
    figura = _union(partes)
    # Apoyar en el suelo y escalar para que quepa (la cola y las alas ya tocan z=0).
    figura.apply_translation((0, 0, -figura.bounds[0][2]))
    ex, ey, ez = figura.extents
    factor = min(FIGURA_ALTO / ez, FIGURA_ANCHO / ex, FIGURA_FONDO / ey)
    figura.apply_scale(factor)
    centro = figura.bounds.mean(axis=0)
    figura.apply_translation((-centro[0], -centro[1], -figura.bounds[0][2]))
    return figura


# ---------- peana y texto ----------

def _peana():
    caja = trimesh.creation.box(extents=PEANA)
    caja.apply_translation((0, 0, PEANA[2] / 2))
    return caja


def poligonos_texto(nombre):
    """Contornos del texto como polígonos con sus huecos (regla par-impar)."""
    fuente = FontProperties(family="DejaVu Sans", weight="bold")
    ruta = TextPath((0, 0), nombre, size=10, prop=fuente)
    contornos = [Polygon(p).buffer(0) for p in ruta.to_polygons() if len(p) >= 3]
    contornos = [c for c in contornos if not c.is_empty and c.area > 0]
    contornos.sort(key=lambda c: c.area, reverse=True)
    profundidad, padre = [], []
    for i, c in enumerate(contornos):
        contenedores = [j for j in range(i) if contornos[j].contains(c.representative_point())]
        profundidad.append(len(contenedores))
        padre.append(min(contenedores, key=lambda j: contornos[j].area) if contenedores else None)
    piezas = []
    for i, c in enumerate(contornos):
        if profundidad[i] % 2:
            continue
        huecos = [contornos[k].exterior.coords for k in range(len(contornos)) if padre[k] == i and profundidad[k] % 2]
        piezas.append(Polygon(c.exterior.coords, huecos))
    return piezas


def _texto(nombre):
    piezas = poligonos_texto(nombre)
    minx, miny, maxx, maxy = unary_union(piezas).bounds
    escala = min(TEXTO_ALTO_MAX / (maxy - miny), TEXTO_ANCHO_MAX / (maxx - minx))
    mallas = []
    for p in piezas:
        exterior = [((x - minx) * escala, (y - miny) * escala) for x, y in p.exterior.coords]
        huecos = [[((x - minx) * escala, (y - miny) * escala) for x, y in h.coords] for h in p.interiors]
        mallas.append(trimesh.creation.extrude_polygon(Polygon(exterior, huecos), height=RELIEVE_TEXTO + 0.5))
    texto = _union(mallas)
    ancho = (maxx - minx) * escala
    alto = (maxy - miny) * escala
    texto.apply_translation((-ancho / 2, TEXTO_Y - alto / 2, PEANA[2] - 0.5))
    return texto


def _sol_legendario():
    """Sol de rayos de pie en el borde trasero de la peana: el fondo del trofeo."""
    r = 20.0
    puntos = []
    for i in range(16):
        a = math.pi * 2 * i / 16
        radio = r + 9 if i % 2 == 0 else r
        puntos.append((math.cos(a) * radio, math.sin(a) * radio))
    sol = trimesh.creation.extrude_polygon(Polygon(puntos).buffer(0), height=4.0)
    sol.apply_translation((0, 0, -2.0))
    sol.apply_transform(rotation_matrix(math.radians(90), (1, 0, 0)))  # de pie, en el plano XZ
    sol.apply_translation((0, PEANA[1] / 2 - 4.0, PEANA[2] + r + 2))
    pie = trimesh.creation.box(extents=(2 * r + 4, 4.0, 10.0))
    pie.apply_translation((0, PEANA[1] / 2 - 4.0, PEANA[2] + 4.0))
    return [sol, pie]


def construir_pieza(nombre: str, rareza: str = "legendario") -> trimesh.Trimesh:
    figura = figura_dragon(rasgos_de_dragon(nombre, rareza))
    figura.apply_translation((0, 2.0, PEANA[2] - 0.3))  # centrada, dejando la banda del nombre
    extras = _sol_legendario() if rareza == "legendario" else []
    pieza = _union([_peana(), figura, _texto(nombre)] + extras)
    pieza.merge_vertices()
    return pieza


def nombre_archivo(nombre: str) -> str:
    plano = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    plano = "".join(c for c in plano if c.isalnum()) or "dragon"
    return f"dragon-{plano}.stl"


def main():
    ap = argparse.ArgumentParser(description="STL del dragón legendario con su nombre")
    ap.add_argument("nombre")
    ap.add_argument("--rareza", default="legendario", choices=["comun", "raro", "legendario"])
    ap.add_argument("--salida", help="ruta del .stl (por defecto salida/dragon-<nombre>.stl)")
    args = ap.parse_args()
    salida = Path(args.salida) if args.salida else Path("salida") / nombre_archivo(args.nombre)
    salida.parent.mkdir(parents=True, exist_ok=True)
    pieza = construir_pieza(args.nombre, args.rareza)
    pieza.export(salida)
    x, y, z = pieza.extents
    r = rasgos_de_dragon(args.nombre, args.rareza)
    print(f"{salida}  ({x:.0f} x {y:.0f} x {z:.0f} mm, cerrada={pieza.is_watertight}, especie={r['especie']})")


if __name__ == "__main__":
    main()
