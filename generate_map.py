"""
generate_map.py v5 — Ilha de sobrevivência com IDs verificados
Tileset: Sunnyside World 16px (1024x1024, 64 colunas, 16x16 por tile)
Formula de ID: id = row * 64 + col + 2  (linha 0 é vazia, firstgid=1)
  Exemplo: row=1, col=1 -> 1*64 + 1 + 2 = 67  ← ERRADO
  Formula correta (verificada com tile_colors.csv):
    tile 66: row=1, col=1  ->  1*64 + 1 + 1 = 66  ✓
    tile 67: row=1, col=2  ->  1*64 + 2 + 1 = 67  ✓
    Formula: id = row * 64 + col + 1
"""

import json, random, math

# ─── DIMENSÕES ────────────────────────────────────────────────────────────────
MAP_W, MAP_H = 80, 60
TILE_SIZE    = 16
COLS_PER_ROW = 64

def tid(row, col):
    """Converte (row, col) do tileset para tile ID (firstgid=1)."""
    return row * COLS_PER_ROW + col + 1

# ─── IDs VERIFICADOS ─────────────────────────────────────────────────────────
# Linha 1 (row=1) — tiles base
GRASS_A    = tid(1, 1)   # 66  relva clara (r=95,g=193,b=76)
GRASS_B    = tid(1, 2)   # 67  relva clara variante
SAND_BEACH = tid(1, 3)   # 68  areia de praia castanho
WATER_EDGE = tid(1, 4)   # 69  água rasa azul vivo
SAND_LIGHT = tid(1, 5)   # 70  areia clara
DIRT_BASE  = tid(1, 37)  # 102 terra castanha (r=140,g=83,b=56)

# Linhas 2-4 — mais relva variante
GRASS_C = tid(2, 1)   # 130
GRASS_D = tid(2, 2)   # 131
GRASS_E = tid(2, 3)   # 132
GRASS_F = tid(2, 4)   # 133
GRASS_G = tid(2, 5)   # 134
GRASS_H = tid(2, 6)   # 135

# Relva escura (floresta) — linha 1, colunas 51-52
FOREST_A = tid(1, 51)   # 116
FOREST_B = tid(1, 52)   # 117
FOREST_C = tid(1, 55)   # 120  ainda mais escura
FOREST_D = tid(1, 56)   # 121

# Arbustos — linha 1, colunas 27-30
BUSH_A = tid(1, 27)  # 92
BUSH_B = tid(1, 28)  # 93
BUSH_C = tid(1, 29)  # 94
BUSH_D = tid(1, 30)  # 95

# Água profunda — linha 6 (mais bonita/saturada)
WATER_A = tid(6, 30)   # 415 (r=79,g=194,b=235)
WATER_B = tid(6, 31)   # 416
WATER_C = tid(6, 32)   # 417
WATER_D = tid(7, 30)   # 479 (r=48,g=183,b=231)
WATER_E = tid(7, 31)   # 480
WATER_F = tid(8, 30)   # 543 (r=48,g=218,b=231)
WATER_G = tid(8, 31)   # 544

# Praia / areia sólida
BEACH_A = tid(7, 1)    # 450 (r=228,g=166,b=114)
BEACH_B = tid(7, 9)    # 458
BEACH_C = tid(7, 10)   # 459
BEACH_D = tid(7, 34)   # 483 areia clara

# Transições água→praia/relva (linha 7)
TRANS_WATER_GRASS = tid(7, 22)   # 471 água com verde
TRANS_TO_GRASS1   = tid(7, 23)   # 472
TRANS_TO_GRASS2   = tid(7, 27)   # 476
TRANS_TO_GRASS3   = tid(7, 28)   # 477 quase relva

# Caminhos de terra (linhas 9-10)
PATH_A = tid(9, 1)    # 578 (r=197,g=128,b=91)
PATH_B = tid(9, 2)    # 579
PATH_C = tid(10, 9)   # 651 (r=192,g=132,b=96)

# ─── GRUPOS ──────────────────────────────────────────────────────────────────
GRASS_ALL  = [GRASS_A, GRASS_B, GRASS_C, GRASS_D,
              GRASS_E, GRASS_F, GRASS_G, GRASS_H]
FOREST_ALL = [FOREST_A, FOREST_B, FOREST_C, FOREST_D,
              FOREST_A, FOREST_B]   # duplicar para maior probabilidade
WATER_ALL  = [WATER_A, WATER_B, WATER_C, WATER_D,
              WATER_E, WATER_F, WATER_G]
BEACH_ALL  = [BEACH_A, BEACH_B, BEACH_C, BEACH_D]
PATH_ALL   = [PATH_A, PATH_B, PATH_C, DIRT_BASE]
TRANS_ALL  = [TRANS_WATER_GRASS, TRANS_TO_GRASS1,
              TRANS_TO_GRASS2, TRANS_TO_GRASS3]
BUSH_ALL   = [BUSH_A, BUSH_B, BUSH_C, BUSH_D]

# ─── CAMADAS ─────────────────────────────────────────────────────────────────
chao    = [[0]*MAP_W for _ in range(MAP_H)]
deco    = [[0]*MAP_W for _ in range(MAP_H)]
colisao = [[0]*MAP_W for _ in range(MAP_H)]

rng = random.Random(99)

# ─── PARÂMETROS DA ILHA ───────────────────────────────────────────────────────
cx, cy = MAP_W // 2, MAP_H // 2    # centro: (40, 30)
rx, ry = 33, 23                     # raios elípticos

def dist_norm(x, y):
    return math.sqrt(((x - cx) / rx)**2 + ((y - cy) / ry)**2)

def coast_noise(x, y):
    """Ruído na borda para fazer a ilha parecer natural."""
    angle = math.atan2(y - cy, x - cx)
    return (0.10 * math.sin(angle * 4 + 0.3) +
            0.07 * math.sin(angle * 9 + 1.2) +
            0.05 * math.sin(angle * 16 + 2.7) +
            0.04 * math.cos(angle * 7 - 0.5))

# ─── 1. PREENCHER TUDO COM ÁGUA ──────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        # Alternar padrão de água para parecer natural
        chao[y][x] = rng.choice(WATER_ALL)

# ─── 2. DESENHAR ILHA ────────────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        d = dist_norm(x, y)
        n = coast_noise(x, y)

        if d < 0.60 + n:
            # Interior: floresta densa no centro, clareira nos arredores
            if d < 0.25:
                chao[y][x] = rng.choice(FOREST_ALL)
            elif d < 0.45:
                chao[y][x] = rng.choice(FOREST_ALL[:2] + GRASS_ALL)
            else:
                chao[y][x] = rng.choice(GRASS_ALL)

        elif d < 0.73 + n:
            # Praia / litoral
            if d < 0.67 + n:
                chao[y][x] = rng.choice(BEACH_ALL)
            else:
                chao[y][x] = rng.choice(BEACH_ALL[:2])

        elif d < 0.82 + n:
            # Água rasa junto à costa
            chao[y][x] = rng.choice(TRANS_ALL)
        # else: água profunda (já definido)

# ─── 3. CAMINHOS DE TERRA ─────────────────────────────────────────────────────
def is_land(x, y):
    """Verifica se o tile em (x,y) é terra firme."""
    d = dist_norm(x, y)
    n = coast_noise(x, y)
    return d < 0.60 + n

def draw_path(x0, y0, x1, y1, w=1):
    """Traça caminho de terra de (x0,y0) a (x1,y1)."""
    steps = max(abs(x1 - x0), abs(y1 - y0))
    if steps == 0:
        return
    for i in range(steps + 1):
        t = i / steps
        px = int(x0 + (x1 - x0) * t)
        py = int(y0 + (y1 - y0) * t)
        for wy in range(-w, w + 1):
            for wx in range(-w, w + 1):
                nx, ny = px + wx, py + wy
                if 0 <= nx < MAP_W and 0 <= ny < MAP_H and is_land(nx, ny):
                    chao[ny][nx] = rng.choice(PATH_ALL)

# Cruzamento central + 4 braços
draw_path(cx - 20, cy,     cx + 20, cy,     w=1)   # horizontal
draw_path(cx,      cy - 15, cx,     cy + 15, w=1)   # vertical
draw_path(cx - 14, cy - 10, cx + 14, cy + 10, w=1) # diagonal NE
draw_path(cx - 14, cy + 10, cx + 14, cy - 10, w=1) # diagonal SE

# ─── 4. DECORAÇÃO (arbustos) ──────────────────────────────────────────────────
deco_count = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        base = chao[y][x]
        d    = dist_norm(x, y)
        n    = coast_noise(x, y)

        if base in FOREST_ALL and rng.random() < 0.12:
            deco[y][x] = rng.choice(BUSH_ALL)
            deco_count += 1
        elif base in GRASS_ALL and rng.random() < 0.05:
            deco[y][x] = rng.choice(BUSH_ALL[:2])
            deco_count += 1

# ─── 5. COLISÕES ──────────────────────────────────────────────────────────────
COLLIDE_TILES = set(WATER_ALL + TRANS_ALL + [WATER_EDGE])

collision_count = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        if chao[y][x] in COLLIDE_TILES:
            colisao[y][x] = WATER_A   # tile sólido invisível
            collision_count += 1
        elif deco[y][x] in BUSH_ALL:
            colisao[y][x] = BUSH_A
            collision_count += 1

# ─── ESTATÍSTICAS ─────────────────────────────────────────────────────────────
total = MAP_W * MAP_H
land  = sum(1 for y in range(MAP_H) for x in range(MAP_W)
            if chao[y][x] not in COLLIDE_TILES and chao[y][x] not in BEACH_ALL)

print(f"Mapa: {MAP_W}×{MAP_H}  ({total} tiles total)")
print(f"  Terra firme: {land} tiles")
print(f"  Decorações:  {deco_count}")
print(f"  Colisões:    {collision_count}")
print(f"  Spawn:       pixel ({cx*TILE_SIZE}, {cy*TILE_SIZE})")

# ─── CONVERTER PARA FLAT ─────────────────────────────────────────────────────
def flat(grid):
    return [tile for row in grid for tile in row]

# ─── JSON COM TILESET INLINE (sem .tsj externo) ──────────────────────────────
tilemap = {
    "height": MAP_H,
    "width":  MAP_W,
    "tileheight": TILE_SIZE,
    "tilewidth":  TILE_SIZE,
    "orientation": "orthogonal",
    "renderorder": "right-down",
    "type": "map",
    "version": "1.10",
    "infinite": False,
    "nextlayerid": 5,
    "nextobjectid": 1,
    "tilesets": [
        {
            "columns":     64,
            "firstgid":    1,
            "image":       "../../tilesets/spr_tileset_sunnysideworld_16px.png",
            "imageheight": 1024,
            "imagewidth":  1024,
            "margin":      0,
            "name":        "sunnyside",
            "spacing":     0,
            "tilecount":   4096,
            "tileheight":  16,
            "tilewidth":   16
        }
    ],
    "layers": [
        {
            "id": 1, "name": "chao",
            "type": "tilelayer",
            "x": 0, "y": 0,
            "width": MAP_W, "height": MAP_H,
            "visible": True, "opacity": 1,
            "data": flat(chao)
        },
        {
            "id": 2, "name": "Decoracao",
            "type": "tilelayer",
            "x": 0, "y": 0,
            "width": MAP_W, "height": MAP_H,
            "visible": True, "opacity": 1,
            "data": flat(deco)
        },
        {
            "id": 3, "name": "colisao",
            "type": "tilelayer",
            "x": 0, "y": 0,
            "width": MAP_W, "height": MAP_H,
            "visible": True, "opacity": 1,
            "data": flat(colisao)
        }
    ]
}

out = "assets/tilemaps/ilha.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(tilemap, f, separators=(",", ":"))

print(f"\nGuardado: {out}")
