/**
 * Skeleton — o boss da EPIC de fuga.
 * E basicamente um Goblin mais forte, guarda a zona rochosa.
 * Ao morrer, dropa a vela (sail) que falta para a jangada.
 * Frames: mesmo padrao do goblin (frameW=96).
 */
export default class Skeleton extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.2); // um pouco maior, para parecer boss
        this.setDepth(4);
        this.setOrigin(0.5, 0.8);

        this.body.setSize(16, 14);
        this.body.setOffset(40, 46);
        this.body.setCollideWorldBounds(true);

        // Stats de boss: mais vida e dano que o goblin normal
        this.maxHealth = 150;
        this.health    = 150;
        this.speed     = 48;
        this.damage    = 18;
        this.dead      = false;

        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;

        // IA (igual ao goblin, so com mais alcance de deteccao)
        this.detectionRange = 240;
        this.attackRange    = 24;
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;

        // Barra de vida (um pouco maior, por ser boss)
        this.hpBg  = scene.add.rectangle(x, y - 32, 36, 5, 0x440000).setDepth(10).setVisible(false);
        this.hpBar = scene.add.rectangle(x - 18, y - 32, 36, 5, 0xaa66ff).setDepth(11).setOrigin(0, 0.5).setVisible(false);

        this._buildAnims(scene);
        this.play('skeleton_idle', true);
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
        make('skeleton_idle',   'skeleton_idle',   6,  6);
        make('skeleton_walk',   'skeleton_walk',   8, 10);
        make('skeleton_hurt',   'skeleton_hurt',   7, 12, 0);
        make('skeleton_death',  'skeleton_death', 10,  8, 0);
        make('skeleton_attack', 'skeleton_attack', 7, 10, 0);
    }

    _syncHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const by  = this.y - 32;
        this.hpBg.setPosition(this.x, by);
        this.hpBar.setPosition(this.x - 18, by);
        this.hpBar.setDisplaySize(36 * pct, 5);
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
                this.body.setVelocity(0);
                this.play('skeleton_idle', true);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this.scene.events.emit('playerDamaged', this.damage);
                    this.setTint(0xffff44);
                    this.scene.time.delayedCall(140, () => {
                        if (!this.dead) this.clearTint();
                    });
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
                this.play('skeleton_walk', true);
            } else {
                this.body.setVelocity(0);
                this.play('skeleton_idle', true);
            }
        }
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;

        this.body.setVelocity(fromDir === 'right' ? 200 : -200, -80);
        this.stunUntil = this.scene.time.now + 300;

        this.play('skeleton_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(300, () => {
            if (!this.dead) { this.clearTint(); this.play('skeleton_walk', true); }
        });

        const t = this.scene.add.text(this.x, this.y - 28, `-${amount}`, {
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
        this.play('skeleton_death', true);
        this.once('animationcomplete', () => {
            // Dropa a vela diretamente no inventario -- e o boss, e garantido que da o item
            this.scene.inventory.addItem('sail', 1);

            const txt = this.scene.add.text(this.x, this.y - 40, '+1 Vela', {
                fontSize: '12px', fill: '#ffffff', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(20);
            this.scene.tweens.add({
                targets: txt, y: txt.y - 30, alpha: 0,
                duration: 1000, onComplete: () => txt.destroy()
            });

            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
