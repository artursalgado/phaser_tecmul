import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const W = 960, H = 640;

        // Overlay semitransparente
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.72, duration: 200 });

        // Painel central
        this.add.rectangle(W/2, H/2, 320, 320, 0x111122, 0.95)
            .setStrokeStyle(2, 0x3366aa);

        const title = this.add.text(W/2, H/2 - 120,
            I18n.lang === 'en' ? 'PAUSED' : 'PAUSA',
            { fontSize: '42px', fill: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // Botão Continuar
        const btnContinue = this.add.text(W/2, H/2 - 30,
            I18n.lang === 'en' ? '▶  Continue' : '▶  Continuar',
            { fontSize: '26px', fill: '#f0e68c', fontStyle: 'bold' }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnContinue.on('pointerover', () => btnContinue.setStyle({ fill: '#ffffff' }));
        btnContinue.on('pointerout',  () => btnContinue.setStyle({ fill: '#f0e68c' }));
        btnContinue.on('pointerdown', () => this._resume());

        // Botão Mute
        const muteLabel = () => SoundManager.muted
            ? (I18n.lang === 'en' ? '🔇 Unmute' : '🔇 Ativar som')
            : (I18n.lang === 'en' ? '🔊 Mute'   : '🔊 Silenciar');

        const btnMute = this.add.text(W/2, H/2 + 30, muteLabel(), {
            fontSize: '20px', fill: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMute.on('pointerover', () => btnMute.setStyle({ fill: '#ffffff' }));
        btnMute.on('pointerout',  () => btnMute.setStyle({ fill: '#aaaaaa' }));
        btnMute.on('pointerdown', () => {
            SoundManager.toggleMute();
            btnMute.setText(muteLabel());
        });

        // Botão Menu
        const btnMenu = this.add.text(W/2, H/2 + 85,
            I18n.lang === 'en' ? '← Main Menu' : '← Menu Principal',
            { fontSize: '20px', fill: '#888888' }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('PauseScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Dica
        this.add.text(W/2, H/2 + 130,
            I18n.lang === 'en' ? '[ESC] to resume' : '[ESC] para continuar',
            { fontSize: '11px', fill: '#555577' }
        ).setOrigin(0.5);

        // ESC para fechar
        this.input.keyboard.once('keydown-ESC', () => this._resume());
    }

    _resume() {
        SoundManager.play('menu_click');
        this.scene.stop('PauseScene');
        this.scene.resume('GameScene');
    }
}
