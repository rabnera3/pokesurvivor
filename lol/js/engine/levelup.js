/* ============ levelup.js (RuneSurvivor) — las tres cartas de subir de nivel ============
 * Sustituye a js/systems/levelup.js. Tipos de carta:
 *   up       subir de rango una habilidad que ya tienes (el nivel pone el tope)
 *   evo      evolucionar una habilidad (rango máximo + su objeto): carta dorada
 *   item     un objeto que va con tu campeón (hasta 6)
 *   passive  mejorar la pasiva (2.ª mejora desde el nivel 4, 3.ª desde el 9)
 *   stat     fragmento de runa (pequeña mejora de estadística) o poción
 * Las habilidades nuevas no son cartas: llegan solas con el nivel (lol-kits.js).
 */
G.LevelUp = (() => {
  // Fragmentos: van a pl.shards (los suma G.LoL.recalc). `adaptive`: DA o PH
  // según lo que use tu campeón. Los porcentajes valen más o menos lo mismo que
  // un fragmento de fuerza adaptable (+3 DA ≈ +15 % de daño a nivel 10), como en
  // LoL (2026-10-15: antes eran el doble).
  const SHARDS = [
    { id: 'adapt', icon: 'fist', title: 'Fuerza adaptable', desc: '+3 de daño de ataque o +5 de poder de habilidad (lo que uses).', adaptive: true, max: 12 },
    { id: 'ah', icon: 'clock', title: 'Celeridad', desc: '+5 de celeridad (habilidades un poco más rápidas).', st: { ah: 5 }, max: 8 },
    { id: 'as', icon: 'quickclaw', title: 'Velocidad de ataque', desc: '+6 % de velocidad de ataque.', st: { asB: 0.06 }, max: 8 },
    { id: 'hp', icon: 'heart', title: 'Vitalidad', desc: '+25 de vida máxima.', st: { hp: 25 }, max: 10 },
    { id: 'ar', icon: 'shield', title: 'Armadura', desc: '+9 de armadura (menos daño físico).', st: { ar: 9 }, max: 8 },
    { id: 'mr', icon: 'shield', title: 'Resistencia mágica', desc: '+9 de resistencia mágica (menos daño mágico).', st: { mr: 9 }, max: 8 },
    { id: 'ms', icon: 'boot', title: 'Velocidad', desc: '+3 % de velocidad de movimiento.', st: { msP: 0.03 }, max: 5 },
    { id: 'crit', icon: 'star', title: 'Crítico', desc: '+4 % de probabilidad de crítico (ataques básicos).', st: { crit: 0.04 }, max: 6, tag: 'crit' },
    { id: 'mag', icon: 'magnet', title: 'Imán', desc: '+15 % de radio de recogida.', apply: pl => { pl.magnet *= 1.15; }, max: 5 },
    { id: 'xp', icon: 'book', title: 'Aprendizaje', desc: '+5 % de experiencia.', apply: pl => { pl.xpMul *= 1.05; }, max: 6 }
  ];
  const POTION = { id: 'heal', icon: 'berry', title: 'Poción de vida', desc: 'Recupera el 45 % de tu vida ahora mismo.' };
  // Para quien mire el código de PokéSurvivor (G.LevelUp.STATS lo usan otras pantallas).
  const STATS = SHARDS;

  const usesAp = pl => (pl.kitDef.tags || []).includes('ap');

  function addShard(pl, s) {
    const st = s.adaptive ? (usesAp(pl) ? { ap: 5 } : { ad: 3 }) : s.st;
    if (st) { pl.shards.push(st); G.LoL.recalc(pl); }
    if (s.apply) s.apply(pl);
    pl.statsTaken[s.id] = (pl.statsTaken[s.id] || 0) + 1;
  }

  /** Lo que gana una habilidad al subir un rango (para la carta). */
  function upText(m) {
    const d = G.KITS[m.dex][m.key];
    const r = m.lvl;                         // rango actual (1-based) -> r + 1
    const parts = [];
    // Daño real de cada golpe: la base por la escala de su recarga (lol-kits.js, RECARGAS REALES).
    const k = i => skAt(d, i) * (m.dmgK || 1);
    if (!d.noDmg && Array.isArray(d.base) && d.base[r] != null)
      parts.push('daño ' + Math.round(d.base[r - 1] * k(r - 1)) + ' → ' + Math.round(d.base[r] * k(r)) + (m.repeat > 1 ? ' por golpe' : ''));
    if (Array.isArray(d.cd) && d.cd[r] != null && d.cd[r] !== d.cd[r - 1]) parts.push('recarga ' + fmt(d.cd[r - 1]) + ' → ' + fmt(d.cd[r]) + ' s');
    const extra = d.ranks && d.ranks[r];
    if (extra && extra.count) parts.push('+' + extra.count + (m.kind === 'orbit' ? ' orbe' : m.kind === 'chain' ? ' salto' : ' más'));
    if (extra && extra.radius) parts.push('+' + Math.round((extra.radius - 1) * 100) + ' % de área');
    if (extra && extra.shieldR) parts.push('+' + Math.round((extra.shieldR - 1) * 100) + ' % de escudo');
    if (extra && extra.dur) parts.push('+' + Math.round((extra.dur - 1) * 100) + ' % de duración');
    return parts.join(' · ') || 'Más fuerte';
  }
  const fmt = v => (Math.round(v * 100) / 100).toString().replace('.', ',');

  const skAt = (d, i) => Array.isArray(d.scaleK) ? d.scaleK[Math.min(i, d.scaleK.length - 1)] : (d.scaleK || 1);

  function ratioText(d, k = 1) {
    const r = [];
    if (d.noDmg) return '';
    if (d.adR) r.push(Math.round(d.adR * k * 100) + ' % DA');
    if (d.apR) r.push(Math.round(d.apR * k * 100) + ' % PH');
    if (d.arR) r.push(Math.round(d.arR * k * 100) + ' % armadura');
    if (d.hpR) r.push(Math.round(d.hpR * k * 100) + ' % vida extra');
    return r.length ? ' (+' + r.join(', ') + ')' : '';
  }

  const DT_NAME = { phys: 'físico', magic: 'mágico', true: 'verdadero' };

  function candidates(pl) {
    const out = [];
    const abil = ['Q', 'W', 'E', 'R'].map(k => pl.abil[k]).filter(Boolean);

    // --- evoluciones listas / objetos que las desbloquean ---
    const wantItem = {};
    for (const m of abil) {
      const ev = G.Kit.evoOf(m);
      if (!ev || m.evolved) continue;
      if (m.lvl >= G.Kit.MAX[m.key] && pl.hasItem(ev.item)) {
        out.push({
          w: 40, type: 'evo', key: 'evo:' + m.id,
          icon: 'move:' + m.id, color: '#ffd23f', tag: 'EVOLUCIÓN · ' + m.key,
          title: m.name + ' → ' + ev.name, desc: ev.text,
          apply: p => {
            G.Kit.evolve(m);
            G.FX.ring(p.x, p.y, 8, 120, '#ffd23f', 0.8, 6);
            G.FX.burst(p.x, p.y - p.bodyH * 0.5, '#ffe14d', 40, 240);
            G.Audio.sfx('legend');
            G.Progress.event('evolve', { move: m.id });
          }
        });
      } else if (!pl.hasItem(ev.item)) wantItem[ev.item] = m;
    }

    // --- subir de rango ---
    for (const m of abil) {
      if (m.lvl >= G.Kit.MAX[m.key] || m.lvl >= G.Kit.rankCap(m.key, pl.level)) continue;
      const d = G.KITS[m.dex][m.key];
      out.push({
        w: m.key === 'R' ? 16 : 12, type: 'up', key: 'up:' + m.id,
        icon: 'move:' + m.id, color: G.U.TYPE_COLOR[m.type],
        tag: m.key + ' · rango ' + m.lvl + ' > ' + (m.lvl + 1),
        title: m.name, desc: upText(m) + ratioText(d, skAt(d, m.lvl) * (m.dmgK || 1)) + (d.noDmg ? ' · no hace daño' : ' · daño ' + DT_NAME[m.dt]),
        apply: () => G.Kit.rankUp(m)
      });
    }

    // --- pasiva ---
    const pas = pl.passive;
    if (pas && pas.def && pas.tier < 3 && pl.level >= (pas.tier === 1 ? 4 : 9)) {
      out.push({
        w: 9, type: 'passive', key: 'passive',
        icon: 'crown', color: '#c89bff', tag: 'PASIVA · ' + pas.tier + ' > ' + (pas.tier + 1),
        title: pas.def.name, desc: pas.def.desc[pas.tier],
        apply: p => { p.passive.tier++; G.LoL.recalc(p); if (p.passive.def.init) p.passive.def.init(p, p.passive.tier); }
      });
    }

    // --- objetos ---
    // Como en LoL, no se compra todo de golpe: en las cartas, uno por cada 3
    // niveles (los de jefes y cofres van aparte).
    if (pl.items.length < 6 && (pl.cardItems || 0) < Math.floor(pl.level / 3)) {
      const have = new Set(pl.items), boots = pl.items.some(id => G.LoLItems.BY[id].boots);
      const pool = G.LoLItems.poolFor(pl.kitDef).filter(it => !have.has(it.id) && !(boots && it.boots));
      const pick = G.U.pickN(pool.filter(it => !wantItem[it.id]), 3).concat(pool.filter(it => wantItem[it.id]));
      for (const it of pick) {
        const evoFor = wantItem[it.id];
        out.push({
          // Cuantos más objetos llevas, menos salen (con 0: 7; con 3: ~2,4; con 5: ~1).
          w: (evoFor ? 13 : 7) * Math.pow(0.7, pl.items.length), type: 'item', key: 'item:' + it.id,
          icon: it.icon, color: evoFor ? '#ffd23f' : '#e0b84a', tag: evoFor ? 'Evoluciona ' + evoFor.key : 'Objeto · ' + (pl.items.length + 1) + '/6',
          title: it.name, desc: G.LoLItems.statLine(it) + '. ' + it.desc,
          apply: p => { if (p.addItem(it.id)) p.cardItems = (p.cardItems || 0) + 1; G.Progress.event('item', { id: it.id }); }
        });
      }
    }

    // --- fragmentos de runa ---
    const tags = new Set(pl.kitDef.tags || []);
    const room = s => (!s.max || (pl.statsTaken[s.id] || 0) < s.max) && (!s.tag || tags.has(s.tag));
    for (const s of G.U.pickN(SHARDS.filter(room), 4)) {
      out.push({
        w: 4, type: 'stat', key: 'stat:' + s.id,
        icon: s.icon, color: '#8fa3c4', tag: 'Fragmento',
        title: s.title, desc: s.adaptive ? (usesAp(pl) ? '+5 de poder de habilidad.' : '+3 de daño de ataque.') : s.desc,
        apply: p => addShard(p, s)
      });
    }
    if (pl.hp < pl.maxHp * 0.6) {
      out.push({ w: 6, type: 'stat', key: 'stat:heal', icon: POTION.icon, color: '#5fe08a', tag: 'Consumible',
                 title: POTION.title, desc: POTION.desc, apply: p => p.heal(p.maxHp * 0.45) });
    }
    return out;
  }

  /** Devuelve 3 cartas distintas, elegidas por peso. */
  function offer(pl, n = 3) {
    const pool = candidates(pl);
    const picked = [];
    const used = new Set();
    // Si hay una evolución lista, su carta dorada sale siempre.
    const evo = pool.findIndex(c => c.type === 'evo');
    if (evo >= 0) { const c = pool.splice(evo, 1)[0]; used.add(c.key); picked.push(c); }
    // Como el punto de habilidad de cada nivel en LoL: si alguna habilidad puede
    // subir de rango, una de las cartas es siempre una de esas (la R, si se puede).
    const ups = pool.filter(c => c.type === 'up');
    if (ups.length && picked.length < n) {
      const c = ups.find(u => u.key.endsWith('R')) || ups[Math.floor(Math.random() * ups.length)];
      pool.splice(pool.indexOf(c), 1); used.add(c.key); picked.push(c);
    }

    while (picked.length < n && pool.length) {
      const total = pool.reduce((a, c) => a + c.w, 0);
      let r = Math.random() * total, idx = 0;
      for (let i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { idx = i; break; } }
      const c = pool.splice(idx, 1)[0];
      if (used.has(c.key)) continue;
      used.add(c.key);
      picked.push(c);
    }
    return picked;
  }

  return { offer, STATS, SHARDS, candidates };
})();
