import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

// ─── Helper: botão desenhado com Graphics (sem texturas) ──────────────────────
function makeBtn(scene, x, y, w, h, label, depth = 6) {
    const BG_IDLE  = 0x3d2008;
    const BG_HOVER = 0x6b3810;
    const BORDER   = 0x9a6030;
    const RADIUS   = 8;

    const gfx = scene.add.graphics().setDepth(depth).setAlpha(0);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '16px',
        fill: '#f0ddb8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1).setAlpha(0);

    const draw = (hover) => {
        gfx.clear();
        gfx.fillStyle(hover ? BG_HOVER : BG_IDLE, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
        gfx.lineStyle(2, BORDER, 1);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
    };

    draw(false);

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2).setAlpha(0);

    zone.on('pointerover',  () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
    zone.on('pointerout',   () => { draw(false); txt.setStyle({ fill: '#f0ddb8' }); });

    return { gfx, txt, zone };
}

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const W = 960, H = 640;
        const score = data?.score ?? 0;
        const kills = data?.kills ?? 0;
        const time  = data?.time  ?? 0;

        SoundManager.stopBgMusic();
        SoundManager.play('die');

        // Fundo com fade-in
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.88, duration: 700 });

        // Partículas de sangue
        for (let i = 0; i < 18; i++) {
            const drop = this.add.circle(
                Phaser.Math.Between(80, W - 80),
                Phaser.Math.Between(-40, H / 2),
                Phaser.Math.Between(3, 9), 0xaa0000, 0.7
            );
            this.tweens.add({
                targets: drop,
                y: drop.y + Phaser.Math.Between(200, 500),
                alpha: 0,
                duration: Phaser.Math.Between(1200, 2400),
                delay: Phaser.Math.Between(0, 800),
                ease: 'Quad.easeIn'
            });
        }

        // Painel RPG (Graphics)
        const panelW = 480, panelH = 370;
        const cx = W/2 - panelW/2;
        const cy = (H/2 - 10) - panelH/2;

        const panel = this.add.graphics().setAlpha(0).setDepth(5);
        // Sombra
        panel.fillStyle(0x000000, 0.35);
        panel.fillRoundedRect(cx + 4, cy + 4, panelW, panelH, 6);
        // Fundo castanho escuro
        panel.fillStyle(0x160a00, 0.92);
        panel.fillRoundedRect(cx, cy, panelW, panelH, 6);
        // Borda dourada
        panel.lineStyle(1.5, 0xc8901a, 0.72);
        panel.strokeRoundedRect(cx, cy, panelW, panelH, 6);

        const titulo = this.add.text(W/2, H/2 - 130, I18n.t('gameover.title'), {
            fontFamily: 'Georgia, serif', fontSize: '52px', fill: '#cc2200', fontStyle: 'bold',
            stroke: '#330000', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const sub = this.add.text(W/2, H/2 - 60, I18n.t('gameover.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '17px', fill: '#c8a878', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Linha decorativa
        const divGfx = this.add.graphics().setAlpha(0).setDepth(6);
        divGfx.lineStyle(1, 0x9a6030, 0.7);
        divGfx.lineBetween(W/2 - 180, H/2 - 34, W/2 + 180, H/2 - 34);

        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2, '0');
        const statsLabel = I18n.lang === 'en'
            ? `⏱  ${mm}:${ss}     ☠  ${kills}     ★  ${score} pts`
            : `⏱  ${mm}:${ss}     ☠  ${kills}     ★  ${score} pts`;

        const statsText = this.add.text(W/2, H/2 - 14, statsLabel, {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#c8a878', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const btnRestart = makeBtn(this, W/2, H/2 + 60, 260, 46, I18n.t('gameover.restart'));
        const btnMenu    = makeBtn(this, W/2, H/2 + 116, 260, 46, I18n.t('gameover.menu'));

        btnRestart.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });
        btnMenu.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        this.tweens.add({
            targets: [
                panel, titulo, sub, divGfx, statsText,
                btnRestart.gfx, btnRestart.txt,
                btnMenu.gfx, btnMenu.txt,
            ],
            alpha: 1, duration: 900, delay: 400
        });

        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });
        this.input.keyboard.once('keydown-M', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        this.add.text(W/2, H - 24,
            I18n.lang === 'en' ? '[R] Retry  ·  [M] Menu' : '[R] Tentar de novo  ·  [M] Menu',
            { fontSize: '11px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5);
    }
}
