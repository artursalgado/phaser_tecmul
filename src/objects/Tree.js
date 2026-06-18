// Árvore que pode ser cortada com o ataque (ESPAÇO).
// É bem simples: leva 3 machadadas, depois desaparece e dá madeira ao jogador.
export default class Tree extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spr_deco_tree_01_strip4', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = corpo fixo (a árvore não se move)

        this.setOrigin(0.5, 1);
        this.hitsLeft = 3;       // quantas machadadas até cair
        this.woodGiven = 2;      // quanta madeira dá quando cai
        this.dead = false;
    }

    // Chamado pelo Player quando o ataque acerta a árvore
    chop() {
        if (this.dead) return;
        this.hitsLeft--;

        // Feedback visual simples: tremer um pouco
        this.setTint(0xddaa66);
        this.scene.time.delayedCall(120, () => { if (!this.dead) this.clearTint(); });

        if (this.hitsLeft <= 0) {
            this._fall();
        }
    }

    _fall() {
        this.dead = true;

        // Dar madeira diretamente ao inventário (mais simples que criar um pickup no chão)
        this.scene.inventory.addItem('wood', this.woodGiven);

        // Texto "+2 Madeira" a subir, igual ao dos outros itens apanhados
        const txt = this.scene.add.text(this.x, this.y - 40, `+${this.woodGiven} Madeira`, {
            fontSize: '10px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt, y: txt.y - 30, alpha: 0,
            duration: 900, onComplete: () => txt.destroy()
        });

        // A árvore desaparece com um pequeno fade
        this.scene.tweens.add({
            targets: this, alpha: 0, duration: 300,
            onComplete: () => this.destroy()
        });
    }
}
