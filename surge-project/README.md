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
    chapters.js       hero story script (SURGE: ORIGIN): chapters, dialogue, cutscene staging, missions
    training.js       TRAINING ARC: the tutorial chapter (TUT_STEPS lists each lesson)
    villain.js        villain story script (THE SEVERANCE)
    story.js          story engine: campaigns (CAMPS), anime cutscenes, missions, saving progress
  features/           add-ons that plug in through event hooks (see below)
    music.js          procedural soundtrack: THEMES (menu/story/dark/battle/boss/exam) + stings
    awaken.js         power awakening (X at low HP with a full BREAK bar)
    teamup.js         team-up combos when partners ult together (TU_NAMES for named combos)
    destruct.js       craters, wall cracks, extra breakable street furniture
    civilians.js      civilians to rescue, objective panel, compass arrow
    missions.js       MISSIONS screen: Rescue + Hero License Exam
    progress.js       fighter levels/XP and unlockable costumes (UNLOCKS)
    input.js          gamepad + touch controls
    settings.js       settings menu (SET_DEF / SET_ROWS), game modes menu, shift lock, Tab lock-on, controller button icons
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

## Event hooks (the easy way to add features)

Instead of editing core files, a new file can listen for game events:

```js
onEv('kill', (victim, attacker) => { /* ... */ });
```

Events: `frame(dt)` every frame · `input(dt)` before controls are read · `intent(dt)` after ·
`tick(dt)` every game step in a match · `hit(att, def, dmg, opts)` · `kill(def, att)` · `ult(fighter)` ·
`matchStart()` · `matchEnd()` · `win(winner)` · `missionEnd(win, mission)` · `net:<kind>(event)` for custom online events
(send them from the host with `netEvent({k:'kind', ...})`). Every file in `features/` is built this way.

## Common additions

**New fighter** — add an entry to `HEROES` in `fighters/roster.js` (copy a similar one;
`special` and `ult` pick its moves). Give it special-move code in `SPECIALS`
(`fighters/combat.js`) or reuse an existing one, and tell bots how to use it in
`SPECIAL_AI` / `ULT_RANGE` (`game/ai.js`). `fighters/mha.js` is a complete worked example
of adding six fighters with their own moves, ults, sounds and body parts.

**New extra move (keys 3/4)** — add to `XMOVES` in `fighters/mha.js`.

**New mission type** — build a mission object and pass it to `storyStart(S)`. Besides the story fields
(`player`/`playerIdx`, `enemies`, `allies`, `diff`, `goal`) it can have `setup(x,z)`, `tick(dt)` (return true/false to
win/lose), `custom:true` (don't auto-win when enemies die), `hud()`, `end(win)`, `done(win)` and `music`.
`features/missions.js` has two full examples.

**New story chapter** — add an object to `STORY` in `story/chapters.js` (or `VSTORY` in `story/villain.js`). Lines are
`SL(speaker, text, {pose, fx, at, enter, exit, cam})`; `sPre`/`sPost` stage the 3D
cutscene (`where` = street position, `actors` = `[id, dx, dz, hidden]`).

**New cutscene effect / SFX** — `cineFx` and `AN_SFX` in `story/story.js`.

**Styling** — `css/style.css`.

## Running and hosting

- Upload the whole folder to GitHub Pages (or any web host) and open `index.html`.
- Locally: run `python3 -m http.server` in this folder and open http://localhost:8000.
- One-file version: `python3 tools/bundle.py` writes `surge.html`.
