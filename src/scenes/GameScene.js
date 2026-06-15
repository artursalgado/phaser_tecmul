import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';

// Centro da ilha: pixel (640, 480) — tile (40,30) num mapa 80x60
const CX = 640, CY = 480;

// ── Itens espalhados pela ilha ────────────────────────────────────────────────
const SPAWN_ITEMS = [
    // Perto do spawn
    { x: CX - 60,  y: CY - 40, itemId: 'wood',    qty: 3 },
    { x: CX + 70,  y: CY - 30, itemId: 'rock',    qty: 2 },
    { x: CX - 80,  y: CY + 50, itemId: 'carrot',  qty: 2 },
    { x: CX + 80,  y: CY + 60, itemId: 'potato',  qty: 2 },
    { x: CX - 30,  y: CY + 80, itemId: 'wheat',   qty: 2 },
    { x: CX + 40,  y: CY - 80, itemId: 'fish',    qty: 2 },
    { x: CX - 50,  y: CY - 90, itemId: 'egg',     qty: 2 },
    // Ferramentas perto do spawn
    { x: CX + 30,  y: CY + 30, itemId: 'axe',     qty: 1 },
    { x: CX - 30,  y: CY + 30, itemId: 'pickaxe', qty: 1 },
    // Água e comida espalhada
    { x: CX + 120, y: CY,      itemId: 'water',   qty: 3 },
    { x: CX - 120, y: CY,      itemId: 'water',   qty: 2 },
    { x: CX,       y: CY - 120,itemId: 'wood',    qty: 2 },
    { x: CX,       y: CY + 120,itemId: 'rock',    qty: 3 },
    { x: CX + 150, y: CY - 80, itemId: 'fish',    qty: 1 },
    { x: CX - 150, y: CY + 80, itemId: 'carrot',  qty: 2 },
    { x: CX + 100, y: CY + 130,itemId: 'egg',     qty: 1 },
];

// ── Goblins — espalhados a distância do centro ────────────────────────────────
const GOBLIN_SPAWNS = [
    { x: CX - 200, y: CY - 150 },
    { x: CX + 200, y: CY - 150 },
    { x: CX - 200, y: CY + 150 },
    { x: CX + 200, y: CY + 150 },
    { x: CX,       y: CY - 220 },
    { x: CX - 280, y: CY },
    { x: CX + 280, y: CY },
];

// ── Efeito de comida/bebida por item ─────────────────────────────────────────
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
        // ── TILEMAP ──────────────────────────────────────────────────────────
        const mapa    = this.make.tilemap({ key: 'ilha' });
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');

        const chao      = mapa.createLayer('chao',      tileset, 0, 0);
        const decoracao = mapa.createLayer('Decoracao', tileset, 0, 0);
        const colisao   = mapa.createLayer('colisao',   tileset, 0, 0);

        chao.setDepth(0);
        decoracao.setDepth(1);

        if (colisao) {
            colisao.setDepth(2);
            colisao.setCollisionByExclusion([-1, 0]);
            colisao.setAlpha(0);   // invisível — o chão já mostra tudo
        }

        const mapW = mapa.widthInPixels;
        const mapH = mapa.heightInPixels;
        this.physics.world.setBounds(0, 0, mapW, mapH);

        // ── SISTEMAS ─────────────────────────────────────────────────────────
        this.inventory = new Inventory(8);
        this.stats     = new PlayerStats();

        this.stats.on('died', () => {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene');
        });

        // ── JOGADOR ──────────────────────────────────────────────────────────
        this.player = new Player(this, CX, CY);

        if (colisao) {
            this.physics.add.collider(this.player, colisao);
        }

        // ── CÂMERA ───────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.5);   // zoom confortável para 80x60

        // ── CONTROLOS ────────────────────────────────────────────────────────
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

        // ── ITENS NO MAPA ────────────────────────────────────────────────────
        this.pickups = this.physics.add.group();
        SPAWN_ITEMS.forEach(s => {
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty));
        });
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        // ── GOBLINS ──────────────────────────────────────────────────────────
        this.goblins = this.physics.add.group();
        GOBLIN_SPAWNS.forEach(s => this.goblins.add(new Goblin(this, s.x, s.y)));

        this.events.on('enemyDied', (x, y) => {
            const drops = ['wood', 'rock', 'wood', 'rock', 'carrot', 'fish'];
            if (Math.random() < 0.75) {
                const drop = drops[Math.floor(Math.random() * drops.length)];
                this.pickups.add(new CollectibleItem(this, x, y, drop, 1));
            }
        });

        this.events.on('playerDamaged', (amount) => {
            if (this._invulnerable) return;
            this.stats.takeDamage(amount);
            this.player.flashHurt();
            this._setInvulnerable(1000);
            this.cameras.main.shake(120, 0.004);
        });

        // ── HUD ──────────────────────────────────────────────────────────────
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');

        // ── DICA INICIAL (scroll-factor 0 = fixa no ecrã) ───────────────────
        const hint = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 20,
            'WASD mover  ·  SHIFT correr  ·  ESPAÇO atacar  ·  E usar  ·  1-8 hotbar',
            { fontSize: '7px', fill: '#ffffcc', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);

        this.time.delayedCall(6000, () => {
            this.tweens.add({ targets: hint, alpha: 0, duration: 1200,
                onComplete: () => hint.destroy() });
        });
    }

    update(time, delta) {
        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time);
        this.goblins.getChildren().forEach(g => g.update(this.player, time));
    }

    // ── APANHAR ITEM ─────────────────────────────────────────────────────────
    _pickupItem(player, item) {
        const def   = ITEM_DB[item.itemId];
        const nome  = def ? def.name : item.itemId;
        const added = this.inventory.addItem(item.itemId, item.quantity);

        const cor = added ? '#ffffff' : '#ff8888';
        const msg = added ? `+${item.quantity} ${nome}` : 'Inventário cheio!';

        const txt = this.add.text(item.x, item.y - 16, msg, {
            fontSize: '9px', fill: cor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt, y: txt.y - 26, alpha: 0,
            duration: 850, onComplete: () => txt.destroy()
        });

        if (added) item.destroy();
    }

    // ── USAR ITEM (tecla E) ───────────────────────────────────────────────────
    _useSelectedItem() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;

        const effect = FOOD_VALUES[slot.itemId];
        if (!effect) return;

        if (effect.hunger) this.stats.eat(effect.hunger);
        if (effect.thirst) this.stats.drink(effect.thirst);
        if (effect.health) this.stats.heal(effect.health);

        this.inventory.removeItem(slot.itemId, 1);

        const def  = ITEM_DB[slot.itemId];
        const nome = def ? def.name : slot.itemId;
        const txt  = this.add.text(this.player.x, this.player.y - 28, `🍴 ${nome}`, {
            fontSize: '11px', fill: '#88ff88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt, y: txt.y - 28, alpha: 0,
            duration: 850, onComplete: () => txt.destroy()
        });
    }

    _setInvulnerable(ms) {
        this._invulnerable = true;
        this.time.delayedCall(ms, () => { this._invulnerable = false; });
    }
}
