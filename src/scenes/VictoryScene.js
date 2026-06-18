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

        const titulo = this.add.text(W/2, H/2 - 160, I18n.t('victory.title'), {
            fontSize: '64px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const sub = this.add.text(W/2, H/2 - 80, I18n.t('victory.subtitle'), {
            fontSize: '22px', fill: '#ddddaa', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2,'0');
        const statsLabel = I18n.lang === 'en'
            ? ('Time: ' + mm + ':' + ss + '  |  Kills: ' + kills + '  |  Score: ' + score)
            : ('Tempo: ' + mm + ':' + ss + '  |  Abates: ' + kills + '  |  Pontos: ' + score);

        const statsText = this.add.text(W/2, H/2 - 30, statsLabel, {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const btnRestart = this.add.text(W/2, H/2 + 60, I18n.t('victory.restart'), {
            fontSize: '28px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenu = this.add.text(W/2, H/2 + 110, I18n.t('victory.menu'), {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
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
                    targets: [titulo, sub, statsText, btnRestart, btnMenu],
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