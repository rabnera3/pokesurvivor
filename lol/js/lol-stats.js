/* ============ lol-stats.js — estadísticas y daño de League of Legends ============
 *
 * Cada campeón tiene las estadísticas de LoL, a la escala del juego (la vida y el
 * daño de ataque, divididos entre ~6; armadura y resistencia mágica, tal cual,
 * porque son un porcentaje):
 *
 *   hp      vida máxima              ad    daño de ataque      ap   poder de habilidad
 *   ar      armadura                 mr    resistencia mágica
 *   as      ataques por segundo      ah    celeridad (recarga = 100 / (100 + ah))
 *   crit    probabilidad de crítico  critD daño del crítico (×1,75 de base)
 *   ls      robo de vida (ataques)   omni  omnivampirismo (todo el daño)
 *   apen    penetración de armadura %   leth  letalidad (armadura plana)
 *   mpen    penetración mágica %        mpenf penetración mágica plana
 *   ms      velocidad de movimiento  regen vida por segundo
 *
 * Tres tipos de daño:  físico (contra armadura) · mágico (contra resistencia
 * mágica) · verdadero (sin reducir). Reducción = 100 / (100 + resistencia).
 *
 * Los enemigos también tienen armadura y resistencia mágica (ver resist()).
 * El daño que te hacen es físico o mágico según su elemento (DT).
 */
G.LoL = (() => {
  // Elementos cuyos golpes son físicos; el resto son mágicos.
  const PHYS = new Set(['normal', 'fighting', 'ground', 'rock', 'steel', 'bug', 'dark', 'flying']);
  const dtOf = type => (!type ? 'true' : PHYS.has(type) ? 'phys' : 'magic');
  const DT_COLOR = { phys: '#ffb35c', magic: '#7fb4ff', true: '#ffffff' };

  /** Multiplicador de daño contra una resistencia (con penetración). */
  function mit(res, pct = 0, flat = 0) {
    const r = res * (1 - pct) - flat;
    return r >= 0 ? 100 / (100 + r) : 2 - 100 / (100 - r);
  }

  /**
   * Armadura y resistencia mágica de un enemigo al aparecer: las suyas (def.ar /
   * def.mr, de lol/tools/roster.py) o las de un súbdito, y suben con el reloj de
   * la partida (en LoL los monstruos también crecen).
   */
  function resist(def, t, boss) {
    const k = 1 + t / 1200;
    const ar = (def.ar != null ? def.ar : 15) * k + (boss ? 10 : 0);
    const mr = (def.mr != null ? def.mr : 15) * k + (boss ? 10 : 0);
    return { ar, mr };
  }

  /** Daño de `pl` a `e` tras armadura / resistencia (y reducción de armadura). */
  function vsEnemy(pl, e, dmg, dt) {
    if (dt === 'true' || !e) return dmg;
    const st = pl.st || {};
    if (dt === 'phys') {
      const shred = e.shredUntil > performance.now() / 1000 ? e.shred || 0 : 0;
      return dmg * mit((e.ar || 0) * (1 - shred), st.apen || 0, st.leth || 0);
    }
    return dmg * mit((e.mr || 0) * (1 - (e.mshred || 0)), st.mpen || 0, st.mpenf || 0);
  }

  /** Daño que recibe `pl` de un golpe de elemento `type`. */
  function vsPlayer(pl, dmg, type) {
    const dt = dtOf(type);
    const st = pl.st || {};
    if (dt === 'phys') return dmg * mit(st.ar || 0);
    if (dt === 'magic') return dmg * mit(st.mr || 0);
    return dmg;
  }

  // ---------------- estadísticas del jugador ----------------

  const ZERO = () => ({ hp: 0, ad: 0, ap: 0, ar: 0, mr: 0, as: 0, ah: 0, crit: 0, critD: 0, ls: 0, omni: 0,
                        apen: 0, leth: 0, mpen: 0, mpenf: 0, ms: 0, msP: 0, regen: 0, apP: 0, hpP: 0, heal: 0, tenacity: 0, asB: 0 });
  // Cómo se enseña cada una (pausa y cartas).
  const NAMES = {
    hp: ['Vida', 'Health'], ad: ['Daño de ataque', 'Attack damage'], ap: ['Poder de habilidad', 'Ability power'],
    ar: ['Armadura', 'Armor'], mr: ['Resistencia mágica', 'Magic resist'], as: ['Velocidad de ataque', 'Attack speed'],
    ah: ['Celeridad', 'Ability haste'], crit: ['Prob. de crítico', 'Crit chance'], ls: ['Robo de vida', 'Life steal'],
    omni: ['Omnivampirismo', 'Omnivamp'], apen: ['Pen. de armadura', 'Armor pen'], leth: ['Letalidad', 'Lethality'],
    mpen: ['Pen. mágica', 'Magic pen'], ms: ['Velocidad', 'Move speed'], regen: ['Regeneración', 'Regen']
  };

  /**
   * Recalcula pl.st: base del campeón + crecimiento por nivel + fragmentos +
   * objetos + pasiva. Lo llaman el jugador al subir de nivel y al coger algo.
   */
  function recalc(pl) {
    const k = pl.kitDef;
    if (!k) return;
    const b = k.base, L = pl.level - 1;
    const st = ZERO();
    st.hp = b.hp + b.hpG * L;
    st.ad = b.ad + b.adG * L;
    st.ar = b.ar + b.arG * L;
    st.mr = b.mr + b.mrG * L;
    st.ms = b.ms;
    st.regen = b.regen + (b.regenG || 0) * L;
    st.asB = (b.asG || 0.02) * L;          // % de velocidad de ataque extra
    const add = s => { for (const key in s) if (st[key] != null) st[key] += s[key]; };
    for (const s of pl.shards || []) add(s);
    for (const id of pl.items || []) { const it = G.LoLItems.BY[id]; if (it && it.st) add(it.st); }
    for (const id of pl.items || []) { const it = G.LoLItems.BY[id]; if (it && it.mod) it.mod(st, pl); }
    if (pl.passive && pl.passive.def.stats) pl.passive.def.stats(st, pl, pl.passive.tier);
    // Multiplicadores (Rabadon, Corazón de acero...)
    st.ap *= 1 + st.apP;
    st.hp *= 1 + st.hpP;
    st.as = Math.min(2.5, b.as * (1 + st.asB));
    st.crit = Math.min(1, st.crit);
    st.ms = st.ms * (1 + st.msP);
    pl.st = st;
    // Lo que el motor ya usa.
    const frac = pl.maxHp ? pl.hp / pl.maxHp : 1;
    pl.maxHp = Math.round(st.hp + (pl.perks.hp || 0));
    pl.hp = Math.max(pl.dead ? 0 : 1, Math.min(pl.maxHp, pl.maxHp * frac));
    pl.baseSpd = st.ms;
    pl.regenFlat = st.regen + (pl.perks.regen || 0);
    pl.critChance = st.crit + (pl.perks.crit || 0);
  }

  /** Recarga real de una habilidad (celeridad y poderes de altar). */
  const haste = pl => 100 / (100 + ((pl.st && pl.st.ah) || 0));

  /** Daño (antes de resistencias) de una habilidad ahora. */
  function abilityDmg(pl, m) {
    const st = pl.st;
    if (!st) return m.dmg;
    if (m.basic) return st.ad * (m.adR || 1) + (m.apR || 0) * st.ap;
    const r = Math.max(0, (m.lvl || 1) - 1);
    const base = Array.isArray(m.base) ? m.base[Math.min(r, m.base.length - 1)] : (m.base || 0);
    return (base + (m.adR || 0) * st.ad + (m.apR || 0) * st.ap + (m.arR || 0) * st.ar + (m.mrR || 0) * st.mr +
            (m.hpR || 0) * Math.max(0, pl.maxHp - pl.kitDef.base.hp)) * (m.dmgK || 1) *
           (Array.isArray(m.scaleK) ? m.scaleK[Math.min(r, m.scaleK.length - 1)] : (m.scaleK || 1));
  }

  /** Para el bot de pruebas (lol/tools/sim.js). */
  function simInfo(pl) {
    if (!pl.st) return null;
    const s = pl.st, r = v => Math.round(v * 10) / 10;
    return { ad: r(s.ad), ap: r(s.ap), ar: r(s.ar), mr: r(s.mr), as: r(s.as), ah: r(s.ah), crit: r(s.crit),
             items: (pl.items || []).join(','), kit: ['Q', 'W', 'E', 'R'].map(k => pl.abil[k] ? k + pl.abil[k].lvl + (pl.abil[k].evolved ? '*' : '') : '-').join(' '),
             pas: pl.passive ? pl.passive.tier : 0 };
  }

  return { PHYS, dtOf, DT_COLOR, mit, resist, vsEnemy, vsPlayer, ZERO, NAMES, recalc, haste, abilityDmg, simInfo };
})();
