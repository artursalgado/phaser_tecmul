/**
 * Player — Phaser.Physics.Arcade.Sprite (SEM Container, evita todos os bugs de physics)
 *
 * Frame: 96×64 px  |  scale: 0.75  |  origin: (0.5, 0.75)
 * No ecrã (zoom 2.5): personagem fica com ~120px de altura → perfeito
 *
 * Camadas visuais extra (hair, tools) são sprites separados que seguem o player.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_base_idle', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene       = scene;
        this.speedWalk   = 100;
        this.speedRun    = 180;
        this.facing      = 'right';
        this.isBusy      = false;

        // Ataque
        this.attackDamage   = 20;
        this.attackRange    = 50;
        this.attackCooldown = 600;
        this.lastAttackTime = 0;

        // Passo sonoro
        this._stepTimer = 0;
        this._stepInterval = 320; // ms entre passos

        // Aparência
        this.setScale(0.75);
        this.setDepth(5);
        this.setOrigin(0.5, 0.75);

        // Hitbox
        this.body.setSize(18, 14);
        this.body.setOffset(39, 41);
        this.body.setCollideWorldBounds(true);

        // Sombra oval
        this.shadow = scene.add.ellipse(x, y + 4, 22, 7, 0x000000, 0.22).setDepth(4);

        // Camada de cabelo
        this.hairSprite = scene.add.sprite(x, y, 'player_hair_idle', 0)
            .setScale(0.75).setOrigin(0.5, 0.75).setDepth(6);

        // Camada de ferramentas
        this.toolSprite = scene.add.sprite(x, y, 'player_tools_idle', 0)
            .setScale(0.75).setOrigin(0.5, 0.75).setDepth(7).setVisible(false);

        this._buildAnimations(scene);
        this.playAnim('idle');

        // Teclas especiais
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    _buildAnimations(scene) {
        const anim = (key, tex, nFrames, fps, repeat = -1) => {
            if (!scene.anims.exists(key)) {
                scene.anims.create({
                    key,
                    frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: nFrames - 1 }),
                    frameRate: fps,
                    repeat
                });
            }
        };
        anim('player_idle',   'player_base_idle',    9,  6);
        anim('player_walk',   'player_base_walk',    8, 10);
        anim('player_run',    'player_base_run',     8, 14);
        anim('player_hurt',   'player_base_hurt',    8, 12, 0);
        anim('player_death',  'player_base_death',  13,  8, 0);
        anim('player_axe',    'player_base_axe',    10, 12, 0);
        anim('player_mining', 'player_base_mining', 10, 12, 0);
        anim('hair_idle',     'player_hair_idle',    9,  6);
        anim('hair_walk',     'player_hair_walk',    8, 10);
        anim('hair_run',      'player_hair_run',     8, 14);
        anim('hair_hurt',     'player_hair_hurt',    8, 12, 0);
        anim('hair_death',    'player_hair_death',  13,  8, 0);
        anim('hair_axe',      'player_hair_axe',    10, 12, 0);
        anim('hair_mining',   'player_hair_mining', 10, 12, 0);
        anim('tools_idle',    'player_tools_idle',   9,  6);
        anim('tools_walk',    'player_tools_walk',   8, 10);
        anim('tools_run',     'player_tools_run',    8, 14);
        anim('tools_axe',     'player_tools_axe',   10, 12, 0);
        anim('tools_mining',  'player_tools_mining',10, 12, 0);
    }

    playAnim(name, showTool = false) {
        this.play('player_' + name, true);
        this.hairSprite.play('hair_'   + name, true);
        this.toolSprite.setVisible(showTool);
        if (showTool && this.scene.anims.exists('tools_' + name)) {
            this.toolSprite.play('tools_' + name, true);
        }
    }

    _setFlipAll(val) {
        this.setFlipX(val);
        this.hairSprite.setFlipX(val);
        this.toolSprite.setFlipX(val);
    }

    _syncLayers() {
        this.hairSprite.setPosition(this.x, this.y);
        this.toolSprite.setPosition(this.x, this.y);
        this.shadow.setPosition(this.x, this.y + 5);
    }

    update(cursors, wasd, time, delta) {
        this._syncLayers();

        if (this.isBusy) return;

        // Ataque (ESPAÇO)
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) &&
            time > this.lastAttackTime + this.attackCooldown) {
            this._doAttack(time);
            return;
        }

        this.body.setVelocity(0);

        let dx = 0, dy = 0;
        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx =  1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy =  1;

        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        // Sprint apenas se tiver energia (>0)
        const hasEnergy = this.scene.stats ? this.scene.stats.energy > 0 : true;
        const running = this.shiftKey.isDown && (dx !== 0 || dy !== 0) && hasEnergy;
        const speed   = running ? this.speedRun : this.speedWalk;

        // Consumir energia ao correr
        if (running && this.scene.stats) {
            this.scene.stats.energy = Math.max(0,
                this.scene.stats.energy - 20 * (delta / 1000)
            );
        }

        this.body.setVelocityX(dx * speed);
        this.body.setVelocityY(dy * speed);

        if (dx !== 0 || dy !== 0) {
            if (dx !== 0) this._setFlipAll(dx < 0);
            this.playAnim(running ? 'run' : 'walk', running);

            // Som de passo
            this._stepTimer -= delta || 16;
            if (this._stepTimer <= 0) {
                this._stepTimer = running ? this._stepInterval * 0.6 : this._stepInterval;
                this.scene.events.emit('playerStep');
            }
        } else {
            this._stepTimer = 0;
            this.playAnim('idle');
        }
    }

    _doAttack(time) {
        this.lastAttackTime = time;
        this.isBusy = true;
        this.body.setVelocity(0);

        // Emitir evento de ataque (som)
        this.scene.events.emit('playerAttack');

        const slot = this.scene.inventory?.getSelectedItem();
        const anim = (slot && slot.itemId === 'pickaxe') ? 'mining' : 'axe';
        this.playAnim(anim, true);

        const offX = this.flipX ? -this.attackRange : this.attackRange;
        const hitX = this.x + offX;
        const hitY = this.y;

        const goblins = this.scene.goblins?.getChildren() ?? [];
        goblins.forEach(g => {
            if (!g.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, g.x, g.y);
                if (d < this.attackRange + 16) {
                    g.takeDamage(this.attackDamage, this.flipX ? 'left' : 'right');
                    // Emitir evento de inimigo atingido (som)
                    this.scene.events.emit('enemyHurt');
                }
            }
        });

        // Efeito visual de impacto
        const ring = this.scene.add.circle(hitX, hitY, 14, 0xffff88, 0.6).setDepth(10);
        this.scene.tweens.add({
            targets: ring, scaleX: 2.5, scaleY: 2.5, alpha: 0,
            duration: 230, onComplete: () => ring.destroy()
        });

        this.once('animationcomplete', () => {
            this.isBusy = false;
            this.playAnim('idle');
        });
    }

    flashHurt() {
        this.playAnim('hurt');
        const targets = [this, this.hairSprite, this.toolSprite];
        this.scene.tweens.add({
            targets, alpha: 0.15, duration: 65, yoyo: true, repeat: 4,
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
