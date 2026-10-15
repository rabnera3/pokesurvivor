/* ============ lol-game.js — nombres de Runaterra para los datos del motor ============
 * Se carga después de todos los datos y sistemas (ver lol/tools/build.py) y
 * sólo cambia NOMBRES: los números (daño, recargas, probabilidades...) son los
 * de PokéSurvivor, así el balance es exactamente el mismo.
 *
 *   tipos       -> elementos (misma tabla de daño)
 *   movimientos -> habilidades (mismos efectos, nombre de LoL)
 *   objetos, banners del gacha (regiones) y compañeros iniciales
 */
(() => {
  // [español, inglés]
  const TYPES = {
    normal: ['Normal', 'Normal'], fire: ['Infernal', 'Infernal'], water: ['Océano', 'Ocean'],
    grass: ['Naturaleza', 'Nature'], electric: ['Hextech', 'Hextech'], ice: ['Escarcha', 'Frost'],
    fighting: ['Marcial', 'Martial'], poison: ['Quimtech', 'Chemtech'], ground: ['Montaña', 'Mountain'],
    flying: ['Viento', 'Wind'], psychic: ['Arcano', 'Arcane'], bug: ['Vacío', 'Void'],
    rock: ['Piedra', 'Stone'], ghost: ['Niebla Negra', 'Black Mist'], dragon: ['Dragón', 'Dragon'],
    dark: ['Sombra', 'Shadow'], steel: ['Acero', 'Steel'], fairy: ['Espíritu', 'Spirit']
  };

  // id: [nombre, evolución, nombre en inglés, evolución en inglés]
  const MOVES = {
    'tackle':         ['Golpe Certero', 'Golpe Decisivo', 'Sure Strike', 'Decisive Strike'],
    'quick-attack':   ['Destello', 'Destello Hextech', 'Flash', 'Hextech Flash'],
    'swords-dance':   ['Furia del Invocador', null, "Summoner's Fury", null],
    'agility':        ['Fantasmal', null, 'Ghost', null],
    'harden':         ['Barrera', null, 'Barrier', null],
    'body-slam':      ['Embestida', 'Golpe Demoledor', 'Bash', 'Crushing Blow'],
    'hyper-voice':    ['Grito de Guerra', 'Rugido Atronador', 'War Cry', 'Thundering Roar'],
    'substitute':     ['Torreta', 'Torreta H-28', 'Turret', 'H-28 Turret'],
    'ember':          ['Chispa Ígnea', 'Pira Infernal', 'Ignite', 'Infernal Pyre'],
    'flamethrower':   ['Aliento Ígneo', 'Conflagración', 'Searing Breath', 'Conflagration'],
    'fire-spin':      ['Escudo de Llamas', 'Corona Solar', 'Flame Shield', 'Solar Crown'],
    'heat-wave':      ['Ola de Calor', 'Erupción Infernal', 'Heat Wave', 'Infernal Eruption'],
    'will-o-wisp':    ['Brasero', 'Tibbers', 'Brazier', 'Tibbers'],
    'flame-wheel':    ['Rastro Ígneo', 'Carrera Abrasadora', 'Blazing Trail', 'Scorching Dash'],
    'water-gun':      ['Burbuja Oceánica', 'Marea Creciente', 'Ocean Bubble', 'Rising Tide'],
    'bubble':         ['Oleaje', 'Maremoto', 'Surge', 'Tidal Wave'],
    'hydro-pump':     ['Chorro Abisal', 'Carga de Profundidad', 'Abyssal Jet', 'Depth Charge'],
    'aqua-ring':      ['Bendición del Mar', null, "Sea's Blessing", null],
    'bubble-beam':    ['Espuma Marina', 'Tormenta Marina', 'Sea Foam', 'Sea Storm'],
    'vine-whip':      ['Látigo de Espinas', 'Zarzas', 'Thorn Lash', 'Brambles'],
    'razor-leaf':     ['Hoja Bumerán', 'Lluvia de Hojas', 'Leaf Boomerang', 'Leaf Rain'],
    'leaf-storm':     ['Pétalos Danzantes', 'Flor Explosiva', 'Dancing Petals', 'Blast Cone'],
    'giga-drain':     ['Raíces Ancestrales', 'Ira de Ixtal', 'Ancient Roots', "Ixtal's Wrath"],
    'thunder-shock':  ['Descarga Hextech', 'Rayo Hextech', 'Hextech Shock', 'Hextech Bolt'],
    'discharge':      ['Campo Estático', 'Tormenta Estática', 'Static Field', 'Static Storm'],
    'thunderbolt':    ['Rayo en Cadena', 'Tormenta Eléctrica', 'Chain Lightning', 'Lightning Storm'],
    'confusion':      ['Orbe Arcano', 'Explosión Arcana', 'Arcane Orb', 'Arcane Blast'],
    'psybeam':        ['Rayo Arcano', 'Chispa Final', 'Arcane Beam', 'Final Spark'],
    'psychic':        ['Pulso Arcano', 'Singularidad', 'Arcane Pulse', 'Singularity'],
    'psycho-cut':     ['Orbe del Engaño', 'Orbe Espiritual', 'Orb of Deception', 'Spirit Orb'],
    'sludge':         ['Frasco Químico', 'Bomba Quimtech', 'Chem Flask', 'Chemtech Bomb'],
    'poison-sting':   ['Dardo Cegador', 'Dardo Tóxico', 'Blinding Dart', 'Toxic Dart'],
    'toxic':          ['Rastro Tóxico', 'Gas de Zaun', 'Toxic Trail', 'Zaun Gas'],
    'toxic-spikes':   ['Seta Nociva', 'Campo de Setas', 'Noxious Shroom', 'Shroom Field'],
    'mud-shot':       ['Esquirlas Sísmicas', 'Sacudida Sísmica', 'Seismic Shards', 'Seismic Quake'],
    'bulldoze':       ['Temblor', 'Fuerza Imparable', 'Tremor', 'Unstoppable Force'],
    'bonemerang':     ['Bumerán', 'Bumerán Óseo', 'Boomerang Throw', 'Bone Boomerang'],
    'spikes':         ['Campo de Piedras', 'Grieta Sísmica', 'Stone Field', 'Seismic Rift'],
    'gust':           ['Muro de Viento', 'Tempestad', 'Wind Wall', 'Tempest'],
    'wing-attack':    ['Tempestad de Acero', 'Último Aliento', 'Steel Tempest', 'Last Breath'],
    'aerial-ace':     ['Barrido', 'Barrido Tempestuoso', 'Sweeping Blade', 'Gale Sweep'],
    'bug-bite':       ['Probar el Miedo', 'Depredador del Vacío', 'Taste Their Fear', 'Void Predator'],
    'string-shot':    ['Huevos del Vacío', 'Nido del Vacío', 'Void Eggs', 'Void Nest'],
    'bug-buzz':       ['Zumbido del Vacío', 'Plaga del Vacío', 'Void Buzz', 'Void Plague'],
    'rock-throw':     ['Esquirla de Piedra', 'Lanza de Piedra', 'Stone Shard', 'Stone Spear'],
    'rock-slide':     ['Ruptura', 'Lluvia de Piedras', 'Rupture', 'Stone Rain'],
    'ice-beam':       ['Flecha Glacial', 'Flecha de Cristal', 'Frost Arrow', 'Crystal Arrow'],
    'powder-snow':    ['Escarcha', 'Tormenta Glacial', 'Frostbite', 'Glacial Storm'],
    'hail':           ['Granizo', 'Avalancha de Freljord', 'Hail', 'Freljord Avalanche'],
    'karate-chop':    ['Patada del Dragón', 'Furia del Monje', "Dragon's Kick", "Monk's Fury"],
    'aura-sphere':    ['Onda Sónica', 'Golpe Resonante', 'Sonic Wave', 'Resonating Strike'],
    'lick':           ['Toque Espectral', 'Siega', 'Spectral Touch', 'Reap'],
    'shadow-ball':    ['Orbe de Niebla', 'Niebla Negra', 'Mist Orb', 'Black Mist'],
    'hex':            ['Maldición', 'Ruina', 'Curse', 'Ruination'],
    'dragon-rage':    ['Aliento Estelar', 'Voz de la Luz', 'Starsurge', 'Voice of Light'],
    'dragon-dance':   ['Danza Dracónica', null, 'Draconic Dance', null],
    'bite':           ['Diezmar', 'Guillotina Noxiana', 'Decimate', 'Noxian Guillotine'],
    'dark-pulse':     ['Pulso Sombrío', 'Sombra de Muerte', 'Shadow Pulse', 'Death Shadow'],
    'night-shade':    ['Aura Tenebrosa', 'Visión Lúgubre', 'Dark Aura', 'Grim Vision'],
    'fairy-wind':     ['Llama Zorruna', 'Ímpetu Espiritual', 'Fox-Fire', 'Spirit Rush'],
    'dazzling-gleam': ['Destello Espiritual', 'Encanto', 'Spirit Gleam', 'Charm'],
    'metal-claw':     ['Juicio', 'Justicia Demaciana', 'Judgment', 'Demacian Justice'],
    'flash-cannon':   ['Cañón Hextech', 'Láser Hextech', 'Hextech Cannon', 'Hextech Laser'],
    'meteor-mash':    ['Bombardeo', 'Cañonazo', 'Bombardment', 'Cannon Barrage']
  };

  const ITEMS = {
    leftovers:   ['Armadura de Warmog', "Warmog's Armor"],
    choiceband:  ['Filo Infinito', 'Infinity Edge'],
    quickclaw:   ['Cuchillas de Navori', 'Navori Blades'],
    focussash:   ['Reloj de Zhonya', "Zhonya's Hourglass"],
    shellbell:   ['Sanguinaria', 'Bloodthirster'],
    amuletcoin:  ['Moneda Antigua', 'Ancient Coin'],
    luckyegg:    ['Tomo Ancestral', 'Ancient Tome'],
    lifeorb:     ['Sombrero de Rabadon', "Rabadon's Deathcap"],
    choicescarf: ['Botas de Movilidad', 'Boots of Mobility'],
    rockyhelmet: ['Malla de Espinas', 'Thornmail'],
    assaultvest: ['Corazón Helado', 'Frozen Heart']
  };

  const en = {};
  for (const t in TYPES) { G.U.TYPE_NAME[t] = TYPES[t][0]; en[TYPES[t][0]] = TYPES[t][1]; }
  for (const m of G.Moves.ALL) {
    const n = MOVES[m.id];
    if (!n) continue;
    m.name = n[0]; en[n[0]] = n[2];
    if (n[1] && G.Moves.EVO[m.id]) { G.Moves.EVO[m.id][0] = n[1]; en[n[1]] = n[3]; }
  }
  for (const it of G.Items.LIST) {
    const n = ITEMS[it.id];
    if (n) { it.name = n[0]; en[n[0]] = n[1]; }
  }

  // ---- regiones (banners del gacha y pestañas de la colección) ----
  G.Gacha.BANNERS.length = 0;
  G.LOL_REGIONS.forEach(([name, color], i) => G.Gacha.BANNERS.push({ gen: i + 1, name, color }));
  Object.assign(en, {
    'Jonia y Targon': 'Ionia & Targon', 'Demacia, Noxus y Zaun': 'Demacia, Noxus & Zaun',
    'Freljord, Bandle e Ixtal': 'Freljord, Bandle & Ixtal', 'El Vacío, Shurima y Aguasturbias': 'The Void, Shurima & Bilgewater',
    'Cofre Hextech': 'Hextech Chest', 'Campeones': 'Champions', 'Esencia Azul': 'Blue Essence',
    'Los {x} campeones de {x}. ¡Los legendarios esperan!': 'The {x} champions of {x}. The legendaries await!'
  });

  // ---- compañeros iniciales (test de personalidad) ----
  G.STARTERS.length = 0;
  for (const c of G.LOL_CHAMPS) if (c.traits) G.STARTERS.push({ dex: c.dex, start: c.start, traits: c.traits });
  for (const k in G.STARTER_BY) delete G.STARTER_BY[k];
  for (const s of G.STARTERS) G.STARTER_BY[s.dex] = s;

  // Sin donaciones en el prototipo (y la política de Riot no permite cobrar).
  G.Funding.kofi = '';

  G.I18n.add(en);

  // ---- pantalla de subir de nivel: la habilidad que se acaba de desbloquear ----
  const DT_NAME = { phys: 'daño físico', magic: 'daño mágico', true: 'daño verdadero' };
  const fmtS = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
  // G.RunUI se carga después que este archivo: se engancha al terminar de cargar todo.
  setTimeout(() => {
  const oShow = G.RunUI.showLevelUp;
  G.RunUI.showLevelUp = function (level, list, cb, coop) {
    oShow.apply(this, arguments);
    const pl = G.Game.player, cards = document.getElementById('cards');
    let box = document.getElementById('lol-newabil');
    if (!box && cards) {
      box = document.createElement('div');
      box.id = 'lol-newabil';
      box.style.cssText = 'max-width:560px;margin:0 auto 10px;padding:10px 12px;border-radius:10px;' +
        'background:rgba(20,30,50,.92);border:2px solid #e0b84a;text-align:left;font-size:14px;line-height:1.35';
      cards.parentNode.insertBefore(box, cards);
    }
    if (!box) return;
    // Las que se desbloquean justo en el nivel de esta pantalla (si se suben
    // varios de golpe, cada pantalla enseña las suyas).
    const fresh = pl && pl.abil ? ['Q', 'W', 'E', 'R'].filter(k => G.Kit.UNLOCK[k] === level && k !== 'Q' && pl.abil[k]).map(k => pl.abil[k]) : [];
    box.style.display = fresh.length ? '' : 'none';
    box.innerHTML = fresh.map(m => {
      const info = [m.noDmg ? 'sin daño' : DT_NAME[m.dt] || '', 'recarga ' + fmtS(m.cdEff || m.cd) + ' s'].filter(Boolean).join(' · ');
      return `<div style="margin:2px 0"><b style="color:#ffd23f">¡Nueva habilidad!</b> ` +
        `<span style="background:#e0b84a;color:#1b1528;border-radius:4px;padding:0 5px;font-weight:700">${m.key}</span> ` +
        `<b>${G.I18n.t(m.name)}</b> <span style="opacity:.7">(${info})</span><br>${G.I18n.t(m.desc || '')}</div>`;
    }).join('');
  };
  }, 0);

  // ---- botón de pruebas (sólo en el prototipo): todos los campeones y sus Prestigios ----
  const b = document.createElement('button');
  b.textContent = '🔧 Pruebas';
  b.title = 'Desbloquea todos los campeones y sus aspectos de Prestigio';
  b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:60;padding:6px 10px;font:600 13px Pixelify,"Segoe UI",sans-serif;' +
                    'background:#1d2433;color:#e8c050;border:2px solid #e8c050;border-radius:6px;cursor:pointer;opacity:.9';
  b.onclick = () => {
    if (!G.DB.save) { G.UI.toast('Entra primero (como invitado vale)'); return; }
    for (const p of G.DEX) { G.DB.grant(p.dex, 'pruebas'); if (!p.leg) G.DB.grantShiny(p.dex, 'pruebas'); }
    G.DB.commit();
    G.Audio.sfx('buy');
    G.UI.toast('Tienes todos los campeones y sus Prestigios');
  };
  const place = () => { if (document.body && !b.parentNode) document.body.appendChild(b); };
  place(); document.addEventListener('DOMContentLoaded', place);
  setInterval(() => { b.style.display = G.Game && G.Game.state === 'ui' && G.DB.save ? '' : 'none'; }, 400);
})();
