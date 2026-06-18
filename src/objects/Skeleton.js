/**
 * Skeleton — segundo tipo de inimigo
 * Mais rápido que o goblin mas menos HP.
 * Aparece a partir da vaga 2.
 *
 * Frames (skeleton spritesheets):
 *  idle:   skeleton_idle_strip6   → 6
 *  walk:   skeleton_walk_strip8   → 8
 *  hurt:   skeleton_hurt_strip7   → 7
 *  death:  skeleton_death_strip10 → 10
 *  attack: skeleton_attack_strip7 → 7
 */
export default class Skeleton extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.75);
        this.setDepth(4);
        this.setOrigin(0.5, 0.75);
        this.body.setSize(18, 16);
        this.body.setOffset(39, 48);
        this.body.setCollideWorldBounds(true);

        // Stats do skeleton
        this.maxHealth      = 30;
        this.health         = 30;
        this.speed          = 90;    // mais rápido que goblin tier 1
        this.damage         = 15;
        this.dead           = false;
        this.damageCooldown = 750;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;
        this.detectionRange = 240;   // maior alcance de detecção
        this.attackRange    = 22;
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;
        this._attacking     = false;

        // Cor azulada para distinguir dos goblins
        this.setTint(0xaaddff);

        // Barra de vida
        this.hpBarBg = scene.add.rectangle(0, 0, 22, 4, 0x000033).setDepth(10).setVisible(false);
        this.hpBar   = scene.add.rectangle(0, 0, 22, 4, 0x4499ff)
            .setDepth(11).setOrigin(0, 0.5).setVisible(false);

        this._buildAnims(scene);
        this.play('skeleton_idle', true);
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
        make('skeleton_idle',   'skeleton_idle',    6,  6);
        make('skeleton_walk',   'skeleton_walk',    8, 12);
        make('skeleton_hurt',   'skeleton_hurt',    7, 14, 0);
        make('skeleton_death',  'skeleton_death',  10,  8, 0);
        make('skeleton_attack', 'skeleton_attack',  7, 12, 0);
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

        if (this._attacking) return;

        if (dist < this.detectionRange) {
            if (dist < this.attackRange) {
                this.body.setVelocity(0);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this._doAttack(player);
                } else {
                    this.play('skeleton_idle', true);
                }
            } else {
                const nx = dx / dist, ny = dy / dist;
                this.body.setVelocityX(nx * this.speed);
                this.body.setVelocityY(ny * this.speed);
                this.setFlipX(dx < 0);
                this.play('skeleton_walk', true);
            }
        } else {
            this.patrolTimer -= 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(1000, 2500);
                const angle = Math.random() * Math.PI * 2;
                const range = Phaser.Math.Between(50, 120);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * range,
                    y: this.y + Math.sin(angle) * range
                };
            }
            const ptDx   = this.patrolTarget.x - this.x;
            const ptDy   = this.patrolTarget.y - this.y;
            const ptDist = Math.sqrt(ptDx * ptDx + ptDy * ptDy);
            if (ptDist > 8) {
                const spd = this.speed * 0.5;
                this.body.setVelocityX((ptDx / ptDist) * spd);
                this.body.setVelocityY((ptDy / ptDist) * spd);
                this.setFlipX(ptDx < 0);
                this.play('skeleton_walk', true);
            } else {
                this.body.setVelocity(0);
                this.play('skeleton_idle', true);
            }
        }
    }

    _doAttack(player) {
        this._attacking = true;
        this.body.setVelocity(0);
        this.play('skeleton_attack', true);

        this.setTint(0xffffff);
        this.scene.time.delayedCall(160, () => {
            if (!this.dead) {
                this.setTint(0xaaddff);
                this.scene.events.emit('playerDamaged', this.damage);
            }
        });

        this.once('animationcomplete', () => {
            this._attacking = false;
            if (!this.dead) this.play('skeleton_idle', true);
        });
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;
        this._attacking = false;

        const kbX = fromDir === 'right' ? 250 : -250;
        this.body.setVelocity(kbX, -100);
        this.stunUntil = this.scene.time.now + 280;

        this.play('skeleton_hurt', true);
        this.setTint(0xff8888);
        this.scene.time.delayedCall(280, () => {
            if (!this.dead) {
                this.setTint(0xaaddff);
            }
        });

        // Texto de dano
        const txt = this.scene.add.text(this.x, this.y - 24, `-${amount}`, {
            fontSize: '14px', fill: '#4499ff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.scene.tweens.add({
            targets: txt, y: txt.y - 32, alpha: 0,
            duration: 650, onComplete: () => txt.destroy()
        });

        this._updateHpBar();
        if (this.health <= 0) this._die();
    }

    _die() {
        this.dead = true;
        this.hpBar?.destroy();
        this.hpBarBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play('skeleton_death', true);
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
