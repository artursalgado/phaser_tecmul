import I18n from '../systems/I18n.js';

export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    preload() {
        this.load.image('intro_veleiro',    'assets/intro/intro_veleiro.png');
        this.load.image('intro_tempestade', 'assets/intro/intro_tempestade.png');
        this.load.image('intro_explosao',   'assets/intro/intro_explosao.png');
        this.load.image('intro_deriva',     'assets/intro/intro_deriva.png');
        this.load.image('intro_praia',      'assets/intro/intro_praia.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const pt = I18n.lang === 'pt';

        const slides = [
            { key: 'intro_veleiro',    caption: null,                                          duration: 3000 },
            { key: 'intro_tempestade', caption: null,                                          duration: 2500 },
            { key: 'intro_explosao',   caption: null,                                          duration: 2500 },
            { key: 'intro_deriva',     caption: null,                                          duration: 3000 },
            { key: 'intro_praia',      caption: pt ? 'Onde... onde estou?' : 'Where am I...?', duration: 3500 },
        ];

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
            .setAlpha(1).setDepth(10);

        const img = this.add.image(W / 2, H / 2, slides[0].key)
            .setDisplaySize(W, H).setAlpha(0).setDepth(1);

        const caption = this.add.text(W / 2, H - 56, '', {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center',
        }).setOrigin(0.5).setAlpha(0).setDepth(2);

        this.add.text(W - 14, H - 14, pt ? 'ESC para saltar' : 'ESC to skip', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#555577',
        }).setOrigin(1, 1).setDepth(2);

        const goToMenu = () => {
            this.tweens.killAll();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
        };

        const showSlide = (index) => {
            if (index >= slides.length) {
                goToMenu();
                return;
            }

            const slide = slides[index];
            img.setTexture(slide.key).setDisplaySize(W, H).setAlpha(0);
            caption.setText(slide.caption || '').setAlpha(0);

            this.tweens.add({
                targets: img,
                alpha: 1,
                duration: 700,
                ease: 'Linear',
                onComplete: () => {
                    if (slide.caption) {
                        this.tweens.add({ targets: caption, alpha: 1, duration: 500 });
                    }
                    this.time.delayedCall(slide.duration, () => {
                        this.tweens.add({
                            targets: [img, caption],
                            alpha: 0,
                            duration: 600,
                            ease: 'Linear',
                            onComplete: () => showSlide(index + 1),
                        });
                    });
                },
            });
        };

        // Fade in do preto inicial
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 800,
            ease: 'Linear',
            onComplete: () => { overlay.destroy(); showSlide(0); },
        });

        this.input.keyboard.on('keydown-ESC',   goToMenu);
        this.input.keyboard.on('keydown-SPACE', goToMenu);
        this.input.once('pointerdown', goToMenu);
    }
}
