import { ITEM_DB } from '../systems/Inventory.js';

// Representa um item colecionável colocado no mapa (recursos, ferramentas, comida, etc.)
// O jogador apanha-o ao caminhar por cima dele (colisão overlap na GameScene -> apanharItem).
export default class CollectibleItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, itemId, quantity = 1) {
        // Encontra o ícone correto definido na base de dados de itens
        const def = ITEM_DB[itemId];
        const texture = def ? def.icon : itemId;

        // Inicializa o sprite na posição X/Y
        super(scene, x, y, texture);

        this.itemId = itemId;
        this.quantity = quantity;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // O item não obstrui o jogador, é apenas um gatilho sensor (sensor overlap)
        this.body.setImmovable(true);

        // Configuração de tamanho e profundidade de renderização básica
        this.setScale(1.2);
        this.setDepth(2); // Renderiza acima do chão mas abaixo de sprites como árvores e monstros

        // Pequena animação de flutuação vertical para dar sensação que o item está a flutuar no ar
        scene.tweens.add({
            targets: this,
            y: y - 3,
            duration: 650,
            yoyo: true, // Faz a animação andar para a frente e para trás
            repeat: -1, // Repete infinitamente
            ease: 'Sine.easeInOut'
        });
    }
}