"""Calco en Python de js/dragones.js (rasgosDeDragon): mismo hash FNV, mismo
mulberry32 y mismo orden de sorteos, para que la figura impresa sea el mismo
dragón que el niño vio en la tablet."""

M = 0xFFFFFFFF

ESPECIES = ["rechoncho", "serpiente", "cuellilargo", "murcielago", "bebe", "acorazado"]
PALETA = ["rojo", "azul", "verde", "morado", "naranja", "turquesa", "rosa", "gris", "negro"]


def _imul(a, b):
    return (a * b) & M


def hash_fnv(s):
    h = 2166136261
    for c in s:
        h ^= ord(c)
        h = _imul(h, 16777619)
    return h & M


def crear_rng(semilla):
    estado = {"a": semilla & M}

    def rng():
        estado["a"] = (estado["a"] + 0x6D2B79F5) & M
        t = estado["a"]
        t = _imul(t ^ (t >> 15), t | 1)
        t = (t ^ (t + _imul(t ^ (t >> 7), t | 61))) & M
        return ((t ^ (t >> 14)) & M) / 4294967296

    return rng


def _elegir(lista, rng):
    return lista[int(rng() * len(lista))]


def rasgos_de_dragon(nombre, rareza="comun"):
    rng = crear_rng(hash_fnv(nombre))
    r = {
        "nombre": nombre,
        "rareza": rareza,
        "especie": _elegir(ESPECIES, rng),
        "color": _elegir(PALETA, rng),
        "patron": _elegir(["liso", "manchas", "rayas", "escamas"], rng),
        "cuernos": _elegir(["ninguno", "uno", "dos", "curvos"], rng),
        "cresta": _elegir(["ninguna", "pinchos", "aleta"], rng),
        "cola": _elegir(["flecha", "bola", "pincho"], rng),
        "ojos": _elegir(["redondos", "rasgados", "grandes"], rng),
        "hocico": _elegir(["corto", "largo"], rng),
        "alas": "si" if rng() < 0.75 else "no",
    }
    if rareza == "raro":
        r.update(alas="si", cresta="pinchos", cuernos="curvos")
    if rareza == "legendario":
        r.update(color="oro", alas="si", cresta="aleta", cuernos="corona", patron="escamas")
    return r
