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

        // Fundo do menu - pergaminho scroll
        this.menuBg = this.add.nineslice(W/2, H/2 - 10, 'menu_scroll', null, 500, 480, 24, 24, 32, 32).setDepth(1);

        // Título
        const titulo = this.add.text(W/2, H/2 - 160, I18n.t('menu.title'), {
            fontFamily: 'Georgia, serif', fontSize: '56px', fill: '#3d2314', fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(2);

        // Subtítulo
        const subtitulo = this.add.text(W/2, H/2 - 90, I18n.t('menu.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#5c3d24', fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(2);

        // Linha decorativa
        const divider = this.add.rectangle(W/2, H/2 - 60, 320, 2, 0x5c3d24, 0.4).setDepth(2);

        // Botão Jogar
        const botaoJogarBg = this.add.nineslice(W/2, H/2 + 10, 'button_normal', null, 240, 52, 6, 6, 6, 6)
            .setDepth(2).setInteractive({ useHandCursor: true });
        const botaoJogarTxt = this.add.text(W/2, H/2 + 10, I18n.t('menu.play'), {
            fontFamily: 'Georgia, serif', fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        botaoJogarBg.on('pointerover', () => {
            botaoJogarBg.setTexture('button_hover');
            this.tweens.add({ targets: [botaoJogarBg, botaoJogarTxt], scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        botaoJogarBg.on('pointerout', () => {
            botaoJogarBg.setTexture('button_normal');
            this.tweens.add({ targets: [botaoJogarBg, botaoJogarTxt], scaleX: 1, scaleY: 1, duration: 100 });
        });
        botaoJogarBg.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SoundManager.resume();
            SoundManager.stopBgMusic();
            this.time.delayedCall(120, () => this.scene.start('IntroScene'));
        });

        const botaoJogar = botaoJogarTxt;

        // ── SELETOR DE LÍNGUA ──────────────────────────────────────────────
        const langBtnPTBg = this.add.nineslice(W/2 - 70, H/2 + 100, 'button_normal', null, 110, 42, 6, 6, 6, 6)
            .setDepth(2).setInteractive({ useHandCursor: true });
        const langBtnPTTxt = this.add.text(W/2 - 70, H/2 + 100, '🇵🇹 PT', {
            fontFamily: 'Georgia, serif', fontSize: '14px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        const langBtnENBg = this.add.nineslice(W/2 + 70, H/2 + 100, 'button_normal', null, 110, 42, 6, 6, 6, 6)
            .setDepth(2).setInteractive({ useHandCursor: true });
        const langBtnENTxt = this.add.text(W/2 + 70, H/2 + 100, '🇬🇧 EN', {
            fontFamily: 'Georgia, serif', fontSize: '14px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        const refreshLang = () => {
            titulo.setText(I18n.t('menu.title'));
            subtitulo.setText(I18n.t('menu.subtitle'));
            botaoJogar.setText(I18n.t('menu.play'));
            creditos.setText(I18n.t('menu.credits'));
            muteBtn.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
            
            if (I18n.lang === 'pt') {
                langBtnPTBg.setTexture('button_hover').clearTint();
                langBtnPTTxt.setStyle({ fill: '#ffffff' });
                langBtnENBg.setTexture('button_normal').setTint(0x888888);
                langBtnENTxt.setStyle({ fill: '#cccccc' });
            } else {
                langBtnENBg.setTexture('button_hover').clearTint();
                langBtnENTxt.setStyle({ fill: '#ffffff' });
                langBtnPTBg.setTexture('button_normal').setTint(0x888888);
                langBtnPTTxt.setStyle({ fill: '#cccccc' });
            }
        };

        langBtnPTBg.on('pointerdown', () => {
            SoundManager.play('menu_click');
            I18n.setLang('pt');
            refreshLang();
        });
        langBtnENBg.on('pointerdown', () => {
            SoundManager.play('menu_click');
            I18n.setLang('en');
            refreshLang();
        });

        // ── BOTÃO MUTE ────────────────────────────────────────────────────
        const muteBtn = this.add.image(W - 36, 36, SoundManager.muted ? 'sound_off' : 'sound_on')
            .setScale(1.5)
            .setInteractive({ useHandCursor: true });

        muteBtn.on('pointerdown', () => {
            SoundManager.toggleMute();
            muteBtn.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
        });
        muteBtn.on('pointerover', () => muteBtn.setAlpha(0.7));
        muteBtn.on('pointerout',  () => muteBtn.setAlpha(1));

        // Dica de controlos
        const creditos = this.add.text(W/2, H/2 + 180, I18n.t('menu.credits'), {
            fontFamily: 'Georgia, serif', fontSize: '11px', fill: '#5c3d24', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);

        // Initialize language button states
        refreshLang();

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
