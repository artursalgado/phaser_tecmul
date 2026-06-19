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
import SaveManager from '../systems/SaveManager.js';

const PONTOS_SPAWN = [
    { x: 400,  y: 100  }, { x: 1200, y: 100  }, // Norte
    { x: 400,  y: 1500 }, { x: 1200, y: 1500 }, // Sul
    { x: 100,  y: 400  }, { x: 100,  y: 1100 }, // Oeste
    { x: 1500, y: 400  }, { x: 1500, y: 1100 }  // Este
];

// Fallback se o mapa nao tiver spawns configurados
const OFFSETS_ITENS = [
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

const OFFSETS_INIMIGOS = [
    { dx: -200, dy: -140 }, { dx: 200, dy: -140 },
    { dx: -200, dy:  140 }, { dx: 200, dy:  140 },
    { dx:    0, dy: -200 }, { dx: -250, dy: 0 }, { dx: 250, dy: 0 },
];

const OFFSETS_ARVORES = [
    { dx: -40, dy: -20 },
    { dx:  10, dy: -50 },
    { dx:  50, dy:  10 },
];

const SPAWNS_CAIXAS_CORDA = [
    { x: 536, y: 440 },
    { x: 424, y: 760 },
    { x: 488, y: 600 },
];

const VALORES_ALIMENTOS = {
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
        
        // Atributos de estado do jogo
        this.invulnerable = false;
        this.elapsedSec = 0;
        this.score = 0;
        this.killCount = 0;
        this.paused = false;
        
        this.enemiesUnlocked = false;
        this.pendingEnemySpawns = [];
        this.waveNumber = 0;
    }

    create(data) {
        SoundManager.resume();
        SoundManager.startBgMusic();

        this.elapsedSec = 0;
        this.score = 0;
        this.killCount = 0;
        this.paused = false;
        this.hasExtraLife = true;
        this.raftReady = false;
        this.autosaveTimer = 0;
        this.loadedPlayerPos = null;
        this.waveTimer = 75;
        this.waveWarningShown = false;
        this.waveNumber = 0;

        const dim = this.configurarMapa();
        if (!dim.mapW) return;

        const spawns = this.lerPontosSpawns(this.mapa, dim.mapW, dim.mapH);
        this.spawnPos = { x: spawns.player.x, y: spawns.player.y };

        this.configurarSistemas();

        // Carrega o jogo salvo
        const carregarSave = data && data.loadSave;
        if (carregarSave && SaveManager.hasSave()) {
            const dadosSave = SaveManager.load();
            if (dadosSave) {
                this.score = dadosSave.score ?? 0;
                this.killCount = dadosSave.killCount ?? 0;
                this.elapsedSec = dadosSave.elapsedSec ?? 0;
                this.hasExtraLife = dadosSave.hasExtraLife !== false;
                this.enemiesUnlocked = !!dadosSave.enemiesUnlocked;
                this.waveTimer = dadosSave.waveTimer ?? 75;
                this.waveWarningShown = !!dadosSave.waveWarningShown;
                this.waveNumber = dadosSave.waveNumber ?? 0;

                if (dadosSave.inventory) this.inventory.fromJSON(dadosSave.inventory);
                if (dadosSave.stats) this.stats.fromJSON(dadosSave.stats);
                if (dadosSave.quest) this.quest.fromJSON(dadosSave.quest);

                if (dadosSave.playerPosition) {
                    this.loadedPlayerPos = dadosSave.playerPosition;
                }
            }
        }

        const startX = this.loadedPlayerPos ? this.loadedPlayerPos.x : spawns.player.x;
        const startY = this.loadedPlayerPos ? this.loadedPlayerPos.y : spawns.player.y;

        this.player = new Player(this, startX, startY);
        if (this.colisao) {
            this.physics.add.collider(this.player, this.colisao);
        }

        // Se for jogo novo, da o diario
        if (!this.loadedPlayerPos) {
            this.inventory.addItem('book', 1);
        }

        this.configurarCamera(dim.mapW, dim.mapH);
        this.configurarControlos();
        this.configurarMundo(spawns);
        this.configurarEventos();
        this.configurarHUD();

        if (this.quest.isComplete()) {
            this.raftReady = true;
            if (this.raftLabel) {
                this.raftLabel.setText(I18n.lang === 'en' ? 'ESCAPE [E]' : 'FUGIR [E]');
                this.raftLabel.setColor('#88ff88');
            }
        }

        if (this.stats.dead) {
            this.scene.stop('HUDScene');
            this.scene.start('GameOverScene', {
                score: this.score,
                kills: this.killCount,
                time:  Math.floor(this.elapsedSec)
            });
            return;
        }
    }

    // Configura o mapa e as camadas
    configurarMapa() {
        const mapa = this.make.tilemap({ key: 'ilha' });
        this.mapa = mapa;
        const tileset = mapa.addTilesetImage('punyworld-overworld', 'punyworld');

        if (!tileset) {
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

            // Permite passagem livre nas pontes
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
        this.mapW = mapW;
        this.mapH = mapH;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.colisao = colisao;

        return { mapW, mapH };
    }

    // Inicializa inventario, status e progresso da quest
    configurarSistemas() {
        this.inventory = new Inventory(24);
        this.stats     = new PlayerStats();
        this.quest     = new QuestManager();
        this.quest.init(this);

        // Controla morte do jogador
        this.stats.on('died', () => {
            this.quest.applyDeathPenalty();
            if (this.hasExtraLife) {
                this.hasExtraLife = false;
                this.renascerJogador();
            } else {
                SaveManager.save(this);
                this.scene.stop('HUDScene');
                this.scene.start('GameOverScene', {
                    score: this.score,
                    kills: this.killCount,
                    time:  Math.floor(this.elapsedSec)
                });
            }
        });
        
        this.quest.on('raftComplete', () => {
            this.raftReady = true;
            if (this.raftLabel) {
                this.raftLabel.setText(I18n.lang === 'en' ? 'ESCAPE [E]' : 'FUGIR [E]');
                this.raftLabel.setColor('#88ff88');
            }
        });
    }

    configurarCamera(mapW, mapH) {
        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#3a8fa8');
    }

    configurarControlos() {
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
            if (e.key === 'e' || e.key === 'E') {
                if (this.raftReady && this.estaNaZonaJangada()) {
                    this.iniciarCutsceneFuga();
                } else {
                    this.usarItemSelecionado();
                }
            }
            if (e.key === 'f' || e.key === 'F') this.tentarConstruirJangada();
            if (e.key === 'q' || e.key === 'Q') this.events.emit('toggleQuestLog');
            if (e.key === 'i' || e.key === 'I') this.alternarInventario();
            if (e.key === 'Escape') {
                const hud = this.scene.get('HUDScene');
                if (!hud?.bookOpen) this.alternarPausa();
            }
        });
    }

    configurarMundo(spawns) {
        // Recolhiveis
        this.pickups = this.physics.add.group();
        spawns.items.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty))
        );
        SPAWNS_CAIXAS_CORDA.forEach(s =>
            this.pickups.add(new CollectibleItem(this, s.x, s.y, 'rope', 1))
        );
        this.physics.add.overlap(this.player, this.pickups, this.apanharItem, null, this);

        // Inimigos
        this.goblins = this.physics.add.group();
        this.pendingEnemySpawns = spawns.enemies.slice();
        if (this.colisao) {
            this.physics.add.collider(this.goblins, this.colisao);
        }
        this.physics.add.collider(this.goblins, this.goblins);

        // Cria os inimigos se ja estiverem desbloqueados
        if (this.enemiesUnlocked) {
            let delay = 0;
            this.pendingEnemySpawns.forEach(s => {
                this.time.delayedCall(delay, () => {
                    if (s.kind === 'boss')         this.criarBoss(s.x, s.y);
                    else if (s.kind === 'skeleton') this.criarEsqueleto(s.x, s.y);
                    else                            this.criarGoblin(s.x, s.y, s.tier);
                });
                delay += 500;
            });
            this.pendingEnemySpawns = [];
        }

        // Arvores cortaveis
        this.trees = this.add.group();
        const treeBase = spawns.poi.ruina || { x: this.mapW / 2, y: this.mapH / 2 };
        OFFSETS_ARVORES.forEach(o =>
            this.trees.add(new Tree(this, treeBase.x + o.dx, treeBase.y + o.dy))
        );

        // Zona da jangada
        const docaPos = spawns.poi.doca || { x: this.mapW / 2 + 80, y: this.mapH / 2 + 40 };
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

        // Overlay do ciclo dia/noite
        this.prevPhase = null;
        this.lightOverlay = this.add.rectangle(
            0, 0, this.scale.width, this.scale.height, 0x1a1a44, 0
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    }

    configurarEventos() {
        this.events.off('enemyDied');
        this.events.off('playerDamaged');
        this.events.off('playerAttack');
        this.events.off('enemyHurt');
        this.events.off('playerStep');

        this.events.on('enemyDied', (x, y) => {
            this.killCount++;
            this.score += 100;
            const dropOptions = ['wood','rock','wood','rock','carrot','fish','egg'];
            if (Math.random() < 0.8) {
                const drop = dropOptions[Phaser.Math.Between(0, dropOptions.length-1)];
                this.pickups.add(new CollectibleItem(this, x, y, drop, 1));
            }
        });
        
        this.events.on('playerDamaged', (amount) => {
            if (this.invulnerable) return;
            this.stats.takeDamage(amount);
            this.player.flashHurt();
            SoundManager.play('hurt');
            this.definirInvulnerabilidade(1000);
            this.cameras.main.shake(120, 0.006);
        });
        
        this.events.on('playerAttack', () => SoundManager.play('attack'));
        this.events.on('enemyHurt',    () => SoundManager.play('goblin_hurt'));
        this.events.on('playerStep',   () => SoundManager.play('step'));
    }

    configurarHUD() {
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

    lerPontosSpawns(mapa, mapW, mapH) {
        const cx = mapW / 2, cy = mapH / 2;
        const layer = mapa.getObjectLayer && mapa.getObjectLayer('spawns');
        if (!layer || !layer.objects || !layer.objects.length) {
            return {
                player:  { x: cx, y: cy },
                items:   OFFSETS_ITENS.map(o => ({ x: cx + o.dx, y: cy + o.dy, itemId: o.itemId, qty: o.qty })),
                enemies: OFFSETS_INIMIGOS.map(o => ({ x: cx + o.dx, y: cy + o.dy, kind: 'goblin', tier: 1 })),
                poi: {},
            };
        }
        
        const obterProp = (o, k) => {
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
                                 itemId: obterProp(o, 'itemId') || 'wood',
                                 qty: parseInt(obterProp(o, 'qty') || '1', 10) });
            } else if (name === 'enemy') {
                res.enemies.push({ x: o.x, y: o.y,
                                   kind: obterProp(o, 'kind') || 'goblin',
                                   tier: parseInt(obterProp(o, 'tier') || '1', 10) });
            } else if (name === 'poi') {
                const label = obterProp(o, 'label');
                if (label) res.poi[label] = { x: o.x, y: o.y };
            }
        }
        return res;
    }

    update(time, delta) {
        if (this.paused) return;

        this.stats.update(delta);
        this.player.update(this.cursors, this.wasd, time, delta);
        this.goblins.getChildren().forEach(g => g.update(this.player, time, delta));
        this.elapsedSec += delta / 1000;

        this.atualizarLuzDiaNoite();

        this.autosaveTimer += delta / 1000;
        if (this.autosaveTimer >= 30) {
            this.autosaveTimer = 0;
            SaveManager.save(this);
        }

        if (this.enemiesUnlocked) {
            this.waveTimer -= delta / 1000;

            if (this.waveTimer <= 5 && !this.waveWarningShown) {
                this.waveWarningShown = true;
                this.mostrarAvisoVaga();
            }

            if (this.waveTimer <= 0) {
                this.waveTimer = 75;
                this.waveWarningShown = false;
                this.iniciarVagaInimigos();
            }
        }
    }

    alternarPausa() {
        if (this.paused) return;
        this.paused = true;
        SoundManager.play('pause');
        SaveManager.save(this);
        
        this.scene.pause('GameScene');
        this.scene.launch('PauseScene');
        this.scene.get('PauseScene').events.once('shutdown', () => {
            this.paused = false;
        });
    }

    alternarInventario() {
        if (this.paused) return;
        this.paused = true;
        this.scene.pause('GameScene');
        this.scene.launch('InventoryScene');
        this.scene.get('InventoryScene').events.once('shutdown', () => {
            this.paused = false;
            this.scene.resume('GameScene');
        });
    }

    criarGoblin(x, y, tier = 1) {
        let finalTier = tier;
        if (this.isNight) {
            finalTier = Math.min(3, tier + 1);
        }
        const g = new Goblin(this, x, y, finalTier);
        this.goblins.add(g);
        if (this.colisao) {
            this.physics.add.collider(g, this.colisao);
        }
        return g;
    }

    criarEsqueleto(x, y) {
        const s = new Skeleton(this, x, y);
        this.goblins.add(s);
        if (this.colisao) {
            this.physics.add.collider(s, this.colisao);
        }
        return s;
    }

    criarBoss(x, y) {
        const b = new BossSkeleton(this, x, y);
        this.goblins.add(b);
        if (this.colisao) {
            this.physics.add.collider(b, this.colisao);
        }
        return b;
    }

    apanharItem(player, item) {
        const def = ITEM_DB[item.itemId];
        const nome = I18n.t(`items.${item.itemId}`) || (def ? def.name : item.itemId);
        const adicionou = this.inventory.addItem(item.itemId, item.quantity);
        
        if (adicionou) {
            SoundManager.play('pickup');
            this.score += 10;
            this.tentarDesbloquearInimigos(item.itemId);
        }
        
        const txt = this.add.text(item.x, item.y - 20,
            adicionou ? `+${item.quantity} ${nome}` : I18n.t('hud.inventory_full'),
            { fontSize: '10px', fill: adicionou ? '#ffffff' : '#ff8888',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(20);
        
        this.tweens.add({ targets: txt, y: txt.y - 28, alpha: 0,
            duration: 900, onComplete: () => txt.destroy() });
            
        if (adicionou) {
            item.destroy();
        }
    }

    tentarDesbloquearInimigos(lastItemId) {
        if (this.enemiesUnlocked) return;

        const ARMAS = ['axe', 'pickaxe', 'sword', 'hammer'];
        const temArma = ARMAS.includes(lastItemId);
        const totalMadeiras = this.quest
            ? (this.quest.getProgress().find(p => p.id === 'wood')?.current ?? 0)
            : (this.inventory.slots.reduce((sum, s) => s && s.itemId === 'wood' ? sum + s.qty : sum, 0));

        if (!temArma && totalMadeiras < 10) return;

        this.enemiesUnlocked = true;

        const W = this.scale.width, H = this.scale.height;
        const motivo = temArma ? I18n.t('hud.enemy_danger') : I18n.t('hud.enemy_attention');
        const warn = this.add.text(W / 2, H / 2 - 60, motivo, {
            fontFamily: 'Georgia, serif', fontSize: '18px',
            fill: '#ff4444', fontStyle: 'bold italic',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
        
        this.tweens.add({
            targets: warn, alpha: 1, duration: 400,
            yoyo: true, hold: 1800,
            onComplete: () => warn.destroy()
        });

        this.cameras.main.shake(300, 0.004);

        this.time.delayedCall(600, () => {
            let delay = 0;
            this.pendingEnemySpawns.forEach(s => {
                this.time.delayedCall(delay, () => {
                    if (s.kind === 'boss')         this.criarBoss(s.x, s.y);
                    else if (s.kind === 'skeleton') this.criarEsqueleto(s.x, s.y);
                    else                            this.criarGoblin(s.x, s.y, s.tier);
                });
                delay += 500;
            });
            this.pendingEnemySpawns = [];
        });
    }

    usarItemSelecionado() {
        const slot = this.inventory.getSelectedItem();
        if (!slot) return;
        if (slot.itemId === 'book') {
            this.events.emit('openBook');
            return;
        }
        
        const efeito = VALORES_ALIMENTOS[slot.itemId];
        if (!efeito) return;
        
        if (efeito.hunger) this.stats.eat(efeito.hunger);
        if (efeito.thirst) this.stats.drink(efeito.thirst);
        if (efeito.health) this.stats.heal(efeito.health);
        if (efeito.energy) this.stats.rest(efeito.energy);
        
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

    estaNaZonaJangada() {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.raftZone.x, this.raftZone.y);
        return d <= this.raftZone.radius;
    }

    tentarConstruirJangada() {
        if (!this.estaNaZonaJangada()) {
            return;
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
            
        if (entregouAlgo) {
            SoundManager.play('pickup');
        }
    }

    definirInvulnerabilidade(ms) {
        this.invulnerable = true;
        this.time.delayedCall(ms, () => { this.invulnerable = false; });
    }

    renascerJogador() {
        this.stats.reset();
        this.player.setPosition(this.spawnPos.x, this.spawnPos.y);
        this.player.body.setVelocity(0);
        this.cameras.main.flash(400, 0, 0, 0);
        this.definirInvulnerabilidade(1500);

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

    iniciarCutsceneFuga() {
        if (this.escaping) return;
        this.escaping = true;
        this.paused = true;
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
                score: this.score,
                kills: this.killCount,
                time:  Math.floor(this.elapsedSec)
            });
        });
    }

    // Retorna verdadeiro se for noite no jogo
    get isNight() { 
        const tempoCiclo = this.elapsedSec % 300; 
        return tempoCiclo >= 150; 
    }

    atualizarLuzDiaNoite() {
        const tempoCiclo = this.elapsedSec % 300;
        let fase = 'day';
        if (tempoCiclo >= 120 && tempoCiclo < 150) fase = 'sunset';
        else if (tempoCiclo >= 150 && tempoCiclo < 270) fase = 'night';
        else if (tempoCiclo >= 270) fase = 'sunrise';

        if (this.prevPhase !== fase) {
            this.prevPhase = fase;
            this.transitarFaseDiaNoite(fase, tempoCiclo);
        }
    }

    transitarFaseDiaNoite(fase, tempoCiclo) {
        if (!this.lightOverlay) return;

        this.tweens.killTweensOf(this.lightOverlay);

        if (fase === 'day') {
            this.lightOverlay.setAlpha(0);
        } else if (fase === 'sunset') {
            this.lightOverlay.setFillStyle(0xff8844, 1);
            const tempoRestante = Math.max(1, (150 - tempoCiclo) * 1000);
            this.tweens.add({
                targets: this.lightOverlay,
                alpha: 0.25,
                duration: tempoRestante,
                ease: 'Linear'
            });
        } else if (fase === 'night') {
            this.lightOverlay.setFillStyle(0x1a1a44, 1);
            
            const duracaoTransicao = 15;
            const fimTransicao = 150 + duracaoTransicao;
            if (tempoCiclo < fimTransicao) {
                const tempoRestante = Math.max(1, (fimTransicao - tempoCiclo) * 1000);
                this.tweens.add({
                    targets: this.lightOverlay,
                    alpha: 0.45,
                    duration: tempoRestante,
                    ease: 'Linear'
                });
            } else {
                this.lightOverlay.setAlpha(0.45);
            }
        } else if (fase === 'sunrise') {
            this.lightOverlay.setFillStyle(0x1a1a44, 1);
            const tempoRestante = Math.max(1, (300 - tempoCiclo) * 1000);
            this.tweens.add({
                targets: this.lightOverlay,
                alpha: 0,
                duration: tempoRestante,
                ease: 'Linear'
            });
        }
    }

    mostrarAvisoVaga() {
        const W = this.scale.width, H = this.scale.height;
        const msg = I18n.t('hud.wave_warning');
        const warn = this.add.text(W / 2, H / 2 - 60, msg, {
            fontFamily: 'Georgia, serif', fontSize: '18px',
            fill: '#ffaa44', fontStyle: 'bold italic',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
        
        this.tweens.add({
            targets: warn, alpha: 1, duration: 400,
            yoyo: true, hold: 2200,
            onComplete: () => warn.destroy()
        });
        SoundManager.play('pause');
    }

    iniciarVagaInimigos() {
        const totalVivos = this.goblins.getChildren().filter(g => !g.dead).length;
        if (totalVivos >= 10) return;

        this.waveNumber++;
        this.events.emit('waveChanged', this.waveNumber);

        let contagemSpawns = 2;
        if (this.waveNumber >= 10) contagemSpawns = 4;
        else if (this.waveNumber >= 4) contagemSpawns = 3;

        const maxSpawns = Math.min(contagemSpawns, 10 - totalVivos);

        const pontosValidos = PONTOS_SPAWN.filter(p => {
            const d = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
            return d > 300;
        });

        if (pontosValidos.length === 0) return;

        const baralhados = Phaser.Utils.Array.Shuffle(pontosValidos);
        const pontosSelecionados = baralhados.slice(0, Math.min(baralhados.length, Phaser.Math.Between(2, 3)));

        for (let i = 0; i < maxSpawns; i++) {
            const ponto = Phaser.Math.RND.pick(pontosSelecionados);
            const spawnX = ponto.x;
            const spawnY = ponto.y;

            let escolha = 'goblin_1';
            const roll = Math.random();

            if (this.waveNumber <= 3) {
                escolha = roll < 0.80 ? 'goblin_1' : 'goblin_2';
            } else if (this.waveNumber <= 6) {
                if (roll < 0.50) escolha = 'goblin_2';
                else if (roll < 0.80) escolha = 'goblin_1';
                else escolha = 'skeleton';
            } else if (this.waveNumber <= 9) {
                if (roll < 0.50) escolha = 'skeleton';
                else if (roll < 0.80) escolha = 'goblin_2';
                else escolha = 'goblin_3';
            } else {
                if (roll < 0.40) escolha = 'goblin_3';
                else if (roll < 0.80) escolha = 'skeleton';
                else escolha = 'boss';
            }

            if (escolha === 'goblin_1') {
                this.criarGoblin(spawnX, spawnY, 1);
            } else if (escolha === 'goblin_2') {
                this.criarGoblin(spawnX, spawnY, 2);
            } else if (escolha === 'goblin_3') {
                this.criarGoblin(spawnX, spawnY, 3);
            } else if (escolha === 'skeleton') {
                this.criarEsqueleto(spawnX, spawnY);
            } else if (escolha === 'boss') {
                const bossVivo = this.goblins.getChildren().some(g => g instanceof BossSkeleton && !g.dead);
                if (bossVivo) {
                    this.criarEsqueleto(spawnX, spawnY);
                } else {
                    this.criarBoss(spawnX, spawnY);
                }
            }
        }
    }
}
