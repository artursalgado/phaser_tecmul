import Enemy from './Enemy.js';

/**
 * Skeleton — mais rápido que goblin, menor HP. Aparece a partir da vaga 2.
 * Frames: idle 6 | walk 8 | hurt 7 | death 10 | attack 7
 */
export default class Skeleton extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton_idle', {
            maxHealth:       30,
            speed:           90,
            damage:          8,
            scale:           0.75,
            tint:            0xaaddff,
            detectionRange:  240,
            attackRange:     22,
            damageCooldown:  750,
            animPrefix:      'skeleton',
            bodySize:        [18, 16],
            bodyOffset:      [39, 23],
            originY:         39 / 64,
            hpBarWidth:      22,
            hpBarHeight:     4,
            hpBarColor:      0x4499ff,
            hpBgColor:       0x000033,
            hpBarYOffset:    -13,
            deathColor:      0xaaddff,
            deathYOffset:    -7,
            damageTextColor: '#4499ff',
            attackFlashTint: 0xffffff,
            attackFlashDelay: 160,
            knockbackX:      250,
            knockbackY:      -100,
            stunDuration:    280,
            patrolSpeedMult: 0.5,
            patrolTimerMin:  1000,
            patrolTimerMax:  2500,
            patrolRangeMin:  50,
            patrolRangeMax:  120,
        });
        this._buildAnims(scene);
        this.play('skeleton_idle', true);
    }

    _buildAnims(scene) {
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
