// Goblin — inimigo básico que persegue o jogador e causa dano ao tocá-lo
export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'goblin_walk');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(14, 14);
        this.body.setOffset(1, 2);
        this.body.setCollideWorldBounds(true);

        this.setScale(2);
        this.setDepth(4);

        this.speed = 60;
        this.damage = 15;          // dano por toque
        this.health = 30;
        this.dead = false;

        // Cooldown entre danos ao jogador (ms)
        this.damageCooldown = 1000;
        this.lastDamageTime = 0;

        // Alcance de deteção do jogador
        this.detectionRange = 200;

        this._buildAnims(scene);
        this.play('goblin_idle', true);
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
        make('goblin_hurt',  'goblin_hurt',  8, 10, 0);
        make('goblin_death', 'goblin_death', 13, 8, 0);
    }

    update(player, time) {
        if (this.dead) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.detectionRange) {
            // Normaliza e move em direção ao jogador
            const nx = dx / dist;
            const ny = dy / dist;
            this.body.setVelocityX(nx * this.speed);
            this.body.setVelocityY(ny * this.speed);
            this.setFlipX(dx < 0);
            this.play('goblin_walk', true);

            // Dano ao jogador se estiver muito perto e cooldown passou
            if (dist < 20 && time > this.lastDamageTime + this.damageCooldown) {
                this.lastDamageTime = time;
                player.scene.events.emit('playerDamaged', this.damage);
            }
        } else {
            this.body.setVelocity(0);
            this.play('goblin_idle', true);
        }
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.health -= amount;

        this.play('goblin_hurt', true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(200, () => {
            if (!this.dead) {
                this.clearTint();
                this.play('goblin_walk', true);
            }
        });

        if (this.health <= 0) this.die();
    }

    die() {
        this.dead = true;
        this.body.setVelocity(0);
        this.play('goblin_death', true);
        this.once('animationcomplete', () => {
            // Pequena chance de dropar madeira ou pedra
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
