import I18n from '../systems/I18n.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // ── Barra de progresso ────────────────────────────────────────────────
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W/2, H/2, W, H, 0x1a1a2e);
        const barBg = this.add.graphics();
        const bar   = this.add.graphics();
        barBg.fillStyle(0x333355).fillRect(W/2-200, H/2-10, 400, 20);
        this.load.on('progress', v => {
            bar.clear().fillStyle(0x7ec850).fillRect(W/2-200, H/2-10, 400*v, 20);
        });

        // Texto de loading (atualizado depois do I18n estar carregado — usa PT por omissão)
        this.add.text(W/2, H/2-30, 'A carregar... / Loading...', {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── I18N ──────────────────────────────────────────────────────────────
        this.load.json('i18n_pt', 'assets/i18n/pt.json');
        this.load.json('i18n_en', 'assets/i18n/en.json');

        // ── ÁUDIO ─────────────────────────────────────────────────────────────
        // Sons gerados proceduralmente via Web Audio API (sem ficheiros externos)
        // Serão criados em BootScene. Aqui apenas registamos as chaves via
        // AudioContext para não precisar de ficheiros .mp3/.ogg externos.

        // ── TILEMAP ───────────────────────────────────────────────────────────
        this.load.tilemapTiledJSON('ilha', 'assets/tilemaps/ilha.json');
        this.load.image('sunnyside', 'assets/tilesets/spr_tileset_sunnysideworld_16px.png');

        // ── PLAYER — todos os frames são 96x64 ───────────────────────────────
        const FW = 96, FH = 64;
        const pH = 'assets/spritesheets/human/';

        // Base (corpo)
        this.load.spritesheet('player_base_idle',   pH+'base_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_walk',   pH+'base_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_run',    pH+'base_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_hurt',   pH+'base_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_death',  pH+'base_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_axe',    pH+'base_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_mining', pH+'base_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Cabelo (mophair)
        this.load.spritesheet('player_hair_idle',   pH+'mophair_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_walk',   pH+'mophair_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_run',    pH+'mophair_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_hurt',   pH+'mophair_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_death',  pH+'mophair_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_axe',    pH+'mophair_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_mining', pH+'mophair_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // Ferramentas
        this.load.spritesheet('player_tools_idle',   pH+'tools_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_walk',   pH+'tools_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_run',    pH+'tools_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_hurt',   pH+'tools_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_axe',    pH+'tools_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_mining', pH+'tools_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // ── GOBLIN ────────────────────────────────────────────────────────────
        const pG = 'assets/spritesheets/goblin/';
        this.load.spritesheet('goblin_idle',   pG+'spr_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_walk',   pG+'spr_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_hurt',   pG+'spr_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_death',  pG+'spr_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_attack', pG+'spr_attack_strip10.png', {frameWidth:FW,frameHeight:FH});

        // ── ITENS ─────────────────────────────────────────────────────────────
        ['wood','rock','fish','egg','milk','water'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['carrot','potato','wheat'].forEach(k =>
            this.load.image(k, `assets/images/${k}_00.png`));

        // ── FERRAMENTAS ───────────────────────────────────────────────────────
        ['axe','pickaxe','hammer','shovel','sword'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));

        // ── HUD ───────────────────────────────────────────────────────────────
        ['itemdisc_01','itemdisc_02','indicator'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['greenbar_00','greenbar_06','redbar_00','redbar_06','bluebar_00','bluebar_05'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
    }

    create() {
        // Inicializar o sistema de i18n com os JSONs carregados
        I18n.init(this.cache);
        this.scene.start('MenuScene');
    }
}
