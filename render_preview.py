"""Renderiza um preview PNG do tilemap ilha.json para inspeção visual."""
import json
from PIL import Image

TS = 16
COLS = 64

with open('assets/tilemaps/ilha.json') as f:
    data = json.load(f)

W, H = data['width'], data['height']
tileset = Image.open('assets/tilesets/spr_tileset_sunnysideworld_16px.png').convert('RGBA')

out = Image.new('RGBA', (W*TS, H*TS), (0, 0, 0, 0))

def tile_img(gid):
    idx = gid - 1
    col = idx % COLS
    row = idx // COLS
    box = (col*TS, row*TS, col*TS+TS, row*TS+TS)
    return tileset.crop(box)

for layer in data['layers']:
    if layer.get('type') != 'tilelayer':
        continue          # ignora objectgroup (spawns)
    arr = layer['data']
    for i, gid in enumerate(arr):
        if gid == 0:
            continue
        r, c = i // W, i % W
        out.alpha_composite(tile_img(gid), (c*TS, r*TS))

out.save('preview.png')
print('OK', out.size)
