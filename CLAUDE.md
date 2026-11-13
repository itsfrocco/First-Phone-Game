# Notes for Claude

The game is a single file, `samurai-runner.html`, served by GitHub Pages from `main` at
https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html

## Shipping a change

The owner does not want to open or merge pull requests themselves. When a change is finished,
tested and pushed to the working branch:

1. Summarise what changed and ask: "Ready for me to put this live?"
2. Only after they say yes, open the pull request and merge it yourself.
3. Then follow the steps below.

Never merge without that yes, even if they approved an earlier change.

## After a pull request is merged

Always resend the game link with a fresh cache-busting number on the end, one higher than
the last one used, so their phone downloads the new copy:

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=11

Last number sent: `?v=10`. Update this line each time a new link is sent.

Before sending the link, check that the "pages build and deployment" run for the merge commit has
finished (GitHub MCP `actions_list`); a link opened earlier caches the old game for about ten minutes.

Also say one visible thing that tells them they have the new version.
