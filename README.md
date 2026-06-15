# 🏝️ STRANDED — Jogo de Sobrevivência

## Elementos do Grupo

| Nome | Número |
|------|--------|
| *(preencher)* | *(preencher)* |
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

**Objetivo:** Sobreviver na ilha o máximo de tempo possível — gerir saúde, fome, sede e energia enquanto enfrenta goblins e recolhe recursos.

**Regras:**
- O jogador começa no centro da ilha com barras de vida, fome, sede e energia a 100%.
- As barras de fome e sede diminuem com o tempo — come e bebe itens para as recuperar.
- Os goblins perseguem o jogador e causam dano ao contacto.
- Apanhar itens do chão adiciona-os ao inventário (hotbar com 8 slots).
- Usar itens comestíveis (E) recupera as barras.
- Atacar (ESPAÇO) faz recuar os goblins e pode matá-los.
- **Game Over** quando a vida chega a 0.

**Funcionalidades:**
- Mapa tilemap procedural com ilha rodeada de água
- Jogador animado com múltiplos spritesheets sobrepostos (base + cabelo + ferramentas)
- 7 goblins com IA de perseguição e animações (idle, walk, attack, hurt, death)
- Inventário com 8 slots e hotbar visual
- Sistema de stats (❤️ HP, 🍖 Fome, 💧 Sede, ⚡ Energia)
- Drops aleatórios dos goblins ao morrer
- Suporte multilíngue (PT + EN)
- Sons procedurais via Web Audio API

---

## Jogabilidade / Controlos

| Tecla | Ação |
|-------|------|
| **WASD** / **Setas** | Mover o jogador |
| **SHIFT** | Correr (consome energia) |
| **ESPAÇO** | Atacar |
| **E** | Usar item selecionado na hotbar |
| **1 – 8** | Selecionar slot da hotbar |
| **R** | Reiniciar (no ecrã de Game Over / Vitória) |

---

## Como Executar

### Opção 1 — Live Server (VS Code)
1. Abrir a pasta `phaser_tecmul` no VS Code
2. Instalar extensão **Live Server**
3. Clicar em **Go Live** na barra inferior
4. Abrir `http://127.0.0.1:5500` no browser

### Opção 2 — npx serve
```bash
cd phaser_tecmul
npx serve .
```
Abrir `http://localhost:3000`

### Opção 3 — Python
```bash
cd phaser_tecmul
python -m http.server 8080
```
Abrir `http://localhost:8080`

> ⚠️ Não funciona com `file://` — precisa de servidor HTTP local.

---

## Aspectos Multimédia

### Imagens / Spritesheets

| Asset | Formato | Resolução | Origem |
|-------|---------|-----------|--------|
| Tileset Sunnyside World | PNG | 1024×1024 px | [Sunnyside World (itch.io)](https://danieldiggle.itch.io/sunnyside) — licença gratuita |
| Spritesheets do jogador (base, cabelo, ferramentas) | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Spritesheets do goblin | PNG | 96×64 px/frame, 8–13 frames | Sunnyside World asset pack |
| Ícones de itens (madeira, pedra, comida, ferramentas) | PNG | 16×16 px | Sunnyside World asset pack |
| HUD (barras, slots de inventário) | PNG | 16–48 px | Sunnyside World asset pack |

**Justificação de resolução:** Os sprites de 96×64 são proporcionais ao zoom da câmara (×2.5), resultando em ~240×160 px no ecrã — tamanho adequado e visível sem sobredimensionamento.

### Áudio

| Som | Tipo | Geração |
|-----|------|---------|
| Apanhar item | Efeito | Procedural (Web Audio API — oscilador sine 880→1320 Hz) |
| Dano recebido | Efeito | Procedural (oscilador sawtooth com pitch descendente) |
| Morte do jogador | Efeito | Procedural (3 tons descendentes em sequência) |
| Ataque | Efeito | Procedural (burst de ruído branco com filtro bandpass) |
| Goblin atingido | Efeito | Procedural (oscilador square 600→200 Hz) |
| Clique no menu | Efeito | Procedural (tom sine 660 Hz curto) |
| Vitória | Efeito | Procedural (fanfarra de 4 notas: Dó-Mi-Sol-Dó') |

Os sons são gerados em tempo real via **Web Audio API** sem ficheiros externos, evitando dependências e mantendo o total de assets abaixo de 10 MB.

### Internacionalização (i18n)

- **2 línguas:** Português (PT) e Inglês (EN)
- Ficheiros JSON em `assets/i18n/pt.json` e `assets/i18n/en.json`
- Seletor de língua acessível no menu principal (botões PT / EN)
- Toda a UI textual traduzida: menu, HUD, Game Over, Vitória, dicas
- Sistema centralizado em `src/systems/I18n.js` — sem strings duplicadas no código

---

## Estrutura do Projeto

```
phaser_tecmul/
├── index.html              # Carrega Phaser 3 via CDN
├── README.md
├── generate_map.py         # Script Python para gerar ilha.json
├── assets/
│   ├── i18n/
│   │   ├── pt.json         # Traduções PT
│   │   └── en.json         # Traduções EN
│   ├── tilemaps/
│   │   └── ilha.json       # Mapa Tiled exportado
│   ├── tilesets/
│   │   └── spr_tileset_sunnysideworld_16px.png
│   ├── spritesheets/
│   │   ├── human/          # Spritesheets do jogador
│   │   └── goblin/         # Spritesheets do goblin
│   └── images/             # Ícones de itens e HUD
└── src/
    ├── main.js             # Configuração do Phaser + registo de cenas
    ├── scenes/
    │   ├── BootScene.js
    │   ├── PreloadScene.js
    │   ├── MenuScene.js
    │   ├── GameScene.js
    │   ├── HUDScene.js
    │   ├── GameOverScene.js
    │   └── VictoryScene.js
    ├── objects/
    │   ├── Player.js
    │   ├── Goblin.js
    │   └── CollectibleItem.js
    └── systems/
        ├── I18n.js         # Sistema de internacionalização
        ├── Inventory.js    # Inventário com 8 slots
        ├── PlayerStats.js  # HP / Fome / Sede / Energia
        └── SoundManager.js # Sons procedurais (Web Audio API)
```
