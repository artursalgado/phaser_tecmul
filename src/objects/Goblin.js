/**
 * Goblin — Arcade Sprite
 * Frames reais verificados (frameW=96 para todos):
 *   spr_idle_strip9.png   : 768px → 8 frames
 *   spr_walk_strip8.png   : 768px → 8 frames
 *   spr_hurt_strip8.png   : 768px → 8 frames
 *   spr_death_strip13.png : 864px → 9 frames
 *   spr_attack_strip10.png: 864px → 9 frames
 */
export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'goblin_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.75);
        this.setDepth(4);
        this.setOrigin(0.5, 0.75);

        // Hitbox nos pés (espaço do frame 96×64)
        this.body.setSize(18, 16);
        this.body.setOffset(39, 48);
        this.body.setCollideWorldBounds(true);

        // Stats
        this.maxHealth = 40;
        this.health    = 40;
        this.speed     = 55;
        this.damage    = 12;
        this.dead      = false;

        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;

        this.detectionRange = 200;
        this.attackRange    = 20;
        this.state          = 'PATROL';
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;

        // Barra de vida
        this.hpBarBg = scene.add.rectangle(0, 0, 22, 4, 0x330000).setDepth(10).setVisible(false);
        this.hpBar   = scene.add.rectangle(0, 0, 22, 4, 0xff3333)
            .setDepth(11).setOrigin(0, 0.5).setVisible(false);

        this._buildAnims(scene);
        this.play('goblin_idle', true);
    }

    _buildAnims(scene) {
        const make = (key, texture, nFrames, rate, repeat = -1) => {
            if (!scene.anims.exists(key)) {
                scene.anims.create({
                    key,
                    frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: nFrames - 1 }),
                    frameRate: rate,
                    repeat
                });
            }
        };
        make('goblin_idle',   'goblin_idle',   8,  6);
        make('goblin_walk',   'goblin_walk',   8, 10);
        make('goblin_hurt',   'goblin_hurt',   8, 12, 0);
        make('goblin_death',  'goblin_death',  9,  8, 0);
        make('goblin_attack', 'goblin_attack', 9, 10, 0);
    }

    _updateHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const by  = this.y - 28 * this.scaleY;
        this.hpBarBg.setPosition(this.x, by);
        this.hpBar.setPosition(this.x - 11, by);
        this.hpBar.setDisplaySize(22 * pct, 4);
        const show = pct < 1.0 && !this.dead;
        this.hpBarBg.setVisible(show);
        this.hpBar.setVisible(show);
    }

    update(player, time) {
        if (this.dead) return;
        this._updateHpBar();

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (time < this.stunUntil) {
            this.body.setVelocity(0);
            return;
        }

        if (dist < this.detectionRange) {
            if (dist < this.attackRange) {
                this.body.setVelocity(0);
                this.play('goblin_idle', true);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this.scene.events.emit('playerDamaged', this.damage);
                    this.setTint(0xffff00);
                    this.scene.time.delayedCall(150, () => {
                        if (!this.dead) this.clearTint();
                    });
                }
            } else {
                const nx = dx / dist;
                const ny = dy / dist;
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
                const range = Phaser.Math.Between(40, 100);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * range,
                    y: this.y + Math.sin(angle) * range
                };
            }
            const ptDx   = this.patrolTarget.x - this.x;
            const ptDy   = this.patrolTarget.y - this.y;
            const ptDist = Math.sqrt(ptDx * ptDx + ptDy * ptDy);
            if (ptDist > 8) {
                const spd = this.speed * 0.45;
                this.body.setVelocityX((ptDx / ptDist) * spd);
                this.body.setVelocityY((ptDy / ptDist) * spd);
                this.setFlipX(ptDx < 0);
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

        const kbX = fromDir === 'right' ? 200 : -200;
        this.body.setVelocity(kbX, -80);
        this.stunUntil = this.scene.time.now + 350;

        this.play('goblin_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(350, () => {
            if (!this.dead) { this.clearTint(); this.play('goblin_walk', true); }
        });

        const txt = this.scene.add.text(this.x, this.y - 24, `-${amount}`, {
            fontSize: '14px', fill: '#ff4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.scene.tweens.add({
            targets: txt, y: txt.y - 32, alpha: 0,
            duration: 750, onComplete: () => txt.destroy()
        });

        this._updateHpBar();
        if (this.health <= 0) this._die();
    }

    _die() {
        this.dead = true;
        this.hpBar.destroy();
        this.hpBarBg.destroy();
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
