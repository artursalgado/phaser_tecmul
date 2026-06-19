import I18n from "../systems/I18n.js";

// Cena de introdução narrativa do jogo.
// Exibe slides de imagens com efeitos suaves de transição (fade), zoom lento (Ken Burns) e legendas dinâmicas.
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Vai buscar o JSON de legendas correto correspondente ao idioma atual do I18n
    const i18nData = this.cache.json.get(
      I18n.lang === "pt" ? "i18n_pt" : "i18n_en",
    );
    const slideTexts = i18nData?.intro?.slides || [];

    // Mapeamento dos slides: chaves das imagens e duração em ms de cada slide no ecrã
    const SLIDE_KEYS = [
      "intro_veleiro",
      "intro_tempestade",
      "intro_explosao",
      "intro_deriva",
      "intro_praia",
    ];
    const SLIDE_DURATIONS = [3500, 3000, 3000, 3500, 4000];

    // Constrói uma lista de objetos estruturados com a imagem, texto e duração de cada slide
    const slides = SLIDE_KEYS.map((key, i) => ({
      key,
      text: slideTexts[i] || "",
      duration: SLIDE_DURATIONS[i],
    }));

    // Cria o fundo de ecrã preto
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

    // Inicializa o sprite que irá exibir as imagens.
    // A escala inicial é definida em 1.15x (ligeiramente maior que o ecrã)
    // para podermos aplicar o efeito de zoom (Ken Burns) sem revelar as bordas.
    const imagem = this.add
      .image(W / 2, H / 2, slides[0].key)
      .setDisplaySize(W * 1.15, H * 1.15)
      .setAlpha(0)
      .setDepth(1);

    // Cria uma vinheta gráfica para escurecer as bordas do ecrã e focar no centro
    const vinheta = this.criarVinheta(W, H);
    vinheta.setDepth(3);

    // Cria o objeto de texto para desenhar a legenda na parte inferior do ecrã
    const legenda = this.add
      .text(W / 2, H - 70, "", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6, // Sombra grossa preta ao redor do texto para garantir legibilidade sobre qualquer imagem
        align: "center",
        wordWrap: { width: W - 120 }, // Quebra de linha automática
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(4);

    // Mensagem de ajuda discreta indicando como saltar a introdução
    this.add
      .text(W - 16, H - 16, I18n.t("intro.skip"), {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#666688",
      })
      .setOrigin(1, 1)
      .setDepth(4)
      .setAlpha(0.6);

    // Overlay preto total inicial para a transição suave inicial de fade-in
    const overlay = this.add
      .rectangle(W / 2, H / 2, W, H, 0x000000)
      .setAlpha(1)
      .setDepth(10);

    let saltou = false; // Flag para garantir que a transição para a GameScene ocorre apenas uma vez

    // Transição de saída e início do jogo
    const irParaJogo = () => {
      if (saltou) {
        return;
      }
      saltou = true;

      // Cancela tweens e temporizadores pendentes da intro
      this.tweens.killAll();
      this.time.removeAllEvents();

      // Fade-out de câmara e arranque da GameScene
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene");
      });
    };

    // Função recursiva para percorrer e exibir cada slide
    const mostrarSlide = (index) => {
      if (saltou) {
        return;
      }

      // Se chegou ao fim do array, arranca o jogo
      if (index >= slides.length) {
        irParaJogo();
        return;
      }

      const slide = slides[index];

      // Prepara a imagem do slide atual
      imagem
        .setTexture(slide.key)
        .setDisplaySize(W * 1.15, H * 1.15)
        .setScale(imagem.scaleX, imagem.scaleY)
        .setAlpha(0);

      // Calcula escalas inicial e final para o zoom de Ken Burns (zoom in lento de 6%)
      const escalaInicial = imagem.scaleX;
      const escalaFinal = escalaInicial * 1.06;

      legenda.setText(slide.text).setAlpha(0);

      // 1. Efeito de fade-in da imagem
      this.tweens.add({
        targets: imagem,
        alpha: 1,
        duration: 800,
        ease: "Sine.easeOut",
        onComplete: () => {
          if (saltou) {
            return;
          }

          // 2. Zoom contínuo lento (Ken Burns) ao longo de toda a duração do slide
          this.tweens.add({
            targets: imagem,
            scaleX: escalaFinal,
            scaleY: escalaFinal,
            duration: slide.duration + 800,
            ease: "Linear",
          });

          // 3. Mostra a legenda ligeiramente desfasada para dar melhor aspeto cinemático
          this.time.delayedCall(400, () => {
            if (saltou) {
              return;
            }
            this.tweens.add({
              targets: legenda,
              alpha: 1,
              duration: 600,
              ease: "Sine.easeOut",
            });
          });

          // 4. Temporizador de tempo visível antes de aplicar o fade-out de saída
          this.time.delayedCall(slide.duration, () => {
            if (saltou) {
              return;
            }
            this.tweens.add({
              targets: [imagem, legenda],
              alpha: 0,
              duration: 700,
              ease: "Sine.easeIn",
              onComplete: () => {
                // Pequena pausa preta de 300ms entre slides
                this.time.delayedCall(300, () => mostrarSlide(index + 1));
              },
            });
          });
        },
      });
    };

    // Desvanece o overlay preto inicial e arranca o primeiro slide
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 900,
      ease: "Linear",
      onComplete: () => {
        overlay.destroy();
        mostrarSlide(0);
      },
    });

    // Adiciona atalhos de clique/teclado para saltar a intro (com atraso para evitar cliques fantasma)
    this.time.delayedCall(500, () => {
      this.input.keyboard.on("keydown-ESC", irParaJogo);
      this.input.keyboard.on("keydown-SPACE", irParaJogo);
      this.input.on("pointerdown", irParaJogo);
    });
  }

  // Cria a vinheta com um gradiente radial num canvas HTML — uma única draw call em vez de ~900 fillRects
  criarVinheta(W, H) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grd = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.28,
      W / 2, H / 2, Math.max(W, H) * 0.78,
    );
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.82)");

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    this.textures.addCanvas("_vinheta_intro", canvas);
    return this.add.image(W / 2, H / 2, "_vinheta_intro");
  }
}
