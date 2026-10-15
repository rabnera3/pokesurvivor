/* Bot que juega solo y acelerado, para medir el balance.
 *
 *   node lol/tools/sim.js <url> <campeón (número)> [minutos=30] [carpeta de capturas]
 *
 * - El tiempo es virtual: requestAnimationFrame y performance.now avanzan 1/60 s
 *   por paso y se dan tantos pasos como quepan en cada fotograma real, así que
 *   la partida va a toda la velocidad que dé la CPU sin cambiar la física.
 * - No se dibuja nada (salvo para las capturas): el canvas va en vacío.
 * - El bot se aleja de los enemigos (más de los jefes), recoge lo que hay
 *   cerca cuando puede y da vueltas para no quedarse quieto. En las cartas:
 *   evolución > mejorar lo que ya tiene > lo primero que salga.
 * Escribe una línea JSON por minuto y una final.
 */
const { execSync } = require('child_process');
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');

const [url, dexArg, minArg, shots] = process.argv.slice(2);
const DEX = +dexArg, MAXMIN = +(minArg || 30);
// Daño que recibe el bot (1 = normal). El bot esquiva peor que una persona: para
// comparar el original con la versión LoL se usa el mismo valor en las dos.
const TAKEN = +(process.env.TAKEN || 0.3);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, locale: 'es-ES' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.addInitScript(() => {
    let vt = 1000, q = [], draw = false;
    const realRAF = window.requestAnimationFrame.bind(window);
    window.__sim = { steps: 0, playT: 0, draw(v) { draw = v; } };
    performance.now = () => vt;
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    const pump = () => {
      const t0 = Date.now();
      do {
        const run = q; q = [];
        vt += 1000 / 60;
        for (const cb of run) cb(vt);
        window.__sim.steps++;
        if (window.G && G.Game && G.Game.state === 'playing') window.__sim.playT += 1 / 60;
      } while (!draw && Date.now() - t0 < 40);
      realRAF(pump);
    };
    realRAF(pump);
    // Sin dibujar (lo que más cuesta) salvo para las capturas.
    const P = CanvasRenderingContext2D.prototype;
    for (const k of ['drawImage', 'fillRect', 'fill', 'stroke', 'fillText', 'strokeText', 'putImageData', 'strokeRect', 'clearRect']) {
      const o = P[k];
      P[k] = function (...a) { if (draw || !(window.G && G.Game && G.Game.player)) return o.apply(this, a); };
    }
  });

  await page.goto(url);
  await page.waitForFunction(() => window.G && G.Flow && G.DB && G.Game, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  await page.evaluate(([dex, taken]) => {
    const oh = G.Player.prototype.hurt;
    G.Player.prototype.hurt = function (a, ...r) { return oh.call(this, a * taken, ...r); };
    G.DB.playAsGuest();
    const s = G.DB.save;
    s.owned[dex] = 1; s.partner = dex; s.partnerShiny = false;
    // Bot: movimiento
    let lastX = 0, lastY = 0, stuck = 0;
    // "Tren": avanza siempre (los enemigos le persiguen por detrás), gira poco a
    // poco para no alejarse del mapa y esquiva lo que tiene delante.
    let head = Math.random() * 6.28, turn = 0.25;
    G.Input.axis = () => {
      const pl = G.Game.player;
      if (!pl || pl.dead) return [0, 0];
      head += turn / 60;
      let hx = Math.cos(head), hy = Math.sin(head);
      let ax = hx, ay = hy, front = 0;
      // Cuerpo a cuerpo con vida: se pega al enemigo más cercano (a ~45) en vez de huir.
      const melee = pl.kitDef ? pl.kitDef.basic.range === 'melee' : false;
      const brawl = melee && pl.hp > pl.maxHp * 0.45;
      if (brawl) {
        let best = null, bd = 1e9;
        for (const e of G.EnemyMgr.all()) { if (e.dead || e.behavior === 'thief') continue; const d = ((e.x - pl.x) ** 2 + (e.y - pl.y) ** 2) * (e.boss && pl.hp > pl.maxHp * 0.6 ? 0.2 : e.boss ? 99 : 1); if (d < bd) { bd = d; best = e; } }
        if (best) {
          const d = Math.sqrt(bd) || 1, k = d > 50 ? 1.6 : d < 28 ? -1 : 0;
          ax = (best.x - pl.x) / d * k + hx * 0.3; ay = (best.y - pl.y) / d * k + hy * 0.3;
        }
      }
      for (const e of G.EnemyMgr.all()) {
        if (e.dead || e.behavior === 'thief') continue;
        const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy) || 1;
        const R = (e.boss ? (brawl && pl.hp > pl.maxHp * 0.6 ? 20 : 200) : brawl ? 30 : 110) + e.r;
        if (d > R) continue;
        const ahead = (dx * hx + dy * hy) / d;                 // 1 = justo delante
        const w = Math.pow((R - d) / R, 1.5) * (e.boss ? 3 : 1);
        ax -= dx / d * w * (0.8 + Math.max(0, ahead) * 1.5);
        ay -= dy / d * w * (0.8 + Math.max(0, ahead) * 1.5);
        if (ahead > 0.5 && d < 90) front += w;
      }
      for (const p of G.Projectiles.all()) {
        if (p.friendly) continue;
        const dx = pl.x - p.x, dy = pl.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d > 140) continue;
        const vx = p.vx || 0, vy = p.vy || 0, v = Math.hypot(vx, vy) || 1;
        const side = (dx * -vy + dy * vx) > 0 ? 1 : -1;
        const w = (140 - d) / 140 * 1.5;
        ax += -vy / v * side * w; ay += vx / v * side * w;
      }
      for (const h of (G.Hazards && G.Hazards.all) || []) {
        if (h.x == null) continue;
        const dx = pl.x - h.x, dy = pl.y - h.y, d = Math.hypot(dx, dy) || 1, R = (h.r || 50) + 25;
        if (d < R) { ax += dx / d * 3; ay += dy / d * 3; }
      }
      // Si el camino de delante está tapado, cambia de rumbo hacia donde se escapa.
      if (front > 1.2) head = Math.atan2(ay, ax);
      if (Math.hypot(pl.x - lastX, pl.y - lastY) < 0.4) { if (++stuck > 10) { head += 1.2 + Math.random(); stuck = 0; } } else stuck = 0;
      lastX = pl.x; lastY = pl.y;
      return G.U.norm(ax, ay);
    };
    // Bot: cartas, objetos y vínculos
    const score = (c, pl) => c.type === 'evo' ? 100 : c.type === 'unlock' ? 90 : c.type === 'up' ? 50 + (c.active ? 10 : 0)
      : c.type === 'item' ? 45 : c.type === 'passive' ? 40 : c.type === 'new' ? 30 : 10;
    G.RunUI.showLevelUp = (lv, list, cb) => {
      const pl = G.Game.player;
      list.forEach(c => { if (c.type === 'up') { const m = pl.activeMove && pl.activeMove(); c.active = m && c.key === 'up:' + m.id; } });
      const best = list.slice().sort((a, b) => score(b, pl) - score(a, pl))[0];
      cb(best);
      // Se queda con el movimiento de más nivel como activo.
      if (pl.slots && pl.slots.length > 1) {
        let bi = 0, bl = -1;
        pl.slots.forEach((g, i) => { const l = Math.max(...g.map(m => (m.lvl || 0) + (m.evolved ? 10 : 0))); if (l > bl) { bl = l; bi = i; } });
        pl.setActive(bi);
      }
    };
    G.RunUI.showItemChoice = (cur, next, cb) => cb(next);
    G.RunUI.showBond = (opt, cb) => cb(opt.loose.slice(0, opt.mode === 'pair' ? 2 : 1));
    G.Game.startRun();
  }, [DEX, TAKEN]);

  const log = [];
  let lastMin = -1, shotN = 0;
  for (;;) {
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => {
      const pl = G.Game.player;
      return { t: __sim.playT, state: G.Game.state, lv: pl.level, hp: Math.round(pl.hp), maxHp: Math.round(pl.maxHp),
               kills: pl.kills, bosses: pl.bosses, dead: pl.dead, enemies: G.EnemyMgr.count, dmg: Math.round(pl.dmgDealt),
               moves: pl.moves.map(m => m.id + ':' + m.lvl + (m.evolved ? '*' : '')).join(' '),
               extra: G.LoL && G.LoL.simInfo ? G.LoL.simInfo(pl) : undefined,
               boss: (b => b ? { n: b.name, hp: Math.round(b.hp), max: b.maxHp, sh: Math.round(b.shield), d: Math.round(Math.hypot(b.x - pl.x, b.y - pl.y)), ar: Math.round(b.ar) } : null)(G.EnemyMgr.all().find(e => e.boss && !e.dead)),
               act: pl.activeMove() ? pl.activeMove().key : null };
    });
    const min = Math.floor(s.t / (+process.env.EVERY || 60));
    if (min !== lastMin) {
      lastMin = min;
      const row = Object.assign({ min }, s); delete row.state;
      log.push(row);
      console.log(JSON.stringify(row));
      if (shots && min % (+process.env.SHOT_EVERY || 5) === 0) {
        await page.evaluate(() => __sim.draw(true)); await page.waitForTimeout(150);
        await page.screenshot({ path: `${shots}/sim-${DEX}-${min}.png` });
        await page.evaluate(() => __sim.draw(false));
      }
    }
    if (s.state === 'over' || s.dead || s.t >= MAXMIN * 60) {
      console.log(JSON.stringify({ final: true, dex: DEX, t: Math.round(s.t), lv: s.lv, kills: s.kills, bosses: s.bosses,
                                   dead: s.dead || s.state === 'over', errors: errors.filter(e => !/ERR_TUNNEL|Failed to load resource/.test(e)).slice(0, 3).map(e => e.slice(0, 300)) }));
      break;
    }
  }
  await browser.close();
})();
