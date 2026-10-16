/* ============ lol-kits.js — el kit de cada campeón ============
 *
 * Cada habilidad usa una de las formas de atacar del motor (combat.js) como
 * base y le pone sus números y sus mecánicas:
 *
 *   kind   projectile · melee · beam · orbit · nova · aura · boomerang · chain ·
 *          mine · meteor · turret · dash · trail · cone · buff
 *   dt     'phys' | 'magic' | 'true'
 *   base   daño base por rango · adR / apR / arR / mrR / hpR: proporciones
 *          (hpR sobre la vida EXTRA) · cd: recarga por rango (segundos)
 *   ranks  cambios extra al subir a cada rango (como las escaleras del motor:
 *          count/pierce/stacks se suman, el resto se multiplica)
 *   evo    { item, name, text, mods, set }: al rango máximo, con ese objeto,
 *          evoluciona (carta dorada). mods como ranks; set pone valores tal cual.
 *
 * Mecánicas propias (combat.js de lol/js/engine):
 *   stun s · pull f · exec k (más daño cuanto menos vida le quede) · drain k
 *   (te curas k × daño) · shred k (−k armadura 4 s) · isolated k (más daño si
 *   está solo) · vsSlow k (más daño si va lento o aturdido) · crits (puede
 *   hacer crítico) · repeat n + every s (se lanza n veces seguidas) · alt
 *   (cada 3.er lanzamiento usa esos valores) · explode r (los proyectiles
 *   estallan) · land r (al acabar una embestida, golpe en área) · blockShots
 *   (las órbitas paran disparos) · self { stat, amount, dur, stacks } (mejora
 *   propia al lanzarla) · shield n / shieldR (escudo al lanzarla) · invuln s ·
 *   resetOnKill (si mata, se recarga) · grow (Cho'Gath)
 *
 * Desbloqueo por nivel: Q al empezar, W al 3, E al 6 y la definitiva (R) al 10.
 * Rangos: Q/W/E hasta 5 (el rango r pide nivel 2r−1), R hasta 3 (niveles 10, 14
 * y 18). La R se lanza sola en cuanto se recarga; Q/W/E: la activa (1-3).
 */
G.KITS = {};
G.Kit = (() => {
  const UNLOCK = { Q: 1, W: 3, E: 6, R: 10 };
  const MAX = { Q: 5, W: 5, E: 5, R: 3 };
  const MULT = ['dmgK', 'cdK', 'speed', 'radius', 'dur', 'amount', 'arc', 'width', 'spread', 'life', 'size', 'rate', 'stun',
                'slow', 'drain', 'exec', 'pull', 'knock', 'explode', 'land', 'shieldR', 'every', 'up'];

  // Mecánicas nuevas al llegar al rango 3 y al 5 (subir una habilidad no es sólo
  // subir números). Cada habilidad puede traer las suyas en `perks`; si no, las
  // de su forma de atacar. set: valores (los números, el mayor de los dos);
  // mods: como ranks (count/pierce/repeat se suman, el resto se multiplica).
  const PERKS = {
    melee:      { 3: { text: 'Aturde 0,35 s', set: { stun: 0.35 } }, 5: { text: 'Golpe más amplio (+20 % de arco)', mods: { arc: 1.2 } } },
    projectile: { 3: { text: 'Atraviesa a 1 enemigo más', mods: { pierce: 1 } }, 5: { text: 'Ralentiza un 25 %', set: { slow: 0.25 } } },
    beam:       { 3: { text: 'Ralentiza un 30 %', set: { slow: 0.3 } }, 5: { text: '+50 % de anchura', mods: { width: 1.5 } } },
    aura:       { 3: { text: 'Ralentiza un 25 %', set: { slow: 0.25 } }, 5: { text: '+12 % de radio', mods: { radius: 1.12 } } },
    nova:       { 3: { text: '+4 proyectiles', mods: { count: 4 } }, 5: { text: 'Aturde 0,4 s', set: { stun: 0.4 } } },
    boomerang:  { 3: { text: 'Ralentiza un 25 %', set: { slow: 0.25 } }, 5: { text: '+20 % de alcance', mods: { radius: 1.2 } } },
    chain:      { 3: { text: '+1 salto', mods: { count: 1 } }, 5: { text: 'Aturde 0,4 s', set: { stun: 0.4 } } },
    dash:       { 3: { text: 'Invulnerable 0,35 s al embestir', set: { invuln: 0.35 } }, 5: { text: 'Aturde 0,3 s', set: { stun: 0.3 } } },
    meteor:     { 3: { text: '+20 % de área', mods: { radius: 1.2 } }, 5: { text: 'Aturde 0,5 s', set: { stun: 0.5 } } },
    cone:       { 3: { text: 'Ralentiza un 30 %', set: { slow: 0.3 } }, 5: { text: 'Aturde 0,3 s', set: { stun: 0.3 } } },
    orbit:      { 3: { text: '+1 orbe', mods: { count: 1 } }, 5: { text: 'Dura un 30 % más', mods: { up: 1.3 } } },
    turret:     { 3: { text: 'Dura un 30 % más', mods: { dur: 1.3 } }, 5: { text: '+1 a la vez', mods: { count: 1 } } },
    mine:       { 3: { text: '+1 trampa a la vez', mods: { count: 1 } }, 5: { text: 'Ralentiza un 40 %', set: { slow: 0.4 } } },
    trail:      { 3: { text: 'Ralentiza un 30 %', set: { slow: 0.3 } }, 5: { text: 'El rastro dura un 50 % más', mods: { dur: 1.5 } } },
    buff:       { 3: { text: 'Dura un 25 % más', mods: { dur: 1.25 } }, 5: { text: 'Un 30 % más fuerte', mods: { amount: 1.3 } } },
  };
  function perkOf(m, rank) {
    const d = G.KITS[m.dex] && G.KITS[m.dex][m.key];
    if (!d || m.key === 'R') return null;
    return (d.perks && d.perks[rank]) || (PERKS[m.kind] && PERKS[m.kind][rank]) || null;
  }
  function applyPerk(m, pk) {
    applyMods(m, pk.mods);
    for (const k in pk.set || {}) {
      const v = pk.set[k];
      m[k] = typeof v === 'number' && typeof m[k] === 'number' ? Math.max(m[k], v) : v;
    }
    (m.perkList = m.perkList || []).push(pk.text);
  }
  const ADD = ['count', 'pierce', 'stacks', 'burn', 'poison', 'repeat', 'homing', 'shred', 'isolated', 'vsSlow'];

  function applyMods(m, mods) {
    for (const k in mods || {}) {
      if (MULT.includes(k)) m[k] = (m[k] == null ? (k === 'dmgK' || k === 'cdK' ? 1 : 0) : m[k]) * mods[k];
      else if (ADD.includes(k)) m[k] = (m[k] || 0) + mods[k];
      else m[k] = mods[k];
    }
  }

  /** Rango máximo que permite el nivel. */
  function rankCap(key, level) {
    if (key === 'R') return level >= 18 ? 3 : level >= 14 ? 2 : 1;
    return Math.min(MAX[key], Math.floor((level + 1) / 2));
  }

  const idOf = (dex, key) => 'k' + dex + key;

  /** Una habilidad lista para usar (rango 1). */
  function make(dex, key) {
    const d = G.KITS[dex][key];
    const m = Object.assign({}, d, { id: idOf(dex, key), key, lvl: 1, t: 0, dmgK: d.dmgK || 1, cdK: 1, evolved: false });
    delete m.evo; delete m.ranks;
    m.def = G.Moves.BY_ID[m.id];
    m.cd = cdOf(m);
    return m;
  }

  function cdOf(m) {
    const d = G.KITS[m.dex] && G.KITS[m.dex][m.key];
    const arr = d ? d.cd : m.cd;
    const c = Array.isArray(arr) ? arr[Math.min(m.lvl - 1, arr.length - 1)] : arr;
    return c * (m.cdK || 1);
  }

  function rankUp(m) {
    const d = G.KITS[m.dex][m.key];
    if (m.lvl >= MAX[m.key]) return false;
    m.lvl++;
    if (d.ranks && d.ranks[m.lvl - 1]) applyMods(m, d.ranks[m.lvl - 1]);
    const pk = perkOf(m, m.lvl);
    if (pk) applyPerk(m, pk);
    m.cd = cdOf(m);
    return true;
  }

  function evoOf(m) { const d = G.KITS[m.dex] && G.KITS[m.dex][m.key]; return d && d.evo; }

  function evolve(m) {
    const e = evoOf(m);
    if (!e || m.evolved) return false;
    applyMods(m, e.mods);
    Object.assign(m, e.set || {});
    m.baseName = m.name;
    m.name = e.name;
    m.evolved = true;
    m.cd = cdOf(m);
    return true;
  }

  /** Registra cada habilidad en G.Moves (iconos del HUD y el cooperativo). */
  function registerAll() {
    const en = {};
    for (const dex in G.KITS) {
      const k = G.KITS[dex];
      for (const key of ['Q', 'W', 'E', 'R']) {
        const d = k[key];
        if (!d) continue;
        d.dex = +dex; d.key = key;
        const maxLvl = MAX[key];
        const def = Object.assign({}, d, {
          id: idOf(dex, key), maxLvl, dmg: Array.isArray(d.base) ? d.base[0] : d.base || 0,
          cd: Array.isArray(d.cd) ? d.cd[0] : d.cd,
          ups: Array.from({ length: maxLvl - 1 }, () => ({ t: '', m: {} }))
        });
        delete def.evo; delete def.ranks;
        G.Moves.BY_ID[def.id] = def;
        if (d.en) en[d.name] = d.en;
        if (d.evo && d.evo.en) en[d.evo.name] = d.evo.en;
      }
      if (k.passive && k.passive.en) en[k.passive.name] = k.passive.en;
    }
    G.I18n.add(en);
  }

  /** Prepara el kit al empezar la partida. */
  function init(pl, perks) {
    const k = G.KITS[pl.dex];
    pl.kitDef = k;
    pl.abil = {};
    pl.items = [];
    pl.shards = [];
    pl.passive = { def: k.passive, tier: 1 };
    const b = k.basic;
    pl.basicAtk = Object.assign({
      id: 'basic' + pl.dex, basic: true, dt: 'phys', type: b.type, vfx: b.vfx, adR: 1, lvl: 1, t: 0.4, name: 'Ataque básico'
    }, b.range === 'melee'
      ? { kind: 'melee', radius: b.radius || 56, arc: b.arc || 1.7, knock: 30 }
      : { kind: 'projectile', speed: b.speed || 430, size: b.size || 4, life: (b.reach || 260) / (b.speed || 430), count: 1, spread: 0, pierce: 0 });
    if (k.passive && k.passive.init) k.passive.init(pl);
    G.LoL.recalc(pl);
    pl.hp = pl.maxHp;
    unlock(pl, 'Q', true);
    if (perks && perks.startMoves >= 2) unlock(pl, 'W', true);
  }

  /** Desbloquea una habilidad (Q/W/E a un hueco; R aparte). */
  function unlock(pl, key, quiet) {
    if (pl.abil[key] || !G.KITS[pl.dex][key]) return;
    const m = make(pl.dex, key);
    pl.abil[key] = m;
    if (key === 'R') m.t = 2;
    else pl.addMove(m);
    if (!quiet) {
      G.Spawner.say('¡Nueva habilidad! ' + key + ' · ' + m.name, 3, true);
      G.FX.ring(pl.x, pl.y, 8, 120, '#7fb4ff', 0.8, 5);
      G.Audio.sfx('legend');
    }
  }

  /** Al subir de nivel: desbloqueos. */
  function onLevel(pl) {
    for (const key of ['Q', 'W', 'E', 'R']) if (pl.level >= UNLOCK[key] && !pl.abil[key]) unlock(pl, key);
  }

  return { UNLOCK, MAX, applyMods, rankCap, make, rankUp, evolve, evoOf, registerAll, init, unlock, onLevel, idOf, perkOf };
})();

// =====================================================================
//  CAMPEONES
// =====================================================================
(() => {
  const K = (dex, def) => { G.KITS[dex] = def; };
  const now = () => performance.now() / 1000;

  // ------------------------------------------------------------- Garen
  K(86, {
    tags: ['fighter', 'tank', 'ad'], role: 'Luchador',
    base: { hp: 118, hpG: 17, ad: 11, adG: 0.75, ar: 36, arG: 4.2, mr: 32, mrG: 1.6, as: 0.63, asG: 0.036, ms: 112, regen: 0.5, regenG: 0.05 },
    basic: { range: 'melee', type: 'steel', vfx: 'garen-aa' },
    passive: {
      name: 'Perseverancia', en: 'Perseverance',
      desc: ['Si no te golpean en 3 s, recuperas un 1 % de tu vida máxima por segundo.',
             'Recuperas un 2 % por segundo y basta con 2 s sin golpes.',
             'Recuperas un 3 % por segundo y +15 de armadura y resistencia mágica.'],
      tick(pl, dt, t) {
        if (now() - (pl.lastHurtT || -99) > (t >= 2 ? 2 : 3)) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.01 * t * dt);
      },
      stats(st, pl, t) { if (t >= 3) { st.ar += 15; st.mr += 15; } }
    },
    Q: { name: 'Golpe Decisivo', en: 'Decisive Strike', type: 'steel', kind: 'melee', vfx: 'garen-q', dt: 'phys',
         desc: 'Un tajo fuerte delante de ti que te da velocidad.',
         base: [26, 34, 42, 50, 60], adR: 1.1, cd: [0.75, 0.71, 0.67, 0.63, 0.6], radius: 70, arc: 1.6, knock: 90,
         self: { stat: 'spd', amount: 0.25, dur: 1.2, stacks: 1 },
         perks: { 3: { text: 'Silencio de Demacia: el golpe aturde 0,6 s', set: { stun: 0.6 } },
                  5: { text: 'Golpe imparable: rompe un 25 % de armadura (4 s) y te da +40 % de velocidad',
                       set: { shred: 0.25, self: { stat: 'spd', amount: 0.4, dur: 1.5, stacks: 1 } } } },
         evo: { item: 'tf', name: 'Golpe Decisivo Demaciano', en: 'Demacian Decisive Strike',
                text: 'Golpea en 360°, aturde 0,6 s y hace ×1,3 de daño.', mods: { dmgK: 1.3 }, set: { arc: 9, stun: 0.6 } } },
    W: { name: 'Coraje', en: 'Courage', type: 'steel', kind: 'buff', vfx: 'garen-w', dt: 'phys', noDmg: true,
         desc: 'Te proteges: recibes un 30 % menos de daño durante 2,5 s y ganas un escudo (8 % de tu vida máxima). No ataca.',
         base: 0, cd: [12, 11, 10, 9, 8], stat: 'def', amount: 0.3, dur: 2.5, stacks: 1, shieldR: 0.08,
         ranks: [{}, { shieldR: 1.15 }, { dur: 1.2 }, { shieldR: 1.15 }, { dur: 1.2 }],
         perks: { 3: { text: 'Valor: +30 % de velocidad mientras dura', set: { self: { stat: 'spd', amount: 0.3, dur: 2.5, stacks: 1 } } },
                  5: { text: 'Determinación: además te cura un 5 % de tu vida máxima', set: { healR: 0.05 } } },
         evo: { item: 'sterak', name: 'Coraje Inquebrantable', en: 'Unbreakable Courage',
                text: 'Reduce un 45 % el daño, el escudo es el doble y dura 4 s.', mods: { shieldR: 2 }, set: { amount: 0.45, dur: 4 } } },
    E: { name: 'Juicio', en: 'Judgment', type: 'steel', kind: 'aura', vfx: 'garen-e', dt: 'phys',
         desc: 'Giras 3 s con la espada golpeando todo a tu alrededor.',
         base: [5, 7, 9, 11, 13], adR: 0.25, cd: [0.42, 0.4, 0.38, 0.36, 0.34], radius: 74,
         ranks: [{}, {}, { radius: 1.08 }, {}, { radius: 1.08 }],
         perks: { 3: { text: 'Juicio afilado: los golpes del giro pueden ser críticos', set: { crits: true } },
                  5: { text: 'Juicio implacable: el giro dura 1 s más', mods: { repeat: 3 } } },
         evo: { item: 'hydra', name: 'Juicio de Demacia', en: 'Judgment of Demacia',
                text: 'El giro se hace un 50 % más grande, golpea un 50 % más fuerte y rompe armadura.',
                mods: { radius: 1.5, dmgK: 1.5 }, set: { shred: 0.25 } } },
    R: { name: 'Justicia Demaciana', en: 'Demacian Justice', type: 'steel', kind: 'meteor', vfx: 'garen-r', dt: 'true',
         desc: 'Una espada gigante cae del cielo: más daño cuanto menos vida le quede al enemigo.',
         base: [90, 150, 230], adR: 0.6, cd: [16, 13, 10], count: 1, radius: 34, exec: 1.2, knock: 60 }
  });

  // Escala de las estadísticas: vida y DA de LoL entre ~6, armadura/RM tal cual,
  // velocidad de movimiento de LoL entre 3.
  const r5 = (a, b) => [a, a + (b - a) / 4, a + (b - a) / 2, a + 3 * (b - a) / 4, b].map(v => Math.round(v * 10) / 10);
  const cds = (a, b) => r5(a, b).map(v => Math.round(v * 100) / 100);

  // ------------------------------------------------------------- Ahri
  K(103, {
    tags: ['ap', 'assassin'], role: 'Maga asesina',
    base: { hp: 100, hpG: 17, ad: 9, adG: 0.6, ar: 21, arG: 4.2, mr: 30, mrG: 1.3, as: 0.67, asG: 0.022, ms: 112, regen: 0.4, regenG: 0.04 },
    basic: { range: 'ranged', type: 'fairy', vfx: 'ahri-aa', reach: 280 },
    passive: {
      name: 'Robo de Esencia', en: 'Essence Theft',
      desc: ['Cada 9 enemigos derrotados te curas un 4 % de tu vida máxima.',
             'Cada 7 enemigos: un 6 %.',
             'Cada 5 enemigos: un 8 % y ganas velocidad un momento.'],
      onKill(pl, e, t) {
        pl.essence = (pl.essence || 0) + 1;
        if (pl.essence < [9, 7, 5][t - 1]) return;
        pl.essence = 0;
        pl.heal(pl.maxHp * [0.04, 0.06, 0.08][t - 1]);
        if (t >= 3) pl.addBuff('spd', 0.2, 1.5, 1);
      }
    },
    Q: { name: 'Orbe del Engaño', en: 'Orb of Deception', type: 'psychic', kind: 'boomerang', vfx: 'ahri-q', dt: 'magic',
         desc: 'Un orbe que va y vuelve, golpeando a la ida y a la vuelta.',
         base: r5(14, 34), apR: 0.4, cd: cds(0.8, 0.68), count: 1, speed: 340, radius: 210, size: 8, spread: 0.5,
         evo: { item: 'luden', name: 'Orbes del Engaño', en: 'Orbs of Deception', text: 'Lanza dos orbes a la vez y cada uno pega un 15 % más.',
                mods: { count: 1, dmgK: 1.15 } } },
    W: { name: 'Llamas Zorrunas', en: 'Fox-Fire', type: 'fairy', kind: 'orbit', vfx: 'ahri-w', dt: 'magic',
         desc: 'Llamas de zorro que giran a tu alrededor.',
         base: r5(9, 21), apR: 0.25, cd: 0.3, count: 3, radius: 64, speed: 2.6, size: 8,
         ranks: [{}, {}, { count: 1 }, {}, { count: 1 }],
         evo: { item: 'liandry', name: 'Llamas Zorrunas Eternas', en: 'Eternal Fox-Fire', text: '+2 llamas, más radio y queman.',
                mods: { count: 2, radius: 1.2, burn: 1 } } },
    E: { name: 'Encanto', en: 'Charm', type: 'fairy', kind: 'projectile', vfx: 'ahri-e', dt: 'magic',
         desc: 'Un beso que persigue al enemigo y lo deja quieto (encantado).',
         base: r5(32, 74), apR: 0.55, cd: cds(0.85, 0.65), speed: 320, size: 8, life: 1.6, homing: 3, count: 1, spread: 0, pierce: 0, stun: 1.0,
         evo: { item: 'void', name: 'Encanto Irresistible', en: 'Irresistible Charm', text: 'Atraviesa a 3 enemigos, encanta 1,5 s y pega ×1,4.',
                mods: { pierce: 3, stun: 1.5, dmgK: 1.4 } } },
    R: { name: 'Ímpetu Espiritual', en: 'Spirit Rush', type: 'fairy', kind: 'dash', vfx: 'ahri-r', dt: 'magic',
         desc: 'Tres embestidas seguidas; no te pueden dar mientras.',
         base: [45, 70, 95], apR: 0.35, cd: [14, 12, 10], radius: 140, width: 40, repeat: 3, every: 0.35, invuln: 0.3 }
  });

  // ------------------------------------------------------------- Yasuo
  K(157, {
    tags: ['fighter', 'crit', 'ad'], role: 'Luchador',
    base: { hp: 101, hpG: 18, ad: 10, adG: 0.6, ar: 30, arG: 4.6, mr: 32, mrG: 1.3, as: 0.7, asG: 0.025, ms: 115, regen: 0.5, regenG: 0.06 },
    basic: { range: 'melee', type: 'flying', vfx: 'wing-attack' },
    passive: {
      name: 'Camino del Errante', en: 'Way of the Wanderer',
      desc: ['Tu probabilidad de crítico se duplica.',
             'Mientras te mueves, cada 10 s ganas un escudo del 12 % de tu vida.',
             'Tus críticos hacen un 15 % más.'],
      stats(st, pl, t) { st.crit *= 2; if (t >= 3) st.critD += 0.15; },
      tick(pl, dt, t) {
        if (t < 2 || !pl.walking) return;
        if ((pl.flowT = (pl.flowT || 0) + dt) >= 10) { pl.flowT = 0; pl.addShield(pl.maxHp * 0.12); }
      }
    },
    Q: { name: 'Tempestad de Acero', en: 'Steel Tempest', type: 'steel', kind: 'melee', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Estocada larga que puede ser crítica. Cada 3.ª lanza un tornado que aturde.',
         base: r5(16, 40), adR: 1.0, crits: true, cd: cds(0.6, 0.48), radius: 92, arc: 0.6, knock: 40,
         alt: { kind: 'projectile', vfx: 'gust', type: 'flying', speed: 380, size: 12, life: 1.2, pierce: 99, count: 1, spread: 0, stun: 0.75 },
         evo: { item: 'ie', name: 'Tempestad Implacable', en: 'Relentless Tempest', text: 'Más alcance, ×1,3 de daño y cada estocada aturde 0,4 s.',
                mods: { dmgK: 1.3, radius: 1.2 }, set: { stun: 0.4 } } },
    W: { name: 'Muro de Viento', en: 'Wind Wall', type: 'flying', kind: 'orbit', vfx: 'gust', dt: 'phys',
         desc: 'El viento gira a tu alrededor, golpea y para los disparos enemigos.',
         base: r5(7, 19), adR: 0.25, cd: 0.3, count: 2, radius: 58, speed: 3.2, size: 9, blockShots: true,
         ranks: [{}, {}, {}, { count: 1 }, {}],
         evo: { item: 'dd', name: 'Muralla de Viento', en: 'Wind Bastion', text: 'Un 35 % más grande y +2 ráfagas.', mods: { radius: 1.35, count: 2 } } },
    E: { name: 'Barrido', en: 'Sweeping Blade', type: 'flying', kind: 'dash', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Cruzas hacia el enemigo cortando todo el camino (sin recibir daño).',
         base: r5(22, 50), adR: 0.6, cd: cds(0.7, 0.5), radius: 120, width: 44, invuln: 0.25,
         evo: { item: 'botrk', name: 'Barrido Tempestuoso', en: 'Gale Sweep', text: 'Al llegar levanta un remolino que golpea alrededor; ×1,3 de daño.',
                mods: { dmgK: 1.3 }, set: { land: 70 } } },
    R: { name: 'Último Aliento', en: 'Last Breath', type: 'flying', kind: 'chain', vfx: 'thunderbolt', dt: 'phys',
         desc: 'Saltas entre 5 enemigos golpeándolos (puede ser crítico) y los aturdes.',
         base: [70, 110, 150], adR: 1.4, crits: true, cd: [15, 12, 9], count: 5, radius: 170, stun: 1.0 }
  });

  // ------------------------------------------------------------- Lee Sin
  K(64, {
    tags: ['fighter', 'ad', 'assassin'], role: 'Luchador',
    base: { hp: 110, hpG: 18, ad: 12, adG: 0.75, ar: 36, arG: 4.9, mr: 32, mrG: 2, as: 0.65, asG: 0.03, ms: 115, regen: 0.5, regenG: 0.05 },
    basic: { range: 'melee', type: 'fighting', vfx: 'karate-chop' },
    passive: {
      name: 'Ráfaga', en: 'Flurry',
      desc: ['Tras lanzar una habilidad, tus 2 siguientes ataques básicos hacen un 40 % más.',
             'Un 60 % más y te curan un 2 % de tu vida cada uno.',
             'Un 80 % más y son 3 ataques.'],
      onCast(pl, m, t) { pl.flurry = t >= 3 ? 3 : 2; },
      dmgMod(pl, e, d, m, t) {
        if (!m.basic || !(pl.flurry > 0)) return d;
        pl.flurry--;
        if (t >= 2) pl.healAcc += pl.maxHp * 0.02;
        return d * [1.4, 1.6, 1.8][t - 1];
      }
    },
    Q: { name: 'Onda Sónica', en: 'Sonic Wave', type: 'fighting', kind: 'projectile', vfx: 'aura-sphere', dt: 'phys',
         desc: 'Una onda que busca al enemigo.',
         base: r5(26, 62), adR: 0.9, cd: cds(0.55, 0.45), speed: 340, size: 8, life: 1.6, homing: 4, count: 1, spread: 0, pierce: 0,
         evo: { item: 'bc', name: 'Golpe Resonante', en: 'Resonating Strike', text: 'Estalla al golpear, atraviesa a uno más y remata: más daño cuanto menos vida tengan.',
                mods: { pierce: 1 }, set: { exec: 0.6, explode: 40, explodeK: 0.4 } } },
    W: { name: 'Salvaguarda', en: 'Safeguard', type: 'fighting', kind: 'aura', vfx: 'harden', dt: 'phys',
         desc: 'Golpe a tu alrededor que te da escudo y te cura con el daño.',
         base: r5(8, 20), adR: 0.3, cd: 0.7, radius: 66, shield: 4, shieldR: 0.02, drain: 0.12,
         evo: { item: 'sterak', name: 'Voluntad de Hierro', en: 'Iron Will', text: 'Te curas un 30 % del daño y el escudo es el doble.',
                mods: { shieldR: 2 }, set: { drain: 0.3 } } },
    E: { name: 'Tempestad', en: 'Tempest', type: 'fighting', kind: 'nova', vfx: 'hyper-voice', dt: 'phys',
         desc: 'Golpeas el suelo: una onda en todas direcciones que ralentiza.',
         base: r5(12, 28), adR: 0.5, cd: cds(1.0, 0.8), count: 10, speed: 260, life: 0.6, size: 8, pierce: 1, slow: 0.4,
         evo: { item: 'tf', name: 'Mutilar', en: 'Cripple', text: '+6 ondas, ralentiza mucho más y pega ×1,3.', mods: { count: 6, dmgK: 1.3 }, set: { slow: 0.65 } } },
    R: { name: 'Furia del Dragón', en: "Dragon's Rage", type: 'fighting', kind: 'melee', vfx: 'body-slam', dt: 'phys',
         desc: 'Una patada que lanza lejos a los enemigos y los aturde.',
         base: [80, 130, 180], adR: 1.6, cd: [16, 13, 10], radius: 80, arc: 1.4, knock: 260, stun: 1.2 }
  });

  // ------------------------------------------------------------- Wukong
  K(62, {
    tags: ['fighter', 'ad', 'tank'], role: 'Luchador',
    base: { hp: 104, hpG: 17, ad: 12, adG: 0.8, ar: 31, arG: 4.7, mr: 28, mrG: 2, as: 0.69, asG: 0.03, ms: 113, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'fighting', vfx: 'metal-claw' },
    passive: {
      name: 'Piel de Piedra', en: 'Stone Skin',
      desc: ['+5 de armadura y resistencia mágica.', '+12 de armadura y resistencia mágica.', '+20 y regeneras un 0,5 % de tu vida por segundo.'],
      stats(st, pl, t) { const v = [5, 12, 20][t - 1]; st.ar += v; st.mr += v; },
      tick(pl, dt, t) { if (t >= 3) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.005 * dt); }
    },
    Q: { name: 'Golpe Aplastante', en: 'Crushing Blow', type: 'steel', kind: 'melee', vfx: 'meteor-mash', dt: 'phys',
         desc: 'Un bastonazo que rompe la armadura de lo que golpea.',
         base: r5(20, 52), adR: 0.9, cd: cds(0.7, 0.54), radius: 72, arc: 1.4, knock: 60, shred: 0.15,
         ranks: [{}, {}, { shred: 0.05 }, {}, { shred: 0.05 }],
         evo: { item: 'bc', name: 'Golpe Destructor', en: 'Shattering Blow', text: 'Golpe mucho más ancho y largo; ×1,3 de daño.',
                mods: { radius: 1.3, dmgK: 1.3 }, set: { arc: 2.6 } } },
    W: { name: 'Guerrero Ilusorio', en: 'Warrior Trickster', type: 'fighting', kind: 'turret', vfx: 'substitute', dt: 'phys',
         desc: 'Dejas un clon que lucha solo un rato.',
         base: r5(14, 36), adR: 0.5, cd: cds(4, 3.2), rate: 0.4, dur: 6, count: 1, range: 260, speed: 340, size: 7,
         ranks: [{}, {}, {}, { count: 1 }, {}],
         evo: { item: 'hydra', name: 'Ejército de Clones', en: 'Clone Army', text: 'Un clon más, que ataca más deprisa y un 30 % más fuerte.',
                mods: { count: 1, rate: 0.7, dmgK: 1.3 } } },
    E: { name: 'Nimbo', en: 'Nimbus Strike', type: 'flying', kind: 'dash', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Dos embestidas seguidas sobre tu nube.',
         base: r5(16, 40), adR: 0.7, cd: cds(0.9, 0.7), radius: 130, width: 40, repeat: 2, every: 0.2,
         evo: { item: 'tf', name: 'Nube Veloz', en: 'Swift Nimbus', text: 'Tres embestidas y cada una acaba con un golpe en área.',
                mods: { repeat: 1, dmgK: 0.8 }, set: { land: 45 } } },
    R: { name: 'Ciclón', en: 'Cyclone', type: 'fighting', kind: 'aura', vfx: 'discharge', dt: 'phys',
         desc: 'Giras con el bastón unos segundos, golpeando y aturdiendo todo alrededor.',
         base: [30, 45, 60], adR: 0.5, cd: [18, 15, 12], radius: 100, knock: 50, stun: 0.6, repeat: 6, every: 0.35 }
  });

  // ------------------------------------------------------------- Darius
  K(122, {
    tags: ['fighter', 'ad', 'tank'], role: 'Luchador',
    base: { hp: 112, hpG: 19, ad: 11, adG: 1, ar: 39, arG: 5.2, mr: 32, mrG: 2, as: 0.63, asG: 0.03, ms: 113, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'dark', vfx: 'bite' },
    passive: {
      name: 'Hemorragia', en: 'Hemorrhage',
      desc: ['Tus golpes físicos hacen sangrar.', 'Sangran el doble.', 'Haces un 15 % más de daño a los que sangran.'],
      onHit(pl, e, d, m, t) { if (m.dt === 'phys' && !e.dead) e.applyPoison(t >= 2 ? 2 : 1); },
      dmgMod(pl, e, d, m, t) { return t >= 3 && e.poison > 0 ? d * 1.15 : d; }
    },
    Q: { name: 'Diezmar', en: 'Decimate', type: 'dark', kind: 'aura', vfx: 'night-shade', dt: 'phys',
         desc: 'Giras el hacha: golpeas todo alrededor y te curas.',
         base: r5(10, 27), adR: 0.5, cd: cds(0.9, 0.75), radius: 88, drain: 0.06,
         evo: { item: 'sterak', name: 'Diezmar Noxiano', en: 'Noxian Decimate', text: 'Más grande, te cura el doble y pega ×1,3.',
                mods: { radius: 1.25, drain: 2, dmgK: 1.3 } } },
    W: { name: 'Golpe Mutilador', en: 'Crippling Strike', type: 'dark', kind: 'melee', vfx: 'bite', dt: 'phys',
         desc: 'Un hachazo fuerte que ralentiza.',
         base: r5(30, 72), adR: 1.15, cd: cds(0.75, 0.6), radius: 66, arc: 1.0, slow: 0.6, knock: 50,
         evo: { item: 'bc', name: 'Golpe Aplastante', en: 'Crushing Strike', text: 'Más ancho, rompe armadura y pega ×1,3.',
                mods: { dmgK: 1.3 }, set: { arc: 2.0, shred: 0.25 } } },
    E: { name: 'Captura', en: 'Apprehend', type: 'dark', kind: 'beam', vfx: 'dark-pulse', dt: 'phys',
         desc: 'Lanzas el hacha en línea y atraes a los enemigos hacia ti.',
         base: r5(14, 38), adR: 0.5, cd: cds(1.1, 0.9), radius: 190, width: 44, pull: 160,
         evo: { item: 'dd', name: 'Captura Implacable', en: 'Relentless Apprehend', text: 'Más larga y ancha, ralentiza y pega ×1,3.',
                mods: { radius: 1.25, width: 1.5, dmgK: 1.3 }, set: { slow: 0.5 } } },
    R: { name: 'Guillotina Noxiana', en: 'Noxian Guillotine', type: 'dark', kind: 'chain', vfx: 'hex', dt: 'true',
         desc: 'Daño verdadero a un enemigo, mucho más cuanto menos vida le quede; si lo mata, se recarga.',
         base: [80, 140, 200], adR: 1.2, cd: [14, 11, 8], count: 1, radius: 10, exec: 1.5, resetOnKill: true }
  });

  // ------------------------------------------------------------- Swain
  K(50, {
    tags: ['ap', 'tank'], role: 'Mago',
    base: { hp: 102, hpG: 17, ad: 10, adG: 0.6, ar: 25, arG: 5.2, mr: 31, mrG: 1.3, as: 0.63, asG: 0.02, ms: 108, regen: 0.5, regenG: 0.05 },
    basic: { range: 'ranged', type: 'dark', vfx: 'shadow-ball', reach: 260 },
    passive: {
      name: 'Bandada Voraz', en: 'Ravenous Flock',
      desc: ['Algunos enemigos derrotados te dan un fragmento de alma: +2 de vida máxima para siempre.',
             '+3 por fragmento y te curan un 3 %.', '+4 por fragmento y salen el doble.'],
      onKill(pl, e, t) {
        if (Math.random() > (t >= 3 ? 0.3 : 0.15) || (pl.souls || 0) >= 120) return;
        pl.souls = (pl.souls || 0) + [2, 3, 4][t - 1];
        if (t >= 2) pl.heal(pl.maxHp * 0.03);
        pl.dirtyStats = true;
      },
      stats(st, pl) { st.hp += pl.souls || 0; }
    },
    Q: { name: 'Mano de la Muerte', en: 'Death’s Hand', type: 'dark', kind: 'cone', vfx: 'flamethrower', dt: 'magic',
         desc: 'Un abanico de rayos de sombra que atraviesan.',
         base: r5(6, 14), apR: 0.12, cd: cds(0.7, 0.54), count: 5, arc: 0.8, speed: 360, life: 0.42, size: 6, pierce: 2,
         ranks: [{}, {}, { count: 1 }, {}, { count: 1 }],
         evo: { item: 'liandry', name: 'Mano del Imperio', en: 'Hand of the Empire', text: '+3 rayos, más alcance y ×1,3 de daño.',
                mods: { count: 3, life: 1.3, dmgK: 1.3 } } },
    W: { name: 'Visión del Imperio', en: 'Vision of Empire', type: 'dark', kind: 'meteor', vfx: 'shadow-ball', dt: 'magic',
         desc: 'Un ojo demoníaco estalla sobre un enemigo y ralentiza.',
         base: r5(30, 78), apR: 0.6, cd: cds(1.6, 1.2), count: 1, radius: 70, slow: 0.6,
         evo: { item: 'rylai', name: 'Ojos del Imperio', en: 'Eyes of Empire', text: 'Dos ojos a la vez y más grandes.', mods: { count: 1, radius: 1.1 } } },
    E: { name: 'Agarre Noxiano', en: 'Nevermove', type: 'dark', kind: 'boomerang', vfx: 'bonemerang', dt: 'magic',
         desc: 'Lanzas una garra que vuelve arrastrando enemigos.',
         base: r5(14, 38), apR: 0.4, cd: cds(1.0, 0.8), count: 1, speed: 320, radius: 220, size: 9, pull: 130, stun: 0.4,
         evo: { item: 'void', name: 'Garras Noxianas', en: 'Noxian Claws', text: 'Tres garras y ×1,3 de daño.', mods: { count: 2, dmgK: 1.3 } } },
    R: { name: 'Ascensión Demoníaca', en: 'Demonic Ascension', type: 'dark', kind: 'aura', vfx: 'night-shade', dt: 'magic',
         desc: 'Te transformas unos segundos: dañas todo alrededor y te curas mucho.',
         base: [12, 18, 24], apR: 0.12, cd: [20, 17, 14], radius: 110, drain: 0.35, repeat: 12, every: 0.33 }
  });

  // ------------------------------------------------------------- Ashe
  K(22, {
    tags: ['marksman', 'crit', 'ad'], role: 'Tiradora',
    base: { hp: 104, hpG: 17, ad: 10, adG: 0.6, ar: 26, arG: 4.6, mr: 30, mrG: 1.3, as: 0.66, asG: 0.033, ms: 108, regen: 0.4, regenG: 0.04 },
    basic: { range: 'ranged', type: 'ice', reach: 310, speed: 470 },
    passive: {
      name: 'Disparo Gélido', en: 'Frost Shot',
      desc: ['Tus ataques básicos ralentizan.', 'Haces un 15 % más a los enemigos lentos.', 'Haces un 30 % más a los enemigos lentos.'],
      onHit(pl, e, d, m) { if (m.basic) e.applySlow(0.3, 1.5); },
      dmgMod(pl, e, d, m, t) { return t >= 2 && e.slow > 0 ? d * (t >= 3 ? 1.3 : 1.15) : d; }
    },
    Q: { name: 'Ráfaga de Flechas', en: 'Ranger’s Focus', type: 'ice', kind: 'projectile', vfx: 'ice-beam', dt: 'phys',
         desc: 'Varias flechas a la vez (pueden ser críticas).',
         base: r5(9, 21), adR: 0.5, crits: true, cd: cds(0.5, 0.42), count: 3, spread: 0.12, speed: 460, size: 5, life: 0.75, pierce: 0,
         ranks: [{}, {}, { count: 1 }, {}, { count: 1 }],
         evo: { item: 'ie', name: 'Concentración del Guardián', en: 'Ranger’s Concentration', text: '+1 flecha que atraviesa a uno más; ×1,1 de daño.',
                mods: { count: 1, pierce: 1, dmgK: 1.1 } } },
    W: { name: 'Andanada', en: 'Volley', type: 'ice', kind: 'cone', vfx: 'powder-snow', dt: 'phys',
         desc: 'Un abanico de flechas heladas que ralentiza.',
         base: r5(7, 19), adR: 0.3, cd: cds(0.8, 0.64), count: 9, arc: 1.1, speed: 420, life: 0.7, size: 5, slow: 0.3,
         evo: { item: 'kraken', name: 'Andanada Glacial', en: 'Glacial Volley', text: '+5 flechas y un abanico más ancho.', mods: { count: 5, arc: 1.3 } } },
    E: { name: 'Halcón', en: 'Hawkshot', type: 'flying', kind: 'projectile', vfx: 'wing-attack', dt: 'phys',
         desc: 'Un halcón de hielo que atraviesa todo lo que encuentra.',
         base: r5(10, 26), adR: 0.4, cd: cds(1.4, 1.0), count: 1, spread: 0, speed: 520, size: 9, life: 1.6, pierce: 99,
         evo: { item: 'berserker', name: 'Bandada de Halcones', en: 'Hawk Flock', text: 'Tres halcones y ×1,4 de daño.', mods: { count: 2, dmgK: 1.4 }, set: { spread: 0.4 } } },
    R: { name: 'Flecha de Cristal Encantada', en: 'Enchanted Crystal Arrow', type: 'ice', kind: 'projectile', vfx: 'ice-beam', dt: 'magic',
         desc: 'Una flecha enorme que aturde y estalla alrededor.',
         base: [90, 140, 190], adR: 1.0, cd: [16, 13, 10], count: 1, spread: 0, speed: 380, size: 12, life: 2.0, pierce: 0, stun: 2.0, explode: 90, explodeK: 0.6 }
  });

  // ------------------------------------------------------------- Gnar
  K(150, {
    tags: ['fighter', 'tank', 'marksman'], role: 'Luchador',
    base: { hp: 92, hpG: 13, ad: 10, adG: 0.65, ar: 32, arG: 3.5, mr: 30, mrG: 0.5, as: 0.63, asG: 0.06, ms: 112, regen: 0.4, regenG: 0.04 },
    basic: { range: 'ranged', type: 'ground', reach: 200, speed: 380, size: 5 },
    passive: {
      name: 'Furia Genética', en: 'Rage Gene',
      desc: ['Al golpear acumulas furia; llena, te conviertes en Mega Gnar 10 s (más vida, daño y armadura, y más grande).',
             'Acumulas la furia un 50 % más deprisa.', 'Mega Gnar dura 15 s.'],
      onHit(pl, e, d, m, t) {
        if (pl.megaT > 0) return;
        pl.rage = (pl.rage || 0) + (m.basic ? 5 : 3) * (t >= 2 ? 1.5 : 1);
        if (pl.rage >= 100) {
          pl.rage = 0; pl.megaT = t >= 3 ? 15 : 10; pl.dirtyStats = true; pl.anim.scale = 1.35;
          G.FX.ring(pl.x, pl.y, 8, 90, '#ffb35c', 0.6, 5); G.FX.dmgText(pl.x, pl.y - pl.bodyH - 14, '¡GNAR!', '#ffb35c', true);
        }
      },
      tick(pl, dt) { if (pl.megaT > 0 && (pl.megaT -= dt) <= 0) { pl.dirtyStats = true; pl.anim.scale = 1; } },
      stats(st, pl) { if (pl.megaT > 0) { st.hp *= 1.4; st.ad *= 1.3; st.ar += 30; st.mr += 20; } }
    },
    Q: { name: 'Lanzamiento de Bumerán', en: 'Boomerang Throw', type: 'ground', kind: 'boomerang', vfx: 'bonemerang', dt: 'phys',
         desc: 'Un bumerán que va, vuelve y ralentiza.',
         base: r5(10, 28), adR: 0.7, cd: cds(0.85, 0.65), count: 1, speed: 300, radius: 230, size: 8, knock: 40, slow: 0.3, spread: 0.5,
         evo: { item: 'tf', name: 'Bumerán Doble', en: 'Double Boomerang', text: 'Dos bumeranes y ×1,3 de daño.', mods: { count: 1, dmgK: 1.3 } } },
    W: { name: 'Bramido', en: 'Wallop', type: 'ground', kind: 'aura', vfx: 'bulldoze', dt: 'phys',
         desc: 'Un golpe a tu alrededor que aturde (sube con tu vida extra).',
         base: r5(12, 32), adR: 0.5, hpR: 0.02, cd: cds(1.1, 0.9), radius: 70, stun: 0.6,
         evo: { item: 'sterak', name: 'Bramido Salvaje', en: 'Savage Wallop', text: 'Más grande, aturde más y ×1,2 de daño.', mods: { radius: 1.3, stun: 1.5, dmgK: 1.2 } } },
    E: { name: 'Brinco', en: 'Hop', type: 'ground', kind: 'dash', vfx: 'quick-attack', dt: 'phys',
         desc: 'Saltas hacia el enemigo y al caer golpeas alrededor.',
         base: r5(14, 38), adR: 0.5, cd: cds(0.9, 0.7), radius: 120, width: 36, land: 60, slow: 0.3,
         evo: { item: 'hydra', name: 'Aplastar', en: 'Crunch', text: 'La caída golpea un 50 % más lejos y ×1,3 de daño.', mods: { land: 1.5, dmgK: 1.3 } } },
    R: { name: '¡GNAR!', en: 'GNAR!', type: 'ground', kind: 'nova', vfx: 'mud-shot', dt: 'phys',
         desc: 'Un rugido que lanza lejos a todos y los aturde.',
         base: [60, 95, 130], adR: 1.0, cd: [16, 13, 10], count: 16, speed: 300, life: 0.5, size: 10, pierce: 99, knock: 220, stun: 1.2 }
  });

  // ------------------------------------------------------------- Teemo
  K(17, {
    tags: ['ap', 'marksman'], role: 'Tirador',
    base: { hp: 105, hpG: 17, ad: 9, adG: 0.6, ar: 24, arG: 4.95, mr: 30, mrG: 1.3, as: 0.69, asG: 0.034, ms: 110, regen: 0.5, regenG: 0.05 },
    basic: { range: 'ranged', type: 'poison', vfx: 'poison-sting', reach: 280 },
    passive: {
      name: 'Disparo Tóxico', en: 'Toxic Shot',
      desc: ['Tus ataques básicos envenenan.', 'Envenenan el doble.', 'Además hacen daño mágico extra.'],
      onHit(pl, e, d, m, t) {
        if (!m.basic) return;
        e.applyPoison(t >= 2 ? 2 : 1);
        if (t >= 3) G.LoLItems.extra(pl, e, 5 + pl.st.ap * 0.2, 'magic');
      }
    },
    Q: { name: 'Dardo Cegador', en: 'Blinding Dart', type: 'poison', kind: 'projectile', vfx: 'poison-sting', dt: 'magic',
         desc: 'Un dardo rápido que ralentiza.',
         base: r5(24, 58), apR: 0.6, cd: cds(0.5, 0.4), count: 1, spread: 0, speed: 460, size: 6, life: 0.9, pierce: 0, slow: 0.5,
         evo: { item: 'nashor', name: 'Dardos Cegadores', en: 'Blinding Darts', text: 'Tres dardos y ×1,2 de daño.', mods: { count: 2, dmgK: 1.2 }, set: { spread: 0.2 } } },
    W: { name: 'Movimiento Rápido', en: 'Move Quick', type: 'poison', kind: 'trail', vfx: 'toxic', dt: 'magic',
         desc: 'Corres más y dejas un rastro venenoso.',
         base: r5(6, 14), apR: 0.12, cd: 0.28, radius: 28, dur: 3, poison: 1, self: { stat: 'spd', amount: 0.12, dur: 1, stacks: 1 },
         ranks: [{}, {}, { poison: 1 }, {}, {}],
         evo: { item: 'liandry', name: 'Rastro de Bandle', en: 'Bandle Trail', text: 'Charcos más grandes y duraderos, y más veneno.', mods: { radius: 1.4, dur: 1.5, poison: 1 } } },
    E: { name: 'Dardos Venenosos', en: 'Toxic Darts', type: 'poison', kind: 'cone', vfx: 'toxic-spikes', dt: 'magic',
         desc: 'Tres dardos en abanico que envenenan.',
         base: r5(10, 25), apR: 0.3, cd: cds(0.55, 0.44), count: 4, arc: 0.55, speed: 420, life: 0.7, size: 6, poison: 1,
         evo: { item: 'rylai', name: 'Lluvia de Dardos', en: 'Dart Storm', text: '+3 dardos que atraviesan a uno más.', mods: { count: 3, pierce: 1 } } },
    R: { name: 'Trampa Nociva', en: 'Noxious Trap', type: 'poison', kind: 'mine', vfx: 'toxic-spikes', dt: 'magic',
         desc: 'Siembras setas que estallan en veneno y ralentizan.',
         base: [40, 60, 80], apR: 0.5, cd: [5, 4, 3], count: 2, radius: 70, dur: 20, poison: 3, slow: 0.6 }
  });

  // ------------------------------------------------------------- Malphite
  K(54, {
    tags: ['tank', 'ap'], role: 'Tanque',
    base: { hp: 110, hpG: 17, ad: 11, adG: 0.7, ar: 37, arG: 4.95, mr: 28, mrG: 2, as: 0.74, asG: 0.03, ms: 112, regen: 0.5, regenG: 0.05 },
    basic: { range: 'melee', type: 'rock', vfx: 'body-slam' },
    passive: {
      name: 'Escudo de Granito', en: 'Granite Shield',
      desc: ['Si no te golpean en 8 s, ganas un escudo del 10 % de tu vida.', 'Basta con 6 s y es del 12 %.', 'Basta con 4 s y es del 15 %.'],
      tick(pl, dt, t) {
        const wait = [8, 6, 4][t - 1];
        if (performance.now() / 1000 - (pl.lastHurtT || -99) > wait && pl.shield < pl.maxHp * 0.1 && !(pl.graniteT > 0)) {
          pl.addShield(pl.maxHp * [0.1, 0.12, 0.15][t - 1]); pl.graniteT = 2;
        }
        if (pl.graniteT > 0) pl.graniteT -= dt;
      }
    },
    Q: { name: 'Esquirla Sísmica', en: 'Seismic Shard', type: 'rock', kind: 'projectile', vfx: 'rock-throw', dt: 'magic',
         desc: 'Un pedrusco que ralentiza y te da velocidad (sube con tu armadura).',
         base: r5(28, 66), apR: 0.5, arR: 0.1, cd: cds(0.75, 0.55), count: 1, spread: 0, speed: 300, size: 9, life: 1.4, pierce: 0, slow: 0.4,
         self: { stat: 'spd', amount: 0.15, dur: 1, stacks: 1 },
         evo: { item: 'fh', name: 'Esquirla Tectónica', en: 'Tectonic Shard', text: 'Estalla al golpear y pega ×1,3.', mods: { dmgK: 1.3 }, set: { explode: 60 } } },
    W: { name: 'Atronador', en: 'Thunderclap', type: 'rock', kind: 'melee', vfx: 'body-slam', dt: 'phys',
         desc: 'Golpes que retumban hacia delante (suben mucho con tu armadura).',
         base: r5(12, 32), adR: 0.5, arR: 0.25, cd: cds(0.6, 0.48), radius: 70, arc: 2.2, knock: 60,
         evo: { item: 'thorn', name: 'Atronador Sísmico', en: 'Seismic Thunderclap', text: 'Golpea en 360°, rompe armadura y ×1,2 de daño.',
                mods: { dmgK: 1.2 }, set: { arc: 9, shred: 0.2 } } },
    E: { name: 'Golpe Sísmico', en: 'Ground Slam', type: 'ground', kind: 'aura', vfx: 'bulldoze', dt: 'magic',
         desc: 'Golpeas el suelo: daño alrededor que ralentiza (sube con tu armadura).',
         base: r5(9, 26), apR: 0.35, arR: 0.18, cd: cds(1.0, 0.8), radius: 90, slow: 0.4,
         evo: { item: 'sunfire', name: 'Terremoto', en: 'Earthquake', text: 'Un 25 % más grande y ×1,2 de daño.', mods: { radius: 1.25, dmgK: 1.2 } } },
    R: { name: 'Fuerza Imparable', en: 'Unstoppable Force', type: 'rock', kind: 'dash', vfx: 'quick-attack', dt: 'magic',
         desc: 'Te lanzas contra los enemigos y al chocar los aturdes a todos.',
         base: [70, 110, 150], apR: 0.6, arR: 0.3, cd: [18, 15, 12], radius: 200, width: 60, land: 110, stun: 1.5, knock: 120 }
  });

  // ------------------------------------------------------------- Kha'Zix
  K(121, {
    tags: ['assassin', 'ad', 'fighter'], role: 'Asesino',
    base: { hp: 107, hpG: 17, ad: 10, adG: 0.62, ar: 32, arG: 4.2, mr: 32, mrG: 2, as: 0.67, asG: 0.027, ms: 117, regen: 0.5, regenG: 0.05 },
    basic: { range: 'melee', type: 'bug', vfx: 'bug-bite' },
    passive: {
      name: 'Amenaza Invisible', en: 'Unseen Threat',
      desc: ['Cada 6 s, tu siguiente golpe hace daño mágico extra y ralentiza.', 'Cada 5 s.', 'Cada 4 s y el doble de daño.'],
      tick(pl, dt, t) { if (!pl.threat && (pl.threatT = (pl.threatT || 0) + dt) >= [6, 5, 4][t - 1]) { pl.threat = true; pl.threatT = 0; } },
      onHit(pl, e, d, m, t) {
        if (!pl.threat) return;
        pl.threat = false;
        G.LoLItems.extra(pl, e, (8 + pl.st.ad * 0.4) * (t >= 3 ? 2 : 1), 'magic');
        e.applySlow(0.5, 1.5);
      }
    },
    Q: { name: 'Probar el Miedo', en: 'Taste Their Fear', type: 'bug', kind: 'melee', vfx: 'bug-bite', dt: 'phys',
         desc: 'Un zarpazo que hace mucho más a un enemigo que está solo.',
         base: r5(18, 46), adR: 0.9, cd: cds(0.65, 0.53), radius: 66, arc: 1.2, isolated: 0.8,
         evo: { item: 'yg', name: 'Garras Evolucionadas', en: 'Evolved Reaper Claws', text: 'Mucho más alcance y aún más daño a los aislados.',
                mods: { radius: 1.4, isolated: 0.4 } } },
    W: { name: 'Púas del Vacío', en: 'Void Spike', type: 'bug', kind: 'projectile', vfx: 'string-shot', dt: 'phys',
         desc: 'Tres púas que estallan al golpear y te curan.',
         base: r5(9, 24), adR: 0.45, cd: cds(0.85, 0.7), count: 3, spread: 0.35, speed: 380, size: 7, life: 1.0, pierce: 0, explode: 40, explodeK: 0.35, drain: 0.08,
         evo: { item: 'rh', name: 'Púas Evolucionadas', en: 'Evolved Spike Racks', text: 'Una púa más y estallidos más grandes.', mods: { count: 1, explode: 1.25 } } },
    E: { name: 'Salto', en: 'Leap', type: 'bug', kind: 'dash', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Saltas hacia el enemigo y caes golpeando alrededor.',
         base: r5(20, 52), adR: 0.6, cd: cds(1.1, 0.9), radius: 150, width: 40, land: 60,
         evo: { item: 'ec', name: 'Alas Evolucionadas', en: 'Evolved Wings', text: 'Saltas más lejos, la caída es más grande y ×1,3 de daño.',
                mods: { radius: 1.3, land: 1.4, dmgK: 1.3 } } },
    R: { name: 'Asalto del Vacío', en: 'Void Assault', type: 'bug', kind: 'buff', vfx: 'swords-dance', dt: 'phys',
         desc: 'Te vuelves invisible un momento (no te pueden dañar) y pegas un 25 % más durante 4 s.',
         base: 0, cd: [16, 13, 10], stat: 'atk', amount: 0.25, dur: 4, stacks: 1, invuln: 1.5 }
  });

  // ------------------------------------------------------------- Cho'Gath
  K(31, {
    tags: ['tank', 'ap'], role: 'Tanque',
    base: { hp: 110, hpG: 16, ad: 12, adG: 0.85, ar: 38, arG: 4.5, mr: 32, mrG: 2, as: 0.63, asG: 0.03, ms: 115, regen: 0.6, regenG: 0.05 },
    basic: { range: 'melee', type: 'bug', vfx: 'bite' },
    passive: {
      name: 'Carnívoro', en: 'Carnivore',
      desc: ['Cada enemigo que derrotas te cura un 1,5 % de tu vida.', 'Un 2,5 %.', 'Un 3,5 %.'],
      onKill(pl, e, t) { pl.healAcc += pl.maxHp * [0.015, 0.025, 0.035][t - 1]; },
      // Festín: cada enemigo devorado con la R te hace más grande y con más vida.
      stats(st, pl) { st.hp += (pl.growN || 0) * 18; },
      tick(pl) { const s = 1 + (pl.growN || 0) * 0.06; if (pl.anim.scale !== s && !(pl.megaT > 0)) pl.anim.scale = s; }
    },
    Q: { name: 'Ruptura', en: 'Rupture', type: 'bug', kind: 'meteor', vfx: 'rock-slide', dt: 'magic',
         desc: 'El suelo revienta bajo los enemigos y los lanza por los aires.',
         base: r5(18, 44), apR: 0.5, cd: cds(1.2, 1.0), count: 1, radius: 60, stun: 0.8, knock: 50,
         ranks: [{}, {}, {}, { count: 1 }, {}],
         evo: { item: 'liandry', name: 'Ruptura del Vacío', en: 'Void Rupture', text: 'Una ruptura más y más grandes.', mods: { count: 1, radius: 1.15 } } },
    W: { name: 'Grito Salvaje', en: 'Feral Scream', type: 'bug', kind: 'cone', vfx: 'hyper-voice', dt: 'magic',
         desc: 'Un grito en abanico que ralentiza.',
         base: r5(10, 26), apR: 0.3, cd: cds(0.9, 0.75), count: 7, arc: 1.2, speed: 300, life: 0.45, size: 8, pierce: 99, slow: 0.5,
         evo: { item: 'rylai', name: 'Alarido del Vacío', en: 'Void Shriek', text: 'Más ancho, +4 ondas y ×1,3 de daño.', mods: { arc: 1.4, count: 4, dmgK: 1.3 } } },
    E: { name: 'Púas Vorpal', en: 'Vorpal Spikes', type: 'bug', kind: 'melee', vfx: 'bug-bite', dt: 'magic',
         desc: 'Púas hacia delante que ralentizan (suben con tu vida extra).',
         base: r5(12, 32), apR: 0.3, hpR: 0.03, cd: cds(0.55, 0.45), radius: 76, arc: 1.0, slow: 0.3,
         evo: { item: 'warmog', name: 'Púas Colosales', en: 'Colossal Spikes', text: 'Más largas y anchas; ×1,2 de daño.', mods: { radius: 1.3, dmgK: 1.2 }, set: { arc: 1.6 } } },
    R: { name: 'Festín', en: 'Feast', type: 'bug', kind: 'chain', vfx: 'bite', dt: 'true',
         desc: 'Devoras a un enemigo (más daño cuanto menos vida le quede). Si muere, creces y ganas vida (hasta 6 veces).',
         base: [100, 160, 220], apR: 0.5, hpR: 0.1, cd: [14, 11, 8], count: 1, radius: 10, exec: 1.0, grow: 6 }
  });

  // ------------------------------------------------------------- Renekton
  K(58, {
    tags: ['fighter', 'ad', 'tank'], role: 'Luchador',
    base: { hp: 113, hpG: 18, ad: 12, adG: 0.75, ar: 35, arG: 5.2, mr: 28, mrG: 2, as: 0.67, asG: 0.03, ms: 115, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'ground', vfx: 'bite' },
    passive: {
      name: 'Reinado de la Ira', en: 'Reign of Anger',
      desc: ['Con menos de la mitad de vida haces un 15 % más de daño.', 'Un 25 % más.', 'Un 35 % más.'],
      dmgMod(pl, e, d, m, t) { return pl.hp < pl.maxHp * 0.5 ? d * [1.15, 1.25, 1.35][t - 1] : d; }
    },
    Q: { name: 'Masacre', en: 'Cull the Meek', type: 'ground', kind: 'aura', vfx: 'bulldoze', dt: 'phys',
         desc: 'Giras la espada: golpeas alrededor y te curas.',
         base: r5(11, 28), adR: 0.55, cd: cds(0.85, 0.7), radius: 80, drain: 0.08,
         evo: { item: 'rh', name: 'Masacre Implacable', en: 'Ruthless Cull', text: 'Más grande y te cura el doble.', mods: { radius: 1.25, drain: 2 } } },
    W: { name: 'Depredador Implacable', en: 'Ruthless Predator', type: 'ground', kind: 'melee', vfx: 'bite', dt: 'phys',
         desc: 'Dos golpes rápidos que aturden.',
         base: r5(20, 52), adR: 1.0, cd: cds(0.8, 0.65), radius: 64, arc: 1.2, stun: 0.75,
         evo: { item: 'tf', name: 'Depredador Supremo', en: 'Apex Predator', text: 'Más ancho, aturde más y ×1,3 de daño.', mods: { stun: 1.5, dmgK: 1.3 }, set: { arc: 2.2 } } },
    E: { name: 'Cortar y Rebanar', en: 'Slice and Dice', type: 'ground', kind: 'dash', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Dos embestidas que rompen un poco la armadura.',
         base: r5(20, 48), adR: 0.7, cd: cds(0.9, 0.75), radius: 130, width: 44, repeat: 2, every: 0.25, shred: 0.1,
         evo: { item: 'bc', name: 'Rebanar', en: 'Dice', text: 'Más anchas, rompen más armadura y ×1,3 de daño.', mods: { width: 1.4, dmgK: 1.3 }, set: { shred: 0.25 } } },
    R: { name: 'Dominus', en: 'Dominus', type: 'ground', kind: 'aura', vfx: 'heat-wave', dt: 'phys',
         desc: 'Te transformas: más resistente y quemas todo a tu alrededor unos segundos.',
         base: [12, 18, 24], adR: 0.2, cd: [20, 17, 14], radius: 100, repeat: 15, every: 0.4, self: { stat: 'def', amount: 0.2, dur: 6, stacks: 1 } }
  });

  // ------------------------------------------------------------- Warwick
  K(19, {
    tags: ['fighter', 'tank', 'ad'], role: 'Luchador',
    base: { hp: 106, hpG: 17, ad: 11, adG: 0.6, ar: 33, arG: 4.4, mr: 32, mrG: 2, as: 0.64, asG: 0.023, ms: 112, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'dark', vfx: 'bite' },
    passive: {
      name: 'Hambre Eterna', en: 'Eternal Hunger',
      desc: ['Tus ataques básicos te curan; el doble si tienes menos de la mitad de vida.', 'Te curan más.', 'Te curan mucho más.'],
      onHit(pl, e, d, m, t) {
        if (!m.basic) return;
        pl.healAcc += (2 + pl.level * 0.4) * [1, 1.6, 2.3][t - 1] * (pl.hp < pl.maxHp * 0.5 ? 2 : 1);
      }
    },
    Q: { name: 'Fauces de la Bestia', en: 'Jaws of the Beast', type: 'dark', kind: 'melee', vfx: 'bite', dt: 'phys',
         desc: 'Un mordisco que te cura con el daño.',
         base: r5(24, 56), adR: 0.95, cd: cds(0.65, 0.55), radius: 62, arc: 1.1, drain: 0.35,
         evo: { item: 'botrk', name: 'Fauces Insaciables', en: 'Insatiable Jaws', text: 'Te cura más, pega ×1,3 y remata a los heridos.',
                mods: { drain: 1.5, dmgK: 1.3 }, set: { exec: 0.4 } } },
    W: { name: 'Cacería Sangrienta', en: 'Blood Hunt', type: 'dark', kind: 'dash', vfx: 'quick-attack', dt: 'phys',
         desc: 'Te lanzas hacia la presa y ganas velocidad.',
         base: r5(16, 40), adR: 0.6, cd: cds(1.0, 0.8), radius: 160, width: 40, self: { stat: 'spd', amount: 0.3, dur: 1.5, stacks: 1 },
         evo: { item: 'tf', name: 'Cacería Implacable', en: 'Relentless Hunt', text: 'Más lejos y al llegar golpeas alrededor.', mods: { radius: 1.3 }, set: { land: 50 } } },
    E: { name: 'Aullido Primario', en: 'Primal Howl', type: 'dark', kind: 'aura', vfx: 'dark-pulse', dt: 'phys',
         desc: 'Aúllas: aturdes alrededor y recibes menos daño un momento.',
         base: r5(10, 26), adR: 0.4, cd: cds(1.4, 1.2), radius: 90, stun: 0.8, self: { stat: 'def', amount: 0.25, dur: 2, stacks: 1 },
         evo: { item: 'dd', name: 'Aullido Terrible', en: 'Dread Howl', text: 'Más grande y aturde más.', mods: { radius: 1.3, stun: 1.4 } } },
    R: { name: 'Coacción Infinita', en: 'Infinite Duress', type: 'dark', kind: 'dash', vfx: 'quick-attack', dt: 'phys',
         desc: 'Un salto largo que inmoviliza y te cura mucho.',
         base: [70, 110, 150], adR: 1.2, cd: [16, 13, 10], radius: 220, width: 50, stun: 1.5, drain: 0.6, invuln: 0.6 }
  });

  // ------------------------------------------------------------- Nautilus
  K(111, {
    tags: ['tank', 'ap'], role: 'Tanque',
    base: { hp: 110, hpG: 17, ad: 10, adG: 0.66, ar: 39, arG: 4.95, mr: 32, mrG: 2, as: 0.71, asG: 0.01, ms: 108, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'water', vfx: 'body-slam' },
    passive: {
      name: 'Golpe Abrumador', en: 'Staggering Blow',
      desc: ['El primer golpe a cada enemigo lo inmoviliza 0,6 s (cada 6 s).', 'Lo inmoviliza 0,9 s.', 'Además le hace daño extra.'],
      onHit(pl, e, d, m, t) {
        const now = performance.now() / 1000;
        if (e.nautT && now - e.nautT < 6) return;
        e.nautT = now;
        e.applySlow(0.97, (t >= 2 ? 0.9 : 0.6) * (e.boss ? 0.35 : 1));
        if (t >= 3) G.LoLItems.extra(pl, e, 8 + pl.maxHp * 0.02, 'phys');
      }
    },
    Q: { name: 'Ancla', en: 'Dredge Line', type: 'water', kind: 'projectile', vfx: 'hydro-pump', dt: 'magic',
         desc: 'Lanzas el ancla: atrae al enemigo hacia ti.',
         base: r5(30, 72), apR: 0.6, cd: cds(0.85, 0.65), count: 1, spread: 0, speed: 380, size: 9, life: 0.8, pierce: 1, pull: 150, stun: 0.3,
         evo: { item: 'jaksho', name: 'Ancla Abisal', en: 'Abyssal Anchor', text: 'Atraviesa a 3 enemigos y pega ×1,3.', mods: { pierce: 3, dmgK: 1.3 } } },
    W: { name: 'Furia del Titán', en: 'Titan’s Wrath', type: 'water', kind: 'aura', vfx: 'aqua-ring', dt: 'magic',
         desc: 'Golpes a tu alrededor y un escudo (sube con tu vida extra).',
         base: r5(8, 20), apR: 0.2, hpR: 0.02, cd: cds(0.6, 0.5), radius: 70, shield: 4, shieldR: 0.02,
         evo: { item: 'warmog', name: 'Ira de las Profundidades', en: 'Wrath of the Deep', text: 'Escudo doble y más grande.', mods: { shieldR: 2, radius: 1.25 } } },
    E: { name: 'Resaca', en: 'Riptide', type: 'water', kind: 'nova', vfx: 'bubble', dt: 'magic',
         desc: 'Tres oleadas seguidas que ralentizan.',
         base: r5(7, 18), apR: 0.2, cd: cds(1.2, 1.0), count: 8, speed: 220, life: 0.6, size: 9, pierce: 2, slow: 0.4, repeat: 3, every: 0.25,
         evo: { item: 'sunfire', name: 'Maremoto', en: 'Tidal Surge', text: '+6 ondas en cada oleada.', mods: { count: 6 } } },
    R: { name: 'Carga de Profundidad', en: 'Depth Charge', type: 'water', kind: 'projectile', vfx: 'hydro-pump', dt: 'magic',
         desc: 'Una onda que lo atraviesa todo, lanza por los aires y aturde.',
         base: [80, 125, 170], apR: 0.8, cd: [18, 15, 12], count: 1, spread: 0, speed: 320, size: 12, life: 1.4, pierce: 99, stun: 1.4, knock: 120 }
  });

  // ------------------------------------------------------------- Aurelion Sol (legendario)
  K(136, {
    tags: ['ap'], role: 'Mago',
    base: { hp: 102, hpG: 16, ad: 10, adG: 0.6, ar: 22, arG: 4, mr: 30, mrG: 1.3, as: 0.63, asG: 0.02, ms: 112, regen: 0.5, regenG: 0.05 },
    basic: { range: 'ranged', type: 'dragon', reach: 290 },
    passive: {
      name: 'Centro del Universo', en: 'Cosmic Creator',
      desc: ['Estrellas a tu alrededor dañan a los enemigos cercanos cada segundo.', 'Más daño.', 'Mucho más daño y más alcance.'],
      tick(pl, dt, t) {
        if ((pl.starT = (pl.starT || 0) - dt) > 0) return;
        pl.starT = 1;
        const r = t >= 3 ? 95 : 75;
        for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, r)) G.LoLItems.extra(pl, e, (4 + pl.st.ap * 0.1) * [1, 1.6, 2.4][t - 1], 'magic', '#a490ff');
      }
    },
    Q: { name: 'Aliento de Luz', en: 'Breath of Light', type: 'dragon', kind: 'beam', vfx: 'dragon-rage', dt: 'magic',
         desc: 'Un chorro de fuego estelar en línea que quema.',
         base: r5(28, 64), apR: 0.5, cd: cds(0.75, 0.55), radius: 250, width: 38, burn: 1,
         evo: { item: 'luden', name: 'Aliento Estelar', en: 'Stellar Breath', text: 'Más largo y ancho; ×1,3 de daño.', mods: { radius: 1.2, width: 1.5, dmgK: 1.3 } } },
    W: { name: 'Vuelo Astral', en: 'Astral Flight', type: 'dragon', kind: 'orbit', vfx: 'leaf-storm', dt: 'magic',
         desc: 'Estrellas que giran lejos a tu alrededor.',
         base: r5(10, 26), apR: 0.3, cd: 0.28, count: 3, radius: 90, speed: 2.4, size: 9,
         ranks: [{}, {}, { count: 1 }, {}, { count: 1 }],
         evo: { item: 'raba', name: 'Constelación', en: 'Constellation', text: '+2 estrellas y más radio.', mods: { count: 2, radius: 1.25 } } },
    E: { name: 'Singularidad', en: 'Singularity', type: 'psychic', kind: 'aura', vfx: 'psychic', dt: 'magic',
         desc: 'Un pozo de gravedad a tu alrededor que atrae y daña.',
         base: r5(8, 20), apR: 0.2, cd: cds(0.5, 0.4), radius: 110, pull: 60,
         evo: { item: 'void', name: 'Agujero Negro', en: 'Black Hole', text: 'Más grande y remata: más daño cuanto menos vida tengan.', mods: { radius: 1.2 }, set: { exec: 0.5 } } },
    R: { name: 'Caída de Estrella', en: 'Falling Star', type: 'dragon', kind: 'meteor', vfx: 'meteor-mash', dt: 'magic',
         desc: 'Una estrella cae y aturde a todo lo que pilla.',
         base: [100, 160, 220], apR: 0.8, cd: [16, 13, 10], count: 1, radius: 120, stun: 1.2, knock: 100 }
  });

  // ------------------------------------------------------------- Anivia (legendaria)
  K(34, {
    tags: ['ap'], role: 'Maga',
    base: { hp: 94, hpG: 16, ad: 9, adG: 0.6, ar: 21, arG: 4.5, mr: 30, mrG: 1.3, as: 0.66, asG: 0.02, ms: 108, regen: 0.4, regenG: 0.05 },
    basic: { range: 'ranged', type: 'ice', reach: 290 },
    passive: {
      name: 'Renacimiento', en: 'Rebirth',
      desc: ['Una vez por partida, al caer renaces con el 30 % de tu vida.', 'Renaces con el 50 %.', 'Renaces con el 70 % y congelas todo alrededor.'],
      onDeath(pl, t) {
        if (pl.reborn) return false;
        pl.reborn = true; pl.hp = pl.maxHp * [0.3, 0.5, 0.7][t - 1]; pl.invuln = 2.5;
        if (t >= 3) for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, 160)) e.applySlow(0.97, 2.5);
        return true;
      }
    },
    Q: { name: 'Destello Congelante', en: 'Flash Frost', type: 'ice', kind: 'projectile', vfx: 'hail', dt: 'magic',
         desc: 'Una bola de hielo lenta que estalla y aturde alrededor.',
         base: r5(20, 52), apR: 0.5, cd: cds(0.9, 0.7), count: 1, spread: 0, speed: 260, size: 10, life: 1.6, pierce: 0, explode: 70, explodeK: 1.0, stun: 0.8,
         evo: { item: 'raba', name: 'Ventisca Congelante', en: 'Frozen Blizzard', text: 'Estallido un 40 % más grande y ×1,2 de daño.', mods: { explode: 1.4, dmgK: 1.2 } } },
    W: { name: 'Cristalización', en: 'Crystallize', type: 'ice', kind: 'mine', vfx: 'string-shot', dt: 'magic',
         desc: 'Muros de hielo en el suelo que estallan y frenan mucho.',
         base: r5(10, 26), apR: 0.2, cd: cds(1.2, 1.0), count: 3, radius: 60, dur: 6, slow: 0.7,
         evo: { item: 'rylai', name: 'Muralla Glacial', en: 'Ice Rampart', text: '+3 cristales.', mods: { count: 3 } } },
    E: { name: 'Congelación', en: 'Frostbite', type: 'ice', kind: 'projectile', vfx: 'ice-beam', dt: 'magic',
         desc: 'Un rayo de hielo que hace el doble a los enemigos lentos o aturdidos.',
         base: r5(22, 52), apR: 0.5, cd: cds(0.55, 0.45), count: 1, spread: 0, speed: 400, size: 7, life: 1.0, pierce: 0, vsSlow: 1.0,
         evo: { item: 'void', name: 'Congelación Profunda', en: 'Deep Frostbite', text: 'Tres a la vez y ×1,2 de daño.', mods: { count: 2, dmgK: 1.2 }, set: { spread: 0.2 } } },
    R: { name: 'Tormenta Glacial', en: 'Glacial Storm', type: 'ice', kind: 'aura', vfx: 'powder-snow', dt: 'magic',
         desc: 'Una tormenta de hielo a tu alrededor durante unos segundos que ralentiza.',
         base: [14, 20, 26], apR: 0.2, cd: [18, 15, 12], radius: 130, slow: 0.6, repeat: 16, every: 0.33 }
  });

  // ------------------------------------------------------------- Volibear (legendario)
  K(106, {
    tags: ['fighter', 'tank', 'ap'], role: 'Luchador',
    base: { hp: 112, hpG: 17, ad: 11, adG: 0.7, ar: 31, arG: 4.7, mr: 32, mrG: 2, as: 0.63, asG: 0.02, ms: 113, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'electric', vfx: 'thunder-shock' },
    passive: {
      name: 'Tormenta Implacable', en: 'The Relentless Storm',
      desc: ['Cada golpe acumula tormenta (hasta 5): tus ataques básicos hacen un 5 % más por carga.', 'Con 5 cargas, tus básicos lanzan rayos a 3 enemigos.', 'Rayos a 5 enemigos y más fuertes.'],
      onHit(pl, e, d, m, t) {
        pl.storm = Math.min(5, (pl.storm || 0) + 1); pl.stormT = 4;
        if (m.basic && t >= 2 && pl.storm >= 5) {
          let n = 0;
          for (const o of G.EnemyMgr.queryCircle(e.x, e.y, 130)) { if (o === e || n >= (t >= 3 ? 5 : 3)) continue; n++; G.LoLItems.extra(pl, o, (6 + pl.st.ap * 0.3) * (t >= 3 ? 1.5 : 1), 'magic', '#ffe14d'); G.FX.ring(o.x, o.y, 2, 14, '#ffe14d', 0.2, 2); }
        }
      },
      tick(pl, dt) { if (pl.stormT > 0 && (pl.stormT -= dt) <= 0) pl.storm = 0; },
      dmgMod(pl, e, d, m) { return m.basic ? d * (1 + 0.05 * (pl.storm || 0)) : d; }
    },
    Q: { name: 'Golpe Atronador', en: 'Thundering Smash', type: 'electric', kind: 'dash', vfx: 'quick-attack', dt: 'phys',
         desc: 'Embistes al enemigo y lo aturdes; ganas velocidad.',
         base: r5(22, 54), adR: 1.0, cd: cds(1.0, 0.8), radius: 120, width: 40, stun: 0.8, self: { stat: 'spd', amount: 0.3, dur: 1.2, stacks: 1 },
         evo: { item: 'tf', name: 'Golpe de Trueno', en: 'Thunder Smash', text: 'Al llegar estalla un trueno alrededor y ×1,3 de daño.', mods: { dmgK: 1.3 }, set: { land: 70 } } },
    W: { name: 'Mutilar', en: 'Frenzied Maul', type: 'electric', kind: 'melee', vfx: 'bite', dt: 'phys',
         desc: 'Un zarpazo que te cura (sube con tu vida extra).',
         base: r5(25, 60), adR: 0.85, hpR: 0.04, cd: cds(0.65, 0.55), radius: 64, arc: 1.4, drain: 0.25,
         evo: { item: 'sterak', name: 'Frenesí', en: 'Frenzy', text: 'En 360°, te cura más y ×1,2 de daño.', mods: { drain: 1.4, dmgK: 1.2 }, set: { arc: 9 } } },
    E: { name: 'Rayo Divisor', en: 'Sky Splitter', type: 'electric', kind: 'meteor', vfx: 'thunderbolt', dt: 'magic',
         desc: 'Un rayo cae sobre los enemigos, ralentiza y te da escudo.',
         base: r5(24, 64), apR: 0.6, cd: cds(1.3, 1.1), count: 1, radius: 80, slow: 0.5, shieldR: 0.04,
         evo: { item: 'sunfire', name: 'Tormenta del Fin', en: 'Doom Storm', text: 'Un rayo más a la vez.', mods: { count: 1 } } },
    R: { name: 'Destructor de Cielos', en: 'Stormbringer', type: 'electric', kind: 'meteor', vfx: 'meteor-mash', dt: 'phys',
         desc: 'Caes del cielo sobre los enemigos y los aturdes.',
         base: [100, 160, 220], adR: 1.0, apR: 0.6, cd: [16, 13, 10], count: 1, radius: 130, stun: 1.0 }
  });

  // ------------------------------------------------------------- Mordekaiser (legendario)
  K(82, {
    tags: ['ap', 'tank', 'fighter'], role: 'Luchador',
    base: { hp: 110, hpG: 17, ad: 11, adG: 0.8, ar: 37, arG: 4.2, mr: 32, mrG: 2, as: 0.63, asG: 0.01, ms: 112, regen: 0.5, regenG: 0.05 },
    basic: { range: 'melee', type: 'steel', vfx: 'meteor-mash' },
    passive: {
      name: 'Oscuridad Creciente', en: 'Darkness Rise',
      desc: ['Al pelear, una aura oscura daña a tu alrededor cada segundo.', 'Más daño.', 'Mucho más daño y más grande.'],
      onHit(pl) { pl.mordT = 4; },
      tick(pl, dt, t) {
        if (!(pl.mordT > 0)) return;
        pl.mordT -= dt;
        if ((pl.mordTick = (pl.mordTick || 0) - dt) > 0) return;
        pl.mordTick = 1;
        const r = t >= 3 ? 95 : 75;
        G.FX.ring(pl.x, pl.y, r * 0.6, r, '#7a6bc4', 0.25, 2);
        for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, r)) G.LoLItems.extra(pl, e, (3 + pl.st.ap * 0.1 + pl.maxHp * 0.005) * [1, 1.6, 2.4][t - 1], 'magic', '#9e8aea');
      }
    },
    Q: { name: 'Aniquilación', en: 'Obliterate', type: 'steel', kind: 'melee', vfx: 'meteor-mash', dt: 'magic',
         desc: 'Un mazazo que hace mucho más a un enemigo solo.',
         base: r5(24, 64), apR: 0.6, cd: cds(0.8, 0.65), radius: 76, arc: 1.4, isolated: 0.6, knock: 60,
         evo: { item: 'raba', name: 'Aniquilación Total', en: 'Total Obliteration', text: 'Más alcance y ×1,3 de daño.', mods: { radius: 1.25, dmgK: 1.3 } } },
    W: { name: 'Indestructible', en: 'Indestructible', type: 'steel', kind: 'aura', vfx: 'harden', dt: 'magic',
         desc: 'Golpe alrededor que te da escudo.',
         base: r5(8, 20), apR: 0.2, cd: cds(0.7, 0.55), radius: 70, shieldR: 0.03,
         evo: { item: 'zhonya', name: 'Armadura Eterna', en: 'Eternal Armor', text: 'Escudo doble y más grande.', mods: { shieldR: 2, radius: 1.2 } } },
    E: { name: 'Asimiento de la Muerte', en: 'Death’s Grasp', type: 'ghost', kind: 'beam', vfx: 'shadow-ball', dt: 'magic',
         desc: 'Una garra en línea que atrae a los enemigos.',
         base: r5(16, 40), apR: 0.5, cd: cds(1.2, 1.0), radius: 200, width: 46, pull: 170, slow: 0.3,
         evo: { item: 'void', name: 'Garra del Reino', en: 'Grasp of the Realm', text: 'Más larga y ancha; ×1,3 de daño.', mods: { radius: 1.2, width: 1.4, dmgK: 1.3 } } },
    R: { name: 'Reino de la Muerte', en: 'Realm of Death', type: 'ghost', kind: 'aura', vfx: 'night-shade', dt: 'magic',
         desc: 'Arrastras a todo lo cercano a tu reino: daño continuo que te cura.',
         base: [16, 24, 32], apR: 0.25, cd: [20, 17, 14], radius: 120, drain: 0.3, repeat: 14, every: 0.35 }
  });

  // ------------------------------------------------------------- Bel'Veth (legendaria)
  K(200, {
    tags: ['fighter', 'ad', 'marksman'], role: 'Luchadora',
    base: { hp: 104, hpG: 17, ad: 10, adG: 0.3, ar: 32, arG: 4.7, mr: 32, mrG: 2, as: 0.85, asG: 0, ms: 113, regen: 0.6, regenG: 0.06 },
    basic: { range: 'melee', type: 'bug', vfx: 'bug-bite' },
    passive: {
      name: 'Muerte en Lavanda', en: 'Death in Lavender',
      desc: ['Cada enemigo derrotado te da velocidad de ataque para siempre (hasta +40 %).', 'Hasta +70 %.', 'Hasta +100 % y algo de daño de ataque.'],
      onKill(pl, e, t) { pl.lav = (pl.lav || 0) + 1; if (pl.lav % 4 === 0) pl.dirtyStats = true; },
      stats(st, pl, t) { st.asB += Math.min([0.4, 0.7, 1][t - 1], (pl.lav || 0) * 0.004); if (t >= 3) st.ad += Math.min(10, (pl.lav || 0) * 0.02); }
    },
    Q: { name: 'Embestida del Vacío', en: 'Void Surge', type: 'bug', kind: 'dash', vfx: 'aerial-ace', dt: 'phys',
         desc: 'Cuatro embestidas seguidas.',
         base: r5(14, 38), adR: 0.8, cd: cds(1.0, 0.8), radius: 110, width: 40, repeat: 4, every: 0.18,
         evo: { item: 'botrk', name: 'Marea del Vacío', en: 'Void Tide', text: 'Más largas, más anchas y ×1,3 de daño.', mods: { radius: 1.2, width: 1.4, dmgK: 1.3 } } },
    W: { name: 'Arriba y Abajo', en: 'Above and Below', type: 'bug', kind: 'beam', vfx: 'dark-pulse', dt: 'magic',
         desc: 'Un coletazo en línea que lanza por los aires y aturde.',
         base: r5(18, 46), adR: 0.6, apR: 0.6, cd: cds(1.0, 0.85), radius: 180, width: 50, stun: 0.8, knock: 100,
         evo: { item: 'bc', name: 'Abismo', en: 'Abyss', text: 'Más ancho y largo, rompe armadura y ×1,2 de daño.', mods: { width: 1.4, radius: 1.2, dmgK: 1.2 }, set: { shred: 0.2 } } },
    E: { name: 'Remolino Real', en: 'Royal Maelstrom', type: 'bug', kind: 'aura', vfx: 'bug-buzz', dt: 'phys',
         desc: 'Giras muy deprisa golpeando todo alrededor y te curas.',
         base: r5(5, 13), adR: 0.2, cd: cds(0.25, 0.2), radius: 70, drain: 0.08,
         evo: { item: 'rh', name: 'Torbellino Real', en: 'Royal Whirlwind', text: 'Más grande y te cura el doble.', mods: { radius: 1.3, drain: 2 } } },
    R: { name: 'Banquete Interminable', en: 'Endless Banquet', type: 'bug', kind: 'chain', vfx: 'hex', dt: 'true',
         desc: 'Saltas entre 3 enemigos con daño verdadero (más cuanto menos vida les quede) y pegas más unos segundos.',
         base: [60, 95, 130], adR: 0.8, cd: [16, 13, 10], count: 3, radius: 150, exec: 0.8, self: { stat: 'atk', amount: 0.25, dur: 6, stacks: 1 } }
  });
})();

// =====================================================================
//  RECARGAS REALES (2026-10-15)
// =====================================================================
// Antes la habilidad activa se relanzaba cada medio segundo. Ahora todas las
// que tengas se lanzan solas, cada una con su recarga, como en LoL (sus
// tiempos, más o menos a la mitad: las partidas de supervivencia van más
// deprisa). El daño de cada lanzamiento sube en proporción para que el daño
// por segundo de cada habilidad quede en SHARE del que tenía cuando era la
// única activa (ahora suman las tres).
//   cd: recarga por rango · chan + every: la habilidad dura chan s y golpea
//   cada every s (el giro de Garen) · up: las órbitas están up s de cada cd.
(() => {
  const r5 = (a, b) => [a, a + (b - a) / 4, a + (b - a) / 2, a + 3 * (b - a) / 4, b].map(v => Math.round(v * 100) / 100);
  const SHARE = { Q: 0.6, W: 0.45, E: 0.45, R: 0.85 };
  const T = {
    86:  { Q: r5(4.5, 3.5), E: { cd: r5(8, 6), chan: 3, every: 0.33 }, R: [40, 32, 25] },
    103: { Q: r5(4, 3), W: { cd: r5(7, 5), up: 3 }, E: r5(7, 5.5), R: [35, 28, 22] },
    157: { Q: r5(2.5, 1.8), W: { cd: r5(12, 9), up: 3.5 }, E: r5(3, 2), R: [30, 25, 20] },
    64:  { Q: r5(5, 4), W: r5(7, 5.5), E: r5(5, 4), R: [35, 28, 22] },
    62:  { Q: r5(4.5, 3.2), W: r5(9, 7), E: r5(5, 4), R: [40, 32, 25] },
    122: { Q: r5(5, 3.5), W: r5(3.5, 2.8), E: r5(10, 8), R: [30, 25, 20] },
    50:  { Q: r5(3, 2.4), W: r5(9, 7), E: r5(6, 4.5), R: [40, 32, 25] },
    22:  { Q: { cd: r5(4, 3), chan: 2, every: 0.25 }, W: r5(5, 3.5), E: r5(12, 9), R: [35, 28, 22] },
    150: { Q: r5(4, 3), W: r5(6, 5), E: r5(7, 5), R: [30, 25, 20] },
    17:  { Q: r5(4, 3), W: { cd: r5(10, 8), chan: 3, every: 0.28 }, E: r5(3, 2.5), R: [6, 5, 4] },
    54:  { Q: r5(5, 4), W: r5(4, 3), E: r5(5, 4), R: [40, 32, 25] },
    121: { Q: r5(3, 2.2), W: r5(5, 4), E: r5(8, 6), R: [30, 25, 20] },
    31:  { Q: r5(5, 4), W: r5(7, 5), E: r5(4, 3), R: [30, 25, 20] },
    58:  { Q: r5(4, 3), W: r5(5, 3.5), E: r5(7, 5), R: [40, 32, 25] },
    19:  { Q: r5(3.5, 2.5), W: r5(8, 6), E: r5(7, 5), R: [32, 26, 20] },
    111: { Q: r5(6, 4.5), W: r5(6, 5), E: r5(4, 3), R: [40, 32, 25] },
    136: { Q: r5(3, 2.5), W: { cd: r5(9, 7), up: 4 }, E: r5(7, 5), R: [30, 25, 20] },
    34:  { Q: r5(5, 4), W: r5(8, 6), E: r5(2.5, 2), R: [30, 25, 20] },
    106: { Q: r5(6, 4), W: r5(3.5, 3), E: r5(7, 5), R: [45, 36, 28] },
    82:  { Q: r5(4, 3), W: r5(7, 5), E: r5(8, 6), R: [45, 36, 28] },
    200: { Q: r5(4, 3), W: r5(6, 5), E: { cd: r5(9, 7), chan: 2.5, every: 0.25 }, R: [30, 25, 20] },
  };
  // Ajuste por campeón, medido con lol/tools/bench.js (nivel 10, sin objetos y
  // sin contar la R; media de 2 pasadas de 40 s): acerca a todos a ~115 de daño
  // por segundo contra un jefe y ~550 contra un grupo (media geométrica, así cada
  // uno conserva su estilo: Ashe pega más a uno, Swain a muchos).
  const KCH = { 64: 1.16, 157: 1.24, 103: 1.07, 86: 0.75, 62: 0.65, 122: 0.91, 50: 0.77, 22: 0.75, 150: 1.17, 54: 1.24, 121: 1.03, 17: 1.25, 58: 1.1, 31: 0.84, 111: 1.13, 19: 1.17, 136: 1.27, 34: 1.11, 82: 1.05, 106: 1.09, 200: 0.99 };
  const at = (a, i) => Array.isArray(a) ? a[Math.min(i, a.length - 1)] : a;
  for (const dex in T) {
    const k = G.KITS[dex];
    for (const key in T[dex]) {
      const d = k[key];
      if (!d || d.noDmg) continue;
      const e = Array.isArray(T[dex][key]) ? { cd: T[dex][key] } : T[dex][key];
      const old = d.cd, n = e.cd.length;
      const scale = [];
      for (let i = 0; i < n; i++) {
        const oc = at(old, i), nc = e.cd[i];
        if (e.chan) scale.push(SHARE[key] * nc * e.every / (oc * e.chan));   // daño por golpe del canal
        else if (e.up) scale.push(SHARE[key] * nc / e.up);             // órbita: sólo up s de cada cd
        else scale.push(SHARE[key] * nc / oc);
      }
      if (e.chan) { d.repeat = Math.round(e.chan / e.every); d.every = e.every; }
      if (e.up) { d.up = e.up; d.rehit = at(old, 0); }
      d.scaleK = scale.map(v => Math.round(v * (KCH[dex] || 1) * 100) / 100);
      d.cd = e.cd;
      // Escudos y curas por lanzamiento: más grandes (caen menos a menudo), con tope.
      const r = e.cd[0] / at(old, 0);
      if (d.shieldR) d.shieldR = Math.min(0.15, d.shieldR * r * 0.4);
      if (d.shield) d.shield = Math.min(40, d.shield * r * 0.4);
      if (d.healR) d.healR = Math.min(0.12, d.healR * r * 0.4);
      if (d.healSelf) d.healSelf = d.healSelf * r * 0.4;
    }
  }
})();

G.Kit.registerAll();
