import I18n from "../systems/I18n.js";
import SoundManager from "../systems/SoundManager.js";
import makeBtn from "../utils/makeBtn.js";
import SaveManager from "../systems/SaveManager.js";

// Cena de pausa que sobrepõe a GameScene sem a apagar da memória
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create() {
    const W = 960,
      H = 640;

    // Desenha um fundo escuro semitransparente. Parâmetros de rectangle: (centro X, centro Y, largura, altura, cor preta, opacidade inicial)
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    // Transição suave de fade-in. Parâmetros de tweens.add: (targets: objeto alvo, alpha: opacidade final, duration: tempo em ms)
    this.tweens.add({ targets: overlay, alpha: 0.72, duration: 200 });

    // Coordenadas e dimensões do painel central RPG
    const painelW = 300,
      painelH = 400;
    const cx = W / 2 - painelW / 2;
    const cy = H / 2 - painelH / 2;
    const HEADER_H = 34; // Altura da barra superior do painel

    // Desenha os gráficos do painel de pausa
    const painelGrafico = this.add.graphics().setDepth(1);

    // Sombra suave do painel
    painelGrafico.fillStyle(0x000000, 0.35);
    painelGrafico.fillRoundedRect(cx + 4, cy + 4, painelW, painelH, 6);

    // Fundo castanho escuro
    painelGrafico.fillStyle(0x160a00, 0.92);
    painelGrafico.fillRoundedRect(cx, cy, painelW, painelH, 6);

    // Borda dourada ornamentada
    painelGrafico.lineStyle(1.5, 0xc8901a, 0.72);
    painelGrafico.strokeRoundedRect(cx, cy, painelW, painelH, 6);

    // Banda de cabeçalho superior do painel
    painelGrafico.fillStyle(0x3d1a00, 1);
    painelGrafico.fillRoundedRect(cx, cy, painelW, HEADER_H, {
      tl: 6,
      tr: 6,
      bl: 0,
      br: 0,
    });

    // Divisória horizontal dourada
    painelGrafico.lineStyle(1, 0xc8901a, 0.6);
    painelGrafico.lineBetween(
      cx + 8,
      cy + HEADER_H,
      cx + painelW - 8,
      cy + HEADER_H,
    );

    // Texto do cabeçalho de pausa
    const textoTitulo = I18n.lang === "en" ? "PAUSED" : "PAUSA";
    const titulo = this.add
      .text(W / 2, cy + HEADER_H / 2, textoTitulo, {
        fontSize: "12px",
        fill: "#f5c070",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Botão para Continuar o jogo (retornar)
    const textoContinuar = I18n.lang === "en" ? "Continue" : "Continuar";
    const btnContinue = makeBtn(
      this,
      W / 2,
      H / 2 - 75,
      220,
      38,
      textoContinuar,
      { depth: 2 },
    );
    btnContinue.zone.on("pointerdown", () => this.retomar());

    // Função de utilidade para ler o estado atual do mute e formatar a etiqueta correspondente
    const obterEtiquetaMute = () =>
      SoundManager.muted
        ? I18n.lang === "en"
          ? "🔇 Unmute"
          : "🔇 Ativar som"
        : I18n.lang === "en"
          ? "🔊 Mute"
          : "🔊 Silenciar";

    // Botão de atalho para Mute
    const btnMute = makeBtn(
      this,
      W / 2,
      H / 2 - 25,
      220,
      38,
      obterEtiquetaMute(),
      { depth: 2 },
    );
    btnMute.zone.on("pointerdown", () => {
      SoundManager.toggleMute();
      btnMute.txt.setText(obterEtiquetaMute());
    });

    // Botão de Definições
    const textoDefinicoes = I18n.lang === "en" ? "Settings" : "Definições";
    const btnDefs = makeBtn(this, W / 2, H / 2 + 25, 220, 38, textoDefinicoes, { depth: 2 });
    btnDefs.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      this.scene.launch("SettingsScene");
    });

    // Botão para apagar a gravação atual
    const btnClearSave = makeBtn(
      this,
      W / 2,
      H / 2 + 75,
      220,
      38,
      I18n.t("pause.delete_save"),
      { depth: 2 },
    );
    btnClearSave.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      SaveManager.clear();
      btnClearSave.txt.setText(I18n.t("pause.save_deleted")); // Atualiza etiqueta indicando que foi apagado
    });

    // Botão para sair e regressar ao Menu Principal
    const textoMenu = I18n.lang === "en" ? "Main Menu" : "Menu Principal";
    const btnMenu = makeBtn(this, W / 2, H / 2 + 125, 220, 38, textoMenu, {
      depth: 2,
    });
    btnMenu.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");

      // Para as três cenas ativas em execução paralela
      this.scene.stop("PauseScene");
      this.scene.stop("HUDScene");
      this.scene.stop("GameScene");

      // Regressa ao Menu Principal
      this.scene.start("MenuScene");
    });

    // Legenda informativa sobre tecla de atalho
    this.add
      .text(
        W / 2,
        H / 2 + 170,
        I18n.lang === "en" ? "[ESC] to resume" : "[ESC] para continuar",
        {
          fontSize: "11px",
          fill: "#c8a870",
          stroke: "#000000",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(2);

    // Permite fechar a pausa premindo a tecla ESC
    this.input.keyboard.once("keydown-ESC", () => this.retomar());
  }

  // Fecha a cena de pausa e retoma o processamento da GameScene
  retomar() {
    SoundManager.play("menu_click");
    this.scene.stop("PauseScene");
    this.scene.resume("GameScene");
  }
}
