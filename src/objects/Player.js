const WEAPON_STATS = {
    axe:     { damage: 25, range: 52, cooldown: 700 },
    pickaxe: { damage: 15, range: 44, cooldown: 500 },
    sword:   { damage: 20, range: 60, cooldown: 550 },
    hammer:  { damage: 35, range: 40, cooldown: 900 },
    none:    { damage: 10, range: 36, cooldown: 600 }
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_base_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene       = scene;
        this.speedWalk   = 90;
        this.speedRun    = 160;
        this.facing      = 'right';
        this.isBusy      = false;

        // Atributos de ataque
        this.attackDamage   = 20;
        this.attackRange    = 48;
        this.attackCooldown = 600;
        this.lastAttackTime = 0;
        this.facingX        = 1;
        this.facingY        = 0;

        // Som de passo
        this.stepTimer = 0;
        this.stepInterval = 320;

        this.setScale(1);
        this.setDepth(5);
        this.setOrigin(0.5, 38 / 64);

        // Hitbox nos pes
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true);

        // Sombra
        this.shadow = scene.add.ellipse(x, y + 1, 20, 7, 0x000000, 0.3).setDepth(4);

        // Camadas de cabelo e ferramentas
        this.hairSprite = scene.add.sprite(x, y, 'player_hair_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(6);
        this.toolSprite = scene.add.sprite(x, y, 'player_tools_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(7).setVisible(false);

        this.criarAnimacoes(scene);
        this.playAnim('idle');

        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    // Cria as animacoes de base, cabelo e ferramentas
    criarAnimacoes(scene) {
        const make = (key, tex, nFrames, fps, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: nFrames - 1 }),
                frameRate: fps,
                repeat
            });
        };
        // Base
        make('player_idle',   'player_base_idle',    9,  6);
        make('player_walk',   'player_base_walk',    8, 10);
        make('player_run',    'player_base_run',     8, 14);
        make('player_hurt',   'player_base_hurt',    8, 12, 0);
        make('player_death',  'player_base_death',  13,  8, 0);
        make('player_axe',    'player_base_axe',    10, 12, 0);
        make('player_mining', 'player_base_mining', 10, 12, 0);
        // Cabelo
        make('hair_idle',     'player_hair_idle',    9,  6);
        make('hair_walk',     'player_hair_walk',    8, 10);
        make('hair_run',      'player_hair_run',     8, 14);
        make('hair_hurt',     'player_hair_hurt',    8, 12, 0);
        make('hair_death',    'player_hair_death',  13,  8, 0);
        make('hair_axe',      'player_hair_axe',    10, 12, 0);
        make('hair_mining',   'player_hair_mining', 10, 12, 0);
        // Ferramentas
        make('tools_idle',    'player_tools_idle',   9,  6);
        make('tools_walk',    'player_tools_walk',   8, 10);
        make('tools_run',     'player_tools_run',    8, 14);
        make('tools_axe',     'player_tools_axe',   10, 12, 0);
        make('tools_mining',  'player_tools_mining',10, 12, 0);
    }

    // Toca as animacoes sincronizadas de todas as camadas
    playAnim(name, showTool = false) {
        this.play('player_' + name, true);
        this.hairSprite.play('hair_' + name, true);
        this.toolSprite.setVisible(showTool);
        if (showTool && this.scene.anims.exists('tools_' + name)) {
            this.toolSprite.play('tools_' + name, true);
        }
    }

    // Inverte a orientacao de todas as camadas
    atualizarDirecao(val) {
        this.setFlipX(val);
        this.hairSprite.setFlipX(val);
        this.toolSprite.setFlipX(val);
    }

    // Garante que todas as camadas visuais seguem a posicao do jogador
    sincronizarCamadas() {
        this.hairSprite.setPosition(this.x, this.y);
        this.toolSprite.setPosition(this.x, this.y);
        this.shadow.setPosition(this.x, this.y + 1);
        this.hairSprite.setFlipX(this.flipX);
        this.toolSprite.setFlipX(this.flipX);
    }

    // Retorna o multiplicador de velocidade/dano com base na energia
    obterMultiplicadorEnergia() {
        if (!this.scene.stats) return 1;

        const percentagem = this.scene.stats.energyPercentagem;
        if (percentagem > 0.30) {
            return 1.0;
        } else if (percentagem >= 0.10) {
            return 0.70; // Cansado
        } else {
            return 0.50; // Exausto
        }
    }

    update(cursors, wasd, time, delta) {
        this.sincronizarCamadas();

        if (this.isBusy) return;

        // Atualiza os atributos com base no item equipado
        const slot = this.scene.inventory?.getSelectedItem();
        const itemId = slot?.itemId;
        const stats = WEAPON_STATS[itemId] || WEAPON_STATS.none;
        this.attackDamage = stats.damage;
        this.attackRange = stats.range;
        this.attackCooldown = stats.cooldown;

        // Verifica o cooldown de ataque
        const cooldownEfetivo = this.attackCooldown / this.obterMultiplicadorEnergia();
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) &&
            time > this.lastAttackTime + cooldownEfetivo) {
            this.realizarAtaque(time);
            return;
        }

        this.body.setVelocity(0);

        let dx = 0, dy = 0;
        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx =  1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy =  1;

        // Normaliza movimento diagonal
        if (dx !== 0 && dy !== 0) { 
            dx *= 0.707; 
            dy *= 0.707; 
        }

        // Permite correr se tiver energia suficiente
        const temEnergia = this.scene.stats ? (this.scene.stats.energy > 0 && this.scene.stats.energyPercentagem >= 0.10) : true;
        const running = this.shiftKey.isDown && (dx !== 0 || dy !== 0) && temEnergia;
        
        const speed = running ? this.speedRun : this.speedWalk * this.obterMultiplicadorEnergia();

        // Consome energia ao correr
        if (running && this.scene.stats) {
            this.scene.stats.energy = Math.max(0, this.scene.stats.energy - 6 * (delta / 1000));
        }

        this.body.setVelocityX(dx * speed);
        this.body.setVelocityY(dy * speed);

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            this.facingX = dx / len;
            this.facingY = dy / len;

            if (dx < 0) this.atualizarDirecao(true);
            else if (dx > 0) this.atualizarDirecao(false);
            
            this.playAnim(running ? 'run' : 'walk', running);

            // Som de passos
            this.stepTimer -= delta || 16;
            if (this.stepTimer <= 0) {
                this.stepTimer = running ? this.stepInterval * 0.6 : this.stepInterval;
                this.scene.events.emit('playerStep');
            }
        } else {
            this.stepTimer = 0;
            this.playAnim('idle');
        }

        // Altera a cor se estiver cansado
        if (this.scene.stats) {
            if (this.scene.stats.energyPercentagem < 0.30) {
                this.setTint(0xaaaacc);
                this.hairSprite.setTint(0xaaaacc);
                this.toolSprite.setTint(0xaaaacc);
            } else {
                this.clearTint();
                this.hairSprite.clearTint();
                this.toolSprite.clearTint();
            }
        }
    }

    // Executa a animacao e logica de ataque
    realizarAtaque(time) {
        this.lastAttackTime = time;
        this.isBusy = true;
        this.body.setVelocity(0);

        this.scene.events.emit('playerAttack');

        const slot     = this.scene.inventory?.getSelectedItem();
        const itemId   = slot?.itemId;
        const isWeapon = itemId && itemId in WEAPON_STATS && itemId !== 'none';
        const anim     = itemId === 'pickaxe' ? 'mining' : 'axe';
        this.playAnim(anim, isWeapon);

        const alcanceAtaque = this.attackRange * 0.5;
        const hitX  = this.x + this.facingX * alcanceAtaque;
        const hitY  = this.y + this.facingY * alcanceAtaque;

        const multiplicador = this.obterMultiplicadorEnergia();

        // Causa dano a goblins/esqueletos
        const goblins = this.scene.goblins?.getChildren() ?? [];
        goblins.forEach(g => {
            if (!g.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, g.x, g.y);
                if (d < this.attackRange) {
                    g.takeDamage(this.attackDamage * multiplicador, this.facingX < 0 ? 'left' : 'right');
                    this.scene.events.emit('enemyHurt');
                }
            }
        });

        // Corta arvores
        const trees = this.scene.trees?.getChildren() ?? [];
        trees.forEach(t => {
            if (!t.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, t.x, t.y);
                if (d < this.attackRange) {
                    if (Math.random() < multiplicador) {
                        t.chop();
                    }
                }
            }
        });

        // Efeito visual do golpe
        const ring = this.scene.add.circle(hitX, hitY, 10, 0xffff88, 0.55).setDepth(10);
        this.scene.tweens.add({
            targets: ring, scaleX: 1.8, scaleY: 1.8, alpha: 0,
            duration: 220, onComplete: () => ring.destroy()
        });

        this.once('animationcomplete', () => {
            this.isBusy = false;
            this.playAnim('idle');
        });
    }

    // Pisca o sprite quando recebe dano
    flashHurt() {
        this.playAnim('hurt');
        const targets = [this, this.hairSprite, this.toolSprite];
        this.scene.tweens.add({
            targets, alpha: 0.15, duration: 65, yoyo: true, repeat: 5,
            onComplete: () => {
                targets.forEach(t => t.setAlpha(1));
                if (!this.isBusy) this.playAnim('idle');
            }
        });
    }

    destroy() {
        this.shadow?.destroy();
        this.hairSprite?.destroy();
        this.toolSprite?.destroy();
        super.destroy();
    }
}
