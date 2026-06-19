import { ITEM_DB } from '../systems/Inventory.js';
import I18n from '../systems/I18n.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super('HUDScene');
    }

    create() {
        this.gameScene = this.scene.get('GameScene');
        this.inventory = this.gameScene.inventory;
        this.stats = this.gameScene.stats;
        this.quest = this.gameScene.quest;

        const W = this.scale.width;
        const H = this.scale.height;

        // Inicializa todas as secções da interface de forma modular
        this.criarHotbar(W, H);
        this.criarBarrasStats();
        this.criarPainelQuestTimer(W, H);
        this.criarQuestLog(W, H);
        this.criarDiarioNaufrago(W, H);
        this.criarOverlayAlertaVida(W, H);
        this.criarMinimap(W, H);

        // Ouve eventos do inventário e status para atualizar a UI
        this.inventory.on('changed',          this.atualizarHotbar, this);
        this.inventory.on('selectionChanged', this.atualizarHotbar, this);
        this.stats.on('changed',              this.atualizarBarrasStats, this);

        if (this.quest) {
            this.quest.on('partDelivered',  this.atualizarQuest, this);
            this.quest.on('penaltyApplied', this.atualizarQuest, this);
            this.game.events.on('quest:updated', this.atualizarQuest, this);
            this.inventory.on('changed', this.atualizarQuest, this);
        }

        this.gameScene.events.on('toggleQuestLog', this.alternarQuestLog, this);
        this.gameScene.events.on('openBook', this.alternarDiario, this);
        this.gameScene.events.on('waveChanged', this.onMudancaVaga, this);

        // Atualizacao inicial
        this.atualizarHotbar();
        this.atualizarBarrasStats();
        if (this.quest) this.atualizarQuest();
        this.onMudancaVaga(this.gameScene.waveNumber || 0);
    }

    // Configura a barra inferior de atalhos (hotbar)
    criarHotbar(W, H) {
        this.slotBgs   = [];
        this.slotIcons = [];
        this.slotTexts = [];

        const tamanhoSlot = 18 * 3;
        const espacamento = 6;
        const HOTBAR_TAMANHO = 8;
        const larguraTotal = HOTBAR_TAMANHO * tamanhoSlot + (HOTBAR_TAMANHO - 1) * espacamento;
        const hotbarX = (W - larguraTotal) / 2 + tamanhoSlot / 2;
        const hotbarY = H - 38;

        // Painel de fundo do hotbar
        const larguraFundo = larguraTotal + 28;
        const graficoHotbar = this.add.graphics().setDepth(0);
        graficoHotbar.fillStyle(0x000000, 0.3);
        graficoHotbar.fillRoundedRect(W / 2 - larguraFundo / 2 + 3, hotbarY - 47, larguraFundo, 82, 8);
        graficoHotbar.fillStyle(0x160a00, 0.92);
        graficoHotbar.fillRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
        graficoHotbar.lineStyle(1.5, 0xc8901a, 0.72);
        graficoHotbar.strokeRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
        graficoHotbar.lineStyle(1, 0x6b3a1a, 0.5);
        graficoHotbar.lineBetween(W / 2 - larguraFundo / 2 + 12, hotbarY - 30, W / 2 + larguraFundo / 2 - 12, hotbarY - 30);

        // Dica de teclas
        const textoDica = I18n.lang === 'pt'
            ? '[E] usar   ·   [Q] jangada   ·   [I] inventário   ·   [M] mapa'
            : '[E] use   ·   [Q] raft   ·   [I] inventory   ·   [M] map';
            
        this.add.text(W / 2, hotbarY - 40, textoDica, {
            fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);

        // Instancia os 8 slots visuais
        for (let i = 0; i < HOTBAR_TAMANHO; i++) {
            const x = hotbarX + i * (tamanhoSlot + espacamento);

            const bg = this.add.image(x, hotbarY, 'itemdisc_01').setScale(3).setDepth(1);
            const icon = this.add.image(x, hotbarY, 'wood').setScale(2.5).setVisible(false).setDepth(2);
            const text = this.add.text(x + 18, hotbarY + 18, '', {
                fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 1).setDepth(3);

            this.add.text(x - 20, hotbarY - 22, String(i + 1), {
                fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0, 0).setDepth(3);

            this.slotBgs.push(bg);
            this.slotIcons.push(icon);
            this.slotTexts.push(text);
        }

        this.labelItemSelecionado = this.add.text(W / 2, hotbarY - 64, '', {
            fontSize: '11px', fill: '#f5e0b0', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(3);
    }

    // Configura o painel de status de sobrevivencia (vida, fome, sede, energia)
    criarBarrasStats() {
        this.layoutStats = {
            barX: 28, barW: 112, barH: 8,
            textX: 144,
            iconX: 16,
            rows: [16, 35, 54, 73],
        };
        const LS = this.layoutStats;

        const painelFundo = this.add.graphics().setDepth(1);
        painelFundo.fillStyle(0x000000, 0.35);
        painelFundo.fillRoundedRect(6, 6, 178, 90, 6);
        painelFundo.fillStyle(0x160a00, 0.92);
        painelFundo.fillRoundedRect(6, 6, 178, 90, 6);
        painelFundo.lineStyle(1.5, 0xc8901a, 0.72);
        painelFundo.strokeRoundedRect(6, 6, 178, 90, 6);

        LS.rows.forEach(y => {
            painelFundo.fillStyle(0x070300, 0.9);
            painelFundo.fillRoundedRect(LS.barX, y, LS.barW, LS.barH, 4);
        });

        this.graficoPreenchimentoStats = this.add.graphics().setDepth(2);

        // Icones das barras
        [
            { key: 'stat_health', y: LS.rows[0] },
            { key: 'stat_hunger', y: LS.rows[1] },
            { key: 'stat_thirst', y: LS.rows[2] },
            { key: 'stat_energy', y: LS.rows[3] },
        ].forEach(({ key, y }) => {
            this.add.image(LS.iconX, y + LS.barH / 2, key)
                .setDisplaySize(12, 12).setOrigin(0.5).setDepth(3);
        });

        // Textos descritivos das barras
        this.healthTxt = this.add.text(LS.textX, LS.rows[0] - 1, '', { fontSize: '9px', fill: '#ffaaaa' }).setDepth(3);
        this.hungerTxt = this.add.text(LS.textX, LS.rows[1] - 1, '', { fontSize: '9px', fill: '#ffddaa' }).setDepth(3);
        this.thirstTxt = this.add.text(LS.textX, LS.rows[2] - 1, '', { fontSize: '9px', fill: '#aaddff' }).setDepth(3);
        this.energyTxt = this.add.text(LS.textX, LS.rows[3] - 1, '', { fontSize: '9px', fill: '#ccffaa' }).setDepth(3);
    }

    // Configura o painel da jangada e dos status gerais (timer, kills, wave)
    criarPainelQuestTimer(W, H) {
        const QPX  = W - 8 - 168;
        const QPY  = 8;
        const QPW  = 168;
        const QPH  = 130;
        const QPHH = 22;
        const QSEP = 96;   

        const graficoQuest = this.add.graphics().setDepth(2);
        graficoQuest.fillStyle(0x000000, 0.35);
        graficoQuest.fillRoundedRect(QPX + 4, QPY + 4, QPW, QPH, 6);
        graficoQuest.fillStyle(0x160a00, 0.92);
        graficoQuest.fillRoundedRect(QPX, QPY, QPW, QPH, 6);
        graficoQuest.lineStyle(1.5, 0xc8901a, 0.72);
        graficoQuest.strokeRoundedRect(QPX, QPY, QPW, QPH, 6);
        graficoQuest.fillStyle(0x3d1a00, 1);
        graficoQuest.fillRoundedRect(QPX, QPY, QPW, QPHH, { tl: 6, tr: 6, bl: 0, br: 0 });
        graficoQuest.lineStyle(1, 0xc8901a, 0.6);
        graficoQuest.lineBetween(QPX + 8, QPY + QPHH, QPX + QPW - 8, QPY + QPHH);
        graficoQuest.lineStyle(1, 0x6b3a1a, 0.5);
        graficoQuest.lineBetween(QPX + 8, QSEP, QPX + QPW - 8, QSEP);

        this.add.text(QPX + QPW / 2, QPY + QPHH / 2, 'JANGADA  [F]', {
            fontSize: '9px', fill: '#f5c070', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        // Elementos dinamicos
        this.timerTxt = this.add.text(QPX + QPW / 2 + 8, QSEP + 6, '0:00', {
            fontSize: '13px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(3);

        this.dayNightIcon = this.add.text(QPX + QPW / 2 - 12, QSEP + 6, '☀️', {
            fontSize: '13px'
        }).setOrigin(0.5, 0).setDepth(3);

        this.scoreTxt = this.add.text(QPX + 10, QSEP + 24, '0 pts', {
            fontSize: '10px', fill: '#ffdd44'
        }).setOrigin(0, 0).setDepth(3);

        this.waveTxt = this.add.text(QPX + QPW / 2, QSEP + 24, 'WAVE 0', {
            fontSize: '10px', fill: '#ffaa66', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(3);

        this.killsTxt = this.add.text(QPX + QPW - 10, QSEP + 24, '☠ 0', {
            fontSize: '10px', fill: '#ff8888'
        }).setOrigin(1, 0).setDepth(3);

        // Progresso da jangada (slots)
        const SLOT_CONFIG = {
            wood: { color: 0x88cc44, emptyColor: 0x334411, slots: 5 },
            rope: { color: 0xddaa44, emptyColor: 0x443311, slots: 3 },
            sail: { color: 0x44bbff, emptyColor: 0x112233, slots: 1 },
        };
        const SLOT_TAMANHO = 11;
        const SLOT_GAP = 3;
        const SLOT_DIREITA = QPX + QPW - 8;

        this.raftSlots = {};

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const rowCY = QPY + QPHH + 11 + i * 22;
                const cfg = SLOT_CONFIG[p.id] || { color: 0xffffff, emptyColor: 0x333333, slots: 1 };
                const total = cfg.slots;

                this.add.image(QPX + 10, rowCY, p.id).setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(3);

                this.add.text(QPX + 28, rowCY, p.label, { fontSize: '9px', fill: '#ccbb88' })
                    .setOrigin(0, 0.5).setDepth(3);

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

    // Configura o painel do Quest Log detalhado (Q)
    criarQuestLog(W, H) {
        this.infoZonas = {
            wood: { fonte: 'Cortar árvores (ESPAÇO)', zona: 'Floresta' },
            rope: { fonte: 'Destroços / baús',         zona: 'Praia oposta' },
            sail: { fonte: 'Drop do boss skeleton',    zona: 'Zona rochosa' },
        };

        this.questLogAberto = false;
        this.questLogGroup = this.add.group();

        const painelW = 360, painelH = 220;
        const cx = W / 2 - painelW / 2;
        const cy = H / 2 - painelH / 2;
        const HEADER_H = 28;

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

    // Configura o diario do naufrago
    criarDiarioNaufrago(W, H) {
        this.bookOpen = false;
        this.pagDiario = 0;
        this.bookGroup = this.add.group();

        const livroW = 600, livroH = 400;
        const cx = W / 2, cy = H / 2;
        const D = 80;  
        const HEADER_H = 44;

        // Fundo desfocado/escuro
        this.diarioDim = this.add.rectangle(cx, cy, W, H, 0x000000, 0.72)
            .setDepth(D).setVisible(false);

        // Graficos do livro
        this.diarioGrafico = this.add.graphics().setDepth(D + 1).setVisible(false);
        this.desenharGraficosDiario(cx, cy, livroW, livroH, HEADER_H);

        // Titulo
        this.diarioTitulo = this.add.text(cx, cy - livroH / 2 + HEADER_H / 2 + 2, '', {
            fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f5e0b0', fontStyle: 'bold italic', align: 'center',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        this.diarioDivGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);

        const larguraPagina = livroW / 2 - 50;
        const textoY = cy - livroH / 2 + HEADER_H + 16;
        const esquerdaX = cx - livroW / 2 + 28;
        const direitaX = cx + 14;

        // Páginas de texto
        this.diarioTextoEsquerda = this.add.text(esquerdaX, textoY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px', color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: larguraPagina },
        }).setDepth(D + 2).setVisible(false);

        this.diarioTextoDireita = this.add.text(direitaX, textoY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px', color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: larguraPagina },
        }).setDepth(D + 2).setVisible(false);

        this.diarioNumeroPagina = this.add.text(cx, cy + livroH / 2 - 18, '', {
            fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8b6e3a', align: 'center', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // Navegacao
        const navY = cy + livroH / 2 - 18;
        const larguraBotao = 48, alturaBotao = 24;
        const prevX = cx - livroW / 2 + 38;
        const nextX = cx + livroW / 2 - 38;

        this.diarioBtnAnteriorGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);
        this.diarioBtnAnteriorTexto = this.add.text(prevX, navY, '◀', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        
        this.diarioBtnAnteriorZona = this.add.zone(prevX, navY, larguraBotao, alturaBotao)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this.diarioBtnAnteriorZona.on('pointerover',  () => this.hoverBotaoNavegacao('prev', true));
        this.diarioBtnAnteriorZona.on('pointerout',   () => this.hoverBotaoNavegacao('prev', false));
        this.diarioBtnAnteriorZona.on('pointerdown',  () => this.virarPaginaDiario(-1));

        this.diarioBtnSeguinteGrafico = this.add.graphics().setDepth(D + 2).setVisible(false);
        this.diarioBtnSeguinteTexto = this.add.text(nextX, navY, '▶', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        
        this.diarioBtnSeguinteZona = this.add.zone(nextX, navY, larguraBotao, alturaBotao)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this.diarioBtnSeguinteZona.on('pointerover',  () => this.hoverBotaoNavegacao('next', true));
        this.diarioBtnSeguinteZona.on('pointerout',   () => this.hoverBotaoNavegacao('next', false));
        this.diarioBtnSeguinteZona.on('pointerdown',  () => this.virarPaginaDiario(1));

        this.diarioDicaFechar = this.add.text(cx, cy + livroH / 2 + 16, '', {
            fontFamily: 'Georgia, serif', fontSize: '10px', color: '#7a6040', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

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

    // Desenha as texturas do livro de pergaminho
    desenharGraficosDiario(cx, cy, livroW, livroH, headerH) {
        const g = this.diarioGrafico;
        g.clear();
        const r = 10;

        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(cx - livroW/2 + 10, cy - livroH/2 + 10, livroW, livroH, r);

        g.fillStyle(0x5c2e00, 1);
        g.fillRoundedRect(cx - livroW/2, cy - livroH/2, livroW, livroH, r);

        g.lineStyle(2, 0xc8901a, 0.7);
        g.strokeRoundedRect(cx - livroW/2 + 1, cy - livroH/2 + 1, livroW - 2, livroH - 2, r);

        g.fillStyle(0x3d1a00, 0.9);
        g.fillRoundedRect(cx - livroW/2, cy - livroH/2, livroW, headerH, { tl: r, tr: r, bl: 0, br: 0 });

        g.lineStyle(3, 0xc8901a, 0.9);
        g.lineBetween(cx - livroW/2, cy - livroH/2 + headerH, cx + livroW/2, cy - livroH/2 + headerH);

        g.fillStyle(0xc8901a, 1);
        g.fillTriangle(cx - 16, cy - livroH/2 + headerH, cx, cy - livroH/2 + headerH - 8, cx + 16, cy - livroH/2 + headerH);
        g.fillTriangle(cx - 16, cy - livroH/2 + headerH, cx, cy - livroH/2 + headerH + 8, cx + 16, cy - livroH/2 + headerH);

        const topoLombada = cy - livroH/2 + headerH;
        g.fillStyle(0x3a1a00, 0.6);
        g.fillRect(cx - 8, topoLombada, 16, livroH - headerH);

        const topoPagina = topoLombada + 6;
        const alturaPagina = livroH - headerH - 16;
        
        g.fillStyle(0xf5e9c8, 1);
        g.fillRoundedRect(cx - livroW/2 + 10, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: r - 2, tr: 0, br: 0 });

        g.fillStyle(0xd4b880, 0.3);
        g.fillRect(cx - livroW/2 + 10, topoPagina, 8, alturaPagina);

        g.fillStyle(0xf0e4bc, 1);
        g.fillRoundedRect(cx + 6, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: 0, tr: 0, br: r - 2 });

        g.fillStyle(0xc8901a, 1);
        g.fillRect(cx - 5, topoLombada + 10, 10, 5);
        g.fillRect(cx - 5, cy + livroH/2 - 20, 10, 5);
        g.fillRect(cx - 5, cy, 10, 4);

        g.lineStyle(1, 0xc8a060, 0.3);
        g.strokeRoundedRect(cx - livroW/2 + 10, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: r - 2, tr: 0, br: 0 });
        g.strokeRoundedRect(cx + 6, topoPagina, livroW/2 - 16, alturaPagina, { tl: 0, bl: 0, tr: 0, br: r - 2 });

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

    // Desenha as setas de navegacao do diario
    desenharBotaoNavegacao(grafico, x, y, w, h, hover) {
        grafico.clear();
        grafico.fillStyle(hover ? 0x7a4820 : 0x5a3010, 0.85);
        grafico.fillRoundedRect(x - w/2, y - h/2, w, h, 5);
        grafico.lineStyle(1, hover ? 0xd4a050 : 0x9a6030, 1);
        grafico.strokeRoundedRect(x - w/2, y - h/2, w, h, 5);
    }

    hoverBotaoNavegacao(lado, ativo) {
        if (lado === 'prev') {
            this.desenharBotaoNavegacao(this.diarioBtnAnteriorGrafico, this.diarioBtnAnteriorTexto.x, this.diarioBtnAnteriorTexto.y, 48, 24, ativo);
            this.diarioBtnAnteriorTexto.setStyle({ color: ativo ? '#f0c060' : '#6b4010' });
        } else {
            this.desenharBotaoNavegacao(this.diarioBtnSeguinteGrafico, this.diarioBtnSeguinteTexto.x, this.diarioBtnSeguinteTexto.y, 48, 24, ativo);
            this.diarioBtnSeguinteTexto.setStyle({ color: ativo ? '#f0c060' : '#6b4010' });
        }
    }

    // Configura o overlay de vida critica
    criarOverlayAlertaVida(W, H) {
        this.criticalOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0).setDepth(50);
        this.criticalTxt = this.add.text(W / 2, 80, '⚠ VIDA CRÍTICA', {
            fontSize: '16px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(51);
        this.piscando = false;
    }

    // Configura o minimapa
    criarMinimap(W, H) {
        this.minimapVisible = true;
        this.terrenoMinimapDesenhado = false;

        const miniW = 128;
        const miniH = 96;
        const miniX = W - 8 - miniW;
        const miniY = H - 8 - miniH;

        this.minimapBgGfx = this.add.graphics().setDepth(9);
        this.minimapBgGfx.fillStyle(0x000000, 0.35);
        this.minimapBgGfx.fillRoundedRect(miniX + 3, miniY + 3, miniW, miniH, 6);
        this.minimapBgGfx.fillStyle(0x160a00, 1);
        this.minimapBgGfx.fillRoundedRect(miniX, miniY, miniW, miniH, 6);

        this.minimapTerrainGfx = this.add.graphics().setDepth(10);

        this.minimapBorderGfx = this.add.graphics().setDepth(14);
        this.minimapBorderGfx.lineStyle(1.5, 0xc8901a, 0.72);
        this.minimapBorderGfx.strokeRoundedRect(miniX, miniY, miniW, miniH, 6);

        const mascaraGeometrica = this.make.graphics({ x: 0, y: 0, add: false });
        mascaraGeometrica.fillStyle(0xffffff);
        mascaraGeometrica.fillRoundedRect(miniX, miniY, miniW, miniH, 6);
        
        const mascara = mascaraGeometrica.createGeometryMask();
        this.minimapTerrainGfx.setMask(mascara);

        this.minimapDynamicGfx = this.add.graphics().setDepth(12);
        this.minimapDynamicGfx.setMask(mascara);

        this.minimapMText = this.add.text(miniX + 6, miniY + 4, 'M', {
            fontSize: '9px', fontStyle: 'bold', fill: '#c8a870', stroke: '#000000', strokeThickness: 2,
        }).setDepth(13);

        this.input.keyboard?.on('keydown-M', () => {
            this.alternarMinimap();
        });
    }

    update(time, delta) {
        if (!this.gameScene) return;

        // Desenha o mapa apenas na primeira vez
        if (!this.terrenoMinimapDesenhado && this.gameScene.colisao && this.gameScene.mapa) {
            this.desenharTerrenoMinimap();
            this.terrenoMinimapDesenhado = true;
        }

        // Desenha os pontos dinamicos no minimapa
        if (this.minimapVisible) {
            this.desenharElementosDinamicosMinimap();
        } else {
            this.minimapDynamicGfx.clear();
        }

        // Atualiza relogio
        const segundos = Math.floor(this.gameScene.elapsedSec);
        const mm = Math.floor(segundos / 60);
        const ss = String(segundos % 60).padStart(2, '0');
        this.timerTxt.setText(`${mm}:${ss}`);

        // Icone do sol/lua
        const tempoCiclo = this.gameScene.elapsedSec % 300;
        if (tempoCiclo < 120) {
            this.dayNightIcon.setText('☀️');
        } else if (tempoCiclo < 150) {
            this.dayNightIcon.setText('🌅');
        } else if (tempoCiclo < 270) {
            this.dayNightIcon.setText('🌙');
        } else {
            this.dayNightIcon.setText('🌅');
        }

        this.scoreTxt.setText(this.gameScene.score + ' pts');
        this.killsTxt.setText('☠ ' + this.gameScene.killCount);

        // Efeito de piscar da vida critica
        const hpCritico = this.stats && this.stats.healthPercentagem < 0.25;
        if (hpCritico && !this.piscando) {
            this.piscando = true;
            this.tweens.add({
                targets: [this.criticalOverlay, this.criticalTxt],
                alpha: { from: 0, to: 0.12 },
                duration: 400, yoyo: true, repeat: -1
            });
        } else if (!hpCritico && this.piscando) {
            this.piscando = false;
            this.tweens.killTweensOf([this.criticalOverlay, this.criticalTxt]);
            this.criticalOverlay.setAlpha(0);
            this.criticalTxt.setAlpha(0);
        }
    }

    atualizarHotbar() {
        for (let i = 0; i < 8; i++) {
            const slot = this.inventory.slots[i];
            const bg   = this.slotBgs[i];
            const icon = this.slotIcons[i];
            const text = this.slotTexts[i];

            if (slot) {
                const def = ITEM_DB[slot.itemId];
                icon.setTexture(def ? def.icon : slot.itemId).setVisible(true);
                text.setText(slot.qty > 1 ? String(slot.qty) : '');
            } else {
                icon.setVisible(false);
                text.setText('');
            }

            bg.setTexture(i === this.inventory.selectedSlot ? 'itemdisc_02' : 'itemdisc_01');
        }

        if (this.labelItemSelecionado) {
            const selecionado = this.inventory.slots[this.inventory.selectedSlot];
            const defItem = selecionado ? ITEM_DB[selecionado.itemId] : null;
            this.labelItemSelecionado.setText(defItem ? defItem.name : '');
        }
    }

    atualizarBarrasStats() {
        const s = this.stats;
        const LS = this.layoutStats;
        const grafico = this.graficoPreenchimentoStats;
        grafico.clear();

        const preenchimentos = [
            { percentagem: s.healthPercentagem, cor: s.healthPercentagem < 0.25 ? 0xff0000 : 0xff4444 },
            { percentagem: s.hungerPercentagem, cor: s.hungerPercentagem < 0.20 ? 0xff6600 : 0xffaa00 },
            { percentagem: s.thirstPercentagem, cor: s.thirstPercentagem < 0.20 ? 0x0066ff : 0x44aaff },
            { percentagem: s.energyPercentagem, cor: 0x88ff44 },
        ];

        LS.rows.forEach((y, i) => {
            const fw = Math.max(8, LS.barW * preenchimentos[i].percentagem);
            grafico.fillStyle(preenchimentos[i].cor, 1);
            grafico.fillRoundedRect(LS.barX, y, fw, LS.barH, 4);
        });

        this.healthTxt.setText(Math.ceil(s.health)  + '/' + s.maxHealth);
        this.hungerTxt.setText(Math.ceil(s.hunger)  + '/' + s.maxHunger);
        this.thirstTxt.setText(Math.ceil(s.thirst)  + '/' + s.maxThirst);
        this.energyTxt.setText(Math.ceil(s.energy)  + '/' + s.maxEnergy);
    }

    atualizarQuest() {
        if (!this.quest || !this.raftSlots) return;
        this.quest.getProgress().forEach(p => {
            const entrada = this.raftSlots[p.id];
            if (!entrada) return;
            const { rects, cfg } = entrada;
            
            const atual = Math.max(p.current, this.inventory.getQuantity(p.id));
            rects.forEach((r, i) => {
                const cheio = i < atual;
                r.setFillStyle(cheio ? cfg.color : cfg.emptyColor);
                r.setStrokeStyle(1, cheio ? 0xffffff : 0x555555, cheio ? 0.5 : 1);
                
                if (cheio && !r._wasFilled) {
                    r._wasFilled = true;
                    this.tweens.add({
                        targets: r, scaleX: 1.4, scaleY: 1.4,
                        duration: 120, yoyo: true, ease: 'Sine.easeOut'
                    });
                } else if (!cheio) {
                    r._wasFilled = false;
                }
            });
        });
        if (this.questLogAberto) {
            this.atualizarPainelQuestLog();
        }
    }

    alternarQuestLog() {
        this.questLogAberto = !this.questLogAberto;
        this.questLogGroup.getChildren().forEach(c => c.setVisible(this.questLogAberto));
        if (this.questLogAberto) {
            this.atualizarPainelQuestLog();
        }
    }

    atualizarPainelQuestLog() {
        if (!this.quest) return;
        const progresso = this.quest.getProgress();
        this.linhasQuestLog.forEach(linha => {
            const p = progresso.find(pp => pp.id === linha.id);
            if (!p) return;
            
            const atual = Math.max(p.current, this.inventory.getQuantity(linha.id));
            const feito = atual >= p.required;
            linha.prog.setText(`${atual}/${p.required}`);
            linha.prog.setColor(feito ? '#88ff88' : '#ffaa88');
        });
    }

    alternarDiario() {
        this.bookOpen = !this.bookOpen;
        if (this.bookOpen) {
            this.pagDiario = 0;
            this.atualizarPaginaDiario();
            if (this.gameScene) this.gameScene.paused = true;
        } else {
            if (this.gameScene) this.gameScene.paused = false;
        }
        this.bookGroup.getChildren().forEach(c => c.setVisible(this.bookOpen));
        if (this.bookOpen) {
            this.atualizarNavegacaoDiario();
        }
    }

    virarPaginaDiario(direcao) {
        const paginas = this.obterPaginasDiario();
        const seguinte = this.pagDiario + direcao;
        if (seguinte < 0 || seguinte >= paginas.length) return;
        this.pagDiario = seguinte;
        this.atualizarPaginaDiario();
        this.atualizarNavegacaoDiario();
    }

    obterPaginasDiario() {
        const dados = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        return (dados && dados.book && dados.book.pages) || [];
    }

    atualizarPaginaDiario() {
        const dados = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        if (!dados || !dados.book) return;
        const paginas = dados.book.pages;
        const spread = paginas[this.pagDiario];
        if (!spread) return;

        this.diarioTitulo.setText(dados.book.title);
        this.diarioDivGrafico.clear(); 
        this.diarioTextoEsquerda.setText(spread[0] || '');
        this.diarioTextoDireita.setText(spread[1] || '');
        
        const total = paginas.length * 2;
        this.diarioNumeroPagina.setText(
            `— ${dados.book.page} ${this.pagDiario * 2 + 1}–${this.pagDiario * 2 + 2} / ${total} —`
        );
        this.diarioDicaFechar.setText(dados.book.close);
    }

    shutdown() {
        this.inventory?.off('changed',          this.atualizarHotbar, this);
        this.inventory?.off('changed',          this.atualizarQuest,  this);
        this.inventory?.off('selectionChanged',  this.atualizarHotbar, this);
        this.stats?.off('changed',               this.atualizarBarrasStats, this);
        if (this.quest) {
            this.quest.off('partDelivered',  this.atualizarQuest, this);
            this.quest.off('penaltyApplied', this.atualizarQuest, this);
        }
        this.game.events.off('quest:updated',        this.atualizarQuest, this);
        this.gameScene?.events.off('toggleQuestLog', this.alternarQuestLog, this);
        this.gameScene?.events.off('openBook',        this.alternarDiario, this);
        this.input.keyboard?.off('keydown-M');
        this.gameScene?.events.off('waveChanged',    this.onMudancaVaga, this);
    }

    atualizarNavegacaoDiario() {
        const paginas = this.obterPaginasDiario();
        const cx = this.scale.width / 2;
        const livroW = 600, livroH = 400;
        const cy = this.scale.height / 2;
        const navY = cy + livroH / 2 - 18;
        const prevX = cx - livroW / 2 + 38;
        const nextX = cx + livroW / 2 - 38;
        const temAnterior = this.pagDiario > 0;
        const temSeguinte = this.pagDiario < paginas.length - 1;

        this.diarioBtnAnteriorGrafico.setVisible(this.bookOpen && temAnterior);
        this.diarioBtnAnteriorTexto.setVisible(this.bookOpen && temAnterior);
        this.diarioBtnAnteriorZona.setVisible(this.bookOpen && temAnterior);
        
        this.diarioBtnSeguinteGrafico.setVisible(this.bookOpen && temSeguinte);
        this.diarioBtnSeguinteTexto.setVisible(this.bookOpen && temSeguinte);
        this.diarioBtnSeguinteZona.setVisible(this.bookOpen && temSeguinte);

        if (temAnterior) this.desenharBotaoNavegacao(this.diarioBtnAnteriorGrafico, prevX, navY, 48, 24, false);
        if (temSeguinte) this.desenharBotaoNavegacao(this.diarioBtnSeguinteGrafico, nextX, navY, 48, 24, false);
    }

    alternarMinimap() {
        this.minimapVisible = !this.minimapVisible;
        this.minimapBgGfx.setVisible(this.minimapVisible);
        this.minimapBorderGfx.setVisible(this.minimapVisible);
        this.minimapTerrainGfx.setVisible(this.minimapVisible);
        this.minimapDynamicGfx.setVisible(this.minimapVisible);
        this.minimapMText.setVisible(this.minimapVisible);
    }

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

        const tileW = miniW / mapWidthInTiles;
        const tileH = miniH / mapHeightInTiles;

        this.minimapTerrainGfx.clear();

        // Fundo verde
        this.minimapTerrainGfx.fillStyle(0x2d5a1b, 1);
        this.minimapTerrainGfx.fillRect(miniX, miniY, miniW, miniH);

        for (let ty = 0; ty < mapHeightInTiles; ty++) {
            for (let tx = 0; tx < mapWidthInTiles; tx++) {
                const chaoTile = mapa.getTileAt(tx, ty, true, 'chao');
                const chaoIndex = chaoTile ? chaoTile.index : -1;
                const ehAgua = chaoIndex >= 270 && chaoIndex <= 360;

                const colisaoTile = colisao.getTileAt(tx, ty);
                const ehSolido = colisaoTile && colisaoTile.index > 0;

                if (ehAgua) {
                    this.minimapTerrainGfx.fillStyle(0x1b3a5c, 1);
                    this.minimapTerrainGfx.fillRect(miniX + tx * tileW, miniY + ty * tileH, tileW + 0.1, tileH + 0.1);
                } else if (ehSolido) {
                    this.minimapTerrainGfx.fillStyle(0x4a3728, 1);
                    this.minimapTerrainGfx.fillRect(miniX + tx * tileW, miniY + ty * tileH, tileW + 0.1, tileH + 0.1);
                }
            }
        }
    }

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

        const escalaX = miniW / mapW;
        const escalaY = miniH / mapH;

        const limitar = (val, min, max) => Math.max(min, Math.min(max, val));

        // 1. Desenha as arvores vivas
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

        // 2. Desenha os itens recolhiveis
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

        // 3. Desenha a zona da jangada
        const jangada = this.gameScene.raftZone;
        if (jangada) {
            const rx = miniX + limitar(jangada.x, 0, mapW) * escalaX;
            const ry = miniY + limitar(jangada.y, 0, mapH) * escalaY;
            grafico.fillStyle(0xffd700, 1);
            grafico.fillCircle(rx, ry, 3.5);

            grafico.lineStyle(1, 0xffd700, 0.5);
            grafico.strokeCircle(rx, ry, 5);
        }

        // 4. Desenha inimigos
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

        // 5. Desenha o jogador
        const jogador = this.gameScene.player;
        const px = miniX + limitar(jogador.x, 0, mapW) * escalaX;
        const py = miniY + limitar(jogador.y, 0, mapH) * escalaY;

        const pisca = Math.floor(this.time.now / 200) % 2 === 0;
        const raioHalo = pisca ? 8 : 6;

        grafico.fillStyle(0xffffff, 0.4);
        grafico.fillCircle(px, py, raioHalo);

        grafico.fillStyle(0xffffff, 1);
        grafico.fillCircle(px, py, 4);
    }

    onMudancaVaga(w) {
        if (this.waveTxt) {
            this.waveTxt.setText(I18n.lang === 'pt' ? `ONDA ${w}` : `WAVE ${w}`);
        }
    }
}
