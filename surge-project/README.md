# SURGE: Battle Royale — project layout

The game is now split into small files by topic. `index.html` loads them in order,
so there's no build step: edit a file, refresh the page.

```
index.html            page markup (menus, HUD, screens) + the list of scripts, in load order
css/style.css         all styling
js/
  engine/
    core.js           renderer, camera, post-processing (incl. the anime cutscene shader), audio (SND), input, helpers
    world.js          the city: roads, buildings + interiors, colliders, street props
    fx.js             particles, rings, flashes, lights
  fighters/
    roster.js         HEROES — every fighter's stats, colors, special, ult, description
    rig.js            buildRig — how a fighter's 3D body is built
    moves.js          POSES (animation poses) and MOVES (basic attacks)
    fighter.js        Fighter class: movement, physics, climbing, blocking, states
    combat.js         hits/damage (DMG_SCALE), SPECIALS (special moves)
    elements.js       element powers
    variants.js       move variants (SPECVAR), alt ults (ALTULT), power hits (PFX)
    abilities.js      ability engine used by created fighters
    gear.js           weapons and gear
    mha.js            Solstice, Piston, Snare, Marble, Legion, Recoil; extra moves (XMOVES); death ults
  creator/
    mold.js           Mold editor
    custom.js         fighter creator: turns a text description into a fighter
    design.js         fighter creator: Claude-designed abilities
    creator.js        fighter creator screen
  game/
    shop.js           points + shop
    ai.js             bots (ULT_RANGE, SPECIAL_AI)
    game.js           match flow, controls (MOVE_SLOTS, ULT_KEYS), camera, HUD
    rules.js          game mode rules
    net.js            online play (PeerJS)
    ui.js             menus, screens, main loop
    practice.js       practice mode
  story/
    chapters.js       the story script: chapters, dialogue, cutscene staging, missions
    story.js          story engine: anime cutscenes, missions, saving progress
  main.js             starts the game (always loaded last)
tools/bundle.py       optional: packs everything back into one HTML file
```

## Important rules

- **Load order matters.** All files share one global scope, and a file can only use
  things from files listed *above* it in `index.html` when it first loads (inside
  functions, anything goes). New files go just above `js/main.js`.
- **Names are shared across files.** Before adding a new top-level `const`/`function`,
  search the project to make sure the name isn't already used.
- **Keep the city seeded.** World generation uses `srnd()`/`sr()`, not `Math.random`,
  so online players get the same map.

## Common additions

**New fighter** — add an entry to `HEROES` in `fighters/roster.js` (copy a similar one;
`special` and `ult` pick its moves). Give it special-move code in `SPECIALS`
(`fighters/combat.js`) or reuse an existing one, and tell bots how to use it in
`SPECIAL_AI` / `ULT_RANGE` (`game/ai.js`). `fighters/mha.js` is a complete worked example
of adding six fighters with their own moves, ults, sounds and body parts.

**New extra move (keys 3/4)** — add to `XMOVES` in `fighters/mha.js`.

**New story chapter** — add an object to `STORY` in `story/chapters.js`. Lines are
`SL(speaker, text, {pose, fx, at, enter, exit, cam})`; `sPre`/`sPost` stage the 3D
cutscene (`where` = street position, `actors` = `[id, dx, dz, hidden]`).

**New cutscene effect / SFX** — `cineFx` and `AN_SFX` in `story/story.js`.

**Styling** — `css/style.css`.

## Running and hosting

- Upload the whole folder to GitHub Pages (or any web host) and open `index.html`.
- Locally: run `python3 -m http.server` in this folder and open http://localhost:8000.
- One-file version: `python3 tools/bundle.py` writes `surge.html`.
