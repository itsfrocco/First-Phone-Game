const { chromium } = require('playwright');
// Bot playtest. Plays whole levels headlessly at a fixed 60fps and prints one line per run.
//
//   npm i phaser@3.70.0            (anywhere; the CDN is blocked in cloud sessions)
//   PHASER=/path/to/node_modules/phaser/dist/phaser.min.js \
//     node tools/bot-test.js '[[1,1,"dodge"],[2,3,"dodge"],[4,5,"stand"]]'
//
// Each case is [stage, upgradeLevel, mode]. Stages 1-3 are levels, 4 is the saga boss, 5 is saga 2 level 1.
// upgradeLevel sets attack speed and blade damage; an optional 4th entry sets Range. "dodge" reacts to boss attacks and storm
// waves after 0.3s; "stand" never dodges. Add "wall" to the mode (e.g. "dodge wall") to walk into stone walls. The bot is sharper than a person, so treat a
// narrow bot win as "hard" for a real player.
const path = require('path');
const CASES = JSON.parse(process.argv[2]);   // an optional 4th entry sets the Range level (default 1)
const PHASER = process.env.PHASER;
const GAME = 'file://' + path.resolve(__dirname, '..', 'samurai-runner.html');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 400, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await pg.route('**/phaser.min.js', r => r.fulfill({path: PHASER, contentType:'text/javascript'}));
  await pg.goto(GAME);
  await pg.waitForFunction(() => window.samuraiGame && samuraiGame.scene.isActive('Menu'));
  const runs = await pg.evaluate((CASES) => {
    const g = samuraiGame; g.loop.sleep(); g.renderer.render = () => {}; g.renderer.preRender = () => {}; g.renderer.postRender = () => {};
    let t = performance.now(); const step = () => { t += 16.667; g.step(t, 16.667); };
    const out = [];
    for (const [level, up, mode, range] of CASES) {
      Save.fire = Save.damage = up; Save.range = range || 1;
      g.scene.start('Game', { level }); step(); step();
      const sc = g.scene.getScene('Game');
      sc.beginRun(); const total = sc.enemies.length;
      let f = 0, react = 0, prevT = 0, prev = 'chase', miss = 0; const at = [], secs = [];
      const fl = sc.float.bind(sc); sc.float = (x, y, str, ...a) => { if (str === 'MISS') miss++; return fl(x, y, str, ...a); };
      let lastBoss = null, ff = 0; const walls = [], wallsUp = [];
      while (!sc.over && f < 60000) {
        const gate = sc.gates.find(x => !x.used);
        let tx = gate && gate.y > 250 ? (gate.left.good ? 130 : 270) : sc.targetX;
        // A stone wall still standing this close: give up on the blue gate and go around.
        const wall = sc.enemies.find(e => e.kind === 'wall' && !e.gone && e.hp > 0 && !e.passed && e.y < sc.formY);
        if (wall && !wall.seenAt && wall.y > sc.formY - 200) wall.seenAt = sc.count;
        if (wall && wall.y > sc.formY - 70 && !mode.includes('wall')) { tx = wall.x < 200 ? 270 : 130; if (!wall.bailed) { wall.bailed = true; walls.push('AROUND(' + wall.seenAt + ' men, ' + Math.ceil(wall.hp) + '/' + wall.maxHp + ' left)'); } }
        sc.enemies.forEach(e => { if (e.kind === 'wall' && !e.logged && e.y > sc.formY - 200) { e.logged = true; wallsUp.push(e); } });
        for (const e of wallsUp.splice(0)) { if (e.gone && e.hp <= 0) walls.push('broke@' + Math.round(sc.formY - e.y) + 'px(' + e.seenAt + ' men)'); else if (!e.passed && !e.gone) wallsUp.push(e); }
        const spike = sc.spikes.find(o => !o.hit && o.y > sc.formY - 110 && o.y < sc.formY + 40);
        if (spike && Math.abs(spike.x - tx) < 45 && !(gate && gate.y > 430) && !(wall && wall.y > sc.formY - 70)) tx = spike.x < 200 ? 270 : 130;
        if (sc.charge >= sc.specialMax && sc.slowLeft <= 0) sc.activateSpecial();
        const bo = sc.boss;
        if (sc.fight && bo) {
          if (bo !== lastBoss) { lastBoss = bo; at.push(bo.kind + ':' + sc.count); ff = 0; }
          ff++;
          if (bo.state === 'wind' && (prev !== 'wind' || bo.t > prevT)) react = mode.startsWith('dodge') ? 18 : 9999;      // 0.3s reaction, again for each bounce or drum roll
          prev = bo.state; prevT = bo.t; if (react > 0) react--;
          const reach = bo.power ? bo.prof.powerReach : bo.prof.reach;
          if (bo.state === 'wind' && react === 0) tx = bo.aimX < 200 ? Math.min(322, bo.aimX + reach + 25) : Math.max(78, bo.aimX - reach - 25);
          else if (bo.state !== 'wind') tx = Math.max(78, Math.min(322, bo.x));
          for (const h of sc.hazards) if (Math.abs(tx - h.x) < h.rx + 4) tx = Math.max(78, Math.min(322, bo.x >= h.x ? h.x + h.rx + 8 : h.x - h.rx - 8));
          if (bo.style === 'bolt' && bo.state === 'wind' && react === 0) tx = bo.aimX < 200 ? bo.aimX + 80 : bo.aimX - 80;
          if (bo.zones && bo.state === 'wind' && react === 0) {       // several marked places: the nearest spot clear of all of them
            let bestX = tx, bestD = 1e9;
            for (let x = 78; x <= 322; x += 2) {
              if (bo.zones.some(z => Math.abs(x - z.x) < z.half + 6)) continue;
              if (Math.abs(x - sc.armyX) < bestD) { bestD = Math.abs(x - sc.armyX); bestX = x; }
            }
            tx = bestX;
          }
        } else if (lastBoss && ff) { secs.push(+(ff / 60).toFixed(0)); ff = 0; }
        if (mode.startsWith('dodge') && sc.wave && Math.abs(tx - sc.wave.x) < 80) tx = sc.wave.x < 200 ? sc.wave.x + 85 : sc.wave.x - 85;
        sc.targetX = tx;
        step(); f++;
      }
      out.push([level, 'up' + up + (range ? '+R' + range : ''), mode, sc.finaleDone && sc.count > 0 ? 'WIN ' : 'lose', 'left ' + sc.count, Math.round(f / 60) + 's', 'dist ' + Math.round(100 * sc.dist / sc.L.length) + '%', at.join(' '), (lastBoss && lastBoss.phase2 ? 'phase2' : ''), 'fight ' + secs.join('/') + 's', 'souls ' + sc.earned, 'dmg x' + sc.dmgMod.toFixed(2), 'enemies ' + total, 'bar ' + sc.specialMax, miss ? 'MISS x' + miss : '', 'walls ' + walls.join(' '), sc.crushed ? 'CRUSHED' : ''].join(' | '));
    }
    return out;
  }, CASES);
  runs.forEach(r => console.log(r));
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
