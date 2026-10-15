"""Cuerpo "chibi" para doll.py: cabeza grande, cuerpo corto, hombreras enormes.

Proporciones de un sprite de 32 px como los de Mundo Misterioso: la cabeza
ocupa casi la mitad de la altura. Todo se dibuja con las mismas piezas que
doll.py (Pen, shade, draw_weapon, draw_tails) y la misma postura (pose()).

Vistas: 'front', 'front3q', 'side' (mirando a la derecha), 'back3q', 'back'.
"""
import math
import os
import importlib.util
from doll import Pen, hexc, shade, draw_weapon, draw_tails, K

ART_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art')
_ART = {}
DARKER = {'4': '3', '3': '2', '2': '1', '0': '9', '9': '8', '7': '6', '6': '5', 'p': 'o', 'l': '0',
          'd': 'c', 'c': 'b', 'b': 'a', 'u': 't', 't': 's'}


def art(ch):
    """Piezas dibujadas a mano (lol/tools/pixel/art/<nombre>.py), si las hay."""
    name = ch.get('art')
    if not name:
        return None
    tint = ch.get('_tint')
    if tint:
        key = (name, id(tint))
        if key not in _ART:
            base = art(dict(ch, _tint=None))
            import types
            m = types.SimpleNamespace(**{k: getattr(base, k) for k in dir(base) if not k.startswith('__')})
            keep = getattr(base, 'KEEP', '')
            pal = {}
            for k, v in base.PAL.items():
                if k in keep:
                    pal[k] = v
                else:
                    r, g, b = tint(tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)))
                    pal[k] = '%02x%02x%02x' % (int(r), int(g), int(b))
            m.PAL = pal
            m.PALC = {k: hexc(v) for k, v in pal.items()}
            _ART[key] = m
        return _ART[key]
    if name not in _ART:
        spec = importlib.util.spec_from_file_location('art_' + name, os.path.join(ART_DIR, name + '.py'))
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        m.PALC = {k: hexc(v) for k, v in m.PAL.items()}
        for nm in [x for x in dir(m) if x.endswith('_L')]:
            # mitad izquierda -> pieza entera (espejo, con las columnas de fuera más oscuras)
            full = []
            for r in getattr(m, nm):
                right = list(r[::-1])
                for i in range(len(right) - 3, len(right)):
                    right[i] = DARKER.get(right[i], right[i])
                full.append(r + ''.join(right))
            setattr(m, nm[:-2], full)
        _ART[name] = m
    return _ART[name]


def blit(pen, a, grid, cx, top, flip=False, dark=False):
    """Pinta una rejilla con su centro horizontal en cx y su fila 0 en top."""
    w = len(grid[0])
    x0 = round(pen.cx + cx - w / 2)
    y0 = round(pen.fy + top)
    for y, row in enumerate(grid):
        for i, chr_ in enumerate(row):
            if chr_ == '.':
                continue
            if dark and chr_ != 'K':
                chr_ = DARKER.get(chr_, chr_)
            x = x0 + (w - 1 - i if flip else i)
            if 0 <= x < pen.w and 0 <= y0 + y < pen.h:
                pen.img.putpixel((x, y0 + y), a.PALC[chr_])

WHITE = (255, 255, 255, 255)


def dims(ch, bob):
    w = ch.get('width', 1.0)
    hs = 8.5 * ch.get('head', 1.0)
    legL = 6 * ch.get('legs', 1.0)
    bodyH = 9 * ch.get('torso', 1.0)
    hip = -legL + round(bob * 0.5)
    top = hip - bodyH + bob - round(bob * 0.5)
    return w, hs, legL, bodyH, hip, top


# ---------------------------------------------------------------- cabeza

def hair_cap(pen, ch, hx, hy, hs, view, hair):
    """Casquete de pelo con flequillo en picos."""
    style = ch.get('hairStyle', 'short')
    if style == 'bald':
        return
    dark = shade(hair, 0.72)
    r = hs + 0.8
    if view in ('back', 'back3q'):
        pen.ellipse(hx, hy - 0.3, r, hs + 0.2, hair, soft=True)
        if view == 'back3q':
            # asoma un poco de cara y la oreja por la derecha
            pen.ellipse(hx + r - 1, hy + 1.5, 1.2, 1.8, shade(hexc(ch['skin']), 0.9), light=False)
        for k in (-1, 1):  # mechones
            pen.line(hx + k * 3, hy - hs + 2, hx + k * 2, hy + 2, dark, 1)
        if ch.get('hairStyle') == 'tufts':
            for ang, ln in ((235, 3.2), (262, 3.8), (292, 3.0)):
                a = math.radians(ang)
                bx, by = hx + math.cos(a) * hs * 0.8, hy - 1 + math.sin(a) * hs * 0.85
                pen.poly([(bx - 1.8, by + 1), (bx + math.cos(a + 0.5) * ln, by + math.sin(a + 0.5) * ln), (bx + 1.8, by + 0.5)], hair)
        if ch.get('hairStyle') == 'spiky':
            for k in range(5):
                a = math.radians(205 + k * 32)
                bx, by = hx + math.cos(a) * hs, hy - 1 + math.sin(a) * hs
                pen.poly([(bx - math.sin(a) * 1.8, by + math.cos(a) * 1.8), (bx + math.cos(a) * 4, by + math.sin(a) * 4),
                          (bx + math.sin(a) * 1.8, by - math.cos(a) * 1.8)], hair)
        elif ch.get('hairStyle') == 'topknot':
            pen.ellipse(hx, hy - hs - 1.8, 2.4, 2, hair)
        return
    # parte de arriba (media elipse)
    pts = [(hx + math.cos(math.radians(a)) * r, hy - 1 + math.sin(math.radians(a)) * (hs + 0.6)) for a in range(180, 361, 15)]
    # flequillo: picos de derecha a izquierda
    off = 1.6 if view == 'side' else 0.9 if view == 'front3q' else 0
    n = 5 if view != 'side' else 3
    x0, x1 = hx - r, hx + r
    if view == 'side':
        x0 = hx - r + 3                       # en lateral el flequillo sólo tapa la parte delantera
    fr = []
    for i in range(n * 2 + 1):
        x = x1 - (x1 - x0) * i / (n * 2)
        y = hy + (0.6 if i % 2 else -2.2) + (1.2 if ch.get('bangs') == 'long' and i % 2 else 0) - (1.6 if ch.get('bangs') == 'short' and i % 2 else 0)
        fr.append((x + off * 0.3, y))
    pen.poly(pts + fr, hair)
    # brillo del pelo
    pen.line(hx - hs * 0.55, hy - hs + 1.5, hx - hs * 0.1, hy - hs + 0.6, shade(hair, 1.3), 1)
    pen.line(hx + 1, hy - 3, hx + 3, hy - 2.5, dark, 1)
    if view == 'side':
        # nuca
        pen.poly([(hx - r, hy - 1), (hx - 1, hy - 2), (hx - 1, hy + hs * 0.6), (hx - r + 0.5, hy + hs * 0.5)], hair)
        pen.line(hx - r + 2, hy - 1, hx - r + 2, hy + 3, dark, 1)
    else:
        # patillas
        side_len = 3.5 if style in ('short', 'spiky', 'topknot', 'ponytail', 'tufts') else 6
        for s in (-1, 1):
            if view == 'front3q' and s > 0 and style in ('short', 'spiky', 'tufts'):
                continue
            xa = hx + s * (r - 1.2)
            pen.poly([(xa - 1.4, hy - 2), (xa + 1.4, hy - 2), (xa + 0.8 * s, hy + side_len), (xa - 0.6 * s, hy + side_len - 1)], hair)
    if style == 'tufts':
        for k, (ang, ln) in enumerate(((235, 3.2), (262, 3.8), (292, 3.0))):
            a = math.radians(ang)
            bx, by = hx + math.cos(a) * hs * 0.8, hy - 1 + math.sin(a) * hs * 0.85
            pen.poly([(bx - 1.8, by + 1), (bx + math.cos(a + 0.5) * ln, by + math.sin(a + 0.5) * ln), (bx + 1.8, by + 0.5)], hair)
    if style == 'spiky':
        for k in range(5):
            a = math.radians(205 + k * 32)
            bx, by = hx + math.cos(a) * hs, hy - 1 + math.sin(a) * hs
            pen.poly([(bx - math.sin(a) * 1.8, by + math.cos(a) * 1.8), (bx + math.cos(a) * 4, by + math.sin(a) * 4),
                      (bx + math.sin(a) * 1.8, by - math.cos(a) * 1.8)], hair)
    elif style == 'topknot':
        pen.ellipse(hx - (1 if view == 'side' else 0), hy - hs - 1.8, 2.4, 2, hair)
    elif style == 'ponytail' and view == 'front':
        pen.poly([(hx + 2, hy - hs), (hx + 4, hy - hs - 3), (hx + 6, hy - hs - 1), (hx + 3, hy - hs + 1)], hair)


def back_hair(pen, ch, hx, hy, hs, view, hair, bob):
    """Pelo que cae por detrás de la espalda (se dibuja antes que el cuerpo)."""
    style = ch.get('hairStyle', 'short')
    if style == 'long':
        L = ch.get('hairLen', 12)
        if view == 'side':
            pen.poly([(hx - hs, hy - 2), (hx - 1, hy - 2), (hx - 2, hy + L), (hx - hs - 1, hy + L - 1)], hair)
        elif view in ('back', 'back3q'):
            return  # se dibuja delante en back_hair_over
        else:
            pen.poly([(hx - hs - 1, hy - 1), (hx + hs + 1, hy - 1), (hx + hs + 1.5, hy + L), (hx - hs - 1.5, hy + L)], shade(hair, 0.82))
    elif style == 'ponytail':
        if view == 'side':
            pen.poly([(hx - hs + 1, hy - 3), (hx - hs - 3, hy - 1), (hx - hs - 4, hy + 9), (hx - hs - 1, hy + 7)], hair)


def back_hair_over(pen, ch, hx, hy, hs, view, hair):
    style = ch.get('hairStyle', 'short')
    if view not in ('back', 'back3q'):
        return
    if style == 'long':
        L = ch.get('hairLen', 12)
        pen.poly([(hx - hs - 0.5, hy - 1), (hx + hs + 0.5, hy - 1), (hx + hs + 1, hy + L), (hx - hs - 1, hy + L)], hair)
        for k in (-2, 1, 3):
            pen.line(hx + k, hy + 1, hx + k * 1.2, hy + L - 1, shade(hair, 0.75), 1)
    elif style == 'ponytail':
        pen.poly([(hx - 1.5, hy - 1), (hx + 1.5, hy - 1), (hx + 2, hy + 10), (hx - 1, hy + 11)], hair)


def ears(pen, ch, hx, hy, hs, view):
    e = ch.get('ears')
    if not e:
        return
    ec, ei = hexc(e['color']), hexc(e.get('inner', 'ffb0c8'))
    kind = e['kind']
    for s in (-1, 1):
        if view == 'side' and s < 0:
            continue
        ox = s * hs * 0.62 if view != 'side' else -1.5
        if kind == 'fox':
            base = hy - hs + 2.5
            pen.poly([(hx + ox - 3, base), (hx + ox + s * 1.5, base - 7), (hx + ox + 3, base)], ec)
            if view != 'back':
                pen.poly([(hx + ox - 1.2, base), (hx + ox + s * 1.0, base - 4.5), (hx + ox + 1.2, base)], ei)
        elif kind == 'yordle':
            pen.poly([(hx + s * (hs - 2), hy - 3), (hx + s * (hs + 8), hy - 8), (hx + s * (hs - 1), hy + 2)], ec)
            if view != 'back':
                pen.poly([(hx + s * (hs - 0.5), hy - 2), (hx + s * (hs + 5.5), hy - 6), (hx + s * (hs - 0.5), hy)], ei)
        elif kind == 'wolf':
            base = hy - hs + 3
            pen.poly([(hx + ox - 2.5, base), (hx + ox + s * 1, base - 5.5), (hx + ox + 2.5, base)], ec)
            pen.px(hx + ox + s * 0.4, base - 2, ei)
        elif kind == 'bear':
            pen.ellipse(hx + ox * 1.1, hy - hs + 1.5, 2.6, 2.4, ec)
            pen.px(hx + ox * 1.1, hy - hs + 1.5, ei)
        elif kind == 'monkey':
            pen.ellipse(hx + s * (hs + 0.5), hy + 1, 2, 2.4, ec)
            pen.px(hx + s * (hs + 0.5), hy + 1, ei)


def face(pen, ch, hx, hy, hs, view, hurt, glow):
    skin = hexc(ch['skin'])
    eye = hexc(ch.get('eyes', '2a2040'))
    if view in ('back', 'back3q'):
        return
    ey = hy + 1.2
    if view == 'side':
        ex = hx + hs - 3.5
        if hurt:
            pen.line(ex - 1, ey + 1, ex + 1, ey + 1, K, 1)
        else:
            pen.px(ex, ey - 0.5, K)
            pen.rect(ex, ey + 0.5, ex, ey + 2.5, eye, shadeR=False)
            pen.px(ex - 1, ey - 0.5, K)
            pen.px(ex - 1, ey + 0.5, WHITE)
            pen.px(ex - 1, ey + 1.5, eye)
        if ch.get('brows') and not hurt:
            pen.line(ex - 1.5, ey - 1.8, ex + 0.5, ey - 1.5, hexc(ch['brows']), 1)
        pen.px(hx + hs - 2.5, hy + 5, shade(skin, 0.6))     # boca
        pen.px(hx - 1, hy + 1.5, shade(skin, 0.88))        # oreja
        pen.px(hx - 1, hy + 2.5, shade(skin, 0.88))
        return
    fx = 1.6 if view == 'front3q' else 0
    gap = 3.0 if view == 'front' else 2.6
    for s in (-1, 1):
        ex = hx + fx + s * gap
        if hurt:
            # ojos apretados: > <
            pen.px(ex - s * 0.5 - 0.5, ey, K); pen.px(ex + s * 0.5 - 0.5, ey + 1, K); pen.px(ex - s * 0.5 - 0.5, ey + 2, K)
            continue
        narrow = view == 'front3q' and s < 0
        pen.rect(ex - (0.5 if narrow else 1), ey - 0.5, ex + 0.5, ey + 2.5, K, shadeR=False)
        pen.rect(ex - (0.5 if narrow else 1), ey + 0.5, ex + 0.5, ey + 2.5, eye, shadeR=False)
        pen.px(ex, ey + 2.5, shade(eye, 1.35))
        pen.px(ex - (0 if narrow else 1), ey - 0.5, WHITE)
        if glow > 0.6:
            pen.px(ex, ey + 1, (255, 255, 230, 255))
    if ch.get('brows') and not hurt:
        bc = hexc(ch['brows'])
        for s in (-1, 1):
            ex = hx + fx + s * gap
            pen.line(ex - 1.2, ey - 1.5 - (0.6 if s < 0 else 0), ex + 0.8, ey - 1.5 - (0.6 if s > 0 else 0), bc, 1)
    if ch.get('blush'):
        pen.px(hx + fx - gap - 1.5, ey + 3.5, hexc(ch['blush']))
        pen.px(hx + fx + gap + 1.5, ey + 3.5, hexc(ch['blush']))
    mouth = shade(skin, 0.55)
    if hurt:
        pen.rect(hx + fx - 0.5, hy + 5, hx + fx + 0.5, hy + 5.5, K, shadeR=False)
    elif ch.get('mouth') == 'firm':
        pen.line(hx + fx - 1, hy + 5, hx + fx + 0.5, hy + 5, mouth, 1)
    else:
        pen.px(hx + fx, hy + 5, mouth)
    if ch.get('beard'):
        b = hexc(ch['beard'])
        pen.poly([(hx + fx - hs + 2, hy + 2), (hx + fx + hs - 2, hy + 2), (hx + fx + 2, hy + hs), (hx + fx - 2, hy + hs)], b)
        pen.px(hx + fx, hy + 4, shade(skin, 0.55))


def head_orn(pen, ch, hx, hy, hs, view):
    for orn in ch.get('headOrn', []):
        kind, col = orn['kind'], hexc(orn['color'])
        if kind == 'horns':
            for s in (-1, 1):
                if view == 'side' and s < 0:
                    continue
                ox = s * hs * 0.55 if view != 'side' else 0
                big = orn.get('size', 1)
                pen.poly([(hx + ox - 1.6, hy - hs + 2.5), (hx + ox + s * 4 * big, hy - hs - 5 * big), (hx + ox + 1.6, hy - hs + 2)], col)
        elif kind == 'crown':
            pen.rect(hx - hs + 2, hy - hs - 1, hx + hs - 2, hy - hs + 0.5, col)
            for k in (-1, 0, 1):
                pen.poly([(hx + k * 3 - 1, hy - hs - 1), (hx + k * 3, hy - hs - 3.5), (hx + k * 3 + 1, hy - hs - 1)], col)
        elif kind == 'band':
            pen.line(hx - hs + 0.5, hy - 2.5, hx + hs - 0.5, hy - 2.5, col, 1)
            if view in ('side', 'back3q', 'back'):
                pen.line(hx - hs + 0.5, hy - 2.5, hx - hs - 3, hy + 1, col, 1)
        elif kind == 'mask':
            if view not in ('back', 'back3q'):
                fx = 2 if view == 'side' else 0
                pen.rect(hx + fx - hs + 1.5, hy + 3, hx + fx + hs - 1.5, hy + hs - 1, col)
        elif kind == 'hat':
            pen.ellipse(hx, hy - hs + 2, hs + 3, 2.4, shade(col, 0.85))
            pen.poly([(hx - hs + 1.5, hy - hs + 2), (hx + hs - 1.5, hy - hs + 2), (hx + 2, hy - hs - 6), (hx - 2, hy - hs - 5)], col)
            if orn.get('feather'):
                pen.poly([(hx + 3, hy - hs), (hx + 7, hy - hs - 6), (hx + 5, hy - hs - 1)], hexc(orn['feather']))
        elif kind == 'plume':
            pen.poly([(hx - 1.5, hy - hs + 1), (hx + 1.5, hy - hs + 1), (hx - 2, hy - hs - 6), (hx - 5, hy - hs - 3)], col)
        elif kind == 'blindfold':
            if view not in ('back', 'back3q'):
                fx = 1.6 if view == 'front3q' else 0
                x0, x1 = (hx + 1, hx + hs + 0.3) if view == 'side' else (hx - hs - 0.3, hx + hs + 0.3)
                pen.rect(x0, hy, x1, hy + 2, col)
                pen.line(x0, hy, x1, hy, shade(col, 1.25), 1)
            tail = -1 if view != 'side' else -1
            bx = hx - hs if view in ('side', 'front3q', 'back3q') else hx + 2
            if view in ('side', 'back', 'back3q'):
                pen.rect(hx - hs, hy, hx + hs, hy + 2, col) if view != 'side' else None
                pen.poly([(bx, hy + 0.5), (bx - 4, hy + 4 + tail), (bx - 3, hy + 6), (bx + 0.5, hy + 2)], col)
        elif kind == 'hood':
            # capucha: por encima del pelo, deja ver la cara
            pen.ellipse(hx, hy - 1, hs + 1.6, hs + 1.0, shade(col, 0.82), light=False)
            if view in ('back', 'back3q'):
                pen.ellipse(hx, hy - 1, hs + 1.2, hs + 0.6, col, soft=True)
                pen.poly([(hx - 2, hy + hs - 1), (hx + 2, hy + hs - 1), (hx, hy + hs + 4)], col)
            else:
                fx = 2.5 if view == 'side' else 1.2 if view == 'front3q' else 0
                pen.d.chord([pen.P(hx - hs - 1.2, hy - hs - 1.6), pen.P(hx + hs + 1.2, hy + hs + 0.6)], 150, 390, fill=col)
                if view == 'side':
                    pen.poly([(hx - hs - 1, hy - 2), (hx + 1, hy - 3), (hx - 1, hy + hs), (hx - hs - 1.5, hy + hs - 1)], col)
                pen.line(hx + fx - hs * 0.6, hy - hs + 1, hx + fx + hs * 0.6, hy - hs + 1, shade(col, 1.25), 1)
                if orn.get('trim'):
                    pen.d.arc([pen.P(hx + fx - hs + 0.5, hy - hs + 0.2), pen.P(hx + fx + hs - 0.5, hy + hs * 0.7)], 180, 360, fill=hexc(orn['trim']))
        elif kind == 'gem':
            if view not in ('back', 'back3q'):
                pen.px(hx + (1.6 if view == 'front3q' else 2.5 if view == 'side' else 0), hy - 3, col)


HEAD_OF = {'front': ('HEAD_FRONT', False), 'front3q': ('HEAD_3Q', False), 'side': ('HEAD_SIDE', False),
           'back3q': ('HEAD_BACK', False), 'back': ('HEAD_BACK', False)}


def head_full(pen, ch, hx, hy, hs, view, hurt, glow):
    a = art(ch)
    if a and hasattr(a, 'HEAD_FRONT'):
        name, flip = HEAD_OF[view]
        g = getattr(a, name)
        blit(pen, a, g, hx, hy - len(g) // 2, flip)
        if hurt and view in ('front', 'front3q', 'side'):
            # ojos apretados encima del dibujo
            eyes = getattr(a, 'EYES', {}).get(view, [])
            x0 = round(pen.cx + hx - len(g[0]) / 2)
            y0 = round(pen.fy + hy - len(g) // 2)
            sk = a.PALC.get('t')
            for ex, ey, s_ in eyes:
                for dx in (0, 1):
                    for dy in (0, 1, 2):
                        pen.img.putpixel((x0 + ex + dx, y0 + ey + dy), sk)
                for (dx, dy) in ((0, 0), (1, 1), (0, 2)) if s_ < 0 else ((1, 0), (0, 1), (1, 2)):
                    pen.img.putpixel((x0 + ex + dx, y0 + ey + dy), a.PALC['K'])
        if glow > 0.6 and view in ('front', 'front3q'):
            eyes = getattr(a, 'EYES', {}).get(view, [])
            x0 = round(pen.cx + hx - len(g[0]) / 2)
            y0 = round(pen.fy + hy - len(g) // 2)
            for ex, ey, s_ in eyes:
                pen.img.putpixel((x0 + ex + 1, y0 + ey + 1), (255, 255, 230, 255))
        return
    skin = hexc(ch['skin'])
    shape = ch.get('headShape', 'round')
    if shape == 'helmet':
        hc = hexc(ch.get('helmet', '8a6a3a'))
        pen.ellipse(hx, hy, hs + 0.5, hs + 0.3, hc)
        if view not in ('back', 'back3q'):
            fx = 2.2 if view == 'side' else 1.2 if view == 'front3q' else 0
            vis = hexc(ch.get('visor', '7fe0ff'))
            pen.ellipse(hx + fx, hy + 1, hs * 0.5, hs * 0.48, shade(hc, 0.6), light=False)
            pen.ellipse(hx + fx, hy + 1, hs * 0.38, hs * 0.36, vis, light=False)
            pen.px(hx + fx - 1, hy, WHITE)
        riv = hexc(ch.get('rivets', 'e0b84a'))
        for k in range(5):
            b = math.radians(190 + k * 40)
            pen.px(hx + math.cos(b) * (hs - 0.5), hy + math.sin(b) * (hs - 0.5), riv)
        head_orn(pen, ch, hx, hy, hs, view)
        return
    ears(pen, ch, hx, hy, hs, view)
    if shape == 'rock':
        pts = [(hx - hs, hy + 2), (hx - hs + 1, hy - hs + 2), (hx - 1, hy - hs), (hx + hs - 1, hy - hs + 2), (hx + hs, hy + 2), (hx + hs - 2, hy + hs - 1), (hx - hs + 2, hy + hs - 1)]
        pen.poly(pts, skin)
        pen.poly([(hx + 1, hy - hs + 1), (hx + hs - 1, hy - hs + 2), (hx + hs, hy + 2), (hx + hs - 2, hy + hs - 1), (hx + 2, hy + hs - 1)], shade(skin, 0.8))
        pen.line(hx - hs + 2, hy - 2, hx - 2, hy - 4, shade(skin, 1.25), 1)
        if view not in ('back', 'back3q'):
            fx = 2 if view == 'side' else 0
            g = hexc(ch.get('eyes', 'ffd860'))
            for s in ((1,) if view == 'side' else (-1, 1)):
                pen.rect(hx + fx + s * 2.5 - 0.5, hy, hx + fx + s * 2.5 + 0.5, hy + 0.5, g, shadeR=False)
        head_orn(pen, ch, hx, hy, hs, view)
        return
    if shape == 'snout':
        pen.ellipse(hx, hy, hs, hs - 0.5, skin)
        if view not in ('back', 'back3q'):
            sx = 3.5 if view == 'side' else 1 if view == 'front3q' else 0
            m = hexc(ch.get('muzzle', 'e8e0d8'))
            pen.ellipse(hx + sx, hy + 3.2, hs * 0.5, hs * 0.34, m, soft=True)
            pen.rect(hx + sx - 1 + (2 if view == 'side' else 0), hy + 1.8, hx + sx + (3 if view == 'side' else 1), hy + 2.6, K, shadeR=False)
            e = hexc(ch.get('eyes', 'ffd040'))
            for s in ((1,) if view == 'side' else (-1, 1)):
                ex = hx + sx + s * 3 - (2 if view == 'side' else 0)
                pen.rect(ex - 0.5, hy - 1.5, ex + 0.5, hy - 0.5, e, shadeR=False)
            if ch.get('fangs'):
                pen.px(hx + sx - 1, hy + 5, WHITE); pen.px(hx + sx + 1, hy + 5, WHITE)
        tuft = hexc(ch.get('hair', ch['skin']))
        pen.poly([(hx - hs + 1, hy - 2), (hx - 2, hy - hs - 1), (hx + 1, hy - hs + 1), (hx + hs - 1, hy - 3), (hx + 1, hy - 2)], tuft)
        head_orn(pen, ch, hx, hy, hs, view)
        return
    if shape == 'bug':
        pen.ellipse(hx, hy, hs, hs - 1, skin)
        pen.ellipse(hx, hy - 2, hs - 1.5, hs - 3.5, shade(skin, 1.12), light=False)
        if view not in ('back', 'back3q'):
            fx = 2.5 if view == 'side' else 1 if view == 'front3q' else 0
            e = hexc(ch.get('eyes', 'ff4080'))
            for s in ((1,) if view == 'side' else (-1, 1)):
                pen.poly([(hx + fx + s * 1.5, hy), (hx + fx + s * 4.5, hy - 1.5), (hx + fx + s * 4, hy + 1)], e)
            pen.line(hx + fx - 2, hy + 4, hx + fx - 3, hy + 7, shade(skin, 0.55), 1)
            pen.line(hx + fx + 2, hy + 4, hx + fx + 3, hy + 7, shade(skin, 0.55), 1)
        head_orn(pen, ch, hx, hy, hs, view)
        return
    # humana / yordle
    pen.ellipse(hx, hy, hs, hs - 0.4, skin, soft=True)
    hair = hexc(ch.get('hair', ch['skin']))
    face(pen, ch, hx, hy, hs, view, hurt, glow)
    hair_cap(pen, ch, hx, hy, hs, view, hair)
    head_orn(pen, ch, hx, hy, hs, view)


def wings(pen, ch, view, top, lean, t, over=False):
    wg = ch.get('wings')
    if not wg:
        return
    if (view in ('back', 'back3q')) != over:
        return
    col, edge = hexc(wg['color']), hexc(wg.get('edge', wg['color']))
    flap = math.sin(t * 6.28 * 2) * 1.5
    L = wg.get('len', 11)
    sides = (-1,) if view == 'side' else (-1, 1)
    for s in sides:
        bx = lean + (s * 2 if view != 'side' else -2)
        by = top + 2
        if wg.get('kind') == 'blade':
            # alas de cuchilla (Kha'Zix): dos hojas por lado
            for k, (ang, ln) in enumerate(((-60, L), (-30, L * 0.8))):
                a = math.radians(ang - flap * 3) if s > 0 else math.radians(180 - ang + flap * 3)
                tx, ty = bx + math.cos(a) * ln, by + math.sin(a) * ln
                px_, py_ = -math.sin(a) * 1.6, math.cos(a) * 1.6
                pen.poly([(bx + px_, by + py_), (tx, ty), (bx - px_, by - py_)], col if k == 0 else shade(col, 0.8))
                pen.line(bx, by, tx, ty, edge, 1)
        else:
            # membrana con dedos (Vacío / murciélago)
            a0 = math.radians(-50 - flap * 4) if s > 0 else math.radians(230 + flap * 4)
            pts = [(bx, by)]
            for k in range(4):
                a = a0 + (k * 0.38 if s > 0 else -k * 0.38)
                pts.append((bx + math.cos(a) * L * (1 - k * 0.12), by + math.sin(a) * L * (1 - k * 0.12)))
                if k < 3:
                    a2 = a + (0.19 if s > 0 else -0.19)
                    pts.append((bx + math.cos(a2) * L * 0.6, by + math.sin(a2) * L * 0.6))
            pts.append((bx + s * 2, by + 5))
            pen.poly(pts, col)
            for k in range(4):
                a = a0 + (k * 0.38 if s > 0 else -k * 0.38)
                pen.line(bx, by, bx + math.cos(a) * L * (1 - k * 0.12), by + math.sin(a) * L * (1 - k * 0.12), edge, 1)


def extras(pen, ch, view, top, hip, lean, sdx, t):
    """Detalles del torso: collar, collar de huesos, tubos, grietas brillantes, abdominales."""
    w = ch.get('width', 1.0)
    if ch.get('abs') and view in ('front', 'front3q'):
        c = shade(hexc(ch['outfit']), 0.82)
        x = lean + sdx * 0.8
        pen.line(x, top + 2, x, hip - 3, c, 1)
        pen.line(x - 2, top + 3.5, x - 1, top + 3.5, c, 1); pen.line(x + 1, top + 3.5, x + 2, top + 3.5, c, 1)
        pen.line(x - 2, top + 5.5, x - 1, top + 5.5, c, 1); pen.line(x + 1, top + 5.5, x + 2, top + 5.5, c, 1)
    if ch.get('cracks'):
        c = hexc(ch['cracks'])
        x = lean + sdx
        for (a, b, cc, d) in ((-3, 2, -1, 5), (1, 1, 3, 4), (-1, 6, 2, 7)):
            if view in ('back', 'back3q'):
                a, cc = -a, -cc
            pen.line(x + a * w, top + b, x + cc * w, top + d, c, 1)
    if ch.get('collar'):
        c = hexc(ch['collar'])
        pen.ellipse(lean + sdx * 0.5, top + 0.5, 4.2 * w, 2.0, c)
        for k in (-3, -1, 1, 3):
            pen.px(lean + sdx * 0.5 + k * w, top + 2.2, shade(c, 0.7))
    if ch.get('necklace') and view in ('front', 'front3q'):
        c = hexc(ch['necklace'])
        for k in (-2.5, -1, 0.5, 2):
            pen.rect(lean + sdx + k, top + 1.5 + abs(k) * 0.3, lean + sdx + k + 0.5, top + 2.5 + abs(k) * 0.3, c, shadeR=False)
    if ch.get('tubes') and view in ('back', 'back3q', 'side'):
        c = hexc(ch['tubes'])
        x = lean - (2 if view == 'side' else 0)
        pen.line(x - 1.5, top, x - 3.5, top - 3, c, 1)
        pen.line(x + 1.5, top, x + 3.5, top - 3, c, 1)
        pen.px(x - 3.5, top - 3, shade(c, 1.3)); pen.px(x + 3.5, top - 3, shade(c, 1.3))


# ---------------------------------------------------------------- cuerpo

def draw_chibi(pen, ch, view, p, t):
    bob = p['bob']
    w, hs, legL, bodyH, hip, top = dims(ch, bob)
    lean = p['lean']
    hy = top - hs + 2 if not ch.get('art') else top - ch.get('headUp', 7)
    hx = lean
    skin = hexc(ch['skin'])
    outfit = hexc(ch['outfit'])
    chest = hexc(ch['chest']) if ch.get('chest') else None
    legs_c = hexc(ch.get('legsColor', ch['outfit']))
    boots = hexc(ch.get('boots', '4a3a32'))
    arms_c = hexc(ch.get('arms', ch.get('outfit2', ch['outfit'])))
    hands = hexc(ch.get('hands', ch['skin']))
    hair = hexc(ch.get('hair', ch['skin']))
    side = view == 'side'
    front = view in ('front', 'front3q')
    back = view in ('back', 'back3q')
    sdx = 1 if view == 'front3q' else -1 if view == 'back3q' else 0
    sh = 4.8 * w                  # hombro
    wa = 3.8 * w                  # cintura
    wpn = ch.get('weapon') or {}

    A = art(ch)

    def leg(x, lift, fwd):
        if A and hasattr(A, 'LEG'):
            blit(pen, A, A.LEG, x + fwd, hip - 1 - lift)
            return
        lw = 1.5 * ch.get('legW', 1.0) * w
        pen.rect(x - lw + fwd, hip - 1, x + lw + fwd, -2 - lift, legs_c)
        pen.rect(x - lw - 0.4 + fwd, -2.5 - lift, x + lw + 0.4 + fwd + (1 if side else 0), -lift, boots)

    def arm(sx, sy, ang, length=6.0, col=arms_c, far=False):
        a = math.radians(ang)
        ex, ey = sx + math.cos(a) * length, sy + math.sin(a) * length
        c = shade(col, 0.82) if far else col
        thick = max(3, round(3 * ch.get('armW', 1.0) * w))
        pen.line(sx, sy, ex, ey, shade(c, 0.75), thick)
        pen.line(sx - 0.4, sy - 0.4, ex - 0.4, ey - 0.4, c, max(1, thick - 1))
        if ch.get('gauntlet'):
            g = hexc(ch['gauntlet'])
            pen.ellipse(sx + math.cos(a) * length * 0.7, sy + math.sin(a) * length * 0.7, 1.8, 1.8, shade(g, 0.82) if far else g, light=False)
        if A and hasattr(A, 'FIST'):
            blit(pen, A, A.FIST, ex, ey - 2, ex < lean, dark=far)
        else:
            pen.ellipse(ex, ey, 1.9, 1.9, shade(hands, 0.82) if far else hands, soft=True)
        return ex, ey

    def pauldron(x, y, far=False):
        if A and hasattr(A, 'PAULDRON'):
            blit(pen, A, A.PAULDRON, x, y - 4, x > lean, dark=far)
            return
        if not ch.get('pauldrons'):
            return
        pc = hexc(ch['pauldrons'])
        if far:
            pc = shade(pc, 0.85)
        k = ch.get('pauldronSize', 1.0)
        rx, ry = 3.2 * k * w, 3.0 * k
        tr = hexc(ch['pauldronTrim']) if ch.get('pauldronTrim') else shade(pc, 0.7)
        out = 1 if x > lean else -1                 # hacia fuera
        # lama de abajo (asoma por debajo de la placa)
        pen.ellipse(x + out * 0.6, y + ry * 0.55, rx * 0.92, ry * 0.7, shade(pc, 0.62), light=False)
        pen.ellipse(x + out * 0.6, y + ry * 0.45, rx * 0.92 - 0.6, ry * 0.7 - 0.6, tr, light=False)
        # placa
        pen.ellipse(x, y, rx, ry, shade(pc, 0.66), light=False)
        pen.ellipse(x - 0.3, y - 0.5, rx - 0.7, ry - 0.9, pc, light=False)
        pen.d.arc([pen.P(x - rx + 1.2, y - ry + 0.9), pen.P(x + rx - 1.6, y + ry - 1.5)], 200, 300, fill=shade(pc, 1.35))
        pen.px(x - rx * 0.45, y - ry * 0.35, (255, 255, 255, 255))
        if ch.get('pauldronTrim'):
            pen.d.arc([pen.P(x - rx, y - ry), pen.P(x + rx, y + ry)], 10, 170, fill=tr)
        if ch.get('pauldronGem'):
            pen.px(x + out * 0.5, y + 0.5, hexc(ch['pauldronGem']))
        if ch.get('pauldronSpike'):
            pen.poly([(x - 1, y - ry + 1), (x + (2 if x > 0 else -2), y - ry - 3), (x + 1, y - ry + 1)], hexc(ch['pauldronSpike']))

    def cape_back():
        cape = ch.get('cape')
        if not cape:
            return
        col, inner = hexc(cape['color']), hexc(cape.get('inner', cape['color']))
        trim = hexc(cape.get('trim', cape['color']))
        flap = math.sin(t * 6.28) * 0.8
        bottom = -1 + bob * 0.5
        if back:
            return
        if side:
            pen.poly([(lean - 1, top + 1), (lean - 3, top + 1), (lean - 9 + flap, bottom), (lean - 2 + flap, bottom)], col)
            pen.poly([(lean - 3, top + 3), (lean - 8 + flap, bottom - 0.5), (lean - 6 + flap, bottom - 0.5)], inner)
            pen.line(lean - 9 + flap, bottom, lean - 2 + flap, bottom, trim, 1)
        else:
            # asoma por los lados (forro de otro color)
            pen.poly([(lean - sh, top + 1), (lean + sh, top + 1), (lean + sh + 2 + flap, bottom), (lean - sh - 2 + flap, bottom)], col)
            pen.poly([(lean - sh + 1, top + 3), (lean + sh - 1, top + 3), (lean + sh + 1 + flap, bottom - 1), (lean - sh - 1 + flap, bottom - 1)], inner)

    def cape_over():
        cape = ch.get('cape')
        if not cape or not back:
            return
        col, trim = hexc(cape['color']), hexc(cape.get('trim', cape['color']))
        flap = math.sin(t * 6.28) * 0.8
        bottom = -1 + bob * 0.5
        pen.poly([(lean - sh + 0.5, top + 0.5), (lean + sh - 0.5, top + 0.5), (lean + sh + 1.5 + flap, bottom), (lean - sh - 1.5 + flap, bottom)], col)
        pen.line(lean - sh - 1.5 + flap, bottom, lean + sh + 1.5 + flap, bottom, trim, 1)
        pen.line(lean - 2 + flap * 0.3, top + 3, lean - 2.5 + flap, bottom - 1, shade(col, 0.75), 1)
        pen.line(lean + 2 + flap * 0.3, top + 3, lean + 2.5 + flap, bottom - 1, shade(col, 0.75), 1)
        if cape.get('emblem'):
            em = hexc(cape['emblem'])
            pen.poly([(lean, top + 3), (lean + 2, top + 5), (lean, top + 7), (lean - 2, top + 5)], em)

    def torso(cx):
        if A and hasattr(A, 'TORSO_FRONT'):
            g = A.TORSO_BACK if back else A.TORSO_FRONT
            blit(pen, A, g, cx + sdx * 0.6, top - 1)
            return
        # tronco en trapecio
        pen.poly([(cx - sh + 0.5, top), (cx + sh - 0.5, top), (cx + wa, hip), (cx - wa, hip)], outfit)
        pen.line(cx + sh - 1, top + 1, cx + wa - 0.5, hip - 1, shade(outfit, 0.72), 1)
        if chest and not back and not side:
            c2 = cx + sdx * 0.8
            pen.poly([(c2 - 2.6 * w, top + 1), (c2 + 2.6 * w, top + 1), (c2 + 2 * w, hip - 2), (c2 - 2 * w, hip - 2)], chest)
            pen.line(c2 - 1.6 * w, top + 2, c2 - 1.2 * w, hip - 3, shade(chest, 1.25), 1)
            if ch.get('chestTrim'):
                ct = hexc(ch['chestTrim'])
                pen.line(c2 - 2.6 * w, top + 1, c2, top + 4.5, ct, 1)
                pen.line(c2 + 2.6 * w, top + 1, c2, top + 4.5, ct, 1)
                pen.line(c2 - 2 * w, hip - 2, c2 + 2 * w, hip - 2, ct, 1)
            if ch.get('chestEmblem'):
                ce = hexc(ch['chestEmblem'])
                pen.poly([(c2, top + 3.5), (c2 + 1.5, top + 5), (c2, top + 6.5), (c2 - 1.5, top + 5)], ce)
                pen.px(c2 - 0.5, top + 4.5, shade(ce, 1.4))
        elif chest and side:
            pen.poly([(cx, top + 1), (cx + sh - 1, top + 1), (cx + wa - 0.5, hip - 2), (cx + 0.5, hip - 2)], chest)
        if ch.get('belt'):
            b = hexc(ch['belt'])
            pen.rect(cx - wa, hip - 2, cx + wa, hip - 1, b, shadeR=False)
            if not back:
                pen.rect(cx + (2 if side else sdx) - 0.5, hip - 2, cx + (2 if side else sdx) + 0.5, hip - 1, shade(b, 1.3), shadeR=False)
        if ch.get('skirt'):
            sk = hexc(ch['skirt'])
            pen.poly([(cx - wa, hip - 1), (cx + wa, hip - 1), (cx + wa + 1.5, hip + 2.5), (cx - wa - 1.5, hip + 2.5)], sk)
            pen.line(cx - wa - 1, hip + 2, cx + wa + 1, hip + 2, shade(sk, 0.7), 1)
        if ch.get('tabard') and not side:
            tb = hexc(ch['tabard'])
            pen.poly([(cx - 1.6 + sdx, hip - 2), (cx + 1.6 + sdx, hip - 2), (cx + 1.2 + sdx, hip + 3), (cx - 1.2 + sdx, hip + 3)], tb)

    def arm_to(sx, sy, tx, ty, far=False, fist=True):
        L = math.hypot(tx - sx, ty - sy) or 1
        ang = math.degrees(math.atan2(ty - sy, tx - sx))
        if not fist:
            c = shade(arms_c, 0.82) if far else arms_c
            thick = max(3, round(3 * ch.get('armW', 1.0) * w))
            pen.line(sx, sy, tx, ty, shade(c, 0.75), thick)
            pen.line(sx - 0.4, sy - 0.4, tx - 0.4, ty - 0.4, c, max(1, thick - 1))
            return tx, ty
        return arm(sx, sy, ang, length=L, far=far)

    def fist_at(x, y, flip=False):
        if A and hasattr(A, 'FIST'):
            blit(pen, A, A.FIST, x, y - 2, flip)
        else:
            pen.ellipse(x, y, 1.9, 1.9, hands, soft=True)

    def special_pose():
        """Posturas de habilidad: arma extendida al girar, clavada delante, o en alto con las dos manos."""
        ph = p['leg']
        sy = top + 2.5
        if side:
            draw_tails(pen, ch, 'side', bob, t)
            wings(pen, ch, view, top, lean, t)
            cape_back()
            back_hair(pen, ch, hx, hy, hs, view, hair, bob)
            leg(lean - 1, 0, -1)
            leg(lean + 1, 0, 1)
            if p.get('both'):
                tx, ty = lean + 2, hy - hs * 0.9
                arm_to(lean - 0.5, sy, tx, ty, far=True, fist=False)
            if A and hasattr(A, 'TORSO_SIDE'):
                blit(pen, A, A.TORSO_SIDE, lean, top - 1)
            else:
                pen.poly([(lean - 2.6 * w, top), (lean + 2.6 * w, top), (lean + 2.4 * w, hip), (lean - 2.4 * w, hip)], outfit)
            if p.get('both'):
                tx, ty = lean + 2, hy - hs * 0.9
                draw_weapon(pen, ch, tx, ty, -90, 1)
                head_full(pen, ch, hx + 0.5, hy, hs, view, p['hurt'], p['glow'])
                arm_to(lean + 1, sy, tx, ty, fist=False)
                fist_at(tx, ty)
            elif p.get('plant'):
                head_full(pen, ch, hx + 0.5, hy, hs, view, p['hurt'], p['glow'])
                tx, ty = lean + 4, top + 6
                draw_weapon(pen, ch, tx, ty, 90, 1)
                arm_to(lean + 1, sy, tx, ty)
            else:
                head_full(pen, ch, hx + 0.5, hy, hs, view, p['hurt'], p['glow'])
                tx, ty = lean + 8, top + 5
                draw_weapon(pen, ch, tx, ty, 0, 1)
                arm_to(lean + 1, sy, tx, ty)
            pauldron(lean - 0.5, top + 3)
            return
        draw_tails(pen, ch, 'back' if back else 'front', bob, t)
        wings(pen, ch, view, top, lean, t)
        cape_back()
        back_hair(pen, ch, hx + sdx, hy, hs, view, hair, bob)
        wsx = -sh if front else sh
        leg(lean - 1.7 * w + sdx * 0.4, 0, 0)
        leg(lean + 1.7 * w + sdx * 0.4, 0, 0)
        tx = ty = None
        if p.get('both'):
            tx, ty = lean + sdx, hy - hs * 0.9
            if back:
                draw_weapon(pen, ch, tx, ty, -90, 1)
            arm_to(lean - sh * 0.95, sy, tx, ty, fist=False)
            arm_to(lean + sh * 0.95, sy, tx, ty, fist=False)
        elif p.get('spinOut') and back:
            tx, ty = lean + sh + 6, top + 5
            draw_weapon(pen, ch, tx, ty, 0, 1)
        torso(lean)
        extras(pen, ch, view, top, hip, lean, sdx, t)
        cape_over()
        wings(pen, ch, view, top, lean, t, over=True)
        back_hair_over(pen, ch, hx + sdx, hy, hs, view, hair)
        po = max(sh + 1.2, hs + 0.3) if ch.get('pauldronSize', 1.0) > 1.1 else sh + 0.5
        if p.get('spinOut'):
            arm(lean - wsx * 0.95, sy, 90 if front else 90)
            if back:
                arm_to(lean + sh * 0.95, sy, tx, ty)
        elif p.get('plant') and front:
            tx, ty = lean + sdx, top + 7
            arm_to(lean - sh * 0.95, sy, tx - 1.5, ty, fist=False)
            arm_to(lean + sh * 0.95, sy, tx + 1.5, ty, fist=False)
        elif p.get('plant') and back:
            arm(lean - sh * 0.95, sy, 100, far=True)
            arm(lean + sh * 0.95, sy, 80, far=True)
        pauldron(lean - po + sdx * 0.3, top + 2, far=view == 'front3q')
        pauldron(lean + po + sdx * 0.3, top + 2, far=view == 'back3q')
        head_full(pen, ch, hx + sdx, hy, hs, view, p['hurt'], p['glow'])
        if p.get('both') and front:
            draw_weapon(pen, ch, tx, ty, -90, 1)
            fist_at(tx - 1.5, ty); fist_at(tx + 1.5, ty, True)
        elif p.get('both') and back:
            fist_at(tx - 1.5, ty); fist_at(tx + 1.5, ty, True)
        elif p.get('plant') and front:
            draw_weapon(pen, ch, tx, ty - 1, 90, 1)
            fist_at(tx - 1.5, ty); fist_at(tx + 1.5, ty, True)
        elif p.get('spinOut') and front:
            tx, ty = lean - sh - 6 + sdx, top + 5
            arm_to(lean - sh * 0.95 + sdx, sy, tx, ty, fist=False)
            draw_weapon(pen, ch, tx, ty, 180, -1)
            fist_at(tx, ty, True)

    # --- ángulos de brazos y arma (en la vista de frente: 90 = abajo, 0 = derecha de la pantalla)
    swing = p['swing']
    idle_hold = wpn.get('hold')        # 'across' = arma cruzada delante (Garen)
    if p['hurt']:
        wa_ang, oa_ang = 150, 30
    elif swing is not None:
        wa_ang, oa_ang = swing, 110
    elif p['reach'] > 0:
        wa_ang, oa_ang = 30 - p['reach'] * 30, 100
    elif p['raise_'] > 0:
        wa_ang, oa_ang = -100 - 15 * p['raise_'], -80 + 15 * p['raise_']
    else:
        wa_ang, oa_ang = 80 + p['arm'] * 22, 100 - p['arm'] * 22
    grip = wpn.get('grip', -30)

    if p.get('spinOut') or p.get('plant') or p.get('both'):
        special_pose()
        return

    # ------------------------------------------------ lateral (mirando a la derecha)
    if side:
        draw_tails(pen, ch, 'side', bob, t)
        wings(pen, ch, view, top, lean, t)
        cape_back()
        back_hair(pen, ch, hx, hy, hs, view, hair, bob)
        ph = p['leg']
        leg(lean - 1, max(0, -ph) * 1.5, -ph * 2.2)
        far_ang = 180 - oa_ang if swing is None else 125
        arm(lean - 0.5, top + 2.5, far_ang, far=True)
        leg(lean + 1, max(0, ph) * 1.5, ph * 2.2)
        if A and hasattr(A, 'TORSO_SIDE'):
            blit(pen, A, A.TORSO_SIDE, lean, top - 1)
            chest_ = None
        else:
            pen.poly([(lean - 2.6 * w, top), (lean + 2.6 * w, top), (lean + 2.4 * w, hip), (lean - 2.4 * w, hip)], outfit)
            chest_ = chest
        if chest_:
            pen.poly([(lean, top + 1), (lean + 2.5 * w, top + 1), (lean + 2.3 * w, hip - 2), (lean + 0.5, hip - 2)], chest)
        if ch.get('belt'):
            pen.rect(lean - 2.4 * w, hip - 2, lean + 2.4 * w, hip - 1, hexc(ch['belt']), shadeR=False)
        if ch.get('skirt'):
            sk = hexc(ch['skirt'])
            pen.poly([(lean - 2.4 * w, hip - 1), (lean + 2.4 * w, hip - 1), (lean + 3.5 * w, hip + 2.5), (lean - 3.5 * w, hip + 2.5)], sk)
        extras(pen, ch, view, top, hip, lean, 0, t)
        head_full(pen, ch, hx + 0.5, hy, hs, view, p['hurt'], p['glow'])
        if idle_hold == 'across' and swing is None and not p['hurt'] and p['reach'] == 0 and p['raise_'] == 0:
            a = 40
            hxx, hyy = arm(lean + 1, top + 3, 70, length=5)
            draw_weapon(pen, ch, hxx, hyy, -10, 1)
        else:
            a = wa_ang if (swing is not None or p['reach'] > 0 or p['raise_'] > 0 or p['hurt']) else 80 - p['arm'] * 30
            if p['reach'] > 0:
                a = -10 + (1 - p['reach']) * 40
            hxx, hyy = arm(lean + 1, top + 2.5, a)
            draw_weapon(pen, ch, hxx, hyy, a + grip, 1, p.get('smear'))
        pauldron(lean - 0.5, top + 3)
        return

    # ------------------------------------------------ frente / espalda
    draw_tails(pen, ch, 'back' if back else 'front', bob, t)
    wings(pen, ch, view, top, lean, t)
    cape_back()
    back_hair(pen, ch, hx + sdx, hy, hs, view, hair, bob)
    wsx = -sh if front else sh          # mano del arma: la derecha del campeón
    across = idle_hold == 'across' and swing is None and not p['hurt'] and p['reach'] == 0 and p['raise_'] == 0
    if back:
        if across:
            # de espaldas sólo asoma la hoja por un lado, a la altura de la cadera
            draw_weapon(pen, ch, lean - 2, hip - 2, 0, -1)
        else:
            a = (180 - wa_ang) if swing is None else wa_ang
            hxx, hyy = arm(lean + wsx * 0.95, top + 2.5, a, far=True)
            draw_weapon(pen, ch, hxx, hyy, a + grip, -1, p.get('smear'))
    ph = p['leg']
    leg(lean - 1.7 * w + sdx * 0.4, max(0, ph) * 1.6, 0)
    leg(lean + 1.7 * w + sdx * 0.4, max(0, -ph) * 1.6, 0)
    if across and front:
        arm(lean + sh * 0.95, top + 2.5, 108, length=ch.get('holdLen', 6.5))
        arm(lean + wsx * 0.95, top + 2.5, 72, length=ch.get('holdLen', 6.5))
    torso(lean)
    extras(pen, ch, view, top, hip, lean, sdx, t)
    # brazo libre
    if across and front:
        pass
    else:
        oa = (180 - oa_ang) if front else oa_ang
        arm(lean - wsx * 0.95, top + 2.5, oa)
    cape_over()
    wings(pen, ch, view, top, lean, t, over=True)
    back_hair_over(pen, ch, hx + sdx, hy, hs, view, hair)
    po = max(sh + 1.2, hs + 0.3) if ch.get('pauldronSize', 1.0) > 1.1 else sh + 0.5
    pauldron(lean - po + sdx * 0.3, top + 2, far=view == 'front3q')
    pauldron(lean + po + sdx * 0.3, top + 2, far=view == 'back3q')
    head_full(pen, ch, hx + sdx, hy, hs, view, p['hurt'], p['glow'])
    if front:
        if across:
            L = ch.get('holdLen', 6.5)
            hxx = lean + wsx * 0.95 + math.cos(math.radians(72)) * L
            hyy = top + 2.5 + math.sin(math.radians(72)) * L
            ox = lean + sh * 0.95 + math.cos(math.radians(108)) * L
            draw_weapon(pen, ch, hxx + 1, hyy, wpn.get('acrossAng', 0), 1)
            if A and hasattr(A, 'FIST'):
                blit(pen, A, A.FIST, hxx, hyy - 2)
                blit(pen, A, A.FIST, ox + 1, hyy - 2, True)
            else:
                pen.ellipse(hxx, hyy, 1.9, 1.9, hands, soft=True)
                pen.ellipse(ox, hyy, 1.9, 1.9, hands, soft=True)
        else:
            a = (180 - wa_ang) if swing is not None else wa_ang
            if swing is None and p['reach'] == 0 and p['raise_'] == 0 and not p['hurt']:
                a = 180 - wa_ang
            wang = a + (-grip if swing is not None else grip)
            if p['reach'] > 0:
                # estocada: de frente no se ve "hacia delante"; el arma sale en diagonal hacia arriba
                a = 160 + p['reach'] * 25
                wang = a + 15
            if p['hurt']:
                a, wang = 150, 215
            hxx, hyy = arm(lean + wsx * 0.95, top + 2.5, a)
            draw_weapon(pen, ch, hxx, hyy, wang, 1, p.get('smear'))
