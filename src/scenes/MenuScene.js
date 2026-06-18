import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

// ─── Helper: botão simples desenhado com Graphics ─────────────────────────────
function makeBtn(scene, x, y, w, h, label, depth = 3) {
    const BG_IDLE  = 0x3d2008;
    const BG_HOVER = 0x6b3810;
    const BORDER   = 0xc8901a;
    const RADIUS   = 8;

    const gfx = scene.add.graphics().setDepth(depth);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '19px',
        fill: '#f5e0b0', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);

    const draw = (hover) => {
        gfx.clear();
        gfx.fillStyle(hover ? BG_HOVER : BG_IDLE, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
        gfx.lineStyle(2, BORDER, hover ? 1 : 0.6);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
    };

    draw(false);

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    zone.on('pointerover',  () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
    zone.on('pointerout',   () => { draw(false); txt.setStyle({ fill: '#f5e0b0' }); });

    return { gfx, txt, zone, setLabel: (s) => txt.setText(s) };
}

// ─── Helper: botão de língua pequeno ─────────────────────────────────────────
function makeLangBtn(scene, x, y, label, depth = 3) {
    const w = 88, h = 32;
    const gfx = scene.add.graphics().setDepth(depth);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '13px',
        fill: '#c8a070', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);

    let _active = false;

    const draw = () => {
        gfx.clear();
        gfx.fillStyle(_active ? 0x6b3810 : 0x2a1505, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
        gfx.lineStyle(2, 0xc8901a, _active ? 1 : 0.4);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
    };
    draw();

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    return {
        gfx, txt, zone,
        setActive: (v) => {
            _active = v;
            draw();
            txt.setStyle({ fill: v ? '#ffffff' : '#c8a070' });
        },
    };
}

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        SoundManager.init();

        const W = 960, H = 640;

        // ── Fundo noite com gradiente ─────────────────────────────────────────
        this.add.rectangle(W/2, H/2, W, H, 0x060812);
        // Gradiente simulado (overlay escuro em baixo)
        this.add.rectangle(W/2, H * 0.78, W, H * 0.44, 0x020408, 0.8);

        // ── Estrelas ──────────────────────────────────────────────────────────
        for (let i = 0; i < 70; i++) {
            const size = Phaser.Math.Between(1, 2);
            const s = this.add.circle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H * 0.65),
                size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9)
            );
            this.tweens.add({
                targets: s, alpha: Phaser.Math.FloatBetween(0.05, 0.3),
                duration: Phaser.Math.Between(1200, 3500),
                yoyo: true, repeat: -1,
                delay: Phaser.Math.Between(0, 2500)
            });
        }

        // ── Painel scroll RPG (NineSlice com scroll_rpg 128×176, bordas 16px) ─
        const scrollH = 480;
        this.menuBg = this.add.nineslice(W/2, H/2 - 10, 'scroll_rpg', null, 460, scrollH, 18, 18, 24, 24)
            .setDepth(1);

        // ── Título ────────────────────────────────────────────────────────────
        const titulo = this.add.text(W/2, H/2 - 188, I18n.t('menu.title'), {
            fontFamily: 'Georgia, serif', fontSize: '60px', fill: '#3d2008',
            fontStyle: 'bold', align: 'center',
            stroke: '#c8a060', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(2);

        // ── Subtítulo ─────────────────────────────────────────────────────────
        const subtitulo = this.add.text(W/2, H/2 - 112, I18n.t('menu.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '14px', fill: '#6b4820',
            fontStyle: 'italic', align: 'center',
        }).setOrigin(0.5).setDepth(2);

        // ── Linha ornamental ──────────────────────────────────────────────────
        const divGfx = this.add.graphics().setDepth(2);
        const drawDiv = () => {
            divGfx.clear();
            divGfx.lineStyle(1, 0x9a6030, 0.5);
            divGfx.lineBetween(W/2 - 170, H/2 - 86, W/2 + 170, H/2 - 86);
            divGfx.fillStyle(0x9a6030, 0.6);
            divGfx.fillTriangle(W/2 - 10, H/2 - 86, W/2, H/2 - 80, W/2 + 10, H/2 - 86);
        };
        drawDiv();

        // ── Botão Jogar ───────────────────────────────────────────────────────
        const btnJogar = makeBtn(this, W/2, H/2 - 34, 260, 52, I18n.t('menu.play'), 2);
        btnJogar.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SoundManager.resume();
            SoundManager.stopBgMusic();
            this.time.delayedCall(120, () => this.scene.start('IntroScene'));
        });

        // ── Seletor de língua ─────────────────────────────────────────────────
        const langPT = makeLangBtn(this, W/2 - 58, H/2 + 56, '🇵🇹 PT', 2);
        const langEN = makeLangBtn(this, W/2 + 58, H/2 + 56, '🇬🇧 EN', 2);

        // ── Dica de controlos ─────────────────────────────────────────────────
        const creditos = this.add.text(W/2, H/2 + 182, I18n.t('menu.credits'), {
            fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#6b4820',
            fontStyle: 'italic', align: 'center', wordWrap: { width: 400 },
        }).setOrigin(0.5).setDepth(2);

        // ── Botão Mute ────────────────────────────────────────────────────────
        const muteBtn = this.add.image(W - 36, 36, SoundManager.muted ? 'sound_off' : 'sound_on')
            .setScale(1.5).setDepth(5).setInteractive({ useHandCursor: true });
        muteBtn.on('pointerdown', () => {
            SoundManager.toggleMute();
            muteBtn.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
        });
        muteBtn.on('pointerover', () => muteBtn.setAlpha(0.7));
        muteBtn.on('pointerout',  () => muteBtn.setAlpha(1));

        // ── Refresh de língua ─────────────────────────────────────────────────
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

        refreshLang();

        // ── Versão ────────────────────────────────────────────────────────────
        this.add.text(16, H - 16, 'v0.3', { fontSize: '11px', fill: '#2a1a08' }).setDepth(2);

        // ── Pulso no título ───────────────────────────────────────────────────
        this.tweens.add({
            targets: titulo, alpha: 0.75,
            duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        SoundManager.resume();
        SoundManager.startBgMusic();
    }
}
