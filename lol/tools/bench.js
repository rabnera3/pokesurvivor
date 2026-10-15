/* Banco de pruebas de un campeón: mide cada habilidad por separado.
 *
 *   node lol/tools/bench.js <url> <campeón> [nivel=10] [objetos=a,b] [capturas]
 *
 * Sin oleadas, eventos ni grietas: alrededor del campeón hay siempre un grupo
 * de muñecos (enemigos quietos que no pegan; al caer, sale otro). El campeón
 * está al nivel pedido, con cada habilidad al rango que ese nivel permite.
 * Para Q, W y E: 8 s con esa habilidad activa (más el ataque básico y la R que
 * vayan cayendo) y se mide el daño de cada cosa por separado. Luego lo mismo
 * con todas evolucionadas (dándole los objetos que piden).
 * Escribe una línea JSON con el daño por segundo de cada parte y los errores.
 */
const { execSync } = require('child_process');
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const [url, dexArg, lvArg, itemsArg, shots] = process.argv.slice(2);
const DEX = +dexArg, LV = +(lvArg || 10);
const ITEMS = itemsArg && itemsArg !== '-' ? itemsArg.split(',') : [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 620 }, locale: 'es-ES' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    let vt = 1000, q = [], fast = true;
    const realRAF = window.requestAnimationFrame.bind(window);
    window.__sim = { fast(v) { fast = v; } };
    performance.now = () => vt;
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    const pump = () => {
      const t0 = Date.now();
      do { const run = q; q = []; vt += 1000 / 60; for (const cb of run) cb(vt); } while (fast && Date.now() - t0 < 40);
      realRAF(pump);
    };
    realRAF(pump);
  });
  await page.goto(url);
  await page.waitForFunction(() => window.G && G.Flow && G.DB && G.Game, null, { timeout: 30000 });
  await page.waitForTimeout(400);

  const setup = await page.evaluate(([dex, lv, items]) => {
    for (const id of ['tap-start', 'boot']) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
    G.DB.playAsGuest();
    const s = G.DB.save;
    s.owned[dex] = 1; s.partner = dex;
    G.RunUI.showLevelUp = (l, list, cb) => cb(list[0]);
    try { G.Game.startRun(); } catch (e) { return { err: e.message + ' ' + e.stack.split('\n').slice(0, 4).join(' | ') }; }
    for (const k of ['Spawner', 'Events', 'Rift', 'Judgment', 'Weather']) G[k].update = () => {};
    const pl = G.Game.player;
    if (!pl || !pl.abil) return { err: 'sin jugador ' + G.Game.state };
    pl.hurt = () => {};
    // Nivel y rangos
    while (pl.level < lv) { pl.level++; G.LoL.recalc(pl); G.Kit.onLevel(pl); }
    for (const k of ['Q', 'W', 'E', 'R']) { const m = pl.abil[k]; if (m) while (m.lvl < G.Kit.rankCap(k, pl.level) && G.Kit.rankUp(m)); }
    for (const id of items) pl.addItem(id);
    pl.hp = pl.maxHp;
    // Muñecos: un grupo delante y unos pocos alrededor.
    const def = { dex: 2015, name: 'Muñeco', behavior: 'tank', hp: 1e9, spd: 0, dmg: 0, xp: 0, ar: 30, mr: 30 };
    window.__dummies = () => {
      const all = G.EnemyMgr.all().filter(e => !e.dead);
      const want = [[45, 0], [55, 22], [55, -22], [72, 0], [78, 38], [78, -38], [98, 12], [98, -14], [-52, 0], [0, 54], [0, -54], [140, 0]];
      const used = new Set(all.map(e => e.slot));
      for (let i = 0; i < want.length; i++) {
        if (used.has(i)) continue;
        const e = new G.Enemy(def, 0, 0, { hp: 1, spd: 1, dmg: 1 });
        e.maxHp = e.hp = 4000; e.slot = i;
        G.EnemyMgr.add(e);
      }
      // Siempre en su sitio (los empujones no los alejan) y sin morir.
      for (const e of G.EnemyMgr.all()) {
        if (e.dead || e.slot == null) continue;
        e.x = pl.x + want[e.slot][0]; e.y = pl.y + want[e.slot][1]; e.kx = e.ky = 0;
        if (e.hp < 1500) e.hp = e.maxHp;
      }
    };
    window.__dummies();
    setInterval(window.__dummies, 20);
    return { lv: pl.level, st: G.LoL.simInfo(pl), hp: pl.maxHp };
  }, [DEX, LV, ITEMS]);
  if (setup.err) { console.log(JSON.stringify({ dex: DEX, setup, errors })); await browser.close(); return; }

  async function measure(key, secs, shot) {
    await page.evaluate(k => {
      const pl = G.Game.player;
      pl.x = 0; pl.y = 0;
      const i = pl.slots.findIndex(g => g[0].key === k);
      if (i >= 0) pl.setActive(i);
      for (const m of [...pl.moves, pl.abil.R, pl.basicAtk]) if (m) m.dealt = 0;
      window.__t0 = performance.now();
    }, key);
    const t0 = Date.now();
    while (true) {
      await page.waitForTimeout(200);
      const el = await page.evaluate(() => (performance.now() - __t0) / 1000);
      if (el >= secs) break;
      if (Date.now() - t0 > 60000) break;
    }
    if (shot) {
      await page.evaluate(() => __sim.fast(false));
      await page.waitForTimeout(250);
      await page.screenshot({ path: shot });
      await page.evaluate(() => __sim.fast(true));
    }
    return page.evaluate(k => {
      const pl = G.Game.player, el = (performance.now() - __t0) / 1000;
      const r = x => Math.round(x * 10) / 10;
      const out = { basic: r((pl.basicAtk.dealt || 0) / el) };
      for (const m of pl.moves) out[m.key] = r((m.dealt || 0) / el);
      if (pl.abil.R) out.R = r((pl.abil.R.dealt || 0) / el);
      return out;
    }, key);
  }

  const res = { dex: DEX, setup, base: {}, evo: {} };
  const keys = await page.evaluate(() => G.Game.player.moves.map(m => m.key));
  for (const k of keys) res.base[k] = await measure(k, 8, shots ? `${shots}/bench-${DEX}-${k}.png` : null);
  // Evolucionadas
  await page.evaluate(() => {
    const pl = G.Game.player;
    for (const k of ['Q', 'W', 'E']) {
      const m = pl.abil[k]; if (!m) continue;
      while (G.Kit.rankUp(m));
      const ev = G.Kit.evoOf(m);
      if (ev) { if (!pl.hasItem(ev.item)) { pl.items.push(ev.item); G.LoL.recalc(pl); } G.Kit.evolve(m); }
    }
  });
  for (const k of keys) res.evo[k] = await measure(k, 8, shots ? `${shots}/bench-${DEX}-${k}-evo.png` : null);
  res.errors = errors.slice(0, 5).map(e => e.slice(0, 300));
  console.log(JSON.stringify(res));
  await browser.close();
})();
