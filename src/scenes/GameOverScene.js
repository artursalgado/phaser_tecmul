import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

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

        // Partículas de sangue (círculos vermelhos a cair)
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

        // Moldura/Painel de fundo usando NineSlice
        const panel = this.add.nineslice(W/2, H/2 - 20, 'panel_win_loose', null, 500, 360, 16, 16, 16, 16)
            .setAlpha(0).setDepth(5);

        const titulo = this.add.text(W/2, H/2 - 120, I18n.t('gameover.title'), {
            fontFamily: 'Georgia, serif', fontSize: '56px', fill: '#880000', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const sub = this.add.text(W/2, H/2 - 50, I18n.t('gameover.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '18px', fill: '#5c3d24', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Estatísticas
        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2, '0');
        const statsLabel = I18n.lang === 'en'
            ? `Time: ${mm}:${ss}   |   Kills: ${kills}   |   Score: ${score}`
            : `Tempo: ${mm}:${ss}   |   Abates: ${kills}   |   Pontos: ${score}`;

        const statsText = this.add.text(W/2, H/2, statsLabel, {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#3d2314', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const btnRestartBg = this.add.nineslice(W/2, H/2 + 65, 'button_normal', null, 240, 44, 10, 10, 10, 10)
            .setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });
        const btnRestartTxt = this.add.text(W/2, H/2 + 65, I18n.t('gameover.restart'), {
            fontFamily: 'Georgia, serif', fontSize: '16px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(7);

        btnRestartBg.on('pointerover', () => {
            btnRestartBg.setTexture('button_hover');
            this.tweens.add({ targets: [btnRestartBg, btnRestartTxt], scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        btnRestartBg.on('pointerout', () => {
            btnRestartBg.setTexture('button_normal');
            this.tweens.add({ targets: [btnRestartBg, btnRestartTxt], scaleX: 1, scaleY: 1, duration: 100 });
        });
        btnRestartBg.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenuBg = this.add.nineslice(W/2, H/2 + 120, 'button_normal', null, 240, 44, 10, 10, 10, 10)
            .setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });
        const btnMenuTxt = this.add.text(W/2, H/2 + 120, I18n.t('gameover.menu'), {
            fontFamily: 'Georgia, serif', fontSize: '16px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(7);

        btnMenuBg.on('pointerover', () => {
            btnMenuBg.setTexture('button_hover');
            this.tweens.add({ targets: [btnMenuBg, btnMenuTxt], scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        btnMenuBg.on('pointerout', () => {
            btnMenuBg.setTexture('button_normal');
            this.tweens.add({ targets: [btnMenuBg, btnMenuTxt], scaleX: 1, scaleY: 1, duration: 100 });
        });
        btnMenuBg.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        this.tweens.add({
            targets: [panel, titulo, sub, statsText, btnRestartBg, btnRestartTxt, btnMenuBg, btnMenuTxt],
            alpha: 1,
            duration: 900,
            delay: 400
        });

        // Teclas rápidas
        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });
        this.input.keyboard.once('keydown-M', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Dica teclas
        this.add.text(W/2, H - 24,
            I18n.lang === 'en' ? '[R] Retry  ·  [M] Menu' : '[R] Tentar de novo  ·  [M] Menu',
            { fontSize: '11px', fill: '#555555' }
        ).setOrigin(0.5);
    }
}
