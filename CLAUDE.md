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

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=29

Last number sent: `?v=28`. Update this line each time a new link is sent.

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
| Scenes | `MenuScene`, `SagaScene`, `SettingsScene`, `TutorialScene`, `GameScene` |

Tutorial: `TutorialScene.PAGES` are nine picture pages (steer, gates, fight, red/orange circles, safe lanes, SLOW,
lucky charm, upgrade cards, gear and store) with SKIP on every page. Tapping level 1 opens them while
`Save.tutorial` (`samurai_tutorial`) is false; finishing or skipping sets it and starts level 1 with `tips: true`,
which pauses that run once for each live hint (`updateTips`/`tip`: gate, enemies, SLOW ready, boss red circle,
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
Range is an extra, optional card: spending coins on it helps about as much as the same coins on speed and
damage (level 3: speed/damage 2 loses, adding Range 5 wins). Range grows 1m (9px) a level and has its own cheaper
cost curve. Ranged swings take `CFG.rangedSwing` (1.5) times a normal swing: the owner does not want early
players to progress fast. At 1.5 the bot at level 3 with speed/damage 2 wins or loses narrowly with Range 5-10
(Range is a modest help, never a shortcut); at 2 it never helped, so the card was a waste of coins.

## Working with the owner

- They play on a phone and are not a programmer. Explain changes in plain words, no code.
- For anything beyond a small tweak they like the request read back before building.
- Enemy and boss ideas usually come with a reference picture: draw an original version in the
  game's style.

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

- Split path, asked for by the owner, read back to them, not built yet: once a level a wall runs down the middle of the road
  for a stretch. One side has four or five logs in a row with a weapon at the end, the other the usual enemies.

- Controls discussed with the owner, not built yet: flick up for an ultimate (a meter filled by kills; a full-width
  wind wave that breaks walls, cuts the front enemies, flips a gate it hits higher, hurts bosses) and later flick
  down for a guard stance (crossed blades or planted wooden *tate* shields; blocks boss hits, lightning, spikes,
  on a recharge). The game already has a SLOW special button with its own kill-filled bar; decide with the owner
  whether the ultimate replaces it.

- The Store (button on the level start screen, `showStore`) is an empty "coming soon" panel. What it sells is undecided.

- A necklace for the empty equipment slot (name, effect and how it is earned are undecided).
- Saga 2 (Mountain Pass) has its first level; levels 2 and 3 and its saga boss are not designed yet. Sagas 3 to 5
  are shown locked. Each saga should have three levels and a saga boss, with the same 10% per-level speed step.
  Common enemies should keep scaling up from where the previous saga ended.
- Oni art (`Art.oni`) is kept unused for a later boss.
- Future enemies with elements (water, metal, earth, fire) for the sword's bonuses. The sword
  still does 15% less to earth, fire and thunder foes even though the menu no longer says so. The rock oni
  are deliberately not marked as earth (the owner was asked and did not answer).
