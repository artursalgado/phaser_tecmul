import I18n from "../systems/I18n.js";
import SoundManager from "../systems/SoundManager.js";
import makeBtn from "../utils/makeBtn.js";
import SaveManager from "../systems/SaveManager.js";

// Configuração padrão dos botões do menu (profundidade, tamanho, estilo de borda, etc.)
const CONFIG_BOTAO_MENU = {
  depth: 3,
  fontSize: "19px",
  idleFill: "#f5e0b0",
  border: 0xc8901a,
  borderIdleAlpha: 0.6,
  alpha: 1,
};

// Cria os botões pequenos de seleção de idioma (PT e EN) de forma dinâmica
function criarBotaoIdioma(scene, x, y, label, depth = 3) {
  const w = 88,
    h = 32;
  const grafico = scene.add.graphics().setDepth(depth);

  // Desenha a bandeira e sigla
  const txt = scene.add
    .text(x, y, label, {
      fontFamily: "Georgia, serif",
      fontSize: "13px",
      fill: "#c8a070",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);

  let ativo = false; // Indica se este idioma é o selecionado

  // Função interna para redesenhar o botão conforme o estado de ativação
  const desenhar = () => {
    grafico.clear();
    grafico.fillStyle(ativo ? 0x6b3810 : 0x2a1505, 1); // Fundo mais claro se ativo
    grafico.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
    grafico.lineStyle(2, 0xc8901a, ativo ? 1 : 0.4); // Borda mais brilhante se ativo
    grafico.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
  };
  desenhar();

  // Cria a zona de colisão para capturar cliques do rato/toques no ecrã
  const zone = scene.add
    .zone(x, y, w, h)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2);

  return {
    grafico,
    txt,
    zone,
    // Define visualmente se o botão está ativo ou inativo
    setActive: (v) => {
      ativo = v;
      desenhar();
      txt.setStyle({ fill: v ? "#ffffff" : "#c8a070" });
    },
  };
}

// Cena do Menu Principal do jogo
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // Inicializa o contexto áudio na primeira interação
    SoundManager.init();

    const W = 960,
      H = 640;

    // Desenha a imagem de praia em fundo e escurece-a ligeiramente para realçar o menu
    this.add.image(W / 2, H / 2, "intro_praia").setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);

    // Painel central de pergaminho RPG. Parâmetros de nineslice: (centro X, centro Y, textura, frame, largura_final, altura_final, margem_esq, margem_dir, margem_sup, margem_inf) para esticar sem deformar cantos
    const scrollH = 480;
    this.menuBg = this.add
      .nineslice(
        W / 2,
        H / 2 - 10,
        "scroll_rpg",
        null,
        460,
        scrollH,
        18,
        18,
        24,
        24,
      )
      .setDepth(1);

    // Título do jogo desenhado com letra serifada estilo clássico
    const titulo = this.add
      .text(W / 2, H / 2 - 188, I18n.t("menu.title"), {
        fontFamily: "Georgia, serif",
        fontSize: "60px",
        fill: "#3d2008",
        fontStyle: "bold",
        align: "center",
        stroke: "#c8a060",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Subtítulo descritivo
    const subtitulo = this.add
      .text(W / 2, H / 2 - 112, I18n.t("menu.subtitle"), {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        fill: "#6b4820",
        fontStyle: "italic",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Desenha uma linha divisória elegante com um triângulo decorativo no centro
    const divGrafico = this.add.graphics().setDepth(2);
    const desenharDivisoria = () => {
      divGrafico.clear();
      divGrafico.lineStyle(1, 0x9a6030, 0.5);
      divGrafico.lineBetween(W / 2 - 170, H / 2 - 86, W / 2 + 170, H / 2 - 86);
      divGrafico.fillStyle(0x9a6030, 0.6);
      divGrafico.fillTriangle(
        W / 2 - 10,
        H / 2 - 86,
        W / 2,
        H / 2 - 80,
        W / 2 + 10,
        H / 2 - 86,
      );
    };
    desenharDivisoria();

    // Posicionamento vertical dinâmico dos botões.
    // Se houver um ficheiro de save guardado no browser, movemos os botões ligeiramente
    // para dar espaço ao botão "Continuar".
    const temSave = SaveManager.hasSave();
    const jogarY = temSave ? H / 2 - 54 : H / 2 - 24;
    const continuarY = H / 2 + 6;
    const idiomaY = temSave ? H / 2 + 66 : H / 2 + 36;

    // Botão Novo Jogo (Play)
    const btnJogar = makeBtn(
      this,
      W / 2,
      jogarY,
      260,
      52,
      I18n.t("menu.play"),
      { ...CONFIG_BOTAO_MENU, depth: 2 },
    );
    btnJogar.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      SoundManager.resume();
      SoundManager.stopBgMusic();

      // Apaga qualquer gravação antiga para começar uma partida totalmente nova
      SaveManager.clear();

      // Pequeno atraso para o som do clique poder tocar antes de mudar de cena
      this.time.delayedCall(120, () => this.scene.start("IntroScene"));
    });

    // Botão Continuar Jogo (só é instanciado se houver save)
    let btnContinuar = null;
    if (temSave) {
      btnContinuar = makeBtn(
        this,
        W / 2,
        continuarY,
        260,
        52,
        I18n.t("menu.continue"),
        { ...CONFIG_BOTAO_MENU, depth: 2 },
      );
      btnContinuar.zone.on("pointerdown", () => {
        SoundManager.play("menu_click");
        SoundManager.resume();
        SoundManager.stopBgMusic();

        // Abre a GameScene passando o parâmetro loadSave a true
        this.time.delayedCall(120, () =>
          this.scene.start("GameScene", { loadSave: true }),
        );
      });
    }

    // Instancia os botões pequenos de idiomas
    const langPT = criarBotaoIdioma(this, W / 2 - 58, idiomaY, "🇵🇹 PT", 2);
    const langEN = criarBotaoIdioma(this, W / 2 + 58, idiomaY, "🇬🇧 EN", 2);

    // Bloco de créditos académicos
    const creditos = this.add
      .text(W / 2, H / 2 + 182, I18n.t("menu.credits"), {
        fontFamily: "Georgia, serif",
        fontSize: "10px",
        fill: "#6b4820",
        fontStyle: "italic",
        align: "center",
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Botão de silenciar áudio (Mute) no canto superior direito do ecrã
    const imagemMute = this.add
      .image(W - 36, 36, SoundManager.muted ? "sound_off" : "sound_on")
      .setScale(1.5)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    imagemMute.on("pointerdown", () => {
      SoundManager.toggleMute();
      imagemMute.setTexture(SoundManager.muted ? "sound_off" : "sound_on");
    });

    // Efeitos de feedback visual (opacidade) ao passar o rato no ícone de som
    imagemMute.on("pointerover", () => imagemMute.setAlpha(0.7));
    imagemMute.on("pointerout", () => imagemMute.setAlpha(1));

    // Atualiza dinamicamente todos os textos do menu principal caso o utilizador altere o idioma
    const atualizarTextos = () => {
      titulo.setText(I18n.t("menu.title"));
      subtitulo.setText(I18n.t("menu.subtitle"));
      btnJogar.setLabel(I18n.t("menu.play"));
      if (btnContinuar) {
        btnContinuar.setLabel(I18n.t("menu.continue"));
      }
      creditos.setText(I18n.t("menu.credits"));
      imagemMute.setTexture(SoundManager.muted ? "sound_off" : "sound_on");

      // Define qual botão de idioma fica com o destaque visual
      langPT.setActive(I18n.lang === "pt");
      langEN.setActive(I18n.lang === "en");
    };

    // Ouvintes de clique nos botões de bandeira
    langPT.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      I18n.setLang("pt");
      atualizarTextos();
    });
    langEN.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      I18n.setLang("en");
      atualizarTextos();
    });

    // Executa atualização inicial
    atualizarTextos();

    this.add
      .text(16, H - 16, "v0.3", { fontSize: "11px", fill: "#2a1a08" })
      .setDepth(2);

    // Pequeno efeito visual de respiração (pulsação de alpha) no título principal do menu
    this.tweens.add({
      targets: titulo,
      alpha: 0.75,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Toca a música ambiente procedural inicial
    SoundManager.resume();
    SoundManager.startBgMusic();
  }
}
