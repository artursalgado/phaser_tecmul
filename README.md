# 🏝️ STRANDED — Escapa da Ilha

## Elementos do Grupo

| Nome | Número |
|------|--------|
| Artur Salgado | EI 33385 |
| Tiago Silva   | EI 33379 |

---

## Versão de Phaser

**Phaser 3.80** — incluído via **CDN** no `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>
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

1. Acordas na **praia inicial** ao lado dos destroços da jangada (slots vazios visíveis no HUD).
2. Atravessas para a **floresta** → cortas árvores com ESPAÇO → +5 🪵 Madeira (combate com goblins).
3. Voltas aos destroços na doca → carregas **F** → slots da jangada começam a encher.
4. Vais à **praia oposta** → derrotas os guardiões → apanhas corda dos destroços → +3 🪢 Corda.
5. Voltas à doca → **F** → 2º grupo de slots ✓.
6. Diriges-te à **zona rochosa** → enfrentas o **boss skeleton** (barra de vida no topo) → +1 ⛵ Vela.
7. Voltas à doca → **F** → jangada completa! → vai para a zona da jangada → **E** → mini-cutscene → **VictoryScene**.

---

## Jogabilidade / Controlos

| Tecla | Ação |
|-------|------|
| **WASD** / **Setas** | Mover o jogador |
| **SHIFT** | Correr (consome energia) |
| **ESPAÇO** | Atacar / cortar árvore |
| **E** | Usar item / interagir (fugir na jangada) |
| **F** | Entregar recursos na doca |
| **Q** | Abrir/fechar o registo da jangada (quest log) |
| **1 – 8** | Selecionar slot da hotbar |
| **ESC** | Pausa |

---

## Funcionalidades implementadas

### Gameplay
- Mapa tilemap gerado via script Python (ilha 120×90 tiles, biomas: água, areia, relva, floresta, rochoso)
- Jogador animado com múltiplos spritesheets sobrepostos (base + cabelo + ferramentas)
- Sistema de stats: HP / Fome / Sede / Energia com decaimento e recuperação via consumíveis
- Inventário com 8 slots e hotbar visual com seleção por teclado
- Sistema de quest com 3 objetivos rastreáveis — painel HUD com slots visuais + tecla Q
- Death loop: 1 vida extra por run, respawn com -90 % dos materiais recolhidos

### Inimigos
- **Goblin** (3 tiers) — perseguição, patrulha, ataque corpo-a-corpo, drops aleatórios
- **Skeleton** — mais rápido, maior alcance, partículas azul-gelo na morte
- **Boss Skeleton** — HP×4, dano×2, barra de vida no topo do ecrã, zoom-in ao aparecer, drop garantido da vela, explosão de partículas e camera shake intenso na morte
- 12 guardiões fixos posicionados por zona (sem waves cronométricas)

### Câmara & Efeitos
- Follow com lerp suave (0.1) centrado no jogador
- Shake proporcional ao evento (dano leve: 120ms/0.006; boss aparece: zoom ×1.1; boss morre: 500ms/0.012)
- FadeOut antes da mini-cutscene final; FadeIn ao entrar na VictoryScene
- Partículas one-shot em corte de árvore, queda de árvore e morte de inimigo

### Áudio
- 8 efeitos sonoros procedurais via Web Audio API (sem ficheiros .mp3/.ogg)
- Música de fundo ambient em loop (drone 110 Hz + harmónico + tremolo LFO + vento filtrado)
- Suporte a mute com botão no menu

### Outros
- Suporte multilíngue (PT + EN) com seletor no menu principal
- Mini-cutscene de fuga com tween de câmara e fade para a VictoryScene
- Ecrã de pausa (ESC), Game Over e Vitória com estatísticas

---

## Como Executar

### Opção 1 — Python (mais simples)
```bash
python3 -m http.server 8080
```
Abrir `http://localhost:8080`.

### Opção 2 — Live Server (VS Code)
1. Instalar extensão **Live Server**
2. Clicar em **Go Live**
3. Abrir `http://127.0.0.1:5500`

### Opção 3 — npx serve
```bash
npx serve .
```

> ⚠️ Não funciona com `file://` — precisa de servidor HTTP local (ES modules).

---

## Aspectos Multimédia

### Imagens / Spritesheets

| Asset | Formato | Resolução | Origem |
|-------|---------|-----------|--------|
| Tileset Sunnyside World | PNG | 1024×1024 px | [Sunnyside World (itch.io)](https://danieldiggle.itch.io/sunnyside) — licença gratuita |
| Spritesheets do jogador (base, cabelo, ferramentas) | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Spritesheets de goblin e skeleton | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Ícones de itens (madeira, corda, vela, comida, ferramentas) | PNG | 16×16 px | Sunnyside World asset pack |
| HUD (barras, slots de inventário) | PNG | 16–48 px | Sunnyside World asset pack |
| Textura de partículas (4×4 px) | PNG | 4×4 px | Gerada em runtime via Phaser Graphics |

**Total de assets:** ~2 MB (bem abaixo do limite de 10 MB).

**Justificação de resolução:** Os sprites de 96×64 são proporcionais ao zoom da câmara (×2), resultando em ~192×128 px no ecrã — proporcional ao uso, sem PNGs sobredimensionados.

### Áudio

| Som | Tipo | Geração |
|-----|------|---------|
| Música ambiente | Loop | Procedural (drone 110 Hz + harmónico 165 Hz + tremolo LFO + ruído filtrado) |
| Apanhar item | Efeito | Procedural (sine 880→1320 Hz) |
| Dano recebido | Efeito | Procedural (sawtooth com pitch descendente) |
| Morte do jogador | Efeito | Procedural (3 tons descendentes) |
| Ataque | Efeito | Procedural (ruído branco com filtro bandpass) |
| Inimigo atingido | Efeito | Procedural (square 600→200 Hz) |
| Clique de menu | Efeito | Procedural (sine 660 Hz curto) |
| Vitória | Efeito | Procedural (fanfarra Dó-Mi-Sol-Dó') |
| Pausa | Efeito | Procedural (dois tons descendentes) |

Todos os sons são gerados em tempo real via **Web Audio API** — zero ficheiros externos.

### Internacionalização (i18n)

- **2 línguas:** Português (PT) e Inglês (EN)
- Ficheiros JSON em `assets/i18n/pt.json` e `assets/i18n/en.json`
- Seletor de língua no menu principal (botões PT / EN)
- Toda a UI traduzida: menu, HUD, quest log, pausa, Game Over, Vitória

---

## Estrutura do Projeto

```
phaser_tecmul/
├── index.html                  # Carrega Phaser 3 via CDN + ES module
├── README.md
├── generate_map.py             # Gerador procedural do mapa (ilha.json)
├── assets/
│   ├── i18n/                   # Traduções PT / EN (JSON)
│   ├── tilemaps/               # ilha.json (Tiled, 120×90 tiles)
│   ├── tilesets/               # Tileset Sunnyside World
│   ├── spritesheets/           # Sprites do jogador, goblin, skeleton
│   └── images/                 # Ícones de itens, HUD, decorações
└── src/
    ├── main.js                 # Config Phaser + registo de cenas
    ├── scenes/                 # Boot, Preload, Menu, Game, HUD, Pause, GameOver, Victory
    ├── objects/                # Player, Goblin, Skeleton, BossSkeleton, Tree, CollectibleItem
    └── systems/                # I18n, Inventory, PlayerStats, QuestManager, SoundManager, Particles
```

