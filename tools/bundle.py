#!/usr/bin/env python3
"""Bundle the multi-file game into ONE self-contained HTML file.

    python3 tools/bundle.py                 -> writes surge.html next to index.html
    python3 tools/bundle.py out.html        -> writes out.html

You don't need this to play or host the game (index.html works as-is on GitHub Pages
or any web server). Use it when you want a single file to share or upload.
Optional: --libs <prefix> replaces the three.js CDN prefix, --peer <url> the PeerJS url.
"""
import os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
opt = {}
for k in ('--libs', '--peer'):
    if k in args:
        i = args.index(k); opt[k] = args[i + 1]; del args[i:i + 2]
out = args[0] if args else os.path.join(root, 'surge.html')

html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

# inline the stylesheet
css = open(os.path.join(root, 'css/style.css'), encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '</style>')

# join every local game script into one script (wrapped so nothing leaks onto window)
local = re.findall(r'<script src="(js/[^"]+)"></script>\n?', html)
code = ''.join(open(os.path.join(root, p), encoding='utf-8').read().rstrip('\n') + '\n' for p in local)
first = html.index('<script src="' + local[0])
html = re.sub(r'<script src="js/[^"]+"></script>\n?', '', html)
html = html[:first] + '<script>\n(function(){\n' + code + '})();\n</script>\n' + html[first:]

if '--libs' in opt:
    html = html.replace('https://cdn.jsdelivr.net/npm/three@0.128.0/', opt['--libs'])
if '--peer' in opt:
    html = html.replace('https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js', opt['--peer'])

open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, f'({len(local)} files, {len(html)//1024} KB)')
