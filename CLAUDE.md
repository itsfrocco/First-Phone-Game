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

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=12

Last number sent: `?v=11`. Update this line each time a new link is sent.

Before sending the link, check that the "pages build and deployment" run for the merge commit has
finished (GitHub MCP `actions_list`); a link opened earlier caches the old game for about ten minutes.

Also say one visible thing that tells them they have the new version.
