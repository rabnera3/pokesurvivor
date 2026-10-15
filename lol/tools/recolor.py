"""Repinta las hojas de Mundo Misterioso con los colores de un campeón.

Las hojas son PNG con paleta (unos 10-15 colores), así que basta con cambiar
la paleta: cada fotograma y cada dirección quedan exactamente igual.

Reglas: lista de (color de la base, color nuevo). Cada color de la paleta va a
la regla más parecida (por tono si tiene color, por luz si es gris) y se
transforma conservando el sombreado (más claro / más oscuro que el de la regla).
El contorno negro no se toca.
"""
import colorsys

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb2hex(c):
    return '%02x%02x%02x' % c

def hls(c):
    return colorsys.rgb_to_hls(*(v / 255 for v in c))

def _dist(a, b):
    (h1, l1, s1), (h2, l2, s2) = a, b
    sat1, sat2 = s1 > 0.15 and 0.08 < l1 < 0.95, s2 > 0.15 and 0.08 < l2 < 0.95
    if sat1 and sat2:
        dh = abs(h1 - h2); dh = min(dh, 1 - dh) * 6       # 60° = 1
        return dh + abs(s1 - s2) * 0.3 + abs(l1 - l2) * 0.6
    if not sat1 and not sat2:
        return abs(l1 - l2) * 1.2
    return 1.5 + abs(l1 - l2)

def _map_l(l, ls, ld):
    if l <= ls:
        return l * ld / ls if ls > 0 else ld
    return ld + (l - ls) * (1 - ld) / (1 - ls) if ls < 1 else ld

def transform(c, rules, tol=0.9):
    """Color nuevo para `c` según las reglas (o el mismo si ninguna encaja)."""
    if c == (0, 0, 0):
        return c
    a = hls(c)
    best, bd = None, tol
    for src, dst in rules:
        d = _dist(a, hls(src))
        if d < bd:
            best, bd = (src, dst), d
    if not best:
        return c
    (hs, ls, ss), (hd, ld, sd) = hls(best[0]), hls(best[1])
    h, l, s = a
    dh = h - hs if s > 0.15 and ss > 0.15 else 0   # el tono de un gris no significa nada
    if dh > 0.5: dh -= 1
    if dh < -0.5: dh += 1
    nh = (hd + dh * 0.5) % 1
    ns = sd if ss < 0.05 else min(1, s * sd / ss)
    nl = max(0, min(1, _map_l(l, ls, ld)))
    r, g, b = colorsys.hls_to_rgb(nh, nl, ns)
    return (round(r * 255), round(g * 255), round(b * 255))

def hue_shift(c, deg):
    """Para los aspectos: gira el tono de los colores con color (no los grises)."""
    h, l, s = hls(c)
    if s < 0.15 or l < 0.08 or l > 0.95:
        return c
    r, g, b = colorsys.hls_to_rgb((h + deg / 360) % 1, l, s)
    return (round(r * 255), round(g * 255), round(b * 255))

def recolor_image(im, fn):
    """Aplica fn(rgb) -> rgb a la paleta de una imagen 'P' (sin tocar píxeles)."""
    im = im.copy()
    pal = im.getpalette()
    tr = im.info.get('transparency')
    for i in range(len(pal) // 3):
        if i == tr:
            continue
        c = tuple(pal[i * 3:i * 3 + 3])
        pal[i * 3:i * 3 + 3] = list(fn(c))
    im.putpalette(pal)
    return im
