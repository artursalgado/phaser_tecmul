import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Inicializar o som na primeira interação
        SoundManager.init();

        const W = 960, H = 640;
        this.add.rectangle(W/2, H/2, W, H, 0x000000);

        // Título
        const titulo = this.add.text(W/2, 180, I18n.t('menu.title'), {
            fontSize: '72px', fill: '#ffffff', fontStyle: 'bold', letterSpacing: 8
        }).setOrigin(0.5);

        // Subtítulo
        const subtitulo = this.add.text(W/2, 270, I18n.t('menu.subtitle'), {
            fontSize: '18px', fill: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Botão Jogar
        const botaoJogar = this.add.text(W/2, 390, I18n.t('menu.play'), {
            fontSize: '36px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botaoJogar.on('pointerover', () => botaoJogar.setStyle({ fill: '#ffffff' }));
        botaoJogar.on('pointerout',  () => botaoJogar.setStyle({ fill: '#f0e68c' }));
        botaoJogar.on('pointerdown', () => {
            SoundManager.resume();
            SoundManager.play('menu_click');
            this.time.delayedCall(100, () => this.scene.start('GameScene'));
        });

        // ── SELETOR DE LÍNGUA ──────────────────────────────────────────────
        const langBtnPT = this.add.text(W/2 - 60, H - 50, '🇵🇹 PT', {
            fontSize: '20px',
            fill: I18n.lang === 'pt' ? '#ffffff' : '#555555'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const langBtnEN = this.add.text(W/2 + 60, H - 50, '🇬🇧 EN', {
            fontSize: '20px',
            fill: I18n.lang === 'en' ? '#ffffff' : '#555555'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const refreshLang = () => {
            // Atualizar textos
            titulo.setText(I18n.t('menu.title'));
            subtitulo.setText(I18n.t('menu.subtitle'));
            botaoJogar.setText(I18n.t('menu.play'));
            creditos.setText(I18n.t('menu.credits'));
            // Highlight na língua ativa
            langBtnPT.setStyle({ fill: I18n.lang === 'pt' ? '#ffffff' : '#555555' });
            langBtnEN.setStyle({ fill: I18n.lang === 'en' ? '#ffffff' : '#555555' });
        };

        langBtnPT.on('pointerdown', () => {
            SoundManager.play('menu_click');
            I18n.setLang('pt');
            refreshLang();
        });
        langBtnEN.on('pointerdown', () => {
            SoundManager.play('menu_click');
            I18n.setLang('en');
            refreshLang();
        });

        // Dica de controlos
        const creditos = this.add.text(W/2, H - 22, I18n.t('menu.credits'), {
            fontSize: '11px', fill: '#555555'
        }).setOrigin(0.5);

        // Versão
        this.add.text(16, H - 16, 'v0.2', {
            fontSize: '11px', fill: '#333333'
        });

        // Animação de pulsar no título
        this.tweens.add({
            targets: titulo,
            alpha: 0.65,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
}
