"""Renderiza regiões específicas do tileset, ampliadas e anotadas com gids,
para identificar com precisão os blocos de autotiling, árvores, água e rochas."""
from PIL import Image, ImageDraw

TS = 16
COLS = 64
SCALE = 6

tileset = Image.open('assets/tilesets/spr_tileset_sunnysideworld_16px.png').convert('RGBA')

def gid(row, col):
    return row * COLS + col + 1

def render_region(name, col0, row0, ncols, nrows, scale=SCALE):
    cell = TS * scale
    out = Image.new('RGBA', (ncols * cell, nrows * cell), (60, 60, 60, 255))
    draw = ImageDraw.Draw(out)
    for r in range(nrows):
        for c in range(ncols):
            sc, sr = col0 + c, row0 + r
            box = (sc * TS, sr * TS, sc * TS + TS, sr * TS + TS)
            tile = tileset.crop(box).resize((cell, cell), Image.NEAREST)
            out.alpha_composite(tile, (c * cell, r * cell))
            g = gid(sr, sc)
            draw.rectangle([c*cell, r*cell, c*cell+cell-1, r*cell+cell-1], outline=(0,0,0,120))
            draw.text((c*cell+2, r*cell+2), str(g), fill=(255,30,30,255))
            draw.text((c*cell+2, r*cell+cell-12), f'r{sr}c{sc}', fill=(255,255,0,255))
    fn = f'inspect_{name}.png'
    out.save(fn)
    print('OK', fn, out.size)

# Região A: bases relva/areia/água + transições relva↔areia + relva↔terra (rows 0-9, cols 0-18)
render_region('A_terrain', 0, 0, 18, 9)
# Região árvores (canto superior-direito)
render_region('B_trees', 48, 0, 16, 14)
# Região água azul-clara + neve (rows 17-23, cols 0-20)
render_region('C_water', 0, 17, 20, 7)
# Região rochas + estruturas (rows 20-32, cols 40-58)
render_region('D_rocks', 40, 20, 18, 13)
# Região costa água↔areia (top-center) + decoração relva
render_region('E_shore', 14, 0, 28, 7)
# Ultra-zoom: bloco transição relva↔areia (cliff/corner set)
render_region('F_grasssand', 0, 6, 9, 4, scale=12)
# Ultra-zoom: bloco pond areia↔água e relva↔água
render_region('G_pond', 18, 1, 9, 6, scale=12)
# Ultra-zoom focado no bloco AREIA↔ÁGUA (gids 339-411)
render_region('H_sandwater', 18, 5, 9, 2, scale=18)
