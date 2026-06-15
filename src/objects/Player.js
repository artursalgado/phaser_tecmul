/**
 * Player — Container com 3 camadas de sprite sobrepostas (body + hair + tools)
 * Melhorias: sprint (Shift), ataque melee (Space/F), knockback, sombra
 */
export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene      = scene;
        this.speedWalk  = 90;
        this.speedRun   = 160;
        this.isBusy     = false;   // bloqueia movimento durante ação
        this.facing     = 'right';
        this.isAttacking = false;

        // Ataque melee
        this.attackDamage   = 20;
        this.attackRange    = 40;
        this.attackCooldown = 600;  // ms
        this.lastAttackTime = 0;

        // Sombra (círculo oval por baixo)
        this.shadow = scene.add.ellipse(0, 10, 20, 8, 0x000000, 0.25);
        this.shadow.setDepth(0);

        // Camadas de sprite
        this.bodySprite = scene.add.sprite(0, 0, 'player_base_idle').setOrigin(0.5, 0.5);
        this.hairSprite = scene.add.sprite(0, 0, 'player_hair_idle').setOrigin(0.5, 0.5);
        this.toolSprite = scene.add.sprite(0, 0, 'player_tools_idle').setOrigin(0.5, 0.5).setVisible(false);

        this.add([this.bodySprite, this.hairSprite, this.toolSprite]);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(12, 14);
        this.body.setOffset(-6, -4);
        this.body.setCollideWorldBounds(true);

        this.setDepth(5);
        this.setScale(2);

        this._buildAnimations(scene);
        this.playAnim('idle');

        // Tecla de ataque
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    _buildAnimations(scene) {
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
        // Base
        make('player_idle',    'player_base_idle',   9,  6);
        make('player_walk',    'player_base_walk',   8, 10);
        make('player_run',     'player_base_run',    8, 14);
        make('player_hurt',    'player_base_hurt',   8, 12, 0);
        make('player_death',   'player_base_death',  13, 8, 0);
        make('player_axe',     'player_base_axe',    10, 12, 0);
        make('player_mining',  'player_base_mining', 10, 12, 0);
        // Hair
        make('hair_idle',      'player_hair_idle',   9,  6);
        make('hair_walk',      'player_hair_walk',   8, 10);
        make('hair_run',       'player_hair_run',    8, 14);
        make('hair_hurt',      'player_hair_hurt',   8, 12, 0);
        make('hair_death',     'player_hair_death',  13, 8, 0);
        make('hair_axe',       'player_hair_axe',    10, 12, 0);
        make('hair_mining',    'player_hair_mining', 10, 12, 0);
        // Tools
        make('tools_idle',     'player_tools_idle',  9,  6);
        make('tools_walk',     'player_tools_walk',  8, 10);
        make('tools_run',      'player_tools_run',   8, 14);
        make('tools_hurt',     'player_tools_hurt',  8, 12, 0);
        make('tools_axe',      'player_tools_axe',   10, 12, 0);
        make('tools_mining',   'player_tools_mining',10, 12, 0);
    }

    playAnim(name, showTool = false) {
        this.bodySprite.play('player_' + name, true);
        this.hairSprite.play('hair_'   + name, true);
        this.toolSprite.setVisible(showTool);
        if (showTool && this.scene.anims.exists('tools_' + name)) {
            this.toolSprite.play('tools_' + name, true);
        }
    }

    setFlipX(val) {
        this.bodySprite.setFlipX(val);
        this.hairSprite.setFlipX(val);
        this.toolSprite.setFlipX(val);
    }

    setDirection(dx) {
        if (dx < 0)      { this.setFlipX(true);  this.facing = 'left'; }
        else if (dx > 0) { this.setFlipX(false); this.facing = 'right'; }
    }

    // Sincroniza posição da sombra com o container
    _updateShadow() {
        this.shadow.setPosition(this.x, this.y + 10 * this.scaleY);
    }

    update(cursors, wasd, time) {
        if (this.isBusy) {
            this._updateShadow();
            return;
        }

        // Ataque
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) &&
            time > this.lastAttackTime + this.attackCooldown) {
            this._doAttack(time);
            return;
        }

        const body = this.body;
        body.setVelocity(0);

        let dx = 0, dy = 0;
        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx =  1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy =  1;

        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        const running = this.shiftKey.isDown && (dx !== 0 || dy !== 0);
        const speed   = running ? this.speedRun : this.speedWalk;

        body.setVelocityX(dx * speed);
        body.setVelocityY(dy * speed);

        if (dx !== 0 || dy !== 0) {
            this.setDirection(dx);
            this.playAnim(running ? 'run' : 'walk', running);
        } else {
            this.playAnim('idle');
        }

        this._updateShadow();
    }

    _doAttack(time) {
        this.lastAttackTime = time;
        this.isBusy = true;
        this.body.setVelocity(0);

        // Escolher animação: axe ou mining com base no item equipado
        const slot = this.scene.inventory?.getSelectedItem();
        const anim = (slot && slot.itemId === 'pickaxe') ? 'mining' : 'axe';
        this.playAnim(anim, true);

        // Hitbox de ataque na frente do jogador
        const offX = this.facing === 'right' ? this.attackRange : -this.attackRange;
        const hitX = this.x + offX;
        const hitY = this.y;

        // Atingir goblins no raio
        const goblins = this.scene.goblins?.getChildren() ?? [];
        goblins.forEach(g => {
            if (!g.dead) {
                const dist = Phaser.Math.Distance.Between(hitX, hitY, g.x, g.y);
                if (dist < this.attackRange + 10) {
                    g.takeDamage(this.attackDamage, this.facing);
                }
            }
        });

        // Efeito visual — anel de impacto
        const ring = this.scene.add.circle(hitX, hitY, 14, 0xffffff, 0.5).setDepth(10);
        this.scene.tweens.add({
            targets: ring, scaleX: 2, scaleY: 2, alpha: 0,
            duration: 200, onComplete: () => ring.destroy()
        });

        // Desbloquear após animação
        this.bodySprite.once('animationcomplete', () => {
            this.isBusy = false;
            this.playAnim('idle');
        });
    }

    flashHurt() {
        this.playAnim('hurt');
        this.scene.tweens.add({
            targets: [this.bodySprite, this.hairSprite, this.toolSprite],
            alpha: 0.2, duration: 60, yoyo: true, repeat: 4,
            onComplete: () => {
                this.bodySprite.setAlpha(1);
                this.hairSprite.setAlpha(1);
                this.toolSprite.setAlpha(1);
                if (!this.isBusy) this.playAnim('idle');
            }
        });
    }
}
