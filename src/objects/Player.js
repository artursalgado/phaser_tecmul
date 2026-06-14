// Jogador animado com spritesheets do conjunto "human"
// Camadas: base (corpo) + hair (cabelo) + tools (ferramentas)
// Cada camada é um sprite separado no mesmo ponto — assim as animações ficam alinhadas.
export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.speed = 120;
        this.isBusy = false;  // verdade durante animações de ação (picar, cortar...)
        this.facing = 'right'; // direção atual para saber qual frame usar

        // Camada de corpo (base)
        this.bodySprite = scene.add.sprite(0, 0, 'player_base_idle').setOrigin(0.5, 0.5);
        // Camada de cabelo
        this.hairSprite = scene.add.sprite(0, 0, 'player_hair_idle').setOrigin(0.5, 0.5);
        // Camada de ferramentas (só visível durante animações de ação)
        this.toolSprite = scene.add.sprite(0, 0, 'player_tools_idle').setOrigin(0.5, 0.5).setVisible(false);

        this.add([this.bodySprite, this.hairSprite, this.toolSprite]);

        // Adicionar à cena e habilitar física
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(12, 14);        // hitbox mais pequena que o sprite
        this.body.setOffset(-6, -7);
        this.body.setCollideWorldBounds(true);

        this.setDepth(5);
        this.setScale(2);

        this._buildAnimations(scene);
        this.playAnim('idle');
    }

    _buildAnimations(scene) {
        // Helper: criar animação se ainda não existir
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

        // Base body
        make('player_idle',    'player_base_idle',   9,  6);
        make('player_walk',    'player_base_walk',   8, 10);
        make('player_run',     'player_base_run',    8, 12);
        make('player_hurt',    'player_base_hurt',   8, 10, 0);
        make('player_death',   'player_base_death',  13, 8, 0);
        make('player_axe',     'player_base_axe',    10, 10, 0);
        make('player_mining',  'player_base_mining', 10, 10, 0);

        // Hair overlays
        make('hair_idle',   'player_hair_idle',   9,  6);
        make('hair_walk',   'player_hair_walk',   8, 10);
        make('hair_run',    'player_hair_run',    8, 12);
        make('hair_hurt',   'player_hair_hurt',   8, 10, 0);
        make('hair_death',  'player_hair_death',  13, 8, 0);
        make('hair_axe',    'player_hair_axe',    10, 10, 0);
        make('hair_mining', 'player_hair_mining', 10, 10, 0);

        // Tools overlays
        make('tools_idle',   'player_tools_idle',   9,  6);
        make('tools_walk',   'player_tools_walk',   8, 10);
        make('tools_run',    'player_tools_run',    8, 12);
        make('tools_hurt',   'player_tools_hurt',   8, 10, 0);
        make('tools_axe',    'player_tools_axe',    10, 10, 0);
        make('tools_mining', 'player_tools_mining', 10, 10, 0);
    }

    // Reproduz as três camadas em simultâneo
    playAnim(name, showTool = false) {
        this.bodySprite.play('player_' + name, true);
        this.hairSprite.play('hair_' + name, true);

        this.toolSprite.setVisible(showTool);
        if (showTool && this.scene.anims.exists('tools_' + name)) {
            this.toolSprite.play('tools_' + name, true);
        }
    }

    // Flip consoante a direção
    setDirection(dx, dy) {
        if (dx < 0)       { this.setFlipX(true);  this.facing = 'left'; }
        else if (dx > 0)  { this.setFlipX(false); this.facing = 'right'; }
    }

    setFlipX(val) {
        this.bodySprite.setFlipX(val);
        this.hairSprite.setFlipX(val);
        this.toolSprite.setFlipX(val);
    }

    update(cursors, wasd) {
        if (this.isBusy) return; // durante animação de ação não se move

        const body = this.body;
        body.setVelocity(0);

        let dx = 0, dy = 0;

        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx = 1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy = 1;

        // Normaliza movimento diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        body.setVelocityX(dx * this.speed);
        body.setVelocityY(dy * this.speed);

        if (dx !== 0 || dy !== 0) {
            this.setDirection(dx, dy);
            this.playAnim('walk');
        } else {
            this.playAnim('idle');
        }
    }

    // Ativa animação de dano (pisca vermelho por 500ms)
    flashHurt() {
        this.playAnim('hurt');
        this.scene.tweens.add({
            targets: [this.bodySprite, this.hairSprite],
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.bodySprite.setAlpha(1);
                this.hairSprite.setAlpha(1);
            }
        });
    }
}
