"""Sprites de campeones de LoL dibujados en código (pixel art "chibi").

Igual que PokéSurvivor dibuja en código sus terrenos, iconos y efectos, aquí
cada campeón se dibuja por partes (piernas, cuerpo, brazos, cabeza, pelo,
orejas, capa, colas, arma...) a partir de una ficha (lol/tools/pixel/champs.py)
y sale en el MISMO formato que las hojas de Mundo Misterioso que usa el motor:

    7 animaciones (Idle, Walk, Attack, Shoot, Charge, Hurt, Faint)
    × 8 direcciones (filas: S, SE, E, NE, N, NW, W, SW) × n fotogramas

Las direcciones del oeste son las del este en espejo. Tras dibujar, cada
fotograma recibe contorno oscuro de 1 px (como los sprites de PMD).

Coordenadas: (CX, FY) son los pies; y hacia abajo.
"""
import math
from PIL import Image, ImageDraw

K = (27, 21, 40, 255)          # contorno
CLEAR = (0, 0, 0, 0)

ANIMS = {
    # nombre: (ancho, alto, fotogramas, duración de cada uno en 1/60 s, ancla y)
    'Idle':   (48, 48, 6, [20, 8, 8, 14, 6, 14], 44),
    'Walk':   (48, 48, 6, [5, 5, 5, 5, 5, 5], 44),
    'Attack': (72, 72, 8, [3, 3, 2, 2, 2, 3, 3, 4], 54),
    'Shoot':  (64, 56, 6, [3, 3, 3, 4, 4, 4], 50),
    'Charge': (48, 64, 6, [4, 4, 4, 4, 4, 4], 58),
    'Hurt':   (48, 48, 2, [3, 9], 44),
    'Faint':  (64, 48, 3, [4, 6, 12], 44),
}
DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def shade(c, k):
    """k<1 oscurece (hacia un azul-violeta, como el sombreado de PMD), k>1 aclara."""
    r, g, b, a = c
    if k < 1:
        return (int(r * k), int(g * k), int(b * k + (1 - k) * 18), a)
    return (min(255, int(r + (255 - r) * (k - 1))), min(255, int(g + (255 - g) * (k - 1))),
            min(255, int(b + (255 - b) * (k - 1))), a)


class Pen:
    """Dibujo a 1× sin suavizado, con coordenadas relativas a los pies."""

    def __init__(self, w, h, cx, fy, flip=False):
        self.img = Image.new('RGBA', (w, h), CLEAR)
        self.d = ImageDraw.Draw(self.img)
        self.cx, self.fy, self.w, self.h = cx, fy, w, h

    def P(self, x, y):
        return (round(self.cx + x), round(self.fy + y))

    def rect(self, x0, y0, x1, y1, c, shadeR=True):
        a, b = self.P(x0, y0), self.P(x1, y1)
        if b[0] < a[0] or b[1] < a[1]:
            return
        self.d.rectangle([a, b], fill=c)
        if shadeR and b[0] - a[0] >= 2:
            self.d.line([(b[0], a[1]), b], fill=shade(c, 0.72))
        if b[1] - a[1] >= 3 and b[0] - a[0] >= 2:
            self.d.line([(a[0], a[1]), (b[0] - 1, a[1])], fill=shade(c, 1.18))

    def ellipse(self, x, y, rx, ry, c, light=True, soft=False):
        a, b = self.P(x - rx, y - ry), self.P(x + rx, y + ry)
        if light and rx >= 2.5:
            # base oscura y encima el color un poco desplazado: queda un borde
            # de sombra abajo a la derecha y un brillo arriba a la izquierda
            self.d.ellipse([a, b], fill=shade(c, 0.86 if soft else 0.72))
            a2, b2 = self.P(x - rx, y - ry), self.P(x + rx - 1, y + ry - 1)
            self.d.ellipse([a2, b2], fill=c)
            hx, hy = self.P(x - rx * 0.4, y - ry * 0.55)
            self.d.point((hx, hy), fill=shade(c, 1.28))
            if not soft:
                self.d.point((hx + 1, hy), fill=shade(c, 1.15))
        else:
            self.d.ellipse([a, b], fill=c)

    def poly(self, pts, c, edge=None):
        self.d.polygon([self.P(x, y) for x, y in pts], fill=c, outline=edge)

    def line(self, x0, y0, x1, y1, c, w=1):
        self.d.line([self.P(x0, y0), self.P(x1, y1)], fill=c, width=w)

    def px(self, x, y, c):
        p = self.P(x, y)
        if 0 <= p[0] < self.w and 0 <= p[1] < self.h:
            self.d.point(p, fill=c)


def outline(img, col=K):
    """Contorno de 1 px alrededor de todo lo opaco (vecinos en cruz)."""
    w, h = img.size
    src = img.load()
    out = img.copy()
    o = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] > 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 200:
                    o[x, y] = col
                    break
    return out


# ---------------------------------------------------------------- pose

def pose(anim, f, n):
    """Parámetros de la postura en un fotograma."""
    t = f / max(1, n)
    p = dict(bob=0, leg=0.0, arm=0.0, swing=None, reach=0.0, raise_=0.0, lean=0, fall=0.0, hurt=False, glow=0.0)
    if anim == 'Idle':
        # respira (sube y baja), parpadea y un brillo recorre el arma
        p['bob'] = [0, 0, 1, 1, 1, 0][f % 6]
        p['blink'] = f == 4
        p['gleam'] = {1: 0.0, 2: 0.5, 3: 1.0}.get(f)
    elif anim == 'Walk':
        ph = math.sin(t * 2 * math.pi)
        p['leg'] = ph * 1.8
        p['arm'] = -ph
        p['bob'] = [0, -1, -1, 0, -1, -1][f % 6]
        p['carry'] = True            # el arma baja a un lado (se ven las piernas)
        p['sway'] = [0, 1, 1, 0, -1, -1][f % 6]
    elif anim == 'Attack':
        # preparación atrás -> golpe -> se queda y vuelve
        seq = [-110, -130, -60, 20, 70, 85, 60, 20]
        p['swing'] = seq[f % len(seq)]
        p['lean'] = [0, -1, 0, 1, 2, 2, 1, 0][f % 8]
        p['smear'] = f in (3, 4)
    elif anim == 'Shoot':
        p['reach'] = [0.3, 0.7, 1.0, 1.0, 0.8, 0.4][f % 6]
        p['glow'] = [0, 0.5, 1, 0.8, 0.4, 0][f % 6]
        p['lean'] = [0, 1, 1, 1, 0, 0][f % 6]
    elif anim == 'Charge':
        p['raise_'] = [0.4, 0.8, 1.0, 1.0, 0.8, 0.6][f % 6]
        p['bob'] = [0, -1, -2, -2, -1, 0][f % 6]
        p['glow'] = [0.3, 0.6, 1, 1, 0.7, 0.4][f % 6]
    elif anim == 'Hurt':
        p['hurt'] = True
        p['lean'] = -2
    elif anim == 'Faint':
        p['fall'] = [0.35, 0.75, 1.0][f % 3]
    # ---- animaciones de habilidad (una por habilidad del campeón, ver ABIL)
    elif anim == 'slam':
        # agacharse, saltar con el arma arriba y caer golpeando (Garen Q)
        p['lift'] = [0, 3, 7, 8, 4, 0, 0, 0][f % 8]
        p['bob'] = [1, 0, 0, 0, 0, 1, 1, 0][f % 8]
        p['swing'] = [-60, -120, -140, -150, -40, 60, 75, 70][f % 8]
        p['lean'] = [0, 0, -1, -1, 1, 2, 2, 1][f % 8]
        p['smear'] = f in (4, 5)
        p['dust'] = [0, 0, 0, 0, 0, 1, 2, 3][f % 8]
    elif anim == 'spin':
        # gira sobre sí mismo con el arma extendida (Garen E): cada fotograma mira a otro lado
        p['spinOut'] = True
        p['turn'] = f
        p['whirl'] = True
        p['bob'] = f % 2
    elif anim == 'guard':
        # clava el arma delante y brilla (Garen W)
        p['plant'] = True
        p['aura'] = [0.3, 0.7, 1, 1, 0.7, 0.4][f % 6]
        p['bob'] = [0, 1, 1, 1, 0, 0][f % 6]
    elif anim == 'ult':
        # arma al cielo con las dos manos, destello y tajo hacia abajo (Garen R)
        seq = [None, None, None, None, -120, -20, 60, 70]
        p['swing'] = seq[f % 8]
        if p['swing'] is None:
            p['raise_'] = [0.5, 0.9, 1, 1][f % 8]
            p['both'] = True
        p['glow'] = [0.4, 0.8, 1, 1, 0.6, 0, 0, 0][f % 8]
        p['aura'] = [0, 0.5, 1, 1, 0.5, 0, 0, 0][f % 8]
        p['lift'] = [0, 1, 2, 2, 1, 0, 0, 0][f % 8]
        p['smear'] = f in (5, 6)
        p['dust'] = [0, 0, 0, 0, 0, 0, 1, 2][f % 8]
    elif anim == 'throw':
        # lanzar algo con la mano (el orbe de Ahri)
        p['reach'] = [0.2, 0.5, 1.0, 1.0, 0.7, 0.3][f % 6]
        p['glow'] = [0.3, 0.7, 1, 0.6, 0.2, 0][f % 6]
        p['lean'] = [0, 0, 2, 2, 1, 0][f % 6]
    elif anim == 'cast':
        # concentra magia: brazos arriba, brilla y flota un poco
        p['raise_'] = [0.4, 0.8, 1, 1, 0.8, 0.5][f % 6]
        p['glow'] = [0.4, 0.8, 1, 1, 0.7, 0.4][f % 6]
        p['aura'] = [0, 0.5, 1, 1, 0.5, 0][f % 6]
        p['lift'] = [0, 1, 2, 2, 1, 0][f % 6]
    elif anim == 'dash':
        # embestida: se inclina, se eleva y deja estela
        p['lean'] = [1, 3, 4, 4, 3, 1][f % 6]
        p['lift'] = [0, 2, 3, 3, 2, 0][f % 6]
        p['leg'] = [0.5, 1.5, 1.8, 1.8, 1.0, 0][f % 6]
        p['speedlines'] = f in (1, 2, 3, 4)
    return p


# Plantillas de animación de habilidad: fotogramas y duración (1/60 s).
ABIL = {
    'throw': (6, [3, 3, 3, 4, 4, 4]),
    'cast':  (6, [4, 4, 5, 5, 4, 4]),
    'dash':  (6, [2, 3, 3, 3, 3, 4]),
    'slam':  (8, [4, 4, 3, 3, 2, 3, 4, 6]),
    'spin':  (8, [2, 2, 2, 2, 2, 2, 2, 2]),
    'guard': (6, [3, 4, 5, 5, 4, 4]),
    'ult':   (8, [5, 5, 6, 6, 2, 2, 4, 8]),
}


def anims_of(ch):
    """Animaciones de un campeón: las 7 de siempre + una por habilidad (Q, W, E, R)."""
    out = {k: (v[2], v[3]) for k, v in ANIMS.items()}
    for key, kind in ch.get('abil', {}).items():
        out[key] = ABIL[kind]
    return out


def kind_of(ch, anim):
    return ch.get('abil', {}).get(anim, anim)


# ---------------------------------------------------------------- partes

def draw_weapon(pen, ch, hx, hy, ang, side_sign=1, smear=False):
    """Arma en la mano (hx, hy) apuntando con ángulo ang (grados, 0 = derecha, 90 = abajo)."""
    w = ch.get('weapon')
    if not w:
        return
    kind = w['kind']
    c = hexc(w.get('color', 'c8ccd8'))
    c2 = hexc(w.get('accent', 'e0b84a'))
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    L = w.get('len', {'greatsword': 17, 'sword': 13, 'katana': 14, 'axe': 15, 'greataxe': 17, 'staff': 16, 'spear': 18,
                      'mace': 13, 'anchor': 15, 'bow': 12, 'claws': 4, 'boomerang': 6, 'orb': 0, 'dagger': 7,
                      'crowstaff': 15, 'blade': 8, 'blowgun': 8, 'fist': 0}.get(kind, 12))
    if smear:
        # estela del golpe
        for k in range(1, 5):
            b = math.radians(ang - side_sign * k * 14)
            pen.line(hx + math.cos(b) * 4, hy + math.sin(b) * 4, hx + math.cos(b) * L, hy + math.sin(b) * L,
                     (255, 255, 255, 140 - k * 25), 2)
    ex, ey = hx + ux * L, hy + uy * L
    if kind in ('greatsword', 'sword', 'katana', 'dagger', 'spear'):
        width = 3 if kind == 'greatsword' else 1 if kind == 'spear' else 2
        if kind == 'spear':
            pen.line(hx - ux * 3, hy - uy * 3, ex, ey, hexc(w.get('shaft', '7a5a3a')), 1)
            pen.poly([(ex + ux * 4, ey + uy * 4), (ex - uy * 2, ey + ux * 2), (ex + uy * 2, ey - ux * 2)], c)
        else:
            if kind == 'greatsword':
                # hoja ancha: canto oscuro, cara clara, vaceo central y punta
                hw = 2.0
                bx0, by0 = hx + ux * 2, hy + uy * 2
                tx, ty = ex - ux * 2, ey - uy * 2
                pen.poly([(bx0 - uy * hw, by0 + ux * hw), (tx - uy * hw, ty + ux * hw), (ex + ux * 1.5, ey + uy * 1.5),
                          (tx + uy * hw, ty - ux * hw), (bx0 + uy * hw, by0 - ux * hw)], shade(c, 0.72))
                pen.poly([(bx0 - uy * (hw - 1), by0 + ux * (hw - 1)), (tx - uy * (hw - 1), ty + ux * (hw - 1)), (ex, ey),
                          (tx + uy * (hw - 0.4), ty - ux * (hw - 0.4)), (bx0 + uy * (hw - 0.4), by0 - ux * (hw - 0.4))], c)
                pen.line(bx0 + ux * 2, by0 + uy * 2, tx - ux * 2, ty - uy * 2, shade(c, 0.82), 1)
                pen.line(bx0 + ux * 2 + uy * 1, by0 + uy * 2 - ux * 1, tx - ux * 3 + uy * 1, ty - uy * 3 - ux * 1, shade(c, 1.3), 1)
            else:
                pen.line(hx + ux * 2, hy + uy * 2, ex, ey, shade(c, 0.7), width)
                pen.line(hx + ux * 2 - uy * 0.5, hy + uy * 2 + ux * 0.5, ex - ux - uy * 0.5, ey - uy + ux * 0.5, c, max(1, width - 1))
                pen.line(hx + ux * 3, hy + uy * 3, ex - ux * 2, ey - uy * 2, shade(c, 1.35), 1)
            # guarda y empuñadura
            g = 3.5 if kind == 'greatsword' else 2.5
            pen.line(hx + ux * 2 - uy * g, hy + uy * 2 + ux * g, hx + ux * 2 + uy * g, hy + uy * 2 - ux * g, c2, 2 if kind == 'greatsword' else 1)
            pen.line(hx - ux * 2.5, hy - uy * 2.5, hx + ux * 1.5, hy + uy * 1.5, shade(c2, 0.62), 2 if kind == 'greatsword' else 1)
            if kind == 'greatsword':
                pen.px(hx - ux * 3.5, hy - uy * 3.5, c2)
                pen.px(hx + ux * 2, hy + uy * 2, hexc(w.get('gem', 'e07030')))
    elif kind in ('axe', 'greataxe'):
        pen.line(hx - ux * 3, hy - uy * 3, ex, ey, hexc(w.get('shaft', '5a3a2a')), 2 if kind == 'greataxe' else 1)
        s = 5 if kind == 'greataxe' else 4
        bx, by = ex - ux * 3, ey - uy * 3
        pen.poly([(bx, by), (bx - uy * s + ux * 3, by + ux * s + uy * 3), (bx - uy * s - ux * 4, by + ux * s - uy * 4),
                  (bx - ux * 2, by - uy * 2)], c)
        if kind == 'greataxe':
            pen.poly([(bx, by), (bx + uy * s + ux * 3, by - ux * s + uy * 3), (bx + uy * s - ux * 4, by - ux * s - uy * 4)], shade(c, 0.85))
    elif kind == 'staff':
        pen.line(hx - ux * 4, hy - uy * 4, ex, ey, hexc(w.get('shaft', '6a4a8a')), 1)
        pen.ellipse(ex, ey, 2, 2, c2, light=False)
    elif kind == 'mace':
        pen.line(hx - ux * 2, hy - uy * 2, ex, ey, hexc(w.get('shaft', '3a4048')), 2)
        pen.ellipse(ex, ey, 3.5, 3.5, c, light=True)
        for k in range(4):
            b = a + k * math.pi / 2 + math.pi / 4
            pen.px(ex + math.cos(b) * 4.5, ey + math.sin(b) * 4.5, c2)
    elif kind == 'anchor':
        pen.line(hx - ux * 3, hy - uy * 3, ex, ey, c, 2)
        pen.line(ex - uy * 5, ey + ux * 5, ex + uy * 5, ey - ux * 5, c, 2)
        pen.px(ex - uy * 5 - ux, ey + ux * 5 - uy, c)
        pen.px(ex + uy * 5 - ux, ey - ux * 5 - uy, c)
        pen.ellipse(hx - ux * 4, hy - uy * 4, 1.5, 1.5, c2, light=False)
    elif kind == 'bow':
        # arco vertical delante de la mano
        px, py = -uy, ux
        pts = [(hx + px * 6 * math.cos(s) + ux * 3 * math.sin(s) * 0 + ux * (2 - 2 * abs(math.cos(s))) * 1.5,
                hy + py * 6 * math.cos(s) + uy * (2 - 2 * abs(math.cos(s))) * 1.5) for s in [i / 10 * math.pi for i in range(11)]]
        for i in range(len(pts) - 1):
            pen.line(*pts[i], *pts[i + 1], c, 1)
        pen.line(*pts[0], *pts[-1], (230, 230, 240, 200), 1)
    elif kind == 'claws':
        for k in (-1, 0, 1):
            pen.line(hx + ux * 1 + uy * k * 1.2, hy + uy * 1 - ux * k * 1.2, hx + ux * (L + 1) + uy * k * 1.6, hy + uy * (L + 1) - ux * k * 1.6, c, 1)
    elif kind == 'boomerang':
        pen.line(hx - uy * 4, hy + ux * 4, hx + ux * 2, hy + uy * 2, c, 2)
        pen.line(hx + ux * 2, hy + uy * 2, hx + uy * 4 + ux * 3, hy - ux * 4 + uy * 3, c, 2)
    elif kind == 'blowgun':
        pen.line(hx - ux * 2, hy - uy * 2, hx + ux * 7, hy + uy * 7, c, 2)
        pen.line(hx + ux * 7, hy + uy * 7, hx + ux * 8, hy + uy * 8, c2, 2)
    elif kind == 'blade':
        # hoja curva (media luna) de Renekton
        pen.line(hx - ux * 2, hy - uy * 2, hx + ux * 4, hy + uy * 4, hexc(w.get('shaft', '6a4a2a')), 2)
        pts = []
        for k in range(9):
            b_ = a + math.radians(-70 + k * 17.5)
            pts.append((hx + ux * 4 + math.cos(b_) * 8, hy + uy * 4 + math.sin(b_) * 8 - 0))
        inner = [(hx + ux * 7 + math.cos(a + math.radians(70 - k * 17.5)) * 4, hy + uy * 7 + math.sin(a + math.radians(70 - k * 17.5)) * 4) for k in range(9)]
        pen.poly(pts + inner, c)
        pen.line(*pts[3], *pts[6], shade(c, 1.3), 1)
    elif kind == 'crowstaff':
        pen.line(hx - ux * 4, hy - uy * 4, ex, ey, hexc(w.get('shaft', '3a3040')), 1)
        pen.ellipse(ex, ey - 1, 2.2, 1.6, c, light=False)
        pen.px(ex + 2, ey - 1, c2)
        pen.px(ex - 1, ey - 2, (255, 60, 60, 255))
    elif kind == 'fist':
        pass
    elif kind == 'orb':
        # orbe brillante: halo, cuerpo, núcleo blanco y chispas
        ox, oy = hx + ux * 3, hy + uy * 3 - 3
        pen.ellipse(ox, oy, 3.6, 3.6, shade(c, 0.7)[:3] + (120,), light=False)
        pen.ellipse(ox, oy, 2.8, 2.8, c, light=False)
        pen.ellipse(ox - 0.4, oy - 0.4, 1.6, 1.6, shade(c, 1.45), light=False)
        pen.px(ox - 1, oy - 1, (255, 255, 255, 255))
        for dx, dy in ((4, -3), (-4, 2), (3, 4), (-3, -4)):
            pen.px(ox + dx, oy + dy, shade(c, 1.3)[:3] + (200,))


def draw_tails(pen, ch, view, bob, t):
    tails = ch.get('tails')
    if not tails:
        return
    n, col = tails.get('n', 1), hexc(tails['color'])
    tip = hexc(tails.get('tip', tails['color']))
    base_y = -9 + bob
    for i in range(n):
        spread = (i - (n - 1) / 2) * (1.1 if n > 1 else 0)
        sway = math.sin(t * 6.28 + i) * 1.2
        if view == 'side':
            ang = math.radians(200 + spread * 14 + sway * 6)
            x0, y0 = -3, base_y
        else:
            ang = math.radians(-90 + spread * 22 + sway * 4) if view == 'back' else math.radians(-90 + spread * 26 + sway * 4)
            x0, y0 = 0, base_y
        L = tails.get('len', 9)
        pts = []
        for s in range(L):
            k = s / L
            pts.append((x0 + math.cos(ang) * s + math.sin(k * 3 + i) * 0.6, y0 + math.sin(ang) * s - k * k * 4))
        for s, (x, y) in enumerate(pts):
            r = tails.get('w', 2.2) * (1 - s / (L * 1.4))
            pen.ellipse(x, y, max(1, r), max(1, r), tip if s > L * 0.7 else col, light=False)


def draw_cape(pen, ch, view, top, bob, t, front_layer):
    cape = ch.get('cape')
    if not cape:
        return
    col, trim = hexc(cape['color']), hexc(cape.get('trim', cape['color']))
    flap = math.sin(t * 6.28) * 1
    w = ch.get('width', 1.0)
    if view == 'back' and front_layer:
        pen.poly([(-5 * w, top + 1), (5 * w, top + 1), (6 * w + flap, -2 + bob), (-6 * w + flap, -2 + bob)], col)
        pen.line(-6 * w + flap, -2 + bob, 6 * w + flap, -2 + bob, trim, 1)
        pen.line(0, top + 3, flap * 0.5, -3 + bob, shade(col, 0.75), 1)
    elif view == 'side' and not front_layer:
        pen.poly([(-1, top + 1), (-4, top + 1), (-8 + flap, -2 + bob), (-3 + flap, -2 + bob)], col)
        pen.line(-8 + flap, -2 + bob, -3 + flap, -2 + bob, trim, 1)
    elif view == 'front' and not front_layer:
        pen.poly([(-6 * w, top + 1), (6 * w, top + 1), (7 * w + flap, -2 + bob), (-7 * w + flap, -2 + bob)], shade(col, 0.8))


def draw_head(pen, ch, view, hx, hy, glow=0.0, hurt=False):
    hs = ch.get('head', 6.0) * 1.3
    skin = hexc(ch['skin'])
    hair = hexc(ch.get('hair', ch['skin']))
    shape = ch.get('headShape', 'round')
    ears = ch.get('ears')
    # orejas por detrás de la cabeza
    if ears:
        ec, ei = hexc(ears['color']), hexc(ears.get('inner', 'ffb0c8'))
        ek = ears['kind']
        for s in (-1, 1):
            if view == 'side' and s < 0:
                continue
            ox = s * hs * 0.6 if view != 'side' else -1
            if ek == 'fox':
                pen.poly([(hx + ox - 2.5, hy - hs + 2), (hx + ox + s * 1.5, hy - hs - 5), (hx + ox + 2.5, hy - hs + 1)], ec)
                pen.px(hx + ox + s * 0.5, hy - hs - 2, ei)
            elif ek == 'yordle':
                pen.poly([(hx + s * hs * 0.7, hy - 2), (hx + s * (hs + 7), hy - 6), (hx + s * hs * 0.8, hy + 1)], ec)
                pen.line(hx + s * (hs + 1), hy - 2, hx + s * (hs + 5), hy - 4.5, ei, 1)
            elif ek == 'wolf' or ek == 'bear':
                r = 2 if ek == 'bear' else 1.5
                if ek == 'bear':
                    pen.ellipse(hx + ox, hy - hs + 1, r, r, ec, light=False)
                else:
                    pen.poly([(hx + ox - 2, hy - hs + 2), (hx + ox, hy - hs - 3), (hx + ox + 2, hy - hs + 2)], ec)
            elif ek == 'monkey':
                pen.ellipse(hx + s * hs, hy, 1.6, 2, ec, light=False)
    # cabeza
    if shape == 'helmet':
        hc = hexc(ch.get('helmet', '8a6a3a'))
        pen.ellipse(hx, hy, hs + 0.5, hs + 0.5, hc)
        if view != 'back':
            fx = 1.5 if view == 'side' else 0
            pen.ellipse(hx + fx, hy + 0.5, hs * 0.45, hs * 0.45, hexc(ch.get('visor', '7fe0ff')), light=False)
            pen.px(hx + fx - 1, hy - 0.5, (255, 255, 255, 255))
        for k in range(3):
            b = math.radians(200 + k * 70)
            pen.px(hx + math.cos(b) * (hs + 0.5), hy + math.sin(b) * (hs + 0.5), hexc(ch.get('rivets', 'e0b84a')))
        return
    if shape == 'snout':
        pen.ellipse(hx, hy, hs, hs - 0.5, skin)
        if view != 'back':
            sx = 3 if view == 'side' else 0
            sy = 2.5
            pen.ellipse(hx + sx, hy + sy, hs * 0.55, hs * 0.38, shade(skin, 1.1), light=False)
            pen.px(hx + sx + (2 if view == 'side' else 0), hy + sy - 1, K)
    elif shape == 'bug':
        pen.ellipse(hx, hy, hs, hs - 1, skin)
        if view != 'back':
            fx = 2 if view == 'side' else 0
            pen.line(hx + fx - 2, hy + 3, hx + fx - 3, hy + 6, shade(skin, 0.6), 1)
            pen.line(hx + fx + 2, hy + 3, hx + fx + 3, hy + 6, shade(skin, 0.6), 1)
            eye = hexc(ch.get('eyes', 'ff4080'))
            pen.px(hx + fx - 2, hy, eye); pen.px(hx + fx + 2, hy, eye)
    elif shape == 'rock':
        pen.poly([(hx - hs, hy + 2), (hx - hs + 1, hy - hs + 1), (hx + 1, hy - hs - 1), (hx + hs, hy - 2), (hx + hs - 1, hy + hs - 1), (hx - 2, hy + hs)], skin)
        pen.poly([(hx - 1, hy - 1), (hx + hs - 1, hy - 2), (hx + hs - 2, hy + hs - 2), (hx - 1, hy + hs - 1)], shade(skin, 0.8))
    else:
        pen.ellipse(hx, hy, hs, hs, skin, soft=True)
    # pelo
    hstyle = ch.get('hairStyle', 'short')
    if shape in ('round', 'snout', 'bug', 'rock'):
        if hstyle == 'short':
            pen.d.chord([pen.P(hx - hs - 0.5, hy - hs - 0.5), pen.P(hx + hs + 0.5, hy + hs * 0.3)], 180, 360, fill=hair)
            if view == 'back':
                pen.ellipse(hx, hy - 0.5, hs, hs - 0.5, hair)
            elif view == 'side':
                pen.poly([(hx - hs, hy - 2), (hx - hs + 1, hy + 3), (hx - 1, hy - 1)], hair)
        elif hstyle == 'long':
            pen.d.chord([pen.P(hx - hs - 0.5, hy - hs - 0.5), pen.P(hx + hs + 0.5, hy + hs * 0.4)], 180, 360, fill=hair)
            if view == 'back':
                pen.poly([(hx - hs, hy - 2), (hx + hs, hy - 2), (hx + hs + 1, hy + hs + 5), (hx - hs - 1, hy + hs + 5)], hair)
            elif view == 'side':
                pen.poly([(hx - hs, hy - 3), (hx, hy - 3), (hx - 2, hy + hs + 4), (hx - hs - 1, hy + hs + 4)], hair)
            else:
                pen.rect(hx - hs - 1, hy - 1, hx - hs + 1, hy + hs + 3, hair, shadeR=False)
                pen.rect(hx + hs - 1, hy - 1, hx + hs + 1, hy + hs + 3, hair, shadeR=False)
        elif hstyle == 'ponytail':
            pen.d.chord([pen.P(hx - hs - 0.5, hy - hs - 0.5), pen.P(hx + hs + 0.5, hy + hs * 0.2)], 180, 360, fill=hair)
            tx = -hs - 1 if view == 'side' else 0
            if view != 'front':
                pen.poly([(hx + tx, hy - hs + 1), (hx + tx - 3, hy - hs + 3), (hx + tx - 5, hy + 6), (hx + tx - 1, hy + 8)], hair)
            else:
                pen.poly([(hx - 1, hy - hs - 1), (hx + 1, hy - hs - 1), (hx + 4, hy - hs - 4), (hx + 1, hy - hs - 3)], hair)
        elif hstyle == 'spiky':
            pen.d.chord([pen.P(hx - hs - 0.5, hy - hs - 0.5), pen.P(hx + hs + 0.5, hy + hs * 0.2)], 180, 360, fill=hair)
            for k in range(5):
                x = hx - hs + k * hs / 2
                pen.poly([(x - 1.5, hy - hs + 1), (x + 1.5, hy - hs + 1), (x + (k - 2) * 0.6, hy - hs - 3)], hair)
        elif hstyle == 'hood':
            pen.d.chord([pen.P(hx - hs - 1, hy - hs - 1.5), pen.P(hx + hs + 1, hy + hs + 1)], 160, 380, fill=hair)
            if view == 'back':
                pen.ellipse(hx, hy, hs + 1, hs + 1, hair)
        elif hstyle == 'topknot':
            pen.d.chord([pen.P(hx - hs - 0.5, hy - hs - 0.5), pen.P(hx + hs + 0.5, hy + hs * 0.1)], 180, 360, fill=hair)
            pen.ellipse(hx, hy - hs - 1.5, 2, 1.6, hair, light=False)
        elif hstyle == 'bald':
            pass
    # cara
    if view != 'back' and shape in ('round',):
        fx = 2 if view == 'side' else (1 if view == 'front3q' else 0)
        eye = hexc(ch.get('eyes', '1b1528'))
        ey = hy + 1
        if view == 'side':
            pen.rect(hx + fx + 2, ey, hx + fx + 3, ey + 2, eye, shadeR=False)
            pen.px(hx + fx + 2, ey, (255, 255, 255, 255))
        else:
            for s in (-1, 1):
                ex = hx + fx + s * 2.6
                pen.rect(ex - 0.5, ey, ex + 0.5, ey + 2, eye, shadeR=False)
                pen.px(ex - 0.5, ey, (255, 255, 255, 255))
            pen.px(hx + fx - 4, ey + 3, shade(skin, 0.9)); pen.px(hx + fx + 4, ey + 3, shade(skin, 0.9))
        if hurt:
            pen.px(hx + fx, ey + 3, K)
    # adornos de la cabeza (casco de Garen, máscara, cuernos, corona...)
    for orn in ch.get('headOrn', []):
        kind, col = orn['kind'], hexc(orn['color'])
        if kind == 'horns':
            for s in (-1, 1):
                if view == 'side' and s < 0:
                    continue
                ox = s * hs * 0.6 if view != 'side' else 1
                pen.poly([(hx + ox - 1, hy - hs + 2), (hx + ox + s * 3, hy - hs - 4), (hx + ox + 1.5, hy - hs + 2)], col)
        elif kind == 'crown':
            pen.rect(hx - hs + 1, hy - hs - 1, hx + hs - 1, hy - hs, col, shadeR=False)
            for k in range(3):
                pen.px(hx - hs + 2 + k * (hs - 1), hy - hs - 2, col)
        elif kind == 'band':
            pen.line(hx - hs, hy - 2, hx + hs, hy - 2, col, 1)
            if view != 'front':
                pen.line(hx - hs, hy - 2, hx - hs - 3, hy, col, 1)
        elif kind == 'mask':
            if view != 'back':
                fx = 2 if view == 'side' else 0
                pen.rect(hx + fx - hs + 1, hy - 0.5, hx + fx + hs - 1, hy + 1.5, col, shadeR=False)
        elif kind == 'spikes':
            for k in range(4):
                b = math.radians(200 + k * 45)
                x, y = hx + math.cos(b) * hs, hy + math.sin(b) * hs
                pen.poly([(x - 1, y + 1), (x + math.cos(b) * 3, y + math.sin(b) * 3), (x + 1, y + 1)], col)
        elif kind == 'hat':
            pen.ellipse(hx, hy - hs + 1, hs + 2, 2, col, light=False)
            pen.d.chord([pen.P(hx - hs + 0.5, hy - hs - 4), pen.P(hx + hs - 0.5, hy - hs + 4)], 180, 360, fill=col)
            if orn.get('feather'):
                pen.line(hx + 2, hy - hs - 1, hx + 5, hy - hs - 5, hexc(orn['feather']), 1)
        elif kind == 'plume':
            pen.poly([(hx - 1, hy - hs), (hx + 1, hy - hs), (hx - 3, hy - hs - 5)], col)
    # brillo de lanzamiento en los ojos
    if glow > 0.6 and view != 'back':
        pen.px(hx, hy - hs - 2, (255, 255, 220, 200))


def draw_humanoid(pen, ch, view, p, t):
    """Un humanoide en 'front', 'front3q', 'side', 'back3q' o 'back' (mirando a la derecha en los laterales)."""
    sc = ch.get('size', 1.0) * 1.3
    w = ch.get('width', 1.0) * sc
    legL = 6 * ch.get('legs', 1.0) * sc
    bodyH = 9 * sc
    hs = ch.get('head', 6.0) * 1.3
    bob = p['bob']
    skin = hexc(ch['skin'])
    outfit = hexc(ch['outfit'])
    outfit2 = hexc(ch.get('outfit2', ch['outfit']))
    legs_c = hexc(ch.get('legsColor', ch.get('outfit', '444466')))
    boots = hexc(ch.get('boots', '4a3a32'))
    arms_c = hexc(ch.get('arms', ch.get('outfit2', ch['outfit'])))
    lean = p['lean']
    top = -legL - bodyH + bob            # parte de arriba del cuerpo
    hip = -legL + bob
    hx, hy = lean, top - hs + 2           # centro de la cabeza
    side = view == 'side'
    front = view in ('front', 'front3q')
    back = view in ('back', 'back3q')

    # pierna (x, levantada)
    def leg(x, lift, fwd):
        pen.rect(x - 1.2 * w + fwd, hip, x + 1.2 * w + fwd, -1 - lift, legs_c)
        pen.rect(x - 1.5 * w + fwd, -2 - lift, x + 1.5 * w + fwd + (1 if side else 0), 0 - lift, boots, shadeR=False)

    # brazo: hombro (sx, sy) -> mano; devuelve la mano
    def arm(sx, sy, ang, length=7 * sc, col=arms_c):
        a = math.radians(ang)
        ex, ey = sx + math.cos(a) * length, sy + math.sin(a) * length
        pen.line(sx, sy, ex, ey, shade(col, 0.8), max(3, round(2.4 * w)))
        pen.line(sx - 0.5, sy - 0.5, ex - 0.5, ey - 0.5, col, max(2, round(1.6 * w)))
        pen.ellipse(ex, ey, 1.8, 1.8, hexc(ch.get('hands', ch['skin'])), light=True, soft=True)
        return ex, ey

    # postura de los brazos
    swing = p['swing']
    if swing is not None:
        weapon_ang = swing
    elif p['reach'] > 0:
        weapon_ang = -20 + (1 - p['reach']) * 60
    elif p['raise_'] > 0:
        weapon_ang = -90 - 20 * p['raise_']
    else:
        weapon_ang = 75 + p['arm'] * 25
    other_ang = 100 - p['arm'] * 25 if swing is None else 110
    if p['raise_'] > 0:
        other_ang = -70 - 20 * p['raise_']
    if p['hurt']:
        weapon_ang, other_ang = 150, 30

    leg_ph = p['leg']
    if side:
        draw_tails(pen, ch, 'side', bob, t)
        draw_cape(pen, ch, 'side', top, bob, t, False)
        # brazo lejano
        arm(lean - 1, top + 2, 180 - other_ang if swing is None else 120, col=shade(arms_c, 0.8))
        leg(-1, max(0, -leg_ph) * 1.5, -leg_ph * 2.5)
        leg(1, max(0, leg_ph) * 1.5, leg_ph * 2.5)
        pen.rect(lean - 3 * w, top, lean + 3 * w, hip, outfit)
        if ch.get('belt'):
            pen.line(lean - 3 * w, hip - 2, lean + 3 * w, hip - 2, hexc(ch['belt']))
        draw_head(pen, ch, 'side', hx + 1, hy, p['glow'], p['hurt'])
        if ch.get('pauldrons'):
            pen.ellipse(lean, top + 1.5, 2.5 * w, 2, hexc(ch['pauldrons']))
        # brazo cercano con el arma (en side, ángulos espejados para mirar a la derecha)
        a = weapon_ang if swing is not None else (weapon_ang if p['reach'] > 0 or p['raise_'] > 0 else 80 - p['arm'] * 35)
        hxx, hyy = arm(lean + 1, top + 2, a)
        draw_weapon(pen, ch, hxx, hyy, a + ch.get('weapon', {}).get('grip', -30), 1, p.get('smear'))
        return
    # de frente o de espaldas
    sdx = 0 if view in ('front', 'back') else (1 if view == 'front3q' else -1)
    if front:
        draw_tails(pen, ch, 'front', bob, t)
        draw_cape(pen, ch, 'front', top, bob, t, False)
    else:
        draw_tails(pen, ch, 'back', bob, t)
    sx = 3.6 * w
    # arma por detrás si estamos de espaldas
    wsx = -sx if front else sx               # la mano del arma: derecha del campeón
    a_w = 180 - weapon_ang if (front and swing is not None) else weapon_ang
    if back:
        hxx, hyy = arm(lean + wsx, top + 2, 90 + (weapon_ang - 90) * 0.4 if swing is None else a_w)
        draw_weapon(pen, ch, hxx, hyy, (90 + (weapon_ang - 90) * 0.4 if swing is None else a_w) + ch.get('weapon', {}).get('grip', -30), -1, p.get('smear'))
    leg(-1.6 * w + sdx * 0.5, max(0, leg_ph) * 1.5, 0)
    leg(1.6 * w + sdx * 0.5, max(0, -leg_ph) * 1.5, 0)
    # cuerpo
    pen.rect(lean - 3.3 * w, top, lean + 3.3 * w, hip, outfit)
    if front and ch.get('chest'):
        pen.rect(lean - 1.5 * w + sdx, top + 1, lean + 1.5 * w + sdx, hip - 2, hexc(ch['chest']), shadeR=False)
    if ch.get('belt'):
        pen.line(lean - 3.3 * w, hip - 2, lean + 3.3 * w, hip - 2, hexc(ch['belt']))
    if ch.get('skirt'):
        sk = hexc(ch['skirt'])
        pen.poly([(lean - 3.3 * w, hip - 1), (lean + 3.3 * w, hip - 1), (lean + 4.5 * w, hip + 3), (lean - 4.5 * w, hip + 3)], sk)
    # brazo libre
    oa = other_ang if front else 180 - other_ang
    arm(lean - wsx, top + 2, oa)
    if back:
        draw_cape(pen, ch, 'back', top, bob, t, True)
    if ch.get('pauldrons'):
        pc = hexc(ch['pauldrons'])
        pen.ellipse(lean - sx + 0.5, top + 1, 2.2 * w, 1.8, pc)
        pen.ellipse(lean + sx - 0.5, top + 1, 2.2 * w, 1.8, pc)
    draw_head(pen, ch, view, hx + sdx, hy, p['glow'], p['hurt'])
    if front:
        a = a_w if swing is not None else (weapon_ang if p['reach'] > 0 or p['raise_'] > 0 else 180 - weapon_ang)
        if p['reach'] > 0:
            a = 90 - (90 - (-20 + (1 - p['reach']) * 60)) * 0.5   # hacia delante (abajo en pantalla)
        hxx, hyy = arm(lean + wsx, top + 2, a)
        draw_weapon(pen, ch, hxx, hyy, a + ch.get('weapon', {}).get('grip', -30), 1, p.get('smear'))


VIEW_OF = {'S': ('front', False), 'SE': ('front3q', False), 'E': ('side', False), 'NE': ('back3q', False),
           'N': ('back', False), 'NW': ('back3q', True), 'W': ('side', True), 'SW': ('front3q', True)}


# dónde sale el destello (respecto al centro y a los pies) según animación y vista
GLOW_AT = {('Shoot', 'front'): (-6, -12), ('Shoot', 'front3q'): (-4, -12), ('Shoot', 'side'): (10, -14),
           ('Shoot', 'back3q'): (6, -16), ('Shoot', 'back'): (6, -16),
           ('Charge', 'front'): (0, -34), ('Charge', 'front3q'): (0, -34), ('Charge', 'side'): (-2, -34),
           ('Charge', 'back3q'): (0, -34), ('Charge', 'back'): (0, -34)}


def raw_frame(ch, anim, f, dirname):
    """Fotograma en un lienzo grande (BIG×BIG, pies en (BIG/2, BAY))."""
    n = anims_of(ch)[anim][0]
    kind = kind_of(ch, anim)
    W = H = BIG
    ay = BAY
    p = pose(kind, f, n)
    if p.get('turn') is not None:
        dirname = DIRS[(DIRS.index(dirname) + p['turn']) % 8]
    view, mirror = VIEW_OF[dirname]
    pen = Pen(W, H, W // 2, ay)
    t = f / n
    draw = BODIES[ch.get('body', 'human')]
    if anim == 'Faint':
        # se dibuja de pie y se tumba
        tmp = Pen(W, H, W // 2, ay)
        draw(tmp, ch, view, pose('Hurt', 0, 2), 0)
        img = outline(tmp.img)
        ang = 90 * p['fall']
        img = img.rotate(-ang if not mirror else ang, center=(W // 2, ay), resample=Image.NEAREST)
        # que lo más bajo quede apoyado en el suelo (ay + 1), sin salirse
        bb = img.getbbox()
        dy = (ay + 1 - bb[3]) if bb else 0
        dx = int(-p['fall'] * 6) if not mirror else int(p['fall'] * 6)
        out = Image.new('RGBA', (W, H), CLEAR)
        out.paste(img, (dx, dy), img)
        return out.transpose(Image.FLIP_LEFT_RIGHT) if mirror else out
    glowc = hexc(ch.get('glow', 'ffe9a0'))
    if p.get('whirl'):
        # remolino: la mitad de atrás va detrás del muñeco
        ring(pen, glowc, f, back=True)
    draw(pen, ch, view, p, t)
    img = outline(pen.img)
    if p.get('aura'):
        # aura: segundo contorno del color del brillo, por fuera del oscuro
        a_ = int(90 + 165 * p['aura'])
        img = outline(img, glowc[:3] + (a_,))
        if p['aura'] > 0.6:
            img = outline(img, glowc[:3] + (int(a_ * 0.35),))
    if p.get('whirl'):
        top_ = Pen(W, H, W // 2, ay)
        ring(top_, glowc, f, back=False)
        img.alpha_composite(top_.img)
    if p.get('dust'):
        d = ImageDraw.Draw(img)
        k = p['dust']
        for s_ in (-1, 1):
            for j in range(2):
                x = W // 2 + s_ * (7 + k * 3 + j * 4)
                y = ay - 1 - k - j
                r = max(1, 3 - k * 0.6 - j)
                d.ellipse([x - r, y - r, x + r, y + r], fill=(236, 226, 200, max(60, 230 - k * 50 - j * 40)))
    if p.get('speedlines'):
        d = ImageDraw.Draw(img)
        back_dir = -1 if not mirror else 1     # detrás del campeón (en la vista sin espejo mira a la derecha)
        for k, (yy, ln) in enumerate(((-14, 10), (-9, 14), (-4, 9))):
            x0 = W // 2 + back_dir * 8
            d.line([(x0, ay + yy), (x0 + back_dir * ln, ay + yy)], fill=(255, 255, 255, 160 - k * 30), width=1)
    if p.get('lift'):
        moved = Image.new('RGBA', (W, H), CLEAR)
        moved.paste(img, (0, -p['lift']), img)
        img = moved
    # brillo de habilidad (Shoot/Charge)
    if p['glow'] > 0 and (anim in ('Shoot', 'Charge') or kind in ('ult', 'throw', 'cast')):
        glow = hexc(ch.get('glow', 'ffe9a0'))
        d = ImageDraw.Draw(img)
        # destello de 4 puntas (no un círculo plano)
        r = int(1 + p['glow'] * 3)
        gx, gy = GLOW_AT.get(('Charge' if kind in ('ult', 'cast') else 'Shoot' if kind == 'throw' else anim, view), (0, -30))
        gy -= p.get('lift', 0)
        gx = W // 2 + gx
        gy = ay + gy
        core = (255, 255, 255, 255)
        for k in range(1, r + 1):
            a_ = 255 if k < r else 150
            for dx, dy in ((k, 0), (-k, 0), (0, k), (0, -k)):
                d.point((gx + dx, gy + dy), fill=glow[:3] + (a_,))
        if r >= 2:
            for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
                d.point((gx + dx, gy + dy), fill=glow[:3] + (170,))
        d.point((gx, gy), fill=core)
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img


def ring(pen, col, f, back):
    """Estela circular a la altura de la cintura (giro)."""
    rx, ry, y = 20, 7, -9
    a0 = f * 45
    # el anillo entero, tenue (se ve que gira aunque el fotograma esté quieto)
    for k in range(24):
        a = math.radians(k * 15)
        if (math.sin(a) < 0) != back:
            continue
        pen.px(rx * math.cos(a), y + ry * math.sin(a), col[:3] + (90,))
    for k in range(10):
        a = math.radians(a0 + k * 22)
        if (math.sin(a) < 0) != back:
            continue
        x1, y1 = rx * math.cos(a), y + ry * math.sin(a)
        a2 = math.radians(a0 + k * 22 + 20)
        x2, y2 = rx * math.cos(a2), y + ry * math.sin(a2)
        al = int(255 - k * 18)
        pen.line(x1, y1, x2, y2, col[:3] + (al,), 3)
        pen.line(x1, y1, x2, y2, (255, 255, 255, al), 1)


BIG, BAY = 128, 96
_BOX = {}


def box(ch, anim):
    """Tamaño del hueco de una animación: lo justo para que no se corte nada en
    ningún fotograma ni dirección (centrado en x). Devuelve (w, h, ay)."""
    key = (id(ch), anim)
    if key not in _BOX:
        n = anims_of(ch)[anim][0]
        x0, y0, x1, y1 = BIG, BIG, 0, 0
        for d in DIRS:
            for f in range(n):
                bb = raw_frame(ch, anim, f, d).getbbox()
                if bb:
                    x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
        half = max(BIG // 2 - x0, x1 - BIG // 2) + 1
        half += half % 2
        top, bottom = y0 - 1, max(y1 + 1, BAY + 2)
        h = bottom - top
        h += h % 2
        _BOX[key] = (half * 2, h, BAY - top)
    return _BOX[key]


def render_frame(ch, anim, f, dirname):
    w, h, ay = box(ch, anim)
    img = raw_frame(ch, anim, f, dirname)
    return img.crop((BIG // 2 - w // 2, BAY - ay, BIG // 2 + w // 2, BAY - ay + h))




def render_sheet(ch, anim):
    W, H, ay = box(ch, anim)
    n = anims_of(ch)[anim][0]
    sheet = Image.new('RGBA', (W * n, H * 8), CLEAR)
    for r, dname in enumerate(DIRS):
        for f in range(n):
            sheet.paste(render_frame(ch, anim, f, dname), (f * W, r * H))
    return sheet


KEEP = {'skin', 'hands', 'eyes', 'hair', 'blush', 'beard', 'muzzle'}


def repaint(ch, fn, keep=KEEP):
    """Copia de la ficha con fn((r,g,b)) -> (r,g,b) aplicada a los colores (menos piel, ojos, pelo)."""
    def walk(v, k=None):
        if isinstance(v, dict):
            return {kk: walk(vv, kk) for kk, vv in v.items()}
        if isinstance(v, list):
            return [walk(x, k) for x in v]
        if isinstance(v, str) and k not in keep and len(v) == 6 and all(c in '0123456789abcdefABCDEF' for c in v):
            r, g, b = fn(tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)))
            return '%02x%02x%02x' % (int(r), int(g), int(b))
        return v
    out = walk(ch)
    out['_tint'] = fn          # también para las piezas dibujadas a mano (chibi.art)
    return out


def prestige(ch, fallback):
    """Ficha del aspecto de Prestigio: la de 'prestige' de la ficha (colores
    propios, también para las piezas dibujadas a mano) o, si no tiene, fallback."""
    if not ch.get('prestige'):
        return fallback(ch)

    def merge(a, b):
        out = dict(a)
        for k, v in b.items():
            out[k] = merge(a[k], v) if isinstance(v, dict) and isinstance(a.get(k), dict) else v
        return out
    out = merge(ch, ch['prestige'])
    out['_prestige'] = True
    return out


def meta_for(ch):
    a = {}
    for anim, (n, dur) in anims_of(ch).items():
        W, H, ay = box(ch, anim)
        a[anim] = {'w': W, 'h': H, 'n': n, 'r': 8, 'd': dur, 'ax': W / 2 - 0.5, 'ay': ay - 0.5}
    return {'s': ch.get('shadow', 1), 'a': a}


BODIES = {'human': draw_humanoid}

import chibi  # noqa: E402  (cuerpo chibi; importa piezas de este módulo)
BODIES['chibi'] = chibi.draw_chibi
