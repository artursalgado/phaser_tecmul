import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const W = 960, H = 640;

        // Som de morte
        SoundManager.play('die');

        // Fundo semitransparente com fade-in
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.85, duration: 600 });

        const titulo = this.add.text(W/2, H/2 - 120, I18n.t('gameover.title'), {
            fontSize: '64px', fill: '#cc0000', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const sub = this.add.text(W/2, H/2 - 30, I18n.t('gameover.subtitle'), {
            fontSize: '22px', fill: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [titulo, sub], alpha: 1, duration: 800, delay: 400 });

        const btnRestart = this.add.text(W/2, H/2 + 70, I18n.t('gameover.restart'), {
            fontSize: '28px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenu = this.add.text(W/2, H/2 + 120, I18n.t('gameover.menu'), {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Tecla R para reiniciar rapidamente
        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });
    }
}
