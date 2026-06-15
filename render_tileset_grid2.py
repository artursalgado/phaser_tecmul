"""Grid maior do tileset com fundo cinzento médio (para distinguir tiles transparentes de opacos)."""
from PIL import Image, ImageDraw

TS = 16
SCALE = 3
COLS_SHOW = 16
ROWS_SHOW = 24

tileset = Image.open('assets/tilesets/spr_tileset_sunnysideworld_16px.png').convert('RGBA')

cell = TS * SCALE
out = Image.new('RGBA', (COLS_SHOW*cell, ROWS_SHOW*cell), (128,128,128,255))
draw = ImageDraw.Draw(out)

for row in range(ROWS_SHOW):
    for col in range(COLS_SHOW):
        box = (col*TS, row*TS, col*TS+TS, row*TS+TS)
        tile = tileset.crop(box).resize((cell, cell), Image.NEAREST)
        out.alpha_composite(tile, (col*cell, row*cell))
        gid = row*64 + col + 1
        draw.text((col*cell+1, row*cell+1), str(gid), fill=(255,0,255,255))
        draw.rectangle([col*cell, row*cell, col*cell+cell-1, row*cell+cell-1], outline=(0,0,0,60))

out.save('tileset_grid2.png')
print('OK', out.size)
