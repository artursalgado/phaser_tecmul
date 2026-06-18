import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create(data) {
        const W = 960, H = 640;
        const score = data?.score ?? 0;
        const kills = data?.kills ?? 0;
        const time  = data?.time  ?? 0;

        SoundManager.play('victory');
        SoundManager.stopBgMusic();

        this.cameras.main.fadeIn(700, 0, 0, 0);

        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x1a1000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.9, duration: 600 });

        for (let i = 0; i < 30; i++) {
            const star = this.add.text(
                Phaser.Math.Between(50, W - 50),
                Phaser.Math.Between(50, H - 50),
                '*', { fontSize: Phaser.Math.Between(10, 24) + 'px', fill: '#f0e68c' }
            ).setAlpha(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0, to: Phaser.Math.FloatBetween(0.3, 1) },
                duration: Phaser.Math.Between(500, 1500),
                delay: Phaser.Math.Between(0, 1000),
                yoyo: true, repeat: -1
            });
        }

        // Moldura/Painel de fundo usando NineSlice
        const panel = this.add.nineslice(W/2, H/2 - 20, 'panel_win_loose', null, 500, 360, 16, 16, 16, 16)
            .setAlpha(0).setDepth(5);

        const titulo = this.add.text(W/2, H/2 - 120, I18n.t('victory.title'), {
            fontFamily: 'Georgia, serif', fontSize: '56px', fill: '#6e4c13', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const sub = this.add.text(W/2, H/2 - 55, I18n.t('victory.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '18px', fill: '#5c3d24', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2,'0');
        const statsLabel = I18n.lang === 'en'
            ? ('Time: ' + mm + ':' + ss + '  |  Kills: ' + kills + '  |  Score: ' + score)
            : ('Tempo: ' + mm + ':' + ss + '  |  Abates: ' + kills + '  |  Pontos: ' + score);

        const statsText = this.add.text(W/2, H/2 - 10, statsLabel, {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#3d2314', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const btnRestartBg = this.add.nineslice(W/2, H/2 + 55, 'button_normal', null, 240, 44, 6, 6, 6, 6)
            .setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });
        const btnRestartTxt = this.add.text(W/2, H/2 + 55, I18n.t('victory.restart'), {
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
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenuBg = this.add.nineslice(W/2, H/2 + 110, 'button_normal', null, 240, 44, 6, 6, 6, 6)
            .setAlpha(0).setDepth(6).setInteractive({ useHandCursor: true });
        const btnMenuTxt = this.add.text(W/2, H/2 + 110, I18n.t('victory.menu'), {
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
            this.scene.stop('VictoryScene');
            this.scene.start('MenuScene');
        });

        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const cutsceneText = this.add.text(W/2, H/2 - 20, '', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'italic',
            align: 'center', wordWrap: { width: 700 }
        }).setOrigin(0.5);

        const linhasPt = [
            'A jangada esta pronta.',
            'Empurras os destrocos para a agua...',
            'O mar abre-se a tua frente.'
        ];
        const linhasEn = [
            'The raft is ready.',
            'You push the wreckage into the water...',
            'The sea opens up before you.'
        ];
        const linhas = I18n.lang === 'en' ? linhasEn : linhasPt;

        const mostrarLinha = (i) => {
            if (i >= linhas.length) {
                cutsceneText.destroy();
                this.tweens.add({
                    targets: [panel, titulo, sub, statsText, btnRestartBg, btnRestartTxt, btnMenuBg, btnMenuTxt],
                    alpha: 1, duration: 600
                });
                return;
            }
            cutsceneText.setText(linhas[i]).setAlpha(0);
            this.tweens.add({
                targets: cutsceneText, alpha: 1, duration: 500,
                onComplete: () => {
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: cutsceneText, alpha: 0, duration: 400,
                            onComplete: () => mostrarLinha(i + 1)
                        });
                    });
                }
            });
        };
        mostrarLinha(0);
    }
}