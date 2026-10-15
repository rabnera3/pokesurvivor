/* ============ lol-elites.js — campeones enemigos ============
 * Además de súbditos y monstruos, de vez en cuando aparece un CAMPEÓN enemigo
 * (cualquiera de la plantilla menos el tuyo): mucha más vida y daño que los de
 * su tramo, pelea como pelea en LoL (los de distancia disparan, los cuerpo a
 * cuerpo embisten) y tiene la armadura / RM de su campeón.
 * Al caer: mucha experiencia, oro y, a veces, un objeto.
 *
 *   desde 3:30, cada 80-110 s · nunca con un jefe vivo, en la grieta ni en la Ruina
 * Cooperativo: los saca el anfitrión (como el resto de enemigos).
 */
G.LoLElites = (() => {
  const FROM = 210, EVERY = [80, 110];
  let next = FROM;

  function reset() { next = FROM; }

  function tierAt(t) { let ti = 0; G.Enemies.TIERS.forEach((tr, i) => { if (t >= tr.from) ti = i; }); return ti; }

  function spawn(players, t) {
    const alive = players.filter(p => !p.dead);
    const pl = G.U.pick(alive.length ? alive : players);
    const mine = new Set(players.map(p => p.dex));
    const pool = G.DEX.filter(c => !c.leg && G.KITS[c.dex] && !mine.has(c.dex) && G.SPRITE_META[c.dex]);
    if (!pool.length) return;
    const c = G.U.pick(pool), k = G.KITS[c.dex];
    const ti = tierAt(t), tier = G.Enemies.TIERS[ti];
    const ranged = k.basic.range !== 'melee';
    const L = 1 + Math.floor(t / 60);
    const def = {
      dex: c.dex, name: c.name, behavior: ranged ? 'ranged' : 'charger',
      hp: Math.round(tier.hp * 7), spd: Math.round(tier.spd * 1.05), dmg: Math.round(tier.dmg * 1.6), xp: Math.round(tier.xp * 12),
      shotDmg: Math.round(tier.dmg * 1.2), shotCd: 1.5, range: 220,
      ar: k.base.ar + k.base.arG * L, mr: k.base.mr + k.base.mrG * L
    };
    G.Sprites.preload([c.dex]);
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 6.2832, d = G.U.rand(260, 320);
      const x = pl.x + Math.cos(a) * d, y = pl.y + Math.sin(a) * d * 0.8;
      if (!G.World.isFree(x, y, 16)) continue;
      const e = new G.Enemy(def, x, y, G.Enemies.scale(t));
      e.lolChamp = true;
      G.EnemyMgr.add(e);
      G.FX.ring(x, y, 4, 60, '#ff5f6d', 0.6, 4);
      G.Spawner.say('¡Campeón enemigo: ' + c.name + '!', 3, true);
      G.Audio.sfx('boss');
      return;
    }
  }

  function update(dt, players, t) {
    if (t < next) return;
    const busy = G.Rift.inArena || G.Judgment.active || G.EnemyMgr.all().some(e => e.boss && !e.dead);
    if (busy) { next = t + 10; return; }
    next = t + G.U.rand(EVERY[0], EVERY[1]);
    spawn(players, t);
  }

  /** Lo llama el jugador al derrotar a uno (Player.onKill). */
  function onDown(e) {
    for (let i = 0; i < 6; i++) G.Pickups.drop('coin', e.x + G.U.rand(-30, 30), e.y + G.U.rand(-22, 22), 5);
    if (Math.random() < 0.4) G.Pickups.drop('item', e.x, e.y - 10, G.Items.roll());
    G.Spawner.say('¡Has derrotado a ' + e.name + '!', 2.4, true);
  }

  return { reset, update, onDown };
})();
