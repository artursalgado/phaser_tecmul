import Enemy from './Enemy.js';

export default class Goblin extends Enemy {
    static niveisGoblin = {
        1: { maxHealth: 40,  speed: 55, damage: 6,  tint: null,     scale: 0.75 },
        2: { maxHealth: 70,  speed: 70, damage: 10, tint: 0xff8888, scale: 0.82 },
        3: { maxHealth: 110, speed: 85, damage: 15, tint: 0xcc88ff, scale: 0.90 },
    };

    constructor(scene, x, y, tier = 1) {
        super(scene, x, y, 'goblin_idle');

        const t = Goblin.niveisGoblin[tier] || Goblin.niveisGoblin[1];
        
        // Define atributos customizados com base no Tier
        this.maxHealth = t.maxHealth;
        this.health = t.maxHealth;
        this.speed = t.speed;
        this.damage = t.damage;
        this.setScale(t.scale);
        
        if (t.tint) {
            this.setTint(t.tint);
            this.baseTint = t.tint;
        }

        this.animPrefix = 'goblin';
        this.setOrigin(0.5, 38 / 64);
        
        // Hitbox do goblin
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true);

        this.setupHpBar();
        this.tier = tier;
        this.criarAnimacoes(scene);
        this.play('goblin_idle', true);
    }

    // Cria as animacoes especificas do goblin
    criarAnimacoes(scene) {
        const make = (key, tex, n, fps, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: n - 1 }),
                frameRate: fps,
                repeat
            });
        };
        make('goblin_idle',   'goblin_idle',   8,  6);
        make('goblin_walk',   'goblin_walk',   8, 10);
        make('goblin_hurt',   'goblin_hurt',   8, 12, 0);
        make('goblin_death',  'goblin_death',  9,  8, 0);
        make('goblin_attack', 'goblin_attack', 9, 10, 0);
    }
}
