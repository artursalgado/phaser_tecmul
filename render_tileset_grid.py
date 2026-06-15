"""Cria um grid ampliado e anotado dos primeiros tiles do tileset para identificar IDs corretos."""
from PIL import Image, ImageDraw

TS = 16
SCALE = 4
COLS_SHOW = 12
ROWS_SHOW = 12

tileset = Image.open('assets/tilesets/spr_tileset_sunnysideworld_16px.png').convert('RGBA')

cell = TS * SCALE
out = Image.new('RGBA', (COLS_SHOW*cell, ROWS_SHOW*cell), (40,40,40,255))
draw = ImageDraw.Draw(out)

for row in range(ROWS_SHOW):
    for col in range(COLS_SHOW):
        box = (col*TS, row*TS, col*TS+TS, row*TS+TS)
        tile = tileset.crop(box).resize((cell, cell), Image.NEAREST)
        out.alpha_composite(tile, (col*cell, row*cell))
        gid = row*64 + col + 1
        draw.text((col*cell+2, row*cell+2), str(gid), fill=(255,0,0,255))
        draw.rectangle([col*cell, row*cell, col*cell+cell-1, row*cell+cell-1], outline=(0,0,0,80))

out.save('tileset_grid.png')
print('OK', out.size)
