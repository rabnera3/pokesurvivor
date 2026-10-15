"""Garen dibujado a mano, píxel a píxel (cabeza, torso y hombreras).

Cada pieza es una rejilla de letras; PAL da el color de cada letra ('.' =
transparente). El contorno 'K' va dibujado a mano donde hace falta; el resto
del contorno lo pone doll.outline() al montar el fotograma.
"""

PAL = {
    'K': '1b1528',
    # pelo
    'a': '3a2214', 'b': '6b4426', 'c': '8e5e34', 'd': 'b8844e',
    # piel
    's': 'b87c5a', 't': 'e8b48a', 'u': 'f6d2ac',
    # ojos / boca
    'w': 'ffffff', 'e': '4a7ad0', 'f': '1e3a78', 'm': '9a5440',
    # acero
    '1': '4e5468', '2': '8a92a8', '3': 'c4cad8', '4': 'eef2f8',
    # oro
    '5': '8a5a14', '6': 'd8a640', '7': 'f6dc80',
    # azul de Demacia
    '8': '142456', '9': '24489a', '0': '3e6cc8', 'l': '7aa0e8',
    # gema
    'o': 'd8602a', 'p': 'ffb070',
    # cuero
    'n': '4a3426', 'r': '7a5a40',
}

# Cabeza de frente (16 × 16): ojos en las columnas 4-5 y 10-11.
HEAD_FRONT = [
    #0123456789012345
    ".....KKKKKK.....",
    "...KKbccddcbKK..",
    "..KbcddddccbbbK.",
    ".KbccddcccbcbbaK",
    ".KbcccbccbbcbbaK",
    "KabcbbcbbbbcbbaK",
    "KabbbabbcbbabbaK",
    "KbbbatbbbbatbbaK",
    "KbbattbbbattbbaK",
    "KbatttbbattttbbK",
    "KbtaattttttaatbK",
    "KttKKttttttKKttK",
    "KttwettttttwettK",
    "KstfettttttfestK",
    ".KstttttmtttttK.",
    "..KsstttttttsK..",
    "...KKssssssKK...",
]

# De lado, mirando a la derecha (16 × 16).
HEAD_SIDE = [
    #0123456789012345
    "....KKKKKK......",
    "..KKbccddcKK....",
    ".KbbccddddccK...",
    ".KabccccdcccbK..",
    "KabbcccccbbbbbK.",
    "KabbbbbbbbbbbbbK",
    "KabbbbbbbbbbabtK",
    "KabbbbbbbbbatbtK",
    "KaabbbbbbbattttK",
    "KaabbbbbbattaatK",
    "KaabbbbbsttKKttK",
    ".KabbbbbsttwettK",
    ".KaabbbsttsfettK",
    "..KaabbsttttttK.",
    "...KaaKsttttmK..",
    "....KK.KssssK...",
    ".......KKKKK....",
]

# De espaldas (16 × 16).
HEAD_BACK = [
    #0123456789012345
    ".....KKKKKK.....",
    "...KKbccddcbKK..",
    "..KbccddddccbbK.",
    ".KbcccdddccbbbaK",
    ".KbccccccbbbbbaK",
    "KabcbbbbbbbbbbaK",
    "KabbbbabbbabbbaK",
    "KabbbbabbbabbbaK",
    "KabbbabbbbbabbaK",
    "KabbbabbbbbabbaK",
    "KaabbabbbbbabaaK",
    "KaabbbbbbbbbbaaK",
    ".KaabbbbbbbbaaK.",
    ".KsaaabbbbaaasK.",
    "..KssaaaaaassK..",
    "...KKssssssKK...",
]

# Tres cuartos, mirando abajo a la derecha (16 × 16).
HEAD_3Q = [
    #0123456789012345
    ".....KKKKKK.....",
    "...KKbccddcbKK..",
    "..KbccddddcbbbK.",
    ".KbcccddcccbbbaK",
    ".KbcccccbbbbbbaK",
    "KabbbbbbbbbbbbbK",
    "KabbbbabbbbabbtK",
    "KabbbbatbbbatbtK",
    "KabbbattbbattttK",
    "KaabbtttbattttbK",
    "KaabtaatttttaatK",
    "KaastKKtttttKKtK",
    ".KastwetttttwetK",
    ".KastfetttttfetK",
    "..KsttttttmtttK.",
    "...KsstttttssK..",
    "....KKssssssK...",
]

# Hombrera (10 × 10). La misma para los dos lados.
PAULDRON = [
    #0123456789
    "...KKKK...",
    ".KK3443KK.",
    "K33444332K",
    "K34443322K",
    "K33433e21K",
    "K23332211K",
    "K76666655K",
    ".K112211K.",
    ".K666655K.",
    "..KKKKKK..",
]

# Torso de frente: mitad izquierda (7 columnas); la derecha es su espejo con
# las columnas de fuera un tono más oscuras.
TORSO_FRONT_L = [
    #0123456
    "....K23",
    "..KK633",
    ".K90643",
    ".K9064p",
    ".K9063o",
    ".K99633",
    ".K89623",
    ".K89622",
    ".K86666",
    ".K85567",
    "..Kn690",
    "...K690",
    "....K60",
]

# Torso de espaldas (capa): mitad izquierda.
TORSO_BACK_L = [
    "....K23",
    "..KK633",
    ".K69990",
    ".K69990",
    ".K69997",
    ".K69977",
    ".K69990",
    ".K69990",
    ".K69990",
    ".K69990",
    ".K69990",
    ".K66666",
    "..KKKKK",
]

# Torso de lado (mirando a la derecha), 10 columnas.
TORSO_SIDE = [
    #0123456789
    "...K233K..",
    ".KK96334K.",
    "K67996343K",
    "K67996343K",
    "K67996333K",
    "K67996332K",
    "K67899322K",
    "K67899222K",
    "K66666666K",
    "K6n555675K",
    ".K6n8990K.",
    "..K6n90K..",
    "...KK69K..",
]

# Ojos (columna, fila de arriba, lado) para la cara de daño y el brillo.
EYES = {'front': [(3, 11, -1), (11, 11, 1)], 'front3q': [(5, 11, -1), (12, 11, 1)], 'side': [(11, 10, 1)]}

# Puño con guantelete (5 × 5) y pierna con greba (5 × 8).
FIST = [
    ".KKK.",
    "K344K",
    "K3332",
    "K2221",
    ".KKK.",
]
LEG = [
    "K898K",
    "K898K",
    "K676K",
    "K343K",
    "K332K",
    "K321K",
    "KnrnK",
    "KKKKK",
]

# Letras que no cambian de color en el aspecto de Prestigio (pelo, piel, ojos, contorno).
KEEP = 'Kabcdstuwefm'
