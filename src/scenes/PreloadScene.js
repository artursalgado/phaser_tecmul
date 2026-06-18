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

        this.add.text(W/2, H/2-40, 'A carregar... / Loading...', {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── I18N ──────────────────────────────────────────────────────────────
        this.load.json('i18n_pt', 'assets/i18n/pt.json');
        this.load.json('i18n_en', 'assets/i18n/en.json');

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

        // ── SKELETON (segundo tipo de inimigo) ────────────────────────────────
        const pS = 'assets/spritesheets/skeleton/';
        this.load.spritesheet('skeleton_idle',   pS+'skeleton_idle_strip6.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_walk',   pS+'skeleton_walk_strip8.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_hurt',   pS+'skeleton_hurt_strip7.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_death',  pS+'skeleton_death_strip10.png', {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_attack', pS+'skeleton_attack_strip7.png', {frameWidth:FW,frameHeight:FH});

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

        // ── JANGADA (EPIC de fuga) ───────────────────────────────────────────
        // Árvore para cortar (spritesheet com 4 frames, usamos só o frame 0)
        this.load.spritesheet('spr_deco_tree_01_strip4', 'assets/images/spr_deco_tree_01_strip4.png', {frameWidth: 32, frameHeight: 34});
        // Destroços/jangada encalhada (imagem única, sem animação)
        this.load.image('spr_deco_coracle_land', 'assets/images/spr_deco_coracle_land.png');
        // Ícones placeholder para os itens novos (corda e vela ainda não têm arte própria)
        this.load.image('rope', 'assets/images/basket.png');
        this.load.image('sail', 'assets/images/crate_top.png');
        this.load.image('book', 'assets/images/ui/book_icon.png');
        // Baú de destroços na praia oposta (usa a mesma imagem do crate normal)
        this.load.image('crate_base', 'assets/images/crate_base.png');

        // ── NOVOS ASSETS UI (RPG UI / Books) ──────────────────────────────────
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
        this.load.image('intro_praia', 'assets/intro/intro_praia.png');
    }

    create() {
        // Textura 4×4 branca para o sistema de partículas (tintada em runtime)
        const g = this.add.graphics();
        g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
        g.generateTexture('particle_sq', 4, 4);
        g.destroy();

        // Substituir placeholders rope/sail por pixel-art procedural
        this._generateRopeTexture();
        this._generateSailTexture();
        this._generateStatIcons();

        I18n.init(this.cache);
        this.scene.start('MenuScene');
    }

    _generateRopeTexture() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        // Fundo escuro
        ctx.fillStyle = '#1e0d00';
        ctx.fillRect(0, 0, 24, 24);

        // Anel exterior da corda
        ctx.beginPath();
        ctx.arc(12, 12, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#6b3a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Anel interior
        ctx.beginPath();
        ctx.arc(12, 12, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#a05c2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ponta da corda
        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.bezierCurveTo(18, 3, 21, 8, 21, 12);
        ctx.strokeStyle = '#c47c3e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Nó central
        ctx.beginPath();
        ctx.arc(12, 12, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5e3c';
        ctx.fill();

        this.textures.remove('rope');
        this.textures.addCanvas('rope', c);
    }

    _generateSailTexture() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        // Fundo azul-escuro
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, 24, 24);

        // Mastro
        ctx.beginPath();
        ctx.moveTo(5, 22);
        ctx.lineTo(5, 2);
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vela (triângulo)
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

        // Linha de tensão da vela
        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(21, 10);
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        this.textures.remove('sail');
        this.textures.addCanvas('sail', c);
    }

    _generateStatIcons() {
        const S = 12;

        // ── Vida — coração vermelho ────────────────────────────────────────
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

        // ── Fome — maçã laranja ───────────────────────────────────────────
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

        // ── Sede — gota azul ──────────────────────────────────────────────
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

        // ── Energia — raio amarelo ─────────────────────────────────────────
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
