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

        // Black background
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

        // Image layer — slightly oversized for Ken Burns zoom
        const img = this.add.image(W / 2, H / 2, slides[0].key)
            .setDisplaySize(W * 1.15, H * 1.15)
            .setAlpha(0)
            .setDepth(1);

        // Vignette overlay
        const vignette = this.createVignette(W, H);
        vignette.setDepth(3);

        // Caption text
        const caption = this.add.text(W / 2, H - 70, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            wordWrap: { width: W - 120 },
        }).setOrigin(0.5).setAlpha(0).setDepth(4);

        // Skip hint
        this.add.text(W - 16, H - 16, I18n.t('intro.skip'), {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#666688',
        }).setOrigin(1, 1).setDepth(4).setAlpha(0.6);

        // Black overlay for initial fade
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
            .setAlpha(1).setDepth(10);

        let skipped = false;

        const goToGame = () => {
            if (skipped) return;
            skipped = true;
            this.tweens.killAll();
            this.time.removeAllEvents();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        };

        const showSlide = (index) => {
            if (skipped) return;
            if (index >= slides.length) {
                goToGame();
                return;
            }

            const slide = slides[index];
            img.setTexture(slide.key)
                .setDisplaySize(W * 1.15, H * 1.15)
                .setScale(img.scaleX, img.scaleY)
                .setAlpha(0);

            const startScale = img.scaleX;
            const endScale = startScale * 1.06;

            caption.setText(slide.text).setAlpha(0);

            // Fade in image
            this.tweens.add({
                targets: img,
                alpha: 1,
                duration: 800,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (skipped) return;

                    // Ken Burns slow zoom
                    this.tweens.add({
                        targets: img,
                        scaleX: endScale,
                        scaleY: endScale,
                        duration: slide.duration + 800,
                        ease: 'Linear',
                    });

                    // Text fade in with slight delay
                    this.time.delayedCall(400, () => {
                        if (skipped) return;
                        this.tweens.add({
                            targets: caption,
                            alpha: 1,
                            duration: 600,
                            ease: 'Sine.easeOut',
                        });
                    });

                    // Hold, then fade out
                    this.time.delayedCall(slide.duration, () => {
                        if (skipped) return;
                        this.tweens.add({
                            targets: [img, caption],
                            alpha: 0,
                            duration: 700,
                            ease: 'Sine.easeIn',
                            onComplete: () => {
                                this.time.delayedCall(300, () => showSlide(index + 1));
                            },
                        });
                    });
                },
            });
        };

        // Start: fade overlay out, then begin slideshow
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 900,
            ease: 'Linear',
            onComplete: () => {
                overlay.destroy();
                showSlide(0);
            },
        });

        // Delay skip inputs so the menu click doesn't propagate
        this.time.delayedCall(500, () => {
            this.input.keyboard.on('keydown-ESC',   goToGame);
            this.input.keyboard.on('keydown-SPACE', goToGame);
            this.input.on('pointerdown', goToGame);
        });
    }

    createVignette(W, H) {
        const g = this.add.graphics();
        const edgeSize = Math.max(W, H) * 0.35;

        // Top edge
        for (let i = 0; i < edgeSize; i++) {
            const a = (1 - i / edgeSize) * 0.7;
            g.fillStyle(0x000000, a);
            g.fillRect(0, i, W, 1);
        }
        // Bottom edge
        for (let i = 0; i < edgeSize; i++) {
            const a = (1 - i / edgeSize) * 0.7;
            g.fillStyle(0x000000, a);
            g.fillRect(0, H - 1 - i, W, 1);
        }
        // Left edge
        for (let i = 0; i < edgeSize; i++) {
            const a = (1 - i / edgeSize) * 0.5;
            g.fillStyle(0x000000, a);
            g.fillRect(i, 0, 1, H);
        }
        // Right edge
        for (let i = 0; i < edgeSize; i++) {
            const a = (1 - i / edgeSize) * 0.5;
            g.fillStyle(0x000000, a);
            g.fillRect(W - 1 - i, 0, 1, H);
        }

        return g;
    }
}
