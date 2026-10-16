"""Ahri dibujada a mano, píxel a píxel (como art/garen.py).

Diseño: pelo negro largo con flequillo, orejas de zorro negras por fuera y
rojas por dentro, ojos grandes negros con brillo, mejillas rosadas, traje rojo
con cuello y falda blancos, medias blancas con bandas rojas y nueve colas
blancas muy esponjosas detrás.
"""

PAL = {
    'K': '1b1528',
    # pelo
    'a': '0f0d16', 'b': '1f1c2a', 'c': '34303f', 'd': '57526a',
    # interior de las orejas
    'r': 'b02c50', 'R': 'e85c80',
    # piel
    's': 'e8b2a6', 't': 'fde0d6', 'u': 'fff3ec',
    # ojos, mejillas, boca
    'e': '1a1424', 'w': 'ffffff', 'p': 'f49aae', 'm': 'd2486a',
    # tela roja
    '1': '6a1228', '2': 'a62240', '3': 'd03a5a', '4': 'f07090',
    # tela blanca (y colas)
    '5': 'a6a2c0', '6': 'd6d4e6', '7': 'f6f4fb', '8': 'ffffff',
}

# Cabeza de frente (18 × 21): orejas arriba, ojos en las columnas 5-6 y 11-12.
HEAD_FRONT = [
    #012345678901234567
    "...K..........K...",
    "..KbK........KbK..",
    "..KbrK......KrbK..",
    ".KbrrbK....KbrrbK.",
    ".KbrRrbKKKKbrRrbK.",
    "KbbrrbbccccbbrrbbK",
    "KabbbbcddccbbbbbaK",
    "KabbbcddcbbbbbbbaK",
    "KabbbbbbbbbbbbbbaK",
    "KabbabbbbbbbbabbaK",
    "KabbtbbtbbtbbtbbaK",
    "KabbttttttttttbbaK",
    "KabbtKKttttKKtbbaK",
    "KabbtwettttwetbbaK",
    "KabbteetttteetbbaK",
    "KabbppttttttppbbaK",
    "KabbttttmmttttbbaK",
    "KabbbsttttttsbbbaK",
    ".KabbbssttssbbbaK.",
    ".KabbbKssssKbbbaK.",
    "..KaaK.KKKK.KaaK..",
]

HEAD_3Q = [
    "...K..........K...",
    "..KbK........KbK..",
    "..KbrK......KrbK..",
    ".KbrrbK....KbrbK..",
    ".KbrRrbKKKKbrRbK..",
    "KbbrrbbccccbbrrbbK",
    "KabbbbcddccbbbbbaK",
    "KabbbcddcbbbbbbbaK",
    "KabbbbbbbbbbbbbbaK",
    "KabbbabbbbbbbabbaK",
    "KabbbbbtbbtbbtbbaK",
    "KabbbttttttttttbaK",
    "KabbbtKttttKKttbaK",
    "KabbbtettttwettbaK",
    "KabbbtetttteettbaK",
    "KabbbptttttttppbaK",
    "KabbbtttttmmtttbaK",
    "KabbbbstttttttbbaK",
    ".KabbbbssttssbbaK.",
    ".KabbbbKssssKbbaK.",
    "..KaaK..KKKK.KaK..",
]
HEAD_SIDE = [
    ".......K..........",
    "......KbK.........",
    "......KbrK........",
    ".....KbrrbK.......",
    "....KbbrRrbKK.....",
    "..KKbbbrrbbbbKK...",
    ".KabbbbbbbcddcbK..",
    "KabbbbbbbcddbbbbK.",
    "KabbbbbbbbbbbbbbK.",
    "KabbbbbbbbbbbbtbK.",
    "KabbbbbbbbbtbbttK.",
    "KabbbbbbbbtttttttK",
    "KabbbbbbbbtttKKttK",
    "KabbbbbbbbtttweutK",
    "KabbbbbbbbttteettK",
    "KabbbbbbbbtppttttK",
    "KabbbbbbbbttttmttK",
    "KabbbbbbbbsttttsK.",
    ".KabbbbbbbbssssK..",
    ".KabbbbbbbKKKK....",
    "..KaaaaaK.........",
]
HEAD_BACK = [
    "...K..........K...",
    "..KbK........KbK..",
    "..KbbK......KbbK..",
    ".KbbcbK....KbcbbK.",
    ".KbbcbbKKKKbbcbbK.",
    "KbbbbbbccccbbbbbbK",
    "KabbbbcddccbbbbbaK",
    "KabbbcddcbbbbbbbaK",
    "KabbbbbbbbbbbbbbaK",
    "KabbbabbbbbbabbbaK",
    "KabbbabbbbbbabbbaK",
    "KabbabbbbbbbbabbaK",
    "KabbabbbbbbbbabbaK",
    "KabbbbbabbabbbbbaK",
    "KabbbbbabbabbbbbaK",
    "KaabbbbbbbbbbbbaaK",
    "KaabbbbbbbbbbbbaaK",
    ".KaabbbbbbbbbbaaK.",
    ".KaaabbbbbbbbaaaK.",
    ".KaaaKbbbbbbKaaaK.",
    "..KKK.KKKKKK.KKK..",
]
BACK_HAIR = [
    "KabbbbbbbbbbbbaK",
    "KabbbbbbbbbbbbaK",
    "KabbbbbbbbbbbbaK",
    "KabbbbbbbbbbbbaK",
    "KabbbbbbbbbbbbaK",
    "KaabbbbbbbbbbaaK",
    "KaabbbbbbbbbbaaK",
    "KaabbbbbbbbbbaaK",
    ".KaabbbbbbbbaaK.",
    ".KaaK.KKKK.KaaK.",
    "..KK........KK..",
    "................",
]
BACK_HAIR_OVER = [
    "KabbbbbbbbbbaK",
    "KabbbabbabbbaK",
    "KabbbabbabbbaK",
    "KabbbabbabbbaK",
    "KabbbbbbbbbbaK",
    "KaabbabbabbaaK",
    "KaabbabbabbaaK",
    "KaabbbbbbbbaaK",
    ".KaabbbbbbaaK.",
    ".KaaKbbbbKaaK.",
    "..KK.KKKK.KK..",
    "..............",
]
TORSO_FRONT_L = [
    "....Kt",
    "..KK3t",
    ".K3437",
    ".K3347",
    ".K2337",
    ".K2333",
    ".K1222",
    ".K7777",
    ".K6777",
    "K66777",
    "K67777",
    "K33333",
    "K2222K",
]
TORSO_BACK_L = [
    "....Kb",
    "..KK33",
    ".K3443",
    ".K3343",
    ".K2333",
    ".K2333",
    ".K1222",
    ".K7777",
    ".K6777",
    "K66777",
    "K67777",
    "K33333",
    "K2222K",
]
TORSO_SIDE = [
    "...KtK....",
    ".KK73K....",
    "K23473K...",
    "K233473K..",
    "K233333K..",
    "K22333K...",
    "K12222K...",
    "K67777K...",
    "K667777K..",
    "K6677777K.",
    "K6777777K.",
    "K3333333K.",
    "KK22222KK.",
]
ARM = [
    "K343K",
    "K343K",
    "K3332",
    "K3332",
    "K2221",
    "K777K",
]
ARM_REPEAT = 2
FIST = [
    ".KK.",
    "KutK",
    "KtsK",
    ".KK.",
]
LEG = [
    "K776K",
    "K776K",
    "K332K",
    "K776K",
    "K776K",
    "K332K",
    "K221K",
    "KKKKK",
]
EYES = {'front': [(5, 12, -1), (11, 12, 1)], 'front3q': [(5, 12, -1), (11, 12, 1)], 'side': [(13, 12, 1)]}
KEEP = 'Kabcdrstuewpm'
PRESTIGE = {'1': '7a5410', '2': 'c8962e', '3': 'f0c860', '4': 'fff0b0'}
