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

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=20

Last number sent: `?v=19`. Update this line each time a new link is sent.

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
| `Save`, `Stats` | localStorage keys (`samurai_*`) and upgrade formulas. The currency is shown as coins but is still called `souls` in the code and the save, so old saves carry over |
| `Sound`, `Music` | Web Audio synth. Music modes: menu (arcade theme), run, boss, storm, stormBoss |
| `Art` | Every texture, drawn with Canvas 2D at device resolution. The only image file is `menu.jpg`, loaded in `BootScene`; its PLAY and SETTINGS buttons are painted in, with invisible touch areas over them in `MenuScene`. `Art.menuBg` and plain buttons are the fallback if it does not load (always the case from `file://`) |
| Scenes | `MenuScene`, `SagaScene`, `SettingsScene`, `GameScene` |

Inside `GameScene`: the pause menu (`setPaused`; music, sound effects and screen shake switches, resume, quit),
the level start screen (upgrade cards, Equipment menu, Store), then per frame
`updateEnemies`, `updateScroll`, `updateArmy`, `updateGates`, `updateCombat`, `updateHazards`
(lucky charms, stone walls, spikes, then `updateBoss`), `updateStorm`, `drawBolts`, `updateHud`.

All big fights (giant zombie, tengu, fat demon, Takemikazuchi, rock oni) share one cycle in `updateBoss`:
chase, wind-up with a warning zone, strike, recover. A profile in `CFG.bosses` sets speeds,
damage, combos, power attacks (`jump`, `fly`, `bolt`, `dash`) and an optional second phase.

Stone walls (`kind: 'wall'`, an entry in `enemies`) stand in front of a few blue gates. Samurai with no
enemy in reach cut at a wall from `CFG.wall.range` away; one still standing when the army reaches it in
that lane ends the run ("CLAN CRUSHED"). Steering to the red gate avoids it. Late in a level the army is
too busy with packs to dent a wall, so walls sit in early and middle rows with modest health.

## Testing

There is no test suite. Use `tools/bot-test.js` (instructions at the top of that file) to play
levels headlessly, check for errors and see where the difficulty lands. Chromium and Playwright
are preinstalled in cloud sessions. Audio cannot be heard there; say so when reporting.

Balance as last tuned (attack speed and blade damage both at the stated level, dodging bot):
level 1 wins with no upgrades; level 2 needs about 2; level 3 about 3; the saga boss about 5.
Saga 2 level 1 (stage 5) is tuned for about 5: the dodging bot wins from 3 up, the bot that never dodges loses at 5.

## Working with the owner

- They play on a phone and are not a programmer. Explain changes in plain words, no code.
- For anything beyond a small tweak they like the request read back before building.
- Enemy and boss ideas usually come with a reference picture: draw an original version in the
  game's style.

## Open ideas

- The Store (button on the level start screen, `showStore`) is an empty "coming soon" panel. What it sells is undecided.

- A necklace for the empty equipment slot (name, effect and how it is earned are undecided).
- Saga 2 (Mountain Pass) has its first level; levels 2 and 3 and its saga boss are not designed yet. Sagas 3 to 5
  are shown locked. Each saga should have three levels and a saga boss, with the same 10% per-level speed step.
  Common enemies should keep scaling up from where the previous saga ended.
- Oni art (`Art.oni`) is kept unused for a later boss.
- Future enemies with elements (water, metal, earth, fire) for the sword's bonuses. The sword
  still does 15% less to earth, fire and thunder foes even though the menu no longer says so. The rock oni
  are deliberately not marked as earth (the owner was asked and did not answer).
