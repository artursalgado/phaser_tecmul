import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';
import Skeleton from '../objects/Skeleton.js';
import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

// Centro da ilha em píxeis (tile 40,30 com tiles 16px = 640,480)
const CX = 640, CY = 480;

const SPAWN_ITEMS = [
    { x: CX - 64,  y: CY - 48, itemId: 'wood',    qty: 3 },
    { x: CX + 72,  y: CY - 32, itemId: 'rock',    qty: 2 },
    { x: CX - 80,  y: CY + 56, itemId: 'carrot',  qty: 2 },
    { x: CX + 80,  y: CY + 64, itemId: 'potato',  qty: 2 },
    { x: CX - 32,  y: CY + 80, itemId: 'wheat',   qty: 2 },
    { x: CX + 48,  y: CY - 80, itemId: 'fish',    qty: 2 },
    { x: CX - 48,  y: CY - 88, itemId: 'egg',     qty: 2 },
    { x: CX + 32,  y: CY + 32, itemId: 'axe',     qty: 1 },
    { x: CX - 32,  y: CY + 32, itemId: 'pickaxe', qty: 1 },
    { x: CX + 112, y: CY,      itemId: 'water',   qty: 3 },
    { x: CX - 112, y: CY,      itemId: 'water',   qty: 2 },
    { x: CX,       y: CY - 112,itemId: 'wood',    qty: 2 },
    { x: CX,       y: CY + 112,itemId: 'rock',    qty: 3 },
    { x: CX + 136, y: CY - 80, itemId: 'fish',    qty: 1 },
    { x: CX - 136, y: CY + 80, itemId: 'carrot',  qty: 2 },
    { x: CX + 48,  y: CY - 48, itemId: 'sword',   qty: 1 },
];

const GOBLIN_SPAWNS = [
    { x: CX - 200, y: CY - 150 },
    { x: CX + 200, y: CY - 150 },
    { x: CX - 200, y: CY + 150 },
    { x: CX + 200, y: CY + 150 },
    { x: CX,       y: CY - 220 },
    { x: CX - 260, y: CY },
    { x: CX + 260, y: CY },
];

const FOOD_VALUES = {
    carrot: { hunger: 20 },
    potato: { hunger: 28 },
    wheat:  { hunger: 12 },
    fish:   { hunger: 35, health: 8 },
    egg:    { hunger: 18, health: 5 },
    milk:   { thirst: 30, health: 5 },
    water:  { thirst: 45 },
};

// Tempo de sobrevivência para vitória (segundos)
const VICTORY_TIME = 180;

// Onda de reforço: cada N segundos spawn mais inimigos
const WAVE_INTERVAL = 45;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this._invulnerable = false;
        this._elapsedSec   = 0;
        this._nextWave     = WAVE_INTERVAL;
        this._waveNumber   = 1;
        this._score        = 0;
        this._killCount    = 0;
        this._paused       = false;
    }

    create() {
        SoundManager.resume();

        // Reset estado
        this._elapsedSec = 0;
        this._nextWave   = WAVE_INTERVAL;
        this._waveNumber = 1;
        this._score      = 0;
        this._killCount  = 0;
        this._paused     = false;

        // ── TILEMAP ───────────────────────────────────────────────────────────
        const mapa    = this.make.tilemap({ key: 'ilha' });
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');
        if (!tileset) { console.error('Tileset não encontrado!'); return; }

        const chao      = mapa.createLayer('chao',      tileset, 0, 0);
        const decoracao = mapa.createLayer('Decoracao', tileset, 0, 0);
        const colisao   = mapa.createLayer('colisao',   tileset, 0, 0);
        chao?.setDepth(0);
        decoracao?.setDepth(1);
        if (colisao) {
            colisao.setDepth(2);
            colisao.setCollisionByExclusion([-1, 0]);
            colisao.setVisible(false);
        }

        const mapW = mapa.widthInPixels;
        const mapH = mapa.heightInPixels;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this._colisao = colisao;

        // ── SISTEMAS ──────────────────────────────────────────────────────────
        this.inventory = new Inventory(8);
        this.stats     = new PlayerStats();
        this.stats.on('died', () => {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene', {
                score: this._score,
                kills: this._killCount,
                time:  Math.floor(this._elapsedSec)
            });
        });

        // ── JOGADOR ───────────────────────────────────────────────────────────
        this.player = new Player(this, CX, CY);
        if (colisao) this.physics.add.collider(this.player, colisao);

        // ── CÂMERA ────────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.5);
        this.cameras.main.setBackgroundColor('#1a6b8a');

        // ── CONTROLOS ─────────────────────────────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd    = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });
        this.input.keyboard.on('keydown', (e) => {
            const n = parseInt(e.key, 10);
            if (!isNaN(n) && n >= 1 && n <= this.inventory.size) this.inventory.selectSlot(n - 1);
            if (e.key === 'e' || e.key === 'E') this._useSelectedItem();
            if (e.key === 'Escape') this._togglePause();
        });

        // ── ITENS ─────────────────────────────────────────────────────────────
        this.pickups = this.physics.add.group();
        SPAWN_ITEMS.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty))
        );
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        // ── INIMIGOS ──────────────────────────────────────────────────────────
        this.goblins = this.physics.add.group();
        GOBLIN_SPAWNS.forEach(s => this._spawnGoblin(s.x, s.y));
        if (colisao) this.physics.add.collider(this.goblins, colisao);
        this.physics.add.collider(this.goblins, this.goblins);

        // ── EVENTOS ───────────────────────────────────────────────────────────
        this.events.on('enemyDied', (x, y) => {
            this._killCount++;
            this._score += 100;
            const drops = ['wood','rock','wood','rock','carrot','fish','egg'];
            if (Math.random() < 0.8) {
                const drop = drops[Math.floor(Math.random() * drops.length)];
                this.pickups.add(new CollectibleItem(this, x, y, drop, 1));
            }
        });

        this.events.on('playerDamaged', (amount) => {
            if (this._invulnerable) return;
            this.stats.takeDamage(amount);
            this.player.flashHurt();
            SoundManager.play('hurt');
            this._setInvulnerable(1000);
            this.cameras.main.shake(120, 0.006);
        });

        this.events.on('playerAttack', () => SoundManager.play('attack'));
        this.events.on('enemyHurt',    () => SoundManager.play('goblin_hurt'));
        this.events.on('playerStep',   () => SoundManager.play('step'));

        // ── HUD ───────────────────────────────────────────────────────────────
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');

        // ── DICA ──────────────────────────────────────────────────────────────
        const hintText = I18n.t('hud.hint') + '  ·  ESC pausa';
        const hint = this.add.text(
            this.scale.width / 2, this.scale.height - 20, hintText,
            { fontSize: '9px', fill: '#ffffbb', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);
        this.time.delayedCall(8000, () => {
            this.tweens.add({ targets: hint, alpha: 0, duration: 1200,
                onComplete: () => hint.destroy() });
        });
    }

    update(time, delta) {
        if (this._paused) return;

        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time, delta);
        this.goblins.getChildren().forEach(g => g.update(this.player, time));

        // ── TEMPO E VITÓRIA ───────────────────────────────────────────────────
        this._elapsedSec += delta / 1000;
        this._score = Math.max(this._score, Math.floor(this._elapsedSec) * 10 + this._killCount * 100);

        if (this._elapsedSec >= VICTORY_TIME) {
            this.scene.stop('HUDScene');
            this.scene.start('VictoryScene', {
                score: this._score,
                kills: this._killCount,
                time:  Math.floor(this._elapsedSec)
            });
            return;
        }

        // ── DIFICULDADE PROGRESSIVA (ondas) ───────────────────────────────────
        if (this._elapsedSec >= this._nextWave) {
            this._nextWave += WAVE_INTERVAL;
            this._waveNumber++;
            this._spawnWave();
        }
    }

    // ── Pausa ─────────────────────────────────────────────────────────────
    _togglePause() {
        if (this._paused) return;
        this._paused = true;
        SoundManager.play('pause');
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene');
        this.scene.get('PauseScene').events.once('shutdown', () => {
            this._paused = false;
        });
    }

    // ── Spawn goblin ──────────────────────────────────────────────────────
    _spawnGoblin(x, y, tier = 1) {
        const g = new Goblin(this, x, y, tier);
        this.goblins.add(g);
        if (this._colisao) this.physics.add.collider(g, this._colisao);
        return g;
    }

    // ── Spawn skeleton ─────────────────────────────────────────────────────
    _spawnSkeleton(x, y) {
        const s = new Skeleton(this, x, y);
        this.goblins.add(s);  // mesmo grupo para colisões e update
        if (this._colisao) this.physics.add.collider(s, this._colisao);
        return s;
    }

    // ── Spawn de onda de reforço ───────────────────────────────────────────
    _spawnWave() {
        const count    = 2 + this._waveNumber;
        const gobTier  = Math.min(this._waveNumber, 3);
        // A partir da vaga 2, metade dos inimigos são skeletons
        const skelRatio = this._waveNumber >= 2 ? 0.5 : 0;

        const waveLabel = I18n.lang === 'en'
            ? `⚠ Wave ${this._waveNumber}! ${count} enemies incoming!`
            : `⚠ Vaga ${this._waveNumber}! ${count} inimigos a chegar!`;

        const txt = this.add.text(this.scale.width / 2, 60, waveLabel, {
            fontSize: '14px', fill: '#ff4444', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        this.cameras.main.shake(200, 0.004);
        this.tweens.add({
            targets: txt, alpha: 0, delay: 2500, duration: 800,
            onComplete: () => txt.destroy()
        });

        const offsets = [
            { x: -300, y: -200 }, { x: 300, y: -200 },
            { x: -300, y:  200 }, { x: 300, y:  200 },
            { x: 0,    y: -350 }, { x: 0,   y:  350 },
            { x: -350, y: 0    }, { x: 350, y:  0   },
        ];
        for (let i = 0; i < count; i++) {
            const off = offsets[i % offsets.length];
            const sx = Phaser.Math.Clamp(CX + off.x + Phaser.Math.Between(-40, 40), 100, 1200);
            const sy = Phaser.Math.Clamp(CY + off.y + Phaser.Math.Between(-40, 40), 100, 900);
            if (Math.random() < skelRatio) {
                this._spawnSkeleton(sx, sy);
            } else {
                this._spawnGoblin(sx, sy, gobTier);
            }
        }
    }

    // ── Apanhar item ──────────────────────────────────────────────────────
    _pickupItem(player, item) {
        const def   = ITEM_DB[item.itemId];
        const nome  = I18n.t(`items.${item.itemId}`) || (def ? def.name : item.itemId);
        const added = this.inventory.addItem(item.itemId, item.quantity);
        if (added) {
            SoundManager.play('pickup');
            this._score += 10;
        }
        const txt = this.add.text(item.x, item.y - 20,
            added ? `+${item.quantity} ${nome}` : I18n.t('hud.inventory_full'),
            { fontSize: '10px', fill: added ? '#ffffff' : '#ff8888',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: txt, y: txt.y - 28, alpha: 0,
            duration: 900, onComplete: () => txt.destroy() });
        if (added) item.destroy();
    }

    // ── Usar item selecionado ─────────────────────────────────────────────
    _useSelectedItem() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;
        const effect = FOOD_VALUES[slot.itemId];
        if (!effect) return;
        if (effect.hunger) this.stats.eat(effect.hunger);
        if (effect.thirst) this.stats.drink(effect.thirst);
        if (effect.health) this.stats.heal(effect.health);
        this.inventory.removeItem(slot.itemId, 1);
        SoundManager.play('pickup');
        const nome = I18n.t(`items.${slot.itemId}`);
        const txt = this.add.text(this.player.x, this.player.y - 36, `🍴 ${nome}`,
            { fontSize: '12px', fill: '#88ff88', fontStyle: 'bold',
              stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: txt, y: txt.y - 32, alpha: 0,
            duration: 900, onComplete: () => txt.destroy() });
    }

    _setInvulnerable(ms) {
        this._invulnerable = true;
        this.time.delayedCall(ms, () => { this._invulnerable = false; });
    }

    // Getters públicos para o HUD
    get elapsedSec()  { return this._elapsedSec; }
    get score()       { return this._score; }
    get killCount()   { return this._killCount; }
    get victoryTime() { return VICTORY_TIME; }
}
