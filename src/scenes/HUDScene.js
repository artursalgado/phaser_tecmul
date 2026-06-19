import { ITEM_DB } from '../systems/Inventory.js';
import I18n from '../systems/I18n.js';

// A classe HUDScene gere toda a Interface Gráfica do Utilizador (GUI) que sobrepõe o ecrã do jogo.
// Funciona em paralelo com a GameScene para desenhar barras de status, hotbar, temporizadores,
// registos de quests, diário do náufrago e o minimapa procedural.
export default class HUDScene extends Phaser.Scene {
    constructor() {
        super('HUDScene');
    }

    create() {
        // Obtém referências diretas dos sistemas principais criados na GameScene
        this.gameScene = this.scene.get('GameScene');
        this.inventory = this.gameScene.inventory;
        this.stats = this.gameScene.stats;
        this.quest = this.gameScene.quest;

        const W = this.scale.width;
        const H = this.scale.height;

        // Inicializa todas as secções da interface de forma modular e limpa
        this.criarHotbar(W, H);
        this.criarBarrasStats();
        this.criarPainelQuestTimer(W, H);
        this.criarQuestLog(W, H);
        this.criarDiarioNaufrago(W, H);
        this.criarOverlayAlertaVida(W, H);
        this.criarMinimap(W, H);

        // Associa os ouvintes de eventos do inventário e status para atualizar a GUI dinamicamente
        this.inventory.on('changed',          this.atualizarHotbar, this);
        this.inventory.on('selectionChanged', this.atualizarHotbar, this);
        this.stats.on('changed',              this.atualizarBarrasStats, this);

        if (this.quest) {
            this.quest.on('partDelivered',  this.atualizarQuest, this);
            this.quest.on('penaltyApplied', this.atualizarQuest, this);
            this.game.events.on('quest:updated', this.atualizarQuest, this);
            this.inventory.on('changed', this.atualizarQuest, this);
        }

        // Eventos disparados pelo teclado na GameScene para alternar janelas na HUD
        this.gameScene.events.on('toggleQuestLog', this.alternarQuestLog, this);
        this.gameScene.events.on('openBook', this.alternarDiario, this);
        this.gameScene.events.on('waveChanged', this.onMudancaVaga, this);

        // Executa a primeira atualização visual inicial de dados
        this.atualizarHotbar();
        this.atualizarBarrasStats();
        if (this.quest) this.atualizarQuest();
        this.onMudancaVaga(this.gameScene.waveNumber || 0);
    }

    // Cria a barra inferior de atalhos rápidos (Hotbar) de 8 slots
    criarHotbar(W, H) {
        this.slotBgs   = [];
        this.slotIcons = [];
        this.slotTexts = [];

        const tamanhoSlot = 18 * 3; // Escala ampliada dos discos de slot
        const espacamento = 6;
        const HOTBAR_TAMANHO = 8;
        const larguraTotal = HOTBAR_TAMANHO * tamanhoSlot + (HOTBAR_TAMANHO - 1) * espacamento;
        const hotbarX = (W - larguraTotal) / 2 + tamanhoSlot / 2; // Posição X inicial centralizada
        const hotbarY = H - 38;

        // Fundo do painel da Hotbar com estilo de caixa de madeira RPG
        const larguraFundo = larguraTotal + 28;
        const graficoHotbar = this.add.graphics().setDepth(0);
        
        // Sombra
        graficoHotbar.fillStyle(0x000000, 0.3);
        graficoHotbar.fillRoundedRect(W / 2 - larguraFundo / 2 + 3, hotbarY - 47, larguraFundo, 82, 8);
        
        // Fundo castanho escuro e borda dourada
        graficoHotbar.fillStyle(0x160a00, 0.92);
        graficoHotbar.fillRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
        graficoHotbar.lineStyle(1.5, 0xc8901a, 0.72);
        graficoHotbar.strokeRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
        
        graficoHotbar.lineStyle(1, 0x6b3a1a, 0.5);
        graficoHotbar.lineBetween(W / 2 - larguraFundo / 2 + 12, hotbarY - 30, W / 2 + larguraFundo / 2 - 12, hotbarY - 30);

        // Desenha dicas rápidas de teclas por cima da Hotbar
        const textoDica = I18n.lang === 'pt'
            ? '[E] usar   ·   [Q] jangada   ·   [I] inventário   ·   [M] mapa'
            : '[E] use   ·   [Q] raft   ·   [I] inventory   ·   [M] map';
            
        this.add.text(W / 2, hotbarY - 40, textoDica, {
            fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);

        // Instancia os 8 slots visuais
        for (let i = 0; i < HOTBAR_TAMANHO; i++) {
            const x = hotbarX + i * (tamanhoSlot + espacamento);

            // Fundo circular do slot
            const bg = this.add.image(x, hotbarY, 'itemdisc_01').setScale(3).setDepth(1);
            // Ícone do item no slot (inicialmente oculto)
            const icon = this.add.image(x, hotbarY, 'wood').setScale(2.5).setVisible(false).setDepth(2);
            // Texto de quantidade empilhada
            const text = this.add.text(x + 18, hotbarY + 18, '', {
                fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 1).setDepth(3);

            // Número correspondente da tecla de atalho (1 a 8) no topo esquerdo do slot
            this.add.text(x - 20, hotbarY - 22, String(i + 1), {
                fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0, 0).setDepth(3);

            this.slotBgs.push(bg);
            this.slotIcons.push(icon);
            this.slotTexts.push(text);
        }

        // Texto flutuante que exibe o nome do item selecionado por cima da Hotbar
        this.labelItemSelecionado = this.add.text(W / 2, hotbarY - 64, '', {
            fontSize: '11px', fill: '#f5e0b0', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(3);
    }

    // Configura o painel superior esquerdo com as 4 barras de status vitais (Vida, Fome, Sede, Energia)
    criarBarrasStats() {
        this.layoutStats = {
            barX: 28, barW: 112, barH: 8,
            textX: 144,
            iconX: 16,
            rows: [16, 35, 54, 73], // Coordenadas Y para cada uma das 4 barras
        };
        const LS = this.layoutStats;

        // Fundo do painel de status
        const painelFundo = this.add.graphics().setDepth(1);
        painelFundo.fillStyle(0x000000, 0.35);
        painelFundo.fillRoundedRect(6, 6, 178, 90, 6);
        painelFundo.fillStyle(0x160a00, 0.92);
        painelFundo.fillRoundedRect(6, 6, 178, 90, 6);
        painelFundo.lineStyle(1.5, 0xc8901a, 0.72);
        painelFundo.strokeRoundedRect(6, 6, 178, 90, 6);

        // Desenha as calhas vazias das barras (fundos escuros)
        LS.rows.forEach(y => {
            painelFundo.fillStyle(0x070300, 0.9);
            painelFundo.fillRoundedRect(LS.barX, y, LS.barW, LS.barH, 4);
        });

        this.graficoPreenchimentoStats = this.add.graphics().setDepth(2);

        // Instancia os ícones procedurais gerados no PreloadScene
        [
            { key: 'status_icon_vida',    y: LS.rows[0] },
            { key: 'status_icon_fome',    y: LS.rows[1] },
            { key: 'status_icon_sede',    y: LS.rows[2] },
            { key: 'status_icon_energia', y: LS.rows[3] },
        ].forEach(({ key, y }) => {
            this.add.image(LS.iconX, y + LS.barH / 2, key)
                .setDisplaySize(12, 12).setOrigin(0.5).setDepth(3);
        });

        // Textos descritivos de percentagem ao lado das barras
        this.healthTxt = this.add.text(LS.textX, LS.rows[0] - 1, '', { fontSize: '9px', fill: '#ffaaaa' }).setDepth(3);
        this.hungerTxt = this.add.text(LS.textX, LS.rows[1] - 1, '', { fontSize: '9px', fill: '#ffddaa' }).setDepth(3);
        this.thirstTxt = this.add.text(LS.textX, LS.rows[2] - 1, '', { fontSize: '9px', fill: '#aaddff' }).setDepth(3);
        this.energyTxt = this.add.text(LS.textX, LS.rows[3] - 1, '', { fontSize: '9px', fill: '#ccffaa' }).setDepth(3);
    }

    // Configura o painel superior direito com o progresso da jangada, cronómetro de jogo e estatísticas gerais
    criarPainelQuestTimer(W, H) {
        const QPX  = W - 8 - 168; // Alinhado à direita
        const QPY  = 8;
        const QPW  = 168;
        const QPH  = 130;
        const QPHH = 22; // Cabeçalho do painel
        const QSEP = 96; // Linha divisória interna

        const graficoQuest = this.add.graphics().setDepth(2);
        
        // Sombra
        graficoQuest.fillStyle(0x000000, 0.35);
        graficoQuest.fillRoundedRect(QPX + 4, QPY + 4, QPW, QPH, 6);
        
        // Fundo castanho escuro e borda dourada
        graficoQuest.fillStyle(0x160a00, 0.92);
        graficoQuest.fillRoundedRect(QPX, QPY, QPW, QPH, 6);
        graficoQuest.lineStyle(1.5, 0xc8901a, 0.72);
        graficoQuest.strokeRoundedRect(QPX, QPY, QPW, QPH, 6);
        
        // Cabeçalho escuro do painel
        graficoQuest.fillStyle(0x3d1a00, 1);
        graficoQuest.fillRoundedRect(QPX, QPY, QPW, QPHH, { tl: 6, tr: 6, bl: 0, br: 0 });
        
        graficoQuest.lineStyle(1, 0xc8901a, 0.6);
        graficoQuest.lineBetween(QPX + 8, QPY + QPHH, QPX + QPW - 8, QPY + QPHH);
        
        graficoQuest.lineStyle(1, 0x6b3a1a, 0.5);
        graficoQuest.lineBetween(QPX + 8, QSEP, QPX + QPW - 8, QSEP);

        this.add.text(QPX + QPW / 2, QPY + QPHH / 2, 'JANGADA  [F]', {
            fontSize: '9px', fill: '#f5c070', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        // Cronómetro de tempo decorrido
        this.timerTxt = this.add.text(QPX + QPW / 2 + 8, QSEP + 6, '0:00', {
            fontSize: '13px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(3);

        // Ícone de Sol/Lua do ciclo dia/noite
        this.dayNightIcon = this.add.text(QPX + QPW / 2 - 12, QSEP + 6, '☀️', {
            fontSize: '13px'
        }).setOrigin(0.5, 0).setDepth(3);

        // Pontuação atual
        this.scoreTxt = this.add.text(QPX + 10, QSEP + 24, '0 pts', {
            fontSize: '10px', fill: '#ffdd44'
        }).setOrigin(0, 0).setDepth(3);

        // Wave atual
        this.waveTxt = this.add.text(QPX + QPW / 2, QSEP + 24, 'WAVE 0', {
            fontSize: '10px', fill: '#ffaa66', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(3);

        // Número de inimigos abatidos
        this.killsTxt = this.add.text(QPX + QPW - 10, QSEP + 24, '☠ 0', {
            fontSize: '10px', fill: '#ff8888'
        }).setOrigin(1, 0).setDepth(3);

        // Configuração visual dos retângulos de progresso de cada recurso
        const SLOT_CONFIG = {
            wood: { color: 0x88cc44, emptyColor: 0x334411, slots: 5 }, // 5 madeiras necessárias
            rope: { color: 0xddaa44, emptyColor: 0x443311, slots: 3 }, // 3 cordas necessárias
            sail: { color: 0x44bbff, emptyColor: 0x112233, slots: 1 }, // 1 vela necessária
        };
        const SLOT_TAMANHO = 11;
        const SLOT_GAP = 3;
        const SLOT_DIREITA = QPX + QPW - 8;

        this.raftSlots = {};

        // Cria os quadradinhos de progresso vazios para preenchermos depois
        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const rowCY = QPY + QPHH + 11 + i * 22;
                const cfg = SLOT_CONFIG[p.id] || { color: 0xffffff, emptyColor: 0x333333, slots: 1 };
                const total = cfg.slots;

                // Desenha a imagem miniatura do recurso
                this.add.image(QPX + 10, rowCY, p.id).setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(3);

                // Nome do recurso
                this.add.text(QPX + 28, rowCY, p.label, { fontSize: '9px', fill: '#ccbb88' })
                    .setOrigin(0, 0.5).setDepth(3);

                // Desenha a série de retângulos vazios correspondentes à quantidade necessária
                const rects = [];
                for (let s = 0; s < total; s++) {
                    const sx = SLOT_DIREITA - (total - 1 - s) * (SLOT_TAMANHO + SLOT_GAP);
                    const r = this.add.rectangle(sx, rowCY, SLOT_TAMANHO, SLOT_TAMANHO, cfg.emptyColor)
                        .setStrokeStyle(1, 0x665533).setDepth(3);
                    rects.push(r);
                }
                this.raftSlots[p.id] = { rects, cfg };
            });
        }
    }

    // Configura o painel detalhado de missões (Quest Log) que abre ao premir 'Q'
    criarQuestLog(W, H) {
        // Informações sobre onde encontrar cada recurso
        this.infoZonas = {
            wood: { fonte: 'Cortar árvores (ESPAÇO)', zona: 'Floresta' },
            rope: { fonte: 'Destroços / baús',         zona: 'Praia oposta' },
            sail: { fonte: 'Drop do boss skeleton',    zona: 'Zona rochosa' },
        };

        this.questLogAberto = false;
        this.questLogGroup = this.add.group(); // Agrupa elementos para ocultar/mostrar em bloco

        const painelW = 360, painelH = 220;
        const cx = W / 2 - painelW / 2;
        const cy = H / 2 - painelH / 2;
        const HEADER_H = 28;

        // Fundo do Quest Log
        const graficoFundoLog = this.add.graphics().setDepth(60).setScrollFactor(0).setVisible(false);
        
        graficoFundoLog.fillStyle(0x000000, 0.35);
        graficoFundoLog.fillRoundedRect(cx + 4, cy + 4, painelW, painelH, 6);
        
        graficoFundoLog.fillStyle(0x160a00, 0.92);
        graficoFundoLog.fillRoundedRect(cx, cy, painelW, painelH, 6);
        
        graficoFundoLog.lineStyle(1.5, 0xc8901a, 0.72);
        graficoFundoLog.strokeRoundedRect(cx, cy, painelW, painelH, 6);
        
        graficoFundoLog.fillStyle(0x3d1a00, 1);
        graficoFundoLog.fillRoundedRect(cx, cy, painelW, HEADER_H, { tl: 6, tr: 6, bl: 0, br: 0 });
        
        graficoFundoLog.lineStyle(1, 0xc8901a, 0.6);
        graficoFundoLog.lineBetween(cx + 8, cy + HEADER_H, cx + painelW - 8, cy + HEADER_H);

        const titulo = this.add.text(cx + painelW / 2, cy + HEADER_H / 2,
            'REGISTO DA JANGADA', { fontSize: '11px', fill: '#f5c070', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);

        const dicaFechar = this.add.text(W / 2, H / 2 + painelH / 2 - 14,
            '[Q] fechar', { fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);

        this.questLogGroup.addMultiple([graficoFundoLog, titulo, dicaFechar]);
        this.linhasQuestLog = [];

        // Constrói as linhas detalhadas com descrição de onde obter cada recurso
        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const y = H / 2 - painelH / 2 + 48 + i * 50;
                const z = this.infoZonas[p.id] || { fonte: '?', zona: '?' };

                const iconX = W / 2 - painelW / 2 + 20;
                const img = this.add.image(iconX, y, p.id)
                    .setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                const labelX = iconX + 22;
                const head = this.add.text(labelX, y, p.label, { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' })
                    .setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                const prog = this.add.text(W / 2 + painelW / 2 - 20, y, '', { fontSize: '13px', fill: '#cccccc', fontStyle: 'bold' })
                    .setOrigin(1, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                const sub = this.add.text(iconX, y + 18, `${z.fonte} · ${z.zona}`, { fontSize: '10px', fill: '#8899aa' })
                    .setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                this.questLogGroup.addMultiple([img, head, prog, sub]);
                this.linhasQuestLog.push({ id: p.id, head, prog, sub });
            });
        }
    }

    // Configura o Diário do Náufrago (Livro de histórias/lore) que abre ao ler o diário no inventário
    criarDiarioNaufrago(W, H) {
        this.bookOpen = false;
        this.pagDiario = 0;
        this.bookGroup = this.add.group();

        const livroW = 600, livroH = 400;
        const cx = W / 2, cy = H / 2;
        const D = 80;  // Profundidade visual alta para sobrepor todos os outros painéis
        const HEADER_H = 44;

        // Fundo escuro desfocado bloqueador
        this.diarioDim = this.add.rectangle(cx, cy, W, H, 0x000000, 0.72)
            .setDepth(D).setVisible(false);

        // Cria os gráficos do livro
        this.diarioGrafico = this.add.graphics().setDepth(D + 1).setVisible(false);
        this.desenharGraficosDiario(cx, cy, livroW, livroH, HEADER_H);

        // Título da página do livro
        this.diarioTitulo = this.add.text(cx, cy - livroH / 2 + HEADER_H / 2 + 2, '', {
            fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f5e0b0', fontStyle: 'bold italic', align: 'center',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        this.diarioDivGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);

        const larguraPagina = livroW / 2 - 50;
        const textoY = cy - livroH / 2 + HEADER_H + 16;
        const esquerdaX = cx - livroW / 2 + 28;
        const direitaX = cx + 14;

        // Texto da página esquerda do livro
        this.diarioTextoEsquerda = this.add.text(esquerdaX, textoY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px', color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: larguraPagina },
        }).setDepth(D + 2).setVisible(false);

        // Texto da página direita do livro
        this.diarioTextoDireita = this.add.text(direitaX, textoY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px', color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: larguraPagina },
        }).setDepth(D + 2).setVisible(false);

        // Número da página dupla (ex: "Pág. 1-2") no fundo
        this.diarioNumeroPagina = this.add.text(cx, cy + livroH / 2 - 18, '', {
            fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8b6e3a', align: 'center', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // Posicionamento dos botões de virar a página
        const navY = cy + livroH / 2 - 18;
        const larguraBotao = 48, alturaBotao = 24;
        const prevX = cx - livroW / 2 + 38;
        const nextX = cx + livroW / 2 - 38;

        // Botão Página Anterior
        this.diarioBtnAnteriorGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);
        this.diarioBtnAnteriorTexto = this.add.text(prevX, navY, '◀', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        
        this.diarioBtnAnteriorZona = this.add.zone(prevX, navY, larguraBotao, alturaBotao)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this.diarioBtnAnteriorZona.on('pointerover',  () => this.hoverBotaoNavegacao('prev', true));
        this.diarioBtnAnteriorZona.on('pointerout',   () => this.hoverBotaoNavegacao('prev', false));
        this.diarioBtnAnteriorZona.on('pointerdown',  () => this.virarPaginaDiario(-1));

        // Botão Página Seguinte
        this.diarioBtnSeguinteGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);
        this.diarioBtnSeguinteTexto = this.add.text(nextX, navY, '▶', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        
        this.diarioBtnSeguinteZona = this.add.zone(nextX, navY, larguraBotao, alturaBotao)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this.diarioBtnSeguinteZona.on('pointerover',  () => this.hoverBotaoNavegacao('next', true));
        this.diarioBtnSeguinteZona.on('pointerout',   () => this.hoverBotaoNavegacao('next', false));
        this.diarioBtnSeguinteZona.on('pointerdown',  () => this.virarPaginaDiario(1));

        // Dica de rodapé de como fechar
        this.diarioDicaFechar = this.add.text(cx, cy + livroH / 2 + 16, '', {
            fontFamily: 'Georgia, serif', fontSize: '10px', color: '#7a6040', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // Agrupa tudo para fácil manipulação
        this.bookGroup.addMultiple([
            this.diarioDim, this.diarioGrafico, this.diarioDivGrafico,
            this.diarioTitulo, this.diarioTextoEsquerda, this.diarioTextoDireita,
            this.diarioNumeroPagina,
            this.diarioBtnAnteriorGrafico, this.diarioBtnAnteriorTexto, this.diarioBtnAnteriorZona,
            this.diarioBtnSeguinteGrafico, this.diarioBtnSeguinteTexto, this.diarioBtnSeguinteZona,
            this.diarioDicaFechar,
        ]);

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.bookOpen) this.alternarDiario();
        });
    }

    // Desenha em detalhes o aspeto físico do livro de pergaminho aberto (lombada, linhas de pauta e dobras)
    desenharGraficosDiario(cx, cy, livroW, livroH, headerH) {
        const g = this.diarioGrafico;
        g.clear();
        const r = 10;

        // Sombra
        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(cx - livroW/2 + 10, cy - livroH/2 + 10, livroW, livroH, r);

        // Capa do livro castanha
        g.fillStyle(0x5c2e00, 1);
        g.fillRoundedRect(cx - livroW/2, cy - livroH/2, livroW, livroH, r);

        g.lineStyle(2, 0xc8901a, 0.7);
        g.strokeRoundedRect(cx - livroW/2 + 1, cy - livroH/2 + 1, livroW - 2, livroH - 2, r);

        // Faixa de cabeçalho
        g.fillStyle(0x3d1a00, 0.9);
        g.fillRoundedRect(cx - livroW/2, cy - livroH/2, livroW, headerH, { tl: r, tr: r, bl: 0, br: 0 });

        g.lineStyle(3, 0xc8901a, 0.9);
        g.lineBetween(cx - livroW/2, cy - livroH/2 + headerH, cx + livroW/2, cy - livroH/2 + headerH);

        // Marcador central dourado no topo da lombada
        g.fillStyle(0xc8901a, 1);
        g.fillTriangle(cx - 16, cy - livroH/2 + headerH, cx, cy - livroH/2 + headerH - 8, cx + 16, cy - livroH/2 + headerH);
        g.fillTriangle(cx - 16, cy - livroH/2 + headerH, cx, cy - livroH/2 + headerH + 8, cx + 16, cy - livroH/2 + headerH);

        // Lombada central escura
        const topoLombada = cy - livroH/2 + headerH;
        g.fillStyle(0x3a1a00, 0.6);
        g.fillRect(cx - 8, topoLombada, 16, livroH - headerH);

        const topoPagina = topoLombada + 6;
        const alturaPagina = livroH - headerH - 16;
        
        // Página Esquerda (tom amarelado de pergaminho antigo)
        g.fillStyle(0xf5e9c8, 1);
        g.fillRoundedRect(cx - livroW/2 + 10, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: r - 2, tr: 0, br: 0 });

        // Sombra de dobra na lombada esquerda
        g.fillStyle(0xd4b880, 0.3);
        g.fillRect(cx - livroW/2 + 10, topoPagina, 8, alturaPagina);

        // Página Direita
        g.fillStyle(0xf0e4bc, 1);
        g.fillRoundedRect(cx + 6, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: 0, tr: 0, br: r - 2 });

        // Aneis de encadernação de lombada centrais
        g.fillStyle(0xc8901a, 1);
        g.fillRect(cx - 5, topoLombada + 10, 10, 5);
        g.fillRect(cx - 5, cy + livroH/2 - 20, 10, 5);
        g.fillRect(cx - 5, cy, 10, 4);

        g.lineStyle(1, 0xc8a060, 0.3);
        g.strokeRoundedRect(cx - livroW/2 + 10, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: r - 2, tr: 0, br: 0 });
        g.strokeRoundedRect(cx + 6, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: 0, tr: 0, br: r - 2 });

        // Desenha linhas finas de pauta nas páginas para dar o aspeto real de livro de anotações
        g.lineStyle(1, 0xd4b880, 0.2);
        const espacoLinha = 22;
        const inicioLinha = topoPagina + 20;
        for (let i = 0; i < 12; i++) {
            const ly = inicioLinha + i * espacoLinha;
            if (ly < cy + livroH/2 - 24) {
                g.lineBetween(cx - livroW/2 + 20, ly, cx - 14, ly);
                g.lineBetween(cx + 14, ly, cx + livroW/2 - 20, ly);
            }
        }
    }

    // Desenha os retângulos de botão das setas de navegação do livro
    desenharBotaoNavegacao(grafico, x, y, w, h, hover) {
        grafico.clear();
        grafico.fillStyle(hover ? 0x7a4820 : 0x5a3010, 0.85);
        grafico.fillRoundedRect(x - w/2, y - h/2, w, h, 5);
        grafico.lineStyle(1, hover ? 0xd4a050 : 0x9a6030, 1);
        grafico.strokeRoundedRect(x - w/2, y - h/2, w, h, 5);
    }

    // Altera o realce visual dos botões de virar a página ao passar o rato (hover)
    hoverBotaoNavegacao(lado, ativo) {
        if (lado === 'prev') {
            this.desenharBotaoNavegacao(this.diarioBtnAnteriorGrafico, this.diarioBtnAnteriorTexto.x, this.diarioBtnAnteriorTexto.y, 48, 24, ativo);
            this.diarioBtnAnteriorTexto.setStyle({ color: ativo ? '#f0c060' : '#6b4010' });
        } else {
            this.desenharBotaoNavegacao(this.diarioBtnSeguinteGrafico, this.diarioBtnSeguinteTexto.x, this.diarioBtnSeguinteTexto.y, 48, 24, ativo);
            this.diarioBtnSeguinteTexto.setStyle({ color: ativo ? '#f0c060' : '#6b4010' });
        }
    }

    // Configura o overlay de flash e texto de aviso no topo quando o jogador tem vida menor que 20%
    criarOverlayAlertaVida(W, H) {
        this.criticalOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0).setDepth(50);
        this.criticalTxt = this.add.text(W / 2, 80, '⚠ VIDA CRÍTICA', {
            fontSize: '16px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(51);
        this.piscando = false;
    }

    // Inicializa os elementos de desenho do Minimapa procedural
    criarMinimap(W, H) {
        this.minimapVisible = false; // Começa oculto (abre ao carregar a GameScene ou clicar M)
        this.terrenoMinimapDesenhado = false;

        const miniW = 128;
        const miniH = 96;
        const miniX = W - 8 - miniW;
        const miniY = H - 8 - miniH;

        // Gráficos do fundo escuro
        this.minimapBgGfx = this.add.graphics().setDepth(30).setVisible(false);
        this.minimapBgGfx.fillStyle(0x000000, 0.45);
        this.minimapBgGfx.fillRoundedRect(miniX - 4, miniY - 4, miniW + 8, miniH + 8, 4);

        // Gráficos da moldura exterior dourada
        this.minimapBorderGfx = this.add.graphics().setDepth(34).setVisible(false);
        this.minimapBorderGfx.lineStyle(1.5, 0xc8901a, 0.82);
        this.minimapBorderGfx.strokeRoundedRect(miniX - 1, miniY - 1, miniW + 2, miniH + 2, 4);

        // Gráficos do terreno do mapa estático (água e terra sólida)
        this.minimapTerrainGfx = this.add.graphics().setDepth(31).setVisible(false);
        
        // Gráficos dos pontos móveis (jogador, monstros, madeira no chão)
        this.minimapDynamicGfx = this.add.graphics().setDepth(32).setVisible(false);

        // Etiqueta informativa "MAP" por baixo do minimapa
        this.minimapMText = this.add.text(miniX + miniW / 2, miniY + miniH - 12, 'MAP [M]', {
            fontSize: '8px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(33).setVisible(false).setAlpha(0.65);

        // Tecla de atalho 'M' para abrir/fechar o minimapa
        this.input.keyboard.on('keydown-M', () => this.alternarMinimap());
    }

    // Chamado a cada ciclo de renderização do Phaser para manter a interface atualizada
    update() {
        // 1. Atualiza as informações do cronómetro e ciclo dia/noite
        if (this.gameScene) {
            const sec = Math.floor(this.gameScene.elapsedSec);
            const mm = Math.floor(sec / 60);
            const ss = String(sec % 60).padStart(2, '0');
            this.timerTxt.setText(`${mm}:${ss}`);

            // Atualiza pontuação e monstros eliminados
            this.scoreTxt.setText(`${this.gameScene.score} pts`);
            this.killsTxt.setText(`☠ ${this.gameScene.killCount}`);

            // Modifica o ícone de Sol/Lua conforme o tempo do dia
            const tempoCiclo = this.gameScene.elapsedSec % 300;
            const ehNoite = tempoCiclo >= 150 && tempoCiclo < 270;
            this.dayNightIcon.setText(ehNoite ? '🌙' : '☀️');
            this.dayNightIcon.setStyle({ fill: ehNoite ? '#aaccff' : '#ffcc22' });
        }

        // 2. Controla o efeito de alerta vermelho piscante quando o jogador está quase a morrer
        if (this.stats && !this.stats.dead) {
            const vidaCritica = this.stats.healthPercentagem < 0.20;
            if (vidaCritica) {
                if (!this.piscando) {
                    this.piscando = true;
                    this.iniciarPiscarAlertaVida();
                }
            } else {
                this.piscando = false;
                this.tweens.killTweensOf([this.criticalOverlay, this.criticalTxt]);
                this.criticalOverlay.setAlpha(0);
                this.criticalTxt.setAlpha(0);
            }
        } else {
            // Se morreu, garante que apaga o alerta
            this.piscando = false;
            this.criticalOverlay.setAlpha(0);
            this.criticalTxt.setAlpha(0);
        }

        // 3. Atualiza o minimapa procedural se estiver visível
        if (this.minimapVisible && this.gameScene) {
            // Desenha a parte de chão e água apenas uma vez para economizar processamento
            if (!this.terrenoMinimapDesenhado && this.gameScene.colisao && this.gameScene.mapa) {
                this.desenharTerrenoMinimap();
                this.terrenoMinimapDesenhado = true;
            }
            // Desenha os pontos dinâmicos (jogador, inimigos) a cada frame
            this.desenharElementosDinamicosMinimap();
        }
    }

    // Loop de pulsação suave da barra vermelha de aviso de pouca vida
    iniciarPiscarAlertaVida() {
        this.criticalOverlay.setAlpha(0);
        this.criticalTxt.setAlpha(0);
        this.criticalTxt.setText(I18n.lang === 'pt' ? '⚠ VIDA CRÍTICA' : '⚠ LOW HEALTH');

        this.tweens.add({
            targets: this.criticalOverlay,
            alpha: 0.28,
            duration: 550,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: this.criticalTxt,
            alpha: 0.9,
            duration: 550,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Desenha as barras horizontais coloridas de status com base nas percentagens obtidas
    atualizarBarrasStats() {
        if (!this.stats) return;

        const LS = this.layoutStats;
        const g = this.graficoPreenchimentoStats;
        g.clear();

        // 1. Vida (Cor Vermelha: 0xff3b30)
        g.fillStyle(0xff3b30, 1);
        g.fillRoundedRect(LS.barX + 1, LS.rows[0] + 1, (LS.barW - 2) * this.stats.healthPercentagem, LS.barH - 2, 3);
        
        // 2. Fome (Cor Laranja: 0xff9500)
        g.fillStyle(0xff9500, 1);
        g.fillRoundedRect(LS.barX + 1, LS.rows[1] + 1, (LS.barW - 2) * this.stats.hungerPercentagem, LS.barH - 2, 3);

        // 3. Sede (Cor Azul: 0x34aadc)
        g.fillStyle(0x34aadc, 1);
        g.fillRoundedRect(LS.barX + 1, LS.rows[2] + 1, (LS.barW - 2) * this.stats.thirstPercentagem, LS.barH - 2, 3);

        // 4. Energia (Cor Amarela: 0xffcc00)
        g.fillStyle(0xffcc00, 1);
        g.fillRoundedRect(LS.barX + 1, LS.rows[3] + 1, (LS.barW - 2) * this.stats.energyPercentagem, LS.barH - 2, 3);

        // Escreve os valores numéricos de texto formatados em inteiro (0-100)
        this.healthTxt.setText(`${Math.ceil(this.stats.health)}/100`);
        this.hungerTxt.setText(`${Math.ceil(this.stats.hunger)}/100`);
        this.thirstTxt.setText(`${Math.ceil(this.stats.thirst)}/100`);
        this.energyTxt.setText(`${Math.ceil(this.stats.energy)}/100`);
    }

    // Atualiza os retângulos de progresso da jangada no ecrã principal
    atualizarQuest() {
        if (!this.quest) return;

        this.quest.getProgress().forEach(p => {
            const slot = this.raftSlots[p.id];
            if (!slot) return;

            const entregues = p.current;
            const total = p.need;

            // Pinta de verde se já atingiu o total de entregas, ou deixa com a cor padrão do recurso
            const corPintura = entregues >= total ? 0x22cc22 : slot.cfg.color;

            // Varre a série de quadradinhos. Se i < entregues, pinta com a cor ativa, senão deixa vazio
            for (let i = 0; i < slot.rects.length; i++) {
                const rect = slot.rects[i];
                if (i < entregues) {
                    rect.setFillStyle(corPintura, 1);
                } else {
                    rect.setFillStyle(slot.cfg.emptyColor, 1);
                }
            }
        });

        // Atualiza as linhas descritivas de progresso dentro do Quest Log detalhado (Q)
        if (this.questLogAberto) {
            this.linhasQuestLog.forEach(linha => {
                const prog = this.quest.state[linha.id];
                if (prog) {
                    linha.prog.setText(`${prog.have} / ${prog.need}`);
                    linha.prog.setStyle({ fill: prog.have >= prog.need ? '#88ff88' : '#cccccc' });
                    linha.head.setStyle({ fill: prog.have >= prog.need ? '#88ff88' : '#ffffff' });
                }
            });
        }
    }

    // Desenha as imagens dos itens equipados nos slots da Hotbar no fundo inferior
    atualizarHotbar() {
        if (!this.inventory) return;

        const HOTBAR_TAMANHO = 8;
        const slotAtivo = this.inventory.selectedSlot;

        for (let i = 0; i < HOTBAR_TAMANHO; i++) {
            const slot = this.inventory.slots[i];
            const icon = this.slotIcons[i];
            const text = this.slotTexts[i];
            const bg = this.slotBgs[i];

            if (slot) {
                const def = ITEM_DB[slot.itemId];
                
                // Exibe o ícone e a quantidade
                icon.setTexture(def ? def.icon : slot.itemId).setVisible(true);
                text.setText(slot.qty > 1 ? String(slot.qty) : '');
            } else {
                icon.setVisible(false);
                text.setText('');
            }

            // Destaque visual dourado se o slot for o selecionado na hotbar ativa
            if (i === slotAtivo) {
                bg.setTexture('itemdisc_02'); // Utiliza disco dourado
            } else {
                bg.setTexture('itemdisc_01'); // Utiliza disco de ferro cinzento
            }
        }

        // Escreve o nome do item selecionado na etiqueta flutuante
        const slotAtivoObj = this.inventory.getSelectedItem();
        if (slotAtivoObj) {
            const def = ITEM_DB[slotAtivoObj.itemId];
            this.labelItemSelecionado.setText(def ? def.name.toUpperCase() : slotAtivoObj.itemId.toUpperCase());
        } else {
            this.labelItemSelecionado.setText('');
        }
    }

    // Abre ou fecha o Quest Log expandido ao premir 'Q' ou na jangada
    alternarQuestLog() {
        this.questLogAberto = !this.questLogAberto;
        this.questLogGroup.setVisible(this.questLogAberto);
        this.atualizarQuest(); // Atualiza textos imediatamente ao abrir
    }

    // Abre ou fecha o livro do Diário do Náufrago
    alternarDiario() {
        this.bookOpen = !this.bookOpen;
        this.bookGroup.setVisible(this.bookOpen);
        
        if (this.bookOpen) {
            // Pausa a física e os monstros da GameScene para o jogador poder ler em segurança
            this.scene.pause('GameScene');
            this.pagDiario = 0;
            this.atualizarPaginaDiario();
        } else {
            // Retoma a GameScene após fechar o livro
            this.scene.resume('GameScene');
        }
    }

    // Escreve o texto narrativo correspondente à página selecionada do livro
    atualizarPaginaDiario() {
        const dadosIdioma = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        const paginas = dadosIdioma?.diary?.pages || [];
        const tituloLivro = dadosIdioma?.diary?.title || 'DIÁRIO';
        const labelFechar = dadosIdioma?.diary?.close_hint || '[ESC] fechar';

        this.diarioTitulo.setText(tituloLivro.toUpperCase());
        this.diarioDicaFechar.setText(labelFechar);

        // Cada ecrã exibe duas páginas simultâneas (esquerda e direita)
        const idxEsquerdo = this.pagDiario * 2;
        const idxDireito = idxEsquerdo + 1;

        // Repõe textos da página esquerda
        const textoEsq = paginas[idxEsquerdo] ? paginas[idxEsquerdo].text.join('\n') : '';
        this.diarioTextoEsquerda.setText(textoEsq);

        // Repõe textos da página direita
        const textoDir = paginas[idxDireito] ? paginas[idxDireito].text.join('\n') : '';
        this.diarioTextoDireita.setText(textoDir);

        // Escreve os números das páginas duplas na base
        const totalPags = paginas.length;
        this.diarioNumeroPagina.setText(`${idxEsquerdo + 1} - ${Math.min(totalPags, idxDireito + 1)}  /  ${totalPags}`);

        // Controla se exibe ou não os botões de navegação lateral (ex: oculta seta anterior na primeira página)
        const temAnterior = idxEsquerdo > 0;
        const temSeguinte = idxDireito < totalPags - 1;

        this.diarioBtnAnteriorGrafico.setVisible(temAnterior);
        this.diarioBtnAnteriorTexto.setVisible(temAnterior);
        if (temAnterior) {
            this.diarioBtnAnteriorZona.setInteractive();
            this.desenharBotaoNavegacao(this.diarioBtnAnteriorGrafico, this.diarioBtnAnteriorTexto.x, this.diarioBtnAnteriorTexto.y, 48, 24, false);
        } else {
            this.diarioBtnAnteriorZona.disableInteractive();
        }

        this.diarioBtnSeguinteGrafico.setVisible(temSeguinte);
        this.diarioBtnSeguinteTexto.setVisible(temSeguinte);
        if (temSeguinte) {
            this.diarioBtnSeguinteZona.setInteractive();
            this.desenharBotaoNavegacao(this.diarioBtnSeguinteGrafico, this.diarioBtnSeguinteTexto.x, this.diarioBtnSeguinteTexto.y, 48, 24, false);
        } else {
            this.diarioBtnSeguinteZona.disableInteractive();
        }
    }

    // Vira para a página anterior (-1) ou página seguinte (+1)
    virarPaginaDiario(dir) {
        SoundManager.play('menu_click');
        this.pagDiario = Math.max(0, this.pagDiario + dir);
        this.atualizarPaginaDiario();
    }

    // Alterna a exibição visual do minimapa no canto inferior direito
    alternarMinimap() {
        this.minimapVisible = !this.minimapVisible;
        this.minimapBgGfx.setVisible(this.minimapVisible);
        this.minimapBorderGfx.setVisible(this.minimapVisible);
        this.minimapTerrainGfx.setVisible(this.minimapVisible);
        this.minimapDynamicGfx.setVisible(this.minimapVisible);
        this.minimapMText.setVisible(this.minimapVisible);
    }

    // Varre o mapa Tiled original para pintar estaticamente a água e terra no minimapa
    desenharTerrenoMinimap() {
        const colisao = this.gameScene.colisao;
        const mapa = this.gameScene.mapa;
        if (!colisao || !mapa) return;

        const mapWidthInTiles = mapa.width;
        const mapHeightInTiles = mapa.height;

        const miniW = 128;
        const miniH = 96;
        const miniX = this.scale.width - 8 - miniW;
        const miniY = this.scale.height - 8 - miniH;

        // Tamanho de escala de cada tile no minimapa
        const tileW = miniW / mapWidthInTiles;
        const tileH = miniH / mapHeightInTiles;

        this.minimapTerrainGfx.clear();

        // Pinta todo o fundo inicial a Verde (Terra)
        this.minimapTerrainGfx.fillStyle(0x2d5a1b, 1);
        this.minimapTerrainGfx.fillRect(miniX, miniY, miniW, miniH);

        // Varre a matriz bidimensional de tiles
        for (let ty = 0; ty < mapHeightInTiles; ty++) {
            for (let tx = 0; tx < mapWidthInTiles; tx++) {
                const chaoTile = mapa.getTileAt(tx, ty, true, 'chao');
                const chaoIndex = chaoTile ? chaoTile.index : -1;
                
                // Se o ID do bloco pertencer ao intervalo de GIDs de água do tileset
                const ehAgua = chaoIndex >= 270 && chaoIndex <= 360;

                const colisaoTile = colisao.getTileAt(tx, ty);
                const ehSolido = colisaoTile && colisaoTile.index > 0;

                if (ehAgua) {
                    // Desenha quadrado Azul no minimapa
                    this.minimapTerrainGfx.fillStyle(0x1b3a5c, 1);
                    this.minimapTerrainGfx.fillRect(miniX + tx * tileW, miniY + ty * tileH, tileW + 0.1, tileH + 0.1);
                } else if (ehSolido) {
                    // Desenha quadrado Castanho se for rocha ou obstáculo inamovível
                    this.minimapTerrainGfx.fillStyle(0x4a3728, 1);
                    this.minimapTerrainGfx.fillRect(miniX + tx * tileW, miniY + ty * tileH, tileW + 0.1, tileH + 0.1);
                }
            }
        }
    }

    // Desenha em tempo real os ícones dinâmicos do jogador, árvores, recursos e inimigos
    desenharElementosDinamicosMinimap() {
        const grafico = this.minimapDynamicGfx;
        grafico.clear();

        if (!this.gameScene || !this.gameScene.player) return;

        const mapW = this.gameScene.mapW;
        const mapH = this.gameScene.mapH;
        if (!mapW || !mapH) return;

        const miniW = 128;
        const miniH = 96;
        const miniX = this.scale.width - 8 - miniW;
        const miniY = this.scale.height - 8 - miniH;

        // Escala matemática de mapeamento de pixels (coordenada_jogo * escala = coordenada_minimap)
        const escalaX = miniW / mapW;
        const escalaY = miniH / mapH;

        // Limita as coordenadas para não desenhar pontos dinâmicos fora do retângulo do minimapa
        const limitar = (val, min, max) => Math.max(min, Math.min(max, val));

        // 1. Desenha as Árvores vivas no mapa (Pequenos círculos verdes escuros)
        if (this.gameScene.trees) {
            grafico.fillStyle(0x1a4f0a, 1);
            this.gameScene.trees.getChildren().forEach(t => {
                if (t.active && !t.dead) {
                    const tx = miniX + limitar(t.x, 0, mapW) * escalaX;
                    const ty = miniY + limitar(t.y, 0, mapH) * escalaY;
                    grafico.fillCircle(tx, ty, 1.5);
                }
            });
        }

        // 2. Desenha os Itens recolhíveis largados no chão (Círculos amarelos)
        if (this.gameScene.pickups) {
            grafico.fillStyle(0xffee44, 1);
            this.gameScene.pickups.getChildren().forEach(p => {
                if (p.active) {
                    const px = miniX + limitar(p.x, 0, mapW) * escalaX;
                    const py = miniY + limitar(p.y, 0, mapH) * escalaY;
                    grafico.fillCircle(px, py, 1.5);
                }
            });
        }

        // 3. Desenha a localização exata da Jangada (Estrela/Círculo dourado cintilante)
        const jangada = this.gameScene.raftZone;
        if (jangada) {
            const rx = miniX + limitar(jangada.x, 0, mapW) * escalaX;
            const ry = miniY + limitar(jangada.y, 0, mapH) * escalaY;
            grafico.fillStyle(0xffd700, 1);
            grafico.fillCircle(rx, ry, 3.5);

            // Borda concêntrica aureolada
            grafico.lineStyle(1, 0xffd700, 0.5);
            grafico.strokeCircle(rx, ry, 5);
        }

        // 4. Desenha os Inimigos vivos perseguindo o jogador (Círculos vermelhos)
        if (this.gameScene.goblins) {
            grafico.fillStyle(0xff3333, 1);
            this.gameScene.goblins.getChildren().forEach(g => {
                if (g.active && !g.dead) {
                    const ex = miniX + limitar(g.x, 0, mapW) * escalaX;
                    const ey = miniY + limitar(g.y, 0, mapH) * escalaY;
                    grafico.fillCircle(ex, ey, 2.5);
                }
            });
        }

        // 5. Desenha a posição do Jogador (Ponto branco com halo luminoso intermitente)
        const jogador = this.gameScene.player;
        const px = miniX + limitar(jogador.x, 0, mapW) * escalaX;
        const py = miniY + limitar(jogador.y, 0, mapH) * escalaY;

        // Pulsação de tamanho com base no tempo de jogo
        const pisca = Math.floor(this.time.now / 200) % 2 === 0;
        const raioHalo = pisca ? 8 : 6;

        grafico.fillStyle(0xffffff, 0.4);
        grafico.fillCircle(px, py, raioHalo);

        grafico.fillStyle(0xffffff, 1);
        grafico.fillCircle(px, py, 4);
    }

    // Ouve a mudança de waves na GameScene para atualizar o contador textual de hordas
    onMudancaVaga(w) {
        if (this.waveTxt) {
            this.waveTxt.setText(I18n.lang === 'pt' ? `ONDA ${w}` : `WAVE ${w}`);
        }
    }
}
