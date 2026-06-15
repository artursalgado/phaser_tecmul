import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const W = 960, H = 640;

        // Som de vitória
        SoundManager.play('victory');

        // Fundo com fade-in dourado
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x1a1000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.9, duration: 600 });

        // Partículas simples (estrelas)
        for (let i = 0; i < 30; i++) {
            const star = this.add.text(
                Phaser.Math.Between(50, W - 50),
                Phaser.Math.Between(50, H - 50),
                '✦',
                { fontSize: Phaser.Math.Between(10, 24) + 'px', fill: '#f0e68c' }
            ).setAlpha(0);

            this.tweens.add({
                targets: star,
                alpha: { from: 0, to: Phaser.Math.FloatBetween(0.3, 1) },
                duration: Phaser.Math.Between(500, 1500),
                delay: Phaser.Math.Between(0, 1000),
                yoyo: true,
                repeat: -1
            });
        }

        // Título
        const titulo = this.add.text(W/2, H/2 - 120, I18n.t('victory.title'), {
            fontSize: '64px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const sub = this.add.text(W/2, H/2 - 30, I18n.t('victory.subtitle'), {
            fontSize: '22px', fill: '#ddddaa', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [titulo, sub], alpha: 1, duration: 900, delay: 400 });

        // Botão jogar novamente
        const btnRestart = this.add.text(W/2, H/2 + 70, I18n.t('victory.restart'), {
            fontSize: '28px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        // Botão menu
        const btnMenu = this.add.text(W/2, H/2 + 120, I18n.t('victory.menu'), {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('VictoryScene');
            this.scene.start('MenuScene');
        });

        // Tecla R
        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });
    }
}
