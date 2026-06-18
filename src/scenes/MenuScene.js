import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        SoundManager.init();

        const W = 960, H = 640;

        // Fundo gradiente simulado com retângulos
        this.add.rectangle(W/2, H/2, W, H, 0x0a0a1a);
        this.add.rectangle(W/2, H * 0.75, W, H * 0.5, 0x050510, 0.6);

        // Estrelas de fundo
        for (let i = 0; i < 60; i++) {
            const s = this.add.circle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H * 0.7),
                Phaser.Math.Between(1, 3), 0xffffff,
                Phaser.Math.FloatBetween(0.2, 0.8)
            );
            this.tweens.add({
                targets: s, alpha: 0.1,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true, repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }

        // Título
        const titulo = this.add.text(W/2, 170, I18n.t('menu.title'), {
            fontSize: '80px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#3399ff', strokeThickness: 2
        }).setOrigin(0.5);

        // Subtítulo
        const subtitulo = this.add.text(W/2, 268, I18n.t('menu.subtitle'), {
            fontSize: '18px', fill: '#aaaacc', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Linha decorativa
        this.add.rectangle(W/2, 310, 300, 2, 0x3366aa, 0.6);

        // Botão Jogar
        const botaoJogar = this.add.text(W/2, 380, I18n.t('menu.play'), {
            fontSize: '38px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botaoJogar.on('pointerover', () => {
            botaoJogar.setStyle({ fill: '#ffffff' });
            this.tweens.add({ targets: botaoJogar, scaleX: 1.08, scaleY: 1.08, duration: 120 });
        });
        botaoJogar.on('pointerout', () => {
            botaoJogar.setStyle({ fill: '#f0e68c' });
            this.tweens.add({ targets: botaoJogar, scaleX: 1, scaleY: 1, duration: 120 });
        });
        botaoJogar.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SoundManager.resume();
            SoundManager.stopBgMusic();
            this.time.delayedCall(120, () => this.scene.start('GameScene'));
        });

        // ── SELETOR DE LÍNGUA ──────────────────────────────────────────────
        const langBtnPT = this.add.text(W/2 - 70, H - 52, '🇵🇹 PT', {
            fontSize: '20px',
            fill: I18n.lang === 'pt' ? '#ffffff' : '#444466'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const langBtnEN = this.add.text(W/2 + 70, H - 52, '🇬🇧 EN', {
            fontSize: '20px',
            fill: I18n.lang === 'en' ? '#ffffff' : '#444466'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Separador entre botões de língua
        this.add.text(W/2, H - 52, '|', {
            fontSize: '20px', fill: '#333355'
        }).setOrigin(0.5);

        const refreshLang = () => {
            titulo.setText(I18n.t('menu.title'));
            subtitulo.setText(I18n.t('menu.subtitle'));
            botaoJogar.setText(I18n.t('menu.play'));
            creditos.setText(I18n.t('menu.credits'));
            muteBtn.setText(SoundManager.muted ? '🔇' : '🔊');
            langBtnPT.setStyle({ fill: I18n.lang === 'pt' ? '#ffffff' : '#444466' });
            langBtnEN.setStyle({ fill: I18n.lang === 'en' ? '#ffffff' : '#444466' });
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

        // ── BOTÃO MUTE ────────────────────────────────────────────────────
        const muteBtn = this.add.text(W - 24, 16, SoundManager.muted ? '🔇' : '🔊', {
            fontSize: '22px'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        muteBtn.on('pointerdown', () => {
            SoundManager.toggleMute();
            muteBtn.setText(SoundManager.muted ? '🔇' : '🔊');
        });
        muteBtn.on('pointerover', () => muteBtn.setAlpha(0.7));
        muteBtn.on('pointerout',  () => muteBtn.setAlpha(1));

        // Dica de controlos
        const creditos = this.add.text(W/2, H - 22, I18n.t('menu.credits'), {
            fontSize: '11px', fill: '#444466'
        }).setOrigin(0.5);

        // Versão
        this.add.text(16, H - 16, 'v0.3', {
            fontSize: '11px', fill: '#333355'
        });

        // Animação de pulsar no título
        this.tweens.add({
            targets: titulo, alpha: 0.7,
            duration: 2200, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Música de fundo no menu
        SoundManager.resume();
        SoundManager.startBgMusic();
    }
}
