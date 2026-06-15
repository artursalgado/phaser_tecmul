/**
 * Goblin — inimigo com IA melhorada
 * Estados: PATROL → CHASE → ATTACK → STUN
 * Knockback ao ser atingido, vida visível, patrulha orgânica
 */
export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'goblin_walk');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(14, 14);
        this.body.setOffset(17, 20);
        this.body.setCollideWorldBounds(true);

        this.setScale(2);
        this.setDepth(4);

        // Stats
        this.maxHealth = 40;
        this.health    = 40;
        this.speed     = 55;
        this.damage    = 12;
        this.dead      = false;

        // Cooldowns (ms)
        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;

        // IA
        this.detectionRange = 180;
        this.attackRange    = 22;
        this.state          = 'PATROL';

        // Patrulha — ponto alvo aleatório
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;

        // Barra de vida acima do goblin
        this._buildHealthBar(scene);
        this._buildAnims(scene);
        this.play('goblin_idle', true);
    }

    _buildHealthBar(scene) {
        // fundo
        this.hpBarBg = scene.add.rectangle(0, 0, 20, 3, 0x440000).setDepth(10).setVisible(false);
        // barra
        this.hpBar   = scene.add.rectangle(0, 0, 20, 3, 0xff3333).setDepth(11).setOrigin(0, 0.5).setVisible(false);
        this._updateHealthBar();
    }

    _updateHealthBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const w   = 20 * pct;
        const bx  = this.x - 10;
        const by  = this.y - 22;
        this.hpBarBg.setPosition(this.x, by);
        this.hpBar.setPosition(bx, by);
        this.hpBar.setDisplaySize(w, 3);
        // mostrar apenas quando não está com vida cheia
        const show = pct < 1.0 && !this.dead;
        this.hpBarBg.setVisible(show);
        this.hpBar.setVisible(show);
    }

    _buildAnims(scene) {
        const make = (key, texture, frames, rate, repeat = -1) => {
            if (!scene.anims.exists(key)) {
                scene.anims.create({
                    key,
                    frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: frames - 1 }),
                    frameRate: rate,
                    repeat
                });
            }
        };
        make('goblin_idle',  'goblin_idle',  9,  6);
        make('goblin_walk',  'goblin_walk',  8, 10);
        make('goblin_hurt',  'goblin_hurt',  8, 12, 0);
        make('goblin_death', 'goblin_death', 13, 8, 0);
    }

    update(player, time) {
        if (this.dead) return;
        this._updateHealthBar();

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Stunado — para e espera
        if (time < this.stunUntil) {
            this.body.setVelocity(0);
            return;
        }

        if (dist < this.detectionRange) {
            // CHASE / ATTACK
            this.state = dist < this.attackRange ? 'ATTACK' : 'CHASE';

            if (this.state === 'CHASE') {
                const nx = dx / dist;
                const ny = dy / dist;
                this.body.setVelocityX(nx * this.speed);
                this.body.setVelocityY(ny * this.speed);
                this.setFlipX(dx < 0);
                this.play('goblin_walk', true);
            } else {
                // Ataque por contacto
                this.body.setVelocity(0);
                this.play('goblin_idle', true);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this.scene.events.emit('playerDamaged', this.damage);
                    // Animação de "bater"
                    this.setTint(0xffff00);
                    this.scene.time.delayedCall(120, () => { if (!this.dead) this.clearTint(); });
                }
            }
        } else {
            // PATROL — movimento aleatório lento
            this.state = 'PATROL';
            this.patrolTimer -= 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(1500, 3500);
                const angle = Math.random() * Math.PI * 2;
                const range = Phaser.Math.Between(40, 120);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * range,
                    y: this.y + Math.sin(angle) * range,
                };
            }

            const ptDx = this.patrolTarget.x - this.x;
            const ptDy = this.patrolTarget.y - this.y;
            const ptDist = Math.sqrt(ptDx * ptDx + ptDy * ptDy);

            if (ptDist > 8) {
                const spd = this.speed * 0.5;
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

        // Knockback
        const kbX = fromDir === 'right' ? 180 : -180;
        this.body.setVelocity(kbX, -80);
        this.stunUntil = this.scene.time.now + 300;

        this.play('goblin_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(300, () => {
            if (!this.dead) { this.clearTint(); this.play('goblin_walk', true); }
        });

        // Texto de dano
        const txt = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
            fontSize: '13px', fill: '#ff4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.scene.tweens.add({
            targets: txt, y: txt.y - 28, alpha: 0,
            duration: 700, onComplete: () => txt.destroy()
        });

        this._updateHealthBar();
        if (this.health <= 0) this.die();
    }

    die() {
        this.dead = true;
        this.hpBar.destroy();
        this.hpBarBg.destroy();
        this.body.setVelocity(0);
        this.clearTint();
        this.play('goblin_death', true);
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
