"""Genera el STL del dragón legendario con el nombre del dragón en relieve.

Uso:  python tools/legendario_stl.py Zaftín [--salida ruta.stl]

Pieza: peana rectangular (76 × 56 × 8 mm), huevo de 60 mm de alto encima con
tres grietas y un dragón en relieve en el frente; el nombre en relieve sobre
la peana, delante del huevo. Cabe en 100 mm y se imprime sin soportes.
"""

import argparse
import unicodedata
from pathlib import Path

import numpy as np
import trimesh
from matplotlib.font_manager import FontProperties
from matplotlib.textpath import TextPath
from shapely.geometry import Polygon
from shapely.ops import unary_union

# --- medidas (mm) ---
PEANA = (76.0, 56.0, 8.0)
HUEVO_RADIO = 22.0
HUEVO_ALTO = 60.0
RELIEVE_DRAGON = 1.6
RELIEVE_TEXTO = 1.2
TEXTO_ALTO_MAX = 7.0
TEXTO_ANCHO_MAX = 64.0
TEXTO_Y = -23.5           # banda delantera de la peana (borde en -28)
DRAGON_ALTO = 30.0



def _elipse(cx, cy, rx, ry):
    from shapely.affinity import scale
    from shapely.geometry import Point
    return scale(Point(cx, cy).buffer(1.0, 32), rx, ry)


def silueta_dragon():
    """Dragón de perfil (cabeza a la derecha) en una caja de 100 × 100,
    compuesto con formas simples para que se reconozca al primer vistazo."""
    piezas = [
        _elipse(45, 35, 26, 18),                                    # cuerpo
        Polygon([(56, 44), (70, 44), (82, 70), (70, 76)]),          # cuello
        _elipse(76, 76, 13, 10),                                    # cabeza
        Polygon([(84, 72), (99, 68), (87, 82)]),                    # hocico
        Polygon([(70, 84), (66, 98), (77, 86)]),                    # cuerno
        Polygon([(80, 85), (85, 98), (88, 84)]),                    # cuerno
        Polygon([(36, 46), (28, 94), (48, 82), (64, 90), (60, 48)]),  # ala
        Polygon([(24, 30), (6, 18), (1, 32), (12, 44), (26, 42)]),  # cola
        Polygon([(0, 28), (3, 10), (14, 22)]),                      # punta de la cola
        _elipse(33, 16, 8, 7),                                      # pata
        _elipse(58, 16, 8, 7),                                      # pata
    ]
    forma = unary_union(piezas).buffer(0.8).buffer(-0.8)
    if hasattr(forma, "geoms"):
        forma = max(forma.geoms, key=lambda g: g.area)
    return Polygon(forma.exterior.coords)


def _union(mallas):
    return trimesh.boolean.union(mallas, engine="manifold")


def _diferencia(a, b):
    return trimesh.boolean.difference([a, b], engine="manifold")


def _peana():
    caja = trimesh.creation.box(extents=PEANA)
    caja.apply_translation((0, 0, PEANA[2] / 2))
    return caja


def _huevo():
    esfera = trimesh.creation.icosphere(subdivisions=4, radius=1.0)
    # Huevo: más estrecho arriba. Escala según la altura relativa.
    v = esfera.vertices.copy()
    z = v[:, 2]
    factor = 1.0 - 0.18 * np.clip(z, 0, 1)
    v[:, 0] *= HUEVO_RADIO * factor
    v[:, 1] *= HUEVO_RADIO * factor
    v[:, 2] *= HUEVO_ALTO / 2
    esfera.vertices = v
    esfera.apply_translation((0, 0, PEANA[2] + HUEVO_ALTO / 2 - 3.0))
    return esfera


def _grietas():
    """Tres surcos finos en el frente del huevo."""
    surcos = []
    for (x, z, giro) in [(-6, 44, 25), (4, 52, -35), (2, 36, 60)]:
        s = trimesh.creation.box(extents=(1.2, 10.0, 12.0))
        s.apply_transform(trimesh.transformations.rotation_matrix(np.radians(giro), (0, 1, 0)))
        s.apply_translation((x, -HUEVO_RADIO + 1.5, z))
        surcos.append(s)
    return surcos


def _dragon_relieve():
    poligono = silueta_dragon()
    escala = DRAGON_ALTO / 100.0
    poligono = Polygon([(x * escala, y * escala) for x, y in poligono.exterior.coords])
    malla = trimesh.creation.extrude_polygon(poligono, height=8.0)
    # Del plano XY (extruido en Z) al plano XZ, sobresaliendo hacia -Y.
    malla.apply_transform(trimesh.transformations.rotation_matrix(np.radians(90), (1, 0, 0)))
    ancho = poligono.bounds[2] - poligono.bounds[0]
    malla.apply_translation((-ancho / 2, -HUEVO_RADIO - RELIEVE_DRAGON + 8.0, PEANA[2] + 14.0))
    return malla


def poligonos_texto(nombre):
    """Contornos del texto como polígonos con sus huecos (regla par-impar):
    un contorno dentro de otro es un hueco (la o, la a, la B)."""
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
    texto = _union(mallas) if len(mallas) > 1 else mallas[0]
    ancho = (maxx - minx) * escala
    alto = (maxy - miny) * escala
    texto.apply_translation((-ancho / 2, TEXTO_Y - alto / 2, PEANA[2] - 0.5))
    return texto


def construir_pieza(nombre: str) -> trimesh.Trimesh:
    huevo = _huevo()
    for surco in _grietas():
        huevo = _diferencia(huevo, surco)
    pieza = _union([_peana(), huevo, _dragon_relieve(), _texto(nombre)])
    pieza.merge_vertices()
    return pieza


def nombre_archivo(nombre: str) -> str:
    plano = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    plano = "".join(c for c in plano if c.isalnum()) or "dragon"
    return f"dragon-{plano}.stl"


def main():
    ap = argparse.ArgumentParser(description="STL del dragón legendario con su nombre")
    ap.add_argument("nombre")
    ap.add_argument("--salida", help="ruta del .stl (por defecto salida/dragon-<nombre>.stl)")
    args = ap.parse_args()
    salida = Path(args.salida) if args.salida else Path("salida") / nombre_archivo(args.nombre)
    salida.parent.mkdir(parents=True, exist_ok=True)
    pieza = construir_pieza(args.nombre)
    pieza.export(salida)
    x, y, z = pieza.extents
    print(f"{salida}  ({x:.0f} × {y:.0f} × {z:.0f} mm, cerrada={pieza.is_watertight})")


if __name__ == "__main__":
    main()
