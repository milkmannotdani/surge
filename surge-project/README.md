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
    zanshin.js        Zanshin: crescent waves, flash step, Final Release (sword swap)
    projshape.js      projectile looks per fighter (PROJ_SIG) and per extra move (PROJ_MOVE)
    uniqatk.js        unique light combo + heavy per fighter (UATK, built from TPL move templates; UATK_KEEP keeps old chains)
    torrent.js        TORRENT (inspired by Ryu Ishigori, Jujutsu Kaisen — Gege Akutami): huge steerable output beams, finger guns
    heir.js           HEIR (inspired by Izuku Midoriya / Deku): Blackwhip, Gearshift, Fa Jin, Smokescreen, LEGACY STRIKE one-hit ult with director camera
    chimera.js        ROTTEN CHIMERA (original, a stitched corpse — no armor; javelin needs an arm, bile needs a head; ult form is a snail-like meat pile with limbs, mouths and eyes that leaves a red trail; FESTER mode: MAGGOT SWARM/CORPSE GAS, RIB CAGE, GUT ROPE, PUTRID BLOAT, MASS GRAVE; AMALGAMATION moves: ENGULF, BONE ERUPTION, BLOOD TORRENT, HUNDRED HANDS): starts as a rolling torso, grafts torn limbs/heads (10 each), ARM JAVELIN pins, SPLIT counter limb-pile trap, BILE, ABSORPTION, permanent AMALGAMATION ult form (half-speed meter), LIMB STORM
    movefx.js         real rock/ice for ground moves (waves, pillars, slams, bursts) and full-size styled cone attacks (flame torrents, slash storms, fist flurries…)
    customvoice.js    CUSTOM SOUNDS: player-added voice clips per fighter (ult/kill/hurt/win/theme) and music (menu/battle/boss/victory), IndexedDB only; SET.ultSfx gates built-in ult sounds
    clips.js          CLIPS: F8 record, F9 instant replay (two staggered MediaRecorders), auto KO/win highlights, gallery with trim/download/share (IndexedDB)
    secret.js         SECRET: press every letter A–Z on the title screen to unlock everything and max out every fighter
    combatrules.js    10 s heal lock after damage, combo lock (only the BREAK escapes, 1 s invuln), 1.6x leap/slam moves (whole move), per-variant special cooldowns
    forms.js          MODES (replaces Awakening): every fighter's second mode on 5 — new specials, extra moves, ultimate, combo, look and stats (FORMS table)
    beams.js          steerable beams (turn with aim, slow walk) and BEAM CLASHES (mash to push, winner overpowers)
    power.js          stronger specials/ults/heavies (more damage + knockback) and area destruction on big hits (craters, smashed props, cracked walls)
    motion.js         fluid movement: lean into speed, bank into turns, smoother pose blending and camera
    cinema.js         CINEMATIC MOVES: no move text pop-ups in fights; freeze-frames, camera punch-in, impact flash, ult letterbox, slow-mo
    sigs.js           SIGNATURES: each inspired fighter's constant signature look, inspiration-matched extra moves (Glacier Wall, Unpack, Curved Shot, Acid Shot), directed ult cinematics
    anim.js           spring-smoothed joint blending (fighter.js applyPose) + ultimate animations by what each ult does (punch, beam, slam, barrage, aoe, sky, ground, slash, rush, shot, roar, command)
    arenaping.js      ARENA PING: G reveals every enemy for 5 s (markers through walls, edge arrows, distance), 10 s cooldown
    gore.js           HEAVY GORE on KOs (Settings toggle): blood bursts + mist, big pools, splatter, a limb on every KO, 2-3 + head on big finishers, explosive ult kills blow the body apart into chunks, pulsing stumps, heavy hits bleed
    bloodfx.js        REALISTIC BLOOD: glossy 3D droplets that stretch and splat, painted splatter/smear/drip textures, all red blood bursts become droplets, liquid-blood stream for Marrow BLOOD ARROW and Chimera BLOOD TORRENT
    dread.js          Marrow's DREAD form (press 5): fear-energy moveset, TERROR status, own look
    hyper.js          hyper armor: ults, charged/heavy specials, slam moves and heavy attacks can't be interrupted (HYPER_SP)
    ultopen.js        themed ultimate openings per fighter (UO table)
    fx2.js            signature VFX hooked onto inspired fighters' moves (glaciers, engine flames, red eyes, mud, tracers…)
    faithful.js       signature traits that make inspired fighters fight like their inspirations (TRAIT_DESC)
    vigilantes.js     Old Guard, Hopstar, Headliner (vig:true in roster.js = VIGILANTES tab)
    skitter.js        Skitter: surface-glide slides, wall slides, skim shot, Street Surge
    decree.js         Decree: spoken orders via speech recognition, named targets and IF-laws (ORDERS / PUNISH tables)
    mha2.js           Crimson, Sawback, Resect, Cushion, Corrosa, Verdict, Decree, Skitter, Old Guard, Hopstar, Headliner, Zanshin (another worked example of adding fighters)
    looks.js          costume layer for every fighter: chest emblem, belt, bracers, boots, shoulders, collar, signature item (LOOKS)
    humans.js         ARMOR OFF mode: each fighter's face and hair under the suit (HUMAN table)
  creator/
    custom.js         roster helpers (heroAt, selEntry, rosterHero…); the fighter creator itself was removed
  game/
    shop.js           points + shop
    ai.js             bots (ULT_RANGE, SPECIAL_AI)
    game.js           match flow, controls (MOVE_SLOTS, ULT_KEYS), camera, HUD
    rules.js          game mode rules
    net.js            online play (PeerJS)
    ui.js             menus, screens, main loop
    practice.js       practice mode
  story/
    story.js          mission engine (storyStart / storyTick / storyEnd) used by missions.js; story mode itself was removed
  features/           add-ons that plug in through event hooks (see below)
    music.js          procedural soundtrack: THEMES (menu/story/dark/battle/boss/exam) + stings
    teamup.js         team-up combos when partners ult together (TU_NAMES for named combos)
    destruct.js       craters, wall cracks, extra breakable street furniture
    civilians.js      civilians to rescue, objective panel, compass arrow
    missions.js       MISSIONS screen: Rescue + Hero License Exam
    progress.js       fighter levels/XP and unlockable costumes (UNLOCKS)
    input.js          gamepad + touch controls
    cinematic.js      orchestral sound + original score (CTHEMES: chords + melody per theme; OR = the instruments)
    killcam.js        kill cam, spectate cycling (◀ ▶), match recap
    achieve.js        achievements (ACH), ranked tiers (TIERS), fighter mastery (MLV) + Progress tabs
    access.js         colorblind modes, bigger text, reduce flashing
    tutorial.js       interactive tutorial (TUTL_STEPS)
    antiteam.js       Truce Meter: online solo matches — 3 teaming strikes = destroyed + all saved progress erased (PROGRESS_KEYS)
    stability.js      crash guards, GPU memory cleanup between matches, graphics-reset message (errors in window.__errs)
    surge.js          SURGE EVENTS: 20-second map-wide twists (SURGE_EV table — add your own)
    credits.js        CREDITS screen + small My Hero Academia nods (INSPIRED notes, tips, Plus Ultra call-out)
    settings.js       settings menu (SET_DEF / SET_ROWS), game modes menu, shift lock, Tab lock-on, controller button icons
    netx.js           netSay(): send add-on events to everyone in an online match
    raid.js           BOSS RAID rules + the Giga Nomu villain attack event (RAID_BOSSES)
    worldlife.js      time of day + weather, the train, throwable cars, civilian crowds
    social.js         emotes (EMOTES), victory poses (VPOSES), quick chat, pings, voice lines
    keybinds.js       key rebinding (KB_ACTIONS)
    voice.js          voice chat for online rooms (PeerJS audio calls)
    meta.js           PROGRESS screen: challenges (CH_POOL), season pass (SEASON), skills (SKILLS)
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


**New cutscene effect / SFX** — `cineFx` and `AN_SFX` in `story/story.js`.

**Styling** — `css/style.css`.

## Running and hosting

- Upload the whole folder to GitHub Pages (or any web host) and open `index.html`.
- Locally: run `python3 -m http.server` in this folder and open http://localhost:8000.
- One-file version: `python3 tools/bundle.py` writes `surge.html`.
