"""Hoja de contacto de un campeón: una fila por animación (todas sus
fotogramas mirando al sureste) y otra con las 8 direcciones.

    python3 lol/tools/pixel/preview.py salida.png 86 [zoom=4]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import doll, champs

out, dex = sys.argv[1], int(sys.argv[2])
Z = int(sys.argv[3]) if len(sys.argv) > 3 else 4
ch = champs.CHAMPS[dex]
C = 80
rows = []
for anim, (_, _, n, _, _) in doll.ANIMS.items():
    W, H, ay = doll.box(ch, anim)
    row = Image.new('RGBA', (C * 16, C), (86, 140, 80, 255))
    for f in range(n):
        fr = doll.render_frame(ch, anim, f, 'SE')
        row.alpha_composite(fr, (f * C + (C - W) // 2, C - 6 - ay))
    for i, d in enumerate(doll.DIRS):
        fr = doll.render_frame(ch, anim, min(n - 1, 1 if anim != 'Faint' else 2), d)
        row.alpha_composite(fr, ((8 + i) * C + (C - W) // 2, C - 6 - ay))
    rows.append(row)
sheet = Image.new('RGBA', (C * 16, C * len(rows)))
for i, r in enumerate(rows):
    sheet.paste(r, (0, i * C))
sheet.resize((sheet.width * Z // 2, sheet.height * Z // 2), Image.NEAREST).save(out)
