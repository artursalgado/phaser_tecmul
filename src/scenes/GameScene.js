import Inventory, { ITEM_DB } from "../systems/Inventory.js";
import PlayerStats from "../systems/PlayerStats.js";
import Player from "../objects/Player.js";
import CollectibleItem from "../objects/CollectibleItem.js";
import Goblin from "../objects/Goblin.js";
import Skeleton from "../objects/Skeleton.js";
import Tree from "../objects/Tree.js";
import QuestManager, { RAFT_PARTS } from "../systems/QuestManager.js";
import BossSkeleton from "../objects/BossSkeleton.js";
import FinalBoss from "../objects/FinalBoss.js";
import I18n from "../systems/I18n.js";
import SoundManager from "../systems/SoundManager.js";
import SaveManager from "../systems/SaveManager.js";

// Coordenadas dos pontos fixos de spawn para monstros
// Estão localizados nas "arestas" da ilha
const PONTOS_SPAWN = [
  { x: 400, y: 100 },
  { x: 1200, y: 100 }, // Norte
  { x: 400, y: 1500 },
  { x: 1200, y: 1500 }, // Sul
  { x: 100, y: 400 },
  { x: 100, y: 1100 }, // Oeste
  { x: 1500, y: 400 },
  { x: 1500, y: 1100 }, // Este
];

// posicao de spawn inicial de recursos e ferramentas hardcoded
const OFFSETS_ITENS = [
  { dx: -64, dy: -48, itemId: "wood", qty: 3 },
  { dx: 72, dy: -32, itemId: "rock", qty: 2 },
  { dx: -80, dy: 56, itemId: "carrot", qty: 2 },
  { dx: 80, dy: 64, itemId: "potato", qty: 2 },
  { dx: -32, dy: 80, itemId: "wheat", qty: 2 },
  { dx: 48, dy: -80, itemId: "fish", qty: 2 },
  { dx: -48, dy: -88, itemId: "egg", qty: 2 },
  { dx: 32, dy: 32, itemId: "axe", qty: 1 },
  { dx: -32, dy: 32, itemId: "pickaxe", qty: 1 },
  { dx: 120, dy: 0, itemId: "water", qty: 3 },
  { dx: -120, dy: 0, itemId: "water", qty: 2 },
  { dx: 0, dy: -120, itemId: "wood", qty: 2 },
  { dx: 0, dy: 120, itemId: "rock", qty: 3 },
  { dx: 48, dy: -48, itemId: "sword", qty: 1 },
];

const OFFSETS_INIMIGOS = [
  { dx: -200, dy: -140 },
  { dx: 200, dy: -140 },
  { dx: -200, dy: 140 },
  { dx: 200, dy: 140 },
  { dx: 0, dy: -200 },
  { dx: -250, dy: 0 },
  { dx: 250, dy: 0 },
];

const OFFSETS_ARVORES = [
  { dx: -40, dy: -20 },
  { dx: 10, dy: -50 },
  { dx: 50, dy: 10 },
];

// Coordenadas das caixas com cordas colocadas estrategicamente no mapa
const SPAWNS_CAIXAS_CORDA = [
  { x: 536, y: 440 },
  { x: 424, y: 760 },
  { x: 488, y: 600 },
];

// Valores que sao restaurados por cada alimento/bebida ao ser consumido
const VALORES_ALIMENTOS = {
  carrot: { hunger: 20, energy: 8 },
  potato: { hunger: 28, energy: 10 },
  wheat: { hunger: 12, energy: 5 },
  fish: { hunger: 35, health: 8, energy: 15 },
  egg: { hunger: 18, health: 5, energy: 8 },
  milk: { thirst: 30, health: 5, energy: 10 },
  water: { thirst: 45, energy: 12 },
};

// Cena principal do jogo
//sobrevivência e combate
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    // variáveis de controlo de estado do jogo
    this.invulnerable = false; // Flag para frames de invulnerabilidade do jogador
    this.elapsedSec = 0; // Cronómetro de segundos passados
    this.score = 0; // Pontos do jogador
    this.killCount = 0; // Monstros derrotados
    this.paused = false; // Se a lógica

    this.enemiesUnlocked = false; // Waves de inimigos só ativam ao apanhar a 1ª arma/10 madeiras
    this.pendingEnemySpawns = []; // Inimigos pendentes de nascer
    this.waveNumber = 0;
  }

  create(data) {
    // Toca a música ambiente procedural
    SoundManager.resume();
    SoundManager.startBgMusic();

    // Reseta todos os parâmetros de estado
    this.elapsedSec = 0;
    this.score = 0;
    this.killCount = 0;
    this.paused = false;
    this.hasExtraLife = true; // Jogador tem direito a renascer 1 vez na praia ao morrer
    this.raftReady = false;
    this.autosaveTimer = 0;
    this.loadedPlayerPos = null;
    this.waveTimer = 75; // 75 segundos entre waves de monstros
    this.waveWarningShown = false;
    this.waveNumber = 0;

    // Carrega o mapa e ve os píxeis
    const dim = this.configurarMapa();
    if (!dim.mapW) {
      return;
    }

    // Lê os pontos de spawn
    const spawns = this.lerPontosSpawns(this.mapa, dim.mapW, dim.mapH);
    this.spawnPos = { x: spawns.player.x, y: spawns.player.y };

    // Inicializa inventário, status, quest
    this.configurarSistemas();

    //  carregar um save existente do localStorage (Menu -> Continuar)
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

        if (dadosSave.inventory) {
          this.inventory.fromJSON(dadosSave.inventory);
        }
        if (dadosSave.stats) {
          this.stats.fromJSON(dadosSave.stats);
        }
        if (dadosSave.quest) {
          this.quest.fromJSON(dadosSave.quest);
        }

        if (dadosSave.playerPosition) {
          this.loadedPlayerPos = dadosSave.playerPosition;
        }
      }
    }

    //  objeto do Jogador (Player) na posição correta
    const startX = this.loadedPlayerPos
      ? this.loadedPlayerPos.x
      : spawns.player.x;
    const startY = this.loadedPlayerPos
      ? this.loadedPlayerPos.y
      : spawns.player.y;

    this.player = new Player(this, startX, startY);

    //colisão entre o jogador e os blocos sólidos
    if (this.colisao) {
      this.physics.add.collider(this.player, this.colisao);
    }

    // Se for jogo novo, dá o diário no primeiro slot da mochila
    if (!this.loadedPlayerPos) {
      this.inventory.addItem("book", 1);
    }

    // Configura câmaras, teclas, monstros e start na a HUDScene
    this.configurarCamera(dim.mapW, dim.mapH);
    this.configurarControlos();
    this.configurarMundo(spawns);
    this.configurarEventos();
    this.configurarHUD();

    // Se o save carregado já tiver a quest terminada, prepara a fuga
    if (this.quest.isComplete()) {
      this.raftReady = true;
      if (this.raftLabel) {
        this.raftLabel.setText(I18n.lang === "en" ? "ESCAPE [E]" : "FUGIR [E]");
        this.raftLabel.setColor("#88ff88");
      }
    }

    // Se o save carregado estava morto, salta imediatamente para ecrã de GameOver
    if (this.stats.dead) {
      this.scene.stop("HUDScene");
      this.scene.start("GameOverScene", {
        score: this.score,
        kills: this.killCount,
        time: Math.floor(this.elapsedSec),
      });
      return;
    }
  }

  // config o tilemap, profundidades das camadas e colisão de pontes
  configurarMapa() {
    const mapa = this.make.tilemap({ key: "ilha" });
    this.mapa = mapa;
    const tileset = mapa.addTilesetImage("punyworld-overworld", "punyworld");

    if (!tileset) {
      return { mapW: 0, mapH: 0 };
    }

    // cria as camadas do mapa importadas do Tiled
    const chao = mapa.createLayer("chao", tileset, 0, 0);
    const transicoes = mapa.createLayer("transicoes", tileset, 0, 0);
    const decoracao = mapa.createLayer("decoracao", tileset, 0, 0);
    const colisao = mapa.createLayer("colisao", tileset, 0, 0);
    const objetos = mapa.createLayer("objetos", tileset, 0, 0);
    const acima = mapa.createLayer("acima", tileset, 0, 0); // Camada no topo de tudo (ex: copas de árvores)

    // define as profundidades para o render
    chao?.setDepth(0);
    transicoes?.setDepth(1);
    decoracao?.setDepth(2);
    objetos?.setDepth(4);
    acima?.setDepth(8); // Desenha as copas por cima do jogador (Z=5) e dos monstros (Z=4)

    // Configura colisões da camada invisível de colisão sólida
    if (colisao) {
      colisao.setDepth(2);
      colisao.setCollisionByExclusion([-1, 0]); // Colide com tudo exceto blocos vazios (-1) e ID 0
      colisao.setVisible(false); // Oculta colisão física

      // Desbloqueio das Pontes:
      // A camada de colisão cobre a água toda, para deixarmos o player passar poelas pontes
      // sem cair "varremos" os blocos da camada de decoracao
      // Onde tiver blocos com o ID de ponte (GIDs 731 ou 849), desativamos a colisão sólida
      const PASSAGEM_GIDS = new Set([731, 849]);
      const FLIP_MASK = 0xe0000000; // Máscara de bitwise para remover rotações de tiles do Tiled
      //bitwise é manipular números diretamente na sua forma binária
      if (decoracao) {
        decoracao.layer.data.forEach((row, ty) => {
          row.forEach((decTile, tx) => {
            if (!decTile || decTile.index <= 0) {
              return;
            }
            const gid = decTile.index & ~FLIP_MASK;
            if (PASSAGEM_GIDS.has(gid)) {
              const colTile = colisao.getTileAt(tx, ty);
              if (colTile) {
                colTile.setCollision(false, false, false, false);
              } // Desativa colisão
            }
          });
        });
      }
    }

    const mapW = mapa.widthInPixels;
    const mapH = mapa.heightInPixels;
    this.mapW = mapW;
    this.mapH = mapH;

    // Define os limites físicos do motor de física Arcade para o tamanho da ilha
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.colisao = colisao;

    return { mapW, mapH };
  }

  // Inicializa os sistemas de dados e eventos
  configurarSistemas() {
    this.inventory = new Inventory(24); // 24 slots totais
    this.stats = new PlayerStats();
    this.quest = new QuestManager();
    this.quest.init(this);

    // Ouve a morte do jogador
    this.stats.on("died", () => {
      const perdas = this.quest.applyDeathPenalty();
      const dx = this.player.x;
      const dy = this.player.y;

      // Larga todos os items do inventário no chão no sítio da morte
      this.dropInventarioNoChao(dx, dy);

      // Se o jogador ainda tiver a segunda vida extra ativa
      if (this.hasExtraLife) {
        this.hasExtraLife = false;
        this.renascerJogador();
      } else {
        // Morte permanente: grava morte e vai para GameOver
        SaveManager.save(this);
        this.scene.stop("HUDScene");
        this.scene.start("GameOverScene", {
          score: this.score,
          kills: this.killCount,
          time: Math.floor(this.elapsedSec),
          perdas,
        });
      }
    });

    // Ativa flag de fuga pronta quando o jogador entrega os recursos TODOOOOSS
    this.quest.on("raftComplete", () => {
      this.raftReady = true;
      if (this.raftLabel) {
        this.raftLabel.setText(I18n.lang === "en" ? "ESCAPE [E]" : "FUGIR [E]");
        this.raftLabel.setColor("#88ff88");
      }
      this.spawnarCriaturaFinal();
    });
  }

  // Limita a movimentação da câmara aos limites do mapa e faz com que siga o jogador
  configurarCamera(mapW, mapH) {
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2); // Zoom de 2x para aproximar os detalhes pixelart
    this.cameras.main.setBackgroundColor("#3a8fa8"); // Cor de fundo de mar profundo
  }

  // Mapeia?  controlos  WASD/Setas e atalhos rápidos do teclado
  configurarControlos() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.keyboard.on("keydown", (e) => {
      // Seleção de slots da hotbar premindo as teclas de 1 a 8
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= this.inventory.size) {
        this.inventory.selectSlot(n - 1);
      }

      // Tecla E: interagir (NPC/baú) > escapar na jangada > usar item
      if (e.key === "e" || e.key === "E") {
        if (this.raftReady && this.estaNaZonaJangada()) {
          this.iniciarCutsceneFuga();
        } else {
          // Tenta interagir com NPC ou baú perto; se não houver, usa item
          const interagiu = this._tentarInteragirMundo();
          if (!interagiu) this.usarItemSelecionado();
        }
      }

      // Tecla F: entregar recursos na jangada
      if (e.key === "f" || e.key === "F") {
        this.tentarConstruirJangada();
      }

      // Tecla Q: abrir o Quest Log expandido na HUD
      if (e.key === "q" || e.key === "Q") {
        this.events.emit("toggleQuestLog");
      }

      // Tecla I: abrir e fechar a mochila (inventário)
      if (e.key === "i" || e.key === "I") {
        this.alternarInventario();
      }

      // Tecla ESC: abre e fecha o painel de pausa
      if (e.key === "Escape") {
        const hud = this.scene.get("HUDScene");
        if (!hud?.bookOpen) {
          this.alternarPausa();
        }
      }
    });
  }

  //  inicializar monstros, recursos, árvores e a zona da jangada
  configurarMundo(spawns) {
    // 1. Instancia itens físicos no chão
    this.pickups = this.physics.add.group();
    spawns.items.forEach((s) =>
      this.pickups.add(new CollectibleItem(this, s.x, s.y, s.itemId, s.qty)),
    );
    SPAWNS_CAIXAS_CORDA.forEach((s) =>
      this.pickups.add(new CollectibleItem(this, s.x, s.y, "rope", 1)),
    );

    // Verifica colisões por sobreposição (overlap) para apanhar os itens do chão
    this.physics.add.overlap(
      this.player,
      this.pickups,
      this.apanharItem,
      null,
      this,
    );

    // 2. Instancia o grupo de física dos inimigos
    this.goblins = this.physics.add.group();
    this.pendingEnemySpawns = spawns.enemies.slice();
    if (this.colisao) {
      this.physics.add.collider(this.goblins, this.colisao);
    }

    // Impede que os monstros fiquem empilhados colidindo-os uns com os outros
    this.physics.add.collider(this.goblins, this.goblins);

    // Se os monstros já estavam desbloqueados no save carregado, gera-os com pequenos atrasos (delay)
    if (this.enemiesUnlocked) {
      let delay = 0;
      this.pendingEnemySpawns.forEach((s) => {
        this.time.delayedCall(delay, () => {
          if (s.kind === "boss") {
            this.criarBoss(s.x, s.y);
          } else if (s.kind === "skeleton") {
            this.criarEsqueleto(s.x, s.y);
          } else {
            this.criarGoblin(s.x, s.y, s.tier);
          }
        });
        delay += 500;
      });
      this.pendingEnemySpawns = [];
    }

    // 3. Instancia as árvores cortáveis na ruína central
    this.trees = this.add.group();
    const treeBase = spawns.poi.ruina || { x: this.mapW / 2, y: this.mapH / 2 };
    OFFSETS_ARVORES.forEach((o) =>
      this.trees.add(new Tree(this, treeBase.x + o.dx, treeBase.y + o.dy)),
    );

    // 4. Configura as coordenadas e os marcadores visuais da zona da jangada
    const docaPos = spawns.poi.doca || {
      x: this.mapW / 2 + 80,
      y: this.mapH / 2 + 40,
    };
    this.raftZone = { x: docaPos.x, y: docaPos.y, radius: 36 };

    // Imagem decorativa da jangada na areia
    this.add
      .image(this.raftZone.x, this.raftZone.y, "spr_deco_coracle_land")
      .setDepth(3)
      .setScale(0.7);

    // Marcador visual de raio luminoso semitransparente na água
    this.raftMarker = this.add
      .circle(
        this.raftZone.x,
        this.raftZone.y,
        this.raftZone.radius,
        0xffdd66,
        0.18,
      )
      .setDepth(1);

    // Etiqueta indicando controlos de entrega
    this.raftLabel = this.add
      .text(
        this.raftZone.x,
        this.raftZone.y - this.raftZone.radius - 8,
        "JANGADA [F]",
        {
          fontSize: "10px",
          fill: "#ffdd66",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(9);

    // 5. Instancia o retângulo escuro que cobrirá todo o ecrã para o ciclo dia/noite. Parâmetros de rectangle: (X superior esquerdo, Y superior esquerdo, largura do ecrã, altura do ecrã, cor escura, opacidade inicial)
    this.prevPhase = null;
    this.lightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x1a1a44, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(50);

    // Conteúdo de exploração extra
    this.criarNPCs(spawns);
    this.criarBaulsEscondidos(spawns);
  }

  criarNPCs(spawns) {
    this.npcs = [];

    const ruinaPos = spawns.poi.ruina || { x: this.mapW / 2, y: this.mapH / 2 };
    const docaPos  = spawns.poi.doca  || { x: this.mapW / 2 + 80, y: this.mapH / 2 + 40 };

    const defNPCs = [
      {
        x: docaPos.x + 60, y: docaPos.y - 40,
        sprite: "spr_npc_fisher",
        falas: [
          "Vi uma vela a flutuar para norte...",
          "Cuidado com os goblins à noite.",
          "Eu construí uma jangada uma vez. Precisa de 5 madeiras, 3 cordas e uma vela.",
        ],
      },
      {
        x: ruinaPos.x - 80, y: ruinaPos.y + 100,
        sprite: "spr_npc_old",
        falas: [
          "Esta ilha guarda segredos nos baús...",
          "O boss aparece quando estás mais fraco. Fica em guarda.",
          "Eu fiquei preso aqui há anos. Tu não fiques.",
        ],
      },
    ];

    defNPCs.forEach((def) => {
      const sprite = this.add.image(def.x, def.y, def.sprite).setDepth(3).setScale(0.25);

      // Balão de indicação de interação
      const balao = this.add.text(def.x, def.y - 28, "[ E ]", {
        fontSize: "9px", fill: "#ffffff", stroke: "#000000", strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4).setAlpha(0);

      this.npcs.push({ ...def, sprite, balao, falaIdx: 0, dialogoAberto: false });
    });
  }

  criarBaulsEscondidos(spawns) {
    this.baus = [];

    // Posições relativas a pontos de interesse conhecidos
    const ruinaPos = spawns.poi.ruina || { x: this.mapW / 2, y: this.mapH / 2 };

    const posBaus = [
      { x: ruinaPos.x + 120, y: ruinaPos.y - 60,  itens: [{ id: "rope",  qty: 1 }] },
      { x: ruinaPos.x - 180, y: ruinaPos.y + 80,  itens: [{ id: "sword", qty: 1 }] },
      { x: 620,               y: 320,              itens: [{ id: "fish",  qty: 2 }] },
      { x: 280,               y: 680,              itens: [{ id: "rock",  qty: 3 }] },
      { x: 800,               y: 500,              itens: [{ id: "water", qty: 2 }] },
    ];

    posBaus.forEach((def) => {
      const baul = this.add
        .rectangle(def.x, def.y, 18, 14, 0x8b5e2a)
        .setStrokeStyle(2, 0xd4a030)
        .setDepth(3);

      const icone = this.add.text(def.x, def.y - 20, "📦", { fontSize: "11px" })
        .setOrigin(0.5).setDepth(4).setAlpha(0.7);

      this.baus.push({ ...def, baul, icone, aberto: false });
    });
  }

  // Lógica de interação com NPCs e baús — chamada no update() da GameScene quando o jogador carrega E
  interagirComMundo() {
    const RAIO = 55;
    const px = this.player.x, py = this.player.y;

    // NPCs
    this.npcs?.forEach((npc) => {
      const d = Phaser.Math.Distance.Between(px, py, npc.x, npc.y);
      npc.balao.setAlpha(d < RAIO ? 1 : 0);
    });

    // Baús
    this.baus?.forEach((b) => {
      if (b.aberto) return;
      const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
      b.icone.setAlpha(d < RAIO ? 1 : 0.4);
    });
  }

  // Devolve true se interagiu com algo (NPC ou baú), false se não havia nada perto
  _tentarInteragirMundo() {
    const RAIO = 55;
    const px = this.player?.x ?? 0, py = this.player?.y ?? 0;

    for (const b of this.baus ?? []) {
      if (!b.aberto && Phaser.Math.Distance.Between(px, py, b.x, b.y) < RAIO) {
        this.abrirBauOuFalarNPC();
        return true;
      }
    }
    for (const npc of this.npcs ?? []) {
      if (Phaser.Math.Distance.Between(px, py, npc.x, npc.y) < RAIO) {
        this.abrirBauOuFalarNPC();
        return true;
      }
    }
    return false;
  }

  abrirBauOuFalarNPC() {
    const RAIO = 55;
    const px = this.player.x, py = this.player.y;

    // Baús primeiro
    for (const b of this.baus ?? []) {
      if (b.aberto) continue;
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < RAIO) {
        b.aberto = true;
        b.baul.setFillStyle(0x4a2e0a);
        b.icone.setText("🔓").setAlpha(0.4);
        b.itens.forEach(({ id, qty }) => {
          this.inventory.addItem(id, qty);
          this.spawnPickup(b.x + Phaser.Math.Between(-16, 16), b.y - 10, id, qty);
        });
        SoundManager.play("pickup");
        return;
      }
    }

    // NPCs
    for (const npc of this.npcs ?? []) {
      if (Phaser.Math.Distance.Between(px, py, npc.x, npc.y) < RAIO) {
        const fala = npc.falas[npc.falaIdx % npc.falas.length];
        npc.falaIdx++;

        const balaoFala = this.add.text(npc.x, npc.y - 44, `"${fala}"`, {
          fontSize: "9px", fill: "#ffffcc",
          stroke: "#000000", strokeThickness: 2,
          wordWrap: { width: 160 },
          backgroundColor: "#1a1008",
          padding: { x: 4, y: 3 },
        }).setOrigin(0.5, 1).setDepth(20);

        this.tweens.add({
          targets: balaoFala,
          alpha: 0,
          delay: 3000,
          duration: 600,
          onComplete: () => balaoFala.destroy(),
        });
        return;
      }
    }
  }

  // Associa eventos de combate, som e pontuação
  configurarEventos() {
    this.events.off("enemyDied");
    this.events.off("playerDamaged");
    this.events.off("playerAttack");
    this.events.off("enemyHurt");
    this.events.off("playerStep");

    // Escuta a morte de inimigos
    this.events.on("enemyDied", (x, y) => {
      this.killCount++;
      this.score += 100;

      // 80% de hipóteses do inimigo deixar cair um item aleatório no chão ao morrer
      const dropOptions = [
        "wood",
        "rock",
        "wood",
        "rock",
        "carrot",
        "fish",
        "egg",
      ];
      if (Math.random() < 0.8) {
        const drop =
          dropOptions[Phaser.Math.Between(0, dropOptions.length - 1)];
        this.spawnPickup(x, y, drop, 1);
      }
    });

    // Escuta quando o jogador sofre golpes de monstros
    this.events.on("playerDamaged", (amount) => {
      if (this.invulnerable) {
        return;
      } // Ignora se o jogador estiver em frames de invulnerabilidade

      this.stats.takeDamage(amount);
      this.player.flashHurt(); // Efeito visual de piscar
      SoundManager.play("hurt");

      this.definirInvulnerabilidade(1000); // 1 segundo de invulnerabilidade
      this.cameras.main.shake(120, 0.006); // Treme a câmara ligeiramente
    });

    // Associa os efeitos sonoros procedurais adequados aos eventos
    this.events.on("playerAttack", () => SoundManager.play("attack"));
    this.events.on("enemyHurt", () => SoundManager.play("goblin_hurt"));
    this.events.on("playerStep", () => SoundManager.play("step"));
  }

  // Inicia a HUDScene em execução paralela
  configurarHUD() {
    this.scene.launch("HUDScene");
    this.scene.bringToTop("HUDScene");

    // Texto de ajuda tutorial temporário na base inferior
    const hintText = I18n.t("hud.hint") + "  ·  ESC pausa";
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height - 20, hintText, {
        fontSize: "9px",
        fill: "#ffffbb",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);

    // Desvanece e destrói o texto tutorial após 8 segundos de jogo
    this.time.delayedCall(8000, () => {
      this.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 1200,
        onComplete: () => hint.destroy(),
      });
    });
  }

  // Lê os pontos de spawn desenhados no Tiled.
  // Se o mapa não possuir a camada de objetos de spawns, devolve as posições de fallback padrão
  lerPontosSpawns(mapa, mapW, mapH) {
    const cx = mapW / 2,
      cy = mapH / 2;
    const layer = mapa.getObjectLayer && mapa.getObjectLayer("spawns");
    if (!layer || !layer.objects || !layer.objects.length) {
      return {
        player: { x: cx, y: cy },
        items: OFFSETS_ITENS.map((o) => ({
          x: cx + o.dx,
          y: cy + o.dy,
          itemId: o.itemId,
          qty: o.qty,
        })),
        enemies: OFFSETS_INIMIGOS.map((o) => ({
          x: cx + o.dx,
          y: cy + o.dy,
          kind: "goblin",
          tier: 1,
        })),
        poi: {},
      };
    }

    // Utilitário para ler propriedades personalizadas de cada objeto do Tiled
    const obterProp = (o, k) => {
      const p = (o.properties || []).find((pp) => pp.name === k);
      return p ? p.value : undefined;
    };

    const res = { player: { x: cx, y: cy }, items: [], enemies: [], poi: {} };
    for (const o of layer.objects) {
      const name = o.name || o.type;
      if (name === "player_start") {
        res.player = { x: o.x, y: o.y };
      } else if (name === "item") {
        res.items.push({
          x: o.x,
          y: o.y,
          itemId: obterProp(o, "itemId") || "wood",
          qty: parseInt(obterProp(o, "qty") || "1", 10),
        });
      } else if (name === "enemy") {
        res.enemies.push({
          x: o.x,
          y: o.y,
          kind: obterProp(o, "kind") || "goblin",
          tier: parseInt(obterProp(o, "tier") || "1", 10),
        });
      } else if (name === "poi") {
        const label = obterProp(o, "label");
        if (label) {
          res.poi[label] = { x: o.x, y: o.y };
        }
      }
    }
    return res;
  }

  // Ciclo principal de processamento executado a cada frame do jogo
  update(time, delta) {
    if (this.paused) {
      return;
    }

    // 1. Atualiza status de fome/sede e movimento do jogador/monstros
    this.stats.update(delta);
    this.player.update(this.cursors, this.wasd, time, delta);
    this.goblins
      .getChildren()
      .forEach((g) => g.update(this.player, time, delta));

    // Incrementa o tempo decorrido convertendo delta para segundos
    this.elapsedSec += delta / 1000;

    // 2. Atualiza a transparência e cor do overlay para o Ciclo Dia/Noite
    this.atualizarLuzDiaNoite();

    // Atualiza indicadores de proximidade de NPCs e baús
    this.interagirComMundo();

    // 3. Sistema de Auto-Save Automático: grava o progresso a cada 30 segundos
    this.autosaveTimer += delta / 1000;
    if (this.autosaveTimer >= 30) {
      this.autosaveTimer = 0;
      SaveManager.save(this);
    }

    // 4. Temporizador de hordas de monstros (Waves)
    if (this.enemiesUnlocked) {
      this.waveTimer -= delta / 1000;

      // Mostra aviso de perigo quando faltarem 5 segundos
      if (this.waveTimer <= 5 && !this.waveWarningShown) {
        this.waveWarningShown = true;
        this.mostrarAvisoVaga();
      }

      // Quando o temporizador expira, inicia uma nova wave de inimigos
      if (this.waveTimer <= 0) {
        this.waveTimer = 75; // Reseta temporizador
        this.waveWarningShown = false;
        this.iniciarVagaInimigos();
      }
    }
  }

  // Pausa a física e os monstros e abre a cena de pausa
  alternarPausa() {
    if (this.paused) {
      return;
    }
    this.paused = true;
    SoundManager.play("pause");
    SaveManager.save(this); // Auto-save ao pausar

    this.scene.pause("GameScene");
    this.scene.launch("PauseScene");

    // Escuta o fecho da cena de pausa para retomar
    this.scene.get("PauseScene").events.once("shutdown", () => {
      this.paused = false;
    });
  }

  // Pausa a física e abre a mochila (InventoryScene)
  alternarInventario() {
    if (this.paused) {
      return;
    }
    this.paused = true;

    this.scene.pause("GameScene");
    this.scene.launch("InventoryScene");

    // Escuta o fecho da mochila para retomar
    this.scene.get("InventoryScene").events.once("shutdown", () => {
      this.paused = false;
      this.scene.resume("GameScene");
    });
  }

  // Cria e insere um Goblin físico na cena — tenta reutilizar do pool primeiro
  criarGoblin(x, y, tier = 1) {
    let finalTier = tier;
    if (this.isNight) finalTier = Math.min(3, tier + 1);

    // Procura um Goblin inativo do mesmo tier no pool
    const inativo = this.goblins.getChildren().find(
      (c) => !c.active && c instanceof Goblin && c.tier === finalTier,
    );
    if (inativo) {
      inativo.resetar(x, y);
      return inativo;
    }

    const g = new Goblin(this, x, y, finalTier);
    this.goblins.add(g);
    if (this.colisao) this.physics.add.collider(g, this.colisao);
    return g;
  }

  // Cria e insere um Esqueleto físico na cena — tenta reutilizar do pool primeiro
  criarEsqueleto(x, y) {
    const inativo = this.goblins.getChildren().find(
      (c) => !c.active && c instanceof Skeleton && !(c instanceof BossSkeleton),
    );
    if (inativo) {
      inativo.resetar(x, y);
      return inativo;
    }

    const s = new Skeleton(this, x, y);
    this.goblins.add(s);
    if (this.colisao) this.physics.add.collider(s, this.colisao);
    return s;
  }

  // Cria e insere o Boss Esqueleto físico na cena
  criarBoss(x, y) {
    const b = new BossSkeleton(this, x, y);
    this.goblins.add(b);
    if (this.colisao) {
      this.physics.add.collider(b, this.colisao);
    }
    return b;
  }

  // Spawn da criatura final quando a jangada está completa
  spawnarCriaturaFinal() {
    if (this.criaturaFinalSpawnada) return;
    this.criaturaFinalSpawnada = true;

    // Aparece 200px a norte do jogador para ter espaço de combate
    const px = this.player.x;
    const py = this.player.y - 200;

    const boss = new FinalBoss(this, px, py);
    this.goblins.add(boss);
    if (this.colisao) {
      this.physics.add.collider(boss, this.colisao);
    }
  }

  // Lógica acionada quando o jogador colide com um item no chão
  apanharItem(player, item) {
    const def = ITEM_DB[item.itemId];
    const nome =
      I18n.t(`items.${item.itemId}`) || (def ? def.name : item.itemId);

    // Tenta inserir na mochila
    const adicionou = this.inventory.addItem(item.itemId, item.quantity);

    if (adicionou) {
      SoundManager.play("pickup");
      this.score += 10;
      this.tentarDesbloquearInimigos(item.itemId); // Verifica se desbloqueia o perigo
    }

    // Desenha texto dinâmico na tela indicando o item obtido ou se a mochila está cheia
    const txt = this.add
      .text(
        item.x,
        item.y - 20,
        adicionou ? `+${item.quantity} ${nome}` : I18n.t("hud.inventory_full"),
        {
          fontSize: "10px",
          fill: adicionou ? "#ffffff" : "#ff8888",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: txt,
      y: txt.y - 28,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });

    if (adicionou) {
      item.deactivar(); // Devolve ao pool em vez de destruir
    }
  }

  // Tenta reutilizar um CollectibleItem inativo do pool; cria um novo se não houver nenhum disponível
  spawnPickup(x, y, itemId, qty = 1) {
    const inativo = this.pickups.getChildren().find((c) => !c.active);
    if (inativo) {
      inativo.reviver(x, y, itemId, qty);
    } else {
      this.pickups.add(new CollectibleItem(this, x, y, itemId, qty));
    }
  }

  // Lógica que destranca o surgimento de monstros.
  // O perigo ativa assim que o jogador constrói a sua primeira arma ou recolhe 10 madeiras.
  tentarDesbloquearInimigos(lastItemId) {
    if (this.enemiesUnlocked) {
      return;
    }

    const ARMAS = ["axe", "pickaxe", "sword", "hammer"];
    const temArma = ARMAS.includes(lastItemId);

    // Lê a quantidade total de madeira acumulada na jangada ou mochila
    const totalMadeiras = this.quest
      ? (this.quest.getProgress().find((p) => p.id === "wood")?.current ?? 0)
      : this.inventory.slots.reduce(
          (sum, s) => (s && s.itemId === "wood" ? sum + s.qty : sum),
          0,
        );

    if (!temArma && totalMadeiras < 10) {
      return;
    }

    this.enemiesUnlocked = true;

    // Avisa o jogador com texto no centro do ecrã e câmara a tremer
    const W = this.scale.width,
      H = this.scale.height;
    const motivo = temArma
      ? I18n.t("hud.enemy_danger")
      : I18n.t("hud.enemy_attention");

    const warn = this.add
      .text(W / 2, H / 2 - 60, motivo, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        fill: "#ff4444",
        fontStyle: "bold italic",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);

    this.tweens.add({
      targets: warn,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 1800,
      onComplete: () => warn.destroy(),
    });

    this.cameras.main.shake(300, 0.004);

    // Gera de imediato a horda inicial pendente
    this.time.delayedCall(600, () => {
      let delay = 0;
      this.pendingEnemySpawns.forEach((s) => {
        this.time.delayedCall(delay, () => {
          if (s.kind === "boss") {
            this.criarBoss(s.x, s.y);
          } else if (s.kind === "skeleton") {
            this.criarEsqueleto(s.x, s.y);
          } else {
            this.criarGoblin(s.x, s.y, s.tier);
          }
        });
        delay += 500;
      });
      this.pendingEnemySpawns = [];
    });
  }

  // Consome alimentos aplicando os respetivos bónus a partir da mochila rápida (atalho E)
  usarItemSelecionado() {
    const slot = this.inventory.getSelectedItem();
    if (!slot) {
      return;
    }

    // Se for o diário
    if (slot.itemId === "book") {
      this.events.emit("openBook");
      return;
    }

    const efeito = VALORES_ALIMENTOS[slot.itemId];
    if (!efeito) {
      return;
    }

    // Aplica os bónus de sobrevivência
    if (efeito.hunger) {
      this.stats.eat(efeito.hunger);
    }
    if (efeito.thirst) {
      this.stats.drink(efeito.thirst);
    }
    if (efeito.health) {
      this.stats.heal(efeito.health);
    }
    if (efeito.energy) {
      this.stats.rest(efeito.energy);
    }

    this.inventory.removeItem(slot.itemId, 1);
    SoundManager.play("pickup");

    const nome = I18n.t(`items.${slot.itemId}`);
    const txt = this.add
      .text(this.player.x, this.player.y - 36, `🍴 ${nome}`, {
        fontSize: "12px",
        fill: "#88ff88",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: txt,
      y: txt.y - 32,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  // Auxiliar: come alimentos consumíveis de forma controlada através da mochila
  consumirAlimento(itemId) {
    const efeito = VALORES_ALIMENTOS[itemId];
    if (!efeito) {
      return false;
    }

    if (efeito.hunger) {
      this.stats.eat(efeito.hunger);
    }
    if (efeito.thirst) {
      this.stats.drink(efeito.thirst);
    }
    if (efeito.health) {
      this.stats.heal(efeito.health);
    }
    if (efeito.energy) {
      this.stats.rest(efeito.energy);
    }

    SoundManager.play("pickup");

    const nome = I18n.t(`items.${itemId}`);
    const txt = this.add
      .text(this.player.x, this.player.y - 36, `🍴 ${nome}`, {
        fontSize: "12px",
        fill: "#88ff88",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: txt,
      y: txt.y - 32,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });

    return true;
  }

  // Devolve verdadeiro se o jogador estiver posicionado dentro do círculo de ancoragem da jangada
  estaNaZonaJangada() {
    const d = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.raftZone.x,
      this.raftZone.y,
    );
    return d <= this.raftZone.radius;
  }

  // Transfere recursos da mochila para a jangada (tecla F na doca)
  tentarConstruirJangada() {
    if (!this.estaNaZonaJangada()) {
      return;
    }

    let entregouAlgo = false;

    // Varre os requisitos da jangada e verifica se o jogador possui estes itens no inventário
    RAFT_PARTS.forEach((part) => {
      const tenho = this.inventory.getQuantity(part.id);
      if (tenho > 0) {
        // Tenta depositar no QuestManager
        const aceito = this.quest.deliver(part.id, tenho);
        if (aceito > 0) {
          // Deduz a quantidade entregue da mochila do jogador
          this.inventory.removeItem(part.id, aceito);
          entregouAlgo = true;
        }
      }
    });

    // Mostra mensagem flutuante de feedback
    const msg = entregouAlgo
      ? I18n.lang === "en"
        ? "Resources delivered!"
        : "Recursos entregues!"
      : I18n.lang === "en"
        ? "Nothing to deliver."
        : "Nada para entregar.";

    const txt = this.add
      .text(this.raftZone.x, this.raftZone.y, msg, {
        fontSize: "11px",
        fill: entregouAlgo ? "#88ff88" : "#ffaa88",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });

    if (entregouAlgo) {
      SoundManager.play("pickup");
    }
  }

  // Configura frames de imunidade ao jogador temporariamente
  definirInvulnerabilidade(ms) {
    this.invulnerable = true;
    this.time.delayedCall(ms, () => {
      this.invulnerable = false;
    });
  }

  // Lógica para repor a vida e reposicionar o jogador na praia caso ele perca a 1ª vida
  // Larga todos os items do inventário no chão espalhados à volta de (x, y)
  dropInventarioNoChao(x, y) {
    const slots = this.inventory.slots;
    const raio  = 28;

    slots.forEach((slot, i) => {
      if (!slot || !slot.itemId || slot.qty <= 0) return;

      // Posição em espiral para não ficarem todos sobrepostos
      const angulo = (i / slots.length) * Math.PI * 2;
      const dist   = raio + Math.random() * 16;
      const ox     = Math.cos(angulo) * dist;
      const oy     = Math.sin(angulo) * dist;

      this.spawnPickup(x + ox, y + oy, slot.itemId, slot.qty);
    });

    this.inventory.clear();
    this.events.emit("inventoryChanged");
  }

  renascerJogador() {
    this.stats.reset();
    this.player.setPosition(this.spawnPos.x, this.spawnPos.y); // Volta para a praia inicial
    this.player.body.setVelocity(0);

    // Pisca o ecrã a preto rapidamente para simular o acordar
    this.cameras.main.flash(400, 0, 0, 0);
    this.definirInvulnerabilidade(1500);

    const msg =
      I18n.lang === "en"
        ? "You wake up on the beach... (lost most resources)"
        : "Acordas de novo na praia... (perdeste a maioria dos recursos)";

    const txt = this.add
      .text(this.player.x, this.player.y - 40, msg, {
        fontSize: "11px",
        fill: "#ffaa88",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 2200,
      onComplete: () => txt.destroy(),
    });
  }

  // Despoleta a animação cinemática final de fuga na jangada
  iniciarCutsceneFuga() {
    if (this.escaping) {
      return;
    }
    this.escaping = true;
    this.paused = true;
    this.player.body.setVelocity(0); // Para o jogador

    // Oculta a interface da HUD
    this.scene.setVisible(false, "HUDScene");
    SoundManager.play("victory");

    const msg = I18n.t("hud.sailing");
    this.add
      .text(this.scale.width / 2, 40, msg, {
        fontSize: "16px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // Faz a câmara principal afastar (zoom out) e deslizar em direção ao mar (pan)
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
      this.raftZone.x,
      this.raftZone.y,
      2500,
      "Sine.easeInOut",
    );
    this.cameras.main.zoomTo(3, 2500);

    // Inicia o fade-out após 6.5 segundos para transitar para a tela final de vitória
    this.time.delayedCall(6500, () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0);
    });

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop("HUDScene");
      this.scene.start("VictoryScene", {
        score: this.score,
        kills: this.killCount,
        time: Math.floor(this.elapsedSec),
      });
    });
  }

  // Getter de conveniência que calcula se é noite de acordo com o cronómetro
  get isNight() {
    const tempoCiclo = this.elapsedSec % 300;
    return tempoCiclo >= 150; // Noite dura entre 150s e 270s (2 minutos)
  }

  // Controla em tempo real a cor e opacidade do overlay retangular com base na fase do ciclo dia/noite
  atualizarLuzDiaNoite() {
    const tempoCiclo = this.elapsedSec % 300; // Ciclos repetitivos de 5 minutos
    let fase = "day";
    if (tempoCiclo >= 120 && tempoCiclo < 150) {
      fase = "sunset";
    } // Pôr-do-sol (30s)
    else if (tempoCiclo >= 150 && tempoCiclo < 270) {
      fase = "night";
    } // Noite (2 minutos)
    else if (tempoCiclo >= 270) {
      fase = "sunrise";
    } // Amanhecer (30s)

    // Só inicia uma nova interpolação visual se o estado do dia mudou
    if (this.prevPhase !== fase) {
      this.prevPhase = fase;
      this.transitarFaseDiaNoite(fase, tempoCiclo);
    }
  }

  // Lógica para interpolar suavemente a cor e o canal alfa do retângulo gráfico de iluminação
  transitarFaseDiaNoite(fase, tempoCiclo) {
    if (!this.lightOverlay) {
      return;
    }

    // Cancela quaisquer transições visuais de luz em execução
    this.tweens.killTweensOf(this.lightOverlay);

    if (fase === "day") {
      this.lightOverlay.setAlpha(0); // Luz solar brilhante (completamente transparente)
    } else if (fase === "sunset") {
      // Tonalidade laranja suave de entardecer
      this.lightOverlay.setFillStyle(0xff8844, 1);

      // Calcula o tempo restante da fase para completar a transição de forma exata
      const tempoRestante = Math.max(1, (150 - tempoCiclo) * 1000);
      this.tweens.add({
        targets: this.lightOverlay,
        alpha: 0.25, // Atinge opacidade de 25%
        duration: tempoRestante,
        ease: "Linear",
      });
    } else if (fase === "night") {
      // Tonalidade azul-escura/negra de noite fechada
      this.lightOverlay.setFillStyle(0x1a1a44, 1);

      const duracaoTransicao = 15; // Demora 15 segundos a escurecer totalmente
      const fimTransicao = 150 + duracaoTransicao;
      if (tempoCiclo < fimTransicao) {
        const tempoRestante = Math.max(1, (fimTransicao - tempoCiclo) * 1000);
        this.tweens.add({
          targets: this.lightOverlay,
          alpha: 0.45, // Atinge opacidade máxima de 45% (mantém visibilidade para o jogador)
          duration: tempoRestante,
          ease: "Linear",
        });
      } else {
        this.lightOverlay.setAlpha(0.45);
      }
    } else if (fase === "sunrise") {
      // Clareia de volta a azul-escura até desvanecer a zero
      this.lightOverlay.setFillStyle(0x1a1a44, 1);
      const tempoRestante = Math.max(1, (300 - tempoCiclo) * 1000);
      this.tweens.add({
        targets: this.lightOverlay,
        alpha: 0,
        duration: tempoRestante,
        ease: "Linear",
      });
    }
  }

  // Desenha e anima a mensagem vermelha de aviso flutuante "ONDA DE INIMIGOS A APROXIMAR-SE"
  mostrarAvisoVaga() {
    const W = this.scale.width,
      H = this.scale.height;
    const msg = I18n.t("hud.wave_warning");
    const warn = this.add
      .text(W / 2, H / 2 - 60, msg, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        fill: "#ffaa44",
        fontStyle: "bold italic",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);

    // Efeito de aparecer rápido, aguentar 2.2 segundos e sumir em yoyo
    this.tweens.add({
      targets: warn,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 2200,
      onComplete: () => warn.destroy(),
    });
    SoundManager.play("pause");
  }

  // Lógica para gerar monstros ao redor do jogador no início de cada wave
  iniciarVagaInimigos() {
    // Limita a quantidade máxima de monstros vivos simultâneos na cena para evitar atrasos (lag)
    const totalVivos = this.goblins.getChildren().filter((g) => !g.dead).length;
    if (totalVivos >= 10) {
      return;
    }

    this.waveNumber++;
    this.events.emit("waveChanged", this.waveNumber); // Atualiza textos da HUDScene

    // Aumenta o número de monstros gerados a cada vaga de acordo com a progressão de dificuldade
    let contagemSpawns = 2;
    if (this.waveNumber >= 10) {
      contagemSpawns = 4;
    } else if (this.waveNumber >= 4) {
      contagemSpawns = 3;
    }

    const maxSpawns = Math.min(contagemSpawns, 10 - totalVivos);

    // Seleciona pontos de spawn fixos que estejam fora da visão do jogador (> 300 pixels de distância)
    // para dar o aspeto que os monstros vieram das profundidades da floresta.
    const pontosValidos = PONTOS_SPAWN.filter((p) => {
      const d = Phaser.Math.Distance.Between(
        p.x,
        p.y,
        this.player.x,
        this.player.y,
      );
      return d > 300;
    });

    if (pontosValidos.length === 0) {
      return;
    }

    // Baralha as posições válidas
    const baralhados = Phaser.Utils.Array.Shuffle(pontosValidos);
    const pontosSelecionados = baralhados.slice(
      0,
      Math.min(baralhados.length, Phaser.Math.Between(2, 3)),
    );

    for (let i = 0; i < maxSpawns; i++) {
      const ponto = Phaser.Math.RND.pick(pontosSelecionados);
      const spawnX = ponto.x;
      const spawnY = ponto.y;

      let escolha = "goblin_1";
      const roll = Math.random();

      // Sorteia o tipo de monstro de forma probabilística com base no número da wave
      if (this.waveNumber <= 3) {
        // Primeiras waves: apenas goblins nível 1 e alguns nível 2
        escolha = roll < 0.8 ? "goblin_1" : "goblin_2";
      } else if (this.waveNumber <= 6) {
        // Waves médias: goblins nível 2, nível 1 e início de esqueletos rápidos
        if (roll < 0.5) {
          escolha = "goblin_2";
        } else if (roll < 0.8) {
          escolha = "goblin_1";
        } else {
          escolha = "skeleton";
        }
      } else if (this.waveNumber <= 9) {
        // Waves avançadas: esqueletos em força, goblins nível 2 e nível 3
        if (roll < 0.5) {
          escolha = "skeleton";
        } else if (roll < 0.8) {
          escolha = "goblin_2";
        } else {
          escolha = "goblin_3";
        }
      } else {
        // Finais: goblins fortes nível 3, esqueletos e hipótese de surgir o Boss Esqueleto!
        if (roll < 0.4) {
          escolha = "goblin_3";
        } else if (roll < 0.8) {
          escolha = "skeleton";
        } else {
          escolha = "boss";
        }
      }

      // Instancia o monstro sorteado no ponto X/Y selecionado
      if (escolha === "goblin_1") {
        this.criarGoblin(spawnX, spawnY, 1);
      } else if (escolha === "goblin_2") {
        this.criarGoblin(spawnX, spawnY, 2);
      } else if (escolha === "goblin_3") {
        this.criarGoblin(spawnX, spawnY, 3);
      } else if (escolha === "skeleton") {
        this.criarEsqueleto(spawnX, spawnY);
      } else if (escolha === "boss") {
        // Só permite instanciar o Boss se não existir outro ativo em combate
        const bossVivo = this.goblins
          .getChildren()
          .some((g) => g instanceof BossSkeleton && !g.dead);
        if (bossVivo) {
          this.criarEsqueleto(spawnX, spawnY);
        } else {
          this.criarBoss(spawnX, spawnY);
        }
      }
    }
  }
}
