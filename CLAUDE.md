# Notes for Claude

The game is a single file, `samurai-runner.html`, served by GitHub Pages from `main` at
https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html

## After the owner merges a pull request

Always resend the game link with a fresh cache-busting number on the end, one higher than
the last one used, so their phone downloads the new copy:

    https://itsfrocco.github.io/First-Phone-Game/samurai-runner.html?v=8

Last number sent: `?v=7`. Update this line each time a new link is sent.

Also say one visible thing that tells them they have the new version.
