# 🏝️ STRANDED — Escapa da Ilha

## Elementos do Grupo

| Nome | Número |
|------|--------|
| Artur Salgado | EI 33385 |
| *(preencher)* | *(preencher)* |

---

## Versão de Phaser

**Phaser 3.80** — incluído via **CDN** no `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
```

---

## Descrição do Jogo

**Género:** Top-down Adventure / Survival

**Premissa:** Acordas naufragado numa ilha. A tua jangada está em pedaços ao lado dos destroços. Reconstrói-a e foge.

**Objetivo (condição de vitória):** Construir a jangada juntando os 3 recursos espalhados pela ilha e interagir com os destroços para partir.

### Recursos a juntar

| Recurso | Quantidade | Fonte | Zona |
|---------|-----------|-------|------|
| 🪵 Madeira | 5 | Cortar árvores (ESPAÇO) | Floresta |
| 🪢 Corda | 3 | Destroços / baús na praia | Praia oposta |
| ⛵ Vela | 1 | Drop do **boss skeleton** | Zona rochosa |

### Regras

- Cada zona tem **guardiões** (goblins ou skeletons) que protegem o recurso.
- Stats (❤️ HP / 🍖 Fome / 💧 Sede / ⚡ Energia) descem devagar — comida e bebida servem para curar entre confrontos.
- Morrer faz respawn na praia inicial perdendo **90 % dos materiais**; tens **1 vida extra por run**.
- Quando tiveres tudo, voltas aos destroços → carregas **E** → mini-cutscene final → 🏆 **Vitória**.

---

## Sequência de ações até finalizar o jogo

1. Acordas na **praia inicial** ao lado dos destroços da jangada (slots vazios visíveis).
2. Atravessas para a **floresta** e cortas árvores → +5 🪵 Madeira (combate com goblins).
3. Voltas aos destroços e a jangada começa a encher-se visualmente (1º slot ✓).
4. Vais à **praia oposta** → derrotas os guardiões → abres destroços/baús → +3 🪢 Corda.
5. Voltas → 2º slot ✓ — a jangada está quase pronta.
6. Diriges-te à **zona rochosa** → enfrentas o **boss skeleton** → +1 ⛵ Vela.
7. Voltas aos destroços → **E** → cutscene de partida → **VictoryScene** com estatísticas (tempo, mortes, kills).

---

## Jogabilidade / Controlos

| Tecla | Ação |
|-------|------|
| **WASD** / **Setas** | Mover o jogador |
| **SHIFT** | Correr (consome energia) |
| **ESPAÇO** | Atacar / cortar árvore |
| **E** | Usar item / interagir (destroços, baús, jangada) |
| **Q** | Abrir/fechar o painel de objetivos (quest log) |
| **1 – 8** | Selecionar slot da hotbar |
| **ESC** | Pausa |
| **R** | Reiniciar (no ecrã de Game Over / Vitória) |

---

## Funcionalidades implementadas

- Mapa tilemap procedural com ilha rodeada de água, biomas (relva, floresta, areia, rochoso) e zonas-objetivo
- Jogador animado com múltiplos spritesheets sobrepostos (base + cabelo + ferramentas)
- Inimigos com IA de perseguição: goblins (3 tiers) + skeletons + boss
- Inventário com 8 slots e hotbar visual
- Sistema de stats (HP / Fome / Sede / Energia)
- Sistema de quest com 3 objetivos rastreáveis (painel HUD + toasts + tecla Q)
- Drops de recursos por categoria (árvores, destroços, inimigos)
- Mini-cutscene final ao escapar (tween de câmara + fade)
- Death loop com respawn e 1 vida extra por run
- Suporte multilíngue (PT + EN) com seletor no menu
- Sons procedurais via Web Audio API

---

## Como Executar

### Opção 1 — Live Server (VS Code)
1. Abrir a pasta do projeto no VS Code
2. Instalar extensão **Live Server**
3. Clicar em **Go Live**
4. Abrir `http://127.0.0.1:5500` no browser

### Opção 2 — npx serve
```bash
npx serve .
```
Abrir `http://localhost:3000`.

### Opção 3 — Python
```bash
python -m http.server 8080
```
Abrir `http://localhost:8080`.

> ⚠️ Não funciona com `file://` — precisa de servidor HTTP local.

---

## Aspectos Multimédia

### Imagens / Spritesheets

| Asset | Formato | Resolução | Origem |
|-------|---------|-----------|--------|
| Tileset Sunnyside World | PNG | 1024×1024 px | [Sunnyside World (itch.io)](https://danieldiggle.itch.io/sunnyside) — licença gratuita |
| Spritesheets do jogador (base, cabelo, ferramentas) | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Spritesheets de goblin e skeleton | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Ícones de itens (madeira, corda, vela, comida, ferramentas) | PNG | 16×16 px | Sunnyside World asset pack |
| HUD (barras, slots de inventário, quest panel) | PNG | 16–48 px | Sunnyside World asset pack |

**Justificação de resolução:** Os sprites de 96×64 são proporcionais ao zoom da câmara (×2.5), resultando em ~240×160 px no ecrã — proporcional ao uso, sem PNGs sobredimensionados.

### Áudio

| Som | Tipo | Geração |
|-----|------|---------|
| Apanhar item | Efeito | Procedural (Web Audio API — sine 880→1320 Hz) |
| Dano recebido | Efeito | Procedural (sawtooth com pitch descendente) |
| Morte do jogador | Efeito | Procedural (3 tons descendentes) |
| Ataque | Efeito | Procedural (ruído branco com filtro bandpass) |
| Inimigo atingido | Efeito | Procedural (square 600→200 Hz) |
| Clique de menu | Efeito | Procedural (sine 660 Hz curto) |
| Vitória | Efeito | Procedural (fanfarra Dó-Mi-Sol-Dó') |

Os sons são gerados em tempo real via **Web Audio API** sem ficheiros externos, evitando dependências e mantendo o total de assets abaixo de 10 MB.

### Internacionalização (i18n)

- **2 línguas:** Português (PT) e Inglês (EN)
- Ficheiros JSON em `assets/i18n/pt.json` e `assets/i18n/en.json`
- Seletor de língua acessível no menu principal (botões PT / EN)
- Toda a UI textual traduzida: menu, HUD, quest log, Game Over, Vitória, dicas
- Sistema centralizado em `src/systems/I18n.js` — sem strings duplicadas no código

---

## Estrutura do Projeto

```
phaser_tecmul/
├── index.html              # Carrega Phaser 3 via CDN
├── README.md
├── generate_map.py         # Script Python para gerar ilha.json
├── assets/
│   ├── i18n/               # Traduções PT / EN
│   ├── tilemaps/           # Mapa Tiled exportado (ilha.json)
│   ├── tilesets/           # Tileset Sunnyside
│   ├── spritesheets/       # Sprites do player e inimigos
│   └── images/             # Ícones de itens e HUD
└── src/
    ├── main.js             # Config Phaser + registo de cenas
    ├── scenes/             # Boot, Preload, Menu, Game, HUD, Pause, GameOver, Victory
    ├── objects/            # Player, Goblin, Skeleton, CollectibleItem, Boss (a criar)
    └── systems/            # I18n, Inventory, PlayerStats, Quest (a criar), SoundManager
```
