"""Plantilla del prototipo: campeones (jugables) y monstruos (enemigos).

id      número interno. Campeones: su número de Riot ("key" en Data Dragon);
        monstruos: 2000+ (y 52 / 1000 / 493, que el motor usa para el poro
        ladrón, el poro dorado y el jinete de la Ruina del minuto 30).
base    Pokémon de Mundo Misterioso cuyo sprite se repinta (y cuyos stats de
        juego hereda: así el balance es el mismo que en PokéSurvivor).
rules   (color de la base, color del campeón) para recolor.py.
types   los 18 "elementos" (los tipos de siempre con otro nombre, ver
        lol/js/lol-names.js): misma tabla de daño, mismos movimientos.
"""

# Regiones = banners del gacha (el número es su "gen").
# En el prototipo, 4 banners con un campeón de cada rareza (1-4) y su legendario:
# con banners de 2-3 campeones casi todas las tiradas caían en el mismo.
REGIONS = [
    ('Jonia y Targon',                   ['#3a1d6e', '#6e1b4f', '#0f4d6e']),
    ('Demacia, Noxus y Zaun',            ['#1b2f78', '#5a1a1a', '#1a4a3a']),
    ('Freljord, Bandle e Ixtal',         ['#1a4a6e', '#2a6a8a', '#2a5a2a']),
    ('El Vacío, Shurima y Aguasturbias', ['#3a1a5a', '#6a4a1a', '#1a3a5a']),
]

#            id   nombre          título                       base region tipos                 rareza start          reglas
CHAMPIONS = [
    dict(id=103, name='Ahri',      title='la Zorra de Nueve Colas',   base=655, gen=1, types=['fairy', 'psychic'],   rarity=4, start='psycho-cut',
         rules=[('ffdd3e', 'f6f0ea'), ('c63f41', 'c8346e'), ('fb6704', '4a3550')], traits=['astuto', 'dulce']),
    dict(id=157, name='Yasuo',     title='el Imperdonable',           base=571, gen=1, types=['flying', 'steel'],    rarity=3, start='wing-attack',
         rules=[('b92533', '5a3a26'), ('3b4675', '2c6a8c'), ('58565b', 'b98a6a')], traits=['solitario', 'orgulloso']),
    dict(id=64,  name='Lee Sin',   title='el Monje Ciego',            base=308, gen=1, types=['fighting'],           rarity=1, start='aura-sphere',
         rules=[('e74f87', 'c62a2a'), ('afb7bf', 'd8a47c')], traits=['tenaz', 'sereno']),
    dict(id=86,  name='Garen',     title='el Poder de Demacia',       base=475, gen=2, types=['steel', 'fighting'],  rarity=1, start='metal-claw',
         rules=[('278f00', '2a56a8'), ('67cfff', 'e0b84a')], traits=['valiente', 'leal']),
    dict(id=122, name='Darius',    title='la Mano de Noxus',          base=68,  gen=2, types=['dark', 'fighting'],   rarity=3, start='bite',
         rules=[('8fafb7', '6a6470'), ('d7a700', 'a01818')], traits=['orgulloso', 'valiente']),
    dict(id=50,  name='Swain',     title='el Gran General Noxiano',   base=430, gen=2, types=['dark', 'flying'],     rarity=4, start='dark-pulse',
         rules=[('4f5f97', '34323a')]),
    dict(id=22,  name='Ashe',      title='la Arquera de Hielo',       base=724, gen=3, types=['ice', 'flying'],      rarity=1, start='ice-beam',
         rules=[('08613f', '2a58a8'), ('bc7c52', 'd8dae8'), ('e7652e', '7cc8f0')], traits=['prudente', 'sereno']),
    dict(id=150, name='Gnar',      title='el Eslabón Perdido',        base=104, gen=3, types=['ground', 'ice'],      rarity=3, start='bonemerang',
         rules=[('a75f1f', 'e07a20')], traits=['caótico', 'alegre']),
    dict(id=121, name="Kha'Zix",   title='el Saqueador del Vacío',    base=212, gen=4, types=['bug', 'dark'],        rarity=4, start='bug-bite',
         rules=[('d73f00', '7c3ac0'), ('6787af', '2c4a5c')]),
    dict(id=31,  name="Cho'Gath",  title='el Terror del Vacío',       base=248, gen=4, types=['bug', 'rock'],        rarity=3, start='rock-slide',
         rules=[('a7b777', '7c4c9c'), ('5767b7', 'd05080')]),
    dict(id=58,  name='Renekton',  title='el Carnicero de las Arenas', base=160, gen=4, types=['ground', 'dark'],    rarity=1, start='bite',
         rules=[('1f9fe7', '6a9a3c'), ('d73f00', 'd8a838')]),
    dict(id=19,  name='Warwick',   title='la Ira Desatada de Zaun',   base=262, gen=2, types=['dark', 'poison'],     rarity=2, start='bite',
         rules=[('4f4f4f', '3a5c5e'), ('afb7bf', 'b4c4ac'), ('b70000', '3ee060')], traits=['impulsivo', 'solitario']),
    dict(id=17,  name='Teemo',     title='el Explorador Veloz',       base=235, gen=3, types=['poison', 'fairy'],    rarity=4, start='poison-sting',
         rules=[('afaf9f', 'c49a6a'), ('47372f', '2f6a30')], traits=['travieso', 'alegre']),
    dict(id=54,  name='Malphite',  title='el Fragmento del Monolito', base=623, gen=3, types=['rock', 'ground'],     rarity=2, start='rock-throw',
         rules=[('5aa4a4', '8a7f78'), ('9c7329', 'e07028')], traits=['tranquilo', 'paciente']),
    dict(id=111, name='Nautilus',  title='el Titán de las Profundidades', base=781, gen=4, types=['water', 'steel'], rarity=2, start='water-gun',
         rules=[('427e72', '3a6a8a'), ('af9e4f', 'c08a3a')], traits=['tímido', 'leal']),
    dict(id=62,  name='Wukong',    title='el Rey Mono',               base=392, gen=1, types=['fighting', 'steel'],  rarity=2, start='karate-chop',
         rules=[('df8727', '8a5a3a'), ('1f7fcf', 'd8a838')], traits=['travieso', 'caótico']),
    # ---- legendarios: sólo en el gacha (rareza 5) y en las grietas ----
    dict(id=136, name='Aurelion Sol', title='el Forjador de Estrellas', base=384, gen=1, types=['dragon', 'psychic'], rarity=5, leg=True,
         rules=[('5fb727', '3048c0')]),
    dict(id=34,  name='Anivia',    title='la Criofénix',              base=144, gen=3, types=['ice', 'flying'],      rarity=5, leg=True,
         rules=[('1f9fe7', '4fbfe8')]),
    dict(id=106, name='Volibear',  title='la Tormenta Implacable',    base=901, gen=3, types=['electric', 'fighting'], rarity=5, leg=True,
         rules=[('704c40', '6a7488'), ('968d87', 'e0e4ec')]),
    dict(id=82,  name='Mordekaiser', title='el Revenant de Hierro',   base=379, gen=2, types=['steel', 'ghost'],     rarity=5, leg=True,
         rules=[('afb7bf', '4a5258'), ('ff875f', '40e070')]),
    dict(id=200, name="Bel'Veth",  title='la Emperatriz del Vacío',   base=487, gen=4, types=['bug', 'dragon'],      rarity=5, leg=True,
         rules=[('8f9797', '6a46a8'), ('efcf00', 'e04cc8')]),
]

# Monstruos: bst decide su tramo (como el total de stats en PokéSurvivor):
#   180-330 · 300-405 · 385-465 · 445-515 · 495-560 · 530-620 (jefes: boss=True)
# beh fija su forma de pelear (si no, la decide el motor por tipos);
# minion = a quién llama un invocador.
MONSTERS = [
    dict(id=2001, name='Súbdito cuerpo a cuerpo', base=66,  bst=250, types=['fighting'], beh='chase',  rules=[('8fafb7', 'c84040')]),
    dict(id=2002, name='Súbdito mago',            base=63,  bst=260, types=['psychic'],  beh='ranged', rules=[('dfb700', 'c84040'), ('a75f1f', '28305a')]),
    dict(id=2003, name='Ácaro del Vacío',         base=595, bst=230, types=['bug'],      beh='bomber', rules=[('e7c030', '8a3ac8'), ('626ae6', 'e04ab0')]),
    dict(id=2004, name='Krug pequeño',            base=524, bst=280, types=['rock'],     beh='chase',  rules=[('42528c', '6e5e4c')]),
    dict(id=2005, name='Raptor pequeño',          base=627, bst=300, types=['flying'],   beh='charger', rules=[('f6eeac', 'd84838'), ('ffffff', 'e86a58')]),
    dict(id=2006, name='Lobezno sombrío',         base=261, bst=320, types=['dark'],     beh='charger', rules=[('7f8f97', '3a4a68')]),
    dict(id=2007, name='Súbdito de asedio',       base=436, bst=360, types=['steel'],    beh='ranged', rules=[('4f5fa7', 'b03a3a')]),
    dict(id=2008, name='Gromp',                   base=186, bst=380, types=['water', 'poison'], beh='fan', rules=[('5fb727', '7a8a3a')]),
    dict(id=2009, name='Raptor carmesí',          base=566, bst=390, types=['flying', 'fire'], beh='jumper', rules=[('3184f7', '3c3040')]),
    dict(id=2010, name='Sacerdotisa Solari',      base=531, bst=400, types=['fairy'],    beh='healer', rules=[('e35c7a', 'e8a030')]),
    dict(id=2011, name='Krug',                    base=525, bst=420, types=['rock'],     beh='summoner', minion=2004, rules=[('41528b', '6e5e4c')]),
    dict(id=2012, name='Lobo sombrío',            base=262, bst=440, types=['dark'],     beh='summoner', minion=2006, rules=[('4f4f4f', '343a66'), ('afb7bf', '8890bc')]),
    dict(id=2013, name='Bomba química',           base=100, bst=410, types=['poison'],   beh='bomber', rules=[('ff875f', '60c848')]),
    dict(id=2014, name='Escudero de petricita',   base=411, bst=430, types=['steel', 'rock'], beh='shielder', rules=[('6f6f77', 'e8e0c8'), ('efbf37', '4a7ae0')]),
    dict(id=2015, name='Súbdito súper',           base=67,  bst=470, types=['fighting'], beh='tank',   rules=[('a797c7', 'a83a30')]),
    dict(id=2016, name='Cangrejo del río',        base=99,  bst=480, types=['water'],    beh='charger', rules=[('d73f00', '2c90c0')]),
    dict(id=2017, name='Larva del Vacío',         base=596, bst=490, types=['bug', 'electric'], beh='summoner', minion=2003, rules=[('ecd32a', 'b040d8'), ('2f3d9f', '3a1a5a')]),
    dict(id=2018, name='Quimbestia de Zaun',      base=89,  bst=500, types=['poison'],   beh='zoner',  rules=[('8f67bf', '5ab83a')]),
    dict(id=2019, name='Centinela azul',          base=526, bst=520, types=['rock', 'water'], beh='tank', rules=[('c7443d', '40d8f0')]),
    dict(id=2020, name='Golem rojo',              base=112, bst=530, types=['ground', 'fire'], beh='charger', rules=[('7f8f97', 'a8482c')]),
    dict(id=2021, name='Espectro de la Niebla',   base=477, bst=545, types=['ghost'],    beh='beamer', rules=[('676767', '24585a'), ('c7a700', '40e0a0')]),
    dict(id=2022, name='Krug ancestral',          base=76,  bst=580, types=['rock', 'ground'], beh='jumper', rules=[('47676f', '6e5a40')]),
    dict(id=2023, name='Raptor ancestral',        base=567, bst=590, types=['flying', 'dark'], beh='chase', rules=[('3f65ba', 'a02828')]),
    dict(id=2024, name='Alma en pena',            base=609, bst=600, types=['ghost', 'fire'], beh='fan', rules=[('7352e6', '30c890')]),
    # ---- jefes (minutos 3, 6, 9, 12 y 15) ----
    dict(id=2031, name='Heraldo de la Grieta',    base=452, bst=520, types=['bug', 'dark'],      boss=True, rules=[('7f3f7f', '8a3a9a')]),
    dict(id=2032, name='Dragón infernal',         base=6,   bst=560, types=['dragon', 'fire'],   boss=True, rules=[('d73f00', 'd83a10'), ('373f8f', '2a2020')]),
    dict(id=2034, name='Dragón de montaña',       base=330, bst=575, types=['dragon', 'ground'], boss=True, rules=[('278700', '7a5a30')]),
    dict(id=2033, name='Dragón de las nubes',     base=149, bst=595, types=['dragon', 'flying'], boss=True, rules=[('df771f', 'a8e0f0')]),
    dict(id=2035, name='Barón Nashor',            base=130, bst=640, types=['bug', 'poison'],    boss=True, rules=[('1f9fe7', '7a3ab8')]),
    dict(id=2036, name='Dragón ancestral',        base=646, bst=680, types=['dragon', 'ghost'],  boss=True, rules=[('82afc1', '8a6ad0')]),
    # ---- especiales (el motor los busca por número) ----
    dict(id=52,   name='Poro',                    base=831, bst=200, types=['normal'], rules=[('c7bdbe', 'c8ccd8')]),
    dict(id=1000, name='Poro dorado',             base=831, bst=200, types=['normal'], rules=[('c7bdbe', 'e0b030'), ('ffffff', 'ffe070')]),
    dict(id=493,  name='Hecarim',                 base=493, bst=720, types=['ghost'],  rules=[('d7dfdf', '3a5a60'), ('dfb700', '30e0a0')]),
]

# Armadura y resistencia mágica de cada monstruo (suben con el reloj, ver
# lol/js/lol-stats.js). Los súbditos, poca; los Krugs, mucha armadura; los
# espectros, mucha resistencia mágica...
RESIST = {
    2001: (20, 10), 2002: (10, 20), 2003: (10, 10), 2004: (40, 10), 2005: (15, 15), 2006: (15, 15),
    2007: (35, 25), 2008: (15, 30), 2009: (20, 20), 2010: (15, 40), 2011: (50, 15), 2012: (25, 20),
    2013: (10, 30), 2014: (45, 45), 2015: (50, 35), 2016: (40, 25), 2017: (20, 35), 2018: (20, 45),
    2019: (30, 55), 2020: (55, 25), 2021: (15, 60), 2022: (65, 20), 2023: (30, 30), 2024: (20, 55),
    2031: (40, 40), 2032: (35, 45), 2034: (60, 30), 2033: (30, 50), 2035: (60, 60), 2036: (55, 55),
}

SKIN_HUE = 150   # aspecto "de Prestigio" de los campeones: tono girado
