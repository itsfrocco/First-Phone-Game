# Notes for Claude

The game is a single file, `samurai-runner.html`, served by GitHub Pages from `main` at
https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html

## Shipping a change

The owner opens and merges pull requests themselves, to save usage. When a change is finished,
tested and pushed to the working branch, summarise it and give them:

- the compare link: https://github.com/itsfrocco/First-Phone-Game/compare/main...claude/samurai-game-remaster-oaaaom?expand=1
- the next game link (below), with a reminder to wait a minute or two after merging before opening it.

Only open or merge a pull request yourself if they ask for it in that message.

## After a pull request is merged

Always resend the game link with a fresh cache-busting number on the end, one higher than
the last one used, so their phone downloads the new copy:

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=18

Last number sent: `?v=17`. Update this line each time a new link is sent.

Before sending the link, check that the "pages build and deployment" run for the merge commit has
finished (GitHub MCP `actions_list`); a link opened earlier caches the old game for about ten minutes.

Also say one visible thing that tells them they have the new version.

## How the game is organised

`samurai-runner.html` is about 1,800 lines, in this order. Read only the part you need.

| Section | What is there |
|---|---|
| `CFG` | Every tuning number: enemies, boss profiles (`CFG.bosses`), storm waves, lucky charm, sword |
| `LEVEL_SPECS`, `layoutLevel` | Levels are generated from a short spec (rows, pack size and growth, crowding, health, charms, bosses). Stage 4 is the saga boss |
| `GEAR`, `ELEMENT` | Equipment items (weapon, armor, necklace slots) and which enemy kinds are flying, armoured and so on |
| `Save`, `Stats` | localStorage keys (`samurai_*`) and upgrade formulas |
| `Sound`, `Music` | Web Audio synth. Music modes: menu, run, boss, storm, stormBoss |
| `Art` | Every texture, drawn with Canvas 2D at device resolution. No image files |
| Scenes | `MenuScene`, `SagaScene`, `SettingsScene`, `GameScene` |

Inside `GameScene`: the level start screen (upgrade cards, Equipment menu), then per frame
`updateEnemies`, `updateScroll`, `updateArmy`, `updateGates`, `updateCombat`, `updateHazards`
(lucky charms, spikes, then `updateBoss`), `updateStorm`, `drawBolts`, `updateHud`.

All big fights (giant zombie, tengu, fat demon, Takemikazuchi) share one cycle in `updateBoss`:
chase, wind-up with a warning zone, strike, recover. A profile in `CFG.bosses` sets speeds,
damage, combos, power attacks (`jump`, `fly`, `bolt`, `dash`) and an optional second phase.

## Testing

There is no test suite. Use `tools/bot-test.js` (instructions at the top of that file) to play
levels headlessly, check for errors and see where the difficulty lands. Chromium and Playwright
are preinstalled in cloud sessions. Audio cannot be heard there; say so when reporting.

Balance as last tuned (attack speed and blade damage both at the stated level, dodging bot):
level 1 wins with no upgrades; level 2 needs about 2; level 3 about 3; the saga boss about 5.

## Working with the owner

- They play on a phone and are not a programmer. Explain changes in plain words, no code.
- For anything beyond a small tweak they like the request read back before building.
- Enemy and boss ideas usually come with a reference picture: draw an original version in the
  game's style.

## Open ideas

- A necklace for the empty equipment slot (name, effect and how it is earned are undecided).
- Sagas 2 to 5 are shown locked. Each should have three levels and a saga boss, with the same
  10% per-level speed step.
- Oni art (`Art.oni`) is kept unused for a later boss.
- Future enemies with elements (water, metal, earth, fire) for the sword's bonuses. The sword
  still does 15% less to earth, fire and thunder foes even though the menu no longer says so.
