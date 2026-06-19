import { burst } from '../systems/Particles.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey, 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Atributos de combate bases
        this.maxHealth = 40;
        this.health = 40;
        this.speed = 55;
        this.damage = 10;
        this.detectionRange = 200;
        this.attackRange = 22;
        this.damageCooldown = 900;
        this.lastDamageTime = 0;
        
        // Atributos visuais e UI
        this.baseTint = null;
        this.animPrefix = 'enemy';
        this.damageTextColor = '#ff4444';
        this.attackFlashTint = 0xffff00;
        this.attackFlashDelay = 200;
        
        // Efeitos de knockback e stun
        this.knockbackX = 200;
        this.knockbackY = -80;
        this.stunDuration = 350;
        this.stunUntil = 0;

        // Patrulha
        this.patrolSpeedMult = 0.45;
        this.patrolTimerMin = 1500;
        this.patrolTimerMax = 3500;
        this.patrolRangeMin = 40;
        this.patrolRangeMax = 100;
        this.patrolTarget = { x, y };
        this.patrolTimer = 0;

        // Morte
        this.deathColor = 0xcc3322;
        this.deathYOffset = -4;

        // Estado do inimigo
        this.dead = false;
        this.attacking = false;

        // Barra de vida
        this.hpBarWidth = 24;
        this.hpBarHeight = 4;
        this.hpBarYOffset = -15;
        this.hpBarColor = 0xff3333;
        this.hpBgColor = 0x440000;
    }

    // Inicializa os retangulos da barra de vida (chamado após configurar atributos nas subclasses)
    setupHpBar() {
        const hw = this.hpBarWidth;
        this.hpBg  = this.scene.add.rectangle(this.x, this.y + this.hpBarYOffset, hw, this.hpBarHeight, this.hpBgColor)
            .setDepth(10).setVisible(false);
        this.hpBar = this.scene.add.rectangle(this.x - hw / 2, this.y + this.hpBarYOffset, hw, this.hpBarHeight, this.hpBarColor)
            .setDepth(11).setOrigin(0, 0.5).setVisible(false);
    }

    // Sincroniza a barra de vida com a posicao e vida atual
    sincronizarBarraVida() {
        const percentagem = Math.max(0, this.health / this.maxHealth);
        const yBarra = this.y + this.hpBarYOffset;
        
        this.hpBg.setPosition(this.x, yBarra);
        this.hpBar.setPosition(this.x - this.hpBarWidth / 2, yBarra);
        this.hpBar.setDisplaySize(this.hpBarWidth * percentagem, this.hpBarHeight);
        
        const visivel = percentagem < 1 && !this.dead;
        this.hpBg.setVisible(visivel);
        this.hpBar.setVisible(visivel);
    }

    // Metodo de update chamado a cada frame
    update(player, time, delta) {
        if (this.dead) return;
        this.sincronizarBarraVida();

        // Se estiver atordoado (stunned)
        if (time < this.stunUntil) {
            this.body.setVelocity(0);
            return;
        }
        if (this.attacking) return;

        const isNight = this.scene.isNight;
        const velocidadeAtual = isNight ? this.speed * 1.25 : this.speed;
        const alcanceDetecao = isNight ? this.detectionRange * 1.50 : this.detectionRange;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const prefixo = this.animPrefix;

        // Segue o jogador se estiver perto
        if (distancia < alcanceDetecao) {
            if (distancia < this.attackRange) {
                this.body.setVelocity(0);
                if (time > this.lastDamageTime + this.damageCooldown) {
                    this.lastDamageTime = time;
                    this.realizarAtaque(player);
                } else {
                    this.play(`${prefixo}_idle`, true);
                }
            } else {
                const nx = dx / distancia;
                const ny = dy / distancia;
                this.body.setVelocityX(nx * velocidadeAtual);
                this.body.setVelocityY(ny * velocidadeAtual);
                this.setFlipX(dx < 0);
                this.play(`${prefixo}_walk`, true);
            }
        } else {
            // Caso contrario, patrulha a area
            this.patrolTimer -= delta || 16;
            if (this.patrolTimer <= 0) {
                this.patrolTimer = Phaser.Math.Between(this.patrolTimerMin, this.patrolTimerMax);
                const angulo = Math.random() * Math.PI * 2;
                const r = Phaser.Math.Between(this.patrolRangeMin, this.patrolRangeMax);
                this.patrolTarget = {
                    x: this.x + Math.cos(angulo) * r,
                    y: this.y + Math.sin(angulo) * r
                };
            }
            const pdx = this.patrolTarget.x - this.x;
            const pdy = this.patrolTarget.y - this.y;
            const pd = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pd > 8) {
                this.body.setVelocityX((pdx / pd) * velocidadeAtual * this.patrolSpeedMult);
                this.body.setVelocityY((pdy / pd) * velocidadeAtual * this.patrolSpeedMult);
                this.setFlipX(pdx < 0);
                this.play(`${prefixo}_walk`, true);
            } else {
                this.body.setVelocity(0);
                this.play(`${prefixo}_idle`, true);
            }
        }
    }

    // Executa a animacao e causa dano no ataque
    realizarAtaque(player) {
        this.attacking = true;
        this.body.setVelocity(0);
        const prefixo = this.animPrefix;
        this.play(`${prefixo}_attack`, true);

        this.setTint(this.attackFlashTint);
        this.scene.time.delayedCall(this.attackFlashDelay, () => {
            if (!this.dead) {
                this.clearTint();
                if (this.baseTint) this.setTint(this.baseTint);
                this.scene.events.emit('playerDamaged', this.damage);
            }
        });

        this.once('animationcomplete', () => {
            this.attacking = false;
            if (!this.dead) this.play(`${prefixo}_idle`, true);
        });
    }

    // Aplica dano ao inimigo e empurra-o (knockback)
    takeDamage(amount, fromDir = 'right') {
        if (this.dead) return;
        this.health -= amount;
        this.attacking = false;

        const empurroX = fromDir === 'right' ? this.knockbackX : -this.knockbackX;
        this.body.setVelocity(empurroX, this.knockbackY);
        this.stunUntil = this.scene.time.now + this.stunDuration;

        const prefixo = this.animPrefix;
        this.play(`${prefixo}_hurt`, true);
        this.setTint(0xff4444);
        
        this.scene.time.delayedCall(this.stunDuration, () => {
            if (!this.dead) {
                this.clearTint();
                if (this.baseTint) this.setTint(this.baseTint);
                this.play(`${prefixo}_walk`, true);
            }
        });

        const textoDano = this.scene.add.text(this.x, this.y - 12, `-${amount}`, {
            fontSize: '14px', fill: this.damageTextColor, fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        
        this.scene.tweens.add({
            targets: textoDano, y: textoDano.y - 30, alpha: 0,
            duration: 700, onComplete: () => textoDano.destroy()
        });

        this.sincronizarBarraVida();
        if (this.health <= 0) this.morrer();
    }

    // Executa a animacao de morte do inimigo
    morrer() {
        this.dead = true;
        this.hpBar?.destroy();
        this.hpBg?.destroy();
        this.body.setVelocity(0);
        this.body.enable = false;
        this.clearTint();
        this.play(`${this.animPrefix}_death`, true);
        
        burst(this.scene, this.x, this.y + this.deathYOffset, {
            color: this.deathColor, count: 10, speed: 110, lifespan: 500, scale: 0.7
        });
        
        this.once('animationcomplete', () => {
            this.scene.events.emit('enemyDied', this.x, this.y);
            this.destroy();
        });
    }
}
