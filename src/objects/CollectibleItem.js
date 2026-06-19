import { ITEM_DB } from '../systems/Inventory.js';

// Representa um item colecionável colocado no mapa (recursos, ferramentas, etc.)
// O jogador apanha-o ao tocar nele (ver GameScene -> apanharItem).
export default class CollectibleItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, itemId, quantity = 1) {
        const def = ITEM_DB[itemId];
        const texture = def ? def.icon : itemId;

        super(scene, x, y, texture);

        this.itemId = itemId;
        this.quantity = quantity;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Não bloqueia o jogador, serve só para deteção de sobreposição
        this.body.setImmovable(true);

        this.setScale(1.2);
        this.setDepth(2);

        // Pequena animação de flutuação para o item se destacar no mapa
        scene.tweens.add({
            targets: this,
            y: y - 3,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}