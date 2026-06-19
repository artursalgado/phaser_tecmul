import Skeleton from './Skeleton.js';
import CollectibleItem from './CollectibleItem.js';
import { burst } from '../systems/Particles.js';

export default class BossSkeleton extends Skeleton {
    constructor(scene, x, y) {
        // Inicializa o Boss reutilizando o sprite e animações do Esqueleto normal
        super(scene, x, y);

        // Atributos especiais do Boss:
        // Vida muito alta (120 HP), dano pesado (15), escala de tamanho aumentada e cor de fogo
        this.maxHealth      = 120;
        this.health         = 120;
        this.damage         = 15;
        this.speed          = 75;
        this.detectionRange = 320; // Deteta o jogador de muito longe
        this.setScale(1.05);

        this.setTint(0xff6622); // Cor de brasa flamejante
        this.bossTint = 0xff6622;

        // Cria a barra de vida gigante na parte de cima do ecrã
        this.criarBarraVidaBoss(scene);
        this.roared = false; // Flag para garantir que o grito de surgimento só acontece uma vez
    }

    // Cria os retângulos de UI que mostram a barra de vida do Boss fixada no topo do ecrã
    criarBarraVidaBoss(scene) {
        const W = scene.scale.width;
        
        // Fundo vermelho escuro com borda branca, não acompanha a câmara de jogo (ScrollFactor a 0)
        this.bossBarBg = scene.add.rectangle(W / 2, 22, 200, 14, 0x330000)
            .setScrollFactor(0).setDepth(200).setStrokeStyle(2, 0xffffff, 0.6);
            
        // Barra vermelha de vida que é redimensionada dinamicamente
        this.bossBar = scene.add.rectangle(W / 2 - 98, 22, 196, 10, 0xff3300)
            .setScrollFactor(0).setDepth(201).setOrigin(0, 0.5);
            
        // Texto identificativo do Boss
        this.bossLabel = scene.add.text(W / 2, 10, '💀 BOSS SKELETON', {
            fontSize: '9px', fill: '#ffaa66', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    // Atualiza a largura do preenchimento da barra de vida com base na percentagem restante
    atualizarBarraVidaBoss() {
        const percentagem = Math.max(0, this.health / this.maxHealth);
        this.bossBar.setDisplaySize(196 * percentagem, 10);
    }

    // Efeito de introdução dramática ao encontrar o Boss (treme o ecrã e aproxima a câmara)
    rugir() {
        if (this.roared) return;
        this.roared = true;
        const scene = this.scene;
        
        // Treme a câmara principal por 300ms
        scene.cameras.main.shake(300, 0.005);

        // Faz zoom in rápido e zoom out de volta para dar sensação de impacto
        const cam = scene.cameras.main;
        scene.tweens.add({
            targets: cam, zoom: cam.zoom * 1.1,
            duration: 250, ease: 'Sine.easeOut',
            onComplete: () => {
                scene.tweens.add({ targets: cam, zoom: cam.zoom / 1.1, duration: 400, ease: 'Sine.easeIn' });
            }
        });
        
        // Mensagem de alerta vermelha flutuante na tela
        const textoAviso = scene.add.text(scene.scale.width / 2, 50, '💀 BOSS APARECEU!', {
            fontSize: '18px', fill: '#ff4400', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        
        scene.tweens.add({
            targets: textoAviso, alpha: 0, delay: 1800, duration: 800,
            onComplete: () => textoAviso.destroy()
        });
    }

    update(player, time, delta) {
        if (this.dead) return;
        this.atualizarBarraVidaBoss();

        // Se o jogador estiver dentro do raio de deteção, inicia o evento do Boss
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < this.detectionRange) {
            this.rugir();
        }

        // Executa a lógica de perseguição do esqueleto normal
        super.update(player, time, delta);
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        
        // Aplica o dano normal do esqueleto
        super.takeDamage(amount, fromDir);
        
        // Redefine a cor laranja do boss após a animação de piscar vermelho de dano
        if (!this.dead) {
            this.scene.time.delayedCall(300, () => {
                if (!this.dead) this.setTint(this.bossTint);
            });
        }
        this.atualizarBarraVidaBoss();
    }

    // Sobrescreve a morte para tremer o ecrã intensamente, gerar mais partículas e largar o item da quest
    morrer() {
        this.dead = true;
        this.hpBar?.destroy();
        this.hpBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('skeleton_death', true);

        // Tremor forte de câmara no final
        this.scene.cameras.main.shake(500, 0.012);
        
        // Gera explosões massivas de sangue laranja e fagulhas amarelas
        burst(this.scene, this.x, this.y - 20, { color: 0xff6622, count: 20, speed: 180, lifespan: 700, scale: 1.0, gravity: 200 });
        burst(this.scene, this.x, this.y - 20, { color: 0xffdd44, count: 10, speed: 100, lifespan: 500, scale: 0.5 });

        // Limpa a UI do boss do topo da tela
        this.bossBar?.destroy();
        this.bossBarBg?.destroy();
        this.bossLabel?.destroy();

        // Quando a animação de morte acaba, faz cair a vela da jangada (sail)
        this.once('animationcomplete', () => {
            const vela = new CollectibleItem(this.scene, this.x, this.y, 'sail', 1);
            this.scene.pickups.add(vela);

            // Avisa o jogador com texto no chão onde caiu a vela
            const textoQueda = this.scene.add.text(this.x, this.y - 40, '⚓ VELA CAIU!', {
                fontSize: '14px', fill: '#ffdd66', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(30);
            
            this.scene.tweens.add({
                targets: textoQueda, y: textoQueda.y - 40, alpha: 0,
                duration: 1500, onComplete: () => textoQueda.destroy()
            });

            // Avisa a GameScene para parar spawn de monstros por agora ou registar morte
            this.scene.events.emit('bossDefeated');
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
