# DarkHold 🗡️

> Jogo 2D dungeon crawler desenvolvido em **Phaser 3** para a UC Tecnologias Multimédia 2025/2026.

---

## Grupo

| Nome | Número |
|------|--------|
| [Nome Aluno 1] | Nº XXXXX |
| [Nome Aluno 2] | Nº XXXXX |

---

## Descrição

**DarkHold** é um dungeon crawler top-down em que o jogador assume o papel de um guerreiro solitário que entra numa masmorra amaldiçoada para derrotar o **DarkLord**, uma entidade sombria que despertou e está a corromper as terras.

O jogador desce 3 andares repletos de inimigos, cada um com um boss no final. O jogo termina com **Vitória** ao matar o DarkLord, ou com **Game Over** ao perder todos os corações.

---

## Género e Objetivo

| Campo | Valor |
|-------|-------|
| **Género** | Top-down dungeon crawler |
| **Perspetiva** | 2D top-down |
| **Objetivo** | Descer os 3 andares, derrotar os 3 bosses e eliminar o DarkLord |
| **Estrutura** | 3 andares × 4 salas fixas (12 salas no total) |
| **Vitória** | Derrotar o DarkLord na câmara final |
| **Game Over** | HP = 0 |

---

## História

> *"O DarkHold permaneceu selado por séculos sob as ruínas do Castelo Maldito. Hoje, os seus portões abriram-se. O DarkLord despertou. Só um guerreiro corajoso pode descer às suas profundezas e pôr fim à sua maldição."*

A narrativa é apresentada no menu antes de iniciar o jogo, disponível nas 3 línguas suportadas.

---

## Core Game Loop

```
Entrar numa sala
      ↓
Combater inimigos (melee X / ranged Z)
      ↓
Inimigos eliminados → Porta abre
      ↓
Recolher drops (chaves, poções, power-ups)
      ↓
Avançar para a próxima sala
      ↓
Última sala do andar? → Boss Fight
      ↓
Derrotar boss → Próximo andar (ou Vitória se Andar 3)
```

---

## Estrutura dos Andares

```
ANDAR 1 (fácil)   → [Entrada] → [Combate: Skeletons]   → [Tesouro] → [Boss: Skeleton King]
ANDAR 2 (médio)   → [Entrada] → [Combate: Ghosts+Bats] → [Armadilha] → [Boss: Shadow Wraith]
ANDAR 3 (difícil) → [Entrada] → [Combate: Elite Mix]   → [Corredor] → [Boss: DarkLord 💀]
```

- Porta de saída **trancada** até eliminar todos os inimigos da sala
- Salas de Tesouro contêm baús que requerem **chaves** para abrir
- Dificuldade aumenta progressivamente a cada andar

---

## Inimigos

| Inimigo | HP | Dano | Comportamento |
|---------|----|------|--------------|
| **Skeleton** 💀 | 2 | 1 ❤️ | Persegue o jogador em linha reta |
| **Ghost** 👻 | 3 | 1 ❤️ | Zigzag, atravessa paredes |
| **Bat** 🦇 | 1 | 0.5 ❤️ | Rápido, movimento errático, spawn em grupos de 3 |
| **Skeleton King** 👑 | 15 | 1.5 ❤️ | Boss A1 — melee + invoca Skeletons |
| **Shadow Wraith** 🌑 | 18 | 1 ❤️ | Boss A2 — projéteis em cruz + teleporte |
| **DarkLord** 💀🔥 | 25 | 1–2 ❤️ | Boss Final — 2 fases (melee → espiral + invocação) |

---

## Sistema de Pontuação

| Evento | Pontos |
|--------|--------|
| Matar Skeleton | +10 |
| Matar Bat | +15 |
| Matar Ghost | +20 |
| Matar Boss de andar | +100 |
| Matar DarkLord | +300 |
| Abrir baú | +25 |
| Andar sem dano | +50 (bónus) |
| Tomar dano | −5 |

O **highscore** é guardado em `localStorage` e apresentado na cena de Vitória e Game Over.

---

## Power-ups

| Item | Efeito | Duração |
|------|--------|---------|
| ❤️ Poção Vermelha | +1 coração (máx 5) | Instantâneo |
| 🔵 Orbe Azul | Restaura cargas mágicas | Instantâneo |
| 👟 Bota Dourada | +30% velocidade | 10 segundos |
| ⚔️ Espada Brilhante | +1 dano melee | 15 segundos |

Power-ups temporários são visíveis na HUD com barra de duração. O ícone pisca quando está a acabar.

---

## Controlos

| Tecla | Ação |
|-------|------|
| `W A S D` / `↑ ↓ ← →` | Mover |
| `X` ou `J` | Ataque melee (espada) |
| `Z` ou `K` | Ataque ranged — magia (cooldown 1s) |
| `R` | Reiniciar (no Game Over) |
| `ESC` | Pausar |

---

## Cenas do Jogo

| Cena | Função |
|------|--------|
| `BootScene` | Carrega assets mínimos (logo, barra de carregamento) |
| `PreloadScene` | Carrega todos os assets com barra de progresso animada |
| `MenuScene` | Menu principal + seletor de língua 🇵🇹🇬🇧🇫🇷 |
| `GameScene` | Núcleo do jogo — salas, player, inimigos, física |
| `HUDScene` | UI paralela — ❤️ corações, score, 🗝️ chaves, cooldown |
| `GameOverScene` | Game Over com score final + opção de reiniciar |
| `VictoryScene` | Vitória com animação, score final e highscore |

---

## Suporte Multilíngue

O jogo suporta **3 línguas**, selecionáveis no menu principal através de flags clicáveis:

| Flag | Língua |
|------|--------|
| 🇵🇹 | Português (padrão) |
| 🇬🇧 | English |
| 🇫🇷 | Français |

Toda a interface está traduzida via sistema `I18n.js` com ficheiros JSON por língua em `assets/locales/`. Não existem strings hardcoded no código.

---

## Como Executar

> O jogo requer um servidor HTTP local. Não funciona corretamente via `file://`.

### Opção 1 — Live Server (VS Code) ✅ Recomendado
1. Abrir a pasta do projeto no VS Code
2. Instalar a extensão **Live Server** (Ritwick Dey)
3. Clicar em **"Go Live"** no canto inferior direito
4. Abrir `http://127.0.0.1:5500` no browser

### Opção 2 — npx serve
```bash
npx serve .
```
Abrir `http://localhost:3000` no browser.

### Opção 3 — Python
```bash
python3 -m http.server 8000
```
Abrir `http://localhost:8000` no browser.

---

## Versão de Phaser

**Phaser 3.80** incluído via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>
```

Não são necessárias dependências adicionais. Sem `npm install`.

---

## Estrutura do Projeto

```
DarkHold/
├── index.html                  # ponto de entrada — carrega Phaser CDN + main.js
├── .gitignore
├── README.md
├── src/
│   ├── main.js                 # configuração Phaser, registo de cenas
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   ├── HUDScene.js
│   │   ├── GameOverScene.js
│   │   └── VictoryScene.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── EnemyBase.js
│   │   ├── Skeleton.js
│   │   ├── Ghost.js
│   │   ├── Bat.js
│   │   └── Boss.js
│   ├── systems/
│   │   ├── RoomManager.js
│   │   ├── CombatSystem.js
│   │   └── I18n.js
│   └── utils/
│       └── Constants.js
└── assets/
    ├── images/                 # sprites individuais, UI, logo
    ├── spritesheets/           # animações (player, inimigos, boss, efeitos)
    ├── tilemaps/               # ficheiros .json exportados do Tiled
    ├── tilesets/               # PNG dos tilesets
    ├── audio/                  # música OGG + SFX OGG
    └── locales/
        ├── pt.json
        ├── en.json
        └── fr.json
```

---

## Aspetos Multimédia

### Imagens e Spritesheets

| Asset | Formato | Resolução | Origem | Justificação |
|-------|---------|-----------|--------|--------------|
| Player spritesheet | PNG | 128×256 px | Kenney RPG Pack | 4 direções × 4 frames walk + attack; dimensão proporcional ao uso |
| Enemy spritesheets (×3) | PNG | 64×64 px | Kenney / itch.io | Resolução adequada à escala de jogo, sem desperdício |
| Boss spritesheets (×2) | PNG | 96×96 px | itch.io free | Escala maior justificada pelo tamanho visual do boss |
| DarkLord spritesheet | PNG | 128×128 px | itch.io free | Boss final — maior detalhe e impacto visual |
| Dungeon Tileset | PNG | tiles 16×16 px | Kenney Roguelike Pack | Tiles pequenos, estilo coerente, ficheiro único eficiente |
| Partículas / efeitos mágicos | PNG | 16×16 px | Kenney Particles Pack | Explosões e efeitos de magia; spritesheet leve |
| UI elements (corações, ícones) | PNG | variável | Kenney UI Pack | Coerência visual com o resto dos assets |

### Áudio

| Asset | Formato | Tamanho aprox. | Origem | Justificação |
|-------|---------|----------------|--------|--------------|
| Música menu | OGG | ~400 KB | OpenGameArt | Loop comprimido; OGG em vez de WAV reduz ~10× o tamanho |
| Música dungeon A1 | OGG | ~500 KB | OpenGameArt | Ambiente tenso adequado ao andar 1 |
| Música dungeon A2/A3 | OGG | ~500 KB cada | OpenGameArt | Intensidade crescente por andar |
| Música boss | OGG | ~600 KB | OpenGameArt | Tema distinto e mais intenso para combate de boss |
| SFX: swing espada | OGG | ~25 KB | bfxr.net | Gerado especificamente para feedback do ataque melee |
| SFX: impacto / hit | OGG | ~20 KB | bfxr.net | Feedback imediato ao acertar inimigo |
| SFX: magia / projétil | OGG | ~30 KB | bfxr.net | Distinguível do ataque melee |
| SFX: morte inimigo | OGG | ~25 KB | freesound.org | Satisfatório, curto |
| SFX: porta a abrir | OGG | ~40 KB | freesound.org | Feedback claro da transição de sala |
| SFX: apanhar item | OGG | ~20 KB | bfxr.net | Power-up / poção coletado |
| SFX: dano recebido | OGG | ~20 KB | bfxr.net | Feedback ao jogador ao ser atingido |
| Jingle Game Over | OGG | ~80 KB | bfxr.net | Curto, reconhecível |
| Jingle Vitória | OGG | ~120 KB | OpenGameArt | Satisfatório, celebratório |

**Total estimado de assets: ~6 MB** *(abaixo do limite recomendado de 10 MB)*

Todos os ficheiros de áudio estão em formato **OGG** (comprimido), sem ficheiros WAV brutos no repositório.

---

## Funcionalidades Implementadas

- [x] 3 andares × 4 salas (12 salas desenhadas no Tiled)
- [x] 3 tipos de inimigos com IA distinta (Skeleton, Ghost, Bat)
- [x] 3 bosses de andar + boss final com **2 fases** (DarkLord)
- [x] Combate **melee** (espada) + **ranged** (magia) com cooldown
- [x] Sistema de chaves e baús
- [x] 4 tipos de power-ups com duração e HUD indicator
- [x] Sistema de pontuação com **highscore em localStorage**
- [x] Suporte a **3 línguas**: Português 🇵🇹, English 🇬🇧, Français 🇫🇷
- [x] Banda sonora completa: 4 músicas + 13 SFX distintos
- [x] HUD paralela (corações, score, chaves, cooldown, andar)
- [x] Partículas em explosões e efeitos mágicos
- [x] Tweens em menus, transições e portas
- [x] Camera follow + shake + fade

---

## Capturas de Ecrã

> *(adicionar antes da entrega)*

---

## GitHub Pages

> *(adicionar link se ativado)*

---

## Lacunas / Limitações Conhecidas

> *(preencher antes da entrega)*

---

## Créditos

| Recurso | Origem |
|---------|--------|
| Engine | [Phaser 3](https://phaser.io) |
| Assets visuais | [Kenney.nl](https://kenney.nl) — Roguelike/RPG Pack, UI Pack, Particles |
| Assets visuais adicionais | [itch.io](https://itch.io/game-assets/free) — packs gratuitos |
| Música | [OpenGameArt.org](https://opengameart.org) |
| SFX | [bfxr.net](https://www.bfxr.net) e [freesound.org](https://freesound.org) |
| Tilemaps | Criados com [Tiled Map Editor](https://www.mapeditor.org) |
