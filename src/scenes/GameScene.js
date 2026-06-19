import Inventory, { ITEM_DB } from '../systems/Inventory.js';
import PlayerStats from '../systems/PlayerStats.js';
import Player from '../objects/Player.js';
import CollectibleItem from '../objects/CollectibleItem.js';
import Goblin from '../objects/Goblin.js';
import Skeleton from '../objects/Skeleton.js';
import Tree from '../objects/Tree.js';
import QuestManager, { RAFT_PARTS } from '../systems/QuestManager.js';
import BossSkeleton from '../objects/BossSkeleton.js';
import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';

// Fallback (usado só se o mapa não tiver object layer "spawns").
// Offsets relativos ao centro do mapa, em pixels.
const ITEM_OFFSETS = [
    { dx: -64,  dy: -48, itemId: 'wood',    qty: 3 },
    { dx:  72,  dy: -32, itemId: 'rock',    qty: 2 },
    { dx: -80,  dy:  56, itemId: 'carrot',  qty: 2 },
    { dx:  80,  dy:  64, itemId: 'potato',  qty: 2 },
    { dx: -32,  dy:  80, itemId: 'wheat',   qty: 2 },
    { dx:  48,  dy: -80, itemId: 'fish',    qty: 2 },
    { dx: -48,  dy: -88, itemId: 'egg',     qty: 2 },
    { dx:  32,  dy:  32, itemId: 'axe',     qty: 1 },
    { dx: -32,  dy:  32, itemId: 'pickaxe', qty: 1 },
    { dx: 120,  dy:   0, itemId: 'water',   qty: 3 },
    { dx: -120, dy:   0, itemId: 'water',   qty: 2 },
    { dx:   0,  dy:-120, itemId: 'wood',    qty: 2 },
    { dx:   0,  dy: 120, itemId: 'rock',    qty: 3 },
    { dx:  48,  dy: -48, itemId: 'sword',   qty: 1 },
];

const ENEMY_OFFSETS = [
    { dx: -200, dy: -140 }, { dx: 200, dy: -140 },
    { dx: -200, dy:  140 }, { dx: 200, dy:  140 },
    { dx:    0, dy: -200 }, { dx: -250, dy: 0 }, { dx: 250, dy: 0 },
];

// Offsets das arvores cortaveis, relativos ao POI "ruina" (zona de floresta).
// As arvores sao sprites extra colocados por cima do mapa, nao fazem parte
// dos tiles do Tiled -- mantem a mecanica de cortar com ESPACO (ver Tree.js).
const TREE_OFFSETS_FROM_RUINA = [
    { dx: -40, dy: -20 },
    { dx:  10, dy: -50 },
    { dx:  50, dy:  10 },
];

// Baus de destrocos com corda -- "praia oposta" (costa oeste, do lado contrario
// a doca, que fica a leste). O mapa v7 nao tem NENHUM pickup de rope -- sem isto
// e' impossivel completar a jangada. Posicoes verificadas em areas de areia (chao
// gid 66) caminhaveis (colisao 0, sem decoracao/objetos por cima).
const ROPE_CRATE_SPAWNS = [
    { x: 536, y: 440 },
    { x: 424, y: 760 },
    { x: 488, y: 600 },
];

const FOOD_VALUES = {
    carrot: { hunger: 20, energy: 8 },
    potato: { hunger: 28, energy: 10 },
    wheat:  { hunger: 12, energy: 5 },
    fish:   { hunger: 35, health: 8, energy: 15 },
    egg:    { hunger: 18, health: 5, energy: 8 },
    milk:   { thirst: 30, health: 5, energy: 10 },
    water:  { thirst: 45, energy: 12 },
};


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this._invulnerable = false;
        this._elapsedSec   = 0;
        this._score        = 0;
        this._killCount    = 0;
        this._paused       = false;
        this._enemiesUnlocked = false; // inimigos só aparecem quando o jogador apanha arma ou 10 madeiras
        this._pendingEnemySpawns = []; // spawns guardados até ao desbloqueio
    }

    create() {
        SoundManager.resume();
        SoundManager.startBgMusic();

        this._elapsedSec   = 0;
        this._score        = 0;
        this._killCount    = 0;
        this._paused       = false;
        this._hasExtraLife = true;
        this._raftReady    = false;

        const { mapW, mapH } = this._setupTilemap();
        if (!mapW) return;

        const spawns = this._readSpawns(this._mapa, mapW, mapH);
        this._spawnPos = { x: spawns.player.x, y: spawns.player.y };

        this._setupSystems();

        this.player = new Player(this, spawns.player.x, spawns.player.y);
        if (this._colisao) this.physics.add.collider(this.player, this._colisao);
        this.inventory.addItem('book', 1);

        this._setupCamera(mapW, mapH);
        this._setupControls();
        this._setupWorld(spawns);
        this._setupEvents();
        this._setupHUD();
    }

    _setupTilemap() {
        const mapa    = this.make.tilemap({ key: 'ilha' });
        this._mapa    = mapa;
        const tileset = mapa.addTilesetImage('punyworld-overworld', 'punyworld');

        if (!tileset) {
            console.error('[GameScene] ERRO: tileset "punyworld-overworld" nao encontrado no JSON!');
            return { mapW: 0, mapH: 0 };
        }

        const chao       = mapa.createLayer('chao',       tileset, 0, 0);
        const transicoes = mapa.createLayer('transicoes', tileset, 0, 0);
        const decoracao  = mapa.createLayer('decoracao',  tileset, 0, 0);
        const colisao    = mapa.createLayer('colisao',    tileset, 0, 0);
        const objetos    = mapa.createLayer('objetos',    tileset, 0, 0);
        const acima      = mapa.createLayer('acima',      tileset, 0, 0);
        chao?.setDepth(0);
        transicoes?.setDepth(1);
        decoracao?.setDepth(2);
        objetos?.setDepth(4);
        acima?.setDepth(8);
        if (colisao) {
            colisao.setDepth(2);
            colisao.setCollisionByExclusion([-1, 0]);
            colisao.setVisible(false);

            // ── Remover colisão das pontes sobre água ────────────────────────
            // Apenas os GIDs 731 e 849 (tiles de ponte) sobrepõem água.
            // GID 114 é decoração genérica espalhada por TODO o mapa
            // (relva/areia/etc, 4493 células) e NÃO indica passagem —
            // incluí-lo abria um buraco enorme no meio do oceano.
            const PASSAGEM_GIDS = new Set([731, 849]);
            const FLIP_MASK = 0xE0000000;
            if (decoracao) {
                decoracao.layer.data.forEach((row, ty) => {
                    row.forEach((decTile, tx) => {
                        if (!decTile || decTile.index <= 0) return;
                        const gid = decTile.index & ~FLIP_MASK;
                        if (PASSAGEM_GIDS.has(gid)) {
                            const colTile = colisao.getTileAt(tx, ty);
                            if (colTile) colTile.setCollision(false, false, false, false);
                        }
                    });
                });
            }
        }

        const mapW = mapa.widthInPixels;
        const mapH = mapa.heightInPixels;
        this._mapW = mapW;
        this._mapH = mapH;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this._colisao = colisao;

        return { mapW, mapH };
    }

    _setupSystems() {
        this.inventory = new Inventory(24);
        this.stats     = new PlayerStats();
        this.quest     = new QuestManager();
        this.quest.init(this);

        this.stats.on('died', () => {
            this.quest.applyDeathPenalty();
            if (this._hasExtraLife) {
                this._hasExtraLife = false;
                this._respawnPlayer();
            } else {
                this.scene.stop('HUDScene');
                this.scene.start('GameOverScene', {
                    score: this._score,
                    kills: this._killCount,
                    time:  Math.floor(this._elapsedSec)
                });
            }
        });
        this.quest.on('raftComplete', () => {
            this._raftReady = true;
            if (this.raftLabel) {
                this.raftLabel.setText(I18n.lang === 'en' ? 'ESCAPE [E]' : 'FUGIR [E]');
                this.raftLabel.setColor('#88ff88');
            }
        });
    }

    _setupCamera(mapW, mapH) {
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#3a8fa8');
    }

    _setupControls() {
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
            if (e.key === 'e' || e.key === 'E') {
                if (this._raftReady && this._inRaftZone()) this._startEscapeCutscene();
                else this._useSelectedItem();
            }
            if (e.key === 'f' || e.key === 'F') this._tryBuildRaft();
            if (e.key === 'q' || e.key === 'Q') this.events.emit('toggleQuestLog');
            if (e.key === 'i' || e.key === 'I') this._toggleInventory();
            if (e.key === 'Escape') {
                const hud = this.scene.get('HUDScene');
                if (!hud?._bookOpen) this._togglePause();
            }
        });
    }

    _setupWorld(spawns) {
        this.pickups = this.physics.add.group();
        spawns.items.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty))
        );
        ROPE_CRATE_SPAWNS.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, 'rope', 2))
        );
        this.physics.add.overlap(this.player, this.pickups, this._pickupItem, null, this);

        this.goblins = this.physics.add.group();
        this._pendingEnemySpawns = spawns.enemies.slice();
        if (this._colisao) this.physics.add.collider(this.goblins, this._colisao);
        this.physics.add.collider(this.goblins, this.goblins);

        this.trees = this.add.group();
        const treeBase = spawns.poi.ruina || { x: this._mapW / 2, y: this._mapH / 2 };
        TREE_OFFSETS_FROM_RUINA.forEach(o =>
            this.trees.add(new Tree(this, treeBase.x + o.dx, treeBase.y + o.dy))
        );

        const docaPos = spawns.poi.doca || { x: this._mapW / 2 + 80, y: this._mapH / 2 + 40 };
        this.raftZone = { x: docaPos.x, y: docaPos.y, radius: 36 };
        this.add.image(this.raftZone.x, this.raftZone.y, 'spr_deco_coracle_land')
            .setDepth(3).setScale(0.7);
        this.raftMarker = this.add.circle(
            this.raftZone.x, this.raftZone.y, this.raftZone.radius, 0xffdd66, 0.18
        ).setDepth(1);
        this.raftLabel = this.add.text(
            this.raftZone.x, this.raftZone.y - this.raftZone.radius - 8, 'JANGADA [F]',
            { fontSize: '10px', fill: '#ffdd66', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(9);
    }

    _setupEvents() {
        this.events.off('enemyDied');
        this.events.off('playerDamaged');
        this.events.off('playerAttack');
        this.events.off('enemyHurt');
        this.events.off('playerStep');

        this.events.on('enemyDied', (x, y) => {
            this._killCount++;
            this._score += 100;
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
            SoundManager.play('hurt');
            this._setInvulnerable(1000);
            this.cameras.main.shake(120, 0.006);
        });
        this.events.on('playerAttack', () => SoundManager.play('attack'));
        this.events.on('enemyHurt',    () => SoundManager.play('goblin_hurt'));
        this.events.on('playerStep',   () => SoundManager.play('step'));
    }

    _setupHUD() {
        this.scene.launch('HUDScene');
        this.scene.bringToTop('HUDScene');

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

    // ── Ler spawns + POIs do object layer "spawns" (fallback: centro + offsets) ─
    _readSpawns(mapa, mapW, mapH) {
        const cx = mapW / 2, cy = mapH / 2;
        const layer = mapa.getObjectLayer && mapa.getObjectLayer('spawns');
        if (!layer || !layer.objects || !layer.objects.length) {
            return {
                player:  { x: cx, y: cy },
                items:   ITEM_OFFSETS.map(o => ({ x: cx + o.dx, y: cy + o.dy,
                                                  itemId: o.itemId, qty: o.qty })),
                enemies: ENEMY_OFFSETS.map(o => ({ x: cx + o.dx, y: cy + o.dy,
                                                   kind: 'goblin', tier: 1 })),
                poi: {},
            };
        }
        const prop = (o, k) => {
            const p = (o.properties || []).find(pp => pp.name === k);
            return p ? p.value : undefined;
        };
        const res = { player: { x: cx, y: cy }, items: [], enemies: [], poi: {} };
        for (const o of layer.objects) {
            const name = o.name || o.type;
            if (name === 'player_start') {
                res.player = { x: o.x, y: o.y };
            } else if (name === 'item') {
                res.items.push({ x: o.x, y: o.y,
                                 itemId: prop(o, 'itemId') || 'wood',
                                 qty: parseInt(prop(o, 'qty') || '1', 10) });
            } else if (name === 'enemy') {
                res.enemies.push({ x: o.x, y: o.y,
                                   kind: prop(o, 'kind') || 'goblin',
                                   tier: parseInt(prop(o, 'tier') || '1', 10) });
            } else if (name === 'poi') {
                const label = prop(o, 'label');
                if (label) res.poi[label] = { x: o.x, y: o.y };
            }
        }
        return res;
    }

    update(time, delta) {
        if (this._paused) return;

        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time, delta);
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

    // ── Inventário ────────────────────────────────────────────────────────
    _toggleInventory() {
        if (this._paused) return;
        this._paused = true;
        this.scene.pause('GameScene');
        this.scene.launch('InventoryScene');
        this.scene.get('InventoryScene').events.once('shutdown', () => {
            this._paused = false;
            this.scene.resume('GameScene');
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

    // ── Spawn boss ──────────────────────────────────────────────────────────
    _spawnBoss(x, y) {
        const b = new BossSkeleton(this, x, y);
        this.goblins.add(b);
        if (this._colisao) this.physics.add.collider(b, this._colisao);
        return b;
    }

    // ── Apanhar item ──────────────────────────────────────────────────────
    _pickupItem(player, item) {
        const def   = ITEM_DB[item.itemId];
        const nome  = I18n.t(`items.${item.itemId}`) || (def ? def.name : item.itemId);
        const added = this.inventory.addItem(item.itemId, item.quantity);
        if (added) {
            SoundManager.play('pickup');
            this._score += 10;
            // Verificar condições de desbloqueio de inimigos
            this._tryUnlockEnemies(item.itemId);
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

    // ── Desbloquear inimigos (chamado após cada pickup) ──────────────────
    _tryUnlockEnemies(lastItemId) {
        if (this._enemiesUnlocked) return;

        const WEAPONS = ['axe', 'pickaxe', 'sword', 'hammer'];
        const hasWeapon = WEAPONS.includes(lastItemId);
        const woodCount = this.quest
            ? (this.quest.getProgress().find(p => p.id === 'wood')?.current ?? 0)
            : (this.inventory.slots.reduce((sum, s) => s && s.itemId === 'wood' ? sum + s.qty : sum, 0));

        if (!hasWeapon && woodCount < 10) return;

        // ── Desbloquear! ──────────────────────────────────────────────────
        this._enemiesUnlocked = true;

        // Mensagem de aviso na tela
        const W = this.scale.width, H = this.scale.height;
        const reason = hasWeapon ? I18n.t('hud.enemy_danger') : I18n.t('hud.enemy_attention');
        const warn = this.add.text(W / 2, H / 2 - 60, reason, {
            fontFamily: 'Georgia, serif', fontSize: '18px',
            fill: '#ff4444', fontStyle: 'bold italic',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
        this.tweens.add({
            targets: warn, alpha: 1, duration: 400,
            yoyo: true, hold: 1800,
            onComplete: () => warn.destroy()
        });

        // Camera shake suave
        this.cameras.main.shake(300, 0.004);

        // Criar todos os inimigos pendentes com pequeno delay
        this.time.delayedCall(600, () => {
            this._pendingEnemySpawns.forEach(s => {
                if (s.kind === 'boss')         this._spawnBoss(s.x, s.y);
                else if (s.kind === 'skeleton') this._spawnSkeleton(s.x, s.y);
                else                            this._spawnGoblin(s.x, s.y, s.tier);
            });
            this._pendingEnemySpawns = [];
        });
    }

    // ── Usar item selecionado ─────────────────────────────────────────────
    _useSelectedItem() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;
        if (slot.itemId === 'book') {
            this.events.emit('openBook');
            return;
        }
        const effect = FOOD_VALUES[slot.itemId];
        if (!effect) return;
        if (effect.hunger) this.stats.eat(effect.hunger);
        if (effect.thirst) this.stats.drink(effect.thirst);
        if (effect.health) this.stats.heal(effect.health);
        if (effect.energy) this.stats.rest(effect.energy);
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

    // Esta o jogador dentro do raio da zona da jangada (doca)?
    _inRaftZone() {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.raftZone.x, this.raftZone.y);
        return d <= this.raftZone.radius;
    }

    // Tenta entregar os recursos da jangada (wood/rope/sail) quando o jogador
    // esta dentro da zona da jangada (na doca) e preme F.
    _tryBuildRaft() {
        if (!this._inRaftZone()) {
            return; // fora da zona -- nao faz nada, sem mensagem de erro
        }

        let entregouAlgo = false;
        RAFT_PARTS.forEach(part => {
            const tenho = this.inventory.getQuantity(part.id);
            if (tenho > 0) {
                const aceito = this.quest.deliver(part.id, tenho);
                if (aceito > 0) {
                    this.inventory.removeItem(part.id, aceito);
                    entregouAlgo = true;
                }
            }
        });

        const msg = entregouAlgo
            ? (I18n.lang === 'en' ? 'Resources delivered!' : 'Recursos entregues!')
            : (I18n.lang === 'en' ? 'Nothing to deliver.'  : 'Nada para entregar.');
        const txt = this.add.text(this.raftZone.x, this.raftZone.y, msg, {
            fontSize: '11px', fill: entregouAlgo ? '#88ff88' : '#ffaa88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0,
            duration: 900, onComplete: () => txt.destroy() });
        if (entregouAlgo) SoundManager.play('pickup');
    }

    _setInvulnerable(ms) {
        this._invulnerable = true;
        this.time.delayedCall(ms, () => { this._invulnerable = false; });
    }

    // ── Respawn (1 vida extra por run) ───────────────────────────────────────
    // Chamado na 1a morte: volta para a praia inicial com stats cheios, mas
    // ja perdeu 90% dos recursos da jangada (QuestManager.applyDeathPenalty,
    // chamado antes disto). A 2a morte vai direto a GameOverScene.
    _respawnPlayer() {
        this.stats.reset();
        this.player.setPosition(this._spawnPos.x, this._spawnPos.y);
        this.player.body.setVelocity(0);
        this.cameras.main.flash(400, 0, 0, 0);
        this._setInvulnerable(1500);

        const msg = I18n.lang === 'en'
            ? 'You wake up on the beach... (lost most resources)'
            : 'Acordas de novo na praia... (perdeste a maioria dos recursos)';
        const txt = this.add.text(this.player.x, this.player.y - 40, msg, {
            fontSize: '11px', fill: '#ffaa88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0,
            duration: 2200, onComplete: () => txt.destroy() });
    }

    // ── Cutscene de fuga (E dentro da zona, com a jangada completa) ──────────
    // Mini-cutscene de ~7s antes da VictoryScene: tira o controlo ao jogador,
    // faz a camara aproximar-se da jangada e funde para branco.
    _startEscapeCutscene() {
        if (this._escaping) return;
        this._escaping = true;
        this._paused    = true; // bloqueia update() do jogador/inimigos
        this.player.body.setVelocity(0);

        this.scene.setVisible(false, 'HUDScene');
        SoundManager.play('victory');

        const msg = I18n.t('hud.sailing');
        this.add.text(this.scale.width / 2, 40, msg, {
            fontSize: '16px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        this.cameras.main.stopFollow();
        this.cameras.main.pan(this.raftZone.x, this.raftZone.y, 2500, 'Sine.easeInOut');
        this.cameras.main.zoomTo(3, 2500);

        this.time.delayedCall(6500, () => {
            this.cameras.main.fadeOut(1200, 0, 0, 0);
        });
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('HUDScene');
            this.scene.start('VictoryScene', {
                score: this._score,
                kills: this._killCount,
                time:  Math.floor(this._elapsedSec)
            });
        });
    }

    // Getters públicos para o HUD
    get elapsedSec()  { return this._elapsedSec; }
    get score()       { return this._score; }
    get killCount()   { return this._killCount; }
}
