import I18n from '../systems/I18n.js';

// Cena de Pré-carregamento.
// Gere a barra de carregamento inicial, descarrega todos os assets visuais e ficheiros JSON,
// e desenha proceduralmente texturas no canvas (como cordas e velas) para poupar peso de assets.
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const W = this.scale.width, H = this.scale.height;
        
        // Desenha o fundo escuro da barra de progresso
        this.add.rectangle(W/2, H/2, W, H, 0x1a1a2e);
        const fundoBarra = this.add.graphics();
        const barra = this.add.graphics();
        fundoBarra.fillStyle(0x333355).fillRect(W/2-200, H/2-10, 400, 20);
        
        // Atualiza a barra verde conforme o progresso do carregamento (de 0.0 a 1.0)
        this.load.on('progress', v => {
            barra.clear().fillStyle(0x7ec850).fillRect(W/2-200, H/2-10, 400*v, 20);
        });

        this.add.text(W/2, H/2-40, 'A carregar... / Loading...', {
            fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 1. Carrega os ficheiros JSON com dicionários de tradução
        this.load.json('i18n_pt', 'assets/i18n/pt.json');
        this.load.json('i18n_en', 'assets/i18n/en.json');

        // 2. Carrega o mapa em formato Tiled JSON e o respetivo tileset.
        // Adicionamos uma flag de tempo à URL (?v=Date) para forçar o browser a descarregar
        // o mapa mais recente em vez de ler uma versão em cache antiga.
        const versao = Date.now();
        this.load.tilemapTiledJSON('ilha', `assets/tilemaps/ilha.json?v=${versao}`);
        this.load.image('punyworld', `assets/tilesets/punyworld-overworld-tileset.png?v=${versao}`);

        // Diretórios das spritesheets do jogador
        const FW = 96, FH = 64; // Largura e altura de cada frame da spritesheet
        const caminhaHumano = 'assets/spritesheets/human/';

        // 3. Spritesheets do corpo base do jogador
        this.load.spritesheet('player_base_idle',   caminhaHumano+'base_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_walk',   caminhaHumano+'base_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_run',    caminhaHumano+'base_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_hurt',   caminhaHumano+'base_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_death',  caminhaHumano+'base_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_axe',    caminhaHumano+'base_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_base_mining', caminhaHumano+'base_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // 4. Spritesheets correspondentes do cabelo
        this.load.spritesheet('player_hair_idle',   caminhaHumano+'mophair_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_walk',   caminhaHumano+'mophair_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_run',    caminhaHumano+'mophair_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_hurt',   caminhaHumano+'mophair_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_death',  caminhaHumano+'mophair_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_axe',    caminhaHumano+'mophair_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_hair_mining', caminhaHumano+'mophair_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // 5. Spritesheets das ferramentas/armas
        this.load.spritesheet('player_tools_idle',   caminhaHumano+'tools_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_walk',   caminhaHumano+'tools_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_run',    caminhaHumano+'tools_run_strip8.png',     {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_hurt',   caminhaHumano+'tools_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_axe',    caminhaHumano+'tools_axe_strip10.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('player_tools_mining', caminhaHumano+'tools_mining_strip10.png', {frameWidth:FW,frameHeight:FH});

        // 6. Spritesheets do monstro Goblin
        const caminhaGoblin = 'assets/spritesheets/goblin/';
        this.load.spritesheet('goblin_idle',   caminhaGoblin+'spr_idle_strip9.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_walk',   caminhaGoblin+'spr_walk_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_hurt',   caminhaGoblin+'spr_hurt_strip8.png',    {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_death',  caminhaGoblin+'spr_death_strip13.png',  {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('goblin_attack', caminhaGoblin+'spr_attack_strip10.png', {frameWidth:FW,frameHeight:FH});

        // 7. Spritesheets do monstro Esqueleto
        const caminhaEsqueleto = 'assets/spritesheets/skeleton/';
        this.load.spritesheet('skeleton_idle',   caminhaEsqueleto+'skeleton_idle_strip6.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_walk',   caminhaEsqueleto+'skeleton_walk_strip8.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_hurt',   caminhaEsqueleto+'skeleton_hurt_strip7.png',   {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_death',  caminhaEsqueleto+'skeleton_death_strip10.png', {frameWidth:FW,frameHeight:FH});
        this.load.spritesheet('skeleton_attack', caminhaEsqueleto+'skeleton_attack_strip7.png', {frameWidth:FW,frameHeight:FH});

        // 8. Ícones e itens colecionáveis comuns
        ['wood','rock','fish','egg','milk','water'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['carrot','potato','wheat'].forEach(k =>
            this.load.image(k, `assets/images/${k}_00.png`));

        // Ferramentas do inventário
        ['axe','pickaxe','hammer','shovel','sword'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));

        // Assets gráficos da interface
        ['itemdisc_01','itemdisc_02','indicator'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));
        ['greenbar_00','greenbar_06','redbar_00','redbar_06','bluebar_00','bluebar_05'].forEach(k =>
            this.load.image(k, `assets/images/${k}.png`));

        // Elementos decorativos de árvores e jangada
        this.load.spritesheet('spr_deco_tree_01_strip4', 'assets/images/spr_deco_tree_01_strip4.png', {frameWidth: 32, frameHeight: 34});
        this.load.image('spr_deco_coracle_land', 'assets/images/spr_deco_coracle_land.png');
        this.load.image('rope', 'assets/images/basket.png');
        this.load.image('sail', 'assets/images/crate_top.png');
        this.load.image('book', 'assets/images/ui/book_icon.png');
        this.load.image('crate_base', 'assets/images/crate_base.png');

        // Texturas e fundos RPG de UI
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
        
        // Slides cinemáticos da introdução narrativa
        ['intro_veleiro', 'intro_tempestade', 'intro_explosao', 'intro_deriva', 'intro_praia'].forEach(k =>
            this.load.image(k, `assets/intro/${k}.png`));
            
        // Imagens finais da cutscene de vitória
        this.load.image('fim_jangada', 'assets/intro/fim_jangada.jpg');
        this.load.image('fim_happy',   'assets/intro/fim_happy.png');
    }

    create() {
        // Gera dinamicamente uma textura branca de 4x4 pixels chamada 'particle_sq' na cache de texturas do Phaser.
        // Isto permite emitir partículas sem ter de carregar uma imagem externa de 4x4 do servidor.
        const g = this.add.graphics();
        g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
        g.generateTexture('particle_sq', 4, 4);
        g.destroy();

        // Desenha proceduralmente texturas personalizadas em canvas e adiciona-as à cache
        this.gerarTexturaCorda();
        this.gerarTexturaVela();
        this.gerarIconesStatus();

        // Inicializa o sistema de traduções com o dicionário de JSONs carregado
        I18n.init(this.cache);
        
        // Passa para o Menu Principal
        this.scene.start('MenuScene');
    }

    // Desenha uma corda circular realista em tempo real usando elemento HTML Canvas
    gerarTexturaCorda() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#1e0d00';
        ctx.fillRect(0, 0, 24, 24);

        // Borda exterior escura. Parâmetros de arc: (centro X, centro Y, raio, ângulo inicial, ângulo final em radianos)
        ctx.beginPath();
        ctx.arc(12, 12, 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#6b3a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Círculo médio castanho
        ctx.beginPath();
        ctx.arc(12, 12, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#a05c2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Efeito de torção de fibra de corda usando curvas bezier. Parâmetros de bezierCurveTo: (control1X, control1Y, control2X, control2Y, destinoX, destinoY)
        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.bezierCurveTo(18, 3, 21, 8, 21, 12);
        ctx.strokeStyle = '#c47c3e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Miolo da corda
        ctx.beginPath();
        ctx.arc(12, 12, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5e3c';
        ctx.fill();

        // Substitui a imagem placeholder carregada pela textura procedural gerada em Canvas
        this.textures.remove('rope');
        this.textures.addCanvas('rope', c);
    }

    // Desenha uma vela de barco (triângulo náutico num mastro) em Canvas
    gerarTexturaVela() {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, 24, 24);

        // Desenha o mastro da vela. Parâmetros de moveTo/lineTo: (coordenada X, coordenada Y)
        ctx.beginPath();
        ctx.moveTo(5, 22); // Move o cursor para (5, 22)
        ctx.lineTo(5, 2);  // Desenha linha até (5, 2)
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Desenha o pano triangular da vela. Parâmetros de lineTo: (coordenada X, coordenada Y)
        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(21, 10);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fillStyle = '#e8d5b0'; // Cor crua de pano
        ctx.fill();
        ctx.strokeStyle = '#b8a070';
        ctx.lineWidth = 1;
        ctx.stroke();

        this.textures.remove('sail');
        this.textures.addCanvas('sail', c);
    }

    // Desenha pequenos ícones gráficos procedurais para colocar na barra de status da HUD (Coração, Maçã, Gota, Raio)
    gerarIconesStatus() {
        const cores = {
            vida:    '#ff4d4d', // Vermelho
            fome:    '#ffa64d', // Laranja
            sede:    '#3399ff', // Azul
            energia: '#ffcc00', // Amarelo
        };

        for (const [key, color] of Object.entries(cores)) {
            const c = document.createElement('canvas');
            c.width = 10; c.height = 10;
            const ctx = c.getContext('2d');

            ctx.fillStyle = color;
            if (key === 'vida') {
                // Desenha a forma geométrica simplificada de um Coração
                ctx.beginPath();
                ctx.moveTo(5, 8.5);
                ctx.bezierCurveTo(1.5, 6, 0.5, 3.5, 2.5, 1.5);
                ctx.bezierCurveTo(3.8, 0.2, 5, 2, 5, 2);
                ctx.bezierCurveTo(5, 2, 6.2, 0.2, 7.5, 1.5);
                ctx.bezierCurveTo(9.5, 3.5, 8.5, 6, 5, 8.5);
                ctx.fill();
            } else if (key === 'fome') {
                // Desenha uma Maçã / Fruta circular com um pequeno cabo
                ctx.beginPath();
                ctx.arc(5, 5.5, 3.8, 0, Math.PI * 2);
                ctx.fill();
                
                // Pequena folha/cabo verde no topo
                ctx.fillStyle = '#55bb55';
                ctx.fillRect(4.5, 0.5, 1.2, 2);
            } else if (key === 'sede') {
                // Desenha uma Gota de água estilizada
                ctx.beginPath();
                ctx.moveTo(5, 1);
                ctx.bezierCurveTo(1.5, 5, 1, 7, 5, 9.5);
                ctx.bezierCurveTo(9, 7, 8.5, 5, 5, 1);
                ctx.fill();
            } else if (key === 'energia') {
                // Desenha um Raio / Faísca de energia elétrica
                ctx.beginPath();
                ctx.moveTo(6, 1);
                ctx.lineTo(2, 5.5);
                ctx.lineTo(5, 5.5);
                ctx.lineTo(4, 9);
                ctx.lineTo(8, 4.5);
                ctx.lineTo(5, 4.5);
                ctx.closePath();
                ctx.fill();
            }

            // Regista a textura na cache com a chave prefixada 'status_icon_'
            this.textures.addCanvas(`status_icon_${key}`, c);
        }
    }
}
