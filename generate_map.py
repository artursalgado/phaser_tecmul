"""
Gerador de mapa v4 — tile IDs conservadores (linhas 0-16 do tileset Sunnyside 64 cols)
Novidades: biomas por ruído, floresta densa, 5 POIs, caminhos curvos, orla de areia detalhada
"""
import json, random, math, copy
from collections import deque

random.seed(99)

# ---------------------------------------------------------------------------
# TILESET spr_tileset_sunnysideworld_16px.png — 64 colunas, 1-indexed (Tiled)
# ---------------------------------------------------------------------------
def T(row, col):
    return row * 64 + col + 1

# ── CHÃO ─────────────────────────────────────────────────────────────────────
# Oceano
OCEAN_DEEP  = T(9, 0)
OCEAN_MID   = T(9, 1)
OCEAN_SHORE = T(9, 2)

# Areia/praia — linha 7
SAND_A = T(7, 0)
SAND_B = T(7, 1)
SAND_C = T(7, 2)
SAND_D = T(7, 3)

# Relva — linha 0
GRASS_A = T(0, 0)
GRASS_B = T(0, 1)
GRASS_C = T(0, 2)
GRASS_D = T(0, 3)

# Terra/caminho — linha 3
DIRT_A = T(3, 0)
DIRT_B = T(3, 1)
DIRT_C = T(3, 2)

# Solo agrícola — linha 4
SOIL_A = T(4, 0)
SOIL_B = T(4, 1)

# Água interior — linha 10
LAKE_DEEP  = T(10, 0)
LAKE_MID   = T(10, 1)
LAKE_SHORE = T(10, 2)

# ── DECORAÇÃO ────────────────────────────────────────────────────────────────
# Árvores (topo / base) — linhas 1-2
TREE_A = (T(1, 0), T(2, 0))
TREE_B = (T(1, 2), T(2, 2))
TREE_C = (T(1, 4), T(2, 4))
TREE_D = (T(1, 6), T(2, 6))   # árvore de fruto
TREE_E = (T(1, 8), T(2, 8))   # árvore outonal

TREES = [TREE_A, TREE_B, TREE_C, TREE_D, TREE_E]

# Arbustos — linha 5
BUSH_A = T(5, 0)
BUSH_B = T(5, 2)
BUSH_C = T(5, 4)

# Flores / ervas — linha 0 cols 4-7
FLOWER_A   = T(0, 4)
FLOWER_B   = T(0, 5)
FLOWER_C   = T(0, 6)
GRASS_TALL = T(0, 7)

# Cogumelos — linha 6
SHROOM_A = T(6, 0)
SHROOM_B = T(6, 1)

# Rochas — linha 8
ROCK_A   = T(8, 0)
ROCK_B   = T(8, 1)
ROCK_C   = T(8, 2)
ROCK_D   = T(8, 3)
ROCK_BIG = T(8, 4)

ROCKS = [ROCK_A, ROCK_B, ROCK_C, ROCK_D, ROCK_A, ROCK_B, ROCK_BIG]

# Praia — linha 7 cols 4-7
SHELL_A  = T(7, 4)
SHELL_B  = T(7, 5)
SEAWEED  = T(7, 6)
STARFISH = T(7, 7)

# Estruturas — linhas 11-15
WALL_H  = T(11, 0)
WALL_V  = T(11, 1)
WALL_C  = T(11, 2)
FENCE_H = T(12, 0)
FENCE_V = T(12, 1)
FENCE_C = T(12, 2)
CHEST   = T(13, 0)
BARREL  = T(13, 1)
FIRE_LG = T(14, 0)
FIRE_SM = T(14, 1)
WELL    = T(14, 2)
SIGN    = T(14, 3)
TORCH   = T(15, 0)
GRAVE   = T(15, 1)
CROSS   = T(15, 2)
PILLAR  = T(15, 3)

# ---------------------------------------------------------------------------
W, H = 80, 60

def make_grid(val=0):
    return [[val] * W for _ in range(H)]

# ── Carregar JSON original para extrair a forma/máscara da ilha ──────────────
with open('assets/tilemaps/ilha.json', 'r', encoding='utf-8') as f:
    orig = json.load(f)

orig_flat = orig['layers'][0]['data']
orig_chao = [orig_flat[r * W:(r + 1) * W] for r in range(H)]

# ── Máscara de ilha via BFS a partir das bordas ──────────────────────────────
visited = [[False] * W for _ in range(H)]
queue   = deque()
for c in range(W):
    for r_edge in [0, H - 1]:
        visited[r_edge][c] = True
        queue.append((r_edge, c))
for r in range(H):
    for c_edge in [0, W - 1]:
        visited[r][c_edge] = True
        queue.append((r, c_edge))

ocean_val = orig_chao[0][0]
while queue:
    r, c = queue.popleft()
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < H and 0 <= nc < W and not visited[nr][nc]:
            if orig_chao[nr][nc] == ocean_val or orig_chao[nr][nc] == 0:
                visited[nr][nc] = True
                queue.append((nr, nc))

island_mask = [[not visited[r][c] for c in range(W)] for r in range(H)]

def is_island(r, c):
    return 0 <= r < H and 0 <= c < W and island_mask[r][c]

# ── Distância ao oceano (BFS) ─────────────────────────────────────────────────
dist = [[9999] * W for _ in range(H)]
queue = deque()
for r in range(H):
    for c in range(W):
        if not island_mask[r][c]:
            dist[r][c] = 0
            queue.append((r, c))
while queue:
    r, c = queue.popleft()
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < H and 0 <= nc < W and dist[nr][nc] > dist[r][c] + 1:
            dist[nr][nc] = dist[r][c] + 1
            queue.append((nr, nc))

max_d = max(dist[r][c] for r in range(H) for c in range(W) if island_mask[r][c])
print(f"Ilha carregada — dist máx ao oceano: {max_d}")

# ── Ruído suave para biomas ───────────────────────────────────────────────────
def snoise(r, c, scale=0.12, sx=0, sy=0):
    x = (c + sx) * scale
    y = (r + sy) * scale
    return (math.sin(x) * math.cos(y) + math.cos(x * 0.71) * math.sin(y * 1.31)) * 0.5

# ── Centro da ilha ────────────────────────────────────────────────────────────
island_cells = [(r, c) for r in range(H) for c in range(W) if island_mask[r][c]]
CR = sum(r for r, c in island_cells) // len(island_cells)
CC = sum(c for r, c in island_cells) // len(island_cells)
PLAYER_ROW, PLAYER_COL = CR, CC
print(f"Centro da ilha / spawn do jogador: ({CR},{CC}) -> pixel ({CC*16},{CR*16})")

# ── Spawn de JavaScript — actualizar GameScene.js com coordenadas reais
SPAWN_X = CC * 16 + 8
SPAWN_Y = CR * 16 + 8

def near_spawn(r, c, rad=7):
    return abs(r - PLAYER_ROW) <= rad and abs(c - PLAYER_COL) <= rad

# ---------------------------------------------------------------------------
# GERAR CHÃO COM BIOMAS
# ---------------------------------------------------------------------------
chao = make_grid(OCEAN_DEEP)

for r in range(H):
    for c in range(W):
        if not island_mask[r][c]:
            # Oceano
            has_neighbor = any(is_island(r+dr, c+dc) for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)])
            chao[r][c] = OCEAN_SHORE if has_neighbor else OCEAN_DEEP
            continue

        d  = dist[r][c]
        n1 = snoise(r, c, 0.13, 5,  3)
        n2 = snoise(r, c, 0.20, 17, 31)
        rv = random.random()

        if d == 1:
            chao[r][c] = SAND_A
        elif d == 2:
            chao[r][c] = SAND_B if rv < 0.55 else SAND_A
        elif d == 3:
            chao[r][c] = SAND_B if rv < 0.35 else (SAND_C if rv < 0.55 else GRASS_A)
        elif d <= 5:
            chao[r][c] = GRASS_A if rv < 0.5 else (SAND_C if rv < 0.7 else GRASS_B)
        else:
            t = (d / max_d) + n1 * 0.35 + n2 * 0.15
            if t < 0.22:
                chao[r][c] = GRASS_A if rv < 0.55 else GRASS_B
            elif t < 0.44:
                chao[r][c] = GRASS_B if rv < 0.5  else GRASS_C
            elif t < 0.66:
                chao[r][c] = GRASS_C if rv < 0.45 else GRASS_D
            else:
                chao[r][c] = GRASS_D if rv < 0.6  else DIRT_C

# ---------------------------------------------------------------------------
# DECORAÇÃO E COLISÃO
# ---------------------------------------------------------------------------
deco  = make_grid(0)
colis = make_grid(0)
blocked = make_grid(False)

def can_place(r, c, rad=0):
    if not is_island(r, c): return False
    if blocked[r][c]: return False
    if near_spawn(r, c): return False
    for dr in range(-rad, rad + 1):
        for dc in range(-rad, rad + 1):
            nr, nc = r + dr, c + dc
            if 0 <= nr < H and 0 <= nc < W and blocked[nr][nc]:
                return False
    return True

def mark_blocked(r, c, rad=1):
    for dr in range(-rad, rad + 1):
        for dc in range(-rad, rad + 1):
            nr, nc = r + dr, c + dc
            if 0 <= nr < H and 0 <= nc < W:
                blocked[nr][nc] = True

# ── ÁRVORES ──────────────────────────────────────────────────────────────────
planted = 0
for _ in range(5000):
    r = random.randint(4, H - 4)
    c = random.randint(4, W - 4)
    if dist[r][c] < 5: continue
    if not can_place(r, c, 1): continue
    if not is_island(r - 1, c) or blocked[r - 1][c]: continue
    # Mais árvores no interior (floresta)
    prob = 0.5 + (dist[r][c] / max_d) * 0.5
    if random.random() > prob: continue
    tt, tb = random.choice(TREES)
    deco[r - 1][c] = tt
    deco[r][c]     = tb
    colis[r][c]    = tb
    mark_blocked(r, c, 2)
    mark_blocked(r - 1, c, 1)
    planted += 1
    if planted >= 160: break
print(f"Árvores: {planted}")

# ── ROCHAS ────────────────────────────────────────────────────────────────────
rocks = 0
for _ in range(3000):
    r = random.randint(3, H - 3)
    c = random.randint(3, W - 3)
    if dist[r][c] < 3: continue
    if not can_place(r, c, 1): continue
    rk = random.choice(ROCKS)
    deco[r][c]  = rk
    colis[r][c] = rk
    mark_blocked(r, c, 1)
    rocks += 1
    if rocks >= 70: break
print(f"Rochas: {rocks}")

# ── ARBUSTOS ─────────────────────────────────────────────────────────────────
bushes = 0
for _ in range(4000):
    r = random.randint(3, H - 3)
    c = random.randint(3, W - 3)
    if dist[r][c] < 4: continue
    if not is_island(r, c) or blocked[r][c]: continue
    if near_spawn(r, c): continue
    deco[r][c] = random.choice([BUSH_A, BUSH_B, BUSH_C, BUSH_A, BUSH_B])
    blocked[r][c] = True
    bushes += 1
    if bushes >= 120: break
print(f"Arbustos: {bushes}")

# ── COGUMELOS ─────────────────────────────────────────────────────────────────
shrooms = 0
for r in range(H):
    for c in range(W):
        if not is_island(r, c) or blocked[r][c]: continue
        if dist[r][c] < 10: continue
        if near_spawn(r, c, 5): continue
        if random.random() < 0.05:
            deco[r][c] = random.choice([SHROOM_A, SHROOM_B])
            blocked[r][c] = True
            shrooms += 1
print(f"Cogumelos: {shrooms}")

# ── FLORES / ERVAS ────────────────────────────────────────────────────────────
flowers = 0
for r in range(H):
    for c in range(W):
        if not is_island(r, c) or blocked[r][c]: continue
        if dist[r][c] < 4: continue
        if random.random() < 0.12:
            deco[r][c] = random.choice([FLOWER_A, FLOWER_B, FLOWER_C, GRASS_TALL, FLOWER_A])
            flowers += 1
print(f"Flores/ervas: {flowers}")

# ── PRAIA ─────────────────────────────────────────────────────────────────────
beach_deco = 0
for r in range(H):
    for c in range(W):
        if not is_island(r, c) or blocked[r][c]: continue
        if dist[r][c] > 3: continue
        if random.random() < 0.10:
            deco[r][c] = random.choice([SHELL_A, SHELL_B, STARFISH, SEAWEED, SHELL_A])
            beach_deco += 1
print(f"Praia deco: {beach_deco}")

# ---------------------------------------------------------------------------
# CAMINHOS DE TERRA — cruzamento orgânico pelo spawn
# ---------------------------------------------------------------------------
def draw_path(r0, c0, r1, c1, width=1):
    pts, jit = [], 0
    dr = abs(r1 - r0); dc = abs(c1 - c0)
    sr = 1 if r1 > r0 else -1
    sc = 1 if c1 > c0 else -1
    err = dr - dc
    r, c = r0, c0
    while True:
        for wr in range(-width, width + 1):
            for wc in range(-width, width + 1):
                nr, nc = r + wr + jit, c + wc
                if is_island(nr, nc):
                    pts.append((nr, nc))
        if r == r1 and c == c1: break
        e2 = 2 * err
        if e2 > -dc: err -= dc; r += sr
        if e2 <  dr: err += dr; c += sc
        if random.random() < 0.15:
            jit += random.choice([-1, 0, 1])
            jit = max(-1, min(1, jit))
    return pts

path_pts = set()
path_pts.update(draw_path(PLAYER_ROW, 5,          PLAYER_ROW, W - 5, width=1))
path_pts.update(draw_path(5,          PLAYER_COL, H - 5,     PLAYER_COL, width=1))
# Caminho diagonal para ruínas NE
path_pts.update(draw_path(PLAYER_ROW, PLAYER_COL, 10, W - 10, width=1))

for (r, c) in path_pts:
    if is_island(r, c):
        chao[r][c]  = DIRT_A if random.random() < 0.65 else DIRT_B
        deco[r][c]  = 0
        colis[r][c] = 0
        blocked[r][c] = False

print(f"Caminhos: {len(path_pts)} tiles")

# ---------------------------------------------------------------------------
# POIs — Pontos de Interesse
# ---------------------------------------------------------------------------

# ── 1. CABANA INICIAL (norte-oeste do spawn) ─────────────────────────────────
HR, HC = PLAYER_ROW - 10, PLAYER_COL - 4
if all(is_island(HR + dr, HC + dc) for dr in range(5) for dc in range(7)):
    for dr in range(5):
        for dc in range(7):
            r2, c2 = HR + dr, HC + dc
            chao[r2][c2]  = DIRT_B
            deco[r2][c2]  = 0
            colis[r2][c2] = 0
            blocked[r2][c2] = True
    # Paredes
    for dc in range(7):
        r2, c2 = HR, HC + dc
        if is_island(r2, c2): deco[r2][c2] = colis[r2][c2] = WALL_H
    for dr in range(5):
        for cc2 in [HC, HC + 6]:
            r2 = HR + dr
            if is_island(r2, cc2): deco[r2][cc2] = colis[r2][cc2] = WALL_V
    # Porta central sul (2 tiles)
    for dc in range(2, 5):
        r2, c2 = HR + 4, HC + dc
        if is_island(r2, c2): deco[r2][c2] = colis[r2][c2] = 0
    # Interior
    deco[HR+1][HC+1] = FIRE_SM
    deco[HR+1][HC+5] = CHEST;  colis[HR+1][HC+5] = CHEST
    deco[HR+2][HC+5] = BARREL; colis[HR+2][HC+5] = BARREL
    # Poço a leste
    wr2, wc2 = HR + 2, HC + 9
    if is_island(wr2, wc2):
        deco[wr2][wc2] = colis[wr2][wc2] = WELL
        mark_blocked(wr2, wc2, 1)
    # Tochas
    for tr, tc in [(HR - 1, HC), (HR - 1, HC + 6)]:
        if is_island(tr, tc) and not blocked[tr][tc]: deco[tr][tc] = TORCH
    print("Cabana construída")

# ── 2. RUÍNAS ANTIGAS (nordeste) ─────────────────────────────────────────────
RR, RC = 7, W - 16
if is_island(RR, RC) and is_island(RR + 7, RC + 7):
    for dr in range(8):
        for dc in range(8):
            r2, c2 = RR + dr, RC + dc
            if is_island(r2, c2):
                chao[r2][c2] = DIRT_C
                deco[r2][c2] = colis[r2][c2] = 0
                blocked[r2][c2] = True
    walls = [
        (RR,   RC,   WALL_H), (RR, RC+1, WALL_H), (RR, RC+2, WALL_H),
        (RR,   RC+4, WALL_H), (RR, RC+5, WALL_H),
        (RR+1, RC,   WALL_V), (RR+2, RC, WALL_V), (RR+4, RC, WALL_V),
        (RR+6, RC+2, WALL_H), (RR+6, RC+3, WALL_H),
        (RR+1, RC+7, WALL_V), (RR+3, RC+7, WALL_V),
    ]
    for r2, c2, t in walls:
        if is_island(r2, c2): deco[r2][c2] = colis[r2][c2] = t
    # Pilares + baú + lápides
    for pr, pc in [(RR+1, RC+1), (RR+1, RC+6)]:
        if is_island(pr, pc): deco[pr][pc] = colis[pr][pc] = PILLAR
    deco[RR+3][RC+3] = colis[RR+3][RC+3] = CHEST
    for gr, gc in [(RR+5, RC+3), (RR+5, RC+5), (RR+4, RC+6)]:
        if is_island(gr, gc): deco[gr][gc] = colis[gr][gc] = GRAVE
    print("Ruínas construídas")

# ── 3. LAGO INTERIOR (nordeste, interior) ────────────────────────────────────
LR, LC, LRAD = 18, W - 20, 5
lake_tiles = 0
for dr in range(-LRAD - 2, LRAD + 3):
    for dc in range(-LRAD - 2, LRAD + 3):
        r2, c2 = LR + dr, LC + dc
        if not (0 <= r2 < H and 0 <= c2 < W and is_island(r2, c2)): continue
        dl = math.sqrt(dr * dr + dc * dc)
        if dl <= LRAD - 1:
            chao[r2][c2] = LAKE_DEEP
            deco[r2][c2] = colis[r2][c2] = LAKE_DEEP
            blocked[r2][c2] = True
            lake_tiles += 1
        elif dl <= LRAD:
            chao[r2][c2] = LAKE_MID
            deco[r2][c2] = colis[r2][c2] = LAKE_MID
            blocked[r2][c2] = True
            lake_tiles += 1
        elif dl <= LRAD + 1:
            chao[r2][c2] = SAND_B
            deco[r2][c2] = colis[r2][c2] = 0
print(f"Lago: {lake_tiles} tiles")

# ── 4. CAMPO DE CULTIVO (sul do spawn) ───────────────────────────────────────
FR, FC = PLAYER_ROW + 7, PLAYER_COL - 5
if is_island(FR, FC) and is_island(FR + 5, FC + 9):
    for dr in range(5):
        for dc in range(9):
            r2, c2 = FR + dr, FC + dc
            if is_island(r2, c2):
                chao[r2][c2] = SOIL_A if dc % 2 == 0 else SOIL_B
                deco[r2][c2] = colis[r2][c2] = 0
                blocked[r2][c2] = False
    # Cerca
    for dc in range(-1, 10):
        for br in [FR - 1, FR + 5]:
            r2, c2 = br, FC + dc
            if is_island(r2, c2) and not blocked[r2][c2]:
                deco[r2][c2] = colis[r2][c2] = FENCE_H
                blocked[r2][c2] = True
    for dr in range(-1, 7):
        for bc in [FC - 1, FC + 9]:
            r2, c2 = FR + dr, bc
            if is_island(r2, c2) and not blocked[r2][c2]:
                deco[r2][c2] = colis[r2][c2] = FENCE_V
                blocked[r2][c2] = True
    for cr, cc in [(FR-1,FC-1),(FR-1,FC+9),(FR+5,FC-1),(FR+5,FC+9)]:
        if is_island(cr, cc): deco[cr][cc] = colis[cr][cc] = FENCE_C
    # Fogueira ao lado
    if is_island(FR + 2, FC - 3): deco[FR+2][FC-3] = FIRE_LG
    print("Campo de cultivo construído")

# ── 5. CEMITÉRIO (sudoeste) ───────────────────────────────────────────────────
CER, CEC = H - 18, 12
if is_island(CER, CEC):
    for dr in range(6):
        for dc in range(7):
            r2, c2 = CER + dr, CEC + dc
            if is_island(r2, c2):
                chao[r2][c2] = GRASS_D
                deco[r2][c2] = colis[r2][c2] = 0
                blocked[r2][c2] = True
    graves = [
        (CER+1, CEC+1, GRAVE), (CER+1, CEC+3, CROSS), (CER+1, CEC+5, GRAVE),
        (CER+3, CEC+2, CROSS), (CER+3, CEC+4, GRAVE), (CER+4, CEC+1, CROSS),
    ]
    for gr, gc, gt in graves:
        if is_island(gr, gc): deco[gr][gc] = colis[gr][gc] = gt
    for dc in range(7):
        r2 = CER
        if is_island(r2, CEC + dc): deco[r2][CEC+dc] = colis[r2][CEC+dc] = FENCE_H
    print("Cemitério construído")

# ---------------------------------------------------------------------------
# LIMPAR ÁREA DE SPAWN
# ---------------------------------------------------------------------------
SCLEAR = 8
for dr in range(-SCLEAR, SCLEAR + 1):
    for dc in range(-SCLEAR, SCLEAR + 1):
        r2, c2 = PLAYER_ROW + dr, PLAYER_COL + dc
        if 0 <= r2 < H and 0 <= c2 < W and is_island(r2, c2):
            deco[r2][c2] = colis[r2][c2] = 0
            blocked[r2][c2] = False
            if chao[r2][c2] in (LAKE_DEEP, LAKE_MID):
                chao[r2][c2] = GRASS_A

print(f"Spawn limpo em ({PLAYER_ROW},{PLAYER_COL}) -> pixel ({SPAWN_X},{SPAWN_Y})")

# ---------------------------------------------------------------------------
# MONTAR JSON FINAL
# ---------------------------------------------------------------------------
result = copy.deepcopy(orig)

def flat(g):
    out = []
    for row in g: out.extend(row)
    return out

result['layers'][0]['data'] = flat(chao)
result['layers'][1]['data'] = flat(colis)
result['layers'][2]['data'] = flat(deco)

with open('assets/tilemaps/ilha.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, separators=(',', ':'))

dc  = sum(1 for t in flat(deco)  if t != 0)
co  = sum(1 for t in flat(colis) if t != 0)
ct  = len(set(flat(chao)))
print(f"\nFEITO!  decorações={dc}  colisões={co}  tipos_chão={ct}")
print(f"Coordenadas de spawn para GameScene.js: x={SPAWN_X}, y={SPAWN_Y}")

