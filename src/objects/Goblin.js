import Enemy from './Enemy.js';

/**
 * Goblin — tier 1 normal | tier 2 forte (vermelho) | tier 3 elite (roxo)
 * Frames (frameW=96): idle 8 | walk 8 | hurt 8 | death 9 | attack 9
 */
export default class Goblin extends Enemy {
    static _TIERS = {
        1: { maxHealth: 40,  speed: 55, damage: 6,  tint: null,     scale: 0.75 },
        2: { maxHealth: 70,  speed: 70, damage: 10, tint: 0xff8888, scale: 0.82 },
        3: { maxHealth: 110, speed: 85, damage: 15, tint: 0xcc88ff, scale: 0.90 },
    };

    constructor(scene, x, y, tier = 1) {
        const t = Goblin._TIERS[tier] || Goblin._TIERS[1];
        super(scene, x, y, 'goblin_idle', {
            ...t,
            animPrefix:      'goblin',
            detectionRange:  200,
            attackRange:     22,
            damageCooldown:  900,
            bodySize:        [16, 14],
            bodyOffset:      [40, 24],
            originY:         38 / 64,
            hpBarWidth:      24,
            hpBarHeight:     4,
            hpBarColor:      0xff3333,
            hpBgColor:       0x440000,
            hpBarYOffset:    -15,
            deathColor:      0xcc3322,
            deathYOffset:    -4,
            damageTextColor: '#ff4444',
            attackFlashTint: 0xffff00,
            attackFlashDelay: 200,
            knockbackX:      200,
            knockbackY:      -80,
            stunDuration:    350,
            patrolSpeedMult: 0.45,
            patrolTimerMin:  1500,
            patrolTimerMax:  3500,
            patrolRangeMin:  40,
            patrolRangeMax:  100,
        });
        this.tier = tier;
        this._buildAnims(scene);
        this.play('goblin_idle', true);
    }

    _buildAnims(scene) {
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
