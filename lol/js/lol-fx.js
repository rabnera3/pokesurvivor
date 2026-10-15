/* ============ lol-fx.js — efectos propios de las habilidades de LoL ============
 * Formas y paletas nuevas para G.VFX (mismo pixel art que las de PokéSurvivor)
 * y efectos que se lanzan al usar cada habilidad (G.LoLFX.cast desde combat).
 *
 *   m.vfx = 'garen-q'  ->  G.VFX.LOL['garen-q'] (cómo se ve el golpe/proyectil)
 *                          y CAST['garen-q'] (efecto extra al lanzarla), si hay.
 */
G.LoLFX = (() => {
  const PX = G.Sprites.PX;
  const snap = v => Math.round(v / PX) * PX;
  const step = k => k > 0.66 ? 1 : k > 0.33 ? 0.66 : 0.33;

  // ---------------- paletas: contorno, oscuro, medio, claro, brillo
  Object.assign(G.VFX.PAL, {
    demacia: ['#3a2606', '#9a6c14', '#e0b440', '#fde28a', '#ffffff'],
    blade:   ['#1c2232', '#5a6478', '#a8b2c6', '#e2e8f2', '#ffffff'],
  });

  // ---------------- formas (miran a la derecha)
  Object.assign(G.VFX.SHAPES, {
    // Espada gigante de Justicia Demaciana, cayendo de punta (sin girar: así
    // no se deforman los píxeles).
    bigsword: { w: 13, h: 40, gen(P) {
      P.fill((x, y) => {
        if (y < 11 || y > 38) return null;
        const half = y < 33 ? 2.7 : 2.7 * (38 - y) / 5;
        const d = x - 6;
        if (Math.abs(d) > half) return null;
        return d === 0 ? 'w' : d < 0 ? 'l' : 'm';
      });
      for (let x = 0; x <= 12; x++) P.set(x, 9, x < 6 ? 'l' : 'm');
      for (let x = 1; x <= 11; x++) P.set(x, 10, 'd');
      for (let y = 2; y <= 8; y++) for (let x = 5; x <= 7; x++) P.set(x, y, x === 5 ? 'm' : 'd');
      for (let x = 4; x <= 8; x++) { P.set(x, 0, 'm'); P.set(x, 1, x < 6 ? 'l' : 'm'); }
      P.set(6, 5, 'w');
      P.outline();
    } },
    // Espada pequeña (la que gira en Juicio).
    sword: { w: 19, h: 7, dir: true, gen(P) {
      P.fill((x, y) => {
        if (x < 6 || x > 18) return null;
        const half = x < 15 ? 1.6 : 1.6 * (18 - x) / 3;
        const d = y - 3;
        if (Math.abs(d) > half) return null;
        return d === 0 ? 'w' : d < 0 ? 'l' : 'm';
      });
      for (let y = 0; y <= 6; y++) P.set(5, y, 'l');
      for (let x = 1; x <= 4; x++) P.set(x, 3, 'd');
      P.set(0, 3, 'm');
      P.outline();
    } },
    // Escudo (partícula de Coraje).
    shield: { w: 9, h: 11, gen(P) {
      P.fill((x, y) => {
        const dx = Math.abs(x - 4);
        const lim = y < 6 ? 4 : 4 - (y - 5) * 0.8;
        if (dx > lim || y > 10) return null;
        if (dx > lim - 1 || y === 0) return 'm';
        return x < 4 ? 'l' : 'd';
      });
      P.set(4, 2, 'w'); P.set(4, 3, 'w'); P.set(3, 3, 'w'); P.set(5, 3, 'w'); P.set(4, 4, 'w');
      P.outline();
    } },
  });

  // ---------------- cómo se ve cada habilidad (ver vfx.js, MOVE)
  G.VFX.LOL = {
    'garen-aa': { pal: 'blade' },
    'garen-q': { melee: 'impact', pal: 'demacia' },
    'garen-w': { aura: 'shield', pal: 'demacia', rise: true },
    'garen-e': { pal: 'blade' },
    'garen-r': { proj: 'bigsword', pal: 'demacia', trail: 'spark' },
  };

  // ---------------- efectos sueltos (siguen al campeón si follow)
  let list = [];
  function add(o) { if (list.length < 60) list.push(Object.assign({ t: 0 }, o)); }

  function dots(ctx, x, y, rx, ry, n, col, a0 = 0, size = 1) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = a0 + i / n * 6.2832;
      ctx.fillRect(snap(x + Math.cos(a) * rx), snap(y + Math.sin(a) * ry), PX * size, PX * size);
    }
  }

  const DRAW = {
    // Coraje: burbuja dorada que late alrededor del campeón.
    shieldBubble(ctx, f, k) {
      const P = G.VFX.PAL.demacia, pl = f.pl;
      const x = pl.x, y = pl.y - pl.bodyH * 0.45;
      const rx = pl.r * 2.3 * (0.9 + 0.1 * Math.sin(f.t * 30)), ry = rx * 0.95;
      ctx.globalAlpha = step(k) * 0.9;
      dots(ctx, x, y, rx, ry, 34, P[2]);
      dots(ctx, x, y, rx - PX, ry - PX, 34, P[3], 0.09);
      // brillo que da la vuelta
      ctx.fillStyle = P[4];
      for (let j = 0; j < 4; j++) {
        const a = f.t * 9 + j * 0.09;
        ctx.fillRect(snap(x + Math.cos(a) * rx), snap(y + Math.sin(a) * ry), PX * 2, PX * 2);
      }
      ctx.globalAlpha = 1;
    },
    // Juicio: dos espadas girando y una estela circular.
    spinBlades(ctx, f, k) {
      const pl = f.pl, P = G.VFX.PAL.blade;
      const x = pl.x, y = pl.y - pl.bodyH * 0.35;
      const R = f.r;
      const a0 = f.t * 22;
      ctx.globalAlpha = step(k) * 0.75;
      for (let j = 0; j < 14; j++) {
        const a = a0 - j * 0.12;
        ctx.fillStyle = j < 4 ? P[4] : j < 9 ? P[3] : P[2];
        ctx.fillRect(snap(x + Math.cos(a) * R), snap(y + Math.sin(a) * R * 0.55), PX, PX);
        ctx.fillRect(snap(x + Math.cos(a + Math.PI) * R), snap(y + Math.sin(a + Math.PI) * R * 0.55), PX, PX);
      }
      ctx.globalAlpha = 1;
      // Las dos espadas: hoja de píxeles en la rejilla (un sprite girado se deforma).
      ctx.globalAlpha = step(k);
      const D = G.VFX.PAL.demacia;
      for (const s of [0, Math.PI]) {
        const a = a0 + s, ca = Math.cos(a), sa = Math.sin(a) * 0.55;
        for (let d = R * 0.3; d <= R * 0.95; d += PX * 0.8) {
          const u = (d - R * 0.3) / (R * 0.65);
          const bx = x + ca * d, by = y + sa * d;
          if (u < 0.12) { ctx.fillStyle = D[2]; ctx.fillRect(snap(bx - PX), snap(by - PX), PX * 3, PX * 3); continue; }
          ctx.fillStyle = P[0]; ctx.fillRect(snap(bx), snap(by + PX), PX, PX);
          ctx.fillStyle = u > 0.9 ? P[4] : P[3]; ctx.fillRect(snap(bx), snap(by), PX, PX);
          if (u < 0.85) { ctx.fillStyle = P[2]; ctx.fillRect(snap(bx), snap(by - PX), PX, PX); }
        }
      }
    },
    // Golpe Decisivo: media luna dorada y grietas en el suelo.
    crack(ctx, f, k) {
      const P = G.VFX.PAL.demacia;
      ctx.globalAlpha = step(k);
      for (const c of f.lines) {
        for (let i = 0; i <= c.n; i++) {
          ctx.fillStyle = i < c.n * 0.3 ? P[4] : i < c.n * 0.7 ? P[3] : P[1];
          ctx.fillRect(snap(f.x + Math.cos(c.a) * i * PX), snap(f.y + Math.sin(c.a) * i * PX * 0.7), PX, PX);
        }
      }
      ctx.globalAlpha = 1;
    },
    // Justicia Demaciana: columna de luz dorada donde cae la espada.
    pillar(ctx, f, k) {
      const P = G.VFX.PAL.demacia;
      const w = (6 + 4 * k) * PX / 2;
      ctx.globalAlpha = step(k) * 0.7;
      ctx.fillStyle = P[3];
      ctx.fillRect(snap(f.x - w), snap(f.y - 220), snap(w * 2), 220);
      ctx.fillStyle = P[4];
      ctx.fillRect(snap(f.x - w / 3), snap(f.y - 220), snap(w * 2 / 3) || PX, 220);
      ctx.globalAlpha = 1;
    },
  };

  // ---------------- al lanzar cada habilidad
  const CAST = {
    'garen-q'(pl, m) {
      const x = pl.x + Math.cos(pl.aim) * m.radius * 0.55, y = pl.y + Math.sin(pl.aim) * m.radius * 0.55;
      const lines = [];
      for (let i = 0; i < 5; i++) lines.push({ a: pl.aim + (i - 2) * 0.55 + G.U.rand(-0.15, 0.15), n: 5 + (Math.random() * 5 | 0) });
      add({ draw: 'crack', x, y, lines, life: 0.45 });
      G.FX.burst(x, y, G.VFX.PAL.demacia[3], 10, 130);
      G.FX.sp('impact', 'demacia', x, y - 6, { life: 0.18, scale: 1.6 });
      G.Camera.kick(0.06);
    },
    'garen-w'(pl) {
      add({ draw: 'shieldBubble', pl, life: 0.5 });
    },
    'garen-e'(pl, m) {
      add({ draw: 'spinBlades', pl, r: m.radius * 0.75, life: Math.max(0.3, (m.cdEff || m.cd || 0.4) * 0.95) });
    },
    'garen-r'(pl, m) {
      // la espada cae sobre el blanco: columna de luz al llegar
      const near = G.EnemyMgr.queryCircle(pl.x, pl.y, 400).filter(e => !e.dead);
      for (const e of near.slice(0, Math.max(1, m.count | 0))) add({ draw: 'pillar', x: e.x, y: e.y, life: 0.6, delay: 0.45 });
    },
  };

  function cast(pl, m) {
    const f = m.vfx && CAST[m.vfx];
    if (f) f(pl, m);
  }

  function update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i];
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.t += dt;
      if (f.t >= f.life || (f.pl && f.pl.dead)) list.splice(i, 1);
    }
  }
  function draw(ctx) {
    for (const f of list) {
      if (f.delay > 0) continue;
      DRAW[f.draw](ctx, f, 1 - f.t / f.life);
    }
  }

  // Se cuelga del ciclo de G.FX (mismo momento de actualizar, dibujar y limpiar).
  const oU = G.FX.update, oD = G.FX.draw, oC = G.FX.clear;
  G.FX.update = dt => { oU(dt); update(dt); };
  G.FX.draw = ctx => { draw(ctx); oD(ctx); };
  G.FX.clear = () => { oC(); list = []; };

  return { cast, CAST, DRAW, add };
})();
