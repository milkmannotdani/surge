# SURGE: Battle Royale

A 3D hero-vs-villain battle royale that runs in the browser. Everything is in one file, `index.html`.

## Put it on GitHub Pages (free)

1. Create a new **public** repository on GitHub, for example `surge-battle-royale`.
2. Upload `index.html` (and this README) to the repository: **Add file → Upload files → Commit**.
3. Go to **Settings → Pages**. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then **Save**.
4. After a minute or two, the game is live at `https://<your-username>.github.io/surge-battle-royale/`.

Share that link with your friends.

## Playing online

- One player clicks **PLAY ONLINE → HOST GAME** and gets a 5-letter room code.
- Friends open the same link, click **PLAY ONLINE**, type the code, and press **JOIN**.
- The host presses **START MATCH**. Up to 8 fighters per match, and bots fill any empty slots unless the host turns that off.
- Players connect directly to each other (peer-to-peer through WebRTC, using PeerJS's free public connection service), so there's no server to pay for or run. The host's computer runs the match: **if the host leaves, the match ends** for everyone. If someone else disconnects, a bot takes over their fighter.
- Some school, work or very strict networks block peer-to-peer connections. If joining fails on one network, try another (for example, a phone hotspot).

## Controls

| Action | Keys |
|---|---|
| Move | WASD |
| Camera | Mouse (click the game to lock the mouse) or ←/→ |
| Jump / double jump | Space (press twice) |
| Dash / sprint | Shift (tap to dash, hold to sprint) |
| Light combo | Left click or J |
| Heavy launcher | Right click or K |
| Block | F or L (hold) |
| Special | Q or U |
| Ultimate (full Surge meter) | E or I |
| Switch target | Tab |
| Music on/off | M |
| Menu | Esc |

## Testing on one computer

Add `#local` to the end of the address (for example `.../index.html#local`) and open it in two tabs of the same browser. One tab hosts, the other joins with the code. No internet is needed.
