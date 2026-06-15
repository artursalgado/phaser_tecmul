/**
 * Goblin — Phaser 3 Arcade Sprite
 * Frames reais calculados: todas as imagens têm frameW=96
 *   idle:  768/96 = 8 frames  (ficheiro diz strip9 mas são 8!)
 *   walk:  768/96 = 8 frames
 *   hurt:  768/96 = 8 frames
 *   death: 864/96 = 9 frames  (ficheiro diz strip13 mas são 9!)
 *   attack:864/96 = 9 frames
 */
export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'goblin_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1);
        this.setDepth(4);
        this.setOrigin(0.5, 0.8);

        // Hitbox igual ao player
        this.body.setSize(16, 14);
        this.body.setOffset(40, 46);
        this.body.setCollideWorldBounds(true);

        // Stats
        this.maxHealth = 40;
        this.health    = 40;
        this.speed     = 52;
        this.damage    = 12;
        this.dead      = false;

        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;

        // IA
        this.detectionRange = 190;
        this.attackRange    = 22;
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;

        // Barra de vida
        this.hpBg  = scene.add.rectangle(x, y - 28, 24, 4, 0x440000).setDepth(10).setVisible(false);
        this.hpBar = scene.add.rectangle(x - 12, y - 28, 24, 4, 0xff3333).setDepth(11).setOrigin(0, 0.5).setVisible(false);

        this._buildAnims(scene);
        this.play('goblin_idle', true);
    }

    _buildAnims(scene) {
        const make = (key, tex, n, fps, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: n - 1 }),
                frameRate: fps,
                repeat
            });
        };
        make('goblin_idle',   'goblin_idle',   8,  6);   // 768/96=8
        make('goblin_walk',   'goblin_walk',   8, 10);   // 768/96=8
        make('goblin_hurt',   'goblin_hurt',   8, 12, 0);// 768/96=8
        make('goblin_death',  'goblin_death',  9,  8, 0);// 864/96=9
        make('goblin_attack', 'goblin_attack', 9, 10, 0);// 864/96=9
    }

    _syncHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const by  = this.y - 28;
        this.hpBg.setPosition(this.x, by);
        this.hpBar.setPosition(this.x - 12, by);
        this.hpBar.setDisplaySize(24 * pct, 4);
        const vis = pct < 1 && !this.dead;
        this.hpBg.setVisible(vis);
        this.hpBar.setVisible(vis);
    }

    update(player, time) {
        if (this.dead) return;
        this._syncHpBar();

        if (time < this.stunUntil) {
            this.body.setVelocity(0);
            return;
        }

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.detectionRange) {
            if (dist < this.attackRange) {
                // Ataque por contacto
                this.body.setVelocity(0);
                this.play('goblin_idle', true);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this.scene.events.emit('playerDamaged', this.damage);
                    this.setTint(0xffff44);
                    this.scene.time.delayedCall(140, () => {
                        if (!this.dead) this.clearTint();
                    });
                }
            } else {
                // Perseguição
                const nx = dx / dist, ny = dy / dist;
                this.body.setVelocityX(nx * this.speed);
                this.body.setVelocityY(ny * this.speed);
                this.setFlipX(dx < 0);
                this.play('goblin_walk', true);
            }
        } else {
            // Patrulha
            this.patrolTimer -= 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(1500, 3500);
                const angle = Math.random() * Math.PI * 2;
                const r     = Phaser.Math.Between(40, 100);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * r,
                    y: this.y + Math.sin(angle) * r
                };
            }
            const pdx  = this.patrolTarget.x - this.x;
            const pdy  = this.patrolTarget.y - this.y;
            const pd   = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd > 8) {
                this.body.setVelocityX((pdx / pd) * this.speed * 0.45);
                this.body.setVelocityY((pdy / pd) * this.speed * 0.45);
                this.setFlipX(pdx < 0);
                this.play('goblin_walk', true);
            } else {
                this.body.setVelocity(0);
                this.play('goblin_idle', true);
            }
        }
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;

        this.body.setVelocity(fromDir === 'right' ? 200 : -200, -80);
        this.stunUntil = this.scene.time.now + 300;

        this.play('goblin_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(300, () => {
            if (!this.dead) { this.clearTint(); this.play('goblin_walk', true); }
        });

        // Texto de dano flutuante
        const t = this.scene.add.text(this.x, this.y - 24, `-${amount}`, {
            fontSize: '14px', fill: '#ff4444', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0,
            duration: 700, onComplete: () => t.destroy() });

        this._syncHpBar();
        if (this.health <= 0) this._die();
    }

    _die() {
        this.dead = true;
        this.hpBar.destroy();
        this.hpBg.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('goblin_death', true);
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
