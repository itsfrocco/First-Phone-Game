const { chromium } = require('playwright');
// Bot playtest. Plays whole levels headlessly at a fixed 60fps and prints one line per run.
//
//   npm i phaser@3.70.0            (anywhere; the CDN is blocked in cloud sessions)
//   PHASER=/path/to/node_modules/phaser/dist/phaser.min.js \
//     node tools/bot-test.js '[[1,1,"dodge"],[2,3,"dodge"],[4,5,"stand"]]'
//
// Each case is [stage, upgradeLevel, mode]. Stages 1-3 are levels, 4 is the saga boss.
// upgradeLevel sets attack speed and blade damage. "dodge" reacts to boss attacks and storm
// waves after 0.3s; "stand" never dodges. The bot is sharper than a person, so treat a
// narrow bot win as "hard" for a real player.
const path = require('path');
const CASES = JSON.parse(process.argv[2]);
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
    for (const [level, up, mode] of CASES) {
      Save.fire = Save.damage = up;
      g.scene.start('Game', { level }); step(); step();
      const sc = g.scene.getScene('Game');
      sc.beginRun(); const total = sc.enemies.length;
      let f = 0, react = 0, prev = 'chase', miss = 0; const at = [], secs = [];
      const fl = sc.float.bind(sc); sc.float = (x, y, str, ...a) => { if (str === 'MISS') miss++; return fl(x, y, str, ...a); };
      let lastBoss = null, ff = 0;
      while (!sc.over && f < 60000) {
        const gate = sc.gates.find(x => !x.used);
        let tx = gate && gate.y > 250 ? (gate.left.good ? 130 : 270) : sc.targetX;
        const spike = sc.spikes.find(o => !o.hit && o.y > sc.formY - 110 && o.y < sc.formY + 40);
        if (spike && Math.abs(spike.x - tx) < 45 && !(gate && gate.y > 430)) tx = spike.x < 200 ? 270 : 130;
        if (sc.charge >= sc.specialMax && sc.slowLeft <= 0) sc.activateSpecial();
        const bo = sc.boss;
        if (sc.fight && bo) {
          if (bo !== lastBoss) { lastBoss = bo; at.push(bo.kind + ':' + sc.count); ff = 0; }
          ff++;
          if (bo.state === 'wind' && prev !== 'wind') react = mode === 'dodge' ? 18 : 9999;      // 0.3s reaction
          prev = bo.state; if (react > 0) react--;
          const reach = bo.power ? bo.prof.powerReach : bo.prof.reach;
          if (bo.state === 'wind' && react === 0) tx = bo.aimX < 200 ? Math.min(322, bo.aimX + reach + 25) : Math.max(78, bo.aimX - reach - 25);
          else if (bo.state !== 'wind') tx = Math.max(78, Math.min(322, bo.x));
          for (const h of sc.hazards) if (Math.abs(tx - h.x) < h.rx + 4) tx = Math.max(78, Math.min(322, bo.x >= h.x ? h.x + h.rx + 8 : h.x - h.rx - 8));
          if (bo.style === 'bolt' && bo.state === 'wind' && react === 0) tx = bo.aimX < 200 ? bo.aimX + 80 : bo.aimX - 80;
        } else if (lastBoss && ff) { secs.push(+(ff / 60).toFixed(0)); ff = 0; }
        if (mode === 'dodge' && sc.wave && Math.abs(tx - sc.wave.x) < 80) tx = sc.wave.x < 200 ? sc.wave.x + 85 : sc.wave.x - 85;
        sc.targetX = tx;
        step(); f++;
      }
      out.push([level, 'up' + up, mode, sc.finaleDone && sc.count > 0 ? 'WIN ' : 'lose', 'left ' + sc.count, Math.round(f / 60) + 's', 'dist ' + Math.round(100 * sc.dist / sc.L.length) + '%', at.join(' '), (lastBoss && lastBoss.phase2 ? 'phase2' : ''), 'fight ' + secs.join('/') + 's', 'souls ' + sc.earned, 'dmg x' + sc.dmgMod.toFixed(2), 'enemies ' + total, 'bar ' + sc.specialMax, miss ? 'MISS x' + miss : ''].join(' | '));
    }
    return out;
  }, CASES);
  runs.forEach(r => console.log(r));
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
