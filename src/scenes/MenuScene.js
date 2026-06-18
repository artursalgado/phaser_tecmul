import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

// ─── Helper: botão desenhado com Graphics (sem texturas) ──────────────────────
function makeBtn(scene, x, y, w, h, label, depth = 2) {
    const BG_IDLE  = 0x3d2008;
    const BG_HOVER = 0x6b3810;
    const BORDER   = 0x9a6030;
    const RADIUS   = 8;

    const gfx = scene.add.graphics().setDepth(depth);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '18px',
        fill: '#f0ddb8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);

    const draw = (hover) => {
        gfx.clear();
        gfx.fillStyle(hover ? BG_HOVER : BG_IDLE, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
        gfx.lineStyle(2, BORDER, 1);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
    };

    draw(false);

    // Hit zone invisível
    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    zone.on('pointerover',  () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
    zone.on('pointerout',   () => { draw(false); txt.setStyle({ fill: '#f0ddb8' }); });

    return { gfx, txt, zone, setLabel: (s) => txt.setText(s) };
}

// ─── Helper: botão pequeno de língua ──────────────────────────────────────────
function makeLangBtn(scene, x, y, label, depth = 2) {
    const w = 90, h = 34;
    const BG_IDLE   = 0x2a1505;
    const BG_ACTIVE = 0x6b3810;
    const BORDER    = 0x7a4a1a;
    const RADIUS    = 6;

    const gfx = scene.add.graphics().setDepth(depth);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '13px',
        fill: '#c8a070', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);

    let _active = false;

    const draw = () => {
        gfx.clear();
        gfx.fillStyle(_active ? BG_ACTIVE : BG_IDLE, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
        gfx.lineStyle(2, BORDER, 1);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
    };

    draw();

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    return {
        gfx, txt, zone,
        setActive: (v) => { _active = v; draw(); txt.setStyle({ fill: v ? '#ffffff' : '#c8a070' }); },
    };
}

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
        this.add.rectangle(W/2, H/2 - 60, 320, 2, 0x5c3d24, 0.4).setDepth(2);

        // ── BOTÃO JOGAR ───────────────────────────────────────────────────────
        const btnJogar = makeBtn(this, W/2, H/2 + 10, 240, 50, I18n.t('menu.play'), 2);
        btnJogar.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SoundManager.resume();
            SoundManager.stopBgMusic();
            this.time.delayedCall(120, () => this.scene.start('IntroScene'));
        });

        // ── SELETOR DE LÍNGUA ─────────────────────────────────────────────────
        const langPT = makeLangBtn(this, W/2 - 60, H/2 + 100, '🇵🇹 PT', 2);
        const langEN = makeLangBtn(this, W/2 + 60, H/2 + 100, '🇬🇧 EN', 2);

        const refreshLang = () => {
            titulo.setText(I18n.t('menu.title'));
            subtitulo.setText(I18n.t('menu.subtitle'));
            btnJogar.setLabel(I18n.t('menu.play'));
            creditos.setText(I18n.t('menu.credits'));
            muteBtn.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
            langPT.setActive(I18n.lang === 'pt');
            langEN.setActive(I18n.lang === 'en');
        };

        langPT.zone.on('pointerdown', () => { SoundManager.play('menu_click'); I18n.setLang('pt'); refreshLang(); });
        langEN.zone.on('pointerdown', () => { SoundManager.play('menu_click'); I18n.setLang('en'); refreshLang(); });

        // ── BOTÃO MUTE ────────────────────────────────────────────────────────
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

        refreshLang();

        // Versão
        this.add.text(16, H - 16, 'v0.3', { fontSize: '11px', fill: '#333355' });

        // Animação de pulsar no título
        this.tweens.add({
            targets: titulo, alpha: 0.7,
            duration: 2200, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        SoundManager.resume();
        SoundManager.startBgMusic();
    }
}
