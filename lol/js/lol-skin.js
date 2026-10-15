/* ============ lol-skin.js — textos de Runaterra encima del motor ============
 * El motor está escrito con textos de Pokémon. En vez de tocar cada pantalla,
 * todo texto que se enseña (DOM, canvas, avisos) pasa por G.Skin.apply (ver el
 * parche de js/core/i18n.js en lol/tools/build.py):
 *
 *   español  texto original -> skin.es
 *   inglés   texto original -> traducción de lang-en.js -> skin.en
 *
 * Tres niveles, como i18n: frase exacta, patrón con huecos {x} y palabras
 * sueltas (sólo palabras enteras, respetando mayúsculas).
 */
G.Skin = (() => {
  const L = '\\p{L}\\p{N}';
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function build(d) {
    const exact = new Map(Object.entries(d.exact || {}));
    const patterns = Object.entries(d.patterns || {}).map(([k, v]) => {
      const parts = k.split('{x}').map(reEsc);
      return { re: new RegExp('^' + parts.join('(.+?)') + '$', 'u'), v };
    });
    const words = d.words || {};
    const keys = Object.keys(words).sort((a, b) => b.length - a.length).map(reEsc);
    const wre = keys.length ? new RegExp(`(?<![${L}])(${keys.join('|')})(?![${L}])`, 'gu') : null;
    return { exact, patterns, words, wre };
  }

  const ES = build({
    exact: {
      'Pokémon': 'Campeones',
      'LA SENTENCIA': 'LA CARGA', 'DE ARCEUS': 'DE LA RUINA',
      '¡Marea de Pokémon!': '¡Oleada de súbditos!',
      'Entra en la mazmorra': 'Entra en la Grieta',
      'WASD moverse  ·  1-4 / Q / E o clic en un ataque para cambiarlo  ·  Esc pausa': 'WASD moverse  ·  1-3 o clic en una habilidad para cambiarla (la R va sola)  ·  Esc pausa'
    },
    patterns: {
      'Derrota a {x} Pokémon': 'Derrota a {x} enemigos',
      'Derrota a {x} Pokémon de tipo {x}': 'Derrota a {x} enemigos de elemento {x}',
      'Derrota a {x} Pokémon.': 'Derrota a {x} enemigos.',
      'Ten {x} Pokémon.': 'Ten {x} campeones.',
      'Ten los {x} Pokémon del juego.': 'Ten los {x} campeones del juego.',
      'Aguanta {x} minutos con un Pokémon de tipo {x}': 'Aguanta {x} minutos con un campeón de elemento {x}',
      '¡{x} shiny salvaje apareció!': '¡Ha aparecido {x} de Prestigio!',
      '¡Un {x} shiny anda cerca!': '¡{x} de Prestigio anda cerca!',
      '¡Has conseguido a {x} shiny!': '¡Has conseguido a {x} de Prestigio!',
      '¡Otro {x} shiny! (+300 monedas)': '¡Otro {x} de Prestigio! (+300 monedas)',
      '{x} shiny es ahora tu compañero': '{x} de Prestigio es ahora tu compañero',
      '¡{x} shiny te esperaba en la grieta!': '¡{x} de Prestigio te esperaba en la grieta!',
      '¡{x} acude a la Sentencia!': '¡{x} acude a la Ruina!',
      '¡{x} salvaje apareció!': '¡Ha aparecido {x}!'
    },
    words: {
      'PokéSurvivor': 'RuneSurvivor', 'Pokémonedas': 'Esencia Azul', 'Pokédex': 'Colección',
      'Profesor Pokémon': 'Invocador Experto', 'Maestro Pokémon': 'Maestro de la Grieta',
      'Pokémon perdido': 'campeón perdido', 'Pokémon salvajes': 'monstruos', 'Pokémon': 'campeón',
      'Sentencia de Arceus': 'Carga de la Ruina', 'Sentencia': 'Ruina', 'SENTENCIA': 'RUINA', 'Ruinas del Juicio': 'Camino de la Ruina', 'Arceus': 'Hecarim',
      'shinies': 'Prestigios', 'shiny': 'Prestigio', 'Shiny': 'Prestigio',
      'Mundo Misterioso': 'Runaterra', 'mazmorra': 'Grieta',
      'Baya Zidra': 'Poción de Vida', 'bayas': 'pociones', 'baya': 'poción', 'Síntesis': 'Regeneración',
      'tipos': 'elementos', 'tipo': 'elemento', 'Tipos': 'Elementos', 'Tipo': 'Elemento',
      // nombres viejos de los tipos que salen escritos a mano en algún texto
      'Fuego': 'Infernal', 'Agua': 'Océano', 'Planta': 'Naturaleza', 'Eléctrico': 'Hextech', 'Hielo': 'Escarcha',
      'Lucha': 'Marcial', 'Veneno': 'Quimtech', 'Tierra': 'Montaña', 'Volador': 'Viento', 'Psíquico': 'Arcano',
      'Bicho': 'Vacío', 'Roca': 'Piedra', 'Fantasma': 'Niebla Negra', 'Siniestro': 'Sombra', 'Hada': 'Espíritu'
    }
  });

  const EN = build({
    exact: { 'Pokémon': 'Champions', 'Pokémon swarm!': 'Minion wave!', 'Enter the dungeon': 'Enter the Rift' },
    patterns: {
      'Defeat {x} Pokémon': 'Defeat {x} enemies', 'Defeat {x} {x}-type Pokémon': 'Defeat {x} {x} enemies',
      'Defeat {x} Pokémon.': 'Defeat {x} enemies.', 'Own {x} Pokémon.': 'Own {x} champions.',
      'Own all {x} Pokémon in the game.': 'Own all {x} champions in the game.',
      'Survive {x} minutes with a {x}-type Pokémon': 'Survive {x} minutes with a {x} champion',
      'A shiny {x} is nearby!': 'Prestige {x} is nearby!', 'You got a shiny {x}!': 'You got Prestige {x}!',
      'A wild {x} appeared!': '{x} has appeared!'
    },
    words: {
      'PokéSurvivor': 'RuneSurvivor', 'PokéCoins': 'Blue Essence', 'Pokédex': 'Collection',
      'Pokémon Professor': 'Expert Summoner', 'Pokémon Master': 'Rift Master', 'Pokémon': 'champion',
      'Judgment of Arceus': 'Charge of the Ruination', 'Judgment': 'Ruination', 'JUDGMENT': 'RUINATION', 'Arceus': 'Hecarim',
      'shinies': 'Prestige skins', 'Shinies': 'Prestige skins', 'shiny': 'Prestige', 'Shiny': 'Prestige',
      'Mystery Dungeon': 'Runeterra', 'dungeon': 'Rift',
      'Sitrus Berry': 'Health Potion', 'berries': 'potions', 'berry': 'potion',
      'types': 'elements', 'type': 'element', 'Types': 'Elements', 'Type': 'Element'
    }
  });

  function keepCase(src, v, atStart) {
    if (src === src.toUpperCase() && /\p{L}/u.test(src) && src.length > 1) return v.toUpperCase();
    if (atStart) return v.charAt(0).toUpperCase() + v.slice(1);
    return v;
  }

  function run(D, s) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    const body = m[2];
    if (!body) return s;
    let r = D.exact.get(body);
    if (r === undefined) {
      for (const p of D.patterns) {
        const mm = p.re.exec(body);
        if (!mm) continue;
        let i = 1;
        r = p.v.replace(/\{x\}/g, () => run(D, mm[i++] || ''));
        break;
      }
    }
    if (r === undefined && D.wre) {
      r = body.replace(D.wre, (w, _g, off, all) => {
        const before = all.slice(0, off).trimEnd();
        const atStart = !before || /[.!?¡¿:·]$/.test(before);
        return keepCase(w, D.words[w], atStart);
      });
    }
    return m[1] + (r === undefined ? body : r) + m[3];
  }

  /** Texto ya en su idioma -> texto de Runaterra. */
  function apply(s, lang) {
    if (!s || typeof s !== 'string') return s;
    return run(lang === 'en' ? EN : ES, s);
  }

  return { apply };
})();
