import Skeleton from './Skeleton.js';
import CollectibleItem from './CollectibleItem.js';
import { burst } from '../systems/Particles.js';

export default class BossSkeleton extends Skeleton {
    constructor(scene, x, y) {
        super(scene, x, y);

        // Stats: HP×4, dano×2, escala×1.4, alcance maior
        this.maxHealth      = 120;
        this.health         = 120;
        this.damage         = 30;
        this.speed          = 75;
        this.detectionRange = 320;
        this.setScale(1.05);

        // Tint laranja-avermelhado para distinguir claramente
        this.setTint(0xff6622);
        this._bossTint = 0xff6622;

        // Barra de vida no ecrã (topo, fixa)
        this._buildBossHpBar(scene);

        // Rugido ao detetar o jogador pela primeira vez
        this._roared = false;
    }

    _buildBossHpBar(scene) {
        const W = scene.scale.width;
        // Fundo escuro
        this._bossBarBg = scene.add.rectangle(W / 2, 22, 200, 14, 0x330000)
            .setScrollFactor(0).setDepth(200).setStrokeStyle(2, 0xffffff, 0.6);
        // Barra de vida
        this._bossBar = scene.add.rectangle(W / 2 - 98, 22, 196, 10, 0xff3300)
            .setScrollFactor(0).setDepth(201).setOrigin(0, 0.5);
        // Label
        this._bossLabel = scene.add.text(W / 2, 10, '💀 BOSS SKELETON', {
            fontSize: '9px', fill: '#ffaa66', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    _updateBossHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        this._bossBar.setDisplaySize(196 * pct, 10);
    }

    _roar() {
        if (this._roared) return;
        this._roared = true;
        const scene = this.scene;
        scene.cameras.main.shake(300, 0.005);

        // Zoom-in rápido ×1.1 para enfatizar a aparição do boss
        const cam = scene.cameras.main;
        scene.tweens.add({
            targets: cam, zoom: cam.zoom * 1.1,
            duration: 250, ease: 'Sine.easeOut',
            onComplete: () => {
                scene.tweens.add({ targets: cam, zoom: cam.zoom / 1.1, duration: 400, ease: 'Sine.easeIn' });
            }
        });
        const txt = scene.add.text(scene.scale.width / 2, 50, '💀 BOSS APARECEU!', {
            fontSize: '18px', fill: '#ff4400', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        scene.tweens.add({
            targets: txt, alpha: 0, delay: 1800, duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    update(player, time, delta) {
        if (this.dead) return;
        this._updateBossHpBar();

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.detectionRange) this._roar();

        super.update(player, time, delta);
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        super.takeDamage(amount, fromDir);
        // Restaurar tint do boss depois do flash de dano
        if (!this.dead) {
            this.scene.time.delayedCall(300, () => {
                if (!this.dead) this.setTint(this._bossTint);
            });
        }
        this._updateBossHpBar();
    }

    _die() {
        this.dead = true;
        this.hpBar?.destroy();
        this.hpBarBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('skeleton_death', true);

        // Shake forte + explosão de partículas na morte do boss
        this.scene.cameras.main.shake(500, 0.012);
        burst(this.scene, this.x, this.y - 20, { color: 0xff6622, count: 20, speed: 180, lifespan: 700, scale: 1.0, gravity: 200 });
        burst(this.scene, this.x, this.y - 20, { color: 0xffdd44, count: 10, speed: 100, lifespan: 500, scale: 0.5 });

        // Remove barra do boss do ecrã
        this._bossBar?.destroy();
        this._bossBarBg?.destroy();
        this._bossLabel?.destroy();

        this.once('animationcomplete', () => {
            // Drop garantido: vela cai no chão como collectible
            const sail = new CollectibleItem(this.scene, this.x, this.y, 'sail', 1);
            this.scene.pickups.add(sail);

            const txt = this.scene.add.text(this.x, this.y - 40, '⚓ VELA CAIU!', {
                fontSize: '14px', fill: '#ffdd66', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(30);
            this.scene.tweens.add({
                targets: txt, y: txt.y - 40, alpha: 0,
                duration: 1500, onComplete: () => txt.destroy()
            });

            this.scene.events.emit('bossDefeated');
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
