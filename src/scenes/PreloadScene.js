import I18n from '../systems/I18n.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Barra de progresso do carregamento
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W/2, H/2, W, H, 0x1a1a2e);
        const fundoBarra = this.add.graphics();
        const barra = this.add.graphics();
        fundoBarra.fillStyle(0x333355).fillRect(W/2-200, H/2-10, 400, 20);
        
        this.load.on('progress', v => {
            barra.clear().fillStyle(0x7ec850).fillRect(W/2-200, H/2-10, 400*v, 20);
        });

        this.add.text(W/2, H/2-40, 'A carregar... / Loading...', {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Ficheiros de traducao
        this.load.json('i18n_pt', 'assets/i18n/pt.json');
        this.load.json('i18n_en', 'assets/i18n/en.json');

        // Carrega o mapa e o tileset (com versao para evitar cache do browser)
        const versao = Date.now();
        this.load.tilemapTiledJSON('ilha', `assets/tilemaps/ilha.json?v=${versao}`);
        this.load.image('punyworld', `assets/tilesets/punyworld-overworld-tileset.png?v=${versao}`);

        // Spritesheets do jogador
        const FW = 96, FH = 64;
        const caminhaHumano = 'assets/spritesheets/human/';

        // Base do corpo
        this.load.spritesheet('player_base_idle',   caminhaHumano+'base_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_walk',   caminhaHumano+'base_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_run',    caminhaHumano+'base_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_hurt',   caminhaHumano+'base_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_death',  caminhaHumano+'base_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_axe',    caminhaHumano+'base_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_mining', caminhaHumano+'base_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Cabelo
        this.load.spritesheet('player_hair_idle',   caminhaHumano+'mophair_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_walk',   caminhaHumano+'mophair_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_run',    caminhaHumano+'mophair_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_hurt',   caminhaHumano+'mophair_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_death',  caminhaHumano+'mophair_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_axe',    caminhaHumano+'mophair_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_mining', caminhaHumano+'mophair_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Ferramentas
        this.load.spritesheet('player_tools_idle',   caminhaHumano+'tools_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_walk',   caminhaHumano+'tools_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_run',    caminhaHumano+'tools_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_hurt',   caminhaHumano+'tools_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_axe',    caminhaHumano+'tools_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_mining', caminhaHumano+'tools_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Inimigo: Goblin
        const caminhaGoblin = 'assets/spritesheets/goblin/';
        this.load.spritesheet('goblin_idle',   caminhaGoblin+'spr_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_walk',   caminhaGoblin+'spr_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_hurt',   caminhaGoblin+'spr_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_death',  caminhaGoblin+'spr_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_attack', caminhaGoblin+'spr_attack_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Inimigo: Esqueleto
        const caminhaEsqueleto = 'assets/spritesheets/skeleton/';
        this.load.spritesheet('skeleton_idle',   caminhaEsqueleto+'skeleton_idle_strip6.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_walk',   caminhaEsqueleto+'skeleton_walk_strip8.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_hurt',   caminhaEsqueleto+'skeleton_hurt_strip7.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_death',  caminhaEsqueleto+'skeleton_death_strip10.png', {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_attack', caminhaEsqueleto+'skeleton_attack_strip7.png', {frameWidth:FW,frameHeight:FH});

        // Itens
        ['wood','rock','fish','egg','milk','water'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['carrot','potato','wheat'].forEach(k =>
            this.load.image(k, `assets/images/${k}_00.png`));

        // Ferramentas do inventario
        ['axe','pickaxe','hammer','shovel','sword'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));

        // Assets da interface
        ['itemdisc_01','itemdisc_02','indicator'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['greenbar_00','greenbar_06','redbar_00','redbar_06','bluebar_00','bluebar_05'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));

        // Elementos da jangada e outros placeholders
        this.load.spritesheet('spr_deco_tree_01_strip4', 'assets/images/spr_deco_tree_01_strip4.png', {frameWidth: 32, frameHeight: 34});
        this.load.image('spr_deco_coracle_land', 'assets/images/spr_deco_coracle_land.png');
        this.load.image('rope', 'assets/images/basket.png');
        this.load.image('sail', 'assets/images/crate_top.png');
        this.load.image('book', 'assets/images/ui/book_icon.png');
        this.load.image('crate_base', 'assets/images/crate_base.png');

        // Assets de UI RPG
        this.load.image('book_bg', 'assets/images/ui/book_bg.png');
        this.load.image('panel_brown', 'assets/images/ui/panel_brown.png');
        this.load.spritesheet('icons', 'assets/images/ui/icons.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('menu_scroll', 'assets/images/ui/menu_scroll.png');
        this.load.image('panel_rpg', 'assets/images/ui/panel_rpg.png');
        this.load.image('scroll_rpg', 'assets/images/ui/scroll_rpg.png?v=1');
        this.load.image('parchment_rpg', 'assets/images/ui/parchment_rpg.png');
        this.load.image('panel_win_loose', 'assets/images/ui/panel_win_loose.png');
        this.load.image('sound_on', 'assets/images/ui/sound_on.png');
        this.load.image('sound_off', 'assets/images/ui/sound_off.png');
        
        // Slides da introducao
        ['intro_veleiro', 'intro_tempestade', 'intro_explosao', 'intro_deriva', 'intro_praia'].forEach(k =>
            this.load.image(k, `assets/intro/${k}.png`));
            
        this.load.image('fim_jangada', 'assets/intro/fim_jangada.jpg');
        this.load.image('fim_happy',   'assets/intro/fim_happy.png');
    }

    create() {
        // Textura base branca para particulas
        const g = this.add.graphics();
        g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
        g.generateTexture('particle_sq', 4, 4);
        g.destroy();

        // Gera texturas procedurais
        this.gerarTexturaCorda();
        this.gerarTexturaVela();
        this.gerarIconesStatus();

        I18n.init(this.cache);
        this.scene.start('MenuScene');
    }

    // Desenha uma corda procedural no canvas do browser
    gerarTexturaCorda() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#1e0d00';
        ctx.fillRect(0, 0, 24, 24);

        ctx.beginPath();
        ctx.arc(12, 12, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#6b3a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(12, 12, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#a05c2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.bezierCurveTo(18, 3, 21, 8, 21, 12);
        ctx.strokeStyle = '#c47c3e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(12, 12, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5e3c';
        ctx.fill();

        this.textures.remove('rope');
        this.textures.addCanvas('rope', c);
    }

    // Desenha uma vela de barco procedural no canvas
    gerarTexturaVela() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, 24, 24);

        ctx.beginPath();
        ctx.moveTo(5, 22);
        ctx.lineTo(5, 2);
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(21, 10);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fillStyle = '#e8d5b0';
        ctx.fill();
        ctx.strokeStyle = '#b8a070';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(21, 10);
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        this.textures.remove('sail');
        this.textures.addCanvas('sail', c);
    }

    // Gera os icones do jogador (coracao, maca, gota e raio)
    gerarIconesStatus() {
        const S = 12;

        // Coracao
        {
            const c = document.createElement('canvas'); c.width = S; c.height = S;
            const x = c.getContext('2d');
            x.fillStyle = '#dd2222';
            x.beginPath();
            x.moveTo(6, 10);
            x.bezierCurveTo(2, 7, 0, 5, 0, 3);
            x.bezierCurveTo(0, 1, 2, 0, 4, 0);
            x.bezierCurveTo(5, 0, 6, 2, 6, 2);
            x.bezierCurveTo(6, 2, 7, 0, 8, 0);
            x.bezierCurveTo(10, 0, 12, 1, 12, 3);
            x.bezierCurveTo(12, 5, 10, 7, 6, 10);
            x.closePath();
            x.fill();
            x.fillStyle = '#ff6666';
            x.beginPath(); x.arc(3.5, 3, 1.5, 0, Math.PI * 2); x.fill();
            this.textures.addCanvas('stat_health', c);
        }

        // Maca
        {
            const c = document.createElement('canvas'); c.width = S; c.height = S;
            const x = c.getContext('2d');
            x.fillStyle = '#cc4400';
            x.beginPath(); x.arc(6, 7, 5, 0, Math.PI * 2); x.fill();
            x.fillStyle = '#ff7744';
            x.beginPath(); x.arc(4.5, 5.5, 2.5, 0, Math.PI * 2); x.fill();
            x.fillStyle = '#663300';
            x.fillRect(5, 1, 2, 3);
            x.fillStyle = '#33aa33';
            x.beginPath(); x.ellipse(8.5, 2.5, 2.5, 1.2, -0.4, 0, Math.PI * 2); x.fill();
            this.textures.addCanvas('stat_hunger', c);
        }

        // Gota de agua
        {
            const c = document.createElement('canvas'); c.width = S; c.height = S;
            const x = c.getContext('2d');
            x.fillStyle = '#1a66cc';
            x.beginPath();
            x.moveTo(6, 11);
            x.bezierCurveTo(0, 8, 0, 4, 6, 1);
            x.bezierCurveTo(12, 4, 12, 8, 6, 11);
            x.closePath();
            x.fill();
            x.fillStyle = '#66bbff';
            x.beginPath(); x.arc(4, 5, 1.5, 0, Math.PI * 2); x.fill();
            this.textures.addCanvas('stat_thirst', c);
        }

        // Raio
        {
            const c = document.createElement('canvas'); c.width = S; c.height = S;
            const x = c.getContext('2d');
            x.fillStyle = '#cc9900';
            x.beginPath();
            x.moveTo(9, 0); x.lineTo(5, 0); x.lineTo(5, 5);
            x.lineTo(3, 5); x.lineTo(7, 12); x.lineTo(7, 7);
            x.lineTo(9, 7); x.closePath();
            x.fill();
            x.fillStyle = '#ffee44';
            x.beginPath();
            x.moveTo(9, 0); x.lineTo(6, 0); x.lineTo(6, 5);
            x.lineTo(5, 5); x.closePath();
            x.fill();
            this.textures.addCanvas('stat_energy', c);
        }
    }
}
