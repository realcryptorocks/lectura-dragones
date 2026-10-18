import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

from rasgos_dragon import rasgos_de_dragon  # noqa: E402


# Valores obtenidos con el generador JS (js/dragones.js); el Python debe
# calcar el mismo dragón que vio el niño en la tablet.
def test_rasgos_coinciden_con_js():
    r = rasgos_de_dragon("Aurelión", "legendario")
    assert (r["especie"], r["color"], r["patron"], r["cuernos"], r["cresta"], r["cola"], r["ojos"], r["hocico"], r["alas"]) == (
        "cuellilargo", "oro", "escamas", "corona", "aleta", "flecha", "grandes", "largo", "si")
    r = rasgos_de_dragon("Gorvix", "raro")
    assert (r["especie"], r["color"], r["patron"], r["cuernos"], r["cresta"], r["cola"]) == (
        "acorazado", "rojo", "escamas", "curvos", "pinchos", "pincho")
    r = rasgos_de_dragon("Zaftín", "comun")
    assert (r["especie"], r["color"], r["patron"], r["cuernos"], r["cresta"], r["cola"], r["ojos"], r["hocico"], r["alas"]) == (
        "cuellilargo", "rosa", "rayas", "uno", "aleta", "pincho", "rasgados", "corto", "no")
    r = rasgos_de_dragon("Brulok", "comun")
    assert (r["especie"], r["color"], r["patron"], r["cuernos"], r["cola"]) == ("cuellilargo", "rosa", "manchas", "ninguno", "pincho")
