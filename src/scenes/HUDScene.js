import { ITEM_DB } from '../systems/Inventory.js';

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
        this.questTxts = {};
        const questY0 = 76;
        this.add.rectangle(W - 16 - 75, questY0 + 28, 150, 64, 0x000000, 0.4)
            .setOrigin(0.5).setDepth(2);
        this.add.text(W - 16, questY0 - 4, 'JANGADA [F]', {
            fontSize: '9px', fill: '#ffdd66', fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(3);

        if (this.quest) {
            this.quest.getProgress().forEach((p, i) => {
                const t = this.add.text(W - 16, questY0 + 12 + i * 16, '', {
                    fontSize: '11px', fill: '#cccccc'
                }).setOrigin(1, 0).setDepth(3);
                this.questTxts[p.id] = t;
            });
            this.quest.on('partDelivered', () => this._refreshQuest());
            this.quest.on('penaltyApplied', () => this._refreshQuest());
            this._refreshQuest();
        }

        //------------------------------------------------------------
        // QUEST LOG (painel detalhado, tecla Q)
        //------------------------------------------------------------
        this._buildQuestLog(W, H);
        this.gameScene.events.on('toggleQuestLog', () => this._toggleQuestLog());

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
        if (!this.quest) return;
        this.quest.getProgress().forEach(p => {
            const t = this.questTxts[p.id];
            if (!t) return;
            t.setText(`${p.icon} ${p.label}: ${p.current}/${p.required}`);
            t.setColor(p.done ? '#88ff88' : '#cccccc');
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
}

