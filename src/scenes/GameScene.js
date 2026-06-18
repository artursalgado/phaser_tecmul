import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';
import Skeleton from '../objects/Skeleton.js';
import Tree from '../objects/Tree.js';

// Centro da ilha: tile (40,30) × 16px = pixel (640, 480)
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
    { x: CX + 120, y: CY,      itemId: 'water',   qty: 3 },
    { x: CX - 120, y: CY,      itemId: 'water',   qty: 2 },
    { x: CX,       y: CY-120,  itemId: 'wood',    qty: 2 },
    { x: CX,       y: CY+120,  itemId: 'rock',    qty: 3 },
    // Bauis de destrocos na praia oposta (dao corda para a jangada)
    { x: CX + 320, y: CY - 60, itemId: 'rope', qty: 1 },
    { x: CX + 360, y: CY + 20, itemId: 'rope', qty: 1 },
    { x: CX + 300, y: CY + 100, itemId: 'rope', qty: 1 },
    { x: CX + 48,  y: CY - 48, itemId: 'sword',   qty: 1 },
];

const GOBLIN_SPAWNS = [
    { x: CX - 200, y: CY - 140 },
    { x: CX + 200, y: CY - 140 },
    { x: CX - 200, y: CY + 140 },
    { x: CX + 200, y: CY + 140 },
    { x: CX,       y: CY - 200 },
    { x: CX - 250, y: CY },
    { x: CX + 250, y: CY },
];

// Arvores da floresta (zona sudoeste da ilha)
// Cortar com ESPACO da madeira -- ver Tree.js
const TREE_SPAWNS = [
    { x: CX - 280, y: CY + 220 },
    { x: CX - 320, y: CY + 180 },
    { x: CX - 250, y: CY + 260 },
];

// Zona rochosa a norte -- onde fica o boss que guarda a vela
const BOSS_SPAWN = { x: CX, y: CY - 300 };

const FOOD_VALUES = {
    carrot: { hunger: 20 },
    potato: { hunger: 28 },
    wheat:  { hunger: 12 },
    fish:   { hunger: 35, health: 8 },
    egg:    { hunger: 18, health: 5 },
    milk:   { thirst: 30, health: 5 },
    water:  { thirst: 45 },
};


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this._invulnerable = false;
    }

    create() {
        SoundManager.resume();

        // Reset estado
        this._elapsedSec = 0;
        this._score      = 0;
        this._killCount  = 0;
        this._paused     = false;

        // ── TILEMAP ───────────────────────────────────────────────────────────
        const mapa    = this.make.tilemap({ key: 'ilha' });
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');

        if (!tileset) {
            console.error('[GameScene] ERRO: tileset "sunnyside" nao encontrado no JSON!');
            return;
        }

        const chao      = mapa.createLayer('chao',      tileset, 0, 0);
        const decoracao = mapa.createLayer('Decoracao', tileset, 0, 0);
        const colisao   = mapa.createLayer('colisao',   tileset, 0, 0);
        this._colisao = colisao; // guardar referencia para _spawnGoblin/_spawnSkeleton poderem usar depois

        chao?.setDepth(0);
        decoracao?.setDepth(1);

        if (colisao) {
            colisao.setDepth(2);
            // Colide com qualquer tile que não seja 0 (vazio)
            colisao.setCollisionByExclusion([-1, 0]);
            colisao.setVisible(false); // invisível mas ativo
        }

        const mapW = mapa.widthInPixels;   // 80*16 = 1280
        const mapH = mapa.heightInPixels;  // 60*16 = 960
        this.physics.world.setBounds(0, 0, mapW, mapH);

        // ── SISTEMAS ──────────────────────────────────────────────────────────
        this.inventory = new Inventory(8);
        this.stats     = new PlayerStats();
        this.stats.on('died', () => {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene');
        });

        // ── JOGADOR ───────────────────────────────────────────────────────────
        // Player é agora Arcade.Sprite — setScale(1), frame 96×64
        // Com zoom 2 a câmera → 192×128px no ecrã → personagem grande e visível
        this.player = new Player(this, CX, CY);

        if (colisao) {
            this.physics.add.collider(this.player, colisao);
        }

        // ── CÂMERA ────────────────────────────────────────────────────────────
        // zoom=2: cada tile de 16px fica 32px no ecrã — bom equilíbrio
        // personagem 96px × zoom 2 = 192px no ecrã — claramente visível
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#3a8fa8');

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
            if (!isNaN(n) && n >= 1 && n <= this.inventory.size) {
                this.inventory.selectSlot(n - 1);
            }
            if (e.key === 'e' || e.key === 'E') this._useSelectedItem();
        });

        // ── ITENS ─────────────────────────────────────────────────────────────
        this.pickups = this.physics.add.group();
        SPAWN_ITEMS.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty))
        );
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        // ── GOBLINS ───────────────────────────────────────────────────────────
        this.goblins = this.physics.add.group();
        GOBLIN_SPAWNS.forEach(s => this.goblins.add(new Goblin(this, s.x, s.y)));

        if (colisao) {
            this.physics.add.collider(this.goblins, colisao);
        }

        // -- ARVORES (cortar com ESPACO da madeira) --------------------------
        this.trees = this.physics.add.group();
        TREE_SPAWNS.forEach(s => this.trees.add(new Tree(this, s.x, s.y)));

        // -- BOSS (skeleton na zona rochosa, dropa a vela) ---------------------
        this._spawnSkeleton(BOSS_SPAWN.x, BOSS_SPAWN.y);

        this.events.on('enemyDied', (x, y) => {
            const opts = ['wood','rock','wood','rock','carrot','fish','egg'];
            if (Math.random() < 0.8) {
                const drop = opts[Phaser.Math.Between(0, opts.length-1)];
                this.pickups.add(new CollectibleItem(this, x, y, drop, 1));
            }
        });

        this.events.on('playerDamaged', (amount) => {
            if (this._invulnerable) return;
            this.stats.takeDamage(amount);
            this.player.flashHurt();
            this._setInvulnerable(900);
            this.cameras.main.shake(110, 0.006);
        });

        // ── HUD ───────────────────────────────────────────────────────────────
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');

        // ── DICA INICIAL ──────────────────────────────────────────────────────
        const hint = this.add.text(
            this.scale.width / 2, this.scale.height - 18,
            'WASD/Setas — mover  |  SHIFT — correr  |  ESPAÇO — atacar  |  E — usar  |  1-8 — hotbar',
            { fontSize: '9px', fill: '#ffffcc', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);

        this.time.delayedCall(8000, () => {
            this.tweens.add({ targets: hint, alpha: 0, duration: 1200,
                onComplete: () => hint.destroy() });
        });

        console.log('[GameScene] criado — jogador em', CX, CY, '| mapa', mapW, 'x', mapH);
    }

    update(time, delta) {
        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time);
        this.goblins.getChildren().forEach(g => g.update(this.player, time));
        this._elapsedSec += delta / 1000;
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
        this.goblins.add(s);
        if (this._colisao) this.physics.add.collider(s, this._colisao);
        return s;
    }

    // ── Apanhar item ──────────────────────────────────────────────────────
    _pickupItem(player, item) {
        const def   = ITEM_DB[item.itemId];
        const nome  = def ? def.name : item.itemId;
        const added = this.inventory.addItem(item.itemId, item.quantity);

        const txt = this.add.text(item.x, item.y - 20,
            added ? `+${item.quantity} ${nome}` : 'Inventário cheio!',
            { fontSize: '10px', fill: added ? '#ffffff' : '#ff8888',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(20);

        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0,
            duration: 900, onComplete: () => txt.destroy() });

        if (added) item.destroy();
    }

    _useSelectedItem() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;
        const effect = FOOD_VALUES[slot.itemId];
        if (!effect) return;

        if (effect.hunger) this.stats.eat(effect.hunger);
        if (effect.thirst) this.stats.drink(effect.thirst);
        if (effect.health) this.stats.heal(effect.health);
        this.inventory.removeItem(slot.itemId, 1);

        const def = ITEM_DB[slot.itemId];
        const txt = this.add.text(this.player.x, this.player.y - 40,
            `🍴 ${def ? def.name : slot.itemId}`,
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
}

