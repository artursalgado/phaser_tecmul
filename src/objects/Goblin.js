import { burst } from '../systems/Particles.js';

/**
 * Goblin — Arcade Sprite com tiers de dificuldade
 * tier 1 = normal | tier 2 = forte (vermelho) | tier 3 = elite (roxo)
 * Frames reais calculados (frameW=96):
 *   idle:   768/96 = 8 frames
 *   walk:   768/96 = 8 frames
 *   hurt:   768/96 = 8 frames
 *   death:  864/96 = 9 frames
 *   attack: 864/96 = 9 frames
 */
export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, tier = 1) {
        super(scene, x, y, 'goblin_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1);
        this.setDepth(4);
        this.setOrigin(0.5, 38 / 64);

        // Hitbox igual ao player (frameW=96 → offset x=40; frameH=64 → offset y=24)
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true);

        // Tier — define stats e cor
        this.tier = tier;
        this._applyTier(tier);

        this.dead           = false;
        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;
        this.detectionRange = 200;
        this.attackRange    = 22;
        this.state          = 'PATROL';
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;
        this._attacking     = false;

        // Barra de vida
        this.hpBg  = scene.add.rectangle(x, y - 28, 24, 4, 0x440000).setDepth(10).setVisible(false);
        this.hpBar = scene.add.rectangle(x - 12, y - 28, 24, 4, 0xff3333).setDepth(11).setOrigin(0, 0.5).setVisible(false);

        this._buildAnims(scene);
        this.play('goblin_idle', true);
    }

    _applyTier(tier) {
        const tiers = {
            1: { hp: 40,  speed: 55,  damage: 12, tint: null,       scale: 0.75 },
            2: { hp: 70,  speed: 70,  damage: 20, tint: 0xff8888,   scale: 0.82 },
            3: { hp: 110, speed: 85,  damage: 30, tint: 0xcc88ff,   scale: 0.90 },
        };
        const cfg = tiers[tier] || tiers[1];
        this.maxHealth = cfg.hp;
        this.health    = cfg.hp;
        this.speed     = cfg.speed;
        this.damage    = cfg.damage;
        this.setScale(cfg.scale);
        if (cfg.tint) this.setTint(cfg.tint);
        this._baseTint = cfg.tint;
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
        // Frame counts verified from image dimensions (frameW=96)
        make('goblin_idle',   'goblin_idle',   8,  6);
        make('goblin_walk',   'goblin_walk',   8, 10);
        make('goblin_hurt',   'goblin_hurt',   8, 12, 0);
        make('goblin_death',  'goblin_death',  9,  8, 0);
        make('goblin_attack', 'goblin_attack', 9, 10, 0);
    }

    _syncHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const by  = this.y - 15;
        this.hpBg.setPosition(this.x, by);
        this.hpBar.setPosition(this.x - 12, by);
        this.hpBar.setDisplaySize(24 * pct, 4);
        const vis = pct < 1 && !this.dead;
        this.hpBg.setVisible(vis);
        this.hpBar.setVisible(vis);
    }

    update(player, time, delta) {
        if (this.dead) return;
        this._syncHpBar();

        if (time < this.stunUntil) {
            this.body.setVelocity(0);
            return;
        }

        if (this._attacking) return;

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.detectionRange) {
            if (dist < this.attackRange) {
                this.body.setVelocity(0);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this._doAttack(player);
                } else {
                    this.play('goblin_idle', true);
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
            // Patrulha aleatória
            this.patrolTimer -= delta || 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(1500, 3500);
                const angle = Math.random() * Math.PI * 2;
                const r     = Phaser.Math.Between(40, 100);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * r,
                    y: this.y + Math.sin(angle) * r
                };
            }
            const pdx = this.patrolTarget.x - this.x;
            const pdy = this.patrolTarget.y - this.y;
            const pd  = Math.sqrt(pdx * pdx + pdy * pdy);
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

    _doAttack(player) {
        this._attacking = true;
        this.body.setVelocity(0);
        this.play('goblin_attack', true);

        // Flash amarelo no início do ataque (aviso visual)
        this.setTint(0xffff00);
        this.scene.time.delayedCall(200, () => {
            if (!this.dead) {
                this.clearTint();
                if (this._baseTint) this.setTint(this._baseTint);
                this.scene.events.emit('playerDamaged', this.damage);
            }
        });

        this.once('animationcomplete', () => {
            this._attacking = false;
            if (!this.dead) this.play('goblin_idle', true);
        });
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;
        this._attacking = false;

        // Knockback
        const kbX = fromDir === 'right' ? 200 : -200;
        this.body.setVelocity(kbX, -80);
        this.stunUntil = this.scene.time.now + 350;

        this.play('goblin_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(350, () => {
            if (!this.dead) {
                this.clearTint();
                if (this._baseTint) this.setTint(this._baseTint);
                this.play('goblin_walk', true);
            }
        });

        // Texto de dano flutuante
        const t = this.scene.add.text(this.x, this.y - 12, `-${amount}`, {
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
        this.hpBar?.destroy();
        this.hpBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('goblin_death', true);
        burst(this.scene, this.x, this.y - 4, { color: 0xcc3322, count: 10, speed: 110, lifespan: 500, scale: 0.7 });
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
