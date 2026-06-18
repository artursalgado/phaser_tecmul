---
name: project-bugs-fixed
description: Bugs confirmados e corrigidos no projeto Phaser (STRANDED) — sessão de junho 2026
metadata:
  type: project
---

Sessão de revisão de bugs (2026-06-18). Todos os problemas do relatório de auditoria foram tratados.

**Bugs de gameplay corrigidos:**
- HUDScene era lançada duas vezes ao reiniciar (GameOverScene + VictoryScene lançavam HUDScene que o GameScene.create() já lança) — removidos os `scene.launch('HUDScene')` duplicados
- Livro não pausava o jogo — `_toggleBook()` na HUDScene agora define `gameScene._paused`
- Conflito ESC livro + pausa — GameScene verifica `hud._bookOpen` antes de chamar `_togglePause()`
- `statsLabel` no GameOverScene tinha ternário pt/en com ambos os branches iguais — simplificado

**Qualidade de código:**
- `makeBtn` extraído para `src/utils/makeBtn.js` (era copiado em MenuScene, GameOverScene, VictoryScene)
- `GameScene.create()` (~190 linhas) dividido em: `_setupTilemap`, `_setupSystems`, `_setupCamera`, `_setupControls`, `_setupWorld`, `_setupEvents`, `_setupHUD`
- Strings hardcoded movidas para i18n JSONs: `hud.enemy_danger`, `hud.enemy_attention`, `hud.sailing`, `gameover.keys`, `victory.cutscene[]`, `intro.skip`, `intro.slides[]`
- `IntroScene.preload()` removido — imagens da intro movidas para PreloadScene (eliminada carga dupla de `intro_praia`)

**Git/Assets:**
- `.gitignore` atualizado: adicionados dev files (*.py, preview.png, etc.) e pastas de packs brutos (`assets/RPG UI/`, `assets/Pixel Art - Library of Books v1/`)
- `git rm --cached` executado para desrastrear: `assets/.DS_Store`, pastas de packs, `33385_preencher.txt`, ficheiros de dev

**Why:** Auditoria de qualidade do projeto pedida pelo utilizador.
**How to apply:** As correções estão implementadas. O utilizador deve fazer commit das staged changes quando quiser.
