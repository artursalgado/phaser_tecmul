# Stranded 🏝️

> Jogo 2D survival/exploration desenvolvido em **Phaser 3** para a UC Tecnologias Multimédia 2025/2026.

---

## Grupo

| Nome | Número |
|------|--------|
| Artur Salgado | Nº 33385 |
| [2] | Nº XXXXX |

---

## Descrição

**Stranded** é um jogo de sobrevivência e exploração top-down em que o jogador acorda numa ilha misteriosa após um naufrágio, sem memória do que aconteceu. Para escapar, tem de explorar diferentes zonas da ilha, recolher recursos, encontrar sobreviventes e reconstruir um transmissor de rádio para pedir socorro.

O foco do jogo é na **atmosfera** e na **progressão gradual** — a ilha vai revelando os seus segredos à medida que o jogador explora.

---

## Género e Objetivo

| Campo | Valor |
|-------|-------|
| **Género** | Survival / Exploration top-down |
| **Perspetiva** | 2D top-down |
| **Objetivo** | Recolher recursos, encontrar sobreviventes e reconstruir o transmissor para escapar |
| **Vitória** | Transmissor concluído e sinal enviado |
| **Game Over** | HP = 0 (fome, sede ou perigos da ilha) |

---

## História

> *"Acordas na praia. Há destroços à tua volta. Não sabes quanto tempo passaste inconsciente. A ilha parece abandonada... mas há sinais de que não estás sozinho."*

A ilha tem 4 zonas distintas, cada uma com os seus recursos, segredos e sobreviventes escondidos.

---

## Zonas da Ilha

```
🏖️ PRAIA       → zona inicial, recursos básicos, primeiro sobrevivente
🌲 FLORESTA    → madeira, comida, perigos, sobrevivente escondido
⛰️ MONTANHA    → minério, vistas, peças do transmissor
🏚️ RUÍNAS      → segredos da ilha, peça final, boss opcional
```

---

## Core Game Loop

```
Explorar zona
      ↓
Recolher recursos (madeira, comida, metal, peças)
      ↓
Encontrar sobrevivente → desbloqueia nova zona / recurso automático
      ↓
Cumprir objetivo intermédio (abrigo → água → energia → transmissor)
      ↓
Desbloquear zona seguinte
      ↓
Repetir até transmissor completo → Vitória
```

---

## Objetivos Intermédios (progressão)

| # | Objetivo | Como cumprir |
|---|----------|-------------|
| 1 | Construir abrigo | Recolher 10 madeira |
| 2 | Encontrar água potável | Explorar floresta |
| 3 | Encontrar primeiro sobrevivente | Explorar praia completa |
| 4 | Restaurar gerador | Recolher 5 metal |
| 5 | Explorar as ruínas | Desbloquear com sobrevivente 2 |
| 6 | Encontrar peças do transmissor | 3 peças espalhadas pela ilha |
| 7 | **Enviar sinal** | Transmissor completo → Vitória |

---

## Recursos

| Recurso | Onde encontrar | Para quê |
|---------|---------------|----------|
| 🪵 Madeira | Floresta | Abrigo, estruturas |
| 🍎 Comida | Floresta, praia | Recuperar HP |
| ⚙️ Metal | Montanha, ruínas | Gerador, transmissor |
| 🔩 Peças raras | Ruínas | Transmissor |
| 💊 Primeiros socorros | Exploração | Recuperar HP |

---

## Sobreviventes (NPCs)

| Sobrevivente | Localização | Contribuição |
|-------------|-------------|-------------|
| Pescador | Praia | Gera comida automaticamente |
| Lenhador | Floresta | Gera madeira automaticamente |
| Engenheiro | Montanha | Gera metal automaticamente |
| Cientista | Ruínas | Desbloqueia transmissor |

---

## Sistema de Objetivos

- Lista de objetivos visível no HUD (pode ser aberta/fechada)
- Objetivos desbloqueiam-se sequencialmente
- Cada objetivo cumprido dá feedback visual e sonoro
- Progresso guardado em `localStorage`

---

## Day / Night Cycle

- Ciclo dia/noite visual com overlay gradual
- **De dia:** exploração normal
- **De noite:** visibilidade reduzida, recursos mais difíceis de encontrar
- Duração: ~5 minutos por ciclo completo

---

## Easter Egg 🚬

> Podem encontrar tabaco espalhado pela ilha. Fumar dá um boost temporário de velocidade... mas faz perder HP lentamente. A escolha é vossa.

---

## Controlos

| Tecla | Ação |
|-------|------|
| `W A S D` / `↑ ↓ ← →` | Mover |
| `E` | Interagir (recolher recurso / falar com NPC) |
| `I` | Abrir / fechar inventário |
| `J` | Abrir / fechar lista de objetivos |
| `ESC` | Pausar |

---

## Cenas do Jogo

| Cena | Função |
|------|--------|
| `BootScene` | Carrega assets mínimos |
| `PreloadScene` | Carrega todos os assets com barra de progresso |
| `MenuScene` | Menu principal + seletor de língua |
| `GameScene` | Núcleo do jogo — ilha, jogador, NPCs, recursos |
| `HUDScene` | UI paralela — HP, inventário, objetivos, hora do dia |
| `GameOverScene` | Game Over + opção de reiniciar |
| `VictoryScene` | Sinal enviado — vitória + créditos |

---

## Suporte Multilíngue

| Flag | Língua |
|------|--------|
| 🇵🇹 | Português (padrão) |
| 🇬🇧 | English |

Toda a interface traduzida via `I18n.js` com ficheiros `pt.json` e `en.json`.

---

## Como Executar

> O jogo requer um servidor HTTP local. Não funciona via `file://`.

### Opção 1 — Live Server (VS Code) ✅ Recomendado
1. Abrir a pasta do projeto no VS Code
2. Instalar a extensão **Live Server** (Ritwick Dey)
3. Clicar em **"Go Live"** no canto inferior direito
4. Abrir `http://127.0.0.1:5500` no browser

### Opção 2 — npx serve
```bash
npx serve .
```

### Opção 3 — Python
```bash
python3 -m http.server 8000
```

---

## Versão de Phaser

**Phaser 3.80** via CDN — sem instalação necessária.

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>
```

---

## Estrutura do Projeto

```
Stranded/
├── index.html
├── README.md
├── .gitignore
├── src/
│   ├── main.js
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
│   │   └── NPC.js
│   ├── systems/
│   │   ├── InventorySystem.js
│   │   ├── ObjectiveSystem.js
│   │   ├── DayNightSystem.js
│   │   ├── SaveSystem.js
│   │   └── I18n.js
│   └── utils/
│       └── Constants.js
└── assets/
    ├── images/
    ├── spritesheets/
    ├── tilemaps/
    ├── tilesets/
    ├── audio/
    └── locales/
        ├── pt.json
        └── en.json
```

---

## Aspetos Multimédia

### Imagens e Spritesheets

| Asset | Formato | Resolução | Origem | Justificação |
|-------|---------|-----------|--------|--------------|
| Player spritesheet | PNG | 64×64 px | Kenney RPG Pack | Walk 4 direções, proporcional ao tile size |
| NPC spritesheets (×4) | PNG | 64×64 px | Kenney / itch.io | Dimensão uniforme, estilo coerente |
| Tileset ilha (praia, floresta, montanha, ruínas) | PNG | tiles 16×16 px | Kenney Topo Pack | Tiles pequenos, eficientes, estilo tropical |
| Recursos (madeira, comida, metal) | PNG | 16×16 px | Kenney | Ícones simples, legíveis à escala |
| UI elements | PNG | variável | Kenney UI Pack | Coerência visual |
| Partículas (água, folhas, faíscas) | PNG | 8×8 px | Kenney Particles | Leves, atmosfera |

### Áudio

| Asset | Formato | Tamanho aprox. | Origem | Justificação |
|-------|---------|----------------|--------|--------------|
| Música menu | OGG | ~300 KB | OpenGameArt | Ambiente calmo, loop |
| Música dia (ilha) | OGG | ~500 KB | OpenGameArt | Tropical, relaxante |
| Música noite (ilha) | OGG | ~500 KB | OpenGameArt | Tensa, misteriosa |
| SFX: passos areia/erva | OGG | ~20 KB | freesound.org | Feedback de movimento |
| SFX: recolher recurso | OGG | ~15 KB | bfxr.net | Feedback imediato |
| SFX: falar com NPC | OGG | ~10 KB | bfxr.net | Curto, reconhecível |
| SFX: objetivo cumprido | OGG | ~30 KB | bfxr.net | Satisfatório |
| SFX: tabaco 😂 | OGG | ~20 KB | bfxr.net | Easter egg |
| SFX: game over | OGG | ~60 KB | OpenGameArt | Dramático |
| Jingle vitória | OGG | ~100 KB | OpenGameArt | Celebratório |

**Total estimado: ~4 MB**

---

## Funcionalidades

- [x] Movimento + colisões com tilemap
- [x] 4 zonas da ilha exploráveis
- [x] Sistema de recolha de recursos
- [x] Inventário simples
- [x] 4 NPCs sobreviventes com automação
- [x] Sistema de objetivos sequenciais
- [x] Day/night cycle visual
- [x] Save system (localStorage)
- [x] Suporte PT 🇵🇹 / EN 🇬🇧
- [x] Banda sonora + SFX
- [x] HUD limpa e informativa
- [x] Easter egg do tabaco 🚬

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
| Tileset + sprites principais | [Sunnyside World por danieldiggle](https://danieldiggle.itch.io/sunnyside) — gratuito, licença livre para projetos livres e comerciais |
| Assets adicionais | [Kenney.nl](https://kenney.nl) |
| Música | [OpenGameArt.org](https://opengameart.org) |
| SFX | [bfxr.net](https://www.bfxr.net) e [freesound.org](https://freesound.org) |
| Tilemaps | [Tiled Map Editor](https://www.mapeditor.org) |
