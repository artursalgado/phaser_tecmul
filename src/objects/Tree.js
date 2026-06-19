import { burst } from '../systems/Particles.js';
import I18n from '../systems/I18n.js';

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

        // Particulas de folhas ao bater
        burst(this.scene, this.x, this.y - 20, { color: 0x66cc44, count: 5, speed: 90, lifespan: 400, scale: 0.5 });

        this.setTint(0xddaa66);
        this.scene.time.delayedCall(120, () => { if (!this.dead) this.clearTint(); });

        if (this.hitsLeft <= 0) {
            this.fall();
        }
    }

    fall() {
        this.dead = true;

        // Adiciona a madeira diretamente no inventario
        this.scene.inventory.addItem('wood', this.woodGiven);

        // Cria o texto flutuante
        const txt = this.scene.add.text(this.x, this.y - 40, `+${this.woodGiven} ${I18n.t('items.wood')}`, {
            fontSize: '10px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt, y: txt.y - 30, alpha: 0,
            duration: 900, onComplete: () => txt.destroy()
        });

        // Particulas de madeira e folhas
        burst(this.scene, this.x, this.y - 16, { color: 0x88cc44, count: 14, speed: 150, lifespan: 600, scale: 0.8, gravity: 220 });
        burst(this.scene, this.x, this.y - 16, { color: 0xaa7733, count: 6,  speed: 80,  lifespan: 400, scale: 0.5 });

        this.scene.tweens.add({
            targets: this, alpha: 0, duration: 300,
            onComplete: () => this.destroy()
        });
    }
}
