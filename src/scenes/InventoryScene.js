import { ITEM_DB } from '../systems/Inventory.js';
import I18n from '../systems/I18n.js';

const CAT_ACCENT = {
    tool:     0x4499cc,
    resource: 0x55bb55,
    food:     0xffaa44,
    quest:    0xaa66ff,
};
const CAT_COLOR_STR = {
    tool: '#4499cc', resource: '#55bb55', food: '#ffaa44', quest: '#aa66ff',
};
const RARITY_COLOR_STR = {
    common: '#aaaaaa', rare: '#ffdd88', quest: '#cc88ff',
};
const FILTERS = ['all', 'tool', 'resource', 'food', 'quest'];

// Layout
const W = 960, H = 640;
const PW = 600, PH = 380;
const CX = W / 2, CY = H / 2;
const PL = CX - PW / 2;   // 180
const PR = CX + PW / 2;   // 780
const PT = CY - PH / 2;   // 130
const PB = CY + PH / 2;   // 510
const HDR = 40;
const FLT = 26;
const PAD = 14;

const SLOT = 44;
const SGAP = 8;
const SCOLS = 4;

const GL = PL + PAD;                                   // grid left  = 194
const GT = PT + HDR + FLT + 8;                         // grid top   = 204
const GR = GL + SCOLS * (SLOT + SGAP) - SGAP;          // grid right = 458

const DL = GR + 14;                                    // detail left  = 472
const DW = PR - PAD - DL;                              // detail width = 294
const DT = PT + HDR + 8;                               // detail top   = 178
const DH = PB - 28 - DT;                               // detail height= 304

export default class InventoryScene extends Phaser.Scene {
    constructor() { super('InventoryScene'); }

    create() {
        this._inv          = this.scene.get('GameScene').inventory;
        this._selectedIdx  = -1;
        this._filterCat    = 'all';
        this._dragFrom     = -1;
        this._ghostIcon    = null;

        // ── Dim overlay ──────────────────────────────────────────────
        this.add.rectangle(CX, CY, W, H, 0x000000, 0.62)
            .setInteractive().setDepth(0);

        // ── Painel ───────────────────────────────────────────────────
        this._drawPanelBg();

        // ── Título ───────────────────────────────────────────────────
        this.add.text(CX, PT + 22, I18n.t('inventory.title'), {
            fontFamily: 'Georgia, serif', fontSize: '16px',
            color: '#f5e0b0', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);

        // ── Filtros ──────────────────────────────────────────────────
        this._buildFilters();

        // ── Slots ────────────────────────────────────────────────────
        this._buildSlots();

        // ── Painel de detalhe ────────────────────────────────────────
        this._buildDetail();

        // ── Dica fechar ──────────────────────────────────────────────
        this.add.text(CX, PB - 14, I18n.t('inventory.hint'), {
            fontSize: '9px', color: '#665544', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(2);

        // ── Teclado ──────────────────────────────────────────────────
        this.input.keyboard.on('keydown-ESC', () => this._close());
        this.input.keyboard.on('keydown-I',   () => this._close());

        // ── Drag & Drop ──────────────────────────────────────────────
        this.input.on('pointermove', (ptr) => {
            if (this._ghostIcon) this._ghostIcon.setPosition(ptr.x, ptr.y);
        });

        this.input.on('pointerup', (ptr) => {
            if (this._dragFrom < 0) return;
            
            // Encontrar slot de destino por posição
            const from = this._dragFrom;
            let toIdx = -1;
            for (let j = 0; j < this._slotObjs.length; j++) {
                const { sx, sy } = this._slotObjs[j];
                if (Math.abs(ptr.x - sx) < SLOT / 2 && Math.abs(ptr.y - sy) < SLOT / 2) {
                    toIdx = j;
                    break;
                }
            }
            
            // Limpar ghost
            if (this._ghostIcon) {
                this._ghostIcon.destroy();
                this._ghostIcon = null;
            }
            this._dragFrom = -1;
            
            if (toIdx >= 0 && toIdx !== from) {
                this._inv.moveSlot(from, toIdx);
            } else if (toIdx === from || toIdx < 0) {
                // Clique simples sem arrastar → selecionar slot
                this._clickSlot(from);
            }
            
            this._refreshSlots();
        });

        // Limpar listener ao fechar
        this._onChanged = () => this._refreshSlots();
        this._inv.on('changed', this._onChanged);
        this.events.once('shutdown', () => {
            this._inv.off('changed', this._onChanged);
            this.input.off('pointermove');
            this.input.off('pointerup');
        });
    }

    _close() { this.scene.stop(); }

    //─────────────────────────────────────────────────────────────────
    _drawPanelBg() {
        const g = this.add.graphics().setDepth(1);
        const r = 8;
        g.fillStyle(0x000000, 0.45);
        g.fillRoundedRect(PL + 6, PT + 6, PW, PH, r);
        g.fillStyle(0x1a1208, 1);
        g.fillRoundedRect(PL, PT, PW, PH, r);
        g.lineStyle(2, 0xc8901a, 0.8);
        g.strokeRoundedRect(PL + 1, PT + 1, PW - 2, PH - 2, r);
        g.fillStyle(0x3d1a00, 0.9);
        g.fillRoundedRect(PL, PT, PW, HDR, { tl: r, tr: r, bl: 0, br: 0 });
        g.lineStyle(1, 0xc8901a, 0.5);
        g.lineBetween(PL, PT + HDR, PR, PT + HDR);
    }

    //─────────────────────────────────────────────────────────────────
    _buildFilters() {
        const keys  = ['filter_all', 'filter_tool', 'filter_resource', 'filter_food', 'filter_quest'];
        const BW = 82, BH = 18, GAP = 5;
        const total = FILTERS.length * BW + (FILTERS.length - 1) * GAP;
        let bx = CX - total / 2;
        const by = PT + HDR + FLT / 2 + 3;

        this._fGfx = {};
        this._fTxt = {};
        this._fMeta = {};

        FILTERS.forEach((f, fi) => {
            const gfx = this.add.graphics().setDepth(2);
            const txt = this.add.text(bx + BW / 2, by, I18n.t(`inventory.${keys[fi]}`), {
                fontSize: '9px', color: '#887766',
            }).setOrigin(0.5).setDepth(3);

            const zone = this.add.zone(bx + BW / 2, by, BW, BH)
                .setInteractive({ useHandCursor: true }).setDepth(4);
            zone.on('pointerdown', () => {
                this._filterCat   = f;
                this._selectedIdx = -1;
                this._refreshFilters();
                this._refreshSlots();
                this._showDetail(null, null);
            });

            this._fGfx[f]  = gfx;
            this._fTxt[f]  = txt;
            this._fMeta[f] = { x: bx, y: by, w: BW, h: BH };
            bx += BW + GAP;
        });
        this._refreshFilters();
    }

    _refreshFilters() {
        for (const f of FILTERS) {
            const gfx    = this._fGfx[f];
            const { x, y, w, h } = this._fMeta[f];
            const active = f === this._filterCat;
            const accent = CAT_ACCENT[f] ?? 0x998866;
            gfx.clear();
            if (active) {
                gfx.fillStyle(accent, 0.22);
                gfx.fillRoundedRect(x, y - h / 2, w, h, 4);
                gfx.lineStyle(1, accent, 0.85);
                gfx.strokeRoundedRect(x, y - h / 2, w, h, 4);
            } else {
                gfx.fillStyle(0x2a1a08, 0.7);
                gfx.fillRoundedRect(x, y - h / 2, w, h, 4);
                gfx.lineStyle(1, 0x443322, 0.5);
                gfx.strokeRoundedRect(x, y - h / 2, w, h, 4);
            }
            this._fTxt[f].setStyle({ color: active ? '#f5e0b0' : '#887766' });
        }
    }

    //─────────────────────────────────────────────────────────────────
    _buildSlots() {
        this._slotObjs = [];

        for (let i = 0; i < this._inv.slots.length; i++) {
            const col = i % SCOLS;
            const row = Math.floor(i / SCOLS);
            const sx  = GL + SLOT / 2 + col * (SLOT + SGAP);
            const sy  = GT + SLOT / 2 + row * (SLOT + SGAP);

            const gfx  = this.add.graphics().setDepth(2);
            const icon = this.add.image(sx, sy, 'wood')
                .setScale(2.4).setVisible(false).setDepth(3);
            const qty  = this.add.text(sx + SLOT / 2 - 3, sy + SLOT / 2 - 3, '', {
                fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(1, 1).setDepth(4);

            if (i < 8) {
                this.add.text(sx - SLOT / 2 + 3, sy - SLOT / 2 + 3, String(i + 1), {
                    fontSize: '8px', color: '#554433',
                }).setOrigin(0, 0).setDepth(4);
            }

            const zone = this.add.zone(sx, sy, SLOT, SLOT)
                .setInteractive({ useHandCursor: true }).setDepth(5);
            zone.on('pointerover', () => {
                const st = this._slotState(i);
                if (st !== 'empty' && st !== 'filtered') {
                    this._drawSlotBg(i, i === this._selectedIdx ? 'selected' : 'hover');
                }
            });
            zone.on('pointerout', () => {
                this._drawSlotBg(i, i === this._selectedIdx ? 'selected' : this._slotState(i));
            });
            zone.on('pointerdown', (ptr) => {
                const slot = this._inv.slots[i];
                if (!slot) { this._clickSlot(i); return; }
                
                // Começar drag
                this._dragFrom = i;
                const def = ITEM_DB[slot.itemId];
                const texture = def?.icon ?? slot.itemId;
                this._ghostIcon = this.add.image(ptr.x, ptr.y, texture)
                    .setScale(2.4).setAlpha(0.75).setDepth(20);
                
                // Highlight o slot de origem
                this._drawSlotBg(i, 'selected');
            });

            this._slotObjs.push({ gfx, icon, qty, sx, sy });
        }

        // Adicionar distinção visual (linha divisória + textos)
        const lineY = GT + 2 * (SLOT + SGAP) - SGAP / 2; // GT + 100
        const divGfx = this.add.graphics().setDepth(2);
        divGfx.lineStyle(1.5, 0xc8901a, 0.8);
        divGfx.lineBetween(GL, lineY, GR, lineY);

        this.add.text(GL, GT - 10, 'HOTBAR', {
            color: '#886644', fontSize: '8px'
        }).setDepth(4);

        this.add.text(GL, GT + 2 * (SLOT + SGAP) - 10, 'MOCHILA', {
            color: '#886644', fontSize: '8px'
        }).setDepth(4);

        this._refreshSlots();
    }

    _slotState(i) {
        const slot = this._inv.slots[i];
        if (!slot) return 'empty';
        const def = ITEM_DB[slot.itemId];
        if (this._filterCat !== 'all' && def?.category !== this._filterCat) return 'filtered';
        return 'normal';
    }

    _drawSlotBg(i, state) {
        const { gfx, sx, sy } = this._slotObjs[i];
        const slot = this._inv.slots[i];
        const def  = slot ? ITEM_DB[slot.itemId] : null;
        const r    = 6;
        gfx.clear();

        const cfgs = {
            empty:    [0x100c06, 1,   0x332211, 0.6],
            normal:   [0x1e1508, 1,   0x776644, 1  ],
            hover:    [0x2e2010, 1,   0xcc9944, 1  ],
            selected: [0x3a2508, 1,   0xffdd88, 1  ],
            filtered: [0x0e0c06, 0.5, 0x221a11, 0.3],
        };
        const c = cfgs[state] ?? cfgs.empty;

        gfx.fillStyle(c[0], c[1]);
        gfx.fillRoundedRect(sx - SLOT / 2, sy - SLOT / 2, SLOT, SLOT, r);
        gfx.lineStyle(2, c[2], c[3]);
        gfx.strokeRoundedRect(sx - SLOT / 2, sy - SLOT / 2, SLOT, SLOT, r);

        if (def && state !== 'filtered') {
            gfx.fillStyle(CAT_ACCENT[def.category] ?? 0x998866, 0.85);
            gfx.fillCircle(sx + SLOT / 2 - 7, sy - SLOT / 2 + 7, 4);
        }
    }

    _refreshSlots() {
        for (let i = 0; i < this._inv.slots.length; i++) {
            const { icon, qty } = this._slotObjs[i];
            const slot  = this._inv.slots[i];
            const def   = slot ? ITEM_DB[slot.itemId] : null;
            const state = i === this._selectedIdx ? 'selected' : this._slotState(i);

            this._drawSlotBg(i, state);

            if (slot && state !== 'filtered') {
                icon.setTexture(def?.icon ?? slot.itemId).setVisible(true);
                qty.setText(slot.qty > 1 ? String(slot.qty) : '');
            } else {
                icon.setVisible(false);
                qty.setText('');
            }
        }
    }

    _clickSlot(i) {
        const state = this._slotState(i);
        if (state === 'empty' || state === 'filtered') return;

        const prev = this._selectedIdx;
        this._selectedIdx = i;

        if (prev >= 0 && prev !== i) {
            this._drawSlotBg(prev, this._slotState(prev));
        }
        this._drawSlotBg(i, 'selected');

        const slot = this._inv.slots[i];
        this._showDetail(slot, slot ? ITEM_DB[slot.itemId] : null);

        this._inv.selectSlot(i);
    }

    //─────────────────────────────────────────────────────────────────
    _buildDetail() {
        const dgfx = this.add.graphics().setDepth(2);
        dgfx.fillStyle(0x100c06, 0.9);
        dgfx.fillRoundedRect(DL, DT, DW, DH, 5);
        dgfx.lineStyle(1, 0x665533, 0.7);
        dgfx.strokeRoundedRect(DL + 1, DT + 1, DW - 2, DH - 2, 5);

        const mx = DL + DW / 2;
        const tx = DL + 10;
        const tw = DW - 20;

        this._dIcon   = this.add.image(mx, DT + 34, 'wood')
            .setScale(3.5).setVisible(false).setDepth(3);
        this._dName   = this.add.text(mx, DT + 62, '', {
            fontFamily: 'Georgia, serif', fontSize: '12px',
            color: '#f5e0b0', fontStyle: 'bold',
            wordWrap: { width: tw }, align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        this._dCat    = this.add.text(mx, DT + 82, '', {
            fontSize: '9px', color: '#888877', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        this._dDivGfx = this.add.graphics().setDepth(3);
        this._dDesc   = this.add.text(tx, DT + 102, '', {
            fontFamily: 'Georgia, serif', fontSize: '10px',
            color: '#ccbb99', lineSpacing: 3,
            wordWrap: { width: tw },
        }).setOrigin(0, 0).setDepth(3);
        this._dQty    = this.add.text(mx, DT + DH - 64, '', {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        this._dRarity = this.add.text(mx, DT + DH - 44, '', {
            fontSize: '9px', color: '#888888', fontStyle: 'italic', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);

        // Botão largar
        this._dropGfx  = this.add.graphics().setDepth(3).setVisible(false);
        this._dropTxt  = this.add.text(mx, DT + DH - 18, I18n.t('inventory.drop'), {
            fontSize: '10px', color: '#ff8888',
        }).setOrigin(0.5).setDepth(4).setVisible(false);
        this._dropZone = this.add.zone(mx, DT + DH - 18, DW - 24, 20)
            .setInteractive({ useHandCursor: true }).setDepth(5).setVisible(false);
        this._dropZone.on('pointerover', () => this._dropHover(true));
        this._dropZone.on('pointerout',  () => this._dropHover(false));
        this._dropZone.on('pointerdown', () => {
            if (this._selectedIdx >= 0) {
                this._inv.dropItem(this._selectedIdx);
                this._selectedIdx = -1;
                this._refreshSlots();
                this._showDetail(null, null);
            }
        });

        // Dica quando nada selecionado
        this._dHint = this.add.text(mx, DT + DH / 2, I18n.t('inventory.empty'), {
            fontSize: '10px', color: '#443322', fontStyle: 'italic',
            fontFamily: 'Georgia, serif', align: 'center',
        }).setOrigin(0.5).setDepth(3);
    }

    _dropHover(on) {
        this._dropGfx.clear();
        this._dropGfx.fillStyle(on ? 0x5a1010 : 0x2a0808, 0.9);
        this._dropGfx.fillRoundedRect(DL + 12, DT + DH - 28, DW - 24, 20, 4);
        this._dropGfx.lineStyle(1, on ? 0xff4444 : 0x882222, 0.8);
        this._dropGfx.strokeRoundedRect(DL + 12, DT + DH - 28, DW - 24, 20, 4);
        this._dropTxt.setStyle({ color: on ? '#ffaaaa' : '#ff8888' });
    }

    _showDetail(slot, def) {
        const has = !!(slot && def);
        this._dHint.setVisible(!has);
        this._dIcon.setVisible(has);
        this._dName.setText('');
        this._dCat.setText('');
        this._dDivGfx.clear();
        this._dDesc.setText('');
        this._dQty.setText('');
        this._dRarity.setText('');
        this._dropGfx.setVisible(false);
        this._dropTxt.setVisible(false);
        this._dropZone.setVisible(false);

        if (!has) return;

        this._dIcon.setTexture(def.icon);
        this._dName.setText(def.name);

        const catL = {
            tool: { pt: 'Ferramenta', en: 'Tool' },
            resource: { pt: 'Recurso', en: 'Resource' },
            food: { pt: 'Comida', en: 'Food' },
            quest: { pt: 'Quest', en: 'Quest' },
        };
        const rarL = {
            common: { pt: 'Comum', en: 'Common' },
            rare:   { pt: 'Raro',  en: 'Rare'   },
            quest:  { pt: 'Quest', en: 'Quest'  },
        };
        const lang = I18n.lang;

        this._dCat.setText(catL[def.category]?.[lang] ?? '')
            .setStyle({ color: CAT_COLOR_STR[def.category] ?? '#aaaaaa' });

        this._dDivGfx.lineStyle(1, 0x443322, 0.6);
        this._dDivGfx.lineBetween(DL + 12, DT + 96, DL + DW - 12, DT + 96);

        this._dDesc.setText(I18n.t(`item_desc.${def.icon}`));
        this._dQty.setText(`×${slot.qty}`);
        this._dRarity.setText(rarL[def.rarity]?.[lang] ?? '')
            .setStyle({ color: RARITY_COLOR_STR[def.rarity] ?? '#aaaaaa' });

        this._dropGfx.setVisible(true);
        this._dropTxt.setVisible(true);
        this._dropZone.setVisible(true);
        this._dropHover(false);
    }
}
