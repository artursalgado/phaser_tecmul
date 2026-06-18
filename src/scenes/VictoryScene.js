export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const W = 960, H = 640;

        this.add.rectangle(W / 2, H / 2, W, H, 0x001a0d, 0.85);

        // Conteúdo principal -- começa invisível, aparece após a mini-cutscene
        const title = this.add.text(W / 2, H / 2 - 100, '⛵ CONSEGUISTE FUGIR!', {
            fontSize: '56px', fill: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        const subtitle = this.add.text(W / 2, H / 2, 'A jangada está completa. A ilha fica atrás de ti.', {
            fontSize: '22px', fill: '#9ef79e', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);

        const btnRestart = this.add.text(W / 2, H / 2 + 80, '↺  Jogar Novamente', {
            fontSize: '28px', fill: '#f0e68c', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        btnRestart.on('pointerover', () => btnRestart.setStyle({ fill: '#ffffff' }));
        btnRestart.on('pointerout',  () => btnRestart.setStyle({ fill: '#f0e68c' }));
        btnRestart.on('pointerdown', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        const btnMenu = this.add.text(W / 2, H / 2 + 130, '← Menu Principal', {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerover', () => btnMenu.setStyle({ fill: '#cccccc' }));
        btnMenu.on('pointerout',  () => btnMenu.setStyle({ fill: '#888888' }));
        btnMenu.on('pointerdown', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('MenuScene');
        });

        // ── Mini-cutscene (~7s) ──────────────────────────────────────────────
        // Texto narrativo que aparece e desaparece em sequência, antes de
        // revelar o ecrã de vitória com os botões.
        const cutsceneText = this.add.text(W / 2, H / 2 - 20, '', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'italic',
            align: 'center', wordWrap: { width: 700 }
        }).setOrigin(0.5);

        const linhas = [
            'A jangada está pronta.',
            'Empurras os destroços para a água...',
            'O mar abre-se à tua frente.'
        ];

        const mostrarLinha = (i) => {
            if (i >= linhas.length) {
                cutsceneText.destroy();
                this.tweens.add({
                    targets: [title, subtitle, btnRestart, btnMenu],
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
