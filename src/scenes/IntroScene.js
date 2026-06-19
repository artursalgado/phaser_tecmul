import I18n from '../systems/I18n.js';

export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        const i18nData  = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        const slideTexts = i18nData?.intro?.slides || [];
        const SLIDE_KEYS      = ['intro_veleiro', 'intro_tempestade', 'intro_explosao', 'intro_deriva', 'intro_praia'];
        const SLIDE_DURATIONS = [3500, 3000, 3000, 3500, 4000];
        const slides = SLIDE_KEYS.map((key, i) => ({ key, text: slideTexts[i] || '', duration: SLIDE_DURATIONS[i] }));

        // Fundo preto
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

        // Imagem do slide com zoom inicial de Ken Burns
        const imagem = this.add.image(W / 2, H / 2, slides[0].key)
            .setDisplaySize(W * 1.15, H * 1.15)
            .setAlpha(0)
            .setDepth(1);

        // Efeito de vinheta
        const vinheta = this.criarVinheta(W, H);
        vinheta.setDepth(3);

        // Legenda do slide
        const legenda = this.add.text(W / 2, H - 70, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            wordWrap: { width: W - 120 },
        }).setOrigin(0.5).setAlpha(0).setDepth(4);

        // Aviso de saltar intro
        this.add.text(W - 16, H - 16, I18n.t('intro.skip'), {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#666688',
        }).setOrigin(1, 1).setDepth(4).setAlpha(0.6);

        // Overlay preto para o fade inicial
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
            .setAlpha(1).setDepth(10);

        let saltou = false;

        const irParaJogo = () => {
            if (saltou) return;
            saltou = true;
            this.tweens.killAll();
            this.time.removeAllEvents();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        };

        const mostrarSlide = (index) => {
            if (saltou) return;
            if (index >= slides.length) {
                irParaJogo();
                return;
            }

            const slide = slides[index];
            imagem.setTexture(slide.key)
                .setDisplaySize(W * 1.15, H * 1.15)
                .setScale(imagem.scaleX, imagem.scaleY)
                .setAlpha(0);

            const escalaInicial = imagem.scaleX;
            const escalaFinal = escalaInicial * 1.06;

            legenda.setText(slide.text).setAlpha(0);

            // Transicao de fade-in da imagem
            this.tweens.add({
                targets: imagem,
                alpha: 1,
                duration: 800,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (saltou) return;

                    // Efeito Ken Burns de zoom lento
                    this.tweens.add({
                        targets: imagem,
                        scaleX: escalaFinal,
                        scaleY: escalaFinal,
                        duration: slide.duration + 800,
                        ease: 'Linear',
                    });

                    // Mostra legenda
                    this.time.delayedCall(400, () => {
                        if (saltou) return;
                        this.tweens.add({
                            targets: legenda,
                            alpha: 1,
                            duration: 600,
                            ease: 'Sine.easeOut',
                        });
                    });

                    // Tempo de duracao antes do fade-out
                    this.time.delayedCall(slide.duration, () => {
                        if (saltou) return;
                        this.tweens.add({
                            targets: [imagem, legenda],
                            alpha: 0,
                            duration: 700,
                            ease: 'Sine.easeIn',
                            onComplete: () => {
                                this.time.delayedCall(300, () => mostrarSlide(index + 1));
                            },
                        });
                    });
                },
            });
        };

        // Inicia com o fade-out do overlay preto
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 900,
            ease: 'Linear',
            onComplete: () => {
                overlay.destroy();
                mostrarSlide(0);
            },
        });

        // Atraso antes de permitir saltar para evitar cliques propagados do menu
        this.time.delayedCall(500, () => {
            this.input.keyboard.on('keydown-ESC',   irParaJogo);
            this.input.keyboard.on('keydown-SPACE', irParaJogo);
            this.input.on('pointerdown', irParaJogo);
        });
    }

    // Cria as bordas escurecidas da vinheta
    criarVinheta(W, H) {
        const g = this.add.graphics();
        const tamanhoBorda = Math.max(W, H) * 0.35;

        // Borda superior
        for (let i = 0; i < tamanhoBorda; i++) {
            const a = (1 - i / tamanhoBorda) * 0.7;
            g.fillStyle(0x000000, a);
            g.fillRect(0, i, W, 1);
        }
        // Borda inferior
        for (let i = 0; i < tamanhoBorda; i++) {
            const a = (1 - i / tamanhoBorda) * 0.7;
            g.fillStyle(0x000000, a);
            g.fillRect(0, H - 1 - i, W, 1);
        }
        // Borda esquerda
        for (let i = 0; i < tamanhoBorda; i++) {
            const a = (1 - i / tamanhoBorda) * 0.5;
            g.fillStyle(0x000000, a);
            g.fillRect(i, 0, 1, H);
        }
        // Borda direita
        for (let i = 0; i < tamanhoBorda; i++) {
            const a = (1 - i / tamanhoBorda) * 0.5;
            g.fillStyle(0x000000, a);
            g.fillRect(W - 1 - i, 0, 1, H);
        }

        return g;
    }
}
