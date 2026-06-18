"""
generate_map.py v7 — Mapa com spawn na praia junto aos destrocos da jangada
Alteracoes v7:
  - Spawn do player na praia sul (perto da doca), nao no centro
  - Objeto spawn_praia adicionado ao object layer "spawns"
  - Objeto poi/doca adicionado como marcador da jangada
"""
import json, random, math

MAP_W, MAP_H = 80, 60
TILE_SIZE    = 16
COLS         = 64

def tid(row, col):
    return row * COLS + col + 1

# ─── TILES BASE (um por zona) ────────────────────────────────────────────────
GRASS      = tid(3, 0)
GRASS_VAR  = [tid(3,1), tid(3,2), tid(3,3), tid(3,4), tid(3,5), tid(3,6), tid(3,7)]

FOREST     = tid(1,51)
FOREST_VAR = [tid(1,52), tid(1,55), tid(1,56)]

SAND       = tid(1, 8)
SAND_VAR   = [tid(1,7), tid(1,9), tid(1,5)]

WATER      = tid(6,31)
WATER_VAR  = [tid(6,30), tid(6,32), tid(7,30), tid(7,31), tid(8,30), tid(8,31)]

PATH       = tid(9, 2)
PATH_VAR   = [tid(9,1), tid(10,9)]

BUSH       = tid(1, 28)
BUSH_VAR   = [tid(1,27), tid(1,29), tid(1,30)]

# ─── CAMADAS ─────────────────────────────────────────────────────────────────
chao    = [[0]*MAP_W for _ in range(MAP_H)]
deco    = [[0]*MAP_W for _ in range(MAP_H)]
colisao = [[0]*MAP_W for _ in range(MAP_H)]

rng = random.Random(7)

# ─── GEOMETRIA DA ILHA ────────────────────────────────────────────────────────
cx, cy = MAP_W // 2, MAP_H // 2   # (40, 30)
rx, ry = 30, 21

def dist(x, y):
    return math.sqrt(((x-cx)/rx)**2 + ((y-cy)/ry)**2)

def noise(x, y):
    a = math.atan2(y-cy, x-cx)
    return (0.08*math.sin(a*3+0.5) +
            0.06*math.sin(a*5+1.8) +
            0.04*math.sin(a*8-0.7))

def on_land(x, y):
    return dist(x,y) + noise(x,y) < 0.62

def on_beach(x, y):
    d = dist(x,y) + noise(x,y)
    return 0.62 <= d < 0.76

def on_shallow(x, y):
    d = dist(x,y) + noise(x,y)
    return 0.76 <= d < 0.88

# ─── 1. ÁGUA ─────────────────────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        chao[y][x] = WATER if rng.random() > 0.12 else rng.choice(WATER_VAR)

# ─── 2. PRAIA ────────────────────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        if on_beach(x, y) or on_shallow(x, y):
            chao[y][x] = SAND if rng.random() > 0.10 else rng.choice(SAND_VAR)

# ─── 3. ILHA ─────────────────────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        if not on_land(x, y):
            continue
        d = dist(x, y) + noise(x, y)
        if d < 0.22:
            chao[y][x] = FOREST if rng.random() > 0.10 else rng.choice(FOREST_VAR)
        elif d < 0.38:
            chao[y][x] = GRASS if rng.random() > 0.08 else FOREST
        else:
            chao[y][x] = GRASS if rng.random() > 0.06 else rng.choice(GRASS_VAR)

# ─── 4. CAMINHOS ─────────────────────────────────────────────────────────────
def draw_path(x0,y0,x1,y1,w=1):
    steps = max(abs(x1-x0), abs(y1-y0))
    if not steps: return
    for i in range(steps+1):
        t = i/steps
        px = int(x0+(x1-x0)*t)
        py = int(y0+(y1-y0)*t)
        for wy in range(-w,w+1):
            for wx in range(-w,w+1):
                nx,ny = px+wx, py+wy
                if 0<=nx<MAP_W and 0<=ny<MAP_H and on_land(nx,ny):
                    chao[ny][nx] = PATH if rng.random()>0.15 else rng.choice(PATH_VAR)

draw_path(cx-22, cy,    cx+22, cy,    w=1)
draw_path(cx,    cy-16, cx,    cy+16, w=1)
draw_path(cx-15, cy-10, cx+15, cy+10, w=1)
draw_path(cx-15, cy+10, cx+15, cy-10, w=1)

# ─── 5. DECORAÇÃO ────────────────────────────────────────────────────────────
deco_n = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        b = chao[y][x]
        if (b == GRASS or b in GRASS_VAR) and rng.random() < 0.04:
            deco[y][x] = BUSH if rng.random()>0.3 else rng.choice(BUSH_VAR)
            deco_n += 1
        elif (b == FOREST or b in FOREST_VAR) and rng.random() < 0.10:
            deco[y][x] = BUSH
            deco_n += 1

# ─── 6. COLISÕES ─────────────────────────────────────────────────────────────
coll_n = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        if on_shallow(x,y) or (not on_land(x,y) and not on_beach(x,y)):
            colisao[y][x] = WATER
            coll_n += 1
        if deco[y][x] in {BUSH, *BUSH_VAR}:
            colisao[y][x] = BUSH
            coll_n += 1

# ─── SPAWN NA PRAIA ──────────────────────────────────────────────────────────
# Procurar tile de areia (SAND) sem colisao na costa este/sul (perto da doca)
# A doca fica no canto este da ilha; o spawn ideal e' na praia sul
# Ordem de preferencia: procurar a partir de (cx+rx-5, cy+ry-3) em espiral
def find_beach_spawn():
    # Costa sul/este da ilha -- angulo ~45 graus em direccao a doca
    best = None
    # Varrer a costa sul (y > cy) e este (x > cx)
    for ty in range(cy + ry - 8, cy + ry + 2):
        for tx in range(cx + rx - 10, cx + rx + 2):
            if 0 <= tx < MAP_W and 0 <= ty < MAP_H:
                if chao[ty][tx] == SAND and colisao[ty][tx] == 0:
                    if best is None:
                        best = (tx, ty)
    return best

spawn_tile = find_beach_spawn()
if spawn_tile:
    sx_px = spawn_tile[0] * TILE_SIZE
    sy_px = spawn_tile[1] * TILE_SIZE
else:
    # Fallback: centro
    sx_px = cx * TILE_SIZE
    sy_px = cy * TILE_SIZE
    spawn_tile = (cx, cy)

# Doca/jangada: ligeiramente a norte do spawn (dentro da ilha, na areia)
doca_px = sx_px + TILE_SIZE * 3
doca_py = sy_px - TILE_SIZE * 2

land_n = sum(1 for y in range(MAP_H) for x in range(MAP_W) if on_land(x,y))
print(f"Mapa: {MAP_W}x{MAP_H}  |  terra: {land_n}  |  deco: {deco_n}  |  colisao: {coll_n}")
print(f"Spawn praia: tile{spawn_tile} -> pixel({sx_px},{sy_px})")
print(f"Doca/jangada: pixel({doca_px},{doca_py})")

# ─── TILEMAP JSON ────────────────────────────────────────────────────────────
def flat(g): return [t for row in g for t in row]

tilemap = {
    "height": MAP_H, "width": MAP_W,
    "tileheight": TILE_SIZE, "tilewidth": TILE_SIZE,
    "orientation": "orthogonal", "renderorder": "right-down",
    "type": "map", "version": "1.10",
    "infinite": False, "nextlayerid": 6, "nextobjectid": 10,
    "tilesets": [{
        "columns": 64, "firstgid": 1,
        "image": "../../tilesets/spr_tileset_sunnysideworld_16px.png",
        "imageheight": 1024, "imagewidth": 1024,
        "margin": 0, "name": "sunnyside",
        "spacing": 0, "tilecount": 4096,
        "tileheight": 16, "tilewidth": 16
    }],
    "layers": [
        {"id":1,"name":"chao","type":"tilelayer","x":0,"y":0,
         "width":MAP_W,"height":MAP_H,"visible":True,"opacity":1,"data":flat(chao)},
        {"id":2,"name":"Decoracao","type":"tilelayer","x":0,"y":0,
         "width":MAP_W,"height":MAP_H,"visible":True,"opacity":1,"data":flat(deco)},
        {"id":3,"name":"colisao","type":"tilelayer","x":0,"y":0,
         "width":MAP_W,"height":MAP_H,"visible":True,"opacity":1,"data":flat(colisao)},
        {
            "id": 4, "name": "spawns", "type": "objectgroup",
            "x": 0, "y": 0, "visible": True, "opacity": 1,
            "draworder": "topdown", "color": "#ff0000",
            "objects": [
                # Spawn do player na praia (junto aos destrocos da jangada)
                {
                    "id": 1, "name": "player_start", "type": "player_start",
                    "x": sx_px, "y": sy_px,
                    "width": 16, "height": 16,
                    "visible": True, "rotation": 0, "properties": []
                },
                # Marcador spawn_praia (mesmo local, tipo distinto para clareza)
                {
                    "id": 2, "name": "spawn_praia", "type": "spawn_praia",
                    "x": sx_px, "y": sy_px,
                    "width": 16, "height": 16,
                    "visible": True, "rotation": 0,
                    "properties": [{"name":"label","type":"string","value":"spawn_praia"}]
                },
                # Doca / destrocos da jangada
                {
                    "id": 3, "name": "poi", "type": "poi",
                    "x": doca_px, "y": doca_py,
                    "width": 16, "height": 16,
                    "visible": True, "rotation": 0,
                    "properties": [{"name":"label","type":"string","value":"doca"}]
                },
            ]
        }
    ]
}

out = "assets/tilemaps/ilha.json"
with open(out,"w",encoding="utf-8") as f:
    json.dump(tilemap, f, separators=(",",":"))
print(f"Guardado: {out}")
