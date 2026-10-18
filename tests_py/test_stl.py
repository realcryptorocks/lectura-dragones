import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

from legendario_stl import construir_pieza, nombre_archivo  # noqa: E402


def test_pieza_cerrada_y_tamano():
    m = construir_pieza("Zaftín")
    assert m.is_watertight
    assert m.volume > 0
    assert max(m.extents) <= 100


def test_nombre_archivo_sin_acentos():
    assert nombre_archivo("Zaftín") == "dragon-zaftin.stl"
    assert nombre_archivo("Ñorak") == "dragon-norak.stl"
    assert nombre_archivo("Brulok") == "dragon-brulok.stl"


def test_nombre_largo_cabe():
    m = construir_pieza("Morquelandria")
    assert max(m.extents) <= 100
    assert m.is_watertight


def test_el_nombre_cambia_la_pieza():
    a = construir_pieza("Nepo")
    b = construir_pieza("Lima")
    assert abs(a.volume - b.volume) > 1.0
