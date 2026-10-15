/* ============ lol-hud.js — lo del kit en el HUD ============
 * Lo llama ui/hud.js (parcheado en lol/tools/build.py) en vez de dibujar el
 * objeto único de PokéSurvivor:
 *   - a la izquierda de las habilidades, los 6 huecos de objeto
 *   - a la derecha, las que aún no tienes (con el nivel en que llegan) y la R,
 *     que se lanza sola: su recarga se ve vaciándose
 */
(() => {
  const DT = { phys: '#ffb35c', magic: '#7fb4ff', true: '#ffffff' };

  function box(ctx, rr, x, y, s, fill, stroke, lw) {
    rr(ctx, x, y, s, s, Math.round(s * 0.22));
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw || 1.2; ctx.strokeStyle = stroke; ctx.stroke();
  }

  G.LoL.hud = (ctx, pl, sx, sy, S, totalW, F, rr) => {
    if (!pl.abil) return;
    // ---- objetos (3 × 2) ----
    const I = 24, IG = 4;
    const ix0 = sx - 18 - 3 * I - 2 * IG, iy0 = sy + S - 2 * I - IG;
    for (let k = 0; k < 6; k++) {
      const x = ix0 + (k % 3) * (I + IG), y = iy0 + Math.floor(k / 3) * (I + IG);
      const id = pl.items[k];
      box(ctx, rr, x, y, I, id ? 'rgba(40,30,10,.9)' : 'rgba(10,16,28,.5)', id ? '#e0b84a' : 'rgba(140,170,210,.16)', id ? 1.5 : 1);
      if (id) G.Icons.draw(ctx, G.LoLItems.BY[id].icon, x + 2, y + 2, I - 4);
    }

    // ---- lo que aún no tienes + la R ----
    let x = sx + totalW + 9;
    for (const key of ['W', 'E']) {
      if (pl.abil[key]) continue;
      box(ctx, rr, x, sy + 8, S - 8, 'rgba(10,16,28,.45)', 'rgba(140,170,210,.14)');
      ctx.font = F(800, 10); ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(180,200,230,.55)';
      ctx.fillText(key, x + (S - 8) / 2, sy + 8 + 18);
      ctx.font = F(700, 8);
      ctx.fillText('Nv.' + G.Kit.UNLOCK[key], x + (S - 8) / 2, sy + 8 + 34);
      x += S - 8 + 9;
    }
    const R = pl.abil.R;
    const rx = x + 6, ry = sy - 4, RS = S + 4;
    if (!R) {
      box(ctx, rr, rx, ry, RS, 'rgba(10,16,28,.45)', 'rgba(255,210,63,.25)');
      ctx.font = F(800, 12); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,210,63,.55)';
      ctx.fillText('R', rx + RS / 2, ry + 22);
      ctx.font = F(700, 8); ctx.fillStyle = 'rgba(180,200,230,.55)';
      ctx.fillText('Nv.' + G.Kit.UNLOCK.R, rx + RS / 2, ry + 38);
    } else {
      box(ctx, rr, rx, ry, RS, 'rgba(30,22,8,.92)', R.evolved ? '#ffd23f' : '#e0b84a', 2);
      G.Icons.draw(ctx, 'move:' + R.id, rx + (RS - 34) / 2, ry + (RS - 34) / 2 - 2, 34);
      const f = G.U.clamp(R.t / (R.cdEff || R.cd), 0, 1);
      if (f > 0) {
        ctx.save(); rr(ctx, rx, ry, RS, RS, 12); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(rx, ry, RS, RS * f);
        ctx.restore();
        ctx.font = F(800, 11); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText(Math.ceil(R.t), rx + RS / 2, ry + RS / 2 + 4);
      }
      for (let d = 0; d < 3; d++) {
        ctx.fillStyle = d < R.lvl ? '#ffd23f' : 'rgba(255,255,255,.18)';
        ctx.fillRect(rx + RS / 2 - 11 + d * 8, ry + RS - 8, 6, 3);
      }
      ctx.font = F(800, 9); ctx.textAlign = 'left'; ctx.fillStyle = '#ffd23f';
      ctx.fillText('R', rx + 4, ry + 11);
      // Destello al lanzarse.
      const fl = 1 - (performance.now() - (R.castAt || 0)) / 300;
      if (fl > 0) { ctx.save(); ctx.globalAlpha = fl * 0.5; ctx.fillStyle = '#ffe9a0'; rr(ctx, rx, ry, RS, RS, 12); ctx.fill(); ctx.restore(); }
    }
    G.LoL.hudRight = rx + RS + 12;

    // ---- escudo sobre la barra de vida (texto pequeño) ----
    if (pl.shield > 0.5) {
      ctx.font = F(700, 9); ctx.textAlign = 'left'; ctx.fillStyle = '#eef4ff';
      ctx.fillText('Escudo ' + Math.round(pl.shield), 16, 60);
    }
  };

  /** Estadísticas para la pausa. */
  G.LoL.statsHtml = pl => {
    if (!pl || !pl.st) return '';
    const s = pl.st, r = v => Math.round(v), p = v => Math.round(v * 100) + ' %';
    const row = (k, v) => `<div><span>${G.LoL.NAMES[k][0]}</span><b>${v}</b></div>`;
    const items = pl.items.map(id => G.LoLItems.BY[id].name).join(', ') || '—';
    const kit = ['Q', 'W', 'E', 'R'].map(k => pl.abil[k] ? `<b>${k}</b> ${pl.abil[k].name} (${pl.abil[k].lvl})` : `<b>${k}</b> nv.${G.Kit.UNLOCK[k]}`).join(' · ');
    return `<div class="lol-stats">
      ${row('ad', r(s.ad))}${row('ap', r(s.ap))}${row('ar', r(s.ar))}${row('mr', r(s.mr))}
      ${row('as', s.as.toFixed(2))}${row('ah', r(s.ah))}${row('crit', p(pl.critChance))}${row('ls', p(s.ls))}
      ${row('hp', r(pl.maxHp))}${row('ms', r(pl.spd))}
    </div><p class="sub" style="margin:6px 0 0">${kit}</p><p class="sub" style="margin:4px 0 0">Objetos: ${items}</p>
    <p class="sub" style="margin:4px 0 0">Pasiva: ${pl.passive.def.name} (${pl.passive.tier}/3)</p>`;
  };

  // Objeto recogido (jefes, cofres): uno que encaje con tu campeón.
  G.LoL.takeItem = pl => {
    if (!pl) return;
    const id = pl.items.length < 6 ? G.LoLItems.roll(pl) : null;
    if (id && pl.addItem(id)) {
      G.Spawner.say('¡Objeto! ' + G.LoLItems.BY[id].name, 2.6, true);
      G.Progress.event('item', { id });
    } else {
      G.Pickups.dropXp(pl.x + 18, pl.y, Math.ceil(G.Game.levelXp() * 0.6));
      G.Spawner.say('Inventario lleno: lo conviertes en experiencia', 2.2, true);
    }
  };

  // Colores por tipo de daño también en otras pantallas.
  G.LoL.DT_HUD = DT;
})();
