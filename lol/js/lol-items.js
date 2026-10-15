/* ============ lol-items.js — objetos de League of Legends ============
 *
 * Hasta 6 por partida. Salen en las cartas de subir de nivel (sólo los que van
 * con tu campeón: `tags` del objeto ∩ `tags` del campeón, o 'all') y los sueltan
 * los jefes y los cofres. Con los 6 huecos llenos, uno nuevo se convierte en
 * experiencia.
 *
 *   st     estadísticas (ver lol-stats.js; asB = % de velocidad de ataque)
 *   mod    (st, pl) cambia estadísticas ya sumadas (Rabadon: +30 % de PH)
 *   onHit(pl, e, dmg, m)   cada golpe (m.basic = ataque básico)
 *   onCast(pl, m)          al lanzar una habilidad
 *   onKill(pl, e)          al derrotar a un enemigo
 *   onHurt(pl, dmg) -> dmg al recibir daño (puede cambiarlo)
 *   tick(pl, dt)           cada fotograma
 * Escalas: daño y vida divididos entre ~6 respecto a LoL; armadura, RM,
 * celeridad y porcentajes, tal cual.
 */
G.LoLItems = (() => {
  const now = () => performance.now() / 1000;
  const near = (x, y, r) => G.EnemyMgr.queryCircle(x, y, r).filter(e => !e.dead);
  /** Golpe extra de un objeto: no vuelve a activar efectos (sin recursión). */
  const extra = (pl, e, dmg, dt, col) => {
    if (!e || e.dead) return;
    const d = G.LoL.vsEnemy(pl, e, dmg, dt);
    e.hurt(d, col || G.LoL.DT_COLOR[dt]);
    pl.dmgDealt += d;
  };

  const LIST = [
    // ---------------- daño de ataque ----------------
    { id: 'ie', name: 'Filo del Infinito', en: 'Infinity Edge', icon: 'choiceband', tags: ['crit'],
      st: { ad: 11, crit: 0.25, critD: 0.4 }, desc: 'Tus críticos hacen un 40 % más de daño.' },
    { id: 'bt', name: 'Sanguinaria', en: 'Bloodthirster', icon: 'shellbell', tags: ['ad', 'crit'],
      st: { ad: 10, ls: 0.15 }, desc: 'Tus ataques básicos te curan un 15 % del daño.' },
    { id: 'bc', name: 'Cuchilla Negra', en: 'Black Cleaver', icon: 'fist', tags: ['fighter'],
      st: { ad: 7, hp: 50, ah: 20 }, desc: 'Tu daño físico rompe armadura: hasta −30 % durante 4 s.',
      onHit(pl, e, dmg, m) { if (m.dt === 'phys') { const live = e.shredUntil > now(); e.shred = Math.min(0.3, (live ? e.shred || 0 : 0) + 0.06); e.shredUntil = now() + 4; } } },
    { id: 'hydra', name: 'Hidra Titánica', en: 'Titanic Hydra', icon: 'fist', tags: ['fighter', 'tank'],
      st: { ad: 7, hp: 90 }, desc: 'Tus ataques básicos golpean también alrededor del objetivo (+2 % de tu vida máx.).',
      onHit(pl, e, dmg, m) {
        if (!m.basic) return;
        for (const o of near(e.x, e.y, 70)) if (o !== e) extra(pl, o, dmg * 0.4 + pl.maxHp * 0.02, 'phys');
      } },
    { id: 'tf', name: 'Fuerza de Trinidad', en: 'Trinity Force', icon: 'star', tags: ['fighter', 'ad'],
      st: { ad: 6, asB: 0.3, hp: 50, ah: 20 }, desc: 'Hoja encantada: tras lanzar una habilidad, tu siguiente ataque básico hace +200 % de daño base.',
      onCast(pl, m) { if (!m.basic) pl.sblade = Math.max(pl.sblade || 0, 2); } },
    { id: 'botrk', name: 'Hoja del Rey Arruinado', en: 'Blade of the Ruined King', icon: 'lifeorb', tags: ['marksman', 'fighter'],
      st: { ad: 7, asB: 0.25, ls: 0.08 }, desc: 'Tus ataques básicos quitan además un 6 % de la vida actual del enemigo.',
      onHit(pl, e, dmg, m) { if (m.basic) extra(pl, e, Math.min(60, e.hp * 0.06), 'phys'); } },
    { id: 'ldr', name: 'Recordatorio Mortal', en: "Lord Dominik's Regards", icon: 'choiceband', tags: ['crit'],
      st: { ad: 6, crit: 0.25, apen: 0.35 }, desc: 'Ignoras un 35 % de la armadura de los enemigos.' },
    { id: 'kraken', name: 'Asesina de Krakens', en: 'Kraken Slayer', icon: 'quickclaw', tags: ['marksman'],
      st: { ad: 7, asB: 0.35 }, desc: 'Cada 3.er ataque básico hace daño verdadero extra.',
      onHit(pl, e, dmg, m) { if (m.basic && (pl.kraken = (pl.kraken || 0) + 1) % 3 === 0) extra(pl, e, 8 + pl.st.ad * 0.5, 'true'); } },
    { id: 'yg', name: 'Filo Fantasmal de Youmuu', en: "Youmuu's Ghostblade", icon: 'choicescarf', tags: ['assassin'],
      st: { ad: 9, leth: 12, msP: 0.06 }, desc: 'Al lanzar una habilidad ganas velocidad un momento.',
      onCast(pl, m) { if (!m.basic) pl.addBuff('spd', 0.12, 1.5, 1); } },
    { id: 'collector', name: 'Recaudador', en: 'The Collector', icon: 'amuletcoin', tags: ['crit', 'assassin'],
      st: { ad: 9, crit: 0.2, leth: 8 }, desc: 'Remata a los enemigos que se quedan por debajo del 5 % de vida (no a los jefes).',
      onHit(pl, e) { if (!e.boss && !e.dead && e.hp > 0 && e.hp < e.maxHp * 0.05) extra(pl, e, e.hp + 1, 'true'); } },
    { id: 'sterak', name: 'Cinturón de Sterak', en: "Sterak's Gage", icon: 'shield', tags: ['fighter', 'tank'],
      st: { hp: 70, ad: 4, ar: 10 }, desc: 'Al bajar del 30 % de vida, escudo del 30 % de tu vida máxima (cada 30 s).',
      onHurt(pl, d) { if (pl.hp - d < pl.maxHp * 0.3 && now() - (pl.sterakT || -99) > 30) { pl.sterakT = now(); pl.addShield(pl.maxHp * 0.3); } return d; } },
    { id: 'ga', name: 'Ángel de la Guarda', en: 'Guardian Angel', icon: 'focussash', tags: ['ad', 'crit', 'fighter'],
      st: { ad: 8, ar: 40 }, desc: 'Una vez por partida, al caer revives con la mitad de la vida.',
      onDeath(pl) { if (pl.gaUsed) return false; pl.gaUsed = true; pl.hp = pl.maxHp * 0.5; pl.invuln = 2.5; return true; } },
    { id: 'dd', name: 'Danza de la Muerte', en: "Death's Dance", icon: 'shield', tags: ['fighter'],
      st: { ad: 9, ar: 40, ah: 15 }, desc: 'Recibes un 12 % menos de daño y cada enemigo que derrotas te cura un poco.',
      onHurt(pl, d) { return d * 0.88; },
      onKill(pl) { pl.healAcc += pl.maxHp * 0.015; } },
    { id: 'rh', name: 'Hidra Voraz', en: 'Ravenous Hydra', icon: 'shellbell', tags: ['fighter', 'assassin'],
      st: { ad: 9, omni: 0.1, ah: 10 }, desc: 'Omnivampirismo y golpes en área con los ataques básicos.',
      onHit(pl, e, dmg, m) { if (m.basic) for (const o of near(e.x, e.y, 60)) if (o !== e) extra(pl, o, dmg * 0.35, 'phys'); } },
    { id: 'ec', name: 'Eclipse', en: 'Eclipse', icon: 'star', tags: ['assassin', 'fighter'],
      st: { ad: 9, leth: 8, ah: 10 }, desc: 'Cada pocos segundos, golpear con habilidades da un escudo.',
      onHit(pl, e, dmg, m) { if (!m.basic && now() - (pl.eclT || -99) > 6) { pl.eclT = now(); pl.addShield(12 + pl.st.ad * 0.4); extra(pl, e, e.maxHp * 0.06, 'phys'); } } },

    // ---------------- poder de habilidad ----------------
    { id: 'raba', name: 'Sombrero de Rabadon', en: "Rabadon's Deathcap", icon: 'luckyegg', tags: ['ap'],
      st: { ap: 22, apP: 0.3 }, desc: '+30 % de poder de habilidad.' },
    { id: 'luden', name: 'Eco de Luden', en: "Luden's Echo", icon: 'star', tags: ['ap'],
      st: { ap: 15, mpenf: 6, ah: 15 }, desc: 'Cada 3 s, una habilidad que golpea lanza un eco a 3 enemigos cercanos.',
      onHit(pl, e, dmg, m) {
        if (m.basic || now() - (pl.ludenT || -99) < 3) return;
        pl.ludenT = now();
        near(e.x, e.y, 140).slice(0, 3).forEach(o => { extra(pl, o, 10 + pl.st.ap * 0.15, 'magic'); G.FX.ring(o.x, o.y, 2, 16, '#7fb4ff', 0.25, 2); });
      } },
    { id: 'liandry', name: 'Tormento de Liandry', en: "Liandry's Torment", icon: 'lifeorb', tags: ['ap', 'tank'],
      st: { ap: 15, hp: 50, ah: 15 }, desc: 'Tus habilidades queman a los enemigos.',
      onHit(pl, e, dmg, m) { if (!m.basic) e.applyBurn(1); } },
    { id: 'zhonya', name: 'Reloj de Arena de Zhonya', en: "Zhonya's Hourglass", icon: 'clock', tags: ['ap'],
      st: { ap: 18, ar: 45, ah: 10 }, desc: 'Al bajar del 25 % de vida, te vuelves invulnerable 2,5 s (cada 40 s).',
      onHurt(pl, d) { if (pl.hp - d < pl.maxHp * 0.25 && now() - (pl.zhT || -99) > 40) { pl.zhT = now(); pl.invuln = 2.5; G.FX.ring(pl.x, pl.y, 6, 60, '#ffd23f', 0.6, 4); return 0; } return d; } },
    { id: 'void', name: 'Bastón del Vacío', en: 'Void Staff', icon: 'book', tags: ['ap'],
      st: { ap: 15, mpen: 0.4 }, desc: 'Ignoras un 40 % de la resistencia mágica de los enemigos.' },
    { id: 'rylai', name: 'Cetro de Cristal de Rylai', en: "Rylai's Crystal Scepter", icon: 'book', tags: ['ap'],
      st: { ap: 12, hp: 70 }, desc: 'Tus habilidades ralentizan.',
      onHit(pl, e, dmg, m) { if (!m.basic) e.applySlow(0.3, 1); } },
    { id: 'lich', name: 'Perdición del Liche', en: 'Lich Bane', icon: 'luckyegg', tags: ['ap', 'assassin'],
      st: { ap: 13, msP: 0.04, ah: 10 }, desc: 'Hoja encantada: tras lanzar una habilidad, tu siguiente ataque básico hace daño mágico extra.',
      onCast(pl, m) { if (!m.basic) pl.lich = true; },
      onHit(pl, e, dmg, m) { if (m.basic && pl.lich) { pl.lich = false; extra(pl, e, 12 + pl.st.ap * 0.6, 'magic'); } } },
    { id: 'nashor', name: 'Diente de Nashor', en: "Nashor's Tooth", icon: 'quickclaw', tags: ['ap'],
      st: { ap: 13, asB: 0.5 }, desc: 'Tus ataques básicos hacen daño mágico extra.',
      onHit(pl, e, dmg, m) { if (m.basic) extra(pl, e, 3 + pl.st.ap * 0.2, 'magic'); } },
    { id: 'shadowflame', name: 'Llama Sombría', en: 'Shadowflame', icon: 'lifeorb', tags: ['ap'],
      st: { ap: 17, mpenf: 8 }, desc: '+20 % de daño a los enemigos por debajo del 35 % de vida.' },
    { id: 'cosmic', name: 'Impulso Cósmico', en: 'Cosmic Drive', icon: 'choicescarf', tags: ['ap'],
      st: { ap: 12, hp: 40, ah: 25, msP: 0.04 }, desc: 'Mucha celeridad y velocidad.' },
    { id: 'malig', name: 'Malignidad', en: 'Malignance', icon: 'clock', tags: ['ap'],
      st: { ap: 13, ah: 25 }, desc: 'Tu definitiva se recarga un 20 % más rápido.' },

    // ---------------- tanque ----------------
    { id: 'warmog', name: 'Armadura de Warmog', en: "Warmog's Armor", icon: 'leftovers', tags: ['tank', 'fighter'],
      st: { hp: 140 }, desc: 'Si no te golpean en 3 s, recuperas un 2 % de tu vida por segundo.',
      tick(pl, dt) { if (now() - (pl.lastHurtT || -99) > 3) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.02 * dt); } },
    { id: 'thorn', name: 'Malla de Espinas', en: 'Thornmail', icon: 'rockyhelmet', tags: ['tank'],
      st: { hp: 30, ar: 60 }, desc: 'Quien te golpea cuerpo a cuerpo recibe daño mágico.',
      onTouched(pl, e) { extra(pl, e, 5 + pl.st.ar * 0.12, 'magic', '#9aa6b5'); } },
    { id: 'sunfire', name: 'Égida Solar', en: 'Sunfire Aegis', icon: 'wsun', tags: ['tank'],
      st: { hp: 60, ar: 40 }, desc: 'Quemas a los enemigos a tu alrededor.',
      tick(pl, dt) {
        if ((pl.sunT = (pl.sunT || 0) - dt) > 0) return;
        pl.sunT = 1;
        for (const e of near(pl.x, pl.y, 80)) extra(pl, e, 3 + pl.maxHp * 0.012, 'magic', '#ff9a4d');
      } },
    { id: 'randuin', name: 'Presagio de Randuin', en: "Randuin's Omen", icon: 'assaultvest', tags: ['tank'],
      st: { hp: 60, ar: 60 }, desc: 'Recibes un 10 % menos de daño cuerpo a cuerpo.',
      onTouchedDmg(pl, d) { return d * 0.9; } },
    { id: 'visage', name: 'Semblante Espiritual', en: 'Spirit Visage', icon: 'heart', tags: ['tank', 'fighter'],
      st: { hp: 70, mr: 50, ah: 10, heal: 0.25 }, desc: 'Te curas un 25 % más.' },
    { id: 'fon', name: 'Fuerza de la Naturaleza', en: 'Force of Nature', icon: 'sprout', tags: ['tank'],
      st: { hp: 60, mr: 60, msP: 0.05 }, desc: 'Resistencia mágica y velocidad.' },
    { id: 'fh', name: 'Corazón Helado', en: 'Frozen Heart', icon: 'wsnow', tags: ['tank'],
      st: { ar: 60, ah: 20 }, desc: 'Los enemigos de alrededor van más lentos.',
      tick(pl) { for (const e of near(pl.x, pl.y, 90)) e.applySlow(0.15, 0.3); } },
    { id: 'heartsteel', name: 'Corazón de Acero', en: 'Heartsteel', icon: 'heart', tags: ['tank'],
      st: { hp: 120 }, desc: 'Cada enemigo derrotado te da vida máxima para siempre (hasta +150).',
      onKill(pl) { if ((pl.hsteel || 0) < 150) { pl.hsteel = (pl.hsteel || 0) + 0.5; pl.dirtyStats = true; } },
      mod(st, pl) { st.hp += pl.hsteel || 0; } },
    { id: 'jaksho', name: "Jak'Sho el Proteico", en: "Jak'Sho, The Protean", icon: 'shield', tags: ['tank'],
      st: { hp: 60, ar: 30, mr: 30 }, desc: '+15 % de armadura y resistencia mágica.',
      mod(st) { st.ar *= 1.15; st.mr *= 1.15; } },

    // ---------------- botas (todos) ----------------
    { id: 'boots', name: 'Botas de Rapidez', en: 'Boots of Swiftness', icon: 'boot', tags: ['all'], boots: true,
      st: { msP: 0.14 }, desc: 'Mucha velocidad de movimiento.' },
    { id: 'berserker', name: 'Grebas de Berserker', en: "Berserker's Greaves", icon: 'boot', tags: ['marksman', 'ad', 'crit'], boots: true,
      st: { asB: 0.35, msP: 0.08 }, desc: 'Velocidad de ataque y de movimiento.' },
    { id: 'tabi', name: 'Botas Ninja', en: 'Plated Steelcaps', icon: 'boot', tags: ['all'], boots: true,
      st: { ar: 25, msP: 0.08 }, desc: 'Armadura y velocidad.' },
    { id: 'merc', name: 'Botas de Mercurio', en: "Mercury's Treads", icon: 'boot', tags: ['all'], boots: true,
      st: { mr: 25, msP: 0.08, tenacity: 0.3 }, desc: 'Resistencia mágica y velocidad.' },
    { id: 'lucid', name: 'Botas de Lucidez Jonia', en: 'Ionian Boots of Lucidity', icon: 'boot', tags: ['all'], boots: true,
      st: { ah: 15, msP: 0.08 }, desc: 'Celeridad y velocidad.' }
  ];
  const BY = {};
  for (const it of LIST) BY[it.id] = it;

  /** Objetos que encajan con un campeón (sus tags). */
  function poolFor(kit) {
    const tags = new Set(kit.tags || []);
    return LIST.filter(it => it.tags.includes('all') || it.tags.some(t => tags.has(t)));
  }

  /** Uno al azar para un campeón (sin repetir y como mucho unas botas). */
  function roll(pl) {
    const have = new Set(pl.items || []);
    const boots = (pl.items || []).some(id => BY[id].boots);
    const pool = poolFor(pl.kitDef).filter(it => !have.has(it.id) && !(boots && it.boots));
    return pool.length ? G.U.pick(pool).id : null;
  }

  /** Texto corto de las estadísticas de un objeto. */
  function statLine(it) {
    const out = [];
    const P = v => Math.round(v * 100) + ' %';
    const S = it.st || {};
    if (S.ad) out.push('+' + S.ad + ' DA');
    if (S.ap) out.push('+' + S.ap + ' PH');
    if (S.hp) out.push('+' + S.hp + ' vida');
    if (S.ar) out.push('+' + S.ar + ' armadura');
    if (S.mr) out.push('+' + S.mr + ' RM');
    if (S.asB) out.push('+' + P(S.asB) + ' vel. ataque');
    if (S.ah) out.push('+' + S.ah + ' celeridad');
    if (S.crit) out.push('+' + P(S.crit) + ' crítico');
    if (S.ls) out.push('+' + P(S.ls) + ' robo de vida');
    if (S.omni) out.push('+' + P(S.omni) + ' omnivamp.');
    if (S.leth) out.push('+' + S.leth + ' letalidad');
    if (S.apen) out.push(P(S.apen) + ' pen. armadura');
    if (S.mpen) out.push(P(S.mpen) + ' pen. mágica');
    if (S.mpenf) out.push('+' + S.mpenf + ' pen. mágica');
    if (S.msP) out.push('+' + P(S.msP) + ' velocidad');
    return out.join(' · ');
  }

  return { LIST, BY, poolFor, roll, statLine, extra };
})();
