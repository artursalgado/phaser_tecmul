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

        const titulo = this.add.text(W/2, H/2 - 140, I18n.t('gameover.title'), {
            fontSize: '68px', fill: '#cc0000', fontStyle: 'bold',
            stroke: '#550000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        const sub = this.add.text(W/2, H/2 - 60, I18n.t('gameover.subtitle'), {
            fontSize: '22px', fill: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        // Estatísticas
        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2, '0');
        const statsLabel = I18n.lang === 'en'
            ? `Time: ${mm}:${ss}   |   Kills: ${kills}   |   Score: ${score}`
            : `Tempo: ${mm}:${ss}   |   Abates: ${kills}   |   Pontos: ${score}`;

        const statsText = this.add.text(W/2, H/2 - 10, statsLabel, {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [titulo, sub, statsText], alpha: 1, duration: 900, delay: 400 });

        const btnRestart = this.add.text(W/2, H/2 + 80, I18n.t('gameover.restart'), {
            fontSize: '30px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenu = this.add.text(W/2, H/2 + 130, I18n.t('gameover.menu'), {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
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
