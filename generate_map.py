"""
generate_map.py v7 — Gerador procedural de ilha (Sunnyside World 16px)

Melhorias face à v6:
  - Ruído value-noise por octaves (elevation + moisture) → costa e biomas orgânicos.
  - Biomas: água profunda, água rasa, praia, pradaria, floresta, rocha.
  - Costa com autotiling (marching-squares) usando os tiles "pond" de areia↔água.
  - 6 layers (chao, transicoes, decoracao, colisao, objetos, acima) + objectgroup "spawns".
  - Árvores divididas em tronco (colidível, `objetos`) + copa (`acima`, por cima do jogador).
  - POIs: acampamento central seguro, ruína de pedra, doca de madeira na praia.
  - Caminhos de terra ligam POIs (BFS sobre terreno caminhável).
  - Spawns (jogador/itens/inimigos/POIs) escritos como objetos editáveis no Tiled.

Mapeamento de tiles confirmado por render_inspect.py (grids anotados).
gid = row*64 + col + 1 (COLS=64, tileset 1024x1024 = 4096 tiles).
"""
import json, random, math
from collections import deque

# ─── CONFIG ───────────────────────────────────────────────────────────────────
MAP_W, MAP_H = 120, 90
TILE         = 16
COLS         = 64
SEED         = 7

def tid(row, col):
    return row * COLS + col + 1

# ─── PALETA DE TILES (gids verificados via render_inspect.py) ──────────────────
GRASS       = 66
GRASS_VAR   = [67, 193, 196, 258]                        # variantes subtis de relva
SAND        = 68
SAND_VAR    = [70, 72, 73, 74]                           # areias com textura/seixos
WATER       = 69
ROCK_GND    = 68                                         # chão pedregoso ~ areia/terra

# Decoração de relva
DECO_BUSH     = [92, 93, 94, 95, 114, 115]
DECO_FLOWER   = [2100, 2101, 2102, 2103]
DECO_SPROUT   = [821, 822, 823, 824, 825, 884, 885, 886]
# Decoração de areia
DECO_PEBBLE   = [143, 144, 288, 289, 290, 291]
# Decoração de água
DECO_SPARKLE  = [1420, 1421, 1422, 1423]

# Árvores (1 largura × 2 altura: copa + tronco)
TREE_CANOPY = [121, 122, 123]
TREE_TRUNK  = [185, 186, 187]
# Rochas pequenas
ROCK        = [1464, 1976, 1592]
# Estruturas
RUIN_WALL   = [1389, 1390, 1391, 1392]
RUIN_TOP    = [1325, 1326, 1327, 1328]
DOCK        = [578, 579, 580, 581]
CRATE       = 586
# Caminho: trilho de areia através da relva
PATH_DIRT   = 68

# Costa: tiles "pond" de AREIA com bordo de ÁGUA (areia=corpo, azul=borda).
# Marching-squares dos 4 lados cardeais que são ÁGUA: N=1, E=2, S=4, W=8.
# Tiles lidos em inspect_H_sandwater.png:
#   407=água a N (areia aponta ↑) | 341=água a S | corners convexos:
#   404=N+W, 410=N+E, 340=S+W, 342=S+E. gid 0 => mantém areia base.
COAST = {
    0b0000: 0,
    0b0001: 407, 0b0010: 342, 0b0100: 341, 0b1000: 340,   # N, E≈, S, W≈
    0b0011: 410, 0b1001: 404, 0b0110: 342, 0b1100: 340,   # N+E, N+W, S+E, S+W
    0b0101: 0,   0b1010: 0,                                # istmos finos → base
    0b0111: 0,   0b1011: 0,   0b1101: 0,   0b1110: 0, 0b1111: 0,
}

# ─── RUÍDO VALUE-NOISE (octaves) ───────────────────────────────────────────────
def _smooth(t):
    return t * t * (3 - 2 * t)

def make_lattice(seed, lw, lh):
    r = random.Random(seed)
    return [[r.random() for _ in range(lw)] for _ in range(lh)]

def sample(lattice, lw, lh, x, y):
    x0 = int(math.floor(x)); y0 = int(math.floor(y))
    fx = _smooth(x - x0);    fy = _smooth(y - y0)
    def L(ix, iy): return lattice[iy % lh][ix % lw]
    v00 = L(x0, y0);     v10 = L(x0 + 1, y0)
    v01 = L(x0, y0 + 1); v11 = L(x0 + 1, y0 + 1)
    return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy

def fractal(seed, octaves=4, base_freq=0.06):
    lw = lh = 64
    lattices = [make_lattice(seed + i * 101, lw, lh) for i in range(octaves)]
    def noise(x, y):
        total = 0.0; amp = 1.0; freq = base_freq; norm = 0.0
        for i in range(octaves):
            total += amp * sample(lattices[i], lw, lh, x * freq, y * freq)
            norm += amp; amp *= 0.5; freq *= 2.0
        return total / norm
    return noise

# ─── TERRENO ───────────────────────────────────────────────────────────────────
DEEP, SHALLOW, SAND_T, GRASS_T, FOREST_T, ROCK_T = range(6)

cx, cy = MAP_W / 2, MAP_H / 2
rx, ry = MAP_W * 0.40, MAP_H * 0.40

elev_noise  = fractal(SEED,       octaves=4, base_freq=0.055)
moist_noise = fractal(SEED + 555, octaves=3, base_freq=0.045)

def island_value(x, y):
    dx = (x - cx) / rx
    dy = (y - cy) / ry
    d = math.sqrt(dx * dx + dy * dy)
    n = elev_noise(x, y)
    return (n * 0.95 + 0.25) - d

terrain = [[DEEP] * MAP_W for _ in range(MAP_H)]
for y in range(MAP_H):
    for x in range(MAP_W):
        e = island_value(x, y)
        if e < -0.18:
            terrain[y][x] = DEEP
        elif e < -0.02:
            terrain[y][x] = SHALLOW
        elif e < 0.06:
            terrain[y][x] = SAND_T
        else:
            m = moist_noise(x, y)
            if e > 0.42 and m < 0.42:
                terrain[y][x] = ROCK_T
            elif m > 0.56:
                terrain[y][x] = FOREST_T
            else:
                terrain[y][x] = GRASS_T

# Clareira segura no centro (acampamento)
CLEAR_R = 5
for y in range(MAP_H):
    for x in range(MAP_W):
        if (x - cx) ** 2 + (y - cy) ** 2 < CLEAR_R ** 2:
            if terrain[y][x] in (GRASS_T, FOREST_T, ROCK_T):
                terrain[y][x] = GRASS_T

def is_land(t):  return t in (SAND_T, GRASS_T, FOREST_T, ROCK_T)
def is_water(t): return t in (DEEP, SHALLOW)
def walkable(x, y):
    return 0 <= x < MAP_W and 0 <= y < MAP_H and is_land(terrain[y][x])

# ─── LAYERS ─────────────────────────────────────────────────────────────────────
chao       = [[0] * MAP_W for _ in range(MAP_H)]
transicoes = [[0] * MAP_W for _ in range(MAP_H)]
decoracao  = [[0] * MAP_W for _ in range(MAP_H)]
colisao    = [[0] * MAP_W for _ in range(MAP_H)]
objetos    = [[0] * MAP_W for _ in range(MAP_H)]
acima      = [[0] * MAP_W for _ in range(MAP_H)]

rng = random.Random(SEED + 9)

# 1) CHÃO base por bioma
for y in range(MAP_H):
    for x in range(MAP_W):
        t = terrain[y][x]
        if t in (DEEP, SHALLOW):
            chao[y][x] = WATER
        elif t == SAND_T:
            chao[y][x] = SAND if rng.random() > 0.10 else rng.choice(SAND_VAR)
        elif t == ROCK_T:
            chao[y][x] = ROCK_GND
        else:
            chao[y][x] = GRASS if rng.random() > 0.06 else rng.choice(GRASS_VAR)

# 2) COSTA — autotile nas células de AREIA que tocam ÁGUA
def water_at(x, y):
    return (not (0 <= x < MAP_W and 0 <= y < MAP_H)) or is_water(terrain[y][x])

for y in range(MAP_H):
    for x in range(MAP_W):
        if terrain[y][x] != SAND_T:
            continue
        mask = 0
        if water_at(x, y - 1): mask |= 0b0001
        if water_at(x + 1, y): mask |= 0b0010
        if water_at(x, y + 1): mask |= 0b0100
        if water_at(x - 1, y): mask |= 0b1000
        gid = COAST.get(mask, 0)
        if gid:
            transicoes[y][x] = gid

# 3) DECORAÇÃO
deco_n = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        t = terrain[y][x]
        if t == GRASS_T:
            r = rng.random()
            if r < 0.05:   decoracao[y][x] = rng.choice(DECO_FLOWER); deco_n += 1
            elif r < 0.11: decoracao[y][x] = rng.choice(DECO_SPROUT); deco_n += 1
            elif r < 0.15: decoracao[y][x] = rng.choice(DECO_BUSH);   deco_n += 1
        elif t == FOREST_T:
            if rng.random() < 0.12:
                decoracao[y][x] = rng.choice(DECO_SPROUT + DECO_BUSH); deco_n += 1
        elif t == SAND_T:
            if rng.random() < 0.05:
                decoracao[y][x] = rng.choice(DECO_PEBBLE); deco_n += 1
        elif t == DEEP:
            if rng.random() < 0.015:
                decoracao[y][x] = rng.choice(DECO_SPARKLE); deco_n += 1

# 4) OBJETOS — árvores (tronco+copa), rochas. Evitar clareira central.
def near_center(x, y, r):
    return (x - cx) ** 2 + (y - cy) ** 2 < r ** 2

def place_tree(x, y):
    if y - 1 < 0: return False
    if objetos[y][x] or objetos[y - 1][x]: return False
    i = rng.randrange(len(TREE_TRUNK))
    objetos[y][x] = TREE_TRUNK[i]
    acima[y - 1][x] = TREE_CANOPY[i]
    colisao[y][x] = TREE_TRUNK[i]
    return True

tree_n = rock_n = 0
for y in range(MAP_H):
    for x in range(MAP_W):
        t = terrain[y][x]
        if near_center(x, y, CLEAR_R + 2):
            continue
        if t == FOREST_T and rng.random() < 0.32:
            if place_tree(x, y): tree_n += 1
        elif t == GRASS_T and rng.random() < 0.03:
            if place_tree(x, y): tree_n += 1
        elif t == ROCK_T and rng.random() < 0.18:
            if not objetos[y][x]:
                objetos[y][x] = rng.choice(ROCK); colisao[y][x] = 1; rock_n += 1
        elif t == GRASS_T and rng.random() < 0.01:
            if not objetos[y][x]:
                objetos[y][x] = rng.choice(ROCK); colisao[y][x] = 1; rock_n += 1

# 5) COLISÃO — água
for y in range(MAP_H):
    for x in range(MAP_W):
        if is_water(terrain[y][x]):
            colisao[y][x] = WATER

# ─── POIs ────────────────────────────────────────────────────────────────────
pois = []

camp_x, camp_y = int(cx), int(cy)
decoracao[camp_y][camp_x] = CRATE
pois.append((camp_x, camp_y, 'acampamento'))

def find_spot(pred, tries=400, min_center=18):
    for _ in range(tries):
        x = rng.randint(6, MAP_W - 7)
        y = rng.randint(6, MAP_H - 7)
        if (x - cx) ** 2 + (y - cy) ** 2 < min_center ** 2:
            continue
        if pred(x, y):
            return x, y
    return None

def area_clear(x, y, w, h):
    for j in range(h):
        for i in range(w):
            if not walkable(x + i, y + j): return False
            if objetos[y + j][x + i]: return False
    return True

ruin = find_spot(lambda x, y: terrain[y][x] in (GRASS_T, ROCK_T) and area_clear(x, y, 3, 2))
if ruin:
    rx0, ry0 = ruin
    for i in range(3):
        objetos[ry0 + 1][rx0 + i] = RUIN_WALL[i % len(RUIN_WALL)]
        colisao[ry0 + 1][rx0 + i] = 1
        acima[ry0][rx0 + i] = RUIN_TOP[i % len(RUIN_TOP)]
    pois.append((rx0 + 1, ry0 + 1, 'ruina'))

def beach_edge(x, y):
    return terrain[y][x] == SAND_T and any(
        water_at(x + dx, y + dy) for dx, dy in ((0,1),(0,-1),(1,0),(-1,0)))
dock = find_spot(lambda x, y: beach_edge(x, y), min_center=20)
if dock:
    dx0, dy0 = dock
    for j in range(2):
        if 0 <= dy0 + j < MAP_H:
            decoracao[dy0 + j][dx0] = DOCK[j % len(DOCK)]
    pois.append((dx0, dy0, 'doca'))

# ─── CAMINHOS (BFS liga acampamento a cada POI) ───────────────────────────────
def bfs_path(start, goal):
    sx, sy = start; gx, gy = goal
    q = deque([(sx, sy)]); prev = {(sx, sy): None}
    while q:
        x, y = q.popleft()
        if (x, y) == (gx, gy): break
        for dxx, dyy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x + dxx, y + dyy
            if walkable(nx, ny) and (nx, ny) not in prev:
                prev[(nx, ny)] = (x, y); q.append((nx, ny))
    if (gx, gy) not in prev: return []
    path = []; cur = (gx, gy)
    while cur: path.append(cur); cur = prev[cur]
    return path

path_n = 0
for (px_, py_, label) in pois:
    if label == 'acampamento': continue
    for (x, y) in bfs_path((camp_x, camp_y), (px_, py_)):
        if not objetos[y][x] and decoracao[y][x] not in DOCK:
            decoracao[y][x] = PATH_DIRT; path_n += 1

# ─── SPAWNS (objectgroup) ──────────────────────────────────────────────────────
def to_px(c): return c * TILE + TILE // 2

objects = []
oid = 1
def add_obj(x, y, name, props=None):
    global oid
    o = {"id": oid, "name": name, "type": name, "x": to_px(x), "y": to_px(y),
         "width": 0, "height": 0, "point": True, "visible": True, "rotation": 0}
    if props:
        o["properties"] = [{"name": k, "type": "string", "value": str(v)}
                           for k, v in props.items()]
    objects.append(o); oid += 1

add_obj(camp_x, camp_y, "player_start")

ITEM_LIST = [("wood",3),("rock",2),("carrot",2),("potato",2),("wheat",2),
             ("fish",2),("egg",2),("axe",1),("pickaxe",1),("water",3),
             ("water",2),("wood",2),("rock",3),("sword",1)]
ring = [(dx, dy) for dx in range(-6, 7) for dy in range(-6, 7)
        if 3 <= (dx*dx+dy*dy) ** 0.5 <= 6]
rng.shuffle(ring)
for (itemId, qty), (dx, dy) in zip(ITEM_LIST, ring):
    ix, iy = camp_x + dx, camp_y + dy
    if walkable(ix, iy) and not objetos[iy][ix]:
        add_obj(ix, iy, "item", {"itemId": itemId, "qty": qty})

enemy_n = 0
for _ in range(10):
    spot = find_spot(lambda x, y: terrain[y][x] in (GRASS_T, FOREST_T) and not objetos[y][x],
                     min_center=16)
    if spot:
        kind = "skeleton" if rng.random() < 0.35 else "goblin"
        add_obj(spot[0], spot[1], "enemy", {"kind": kind, "tier": "1"})
        enemy_n += 1

for (px_, py_, label) in pois:
    add_obj(px_, py_, "poi", {"label": label})

# ─── ESTATÍSTICAS ──────────────────────────────────────────────────────────────
land_n = sum(1 for y in range(MAP_H) for x in range(MAP_W) if is_land(terrain[y][x]))
print(f"Mapa {MAP_W}x{MAP_H} | terra:{land_n} arvores:{tree_n} rochas:{rock_n} "
      f"deco:{deco_n} caminho:{path_n} inimigos:{enemy_n} POIs:{len(pois)}")
print(f"Spawn jogador: pixel ({to_px(camp_x)},{to_px(camp_y)})")

# ─── ESCREVER TILEMAP JSON ─────────────────────────────────────────────────────
def flat(g): return [t for row in g for t in row]

def tile_layer(lid, name, grid, visible=True):
    return {"id": lid, "name": name, "type": "tilelayer", "x": 0, "y": 0,
            "width": MAP_W, "height": MAP_H, "visible": visible, "opacity": 1,
            "data": flat(grid)}

tilemap = {
    "height": MAP_H, "width": MAP_W,
    "tileheight": TILE, "tilewidth": TILE,
    "orientation": "orthogonal", "renderorder": "right-down",
    "type": "map", "version": "1.10", "tiledversion": "1.10.2",
    "infinite": False, "nextlayerid": 8, "nextobjectid": oid,
    "tilesets": [{
        "columns": 64, "firstgid": 1,
        "image": "../../tilesets/spr_tileset_sunnysideworld_16px.png",
        "imageheight": 1024, "imagewidth": 1024,
        "margin": 0, "name": "sunnyside",
        "spacing": 0, "tilecount": 4096,
        "tileheight": 16, "tilewidth": 16
    }],
    "layers": [
        tile_layer(1, "chao",       chao),
        tile_layer(2, "transicoes", transicoes),
        tile_layer(3, "decoracao",  decoracao),
        tile_layer(4, "colisao",    colisao, visible=False),
        tile_layer(5, "objetos",    objetos),
        tile_layer(6, "acima",      acima),
        {"id": 7, "name": "spawns", "type": "objectgroup",
         "x": 0, "y": 0, "visible": True, "opacity": 1,
         "draworder": "topdown", "objects": objects},
    ]
}

out = "assets/tilemaps/ilha.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(tilemap, f, separators=(",", ":"))
print(f"Guardado: {out}")
