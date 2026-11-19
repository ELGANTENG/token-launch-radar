# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/ELGANTENG/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/ELGANTENG/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Launch Radar ranks pre-token DefiLlama protocols by implied launch value and shows how to farm them. It reads a sealed snapshot of every protocol DefiLlama tracks, works out which ones still record no token and are not a wrapped or staked product of one that trades, and ranks them by what their launch would be worth. The model (radar-2-shrunk) derives its implied value from the snapshot's own figures: TVL, 7-day growth, how long the protocol has run with no token, and a category FDV/TVL multiple shrunk toward the overall median when the category has few tokenized samples. The board covers 183 protocols including the full 40-protocol watchlist, each with a 7-step farm plan, and the static dashboard has a sortable board, filters, a detail view for every protocol, and a separate live-token view.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input input/snapshot.json
```

Then open `out/dashboard/index.html` in a browser. The run writes `out/board.json`, `out/data.js`, `out/dossier.json`, and copies the dashboard and screenshots into `out/`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
