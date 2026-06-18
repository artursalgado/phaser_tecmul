import { ITEM_DB } from '../systems/Inventory.js';
import I18n from '../systems/I18n.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super('HUDScene');
    }

    create() {
        this.gameScene  = this.scene.get('GameScene');
        this.inventory  = this.gameScene.inventory;
        this.stats      = this.gameScene.stats;
        this.quest      = this.gameScene.quest;

        const W = 960;
        const H = 640;

        //------------------------------------------------------------
        // HOTBAR (inventário inferior)
        //------------------------------------------------------------
        this.slotBgs   = [];
        this.slotIcons = [];
        this.slotTexts = [];

        const slotSize   = 18 * 3;
        const spacing    = 6;
        const totalWidth = this.inventory.size * slotSize + (this.inventory.size - 1) * spacing;
        const hotbarX    = (W - totalWidth) / 2 + slotSize / 2;
        const hotbarY    = H - 38;

        // Painel RPG do hotbar (estende-se para cima para conter o hint)
        const hbw = totalWidth + 28;
        const hbg = this.add.graphics().setDepth(0);
        hbg.fillStyle(0x000000, 0.3);
        hbg.fillRoundedRect(W / 2 - hbw / 2 + 3, hotbarY - 47, hbw, 82, 8);
        hbg.fillStyle(0x160a00, 0.92);
        hbg.fillRoundedRect(W / 2 - hbw / 2, hotbarY - 50, hbw, 82, 8);
        hbg.lineStyle(1.5, 0xc8901a, 0.72);
        hbg.strokeRoundedRect(W / 2 - hbw / 2, hotbarY - 50, hbw, 82, 8);
        // Linha separadora entre hint e slots
        hbg.lineStyle(1, 0x6b3a1a, 0.5);
        hbg.lineBetween(W / 2 - hbw / 2 + 12, hotbarY - 30, W / 2 + hbw / 2 - 12, hotbarY - 30);

        // Dica de controlos (TOPO do painel, acima dos slots)
        this.add.text(W / 2, hotbarY - 40, '[E] usar   ·   [Q] jangada   ·   [I] inventário', {
            fontSize: '9px', fill: '#c8a870',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);

        for (let i = 0; i < this.inventory.size; i++) {
            const x = hotbarX + i * (slotSize + spacing);

            const bg   = this.add.image(x, hotbarY, 'itemdisc_01').setScale(3).setDepth(1);
            const icon = this.add.image(x, hotbarY, 'wood').setScale(2.5).setVisible(false).setDepth(2);
            const text = this.add.text(x + 18, hotbarY + 18, '', {
                fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 1).setDepth(3);

            // Número do slot (1-8)
            this.add.text(x - 20, hotbarY - 22, String(i + 1), {
                fontSize: '9px', fill: '#c8a870',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0, 0).setDepth(3);

            this.slotBgs.push(bg);
            this.slotIcons.push(icon);
            this.slotTexts.push(text);
        }

        // Nome do item selecionado (flutua acima do painel)
        this._selectedItemLabel = this.add.text(W / 2, hotbarY - 64, '', {
            fontSize: '11px', fill: '#f5e0b0', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(3);

        //------------------------------------------------------------
        // BARRAS DE STATS (canto superior esquerdo)
        //------------------------------------------------------------
        this._SL = {
            barX: 28, barW: 112, barH: 8,
            textX: 144,
            iconX: 16,
            rows: [16, 35, 54, 73],
        };
        const SL = this._SL;

        // Painel de fundo (estático, desenhado uma vez)
        const sbg = this.add.graphics().setDepth(1);
        sbg.fillStyle(0x000000, 0.35);
        sbg.fillRoundedRect(10, 10, 178, 90, 6);
        sbg.fillStyle(0x160a00, 0.92);
        sbg.fillRoundedRect(6, 6, 178, 90, 6);
        sbg.lineStyle(1.5, 0xc8901a, 0.72);
        sbg.strokeRoundedRect(6, 6, 178, 90, 6);
        SL.rows.forEach(y => {
            sbg.fillStyle(0x070300, 0.9);
            sbg.fillRoundedRect(SL.barX, y, SL.barW, SL.barH, 4);
        });

        // Preenchimento dinâmico das barras
        this._statFillGfx = this.add.graphics().setDepth(2);

        // Ícones canvas
        [
            { key: 'stat_health', y: SL.rows[0] },
            { key: 'stat_hunger', y: SL.rows[1] },
            { key: 'stat_thirst', y: SL.rows[2] },
            { key: 'stat_energy', y: SL.rows[3] },
        ].forEach(({ key, y }) => {
            this.add.image(SL.iconX, y + SL.barH / 2, key)
                .setDisplaySize(12, 12).setOrigin(0.5).setDepth(3);
        });

        // Labels de valor
        this.healthTxt = this.add.text(SL.textX, SL.rows[0] - 1, '', { fontSize: '9px', fill: '#ffaaaa' }).setDepth(3);
        this.hungerTxt = this.add.text(SL.textX, SL.rows[1] - 1, '', { fontSize: '9px', fill: '#ffddaa' }).setDepth(3);
        this.thirstTxt = this.add.text(SL.textX, SL.rows[2] - 1, '', { fontSize: '9px', fill: '#aaddff' }).setDepth(3);
        this.energyTxt = this.add.text(SL.textX, SL.rows[3] - 1, '', { fontSize: '9px', fill: '#ccffaa' }).setDepth(3);

        //------------------------------------------------------------
        // OUVIR EVENTOS
        //------------------------------------------------------------
        this.inventory.on('changed',         this._refreshHotbar, this);
        this.inventory.on('selectionChanged', this._refreshHotbar, this);
        this.stats.on('changed',             this._refreshBars,   this);

        this._refreshHotbar();
        this._refreshBars();

        //------------------------------------------------------------
        // PAINEL UNIFICADO — JANGADA + TIMER (canto superior direito)
        //------------------------------------------------------------
        const QPX  = W - 8 - 168;
        const QPY  = 8;
        const QPW  = 168;
        const QPH  = 130;
        const QPHH = 22;
        const QSEP = 96;   // y da linha separadora quest/stats

        const qg = this.add.graphics().setDepth(2);
        qg.fillStyle(0x000000, 0.35);
        qg.fillRoundedRect(QPX + 4, QPY + 4, QPW, QPH, 6);
        qg.fillStyle(0x160a00, 0.92);
        qg.fillRoundedRect(QPX, QPY, QPW, QPH, 6);
        qg.lineStyle(1.5, 0xc8901a, 0.72);
        qg.strokeRoundedRect(QPX, QPY, QPW, QPH, 6);
        qg.fillStyle(0x3d1a00, 1);
        qg.fillRoundedRect(QPX, QPY, QPW, QPHH, { tl: 6, tr: 6, bl: 0, br: 0 });
        qg.lineStyle(1, 0xc8901a, 0.6);
        qg.lineBetween(QPX + 8, QPY + QPHH, QPX + QPW - 8, QPY + QPHH);
        qg.lineStyle(1, 0x6b3a1a, 0.5);
        qg.lineBetween(QPX + 8, QSEP, QPX + QPW - 8, QSEP);

        this.add.text(QPX + QPW / 2, QPY + QPHH / 2, 'JANGADA  [F]', {
            fontSize: '9px', fill: '#f5c070', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        // Timer (secção inferior do painel)
        this.timerTxt = this.add.text(QPX + QPW / 2, QSEP + 6, '0:00', {
            fontSize: '13px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(3);

        this.scoreTxt = this.add.text(QPX + 10, QSEP + 24, '0 pts', {
            fontSize: '10px', fill: '#ffdd44'
        }).setOrigin(0, 0).setDepth(3);

        this.killsTxt = this.add.text(QPX + QPW - 10, QSEP + 24, '☠ 0', {
            fontSize: '10px', fill: '#ff8888'
        }).setOrigin(1, 0).setDepth(3);

        const SLOT_CFG = {
            wood: { color: 0x88cc44, emptyColor: 0x334411, slots: 5 },
            rope: { color: 0xddaa44, emptyColor: 0x443311, slots: 3 },
            sail: { color: 0x44bbff, emptyColor: 0x112233, slots: 1 },
        };
        const SLOT_SIZE  = 11;
        const SLOT_GAP   = 3;
        const SLOT_RIGHT = QPX + QPW - 8;

        this._raftSlots = {};

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const rowCY = QPY + QPHH + 11 + i * 22;
                const cfg   = SLOT_CFG[p.id] || { color: 0xffffff, emptyColor: 0x333333, slots: 1 };
                const total = cfg.slots;

                // Ícone real do item (sem emoji)
                this.add.image(QPX + 10, rowCY, p.id)
                    .setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(3);

                // Label
                this.add.text(QPX + 28, rowCY, p.label, {
                    fontSize: '9px', fill: '#ccbb88'
                }).setOrigin(0, 0.5).setDepth(3);

                // Slots de progresso
                const rects = [];
                for (let s = 0; s < total; s++) {
                    const sx = SLOT_RIGHT - (total - 1 - s) * (SLOT_SIZE + SLOT_GAP);
                    const r  = this.add.rectangle(sx, rowCY, SLOT_SIZE, SLOT_SIZE, cfg.emptyColor)
                        .setStrokeStyle(1, 0x665533).setDepth(3);
                    rects.push(r);
                }
                this._raftSlots[p.id] = { rects, cfg };
            });

            this.quest.on('partDelivered',  this._refreshQuest, this);
            this.quest.on('penaltyApplied', this._refreshQuest, this);
            this.game.events.on('quest:updated', this._refreshQuest, this);
            this._refreshQuest();
        }

        //------------------------------------------------------------
        // QUEST LOG (painel detalhado, tecla Q)
        //------------------------------------------------------------
        this._buildQuestLog(W, H);
        this.gameScene.events.on('toggleQuestLog', this._toggleQuestLog, this);

        //------------------------------------------------------------
        // LIVRO / DIÁRIO DO NÁUFRAGO
        //------------------------------------------------------------
        this._buildBook(W, H);
        this.gameScene.events.on('openBook', this._toggleBook, this);

        //------------------------------------------------------------
        // AVISO DE VIDA CRÍTICA (overlay de tela cheia, escondido por defeito)
        //------------------------------------------------------------
        this.criticalOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0).setDepth(50);
        this.criticalTxt = this.add.text(W / 2, 80, '⚠ VIDA CRÍTICA', {
            fontSize: '16px', fill: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(51);
        this._blinking = false;
    }

    update() {
        if (!this.gameScene) return;

        // Timer
        const sec  = Math.floor(this.gameScene.elapsedSec);
        const mm   = Math.floor(sec / 60);
        const ss   = String(sec % 60).padStart(2, '0');
        this.timerTxt.setText(`${mm}:${ss}`);

        // Score e kills
        this.scoreTxt.setText(this.gameScene.score + ' pts');
        this.killsTxt.setText('☠ ' + this.gameScene.killCount);

        // Barra de progresso da jangada — sera ligada ao QuestManager num commit futuro
        // (por agora a barra fica parada a 0, sem usar o tempo)

        // Aviso crítico de HP
        const hpCritical = this.stats && this.stats.healthPct < 0.25;
        if (hpCritical && !this._blinking) {
            this._blinking = true;
            this.tweens.add({
                targets: [this.criticalOverlay, this.criticalTxt],
                alpha: { from: 0, to: 0.12 },
                duration: 400, yoyo: true, repeat: -1
            });
        } else if (!hpCritical && this._blinking) {
            this._blinking = false;
            this.tweens.killTweensOf([this.criticalOverlay, this.criticalTxt]);
            this.criticalOverlay.setAlpha(0);
            this.criticalTxt.setAlpha(0);
        }
    }

    //----------------------------------------------------------------
    // ATUALIZAR HOTBAR
    //----------------------------------------------------------------
    _refreshHotbar() {
        this.inventory.slots.forEach((slot, i) => {
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
        });

        // Atualizar label com nome do item selecionado
        if (this._selectedItemLabel) {
            const sel    = this.inventory.slots[this.inventory.selectedSlot];
            const selDef = sel ? ITEM_DB[sel.itemId] : null;
            this._selectedItemLabel.setText(selDef ? selDef.name : '');
        }
    }

    //----------------------------------------------------------------
    // ATUALIZAR BARRAS DE STATS
    //----------------------------------------------------------------
    _refreshBars() {
        const s   = this.stats;
        const SL  = this._SL;
        const gfx = this._statFillGfx;
        gfx.clear();

        const fills = [
            { pct: s.healthPct, color: s.healthPct < 0.25 ? 0xff0000 : 0xff4444 },
            { pct: s.hungerPct, color: s.hungerPct < 0.20 ? 0xff6600 : 0xffaa00 },
            { pct: s.thirstPct, color: s.thirstPct < 0.20 ? 0x0066ff : 0x44aaff },
            { pct: s.energyPct, color: 0x88ff44 },
        ];

        SL.rows.forEach((y, i) => {
            const fw = Math.max(8, SL.barW * fills[i].pct);
            gfx.fillStyle(fills[i].color, 1);
            gfx.fillRoundedRect(SL.barX, y, fw, SL.barH, 4);
        });

        this.healthTxt.setText(Math.ceil(s.health)  + '/' + s.maxHealth);
        this.hungerTxt.setText(Math.ceil(s.hunger)  + '/' + s.maxHunger);
        this.thirstTxt.setText(Math.ceil(s.thirst)  + '/' + s.maxThirst);
        this.energyTxt.setText(Math.ceil(s.energy)  + '/' + s.maxEnergy);
    }

    //----------------------------------------------------------------
    // ATUALIZAR PAINEL DE OBJETIVOS DA JANGADA
    //----------------------------------------------------------------
    _refreshQuest() {
        if (!this.quest || !this._raftSlots) return;
        this.quest.getProgress().forEach(p => {
            const entry = this._raftSlots[p.id];
            if (!entry) return;
            const { rects, cfg } = entry;
            rects.forEach((r, i) => {
                const filled = i < p.current;
                r.setFillStyle(filled ? cfg.color : cfg.emptyColor);
                r.setStrokeStyle(1, filled ? 0xffffff : 0x555555, filled ? 0.5 : 1);
                // Pulso no slot que acabou de ser preenchido
                if (filled && !r._wasFilled) {
                    r._wasFilled = true;
                    this.tweens.add({
                        targets: r, scaleX: 1.4, scaleY: 1.4,
                        duration: 120, yoyo: true, ease: 'Sine.easeOut'
                    });
                } else if (!filled) {
                    r._wasFilled = false;
                }
            });
        });
        if (this._questLogOpen) this._refreshQuestLogPanel();
    }

    //----------------------------------------------------------------
    // QUEST LOG -- painel detalhado com fonte/zona de cada recurso (tecla Q)
    //----------------------------------------------------------------
    _buildQuestLog(W, H) {
        // Fonte/zona de cada recurso -- so para texto, nao afeta o QuestManager
        this._zoneInfo = {
            wood: { fonte: 'Cortar árvores (ESPAÇO)', zona: 'Floresta' },
            rope: { fonte: 'Destroços / baús',         zona: 'Praia oposta' },
            sail: { fonte: 'Drop do boss skeleton',    zona: 'Zona rochosa' },
        };

        this._questLogOpen = false;
        this.questLogGroup = this.add.group();

        const panelW = 360, panelH = 220;
        const cx = W / 2 - panelW / 2;
        const cy = H / 2 - panelH / 2;
        const HEADER_H = 28;

        const bgGfx = this.add.graphics().setDepth(60).setScrollFactor(0).setVisible(false);
        // Sombra
        bgGfx.fillStyle(0x000000, 0.35);
        bgGfx.fillRoundedRect(cx + 4, cy + 4, panelW, panelH, 6);
        // Fundo castanho escuro
        bgGfx.fillStyle(0x160a00, 0.92);
        bgGfx.fillRoundedRect(cx, cy, panelW, panelH, 6);
        // Borda dourada
        bgGfx.lineStyle(1.5, 0xc8901a, 0.72);
        bgGfx.strokeRoundedRect(cx, cy, panelW, panelH, 6);
        // Header band
        bgGfx.fillStyle(0x3d1a00, 1);
        bgGfx.fillRoundedRect(cx, cy, panelW, HEADER_H, { tl: 6, tr: 6, bl: 0, br: 0 });
        // Linha divisória dourada
        bgGfx.lineStyle(1, 0xc8901a, 0.6);
        bgGfx.lineBetween(cx + 8, cy + HEADER_H, cx + panelW - 8, cy + HEADER_H);

        const title = this.add.text(cx + panelW / 2, cy + HEADER_H / 2,
            'REGISTO DA JANGADA', { fontSize: '11px', fill: '#f5c070', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);

        const hint = this.add.text(W / 2, H / 2 + panelH / 2 - 14,
            '[Q] fechar', { fontSize: '9px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);

        this.questLogGroup.addMultiple([bgGfx, title, hint]);
        this._questLogRows = [];

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const y = H / 2 - panelH / 2 + 48 + i * 50;
                const z = this._zoneInfo[p.id] || { fonte: '?', zona: '?' };

                const iconX = W / 2 - panelW / 2 + 20;
                const img = this.add.image(iconX, y, p.id)
                    .setDisplaySize(14, 14)
                    .setOrigin(0, 0.5)
                    .setDepth(61)
                    .setScrollFactor(0)
                    .setVisible(false);

                const labelX = iconX + 22;
                const head = this.add.text(labelX, y,
                    p.label, { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }
                ).setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                const prog = this.add.text(W / 2 + panelW / 2 - 20, y,
                    '', { fontSize: '13px', fill: '#cccccc', fontStyle: 'bold' }
                ).setOrigin(1, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                const sub = this.add.text(iconX, y + 18,
                    `${z.fonte} · ${z.zona}`, { fontSize: '10px', fill: '#8899aa' }
                ).setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                this.questLogGroup.addMultiple([img, head, prog, sub]);
                this._questLogRows.push({ id: p.id, head, prog, sub });
            });
        }
    }

    _toggleQuestLog() {
        this._questLogOpen = !this._questLogOpen;
        this.questLogGroup.getChildren().forEach(c => c.setVisible(this._questLogOpen));
        if (this._questLogOpen) this._refreshQuestLogPanel();
    }

    _refreshQuestLogPanel() {
        if (!this.quest) return;
        const progress = this.quest.getProgress();
        this._questLogRows.forEach(row => {
            const p = progress.find(pp => pp.id === row.id);
            if (!p) return;
            row.prog.setText(`${p.current}/${p.required}`);
            row.prog.setColor(p.done ? '#88ff88' : '#ffaa88');
        });
    }

    //----------------------------------------------------------------
    // LIVRO / DIÁRIO DO NÁUFRAGO
    //----------------------------------------------------------------
    _buildBook(W, H) {
        this._bookOpen = false;
        this._bookPage = 0;
        this.bookGroup = this.add.group();

        const bookW = 600, bookH = 400;
        const cx = W / 2, cy = H / 2;
        const D = 80;  // profundidade base
        // Header castanho no topo do livro (acima das páginas)
        const HEADER_H = 44;

        // ── Dim overlay ──────────────────────────────────────────────
        this._bookDim = this.add.rectangle(cx, cy, W, H, 0x000000, 0.72)
            .setDepth(D).setVisible(false);

        // ── Canvas do livro (Graphics) ───────────────────────────────
        this._bookGfx = this.add.graphics().setDepth(D + 1).setVisible(false);
        this._drawBookGraphics(cx, cy, bookW, bookH, HEADER_H);

        // ── Título — fica na banda castanha do header ─────────────────
        // Header vai de cy-bookH/2 a cy-bookH/2+HEADER_H
        // Centramos o título verticalmente nessa banda
        this._bookTitle = this.add.text(cx, cy - bookH / 2 + HEADER_H / 2 + 2, '', {
            fontFamily: 'Georgia, serif', fontSize: '18px',
            color: '#f5e0b0', fontStyle: 'bold italic', align: 'center',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // Linha separadora (entre header e páginas)
        this._bookDivGfx = this.add.graphics().setDepth(D + 2).setVisible(false);

        // ── Página esquerda ──────────────────────────────────────────
        const pageW  = bookW / 2 - 50;
        const textY  = cy - bookH / 2 + HEADER_H + 16;
        const leftX  = cx - bookW / 2 + 28;
        const rightX = cx + 14;

        this._bookLeftTxt = this.add.text(leftX, textY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px',
            color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: pageW },
        }).setDepth(D + 2).setVisible(false);

        // ── Página direita ───────────────────────────────────────────
        this._bookRightTxt = this.add.text(rightX, textY, '', {
            fontFamily: 'Georgia, serif', fontSize: '12.5px',
            color: '#2e1c06', lineSpacing: 5,
            wordWrap: { width: pageW },
        }).setDepth(D + 2).setVisible(false);

        // ── Número de página ─────────────────────────────────────────
        this._bookPageNum = this.add.text(cx, cy + bookH / 2 - 18, '', {
            fontFamily: 'Georgia, serif', fontSize: '11px',
            color: '#8b6e3a', align: 'center', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // ── Botão anterior ◀ ─────────────────────────────────────────
        const navY   = cy + bookH / 2 - 18;
        const navBtnW = 48, navBtnH = 24;
        const prevX  = cx - bookW / 2 + 38;
        const nextX  = cx + bookW / 2 - 38;

        this._bookPrevGfx = this.add.graphics().setDepth(D + 2).setVisible(false);
        this._bookPrevTxt = this.add.text(prevX, navY, '◀', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        this._bookPrevZone = this.add.zone(prevX, navY, navBtnW, navBtnH)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this._bookPrevZone.on('pointerover',  () => this._bookNavHover('prev', true));
        this._bookPrevZone.on('pointerout',   () => this._bookNavHover('prev', false));
        this._bookPrevZone.on('pointerdown',  () => this._bookFlipPage(-1));

        // ── Botão seguinte ▶ ─────────────────────────────────────────
        this._bookNextGfx = this.add.graphics().setDepth(D + 2).setVisible(false);
        this._bookNextTxt = this.add.text(nextX, navY, '▶', {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6b4010',
        }).setOrigin(0.5).setDepth(D + 3).setVisible(false);
        this._bookNextZone = this.add.zone(nextX, navY, navBtnW, navBtnH)
            .setInteractive({ useHandCursor: true }).setDepth(D + 4).setVisible(false);
        this._bookNextZone.on('pointerover',  () => this._bookNavHover('next', true));
        this._bookNextZone.on('pointerout',   () => this._bookNavHover('next', false));
        this._bookNextZone.on('pointerdown',  () => this._bookFlipPage(1));

        // ── Dica fechar ──────────────────────────────────────────────
        this._bookCloseHint = this.add.text(cx, cy + bookH / 2 + 16, '', {
            fontFamily: 'Georgia, serif', fontSize: '10px',
            color: '#7a6040', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        this.bookGroup.addMultiple([
            this._bookDim, this._bookGfx, this._bookDivGfx,
            this._bookTitle, this._bookLeftTxt, this._bookRightTxt,
            this._bookPageNum,
            this._bookPrevGfx, this._bookPrevTxt, this._bookPrevZone,
            this._bookNextGfx, this._bookNextTxt, this._bookNextZone,
            this._bookCloseHint,
        ]);

        this.input.keyboard.on('keydown-ESC', () => {
            if (this._bookOpen) this._toggleBook();
        });
    }

    _drawBookGraphics(cx, cy, bookW, bookH, headerH) {
        const g = this._bookGfx;
        g.clear();
        const r = 10;

        // Sombra exterior
        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(cx - bookW/2 + 10, cy - bookH/2 + 10, bookW, bookH, r);

        // Capa exterior castanha (todo o livro)
        g.fillStyle(0x5c2e00, 1);
        g.fillRoundedRect(cx - bookW/2, cy - bookH/2, bookW, bookH, r);

        // Borda exterior dourada
        g.lineStyle(2, 0xc8901a, 0.7);
        g.strokeRoundedRect(cx - bookW/2 + 1, cy - bookH/2 + 1, bookW - 2, bookH - 2, r);

        // Banda do header (castanho mais escuro)
        g.fillStyle(0x3d1a00, 0.9);
        g.fillRoundedRect(cx - bookW/2, cy - bookH/2, bookW, headerH, { tl: r, tr: r, bl: 0, br: 0 });

        // Linha divisória entre header e páginas
        g.lineStyle(3, 0xc8901a, 0.9);
        g.lineBetween(cx - bookW/2, cy - bookH/2 + headerH, cx + bookW/2, cy - bookH/2 + headerH);

        // Ornamentos da linha (triângulos centrais)
        g.fillStyle(0xc8901a, 1);
        g.fillTriangle(
            cx - 16, cy - bookH/2 + headerH,
            cx,      cy - bookH/2 + headerH - 8,
            cx + 16, cy - bookH/2 + headerH
        );
        g.fillTriangle(
            cx - 16, cy - bookH/2 + headerH,
            cx,      cy - bookH/2 + headerH + 8,
            cx + 16, cy - bookH/2 + headerH
        );

        // Lombada central (abaixo do header)
        const spineTop = cy - bookH/2 + headerH;
        g.fillStyle(0x3a1a00, 0.6);
        g.fillRect(cx - 8, spineTop, 16, bookH - headerH);

        // Página esquerda (pergaminho)
        const pageTop = spineTop + 6;
        const pageBot = bookH - headerH - 16;
        g.fillStyle(0xf5e9c8, 1);
        g.fillRoundedRect(cx - bookW/2 + 10, pageTop, bookW/2 - 16, pageBot, { tl: 0, bl: r - 2, tr: 0, br: 0 });

        // Borda interior esquerda (sombra lombada)
        g.fillStyle(0xd4b880, 0.3);
        g.fillRect(cx - bookW/2 + 10, pageTop, 8, pageBot);

        // Página direita (pergaminho)
        g.fillStyle(0xf0e4bc, 1);
        g.fillRoundedRect(cx + 6, pageTop, bookW/2 - 16, pageBot, { tl: 0, bl: 0, tr: 0, br: r - 2 });

        // Ornamentos lombada (nós)
        g.fillStyle(0xc8901a, 1);
        g.fillRect(cx - 5, spineTop + 10, 10, 5);
        g.fillRect(cx - 5, cy + bookH/2 - 20, 10, 5);
        g.fillRect(cx - 5, cy, 10, 4);

        // Borda interior das páginas
        g.lineStyle(1, 0xc8a060, 0.3);
        g.strokeRoundedRect(cx - bookW/2 + 10, pageTop, bookW/2 - 16, pageBot, { tl: 0, bl: r - 2, tr: 0, br: 0 });
        g.strokeRoundedRect(cx + 6, pageTop, bookW/2 - 16, pageBot, { tl: 0, bl: 0, tr: 0, br: r - 2 });

        // Linhas de pauta decorativas
        g.lineStyle(1, 0xd4b880, 0.2);
        const lineStep = 22;
        const lineStart = pageTop + 20;
        for (let i = 0; i < 12; i++) {
            const ly = lineStart + i * lineStep;
            if (ly < cy + bookH/2 - 24) {
                g.lineBetween(cx - bookW/2 + 20, ly, cx - 14, ly);
                g.lineBetween(cx + 14, ly, cx + bookW/2 - 20, ly);
            }
        }
    }

    _drawNavBtn(gfx, x, y, w, h, hover) {
        gfx.clear();
        gfx.fillStyle(hover ? 0x7a4820 : 0x5a3010, 0.85);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, 5);
        gfx.lineStyle(1, hover ? 0xd4a050 : 0x9a6030, 1);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, 5);
    }

    _bookNavHover(side, on) {
        if (side === 'prev') {
            this._drawNavBtn(this._bookPrevGfx,
                this._bookPrevTxt.x, this._bookPrevTxt.y, 48, 24, on);
            this._bookPrevTxt.setStyle({ color: on ? '#f0c060' : '#6b4010' });
        } else {
            this._drawNavBtn(this._bookNextGfx,
                this._bookNextTxt.x, this._bookNextTxt.y, 48, 24, on);
            this._bookNextTxt.setStyle({ color: on ? '#f0c060' : '#6b4010' });
        }
    }

    _toggleBook() {
        this._bookOpen = !this._bookOpen;
        if (this._bookOpen) {
            this._bookPage = 0;
            this._refreshBookPage();
            if (this.gameScene) this.gameScene._paused = true;
        } else {
            if (this.gameScene) this.gameScene._paused = false;
        }
        this.bookGroup.getChildren().forEach(c => c.setVisible(this._bookOpen));
        if (this._bookOpen) this._updateBookNav();
    }

    _bookFlipPage(dir) {
        const pages = this._getBookPages();
        const next = this._bookPage + dir;
        if (next < 0 || next >= pages.length) return;
        this._bookPage = next;
        this._refreshBookPage();
        this._updateBookNav();
    }

    _getBookPages() {
        const data = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        return (data && data.book && data.book.pages) || [];
    }

    _refreshBookPage() {
        const data = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        if (!data || !data.book) return;
        const pages  = data.book.pages;
        const spread = pages[this._bookPage];
        if (!spread) return;

        this._bookTitle.setText(data.book.title);
        this._bookDivGfx.clear(); // já não é necessário — linha desenhada em _drawBookGraphics
        this._bookLeftTxt.setText(spread[0] || '');
        this._bookRightTxt.setText(spread[1] || '');
        const total = pages.length * 2;
        this._bookPageNum.setText(
            `— ${data.book.page} ${this._bookPage * 2 + 1}–${this._bookPage * 2 + 2} / ${total} —`
        );
        this._bookCloseHint.setText(data.book.close);
    }

    shutdown() {
        this.inventory?.off('changed',          this._refreshHotbar, this);
        this.inventory?.off('selectionChanged',  this._refreshHotbar, this);
        this.stats?.off('changed',               this._refreshBars,   this);
        if (this.quest) {
            this.quest.off('partDelivered',  this._refreshQuest, this);
            this.quest.off('penaltyApplied', this._refreshQuest, this);
        }
        this.game.events.off('quest:updated',        this._refreshQuest,    this);
        this.gameScene?.events.off('toggleQuestLog', this._toggleQuestLog,  this);
        this.gameScene?.events.off('openBook',        this._toggleBook,      this);
    }

    _updateBookNav() {
        const pages = this._getBookPages();
        const cx = 960 / 2;
        const bookW = 600, bookH = 400;
        const cy = 640 / 2;
        const navY = cy + bookH / 2 - 18;
        const prevX = cx - bookW / 2 + 38;
        const nextX = cx + bookW / 2 - 38;
        const hasPrev = this._bookPage > 0;
        const hasNext = this._bookPage < pages.length - 1;

        this._bookPrevGfx.setVisible(this._bookOpen && hasPrev);
        this._bookPrevTxt.setVisible(this._bookOpen && hasPrev);
        this._bookPrevZone.setVisible(this._bookOpen && hasPrev);
        this._bookNextGfx.setVisible(this._bookOpen && hasNext);
        this._bookNextTxt.setVisible(this._bookOpen && hasNext);
        this._bookNextZone.setVisible(this._bookOpen && hasNext);

        if (hasPrev) this._drawNavBtn(this._bookPrevGfx, prevX, navY, 48, 24, false);
        if (hasNext) this._drawNavBtn(this._bookNextGfx, nextX, navY, 48, 24, false);
    }
}

