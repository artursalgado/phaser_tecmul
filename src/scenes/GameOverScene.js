export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const W = 960, H = 640;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

        this.add.text(W / 2, H / 2 - 100, '💀 GAME OVER', {
            fontSize: '64px', fill: '#cc0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2, 'Não sobreviveste à ilha.', {
            fontSize: '22px', fill: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5);

        const btnRestart = this.add.text(W / 2, H / 2 + 80, '↺  Tentar Novamente', {
            fontSize: '28px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenu = this.add.text(W / 2, H / 2 + 130, '← Menu Principal', {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });
    }
}
