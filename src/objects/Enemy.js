import { burst } from '../systems/Particles.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey, cfg = {}) {
        super(scene, x, y, textureKey, 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const {
            maxHealth        = 40,
            speed            = 55,
            damage           = 10,
            scale            = 1,
            tint             = null,
            detectionRange   = 200,
            attackRange      = 22,
            damageCooldown   = 900,
            animPrefix       = 'enemy',
            bodySize         = [16, 14],
            bodyOffset       = [0, 0],
            originY          = 0.5,
            depth            = 4,
            hpBarWidth       = 24,
            hpBarHeight      = 4,
            hpBarColor       = 0xff3333,
            hpBgColor        = 0x440000,
            hpBarYOffset     = -15,
            deathColor       = 0xcc3322,
            deathYOffset     = -4,
            damageTextColor  = '#ff4444',
            attackFlashTint  = 0xffff00,
            attackFlashDelay = 200,
            knockbackX       = 200,
            knockbackY       = -80,
            stunDuration     = 350,
            patrolSpeedMult  = 0.45,
            patrolTimerMin   = 1500,
            patrolTimerMax   = 3500,
            patrolRangeMin   = 40,
            patrolRangeMax   = 100,
        } = cfg;

        this.setScale(scale);
        this.setDepth(depth);
        this.setOrigin(0.5, originY);
        this.body.setSize(...bodySize);
        this.body.setOffset(...bodyOffset);
        this.body.setCollideWorldBounds(true);

        if (tint) this.setTint(tint);
        this._baseTint        = tint;
        this._animPrefix      = animPrefix;
        this._damageTextColor = damageTextColor;
        this._attackFlashTint = attackFlashTint;
        this._attackFlashDelay = attackFlashDelay;
        this._knockbackX      = knockbackX;
        this._knockbackY      = knockbackY;
        this._stunDuration    = stunDuration;
        this._patrolSpeedMult = patrolSpeedMult;
        this._patrolTimerMin  = patrolTimerMin;
        this._patrolTimerMax  = patrolTimerMax;
        this._patrolRangeMin  = patrolRangeMin;
        this._patrolRangeMax  = patrolRangeMax;
        this._deathColor      = deathColor;
        this._deathYOffset    = deathYOffset;
        this._hpBarWidth      = hpBarWidth;
        this._hpBarHeight     = hpBarHeight;
        this._hpBarYOffset    = hpBarYOffset;

        this.maxHealth      = maxHealth;
        this.health         = maxHealth;
        this.speed          = speed;
        this.damage         = damage;
        this.dead           = false;
        this.damageCooldown = damageCooldown;
        this.lastDamageTime = 0;
        this.stunUntil      = 0;
        this.detectionRange = detectionRange;
        this.attackRange    = attackRange;
        this.patrolTarget   = { x, y };
        this.patrolTimer    = 0;
        this._attacking     = false;

        const hw = hpBarWidth;
        this.hpBg  = scene.add.rectangle(x, y + hpBarYOffset, hw, hpBarHeight, hpBgColor)
            .setDepth(10).setVisible(false);
        this.hpBar = scene.add.rectangle(x - hw / 2, y + hpBarYOffset, hw, hpBarHeight, hpBarColor)
            .setDepth(11).setOrigin(0, 0.5).setVisible(false);
    }

    _syncHpBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        const by  = this.y + this._hpBarYOffset;
        this.hpBg.setPosition(this.x, by);
        this.hpBar.setPosition(this.x - this._hpBarWidth / 2, by);
        this.hpBar.setDisplaySize(this._hpBarWidth * pct, this._hpBarHeight);
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

        const isNight = this.scene.isNight;
        const currentSpeed = isNight ? this.speed * 1.25 : this.speed;
        const currentRange = isNight ? this.detectionRange * 1.50 : this.detectionRange;

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pfx  = this._animPrefix;

        if (dist < currentRange) {
            if (dist < this.attackRange) {
                this.body.setVelocity(0);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this._doAttack(player);
                } else {
                    this.play(`${pfx}_idle`, true);
                }
            } else {
                const nx = dx / dist, ny = dy / dist;
                this.body.setVelocityX(nx * currentSpeed);
                this.body.setVelocityY(ny * currentSpeed);
                this.setFlipX(dx < 0);
                this.play(`${pfx}_walk`, true);
            }
        } else {
            this.patrolTimer -= delta || 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(this._patrolTimerMin, this._patrolTimerMax);
                const angle = Math.random() * Math.PI * 2;
                const r     = Phaser.Math.Between(this._patrolRangeMin, this._patrolRangeMax);
                this.patrolTarget = {
                    x: this.x + Math.cos(angle) * r,
                    y: this.y + Math.sin(angle) * r
                };
            }
            const pdx = this.patrolTarget.x - this.x;
            const pdy = this.patrolTarget.y - this.y;
            const pd  = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd > 8) {
                this.body.setVelocityX((pdx / pd) * currentSpeed * this._patrolSpeedMult);
                this.body.setVelocityY((pdy / pd) * currentSpeed * this._patrolSpeedMult);
                this.setFlipX(pdx < 0);
                this.play(`${pfx}_walk`, true);
            } else {
                this.body.setVelocity(0);
                this.play(`${pfx}_idle`, true);
            }
        }
    }

    _doAttack(player) {
        this._attacking = true;
        this.body.setVelocity(0);
        const pfx = this._animPrefix;
        this.play(`${pfx}_attack`, true);

        this.setTint(this._attackFlashTint);
        this.scene.time.delayedCall(this._attackFlashDelay, () => {
            if (!this.dead) {
                this.clearTint();
                if (this._baseTint) this.setTint(this._baseTint);
                this.scene.events.emit('playerDamaged', this.damage);
            }
        });

        this.once('animationcomplete', () => {
            this._attacking = false;
            if (!this.dead) this.play(`${pfx}_idle`, true);
        });
    }

    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;
        this._attacking = false;

        const kbX = fromDir === 'right' ? this._knockbackX : -this._knockbackX;
        this.body.setVelocity(kbX, this._knockbackY);
        this.stunUntil = this.scene.time.now + this._stunDuration;

        const pfx = this._animPrefix;
        this.play(`${pfx}_hurt`, true);
        this.setTint(0xff4444);
        this.scene.time.delayedCall(this._stunDuration, () => {
            if (!this.dead) {
                this.clearTint();
                if (this._baseTint) this.setTint(this._baseTint);
                this.play(`${pfx}_walk`, true);
            }
        });

        const t = this.scene.add.text(this.x, this.y - 12, `-${amount}`, {
            fontSize: '14px', fill: this._damageTextColor, fontStyle: 'bold',
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
        this.play(`${this._animPrefix}_death`, true);
        burst(this.scene, this.x, this.y + this._deathYOffset, {
            color: this._deathColor, count: 10, speed: 110, lifespan: 500, scale: 0.7
        });
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
