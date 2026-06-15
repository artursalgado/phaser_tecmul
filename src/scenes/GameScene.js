import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';

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

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this._invulnerable = false;
    }

    create() {
        // ── TILEMAP ───────────────────────────────────────────────────────────
        const mapa    = this.make.tilemap({ key: 'ilha' });
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');

        if (!tileset) {
            console.error('ERRO: tileset "sunnyside" não encontrado!');
            return;
        }

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

        // ── SISTEMAS ──────────────────────────────────────────────────────────
        this.inventory = new Inventory(8);
        this.stats     = new PlayerStats();
        this.stats.on('died', () => {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene');
        });

        // ── JOGADOR ───────────────────────────────────────────────────────────
        this.player = new Player(this, CX, CY);

        if (colisao) {
            this.physics.add.collider(this.player, colisao);
        }

        // ── CÂMERA ────────────────────────────────────────────────────────────
        // zoom=2.5: cada tile de 16px fica 40px no ecrã — bom para ver o mapa
        // O jogador de 64px de altura × 0.75 × 2.5 = 120px no ecrã — perfeito
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
            if (!isNaN(n) && n >= 1 && n <= this.inventory.size) {
                this.inventory.selectSlot(n - 1);
            }
            if (e.key === 'e' || e.key === 'E') this._useSelectedItem();
        });

        // ── ITENS NO MAPA ──────────────────────────────────────────────────────
        this.pickups = this.physics.add.group();
        SPAWN_ITEMS.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty))
        );
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        // ── GOBLINS ───────────────────────────────────────────────────────────
        this.goblins = this.physics.add.group();
        GOBLIN_SPAWNS.forEach(s => this.goblins.add(new Goblin(this, s.x, s.y)));

        // Colisão goblins ↔ colisao layer
        if (colisao) {
            this.physics.add.collider(this.goblins, colisao);
        }

        this.events.on('enemyDied', (x, y) => {
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
            this._setInvulnerable(1000);
            this.cameras.main.shake(120, 0.006);
        });

        // ── HUD ───────────────────────────────────────────────────────────────
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');

        // ── DICA ──────────────────────────────────────────────────────────────
        const hint = this.add.text(
            this.scale.width / 2,
            this.scale.height - 20,
            'WASD/setas mover  ·  SHIFT correr  ·  ESPAÇO atacar  ·  E usar  ·  1-8 hotbar',
            { fontSize: '9px', fill: '#ffffbb', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);

        this.time.delayedCall(8000, () => {
            this.tweens.add({ targets: hint, alpha: 0, duration: 1200,
                onComplete: () => hint.destroy() });
        });
    }

    update(time, delta) {
        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time);
        this.goblins.getChildren().forEach(g => g.update(this.player, time));
    }

    _pickupItem(player, item) {
        const def   = ITEM_DB[item.itemId];
        const nome  = def ? def.name : item.itemId;
        const added = this.inventory.addItem(item.itemId, item.quantity);

        const txt = this.add.text(item.x, item.y - 20,
            added ? `+${item.quantity} ${nome}` : 'Inventário cheio!',
            { fontSize: '10px', fill: added ? '#ffffff' : '#ff8888',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(20);

        this.tweens.add({ targets: txt, y: txt.y - 28, alpha: 0,
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
        const txt = this.add.text(this.player.x, this.player.y - 36,
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
}
