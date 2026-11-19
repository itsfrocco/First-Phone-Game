# Notes for Claude

The game is a single file, `samurai-runner.html`, plus one picture, `menu.jpg` (the owner's own main menu art), served by GitHub Pages from `main` at
https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html

## Shipping a change

The owner opens and merges pull requests themselves, to save usage. When a change is finished,
tested and pushed to the working branch, summarise it and give them:

- the compare link: https://github.com/itsfrocco/First-Phone-Game/compare/main...claude/brave-turing-klqvrh?expand=1 (swap in the current session's branch name)
- the next game link (below), with a reminder to wait a minute or two after merging before opening it.

Only open or merge a pull request yourself if they ask for it in that message.

## After a pull request is merged

Always resend the game link with a fresh cache-busting number on the end, one higher than
the last one used, so their phone downloads the new copy:

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=39

Last number sent: `?v=38`. Update this line each time a new link is sent.

Before sending the link, check that the "pages build and deployment" run for the merge commit has
finished (GitHub MCP `actions_list`); a link opened earlier caches the old game for about ten minutes.

Also say one visible thing that tells them they have the new version.

## How the game is organised

`samurai-runner.html` is about 1,800 lines, in this order. Read only the part you need.

| Section | What is there |
|---|---|
| `CFG` | Every tuning number: enemies, boss profiles (`CFG.bosses`), storm waves, lucky charm, stone wall, sword |
| `LEVEL_SPECS`, `layoutLevel` | Levels are generated from a short spec (rows, pack size and growth, crowding, health, charms, walls, bosses). Stages run in saga order, four per saga (three levels, then the saga boss): stages 1-4 are saga 1, stage 5 is saga 2 level 1. A spec's `theme` picks the scenery (`'mountain'`) and `foe` the common enemy (`'rockOni'`) |
| `GEAR`, `ELEMENT` | Equipment items (weapon, armor, necklace slots) and which enemy kinds are flying, armoured and so on |
| `Save`, `Stats` | localStorage keys (`samurai_*`) and upgrade formulas. Four upgrade cards: attack speed (`fire`), blade damage, range, coin reward (`revenue`). The currency is shown as coins but is still called `souls` in the code and the save, so old saves carry over |
| `Sound`, `Music` | Web Audio synth. Music modes: menu (arcade theme), run, boss, storm, stormBoss |
| `Art` | Every texture, drawn with Canvas 2D at device resolution. The only image file is `menu.jpg`, loaded in `BootScene`; its PLAY and SETTINGS buttons are painted in, with invisible touch areas over them in `MenuScene`. `Art.menuBg` and plain buttons are the fallback if it does not load (always the case from `file://`) |
| Scenes | `MenuScene`, `SagaScene`, `SettingsScene`, `TutorialScene`, `GameScene`, `DefenseScene` (the stronghold) |

Tutorial: `TutorialScene.PAGES` are ten picture pages (steer, gates, fight, red/orange circles, safe lanes, SLOW,
the ultimate, lucky charm, upgrade cards, gear and store) with SKIP on every page. Tapping level 1 opens them while
`Save.tutorial` (`samurai_tutorial`) is false; finishing or skipping sets it and starts level 1 with `tips: true`,
which pauses that run once for each live hint (`updateTips`/`tip`: gate, enemies, ultimate ready, SLOW ready, boss red circle,
orange circle). Saga 1 levels also show "DON'T FORGET TO UPGRADE!" (`remindUpgrade`) once per visit when the player
taps to start without buying anything but could afford a card. HOW TO PLAY above saga 1 on the sagas screen replays the pages (owner wanted it there, not in Settings).

Inside `GameScene`: the pause menu (`setPaused`; music, sound effects and screen shake switches, resume, quit),
the level start screen (upgrade cards, Equipment menu, Store), then per frame
`updateEnemies`, `updateScroll`, `updateArmy`, `updateGates`, `updateCombat`, `updateHazards`
(lucky charms, stone walls, spikes, then `updateBoss`), `updateStorm`, `drawBolts`, `updateHud`.

All big fights (giant zombie, tengu, fat demon, Takemikazuchi, rock oni) share one cycle in `updateBoss`:
chase, wind-up with a warning zone, strike, recover. A profile in `CFG.bosses` sets speeds,
damage, combos, power attacks (`jump`, `fly`, `bolt`, `dash`, `bounce`, and the multi-zone `hands`, `feathers`,
`drums` from `zonesFor`) and an optional second phase. The saga 1 bosses were made tougher at the owner's request
(more health, faster to follow, quicker leaps) and got new attacks: tengu Feather Storm (all lanes but one), fat demon Belly Bounce (three re-aimed slams),
Takemikazuchi Thunder Drums (all lanes but one, twice in phase 2). The giant zombie's Grave Hands (green circles)
was removed: the owner did not like it. Do not bring it back. The rock oni was left as it is (the owner likes it).

Range: each level adds `CFG.rangeStep` to the samurai's reach, up to `CFG.rangeMax`. A foe beyond melee reach
is hit by a wind slash (`windSlash`) that lands on a timer, not on its tween (tweens never finish in the bot's
no-render mode). Walls are cut at when nothing is closer. Slashes do not touch gates; flipping gates was
planned for a flick-up ultimate.

Stone walls (`kind: 'wall'`, an entry in `enemies`) stand in front of a few blue gates, never in saga 1 and only a
few after (the owner's wish; stage 5 has one). Samurai with no enemy in reach cut at a wall from `CFG.wall.range` away.
One still standing when the army reaches it in that lane blocks it ("BLOCKED!"): the run slows to `CFG.wall.pushSlow`
and the wall shoves the army down the screen (`push`, `blockedBy`) until it breaks or the army steers around it; pushed
to `CFG.wall.crushY` the run ends ("CLAN CRUSHED"). An earlier push version was reverted; the owner asked for this one.

Weapon rows (`CFG.weapon`, `L.weapons`, `updateWeapons`, `pickWeapon`): about a third and two thirds into each ordinary level
(never the saga boss stage), once the Range card is at 3 or more, the red gate of that row is swapped for a glowing weapon
behind two obstacles in its lane: logs below Range 6, stone from Range 6. The player picks the blue gate or cuts through
to the weapon. The obstacles are `kind: 'wall'` entries (`weaponWall`, `mat`), so they block and push like stone walls,
but their health is recalculated every frame until the army can reach them, from the army's damage, swing speed, size
(up to 20 drawn) and the enemies arriving at the same time, so a small army gets weaker obstacles (owner's wish: always
beatable). Walking into the weapon with an obstacle still standing gives "MISSED". A pickup gives one random boost for that
run, and boosts add up: SHARP BLADE +20% damage, SWIFT BLADE 15% faster swings, LONG REACH +5 Range levels (owner chose
these sizes). Bot mode "weapon" (e.g. "dodge weapon") takes the weapon side and cuts through; in testing the obstacles
always broke before reaching the army, and taking the weapon instead of the blue gate costs some men but rarely decides a run.
Owner's follow-up: no weapon rows in level 1 (stage 1), saga 1 is always logs (stone only from saga 2 with Range 6), and the
obstacles were made about 50% tougher (`margin` 0.5 / 0.55, was 0.33 / 0.38): they now sometimes block the army for a moment
before breaking, but the bot was never crushed and still collected the weapons.
Then (owner: still too easy, wants more of them): `margin` 0.8 / 0.85, so they usually last until the army is right on them
and often block for a moment (bot still never crushed). Log rows (`L.logs`, `logRow`): two more rows a level, about half and
five sixths in, put one or two of the same obstacles in front of the blue gate with the red gate beside it ("LOGS AHEAD");
same Range 3 rule, same health sums, none in level 1. The owner does not want obstacles all the time.
Level 1 was shortened to 9 rows (owner: a tiny bit too long). The upgrade reminder shows on saga 1 levels 1-3 only.
Then (owner: level 3's obstacles all came at the crowded end): rows are spread evenly and kept out of the last quarter. Saga 1
levels have a weapon row about 30% and 70% in and one log row at half way; later sagas have two of each (20/38/58/80%).
Level 3's giant and fat demon lost 10% health (2070 and 3420).

The split path (`CFG.split`, `L.split`, `buildSplit`, `updateSplit`), once per ordinary level from level 2 on, with no Range
requirement (owner): the later weapon row is replaced by a stretch with no gates where a palisade fence runs down the
middle of the road. One side has four or five logs in a row (stone in saga 2+ with Range 6; health follows the army as for
weapon rows, `margin` 0.95) and a steel cage at the end: reaching it with the logs broken snaps the lock, ten civilians
run back down the road, `Save.civilians` goes up by 10 and the clan gets a random weapon boost. The other side has that
row's enemies only (`pack` 0.4 of the usual number, as there is no gate to make up losses; no gates, owner's wish). The
army is held to its side while beside the fence (`splitSide`, `steerClamp`), the pack keeps to its side and runs straight
past if the army took the logs, and blades do not reach across. The next gate row is `extra` further on so either gate
can still be reached. Bot mode "split" takes the log side. Both sides win at the usual upgrade levels.

The ultimate, Dragon Slash (`CFG.ult`, `activateUlt`, `updateUlt`): the owner asked for a flick-up ultimate with its own bar
beside the SPECIAL bar and left the design to us. A gold ULTIMATE bar sits just above the SPECIAL bar and fills with kills
(`ultMax` is the level's enemy count / `perLevel` 2.3, a boss kill gives a fifth; its own kills do not refill it). When full, a quick upward flick
anywhere (`flickPx` in `flickMs`, mostly vertical) sends a golden crescent wave up the whole screen from the army: every
ordinary enemy on screen dies, walls, logs and lucky charms break, a boss loses `bossShare` (12%) of full health (nothing if he is
in the air or powering up). It sits alongside SLOW, not instead of it. Gates are not touched. In testing the bot ("ult" in the mode)
used it once a run with the bar a third to half full again by the end, and it was worth about one upgrade level (level 2 wins at 1
instead of 2). Cloud test browsers are too slow for a real flick to register in time; raise `CFG.ult.flickMs` in the test or call `activateUlt`.

Owner's follow-up (after playing the ultimate):
- Ultimate bar fills 10% faster (`perLevel` 2.55), and Dragon Slash now breaks only the two nearest obstacles (`CFG.ult.walls`,
  those in the army's lane first), not every one on screen. It still kills every ordinary enemy.
- Cage reward (`offerUpgrade`, `freePick`): freeing the civilians pauses the run and offers one FREE, permanent level of any of the
  four upgrade cards. It replaces the random weapon boost the cage used to give. The owner chose always permanent, knowing a level
  can be replayed for more.
- Obstacles "tough but fair" with a scare: `margin` is now above 1 (weapon and log rows 1.4 / 1.45, split logs 1.25, stage 5's
  stone wall 120 health), so they are meant to reach the army still standing and shove it. While blocked the run goes at half speed
  (`pushSlow` 0.5, owner's number) and `drawCrush` shows a toothed red death line at the bottom, a reddening screen, "BREAK IT OR
  BE CRUSHED!" and a quickening alarm. The bot cutting straight through (wall, weapon and split modes) was pushed a quarter to
  half of the way to the line (up to 67 of 116px) and never crushed; a real player cuts less well, so do not raise these without testing.
  The bot output shows `pushed n/116`; it takes Blade Damage at the free upgrade and then resets it.

The stronghold defence (`DefenseScene`, `CFG.fort`, `Save.forts` / `samurai_forts`), inspired by an ad the owner liked (crowds
pouring down a lane at shooters): a second play style once per saga, required, played after the saga boss. Stage numbers were
not changed; saga 2 is locked until `Save.forts >= 1`, so players who had already reached saga 2 must defend first (owner: it
cannot be skipped). Saga 1's is a wooden compound in the grasslands; the owner wants each later saga's fort to suit its terrain.
Owner's follow-up after playing it: make it look like the ad. No grass (the whole screen is the compound's stone yard, `Art.yard`),
and three lanes split by low walls (`laneL`, `laneR`): the MIDDLE is for the enemies, the LEFT and RIGHT for upgrades.
Archers (in up to two ranks of `perRow`) follow the finger and fire straight up on their own, so where they stand picks the lane;
arrows hit the first thing in their column. 3 archers plus one per two Range levels to start, at most 14. Attack Speed sets the
firing rate (`fireMul`), Blade Damage the arrow damage. Left lane: a blue "+1" box every few seconds, +1 archer each, each one
opened making later boxes tougher (`box.grow`). Right lane: slow gold chests with a health number and a prize in a fixed order
(`chest.prizes`: fire arrows that pierce, +3 archers, gate repair, sharp arrows +25%). Boxes and chests that reach the wall are lost;
the ultimate does not open them. Twelve timed waves (about 3.5 minutes; owner wanted it long) of zombies and demons in a dense
crowd, brutes (`Art.oni`, health number overhead) in the ranks from wave 3, a helmeted warlord in the final wave. Enemies that
reach the wall strike the gate (150 health); at 0 the stage is lost. SLOW works as in the run; the ultimate here is Arrow Storm
(kills ordinary enemies, brutes lose 35%, the warlord 12%). Upgrade cards are on its start screen. Kills pay half the usual
coins (`coinShare`, there are a lot of them); holding it pays 300 more the first time, 100 after (about 800 in all on a first win).
Then (owner: far too slow and boring, common enemies should be about 3 times faster, wants strategy): everything is faster
(zombies 118, demons 150, brutes 52, the warlord 24; waves 8-12s apart; the whole defence about 2.5 minutes), enemies are weaker
and more numerous, and archers fire twice as often for half the damage (`fireMul` 0.8, `arrowDmg` 0.5). Start with 4 archers.
Logs (`kinds.log`, `CFG.fort.log`): each side-lane delivery is a log with the prizes behind it (left: a log then two +1 boxes
every 9.5s; right: a log then the chest), and arrows hit the log first. The main gate (`CFG.fort.door`, `buildDoor`, `roadAt`,
`shutLeaf`, `hitDoor`), the owner's idea: two door leaves stand open at the edges of the middle road half way up, the enemy
funnelling between them. Each leaf has a health number; shot to 0 it swings shut (one shut narrows the road to the other half).
Both shut closes the road: enemies pile up behind it and must break `barHp` (900) before going on, arrows still fly over, and
once broken it stays down. The owner said "10,000 hp" for scale; the real numbers are sized to arrow damage (250 a leaf).
Gate (the wall) health is 200. Kills pay `coinShare` 0.4; a first win is about 750 coins in all.
`tools/fort-test.js` plays it: cases are [speed/damage level, Range level, mode]; "door" in the mode shuts the main gate when
nothing is close, otherwise the bot works the side lanes.
Then (owner: doors far too easy, and the left lane dried up; wanted "a bunch" of new things there): each door leaf has 1500
health (owner's number; shutting both is now a long job, though stray arrows over a whole defence often shut them late on).
The +1 boxes are gone (they stopped at 14 archers and each was 45% tougher than the last). The left lane (`CFG.fort.left`,
labelled SUPPLIES) now delivers every 8.5s for the whole fight, in the order banner, "?" box, banner, barrel:
- Recruit banner (`banner`, `raiseBanner`, `recruit`): shows +1, cannot be broken; every `hp` of arrow damage adds one, up to +4,
  and the wall collects whatever it shows. Each archer recruited makes the next step 12% dearer. With 14 archers its turn is a "?" box.
- "?" box behind a log (`mystery`): a random short boost: RAPID FIRE, TWIN ARROWS (two a shot), FROZEN (the road stands still 2.5s) or 30 coins.
- Powder barrel (`barrel`, `updateBlasts`): shot open, it rolls to the middle of the road at its own height and blows up; ordinary
  enemies in the blast die, brutes lose 40%, the warlord 8%. So the player waits for the crowd to be level with it.
An idea offered and not built: boxes that build a ballista on the wall. As tuned: 3 loses at wave 8, 4 at wave 11, 5 wins or
loses in the final wave, 6 and up win. The bot shoots barrels as soon as it can, so a player timing them does better.
Then (owner: too long): ten waves instead of twelve, each about 15% more crowded, and the warlord has 220 health (was 180).
Prizes must be caught (owner): a broken chest or "?" box drops its prize, which falls to the wall (`CFG.fort.drop`, `dropPrize`,
`updateDrops`, `grant`); the archers must be under it when it lands or it is "MISSED". The banner and barrel are unchanged.
The bot goes for a falling prize unless an enemy is close to the wall. As tuned: 4 loses at waves 7-9, 5 and up win.

## Testing

There is no test suite. Use `tools/bot-test.js` (instructions at the top of that file) to play
levels headlessly, check for errors and see where the difficulty lands. Chromium and Playwright
are preinstalled in cloud sessions. Audio cannot be heard there; say so when reporting.

Balance as last tuned (attack speed and blade damage both at the stated level, dodging bot):
level 1 wins with no upgrades; level 2 needs about 2; level 3 about 3-4 (3 wins or loses to the mid giant); the saga
boss about 5-6 (5 wins about half the time, 6 wins). Bot mode "dodge wall" walks into stone walls.
Owner's later trims: levels 2 and 3 have 20% fewer enemies, the run scrolls 10% slower (`CFG.baseSpeed` 81),
coins per kill are 1.25 plus 0.75 per Coin Reward level (was 1.5 per level). Then: scroll +3% (`baseSpeed` 83),
levels 2 and 3 shortened to 12 and 16 rows, Takemikazuchi 3500 health, the level 1 and level 2 giant zombies 600 and 720 with a slower three-swing combo
(`comboWindMs` 600), the fat demon 10% slower in movement and attacks, storm waves every 4.6-5.8s to make up for
the slower run. The saga boss stage is swingy for the bot (it arrives with 1-57 men); arriving healthy it wins at 5-6.
Saga 2 level 1 (stage 5) is tuned for about 5: the dodging bot wins from 3 up, the bot that never dodges loses at 5.
Saga 2 level 2 (stage 6, "The Iwagame", 15 rows): a spec's `mix` (`['iwagame', 0.25, 1.5]`, `pickFoe`) mixes a second
common foe into the packs, a quarter of them, with 1.5 times the health. The Iwagame ("rock turtle"; drawn from the owner's picture of a
mossy rock turtle brute: `Art.iwagame`, `Art.iwagameBall`; the owner was happy for it not to be called an oni) walks a little faster than
the rock oni and every 4.5-7s rolls (`CFG.enemy.iwagame.roll`, `shellRoll`): it tucks into its shell, glows orange for 0.6s with a streak
showing its aim, then rolls fast at where the army stood; a roll that reaches a samurai takes one man and stops there. Two men a roll every
3-5s wiped small early armies, so it was eased. The bot does not dodge rolls.
Its boss, the Koke Oni ("moss oni", `CFG.bosses.koke`, `Art.kokeBoss`, from the owner's picture of a mossy stone oni with a club; owner:
"pretty cool, nothing too crazy", the fancy moves are saved for saga 2 level 3's boss): two-swing club combos, the leaping ground-pound,
and Rockslide (`zonesFor('rockslide')`: boulders down every lane but one), with Iwagame and rock oni trickling in. 6200 health, no second
phase. With him in, the level was cut to 15 rows: the 16th row's pack (over 100) arrived with him and wiped the army. As tuned: 5 loses,
6 wins about two times in three, 7 and up win.
Saga 2 level 3 (stage 7, "Genbu", 15 rows): a third of the pack are Iwagame, the Koke Oni comes back as a mid fight (3600 health, after
row 7), and Genbu ends it (`CFG.bosses.genbu`, `Art.genbu`, `Art.genbuBall`; from the owner's picture of a four-armed rock turtle with lava
cracks; Genbu is the black tortoise of Japanese myth, the owner agreed). 9000 health. Front-claw combos (two, three in phase 2); Boulder
Barrage (`startBarrage`, `updateBarrage`): the back arms throw 4 rocks (5 in phase 2), each falling on a shadow aimed at the army when
thrown, drawn above the soldiers (`rockG`) or they hide it; Shell Roll (`bossRoll`): tucks in with an orange lane showing, rolls down
through the army and back. Phase 2 at half health ("THE MOUNTAIN BURNS", `lava: true`: embers instead of lightning in `powerUp` and
`updateLightning`): faster, and each rock leaves a lava pool for 1.8s (`hazards` with `lava`, `every`, `share`). The owner was promised
Iwagame trickling in, but during a fight the samurai always strike the boss, so helpers chip away unopposed and made him unwinnable;
he fights alone (the field clears when the fight starts). The bot dodges the barrage and roll. As tuned: 6 loses (once won), 7 wins,
the bot that never dodges loses at 7. The sagas screen now says "level n of 3" and "levels cleared · saga boss coming soon" for saga 2.
Range is an extra, optional card: spending coins on it helps about as much as the same coins on speed and
damage (level 3: speed/damage 2 loses, adding Range 5 wins). Range grows 1m (9px) a level and has its own cheaper
cost curve. Ranged swings take `CFG.rangedSwing` (1.5) times a normal swing: the owner does not want early
players to progress fast. At 1.5 the bot at level 3 with speed/damage 2 wins or loses narrowly with Range 5-10
(Range is a modest help, never a shortcut); at 2 it never helped, so the card was a waste of coins.

## Working with the owner

- They play on a phone and are not a programmer. Explain changes in plain words, no code.
- For anything beyond a small tweak they like the request read back before building.
- Enemy and boss ideas usually come with a reference picture: draw an original version in the
  game's style. Save every picture they send into `art-reference/` (named `sagaN-<name>`), commit it
  with the work, and tell them it is saved. Pictures from earlier sessions can be recovered with
  `list_events` (kinds `user`) on that session: user-sent images are base64 blocks outside tool results.
  The game never loads these files. Saved so far: Saga 1's common demon (purple), goblin (small green,
  horned), Takemikazuchi (saga boss); Saga 2's common rock oni (skinny grey), Rock Oni mini boss (big grey
  with club, stage 5's boss), Iwagame, Koke Oni and Genbu.

## Plan: App Store release with in-app purchases

The owner wants the game free to download on the App Store (Android too, ideally) with in-app purchases:
gems as a premium currency for upgrades, weapon upgrades and similar. Advice already given to them, in order:

1. Finish more content first (all of saga 2, ideally saga 3); purchases only pay if players stay.
2. Build gems and the Store in the web game with pretend purchases, so prices and balance can be tried on
   the phone before any money is spent. Read the shop plan back to them first.
3. Their part: Apple Developer account ($99/year; Google Play $25 once), apply to Apple's Small Business
   Program (15% cut instead of 30%), and in App Store Connect accept the Paid Apps agreement, add banking
   and a tax form. Purchases do not appear until that is done.
4. Our part: wrap the game with Capacitor, add real purchases (Apple's system is required for digital
   goods; RevenueCat suggested), a Restore Purchases button (required for one-time buys), cloud saving
   (progress is only in localStorage now, so gems would be lost on deleting the app and are easy to cheat),
   and a privacy policy page (required; could live on GitHub Pages).
5. Build on a Mac with Xcode or a paid cloud build service, test with sandbox accounts and TestFlight, submit.

Design advice: coins earned by play plus gems that are mostly bought but sometimes earned (daily rewards,
bosses); keep the game beatable free, just slower; good sellers are a cheap one-time starter pack, cosmetic
skins, rewarded ads (revive, double coins), remove ads, and gems that skip grinding. Random prize boxes
must show their odds (Apple rule). Suggest a tax adviser once money comes in.

The owner has a Mac with Xcode, so step 5 is done there, with step-by-step instructions from us.
Still waiting on the owner: what the shop should sell.

## Open ideas

- Rewards for civilians saved (100, 200, 300 and so on): the owner will design them later. The total is already kept
  (`Save.civilians`, `samurai_civilians`) and shown on the sagas screen.

- Strongholds for later sagas (a mountain fort for saga 2 and so on), each after that saga's boss, with that saga's enemies.
- More ultimates: the owner called Dragon Slash "the first ultimate", so expect others to choose between later.
  An idea not built: the wave flipping a red gate it passes.
- Control discussed with the owner, not built yet: flick down for a guard stance (crossed blades or planted wooden
  *tate* shields; blocks boss hits, lightning, spikes, on a recharge).

- The Store (button on the level start screen, `showStore`) is an empty "coming soon" panel. What it sells is undecided.

- A necklace for the empty equipment slot (name, effect and how it is earned are undecided).
- Saga 2 (Mountain Pass) has all three levels (bosses: Rock Oni, Koke Oni, Genbu); its saga boss and stronghold are not designed yet. Sagas 3 to 5
  are shown locked. Each saga should have three levels and a saga boss, with the same 10% per-level speed step.
  Common enemies should keep scaling up from where the previous saga ended.
- Oni art (`Art.oni`) is kept unused for a later boss.
- Future enemies with elements (water, metal, earth, fire) for the sword's bonuses. The sword
  still does 15% less to earth, fire and thunder foes even though the menu no longer says so. The rock oni
  are deliberately not marked as earth (the owner was asked and did not answer).
