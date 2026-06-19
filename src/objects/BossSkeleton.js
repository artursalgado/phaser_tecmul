import Skeleton from './Skeleton.js';
import CollectibleItem from './CollectibleItem.js';
import { burst } from '../systems/Particles.js';

export default class BossSkeleton extends Skeleton {
    constructor(scene, x, y) {
        super(scene, x, y);

        // Stats: HPx4, dano x2, escala maior
        this.maxHealth      = 120;
        this.health         = 120;
        this.damage         = 15;
        this.speed          = 75;
        this.detectionRange = 320;
        this.setScale(1.05);

        this.setTint(0xff6622);
        this.bossTint = 0xff6622;

        this.criarBarraVidaBoss(scene);
        this.roared = false;
    }

    // Cria a barra de vida fixa do Boss no topo da tela
    criarBarraVidaBoss(scene) {
        const W = scene.scale.width;
        
        this.bossBarBg = scene.add.rectangle(W / 2, 22, 200, 14, 0x330000)
            .setScrollFactor(0).setDepth(200).setStrokeStyle(2, 0xffffff, 0.6);
            
        this.bossBar = scene.add.rectangle(W / 2 - 98, 22, 196, 10, 0xff3300)
            .setScrollFactor(0).setDepth(201).setOrigin(0, 0.5);
            
        this.bossLabel = scene.add.text(W / 2, 10, '💀 BOSS SKELETON', {
            fontSize: '9px', fill: '#ffaa66', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    // Atualiza a barra de vida do Boss
    atualizarBarraVidaBoss() {
        const percentagem = Math.max(0, this.health / this.maxHealth);
        this.bossBar.setDisplaySize(196 * percentagem, 10);
    }

    // Efeito visual e de camara quando o Boss surge
    rugir() {
        if (this.roared) return;
        this.roared = true;
        const scene = this.scene;
        scene.cameras.main.shake(300, 0.005);

        const cam = scene.cameras.main;
        scene.tweens.add({
            targets: cam, zoom: cam.zoom * 1.1,
            duration: 250, ease: 'Sine.easeOut',
            onComplete: () => {
                scene.tweens.add({ targets: cam, zoom: cam.zoom / 1.1, duration: 400, ease: 'Sine.easeIn' });
            }
        });
        
        const textoAviso = scene.add.text(scene.scale.width / 2, 50, '💀 BOSS APARECEU!', {
            fontSize: '18px', fill: '#ff4400', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        
        scene.tweens.add({
            targets: textoAviso, alpha: 0, delay: 1800, duration: 800,
            onComplete: () => textoAviso.destroy()
        });
    }

    // Atualiza a cada frame
    update(player, time, delta) {
        if (this.dead) return;
        this.atualizarBarraVidaBoss();

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < this.detectionRange) {
            this.rugir();
        }

        super.update(player, time, delta);
    }

    // Recebe dano
    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        super.takeDamage(amount, fromDir);
        
        if (!this.dead) {
            this.scene.time.delayedCall(300, () => {
                if (!this.dead) this.setTint(this.bossTint);
            });
        }
        this.atualizarBarraVidaBoss();
    }

    // Executa a morte do Boss
    morrer() {
        this.dead = true;
        this.hpBar?.destroy();
        this.hpBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('skeleton_death', true);

        this.scene.cameras.main.shake(500, 0.012);
        burst(this.scene, this.x, this.y - 20, { color: 0xff6622, count: 20, speed: 180, lifespan: 700, scale: 1.0, gravity: 200 });
        burst(this.scene, this.x, this.y - 20, { color: 0xffdd44, count: 10, speed: 100, lifespan: 500, scale: 0.5 });

        this.bossBar?.destroy();
        this.bossBarBg?.destroy();
        this.bossLabel?.destroy();

        this.once('animationcomplete', () => {
            const vela = new CollectibleItem(this.scene, this.x, this.y, 'sail', 1);
            this.scene.pickups.add(vela);

            const textoQueda = this.scene.add.text(this.x, this.y - 40, '⚓ VELA CAIU!', {
                fontSize: '14px', fill: '#ffdd66', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(30);
            
            this.scene.tweens.add({
                targets: textoQueda, y: textoQueda.y - 40, alpha: 0,
                duration: 1500, onComplete: () => textoQueda.destroy()
            });

            this.scene.events.emit('bossDefeated');
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
