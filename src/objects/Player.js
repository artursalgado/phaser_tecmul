/**
 * Player — Phaser 3 Arcade Sprite (sem Container — evita bugs de physics)
 * Frame: 96×64px, setScale(1) → personagem vísivel com zoom 2.5
 * Camadas hair + tools são sprites separados que copiam a posição
 */

// Tabela de stats por arma/ferramenta equipada
const WEAPON_STATS = {
    axe:     { damage: 25, range: 52, cooldown: 700 }, // Machado: forte e lento, bom para madeira
    pickaxe: { damage: 15, range: 44, cooldown: 500 }, // Picareta: fraca e rápida, para mineração
    sword:   { damage: 20, range: 60, cooldown: 550 }, // Espada: equilibrada e com maior alcance
    hammer:  { damage: 35, range: 40, cooldown: 900 }, // Martelo: muito forte e lento
    none:    { damage: 10, range: 36, cooldown: 600 }  // Sem arma: soco base
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

        // Ataque
        this.attackDamage   = 20;
        this.attackRange    = 48;
        this.attackCooldown = 600;
        this.lastAttackTime = 0;

        // Passo sonoro
        this._stepTimer = 0;
        this._stepInterval = 320;

        // Escala 1 = frame 96×64 no mapa. Com zoom 2.5 fica 240×160px no ecrã
        this.setScale(1);
        this.setDepth(5);
        this.setOrigin(0.5, 38 / 64);

        // Hitbox centrada nos pés: frame 96 wide → offset x=40; frame 64 high → offset y=24
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true);

        // ── Sombra ───────────────────────────────────────────────────────────
        this.shadow = scene.add.ellipse(x, y + 1, 20, 7, 0x000000, 0.3).setDepth(4);

        // ── Camadas visuais (sem physics — só seguem a posição) ──────────────
        this.hairSprite = scene.add.sprite(x, y, 'player_hair_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(6);
        this.toolSprite = scene.add.sprite(x, y, 'player_tools_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(7).setVisible(false);

        // ── Animações ────────────────────────────────────────────────────────
        this._buildAnimations(scene);
        this.playAnim('idle');

        // ── Teclas ───────────────────────────────────────────────────────────
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    _buildAnimations(scene) {
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
        // Hair
        make('hair_idle',     'player_hair_idle',    9,  6);
        make('hair_walk',     'player_hair_walk',    8, 10);
        make('hair_run',      'player_hair_run',     8, 14);
        make('hair_hurt',     'player_hair_hurt',    8, 12, 0);
        make('hair_death',    'player_hair_death',  13,  8, 0);
        make('hair_axe',      'player_hair_axe',    10, 12, 0);
        make('hair_mining',   'player_hair_mining', 10, 12, 0);
        // Tools
        make('tools_idle',    'player_tools_idle',   9,  6);
        make('tools_walk',    'player_tools_walk',   8, 10);
        make('tools_run',     'player_tools_run',    8, 14);
        make('tools_axe',     'player_tools_axe',   10, 12, 0);
        make('tools_mining',  'player_tools_mining',10, 12, 0);
    }

    playAnim(name, showTool = false) {
        this.play('player_' + name, true);
        this.hairSprite.play('hair_' + name, true);
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
        this.shadow.setPosition(this.x, this.y + 1);
        this.hairSprite.setFlipX(this.flipX);
        this.toolSprite.setFlipX(this.flipX);
    }

    _energyMult() {
        // Verifica se o scene tem stats para evitar erros
        if (!this.scene.stats) return 1;

        const pct = this.scene.stats.energyPct;
        if (pct > 0.30) {
            return 1.0; // Normal
        } else if (pct >= 0.10) {
            return 0.70; // Cansado
        } else {
            return 0.50; // Exausto
        }
    }

    update(cursors, wasd, time, delta) {
        this._syncLayers();

        if (this.isBusy) return;

        // Atualizar stats com base no item atualmente selecionado no inventário
        const slot = this.scene.inventory?.getSelectedItem();
        const itemId = slot?.itemId;
        const stats = WEAPON_STATS[itemId] || WEAPON_STATS.none;
        this.attackDamage = stats.damage;
        this.attackRange = stats.range;
        this.attackCooldown = stats.cooldown;

        // Ataque (cooldown escala ao contrário baseado na energia)
        const effectiveCooldown = this.attackCooldown / this._energyMult();
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) &&
            time > this.lastAttackTime + effectiveCooldown) {
            this._doAttack(time);
            return;
        }

        this.body.setVelocity(0);

        let dx = 0, dy = 0;
        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx =  1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy =  1;

        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        // Sprint apenas se tiver energia (>0) e não estiver exausto (energia >= 10%)
        const hasEnergy = this.scene.stats ? (this.scene.stats.energy > 0 && this.scene.stats.energyPct >= 0.10) : true;
        const running = this.shiftKey.isDown && (dx !== 0 || dy !== 0) && hasEnergy;
        
        // Velocidade de andar afetada pelo multiplicador de energia
        const speed   = running ? this.speedRun : this.speedWalk * this._energyMult();

        // Consumir energia ao correr
        if (running && this.scene.stats) {
            this.scene.stats.energy = Math.max(0,
                this.scene.stats.energy - 20 * (delta / 1000)
            );
        }

        this.body.setVelocityX(dx * speed);
        this.body.setVelocityY(dy * speed);

        if (dx !== 0 || dy !== 0) {
            if (dx < 0) this._setFlipAll(true);
            else if (dx > 0) this._setFlipAll(false);
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

        // Tint visual com base no cansaço (energia abaixo de 30%)
        if (this.scene.stats) {
            if (this.scene.stats.energyPct < 0.30) {
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

    _doAttack(time) {
        this.lastAttackTime = time;
        this.isBusy = true;
        this.body.setVelocity(0);

        this.scene.events.emit('playerAttack');

        const slot     = this.scene.inventory?.getSelectedItem();
        const itemId   = slot?.itemId;
        const isWeapon = itemId && itemId in WEAPON_STATS && itemId !== 'none';
        const anim     = itemId === 'pickaxe' ? 'mining' : 'axe';
        this.playAnim(anim, isWeapon);

        const offX = this.flipX ? -this.attackRange : this.attackRange;
        const hitX = this.x + offX;
        const hitY = this.y;

        const mult = this._energyMult();

        const goblins = this.scene.goblins?.getChildren() ?? [];
        goblins.forEach(g => {
            if (!g.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, g.x, g.y);
                if (d < this.attackRange + 20) {
                    // Dano de ataque reduzido pelo cansaço
                    g.takeDamage(this.attackDamage * mult, this.flipX ? 'left' : 'right');
                    this.scene.events.emit('enemyHurt');
                }
            }
        });

        // Árvores cortáveis (EPIC da jangada) — mesma deteção de alcance dos goblins
        const trees = this.scene.trees?.getChildren() ?? [];
        trees.forEach(t => {
            if (!t.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, t.x, t.y);
                if (d < this.attackRange + 20) {
                    if (Math.random() < mult) t.chop();
                }
            }
        });

        // Efeito visual
        const ring = this.scene.add.circle(hitX, hitY, 18, 0xffff88, 0.55).setDepth(10);
        this.scene.tweens.add({
            targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0,
            duration: 220, onComplete: () => ring.destroy()
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
