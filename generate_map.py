"""
generate_map.py v6 — Mapa LIMPO com zonas uniformes
Problema anterior: variação excessiva tornava o mapa um "mosaico" horrível
Solução: tiles base únicos por zona, variação apenas 1-em-15
"""
import json, random, math

MAP_W, MAP_H = 80, 60
TILE_SIZE    = 16
COLS         = 64

def tid(row, col):
    return row * COLS + col + 1

# ─── TILES BASE (um por zona) ────────────────────────────────────────────────
# Relva verde pura e uniforme (row=3, col=0-7 verificados RGB ~(98,197,78))
GRASS      = tid(3, 0)   # 193 — tile base relva PRINCIPAL
GRASS_VAR  = [tid(3,1), tid(3,2), tid(3,3), tid(3,4), tid(3,5), tid(3,6), tid(3,7)]

# Floresta (relva escura) — usada só no núcleo da ilha
FOREST     = tid(1,51)   # 116 — relva escura verificada (r=79,g=120,b=65)
FOREST_VAR = [tid(1,52), tid(1,55), tid(1,56)]

# Areia de praia — amarelo-bege uniforme (row=1,col=7-9)
SAND       = tid(1, 8)   # 73 — areia clara (r=228,g=212,b=114)
SAND_VAR   = [tid(1,7), tid(1,9), tid(1,5)]   # variantes

# Água profunda — azul uniforme (row=6,col=30-32)
WATER      = tid(6,31)   # 416 — água profunda (r=77,g=193,b=235)
WATER_VAR  = [tid(6,30), tid(6,32), tid(7,30), tid(7,31), tid(8,30), tid(8,31)]

# Terra de caminho — castanho (row=9,col=1)
PATH       = tid(9, 2)   # 579 — terra castanha (r=167,g=111,b=88)
PATH_VAR   = [tid(9,1), tid(10,9)]

# Arbusto (decoração) — verde escuro pequeno (row=1, col=27-30)
BUSH       = tid(1, 28)  # 93
BUSH_VAR   = [tid(1,27), tid(1,29), tid(1,30)]

# ─── CAMADAS ─────────────────────────────────────────────────────────────────
chao    = [[0]*MAP_W for _ in range(MAP_H)]
deco    = [[0]*MAP_W for _ in range(MAP_H)]
colisao = [[0]*MAP_W for _ in range(MAP_H)]

rng = random.Random(7)

# ─── GEOMETRIA DA ILHA ────────────────────────────────────────────────────────
cx, cy = MAP_W // 2, MAP_H // 2   # (40, 30)
rx, ry = 30, 21                    # raios da elipse

def dist(x, y):
    return math.sqrt(((x-cx)/rx)**2 + ((y-cy)/ry)**2)

# Ruído suave na borda (frequências baixas = curvas suaves)
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

# ─── 1. ENCHER TUDO COM ÁGUA ─────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        # Água uniforme — variação só 1 em 8 tiles
        chao[y][x] = WATER if rng.random() > 0.12 else rng.choice(WATER_VAR)

# ─── 2. PRAIA (anel exterior da ilha) ────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        if on_beach(x, y) or on_shallow(x, y):
            # Areia uniforme — variação só 1 em 10
            chao[y][x] = SAND if rng.random() > 0.10 else rng.choice(SAND_VAR)

# ─── 3. ILHA (interior) ──────────────────────────────────────────────────────
for y in range(MAP_H):
    for x in range(MAP_W):
        if not on_land(x, y):
            continue
        d = dist(x, y) + noise(x, y)

        if d < 0.22:
            # Núcleo: floresta escura uniforme
            chao[y][x] = FOREST if rng.random() > 0.10 else rng.choice(FOREST_VAR)
        elif d < 0.38:
            # Meio: transição floresta→relva (maioria relva)
            chao[y][x] = GRASS if rng.random() > 0.08 else FOREST
        else:
            # Exterior da ilha: relva verde pura
            chao[y][x] = GRASS if rng.random() > 0.06 else rng.choice(GRASS_VAR)

# ─── 4. CAMINHOS ──────────────────────────────────────────────────────────────
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

# Cruz central + 2 diagonais
draw_path(cx-22, cy,    cx+22, cy,    w=1)
draw_path(cx,    cy-16, cx,    cy+16, w=1)
draw_path(cx-15, cy-10, cx+15, cy+10, w=1)
draw_path(cx-15, cy+10, cx+15, cy-10, w=1)

# ─── 5. DECORAÇÃO (arbustos pontuais) ─────────────────────────────────────────
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

# ─── 6. COLISÕES ──────────────────────────────────────────────────────────────
WATER_SET = {WATER} | set(WATER_VAR) | {SAND, *SAND_VAR}
coll_n = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        if on_shallow(x,y) or (not on_land(x,y) and not on_beach(x,y)):
            colisao[y][x] = WATER
            coll_n += 1
        if deco[y][x] in {BUSH, *BUSH_VAR}:
            colisao[y][x] = BUSH
            coll_n += 1

land_n = sum(1 for y in range(MAP_H) for x in range(MAP_W) if on_land(x,y))
print(f"Mapa: {MAP_W}x{MAP_H}  |  terra: {land_n}  |  deco: {deco_n}  |  colisão: {coll_n}")
print(f"Spawn: pixel ({cx*TILE_SIZE}, {cy*TILE_SIZE})")

# ─── TILEMAP JSON (tileset inline) ───────────────────────────────────────────
def flat(g): return [t for row in g for t in row]

tilemap = {
    "height": MAP_H, "width": MAP_W,
    "tileheight": TILE_SIZE, "tilewidth": TILE_SIZE,
    "orientation": "orthogonal", "renderorder": "right-down",
    "type": "map", "version": "1.10",
    "infinite": False, "nextlayerid": 5, "nextobjectid": 1,
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
    ]
}

out = "assets/tilemaps/ilha.json"
with open(out,"w",encoding="utf-8") as f:
    json.dump(tilemap, f, separators=(",",":"))
print(f"Guardado: {out}")
