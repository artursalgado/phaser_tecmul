import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';

// Itens espalhados pelo mapa no início do jogo
const SPAWN_ITEMS = [
    { x: 560, y: 420, itemId: 'wood',    qty: 3 },
    { x: 720, y: 440, itemId: 'rock',    qty: 2 },
    { x: 600, y: 540, itemId: 'carrot',  qty: 1 },
    { x: 700, y: 560, itemId: 'potato',  qty: 1 },
    { x: 540, y: 500, itemId: 'wheat',   qty: 1 },
    { x: 760, y: 500, itemId: 'fish',    qty: 1 },
    { x: 620, y: 410, itemId: 'egg',     qty: 1 },
    { x: 690, y: 390, itemId: 'axe',     qty: 1 },
    { x: 580, y: 390, itemId: 'pickaxe', qty: 1 },
    { x: 800, y: 420, itemId: 'water',   qty: 2 },
    { x: 840, y: 500, itemId: 'wood',    qty: 2 },
    { x: 520, y: 560, itemId: 'rock',    qty: 1 },
];

// Posições de spawn dos goblins (longe do jogador)
const GOBLIN_SPAWNS = [
    { x: 300, y: 300 },
    { x: 900, y: 300 },
    { x: 300, y: 700 },
    { x: 900, y: 700 },
    { x: 600, y: 200 },
];

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this._invulnerable = false; // cooldown de dano ao jogador
    }

    create() {
        //------------------------------------------------------------
        // TILEMAP
        //------------------------------------------------------------
        const mapa = this.make.tilemap({ key: 'ilha' });
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');

        const chao     = mapa.createLayer('chao',      tileset, 0, 0);
        const decoracao = mapa.createLayer('Decoracao', tileset, 0, 0);
        const colisao  = mapa.createLayer('colisao',   tileset, 0, 0);

        chao.setDepth(0);
        decoracao.setDepth(1);
        if (colisao) {
            colisao.setDepth(2);
            colisao.setCollisionByExclusion([-1]);
        }

        const mapW = mapa.widthInPixels;
        const mapH = mapa.heightInPixels;
        this.physics.world.setBounds(0, 0, mapW, mapH);

        //------------------------------------------------------------
        // SISTEMAS
        //------------------------------------------------------------
        this.inventory = new Inventory(8);
        this.stats = new PlayerStats();

        // Quando o jogador morre — vai para GameOver
        this.stats.on('died', () => {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene');
        });

        //------------------------------------------------------------
        // JOGADOR
        //------------------------------------------------------------
        this.player = new Player(this, 640, 480);

        if (colisao) {
            this.physics.add.collider(this.player, colisao);
        }

        //------------------------------------------------------------
        // CÂMERA
        //------------------------------------------------------------
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        //------------------------------------------------------------
        // CONTROLOS
        //------------------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // Teclas 1-8: selecionar slot da hotbar
        this.input.keyboard.on('keydown', (e) => {
            const n = parseInt(e.key, 10);
            if (!isNaN(n) && n >= 1 && n <= this.inventory.size) {
                this.inventory.selectSlot(n - 1);
            }
            // E: usar item selecionado (comer/beber)
            if (e.key === 'e' || e.key === 'E') this._useSelectedItem();
        });

        //------------------------------------------------------------
        // ITENS COLECIONÁVEIS
        //------------------------------------------------------------
        this.pickups = this.physics.add.group();
        SPAWN_ITEMS.forEach(s => {
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty));
        });
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        //------------------------------------------------------------
        // GOBLINS
        //------------------------------------------------------------
        this.goblins = this.physics.add.group();
        GOBLIN_SPAWNS.forEach(s => {
            const g = new Goblin(this, s.x, s.y);
            this.goblins.add(g);
        });

        // Evento: goblin morre → dropar item
        this.events.on('enemyDied', (x, y) => {
            if (Math.random() < 0.6) {
                const drop = Math.random() < 0.5 ? 'wood' : 'rock';
                const item = new CollectibleItem(this, x, y, drop, 1);
                this.pickups.add(item);
            }
        });

        // Evento: jogador recebe dano de goblin
        this.events.on('playerDamaged', (amount) => {
            if (this._invulnerable) return;
            this.stats.takeDamage(amount);
            this.player.flashHurt();
            this._setInvulnerable(1200);
        });

        //------------------------------------------------------------
        // HUD
        //------------------------------------------------------------
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');
    }

    update(time, delta) {
        // Atualiza stats de sobrevivência (fome, sede, energia)
        this.stats.update(delta);

        // Movimento do jogador
        this.player.update(this.cursors, this.wasd);

        // IA dos goblins
        this.goblins.getChildren().forEach(g => g.update(this.player, time));
    }

    //----------------------------------------------------------------
    // APANHAR ITEM
    //----------------------------------------------------------------
    _pickupItem(player, item) {
        const def = ITEM_DB[item.itemId];
        const nome = def ? def.name : item.itemId;
        const added = this.inventory.addItem(item.itemId, item.quantity);

        const cor = added ? '#ffffff' : '#ff8888';
        const msg = added ? `+${item.quantity} ${nome}` : `Inventário cheio!`;

        const texto = this.add.text(item.x, item.y - 16, msg, {
            fontSize: '12px', fill: cor, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: texto,
            y: texto.y - 24,
            alpha: 0,
            duration: 900,
            onComplete: () => texto.destroy()
        });

        if (added) item.destroy();
    }

    //----------------------------------------------------------------
    // USAR ITEM SELECIONADO (tecla E)
    //----------------------------------------------------------------
    _useSelectedItem() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;

        const foodValues = {
            carrot: { hunger: 20 },
            potato: { hunger: 25 },
            wheat:  { hunger: 10 },
            fish:   { hunger: 35, health: 5 },
            egg:    { hunger: 15, health: 5 },
            milk:   { thirst: 30, health: 5 },
            water:  { thirst: 40 },
        };

        const effect = foodValues[slot.itemId];
        if (!effect) return; // ferramentas/recursos não se comem

        if (effect.hunger) this.stats.eat(effect.hunger);
        if (effect.thirst) this.stats.drink(effect.thirst);
        if (effect.health) this.stats.heal(effect.health);

        this.inventory.removeItem(slot.itemId, 1);

        const def = ITEM_DB[slot.itemId];
        const nome = def ? def.name : slot.itemId;
        const texto = this.add.text(this.player.x, this.player.y - 24, `🍴 ${nome}`, {
            fontSize: '12px', fill: '#88ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: texto,
            y: texto.y - 24,
            alpha: 0,
            duration: 900,
            onComplete: () => texto.destroy()
        });
    }

    //----------------------------------------------------------------
    // INVULNERABILIDADE TEMPORÁRIA
    //----------------------------------------------------------------
    _setInvulnerable(ms) {
        this._invulnerable = true;
        this.time.delayedCall(ms, () => { this._invulnerable = false; });
    }
}
