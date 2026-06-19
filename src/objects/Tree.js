import { burst } from '../systems/Particles.js';
import I18n from '../systems/I18n.js';

// Árvore interativa no mapa que pode ser cortada com o ataque do jogador (barra de espaço).
// Leva 3 machadadas para ser destruída, concedendo itens de madeira diretamente ao jogador.
export default class Tree extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Inicializa o sprite da árvore
        super(scene, x, y, 'spr_deco_tree_01_strip4', 0);
        scene.add.existing(this);
        
        // Adiciona um corpo de física estático.
        // O argumento 'true' faz com que a árvore seja estática, ou seja, obstáculo inamovível
        // com o qual o jogador ou monstros colidem mas não conseguem mover do sítio.
        scene.physics.add.existing(this, true); 

        // Define a origem na base inferior central da árvore.
        // Isto é crucial para o motor de Y-sorting ordenar corretamente a renderização
        // (desenhar o jogador à frente da árvore se estiver abaixo da sua base, ou atrás se estiver acima).
        this.setOrigin(0.5, 1);
        this.hitsLeft = 3;       // Número de golpes necessários para derrubar
        this.woodGiven = 2;      // Quantidade de madeira concedida ao cair
        this.dead = false;
    }

    // Método chamado pelo Player.js quando atinge esta árvore
    chop() {
        if (this.dead) return;
        this.hitsLeft--;

        // Efeito de partículas: liberta pequenas folhas verdes ao ser atingida
        burst(this.scene, this.x, this.y - 20, { color: 0x66cc44, count: 5, speed: 90, lifespan: 400, scale: 0.5 });

        // Aplica um tom acastanhado/amarelado temporário para simular o tremor ou impacto
        this.setTint(0xddaa66);
        this.scene.time.delayedCall(120, () => { 
            if (!this.dead) this.clearTint(); 
        });

        // Derruba a árvore se os golpes chegarem a zero
        if (this.hitsLeft <= 0) {
            this.fall();
        }
    }

    // Lógica para derrubar a árvore, dar recompensas e animar o seu desaparecimento
    fall() {
        this.dead = true;

        // Adiciona a madeira recolhida diretamente ao inventário do jogador
        this.scene.inventory.addItem('wood', this.woodGiven);

        // Cria um texto flutuante "+2 Madeira" na posição da árvore
        const txt = this.scene.add.text(this.x, this.y - 40, `+${this.woodGiven} ${I18n.t('items.wood')}`, {
            fontSize: '10px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        // Animação de subida e desvanecimento do texto flutuante
        this.scene.tweens.add({
            targets: txt, y: txt.y - 30, alpha: 0,
            duration: 900, onComplete: () => txt.destroy()
        });

        // Cria efeitos visuais de poeira, madeira lascada e folhas adicionais
        burst(this.scene, this.x, this.y - 16, { color: 0x88cc44, count: 14, speed: 150, lifespan: 600, scale: 0.8, gravity: 220 });
        burst(this.scene, this.x, this.y - 16, { color: 0xaa7733, count: 6,  speed: 80,  lifespan: 400, scale: 0.5 });

        // Anima o sprite da árvore desvanecendo antes de o apagar completamente do jogo
        this.scene.tweens.add({
            targets: this, alpha: 0, duration: 300,
            onComplete: () => this.destroy()
        });
    }
}
