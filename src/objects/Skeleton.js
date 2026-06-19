import Enemy from './Enemy.js';

export default class Skeleton extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton_idle');

        // Configura atributos especificos do esqueleto
        this.maxHealth = 30;
        this.health = 30;
        this.speed = 90;
        this.damage = 8;
        this.setScale(0.75);
        this.setTint(0xaaddff);
        this.baseTint = 0xaaddff;

        this.detectionRange = 240;
        this.damageCooldown = 750;
        this.animPrefix = 'skeleton';

        this.setOrigin(0.5, 39 / 64);
        
        // Hitbox do esqueleto
        this.body.setSize(18, 16);
        this.body.setOffset(39, 23);
        this.body.setCollideWorldBounds(true);

        // Barra de vida e efeitos customizados
        this.hpBarWidth = 22;
        this.hpBarYOffset = -13;
        this.hpBarColor = 0x4499ff;
        this.hpBgColor = 0x000033;
        this.deathColor = 0xaaddff;
        this.deathYOffset = -7;
        this.damageTextColor = '#4499ff';
        this.attackFlashTint = 0xffffff;
        this.attackFlashDelay = 160;
        
        this.knockbackX = 250;
        this.knockbackY = -100;
        this.stunDuration = 280;
        
        this.patrolSpeedMult = 0.5;
        this.patrolTimerMin = 1000;
        this.patrolTimerMax = 2500;
        this.patrolRangeMin = 50;
        this.patrolRangeMax = 120;

        this.setupHpBar();
        this.criarAnimacoes(scene);
        this.play('skeleton_idle', true);
    }

    // Cria as animacoes especificas do esqueleto
    criarAnimacoes(scene) {
        const make = (key, texture, nFrames, rate, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: nFrames - 1 }),
                frameRate: rate,
                repeat
            });
        };
        make('skeleton_idle',   'skeleton_idle',    6,  6);
        make('skeleton_walk',   'skeleton_walk',    8, 12);
        make('skeleton_hurt',   'skeleton_hurt',    7, 14, 0);
        make('skeleton_death',  'skeleton_death',  10,  8, 0);
        make('skeleton_attack', 'skeleton_attack',  7, 12, 0);
    }
}
