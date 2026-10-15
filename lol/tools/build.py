"""Monta el prototipo RuneSurvivor (PokéSurvivor con campeones de LoL) en lol/dist/.

    python lol/tools/build.py            # todo (sprites, datos, página)
    python lol/tools/build.py --preview  # además, lol/dist/preview.png con todos los sprites

No toca el juego original: lee dev.html y js/ tal cual, y al juntarlos
  - cambia los datos de Pokémon por los de lol/tools/roster.py,
  - aplica los PARCHES de abajo (texto exacto; si alguno ya no encaja, falla),
  - añade lol/js/lol-skin.js (textos) y lol/js/lol-game.js (nombres).
Los números de combate no se tocan: el balance es el de PokéSurvivor.

Sprites: cada campeón / monstruo es un Pokémon de Mundo Misterioso repintado
(lol/tools/recolor.py). Es la primera fase: después se pueden redibujar a mano
(o con ayuda de IA) encima de estas hojas, que ya tienen el formato correcto.

Necesita Python 3 y Pillow. El resultado es una web estática: se sirve con
cualquier servidor (python -m http.server -d lol/dist) o se publica tal cual.
"""
import json, os, re, shutil, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
LOL = os.path.dirname(HERE)
ROOT = os.path.dirname(LOL)
OUT = os.path.join(LOL, 'dist')
sys.path.insert(0, HERE)
import roster
from recolor import transform, hue_shift, recolor_image, hex2rgb

SPECIAL = {52, 1000, 493}          # el motor los busca por número (poro ladrón, poro dorado, la Ruina)

# Nombres en inglés de lo que no es un nombre propio.
EN = {
    'Súbdito cuerpo a cuerpo': 'Melee minion', 'Súbdito mago': 'Caster minion', 'Ácaro del Vacío': 'Voidmite',
    'Krug pequeño': 'Mini Krug', 'Raptor pequeño': 'Raptor', 'Lobezno sombrío': 'Murk Wolf pup',
    'Súbdito de asedio': 'Siege minion', 'Raptor carmesí': 'Crimson Raptor', 'Sacerdotisa Solari': 'Solari Priestess',
    'Lobo sombrío': 'Greater Murk Wolf', 'Bomba química': 'Chem bomb', 'Escudero de petricita': 'Petricite Shieldbearer',
    'Súbdito súper': 'Super minion', 'Cangrejo del río': 'Rift Scuttler', 'Larva del Vacío': 'Voidling',
    'Quimbestia de Zaun': 'Zaunite Chem-beast', 'Centinela azul': 'Blue Sentinel', 'Golem rojo': 'Red Brambleback',
    'Espectro de la Niebla': 'Mist Wraith', 'Krug ancestral': 'Ancient Krug', 'Raptor ancestral': 'Ancient Raptor',
    'Alma en pena': 'Lost Soul', 'Heraldo de la Grieta': 'Rift Herald', 'Dragón infernal': 'Infernal Drake',
    'Dragón de montaña': 'Mountain Drake', 'Dragón de las nubes': 'Cloud Drake', 'Barón Nashor': 'Baron Nashor',
    'Dragón ancestral': 'Elder Dragon', 'Poro dorado': 'Golden Poro',
    'Jungla de la Grieta': "Summoner's Rift Jungle", 'Cuevas de Freljord': 'Freljord Caves', 'Forja del Fuego Eterno': 'Forge of Eternal Fire',
    'Grieta del Invocador': "Summoner's Rift", 'Grieta Infernal': 'Infernal Rift', 'Grieta Oceánica': 'Ocean Rift',
    'Selvas de Ixtal': 'Ixtal Jungles', 'Laboratorio Hextech': 'Hextech Lab', 'Glaciar de Freljord': 'Freljord Glacier',
    'Templo de Jonia': 'Ionian Temple', 'Fosos de Zaun': 'Zaun Sumps', 'Desierto de Shurima': 'Shurima Desert',
    'Cumbre del Targon': 'Targon Summit', 'Santuario Arcano': 'Arcane Sanctum', 'Fisura del Vacío': 'Void Fissure',
    'Cantera de Petricita': 'Petricite Quarry', 'Islas de la Sombra': 'Shadow Isles', 'Foso del Dragón': 'Dragon Pit',
    'Callejones de Noxus': 'Noxian Alleys', 'Fortaleza de Demacia': 'Demacian Fortress', 'Bosque Espiritual': 'Spirit Grove',
    'Camino de la Ruina': 'Path of Ruination',
    'Alma Infernal': 'Infernal Soul', 'Tormenta Oceánica': 'Ocean Storm', 'Tormenta de Shurima': 'Shuriman Sandstorm',
    'Ventisca de Freljord': 'Freljord Blizzard', 'Niebla Negra': 'Black Mist',
    'Bufo Rojo': 'Red Buff', 'Celeridad': 'Haste', 'Bufo Azul': 'Blue Buff',
    'Cofre Hextech · {x}': 'Hextech Chest · {x}',
    '¡Campeón enemigo: {x}!': 'Enemy champion: {x}!', '¡Has derrotado a {x}!': 'You defeated {x}!', '¡Objeto! {x}': 'Item! {x}',
    'Inventario lleno: lo conviertes en experiencia': 'Inventory full: turned into experience', '¡Nueva habilidad! {x} · {x}': 'New ability! {x} · {x}',
    'Fuerza adaptable': 'Adaptive force', 'Celeridad': 'Ability haste', 'Velocidad de ataque': 'Attack speed', 'Vitalidad': 'Vitality',
    'Armadura': 'Armor', 'Resistencia mágica': 'Magic resist', 'Crítico': 'Critical strike', 'Poción de vida': 'Health potion',
    'Fragmento': 'Shard', 'Consumible': 'Consumable', 'PASIVA · {x} > {x}': 'PASSIVE · {x} > {x}', 'Objeto · {x}': 'Item · {x}',
    'Evoluciona {x}': 'Evolves {x}', 'EVOLUCIÓN · {x}': 'EVOLUTION · {x}', '{x} · rango {x} > {x}': '{x} · rank {x} > {x}', '{x} campeones': '{x} champions',
    '4 regiones · campeones y Prestigios': '4 regions · champions and Prestige skins',
}

# (archivo, texto exacto, nuevo). Cada uno tiene que encajar UNA vez.
PATCHES = [
    # Textos: la "piel" de Runaterra también en español (ver lol/js/lol-skin.js).
    ('js/core/i18n.js', "if (lang === 'es' || !s || typeof s !== 'string') return s;", "if (!s || typeof s !== 'string') return s;"),
    ('js/core/i18n.js', "    let r = core(s);", "    let r = lang === 'es' ? s : core(s);\n    if (G.Skin) r = G.Skin.apply(r, lang);"),
    ('js/core/i18n.js', "    if (lang === 'es') return;\n    // Los enlaces", "    // Los enlaces"),
    ('js/core/i18n.js', "  if (lang !== 'es') {\n    const P = CanvasRenderingContext2D.prototype;", "  {\n    const P = CanvasRenderingContext2D.prototype;"),
    # Enemigos: monstruos de la jungla, súbditos y criaturas (G.MONSTERS), no los campeones.
    ('js/data/enemies.js', "  function behaviorOf(p) {\n", "  function behaviorOf(p) {\n    if (p.beh) return p.beh;\n"),
    ('js/data/enemies.js', "d.minion = SUMMON[p.dex];", "d.minion = p.minion || SUMMON[p.dex];"),
    ('js/data/enemies.js', "return G.DEX.filter(p => p.rarity < 5 && p.bst >= tier.bst[0]",
                           "return G.MONSTERS.filter(p => !p.boss && !p.special && p.bst >= tier.bst[0]"),
    ('js/data/enemies.js', "let pool = G.DEX.filter(p => ok(p) && p.bst >= slot.bst[0]",
                           "let pool = G.MONSTERS.filter(p => p.boss && ok(p) && p.bst >= slot.bst[0]"),
    ('js/data/enemies.js', "if (!pool.length) pool = G.DEX.filter(p => ok(p) && p.bst >= 580);",
                           "if (!pool.length) pool = G.MONSTERS.filter(p => p.boss && ok(p));"),
    # Menú, colección, gacha y cooperativo.
    ('js/game.js', "const CAST = [1, 4, 7, 25, 133, 52, 39, 35, 16, 43, 60, 69, 74, 92, 129, 147, 113, 143, 54, 79];", "const CAST = G.LOL_CAST;"),
    ('js/net/coop.js', "G.DEX_BY[m.dex] || G.DEX_BY[25]", "G.DEX_BY[m.dex] || G.DEX[0]"),
    ('js/ui/menu.js', "const GEN_NAMES = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia', 'Kalos', 'Alola', 'Galar', 'Paldea'];",
                      "const GEN_NAMES = G.LOL_REGIONS.map(r => r[0]);"),
    ('js/ui/gacha-ui.js', "<small>Gen ${b.gen}</small>", "<small>${G.DEX.filter(p => p.gen === b.gen).length} campeones</small>"),
    ('js/ui/gacha-ui.js', "$('banner-title').textContent = banner.name + ' Misterioso';",
                          "$('banner-title').textContent = 'Cofre Hextech · ' + banner.name;"),
    ('js/ui/gacha-ui.js', "`Los ${all.length} Pokémon de la generación ${gen}. ¡Los legendarios esperan!`",
                          "`Los ${all.length} campeones de ${banner.name}. ¡Los legendarios esperan!`"),
    ('js/ui/settings-ui.js', "Pokémon y sus personajes son propiedad de Nintendo, Creatures y GAME FREAK; este proyecto no está afiliado a ellos.",
                             "Creado bajo la política «Legal Jibber Jabber» de Riot Games. Riot Games no respalda ni patrocina este proyecto."),
    ('js/ui/settings-ui.js', "PMD SpriteCollab y sus artistas (CC BY-NC 4.0)",
                             "repintados a partir de PMD SpriteCollab y sus artistas (CC BY-NC 4.0)"),
    # Prototipo: sin app instalable (service worker).
    ('js/main.js', "if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {", "if (false) {"),
    # Nombres de zonas, arenas de la grieta, climas y altares.
    ('js/world/tiles.js', "name: 'Bosque Umbrío'", "name: 'Jungla de la Grieta'"),
    ('js/world/tiles.js', "name: 'Cueva Cristal'", "name: 'Cuevas de Freljord'"),
    ('js/world/tiles.js', "name: 'Volcán Ceniza'", "name: 'Forja del Fuego Eterno'"),
    ('js/world/tiles.js', "name: 'Pradera Eterna'", "name: 'Grieta del Invocador'"),
    ('js/world/tiles.js', "name: 'Volcán Ígneo'", "name: 'Grieta Infernal'"),
    ('js/world/tiles.js', "name: 'Gruta Marina'", "name: 'Grieta Oceánica'"),
    ('js/world/tiles.js', "name: 'Selva Esmeralda'", "name: 'Selvas de Ixtal'"),
    ('js/world/tiles.js', "name: 'Central Voltio'", "name: 'Laboratorio Hextech'"),
    ('js/world/tiles.js', "name: 'Glaciar Eterno'", "name: 'Glaciar de Freljord'"),
    ('js/world/tiles.js', "name: 'Dojo Ancestral'", "name: 'Templo de Jonia'"),
    ('js/world/tiles.js', "name: 'Ciénaga Tóxica'", "name: 'Fosos de Zaun'"),
    ('js/world/tiles.js', "name: 'Desierto Rojo'", "name: 'Desierto de Shurima'"),
    ('js/world/tiles.js', "name: 'Pico Celeste'", "name: 'Cumbre del Targon'"),
    ('js/world/tiles.js', "name: 'Templo Mental'", "name: 'Santuario Arcano'"),
    ('js/world/tiles.js', "name: 'Bosque Colmena'", "name: 'Fisura del Vacío'"),
    ('js/world/tiles.js', "name: 'Cantera Antigua'", "name: 'Cantera de Petricita'"),
    ('js/world/tiles.js', "name: 'Cementerio Sombrío'", "name: 'Islas de la Sombra'"),
    ('js/world/tiles.js', "name: 'Santuario Dragón'", "name: 'Foso del Dragón'"),
    ('js/world/tiles.js', "name: 'Callejón Oscuro'", "name: 'Callejones de Noxus'"),
    ('js/world/tiles.js', "name: 'Fortaleza de Acero'", "name: 'Fortaleza de Demacia'"),
    ('js/world/tiles.js', "name: 'Bosque Encantado'", "name: 'Bosque Espiritual'"),
    ('js/world/tiles.js', "name: 'Ruinas del Juicio'", "name: 'Camino de la Ruina'"),
    ('js/systems/weather.js', "name: 'Sol abrasador'", "name: 'Alma Infernal'"),
    ('js/systems/weather.js', "name: 'Lluvia'", "name: 'Tormenta Oceánica'"),
    ('js/systems/weather.js', "name: 'Tormenta de arena'", "name: 'Tormenta de Shurima'"),
    ('js/systems/weather.js', "name: 'Nevada'", "name: 'Ventisca de Freljord'"),
    ('js/systems/weather.js', "name: 'Niebla'", "name: 'Niebla Negra'"),
    ('js/systems/interact.js', "id: 'dmg', name: 'Furia'", "id: 'dmg', name: 'Bufo Rojo'"),
    ('js/systems/interact.js', "id: 'spd', name: 'Rayo'", "id: 'spd', name: 'Celeridad'"),
    ('js/systems/interact.js', "id: 'cd', name: 'Prisa'", "id: 'cd', name: 'Bufo Azul'"),
    # ---- League of Legends: kit, estadísticas, objetos (lol/js/lol-*.js y lol/js/engine/) ----
    # El kit lo prepara el jugador al nacer (G.Kit.init); sin "Repertorio" de movimientos.
    ('js/game.js', "    pl.addMove(G.startMoveOf(mon.dex));\n", ""),
    ('js/game.js', "    if (perks.startMoves >= 2) {", "    if (false) {"),
    # Objetos de jefes y cofres: uno de LoL que vaya con tu campeón.
    ('js/game.js', "  function offerItem(id) {\n", "  function offerItem(id) {\n    if (G.LoL) { G.LoL.takeItem(pl); return; }\n"),
    ('js/game.js', "get state() { return state; }, get player() { return pl; },", "get state() { return state; }, get player() { return pl; }, get time() { return time; },"),
    # Enemigos: armadura y resistencia mágica; avisar al jugador de cada muerte (pasivas y objetos).
    ('js/entities/enemy.js', "      this.behavior = def.behavior;\n",
                             "      this.behavior = def.behavior;\n      const rs = G.LoL.resist(def, (G.Game && G.Game.time) || 0, boss);\n      this.ar = rs.ar; this.mr = rs.mr;\n"),
    ('js/entities/enemy.js', "          pl.kills++;\n", "          pl.kills++;\n          if (pl.onKill) pl.onKill(e);\n"),
    ('js/data/enemies.js', "      dex: p.dex, name: p.name, behavior,", "      dex: p.dex, name: p.name, behavior, ar: p.ar, mr: p.mr,"),
    ('js/data/enemies.js', "        at: slot.at, dex: p.dex, name: p.name,", "        at: slot.at, dex: p.dex, name: p.name, ar: p.ar, mr: p.mr,"),
    # HUD: recarga real (celeridad), letra de cada habilidad, objetos y R (lol/js/lol-hud.js).
    ('js/ui/hud.js', "const cdOf = m => m.kind === 'orbit' ? 0 : G.U.clamp(m.t / (m.cd * pl.cdMul), 0, 1);",
                     "const cdOf = m => m.kind === 'orbit' ? 0 : G.U.clamp(m.t / (m.cdEff || m.cd * pl.cdMul), 0, 1);"),
    ('js/ui/hud.js', "      ctx.fillText(String(i + 1), x + 3, y + 10);", "      ctx.fillText(m.key ? (i + 1) + ' ' + m.key : String(i + 1), x + 3, y + 10);"),
    ('js/ui/hud.js', "      const bx = sx + totalW + 12, by = sy + S / 2 - 12;", "      const bx = G.LoL.hudRight || sx + totalW + 12, by = sy + S / 2 - 12;"),
    ('js/ui/hud.js', "    {\n      const ix = sx - S - 18, iy = sy;", "    if (G.LoL) G.LoL.hud(ctx, pl, sx, sy, S, totalW, F, roundRect);\n    else {\n      const ix = sx - S - 18, iy = sy;"),
    ('js/entities/vfx.js', "const v = MOVE[m.id] || {};", "const v = MOVE[m.vfx || m.id] || {};"),
    # Las curanderas curan a los jefes sólo un cuarto (con varias, un jefe no moría nunca).
    ('js/entities/enemy.js', "e.hp = Math.min(e.maxHp, e.hp + e.maxHp * k);", "e.hp = Math.min(e.maxHp, e.hp + e.maxHp * k * (e.boss ? 0.25 : 1));"),
    # Campeones enemigos (lol/js/lol-elites.js).
    ('js/game.js', "    G.Events.reset();\n", "    G.Events.reset();\n    if (G.LoLElites) G.LoLElites.reset();\n"),
    ('js/game.js', "    G.Events.update(dt, all, time);\n", "    G.Events.update(dt, all, time);\n    if (G.LoLElites && (!coop || G.Coop.isHost)) G.LoLElites.update(dt, all, time);\n"),
    ('js/ui/run-ui.js', "    G.UI.show('scr-pause');\n", "    const pe = document.getElementById('pause-lol');\n    if (pe && G.LoL) pe.innerHTML = G.LoL.statsHtml(G.Game.player);\n    G.UI.show('scr-pause');\n"),
]

# Archivos del motor que se sustituyen enteros.
REPLACE = {
    'js/core/firebase-config.js': 'G.FIREBASE_CONFIG = null;   // prototipo: sólo modo local (guardado en el navegador)\n',
    'js/data/sprites-meta.js': '',      # va dentro de lol-data.js
}
# Scripts propios que se meten detrás de uno del motor.
# Copias del motor con lo de LoL (sustituyen al archivo entero).
ENGINE = {
    'js/entities/player.js': 'lol/js/engine/player.js',
    'js/systems/combat.js': 'lol/js/engine/combat.js',
    'js/systems/levelup.js': 'lol/js/engine/levelup.js',
}
INSERT_AFTER = {
    'js/data/lang-en.js': ['lol/js/lol-skin.js'],
    'js/systems/hazards.js': ['lol/js/lol-stats.js', 'lol/js/lol-items.js', 'lol/js/lol-kits.js', 'lol/js/lol-hud.js', 'lol/js/lol-elites.js', 'lol/js/lol-game.js'],
}

CHANGELOG = """G.CHANGELOG = [
  { d: '2026-10-15', title: ['Prototipo de RuneSurvivor', 'RuneSurvivor prototype'], new: [
    ['Primera versión de prueba: PokéSurvivor con campeones de League of Legends. 21 campeones (5 legendarios), súbditos, monstruos de la jungla, dragones y el Barón. Los sprites son Pokémon de Mundo Misterioso repintados: se irán redibujando poco a poco.',
     'First test build: PokéSurvivor with League of Legends champions. 21 champions (5 legendary), minions, jungle monsters, drakes and Baron. Sprites are recoloured Mystery Dungeon Pokémon and will be redrawn over time.'],
    ['Mismo balance que PokéSurvivor: los tipos son elementos (Infernal, Océano, Hextech, Vacío...) con la misma tabla, y las habilidades son los mismos movimientos con nombres de LoL.',
     'Same balance as PokéSurvivor: types are elements (Infernal, Ocean, Hextech, Void...) with the same chart, and abilities are the same moves with LoL names.']
  ] }
];
"""

# ---------------------------------------------------------------- utilidades

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def pokedex():
    src = read('js/data/pokedex.js')
    return {int(m.group(1)): json.loads(m.group(0).rstrip(','))
            for m in re.finditer(r'^\s*\{"dex":(\d+),.*\},?$', src, re.M)}

def sprite_meta():
    src = read('js/data/sprites-meta.js')
    return {int(m.group(1)): json.loads(m.group(2)) for m in re.finditer(r'^  (\d+): (\{.*\}),?$', src, re.M)}

def recolor_fn(rules, skin=False):
    R = [(hex2rgb(a), hex2rgb(b)) for a, b in rules]
    if skin:
        return lambda c: hue_shift(transform(c, R), roster.SKIN_HUE)
    return lambda c: transform(c, R)

# ---------------------------------------------------------------- pasos

def build_sprites(entries, meta):
    out_meta = {}
    for e in entries:
        base = meta[e['base']]
        m = {'s': base['s'], 'a': base['a']}
        if base.get('hv'):
            m['hv'] = 1
        variants = [('', recolor_fn(e['rules']))]
        if e.get('champ') and not e.get('leg'):
            variants.append(('s/', recolor_fn(e['rules'], skin=True)))
            m['sh'] = 1
        for sub, fn in variants:
            d = os.path.join(OUT, 'assets', 'pokemon', str(e['id']), sub)
            os.makedirs(d, exist_ok=True)
            for anim in base['a']:
                im = Image.open(os.path.join(ROOT, 'assets', 'pokemon', str(e['base']), anim + '.png'))
                recolor_image(im, fn).save(os.path.join(d, anim + '.png'), optimize=True)
        out_meta[e['id']] = m
    return out_meta

def data_js(dex, meta_out):
    champs, mons = [], []
    for c in roster.CHAMPIONS:
        b = dex[c['base']]
        e = {'dex': c['id'], 'name': c['name'], 'title': c['title'], 'types': c['types'],
             'hp': b['hp'], 'spd': b['spd'], 'atk': b['atk'], 'rarity': c['rarity'], 'bst': b['bst'],
             'starter': bool(c.get('traits')), 'gen': c['gen'], 'start': c.get('start'), 'base': c['base']}
        if c.get('leg'):
            e['leg'] = True
        if c.get('traits'):
            e['traits'] = c['traits']
        champs.append(e)
    for m in roster.MONSTERS:
        b = dex[m['base']]
        e = {'dex': m['id'], 'name': m['name'], 'types': m['types'], 'hp': b['hp'], 'spd': b['spd'], 'atk': b['atk'],
             'rarity': 1, 'bst': m['bst'], 'gen': 0, 'base': m['base']}
        for k in ('beh', 'minion', 'boss'):
            if m.get(k):
                e[k] = m[k]
        if m['id'] in SPECIAL:
            e['special'] = True
        if m['id'] in roster.RESIST:
            e['ar'], e['mr'] = roster.RESIST[m['id']]
        mons.append(e)
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))
    lines = ['/* ============ lol-data.js — GENERADO por lol/tools/build.py, no editar a mano ============',
             ' * G.DEX: campeones (colección, gacha, compañero). G.MONSTERS: enemigos.',
             ' * Stats de juego heredados del Pokémon base (mismo balance). */',
             'G.DEX = [', *[j(c) + ',' for c in champs], '];',
             'G.MONSTERS = [', *[j(m) + ',' for m in mons], '];',
             'G.DEX_BY = {};',
             'for (const p of G.DEX.concat(G.MONSTERS)) G.DEX_BY[p.dex] = p;',
             'G.getPokemon = dex => G.DEX_BY[dex];',
             'G.LOL_CHAMPS = G.DEX;',
             'G.LOL_REGIONS = ' + j([[n, c] for n, c in roster.REGIONS]) + ';',
             # Paseando por el menú: campeones y algún poro.
             'G.LOL_CAST = ' + j([c['id'] for c in roster.CHAMPIONS if not c.get('leg')] + [52, 52, 2008, 2016]) + ';',
             'G.SPRITE_META = {', *[f'  {k}: {j(v)},' for k, v in meta_out.items()], '};',
             'G.I18n.add(' + j(EN) + ');', '']
    return '\n'.join(lines)

def app_js(data):
    dev = read('dev.html')
    i, k = dev.index('<!-- scripts:begin -->'), dev.index('<!-- scripts:end -->')
    files = re.findall(r'<script[^>]*src="(js/[^"]+\.js)"', dev[i:k])
    src = {f: read(f) for f in files}
    for f, txt in REPLACE.items():
        src[f] = txt
    for f, mine in ENGINE.items():
        src[f] = read(mine)
    src['js/data/changelog.js'] = CHANGELOG
    for f, old, new in PATCHES:
        n = src[f].count(old)
        if n != 1:
            raise SystemExit(f'Parche que no encaja ({n} veces) en {f}:\n  {old}')
        src[f] = src[f].replace(old, new)
    parts = []
    for f in files:
        if f == 'js/data/pokedex.js':
            parts.append(('lol-data.js (generado)', data))
        elif f == 'js/data/sprites-meta.js':
            continue
        else:
            parts.append((f, src[f]))
        for extra in INSERT_AFTER.get(f, []):
            parts.append((extra, read(extra)))
    return '\n;\n'.join(f'/* {name} */\n{txt}' for name, txt in parts), dev

def page(dev):
    i, k = dev.index('<!-- scripts:begin -->'), dev.index('<!-- scripts:end -->') + len('<!-- scripts:end -->')
    html = dev[:i] + '<script defer src="js/app.js"></script>' + dev[k:]
    # Iconos y app instalable: son los de PokéSurvivor (el prototipo no los lleva).
    html = re.sub(r'<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\n?', '', html)
    html = re.sub(r'<!-- seo:begin -->[\s\S]*?<!-- seo:end -->\n?', '', html)
    html = re.sub(r'<title>.*?</title>', '<title>RuneSurvivor</title>', html)
    html = re.sub(r'<meta name="description" content="[^"]*">',
                  '<meta name="description" content="Prototipo de survivor con campeones de League of Legends.">', html)
    legal = ('<p>RuneSurvivor se ha creado bajo la política «Legal Jibber Jabber» de Riot Games usando nombres y '
             'personajes propiedad de Riot Games. Riot Games no respalda ni patrocina este proyecto. '
             'League of Legends y Riot Games son marcas de Riot Games, Inc.</p>')
    html = re.sub(r'<p>No está afiliado, patrocinado ni aprobado por Nintendo[\s\S]*?</p>', legal, html)
    rep = [
        ('Pokémon © Nintendo/Creatures/GAME FREAK', 'League of Legends © Riot Games'),
        ('Juego de supervivencia con Pokémon, gratis en el navegador y en el móvil.', 'Prototipo: sobrevive a las hordas de Runaterra con tu campeón.'),
        ("'A Pokémon survival game, free in your browser and on mobile.'", "'Prototype: survive the hordes of Runeterra with your champion.'"),
        ('Sobrevive a las hordas con tu compañero Pokémon', 'Sobrevive a las hordas con tu campeón'),
        ('9 regiones · Pokémon y shinies', '4 regiones · campeones y Prestigios'),
        ('PokéSurvivor', 'RuneSurvivor'),
        ('<p id="pause-coop" class="note hidden">', '<div id="pause-lol"></div>\n    <p id="pause-coop" class="note hidden">'),
        ('<kbd>1</kbd>–<kbd>4</kbd> movimiento', '<kbd>1</kbd>–<kbd>3</kbd> habilidad (la R va sola)'),
        ('</head>', '<style>.lol-stats{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;font-size:13px;text-align:left;margin:10px 0 2px}'
                    '.lol-stats div{display:flex;justify-content:space-between;gap:8px}.lol-stats b{color:#ffd23f}</style>\n</head>'),
    ]
    for a, b in rep:
        html = html.replace(a, b)
    return html

def preview(entries):
    from PIL import ImageDraw
    cell, cols = 120, 8
    rows = (len(entries) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * (cell + 16)), (30, 34, 48, 255))
    dr = ImageDraw.Draw(sheet)
    meta = sprite_meta()
    for n, e in enumerate(entries):
        a = meta[e['base']]['a']['Idle']
        im = Image.open(os.path.join(OUT, 'assets', 'pokemon', str(e['id']), 'Idle.png')).convert('RGBA')
        f = im.crop((0, 0, a['w'], a['h']))
        f = f.resize((f.width * 2, f.height * 2), Image.NEAREST)
        f.thumbnail((cell - 4, cell - 4), Image.NEAREST)
        x, y = (n % cols) * cell, (n // cols) * (cell + 16)
        sheet.alpha_composite(f, (x + (cell - f.width) // 2, y + (cell - f.height) // 2))
        dr.text((x + 3, y + cell), e['name'].encode('ascii', 'replace').decode(), fill=(255, 255, 255, 255))
    sheet.save(os.path.join(OUT, 'preview.png'))

def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'js'))
    dex, meta = pokedex(), sprite_meta()
    entries = [dict(c, champ=True) for c in roster.CHAMPIONS] + list(roster.MONSTERS)
    ids = [e['id'] for e in entries]
    if len(ids) != len(set(ids)):
        raise SystemExit('Hay números repetidos en roster.py')
    meta_out = build_sprites(entries, meta)
    js, dev = app_js(data_js(dex, meta_out))
    with open(os.path.join(OUT, 'js', 'app.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    html = page(dev)
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    # Para publicarlo como página de claude.ai (Artifact), que pone su propio
    # <!doctype>, <html>, <head> y <body>: el mismo contenido sin esas etiquetas.
    bare = re.sub(r'<!doctype html>\s*|</?html[^>]*>\s*|</?head>\s*|</?body[^>]*>\s*', '', html, flags=re.I)
    with open(os.path.join(OUT, 'artifact.html'), 'w', encoding='utf-8') as f:
        f.write(bare)
    shutil.copytree(os.path.join(ROOT, 'css'), os.path.join(OUT, 'css'))
    shutil.copytree(os.path.join(ROOT, 'assets', 'fonts'), os.path.join(OUT, 'assets', 'fonts'))
    shutil.copy(os.path.join(ROOT, 'favicon.ico'), OUT)
    with open(os.path.join(OUT, 'version.json'), 'w') as f:
        f.write('{"v":"lol-proto"}\n')
    if '--preview' in sys.argv:
        preview(entries)
    files = sum(len(fs) for _, _, fs in os.walk(OUT))
    size = sum(os.path.getsize(os.path.join(d, x)) for d, _, fs in os.walk(OUT) for x in fs)
    print(f'ok: {len(roster.CHAMPIONS)} campeones, {len(roster.MONSTERS)} monstruos · {files} archivos · {size / 1e6:.1f} MB en {OUT}')

if __name__ == '__main__':
    main()
