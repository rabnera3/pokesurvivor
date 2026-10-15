"""Avisa si algún fotograma toca el borde (el muñeco o el arma se salen del hueco)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import doll, champs
ids = [int(x) for x in sys.argv[1:]] or list(champs.CHAMPS)
bad = 0
for dex in ids:
    ch = champs.CHAMPS[dex]
    for anim, (_, _, n, _, _) in doll.ANIMS.items():
        W, H, ay = doll.box(ch, anim)
        for d in doll.DIRS:
            for f in range(n):
                im = doll.render_frame(ch, anim, f, d)
                bb = im.getbbox()
                if bb and (bb[0] == 0 or bb[1] == 0 or bb[2] == W or bb[3] == H):
                    bad += 1
                    print(f'{ch["name"]} {anim} {d} f{f}: bbox {bb} en {W}x{H}')
print('ok' if not bad else f'{bad} fotogramas tocan el borde')
