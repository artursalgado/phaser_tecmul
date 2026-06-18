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
        const hotbarY    = H - 36;

        this.add.rectangle(W / 2, hotbarY, totalWidth + 16, slotSize + 16, 0x000000, 0.4).setDepth(0);

        for (let i = 0; i < this.inventory.size; i++) {
            const x = hotbarX + i * (slotSize + spacing);

            const bg   = this.add.image(x, hotbarY, 'itemdisc_01').setScale(3).setDepth(1);
            const icon = this.add.image(x, hotbarY, 'wood').setScale(2.5).setVisible(false).setDepth(2);
            const text = this.add.text(x + 18, hotbarY + 18, '', {
                fontSize: '11px', fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 1).setDepth(3);

            // Número do slot (1-8)
            this.add.text(x - 20, hotbarY - 20, String(i + 1), {
                fontSize: '9px', fill: '#aaaaaa'
            }).setOrigin(0, 0).setDepth(3);

            this.slotBgs.push(bg);
            this.slotIcons.push(icon);
            this.slotTexts.push(text);
        }

        // Dica "E para usar"
        this.add.text(W / 2, hotbarY + 32, '[E] usar item   ·   [Q] registo da jangada', {
            fontSize: '9px', fill: '#888888'
        }).setOrigin(0.5).setDepth(3);

        //------------------------------------------------------------
        // BARRAS DE STATS (canto superior esquerdo)
        //------------------------------------------------------------
        const barW = 120;
        const barH = 10;
        const barX = 16;
        const labelX = barX + barW + 6;
        let barY = 20;
        const gap = 20;

        // Painél de fundo
        this.add.rectangle(barX + barW / 2, barY + gap * 1.5, barW + 50, 90, 0x000000, 0.4).setDepth(0);

        // VIDA — vermelho
        this.add.text(barX, barY, '❤', { fontSize: '10px', fill: '#ff4444' }).setDepth(3);
        this.healthBg  = this.add.rectangle(barX + 14 + barW / 2, barY + 4, barW, barH, 0x550000).setDepth(1);
        this.healthBar = this.add.rectangle(barX + 14, barY + 4, barW, barH, 0xff4444).setDepth(2).setOrigin(0, 0.5);
        this.healthTxt = this.add.text(labelX + 14, barY - 1, '', { fontSize: '9px', fill: '#ffaaaa' }).setDepth(3);

        barY += gap;

        // FOME — laranja
        this.add.text(barX, barY, '🍖', { fontSize: '10px', fill: '#ffaa00' }).setDepth(3);
        this.hungerBg  = this.add.rectangle(barX + 14 + barW / 2, barY + 4, barW, barH, 0x553300).setDepth(1);
        this.hungerBar = this.add.rectangle(barX + 14, barY + 4, barW, barH, 0xffaa00).setDepth(2).setOrigin(0, 0.5);
        this.hungerTxt = this.add.text(labelX + 14, barY - 1, '', { fontSize: '9px', fill: '#ffddaa' }).setDepth(3);

        barY += gap;

        // SEDE — azul
        this.add.text(barX, barY, '💧', { fontSize: '10px', fill: '#44aaff' }).setDepth(3);
        this.thirstBg  = this.add.rectangle(barX + 14 + barW / 2, barY + 4, barW, barH, 0x003355).setDepth(1);
        this.thirstBar = this.add.rectangle(barX + 14, barY + 4, barW, barH, 0x44aaff).setDepth(2).setOrigin(0, 0.5);
        this.thirstTxt = this.add.text(labelX + 14, barY - 1, '', { fontSize: '9px', fill: '#aaddff' }).setDepth(3);

        barY += gap;

        // ENERGIA — verde
        this.add.text(barX, barY, '⚡', { fontSize: '10px', fill: '#88ff44' }).setDepth(3);
        this.energyBg  = this.add.rectangle(barX + 14 + barW / 2, barY + 4, barW, barH, 0x223300).setDepth(1);
        this.energyBar = this.add.rectangle(barX + 14, barY + 4, barW, barH, 0x88ff44).setDepth(2).setOrigin(0, 0.5);
        this.energyTxt = this.add.text(labelX + 14, barY - 1, '', { fontSize: '9px', fill: '#ccffaa' }).setDepth(3);

        //------------------------------------------------------------
        // OUVIR EVENTOS
        //------------------------------------------------------------
        this.inventory.on('changed',         () => this._refreshHotbar());
        this.inventory.on('selectionChanged', () => this._refreshHotbar());
        this.stats.on('changed',             () => this._refreshBars());

        this._refreshHotbar();
        this._refreshBars();

        //------------------------------------------------------------
        // TIMER, SCORE E KILLS (canto superior direito)
        //------------------------------------------------------------
        this.timerTxt = this.add.text(W - 16, 16, '0:00', {
            fontSize: '14px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(3);

        this.scoreTxt = this.add.text(W - 16, 36, '0 pts', {
            fontSize: '11px', fill: '#ffdd44'
        }).setOrigin(1, 0).setDepth(3);

        this.killsTxt = this.add.text(W - 16, 52, '☠ 0', {
            fontSize: '11px', fill: '#ff8888'
        }).setOrigin(1, 0).setDepth(3);

        //------------------------------------------------------------
        // PAINEL DE OBJETIVOS DA JANGADA (canto superior direito, abaixo dos kills)
        //------------------------------------------------------------
        const questY0  = 76;
        const panelH2  = 72;
        const panelW2  = 152;
        this.add.rectangle(W - 8 - panelW2 / 2, questY0 + panelH2 / 2 - 4, panelW2, panelH2, 0x000000, 0.45)
            .setDepth(2);
        this.add.text(W - 16, questY0 - 4, 'JANGADA [F]', {
            fontSize: '9px', fill: '#ffdd66', fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(3);

        // Slots visuais por recurso
        // Configuração: cor preenchido, cor vazio, n slots
        const SLOT_CFG = {
            wood: { color: 0x88cc44, emptyColor: 0x334411, slots: 5 },
            rope: { color: 0xddaa44, emptyColor: 0x443311, slots: 3 },
            sail: { color: 0x44bbff, emptyColor: 0x112233, slots: 1 },
        };
        const SLOT_SIZE  = 10;
        const SLOT_GAP   = 3;
        const SLOT_RIGHT = W - 16;

        this._raftSlots = {};  // { wood: [rect, ...], rope: [...], sail: [...] }

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const rowY  = questY0 + 10 + i * 22;
                const cfg   = SLOT_CFG[p.id] || { color: 0xffffff, emptyColor: 0x333333, slots: 1 };
                const total = cfg.slots;
                const rowW  = total * SLOT_SIZE + (total - 1) * SLOT_GAP;

                // Label (ícone + nome)
                this.add.text(SLOT_RIGHT - rowW - 6, rowY + SLOT_SIZE / 2,
                    `${p.icon} ${p.label}`, { fontSize: '9px', fill: '#aaaaaa' }
                ).setOrigin(1, 0.5).setDepth(3);

                // Slots (da direita para a esquerda)
                const rects = [];
                for (let s = 0; s < total; s++) {
                    const sx = SLOT_RIGHT - (total - 1 - s) * (SLOT_SIZE + SLOT_GAP);
                    const r  = this.add.rectangle(sx, rowY + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, cfg.emptyColor)
                        .setStrokeStyle(1, 0x555555).setDepth(3);
                    rects.push(r);
                }
                this._raftSlots[p.id] = { rects, cfg };
            });

            this.quest.on('partDelivered', () => this._refreshQuest());
            this.quest.on('penaltyApplied', () => this._refreshQuest());
            this.game.events.on('quest:updated', () => this._refreshQuest(), this);
            this._refreshQuest();
        }

        //------------------------------------------------------------
        // QUEST LOG (painel detalhado, tecla Q)
        //------------------------------------------------------------
        this._buildQuestLog(W, H);
        this.gameScene.events.on('toggleQuestLog', () => this._toggleQuestLog());

        //------------------------------------------------------------
        // LIVRO / DIÁRIO DO NÁUFRAGO
        //------------------------------------------------------------
        this._buildBook(W, H);
        this.gameScene.events.on('openBook', () => this._toggleBook());

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
    }

    //----------------------------------------------------------------
    // ATUALIZAR BARRAS DE STATS
    //----------------------------------------------------------------
    _refreshBars() {
        const s = this.stats;
        const barW = 120;

        this.healthBar.setDisplaySize(Math.max(0, barW * s.healthPct), 10);
        this.hungerBar.setDisplaySize(Math.max(0, barW * s.hungerPct), 10);
        this.thirstBar.setDisplaySize(Math.max(0, barW * s.thirstPct), 10);
        this.energyBar.setDisplaySize(Math.max(0, barW * s.energyPct), 10);

        this.healthTxt.setText(Math.ceil(s.health)  + '/' + s.maxHealth);
        this.hungerTxt.setText(Math.ceil(s.hunger)  + '/' + s.maxHunger);
        this.thirstTxt.setText(Math.ceil(s.thirst)  + '/' + s.maxThirst);
        this.energyTxt.setText(Math.ceil(s.energy)  + '/' + s.maxEnergy);

        // Piscar vermelho quando crítico
        const pct = s.healthPct;
        this.healthBar.setFillStyle(pct < 0.25 ? 0xff0000 : 0xff4444);
        this.hungerBar.setFillStyle(s.hungerPct < 0.2 ? 0xff6600 : 0xffaa00);
        this.thirstBar.setFillStyle(s.thirstPct < 0.2 ? 0x0066ff : 0x44aaff);
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
        const bg = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x0b0b18, 0.92)
            .setStrokeStyle(2, 0x3366aa).setDepth(60).setScrollFactor(0).setVisible(false);
        const title = this.add.text(W / 2, H / 2 - panelH / 2 + 18,
            'REGISTO DA JANGADA', { fontSize: '14px', fill: '#ffdd66', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);
        const hint = this.add.text(W / 2, H / 2 + panelH / 2 - 14,
            '[Q] fechar', { fontSize: '9px', fill: '#888888' }
        ).setOrigin(0.5).setDepth(61).setScrollFactor(0).setVisible(false);

        this.questLogGroup.addMultiple([bg, title, hint]);
        this._questLogRows = [];

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const y = H / 2 - panelH / 2 + 48 + i * 50;
                const z = this._zoneInfo[p.id] || { fonte: '?', zona: '?' };

                const head = this.add.text(W / 2 - panelW / 2 + 20, y,
                    `${p.icon} ${p.label}`, { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }
                ).setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);
                const prog = this.add.text(W / 2 + panelW / 2 - 20, y,
                    '', { fontSize: '13px', fill: '#cccccc', fontStyle: 'bold' }
                ).setOrigin(1, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);
                const sub = this.add.text(W / 2 - panelW / 2 + 20, y + 18,
                    `${z.fonte} · ${z.zona}`, { fontSize: '10px', fill: '#8899aa' }
                ).setOrigin(0, 0.5).setDepth(61).setScrollFactor(0).setVisible(false);

                this.questLogGroup.addMultiple([head, prog, sub]);
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

        const bookW = 580, bookH = 380;
        const cx = W / 2, cy = H / 2;
        const D = 80;  // profundidade base

        // ── Dim overlay ──────────────────────────────────────────────
        this._bookDim = this.add.rectangle(cx, cy, W, H, 0x000000, 0.72)
            .setDepth(D).setVisible(false);

        // ── Canvas do livro (Graphics) ───────────────────────────────
        this._bookGfx = this.add.graphics().setDepth(D + 1).setVisible(false);
        this._drawBookGraphics(cx, cy, bookW, bookH);

        // ── Título ───────────────────────────────────────────────────
        this._bookTitle = this.add.text(cx, cy - bookH / 2 + 26, '', {
            fontFamily: 'Georgia, serif', fontSize: '17px',
            color: '#3a1f05', fontStyle: 'bold italic', align: 'center',
            stroke: '#c8a060', strokeThickness: 0,
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // Linha separadora sob o título
        this._bookDivGfx = this.add.graphics().setDepth(D + 2).setVisible(false);

        // ── Página esquerda ──────────────────────────────────────────
        const pageW  = bookW / 2 - 52;
        const textY  = cy - bookH / 2 + 54;
        const leftX  = cx - bookW / 2 + 36;
        const rightX = cx + 18;

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
        this._bookPageNum = this.add.text(cx, cy + bookH / 2 - 22, '', {
            fontFamily: 'Georgia, serif', fontSize: '11px',
            color: '#8b6e3a', align: 'center', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(D + 2).setVisible(false);

        // ── Botão anterior ◀ ─────────────────────────────────────────
        const navY   = cy + bookH / 2 - 22;
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

    _drawBookGraphics(cx, cy, bookW, bookH) {
        const g = this._bookGfx;
        g.clear();

        const r = 10; // raio cantos

        // Sombra exterior
        g.fillStyle(0x000000, 0.45);
        g.fillRoundedRect(cx - bookW/2 + 8, cy - bookH/2 + 8, bookW, bookH, r);

        // Capa exterior castanha (borda do livro)
        g.fillStyle(0x5c2e00, 1);
        g.fillRoundedRect(cx - bookW/2, cy - bookH/2, bookW, bookH, r);

        // Lombada central (sombra)
        g.fillStyle(0x3a1a00, 0.7);
        g.fillRect(cx - 10, cy - bookH/2, 20, bookH);

        // Página esquerda (pergaminho)
        g.fillStyle(0xf5e9c8, 1);
        g.fillRoundedRect(cx - bookW/2 + 12, cy - bookH/2 + 10, bookW/2 - 18, bookH - 20, { tl: r - 2, bl: r - 2, tr: 0, br: 0 });

        // Página esquerda — gradiente simulado (borda interior)
        g.fillStyle(0xe8d5a8, 0.5);
        g.fillRect(cx - bookW/2 + 12, cy - bookH/2 + 10, 6, bookH - 20);

        // Página direita (pergaminho ligeiramente diferente)
        g.fillStyle(0xf2e6c0, 1);
        g.fillRoundedRect(cx + 6, cy - bookH/2 + 10, bookW/2 - 18, bookH - 20, { tl: 0, bl: 0, tr: r - 2, br: r - 2 });

        // Linha da lombada visível
        g.lineStyle(1, 0x8b5010, 0.6);
        g.lineBetween(cx - 2, cy - bookH/2 + 14, cx - 2, cy + bookH/2 - 14);
        g.lineBetween(cx + 2, cy - bookH/2 + 14, cx + 2, cy + bookH/2 - 14);

        // Ornamento no topo da lombada
        g.fillStyle(0xc8800a, 1);
        g.fillRect(cx - 6, cy - bookH/2 + 10, 12, 4);
        g.fillRect(cx - 6, cy + bookH/2 - 14, 12, 4);

        // Borda interior das páginas (linha subtil)
        g.lineStyle(1, 0xc8a060, 0.4);
        g.strokeRoundedRect(cx - bookW/2 + 12, cy - bookH/2 + 10, bookW/2 - 18, bookH - 20, { tl: r - 2, bl: r - 2, tr: 0, br: 0 });
        g.strokeRoundedRect(cx + 6, cy - bookH/2 + 10, bookW/2 - 18, bookH - 20, { tl: 0, bl: 0, tr: r - 2, br: r - 2 });

        // Linhas de texto decorativas (página esquerda)
        g.lineStyle(1, 0xd4b880, 0.25);
        const lineStartX = cx - bookW/2 + 26;
        const lineEndX   = cx - 18;
        const lineStart  = cy - bookH/2 + 58;
        for (let i = 0; i < 14; i++) {
            const ly = lineStart + i * 20;
            if (ly < cy + bookH/2 - 28) {
                g.lineBetween(lineStartX, ly, lineEndX, ly);
            }
        }
        // Linhas de texto decorativas (página direita)
        const rLineStartX = cx + 18;
        const rLineEndX   = cx + bookW/2 - 26;
        for (let i = 0; i < 14; i++) {
            const ly = lineStart + i * 20;
            if (ly < cy + bookH/2 - 28) {
                g.lineBetween(rLineStartX, ly, rLineEndX, ly);
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

        const bookW  = 580, bookH = 380;
        const cx = 960 / 2, cy = 640 / 2;

        this._bookTitle.setText(data.book.title);

        // Redesenha a linha decorativa sob o título
        const d = this._bookDivGfx;
        d.clear();
        d.lineStyle(1, 0xa07040, 0.6);
        d.lineBetween(cx - bookW/2 + 28, cy - bookH/2 + 44, cx + bookW/2 - 28, cy - bookH/2 + 44);
        // Ornamentos da linha
        d.fillStyle(0xa07040, 0.7);
        d.fillTriangle(
            cx - 20, cy - bookH/2 + 44,
            cx,      cy - bookH/2 + 40,
            cx + 20, cy - bookH/2 + 44
        );

        this._bookLeftTxt.setText(spread[0] || '');
        this._bookRightTxt.setText(spread[1] || '');
        this._bookPageNum.setText(
            `— ${data.book.page} ${this._bookPage * 2 + 1}–${this._bookPage * 2 + 2} —`
        );
        this._bookCloseHint.setText(data.book.close);
    }

    _updateBookNav() {
        const pages = this._getBookPages();
        const cx = 960 / 2;
        const bookW = 580, bookH = 380;
        const cy = 640 / 2;
        const navY = cy + bookH / 2 - 22;
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

