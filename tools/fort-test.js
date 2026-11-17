const { chromium } = require('playwright');
// Bot playtest for the stronghold defence. Same set-up as bot-test.js:
//   PHASER=/path/to/phaser.min.js node tools/fort-test.js '[[5,3,"ult"],[6,5,""]]'
// Each case is [upgradeLevel (attack speed and blade damage), Range level, mode]. The bot aims at the enemy nearest the wall
// (a chest or box in the side lanes while no enemy is past the middle of the road; "greedy" stays on the sides longer), uses SLOW when ready and, with "ult" in the mode, the ultimate.
const path = require('path');
const CASES = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 400, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.route('**/phaser.min.js', r => r.fulfill({ path: process.env.PHASER, contentType: 'text/javascript' }));
  await pg.goto('file://' + path.resolve(__dirname, '..', 'samurai-runner.html'));
  await pg.waitForFunction(() => window.samuraiGame && samuraiGame.scene.isActive('Menu'));
  const runs = await pg.evaluate((CASES) => {
    const g = samuraiGame; g.loop.sleep(); g.renderer.render = () => {}; g.renderer.preRender = () => {}; g.renderer.postRender = () => {};
    let t = performance.now(); const step = () => { t += 16.667; g.step(t, 16.667); };
    const out = [];
    for (const [up, range, mode] of CASES) {
      Save.fire = Save.damage = up; Save.range = range; Save.forts = 0;
      g.scene.start('Defense', { saga: 0 }); step(); step();
      const sc = g.scene.getScene('Defense');
      sc.beginRun();
      let f = 0, low = 999, lastW = 0; const gates = [];
      while (!sc.over && f < 40000) {
        const foes = sc.enemies.filter(e => !e.gone && e.y > 0);
        const near = foes.filter(e => !e.K.crate).sort((a, b) => b.y - a.y)[0];
        const side = foes.filter(e => e.K.crate && e.y > 60).sort((a, b) => (a.kind === 'chest' ? 0 : 1) - (b.kind === 'chest' ? 0 : 1) || b.y - a.y)[0];
        const pick = near && near.y > (mode.includes('greedy') ? 430 : 300) ? near : side || near;      // the middle first once it is close; otherwise the side lanes
        if (pick) sc.targetX = pick.x;
        if (sc.charge >= sc.specialMax && foes.some(e => e.y > 420)) sc.activateSpecial();
        if (mode.includes('ult') && (foes.filter(e => e.y > 150).length >= 10 || foes.some(e => e.K.big && e.y > 380))) sc.activateUlt();
        low = Math.min(low, sc.gate); if (sc.waveNo !== lastW) { lastW = sc.waveNo; gates.push(Math.ceil(sc.gate)); }
        step(); f++;
      }
      out.push(['up' + up + ' R' + range, mode, sc.won ? 'WIN ' : 'lose', 'gate ' + Math.ceil(sc.gate) + ' (lowest ' + Math.ceil(low) + ')', 'wave ' + sc.waveNo, Math.round(f / 60) + 's', 'archers ' + sc.archers.length, 'ult ' + sc.ultUsed, 'coins ' + sc.earned, 'gate at each wave ' + gates.join(',')].join(' | '));
    }
    return out;
  }, CASES);
  runs.forEach(r => console.log(r));
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
