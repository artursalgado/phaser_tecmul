export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Barra de progresso simples
        const bar = this.add.graphics();
        const barBg = this.add.graphics();
        barBg.fillStyle(0x222222).fillRect(280, 295, 400, 20);
        this.load.on('progress', (v) => {
            bar.clear().fillStyle(0x7ec850).fillRect(282, 297, 396 * v, 16);
        });
        this.add.text(480, 270, 'A carregar...', {
            fontSize: '20px', fill: '#ffffff'
        }).setOrigin(0.5);

        //------------------------------------------------------------
        // MAPA
        //------------------------------------------------------------
        this.load.tilemapTiledJSON('ilha', 'assets/tilemaps/ilha.json');
        this.load.image('sunnyside', 'assets/tilesets/spr_tileset_sunnysideworld_16px.png');

        //------------------------------------------------------------
        // PLAYER — corpo (base)
        //------------------------------------------------------------
        // frame size: 48x48 para os spritesheets humanos (strip × frames)
        const pBase = 'assets/spritesheets/human/';
        const pHair = 'assets/spritesheets/human/';

        this.load.spritesheet('player_base_idle',   pBase + 'base_idle_strip9.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_walk',   pBase + 'base_walk_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_run',    pBase + 'base_run_strip8.png',    { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_hurt',   pBase + 'base_hurt_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_death',  pBase + 'base_death_strip13.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_axe',    pBase + 'base_axe_strip10.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_base_mining', pBase + 'base_mining_strip10.png',{ frameWidth: 48, frameHeight: 48 });

        //------------------------------------------------------------
        // PLAYER — cabelo (mophair)
        //------------------------------------------------------------
        this.load.spritesheet('player_hair_idle',   pHair + 'mophair_idle_strip9.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_walk',   pHair + 'mophair_walk_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_run',    pHair + 'mophair_run_strip8.png',    { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_hurt',   pHair + 'mophair_hurt_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_death',  pHair + 'mophair_death_strip13.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_axe',    pHair + 'mophair_axe_strip10.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_hair_mining', pHair + 'mophair_mining_strip10.png',{ frameWidth: 48, frameHeight: 48 });

        //------------------------------------------------------------
        // PLAYER — ferramentas (tools)
        //------------------------------------------------------------
        this.load.spritesheet('player_tools_idle',   pBase + 'tools_idle_strip9.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_tools_walk',   pBase + 'tools_walk_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_tools_run',    pBase + 'tools_run_strip8.png',    { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_tools_hurt',   pBase + 'tools_hurt_strip8.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_tools_axe',    pBase + 'tools_axe_strip10.png',   { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('player_tools_mining', pBase + 'tools_mining_strip10.png',{ frameWidth: 48, frameHeight: 48 });

        //------------------------------------------------------------
        // GOBLIN
        //------------------------------------------------------------
        const pGob = 'assets/spritesheets/goblin/';
        this.load.spritesheet('goblin_idle',  pGob + 'spr_idle_strip9.png',  { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('goblin_walk',  pGob + 'spr_walk_strip8.png',  { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('goblin_hurt',  pGob + 'spr_hurt_strip8.png',  { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('goblin_death', pGob + 'spr_death_strip13.png',{ frameWidth: 48, frameHeight: 48 });

        //------------------------------------------------------------
        // RECURSOS E ITENS COLECIONÁVEIS
        //------------------------------------------------------------
        this.load.image('wood',       'assets/images/wood.png');
        this.load.image('rock',       'assets/images/rock.png');
        this.load.image('fish',       'assets/images/fish.png');
        this.load.image('egg',        'assets/images/egg.png');
        this.load.image('milk',       'assets/images/milk.png');
        this.load.image('water',      'assets/images/water.png');
        this.load.image('carrot_00',  'assets/images/carrot_00.png');
        this.load.image('potato_00',  'assets/images/potato_00.png');
        this.load.image('wheat_00',   'assets/images/wheat_00.png');

        //------------------------------------------------------------
        // FERRAMENTAS
        //------------------------------------------------------------
        this.load.image('axe',     'assets/images/axe.png');
        this.load.image('pickaxe', 'assets/images/pickaxe.png');
        this.load.image('hammer',  'assets/images/hammer.png');
        this.load.image('shovel',  'assets/images/shovel.png');
        this.load.image('sword',   'assets/images/sword.png');

        //------------------------------------------------------------
        // INTERFACE (HUD)
        //------------------------------------------------------------
        this.load.image('itemdisc_01', 'assets/images/itemdisc_01.png');
        this.load.image('itemdisc_02', 'assets/images/itemdisc_02.png');
        this.load.image('greenbar_00', 'assets/images/greenbar_00.png');
        this.load.image('greenbar_06', 'assets/images/greenbar_06.png');
        this.load.image('redbar_00',   'assets/images/redbar_00.png');
        this.load.image('redbar_06',   'assets/images/redbar_06.png');
        this.load.image('bluebar_00',  'assets/images/bluebar_00.png');
        this.load.image('bluebar_05',  'assets/images/bluebar_05.png');
        this.load.image('indicator',   'assets/images/indicator.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
