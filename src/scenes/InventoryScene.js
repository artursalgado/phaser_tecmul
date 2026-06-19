import { ITEM_DB } from '../systems/Inventory.js';
import I18n from '../systems/I18n.js';

const ACENTO_CATEGORIA = {
    tool:     0x4499cc,
    resource: 0x55bb55,
    food:     0xffaa44,
    quest:    0xaa66ff,
};
const COR_STR_CATEGORIA = {
    tool: '#4499cc', resource: '#55bb55', food: '#ffaa44', quest: '#aa66ff',
};
const COR_STR_RARIDADE = {
    common: '#aaaaaa', rare: '#ffdd88', quest: '#cc88ff',
};
const FILTROS = ['all', 'tool', 'resource', 'food', 'quest'];

// Coordenadas do layout do inventario
const W = 960, H = 640;
const PW = 600, PH = 380;
const CX = W / 2, CY = H / 2;
const PL = CX - PW / 2;
const PR = CX + PW / 2;
const PT = CY - PH / 2;
const PB = CY + PH / 2;
const HDR = 40;
const FLT = 26;
const PAD = 14;

const TAMANHO_SLOT = 44;
const ESPACAMENTO = 8;
const COLUNAS = 4;

const GL = PL + PAD;
const GT = PT + HDR + FLT + 8;
const GR = GL + COLUNAS * (TAMANHO_SLOT + ESPACAMENTO) - ESPACAMENTO;

const DL = GR + 14;
const DW = PR - PAD - DL;
const DT = PT + HDR + 8;
const DH = PB - 28 - DT;

export default class InventoryScene extends Phaser.Scene {
    constructor() { 
        super('InventoryScene'); 
    }

    create() {
        this.inventario = this.scene.get('GameScene').inventory;
        this.selectedIdx = -1;
        this.filterCat = 'all';
        this.dragFrom = -1;
        this.ghostIcon = null;

        // Fundo semitransparente
        this.add.rectangle(CX, CY, W, H, 0x000000, 0.62)
            .setInteractive().setDepth(0);

        this.desenharFundoPainel();

        // Titulo
        this.add.text(CX, PT + 22, I18n.t('inventory.title'), {
            fontFamily: 'Georgia, serif', fontSize: '16px',
            color: '#f5e0b0', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);

        this.criarFiltros();
        this.criarSlots();
        this.criarPainelDetalhes();

        // Dica de fechar
        this.add.text(CX, PB - 14, I18n.t('inventory.hint'), {
            fontSize: '9px', color: '#665544', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(2);

        // Atalhos de teclado
        this.input.keyboard.on('keydown-ESC', () => this.fechar());
        this.input.keyboard.on('keydown-I',   () => this.fechar());

        // Logica de arrastar (Drag & Drop)
        this.input.on('pointermove', (ptr) => {
            if (this.ghostIcon) {
                this.ghostIcon.setPosition(ptr.x, ptr.y);
            }
        });

        this.input.on('pointerup', (ptr) => {
            if (this.dragFrom < 0) return;
            
            const de = this.dragFrom;
            let paraIdx = -1;
            
            // Procura o slot de destino
            for (let j = 0; j < this.slotObjs.length; j++) {
                const { sx, sy } = this.slotObjs[j];
                if (Math.abs(ptr.x - sx) < TAMANHO_SLOT / 2 && Math.abs(ptr.y - sy) < TAMANHO_SLOT / 2) {
                    paraIdx = j;
                    break;
                }
            }
            
            if (this.ghostIcon) {
                this.ghostIcon.destroy();
                this.ghostIcon = null;
            }
            this.dragFrom = -1;
            
            if (paraIdx >= 0 && paraIdx !== de) {
                this.inventario.moveSlot(de, paraIdx);
            } else if (paraIdx === de || paraIdx < 0) {
                this.clicarSlot(de);
            }
            
            this.atualizarSlots();
        });

        this.onChanged = () => this.atualizarSlots();
        this.inventario.on('changed', this.onChanged);
        
        this.events.once('shutdown', () => {
            this.inventario.off('changed', this.onChanged);
            this.input.off('pointermove');
            this.input.off('pointerup');
        });
    }

    fechar() { 
        this.scene.stop(); 
    }

    desenharFundoPainel() {
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

    criarFiltros() {
        const chaves = ['filter_all', 'filter_tool', 'filter_resource', 'filter_food', 'filter_quest'];
        const BW = 82, BH = 18, GAP = 5;
        const total = FILTROS.length * BW + (FILTROS.length - 1) * GAP;
        let bx = CX - total / 2;
        const by = PT + HDR + FLT / 2 + 3;

        this.fGfx = {};
        this.fTxt = {};
        this.fMeta = {};

        FILTROS.forEach((f, fi) => {
            const grafico = this.add.graphics().setDepth(2);
            const txt = this.add.text(bx + BW / 2, by, I18n.t(`inventory.${chaves[fi]}`), {
                fontSize: '9px', color: '#887766',
            }).setOrigin(0.5).setDepth(3);

            const zone = this.add.zone(bx + BW / 2, by, BW, BH)
                .setInteractive({ useHandCursor: true }).setDepth(4);
            zone.on('pointerdown', () => {
                this.filterCat = f;
                this.selectedIdx = -1;
                this.atualizarFiltros();
                this.atualizarSlots();
                this.mostrarDetalhes(null, null);
            });

            this.fGfx[f]  = grafico;
            this.fTxt[f]  = txt;
            this.fMeta[f] = { x: bx, y: by, w: BW, h: BH };
            bx += BW + GAP;
        });
        this.atualizarFiltros();
    }

    atualizarFiltros() {
        for (const f of FILTROS) {
            const grafico = this.fGfx[f];
            const { x, y, w, h } = this.fMeta[f];
            const ativo = f === this.filterCat;
            const tom = ACENTO_CATEGORIA[f] ?? 0x998866;
            
            grafico.clear();
            if (ativo) {
                grafico.fillStyle(tom, 0.22);
                grafico.fillRoundedRect(x, y - h / 2, w, h, 4);
                grafico.lineStyle(1, tom, 0.85);
                grafico.strokeRoundedRect(x, y - h / 2, w, h, 4);
            } else {
                grafico.fillStyle(0x2a1a08, 0.7);
                grafico.fillRoundedRect(x, y - h / 2, w, h, 4);
                grafico.lineStyle(1, 0x443322, 0.5);
                grafico.strokeRoundedRect(x, y - h / 2, w, h, 4);
            }
            this.fTxt[f].setStyle({ color: ativo ? '#f5e0b0' : '#887766' });
        }
    }

    criarSlots() {
        this.slotObjs = [];

        for (let i = 0; i < this.inventario.slots.length; i++) {
            const col = i % COLUNAS;
            const row = Math.floor(i / COLUNAS);
            const sx  = GL + TAMANHO_SLOT / 2 + col * (TAMANHO_SLOT + ESPACAMENTO);
            const sy  = GT + TAMANHO_SLOT / 2 + row * (TAMANHO_SLOT + ESPACAMENTO);

            const grafico = this.add.graphics().setDepth(2);
            const icon = this.add.image(sx, sy, 'wood')
                .setScale(2.4).setVisible(false).setDepth(3);
            const qty  = this.add.text(sx + TAMANHO_SLOT / 2 - 3, sy + TAMANHO_SLOT / 2 - 3, '', {
                fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(1, 1).setDepth(4);

            if (i < 8) {
                this.add.text(sx - TAMANHO_SLOT / 2 + 3, sy - TAMANHO_SLOT / 2 + 3, String(i + 1), {
                    fontSize: '8px', color: '#554433',
                }).setOrigin(0, 0).setDepth(4);
            }

            const zone = this.add.zone(sx, sy, TAMANHO_SLOT, TAMANHO_SLOT)
                .setInteractive({ useHandCursor: true }).setDepth(5);
                
            zone.on('pointerover', () => {
                const estado = this.obterEstadoSlot(i);
                if (estado !== 'empty' && estado !== 'filtered') {
                    this.desenharFundoSlot(i, i === this.selectedIdx ? 'selected' : 'hover');
                }
            });
            zone.on('pointerout', () => {
                this.desenharFundoSlot(i, i === this.selectedIdx ? 'selected' : this.obterEstadoSlot(i));
            });
            zone.on('pointerdown', (ptr) => {
                const slot = this.inventario.slots[i];
                if (!slot) { this.clicarSlot(i); return; }
                
                this.dragFrom = i;
                const def = ITEM_DB[slot.itemId];
                const texture = def?.icon ?? slot.itemId;
                this.ghostIcon = this.add.image(ptr.x, ptr.y, texture)
                    .setScale(2.4).setAlpha(0.75).setDepth(20);
                
                this.desenharFundoSlot(i, 'selected');
            });

            this.slotObjs.push({ gfx: grafico, icon, qty, sx, sy });
        }

        const linhaY = GT + 2 * (TAMANHO_SLOT + ESPACAMENTO) - ESPACAMENTO / 2;
        const divGrafico = this.add.graphics().setDepth(2);
        divGrafico.lineStyle(1.5, 0xc8901a, 0.8);
        divGrafico.lineBetween(GL, linhaY, GR, linhaY);

        this.add.text(GL, GT - 10, 'HOTBAR', { color: '#886644', fontSize: '8px' }).setDepth(4);
        this.add.text(GL, GT + 2 * (TAMANHO_SLOT + ESPACAMENTO) - 10, 'MOCHILA', { color: '#886644', fontSize: '8px' }).setDepth(4);

        this.atualizarSlots();
    }

    obterEstadoSlot(i) {
        const slot = this.inventario.slots[i];
        if (!slot) return 'empty';
        const def = ITEM_DB[slot.itemId];
        if (this.filterCat !== 'all' && def?.category !== this.filterCat) return 'filtered';
        return 'normal';
    }

    desenharFundoSlot(i, estado) {
        const { gfx, sx, sy } = this.slotObjs[i];
        const slot = this.inventario.slots[i];
        const def = slot ? ITEM_DB[slot.itemId] : null;
        const r = 6;
        gfx.clear();

        const configs = {
            empty:    [0x100c06, 1,   0x332211, 0.6],
            normal:   [0x1e1508, 1,   0x776644, 1  ],
            hover:    [0x2e2010, 1,   0xcc9944, 1  ],
            selected: [0x3a2508, 1,   0xffdd88, 1  ],
            filtered: [0x0e0c06, 0.5, 0x221a11, 0.3],
        };
        const c = configs[estado] ?? configs.empty;

        gfx.fillStyle(c[0], c[1]);
        gfx.fillRoundedRect(sx - TAMANHO_SLOT / 2, sy - TAMANHO_SLOT / 2, TAMANHO_SLOT, TAMANHO_SLOT, r);
        gfx.lineStyle(2, c[2], c[3]);
        gfx.strokeRoundedRect(sx - TAMANHO_SLOT / 2, sy - TAMANHO_SLOT / 2, TAMANHO_SLOT, TAMANHO_SLOT, r);

        if (def && estado !== 'filtered') {
            gfx.fillStyle(ACENTO_CATEGORIA[def.category] ?? 0x998866, 0.85);
            gfx.fillCircle(sx + TAMANHO_SLOT / 2 - 7, sy - TAMANHO_SLOT / 2 + 7, 4);
        }
    }

    atualizarSlots() {
        for (let i = 0; i < this.inventario.slots.length; i++) {
            const { icon, qty } = this.slotObjs[i];
            const slot = this.inventario.slots[i];
            const def = slot ? ITEM_DB[slot.itemId] : null;
            const estado = i === this.selectedIdx ? 'selected' : this.obterEstadoSlot(i);

            this.desenharFundoSlot(i, estado);

            if (slot && estado !== 'filtered') {
                icon.setTexture(def?.icon ?? slot.itemId).setVisible(true);
                qty.setText(slot.qty > 1 ? String(slot.qty) : '');
            } else {
                icon.setVisible(false);
                qty.setText('');
            }
        }
    }

    clicarSlot(i) {
        const estado = this.obterEstadoSlot(i);
        if (estado === 'empty' || estado === 'filtered') return;

        const anterior = this.selectedIdx;
        this.selectedIdx = i;

        if (anterior >= 0 && anterior !== i) {
            this.desenharFundoSlot(anterior, this.obterEstadoSlot(anterior));
        }
        this.desenharFundoSlot(i, 'selected');

        const slot = this.inventario.slots[i];
        this.mostrarDetalhes(slot, slot ? ITEM_DB[slot.itemId] : null);

        this.inventario.selectSlot(i);
    }

    criarPainelDetalhes() {
        const dgrafico = this.add.graphics().setDepth(2);
        dgrafico.fillStyle(0x100c06, 0.9);
        dgrafico.fillRoundedRect(DL, DT, DW, DH, 5);
        dgrafico.lineStyle(1, 0x665533, 0.7);
        dgrafico.strokeRoundedRect(DL + 1, DT + 1, DW - 2, DH - 2, 5);

        const mx = DL + DW / 2;
        const tx = DL + 10;
        const tw = DW - 20;

        this.dIcon   = this.add.image(mx, DT + 34, 'wood').setScale(3.5).setVisible(false).setDepth(3);
        
        this.dName   = this.add.text(mx, DT + 62, '', {
            fontFamily: 'Georgia, serif', fontSize: '12px',
            color: '#f5e0b0', fontStyle: 'bold',
            wordWrap: { width: tw }, align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        
        this.dCat    = this.add.text(mx, DT + 82, '', {
            fontSize: '9px', color: '#888877', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        
        this.dDivGrafico = this.add.graphics().setDepth(3);
        
        this.dDesc   = this.add.text(tx, DT + 102, '', {
            fontFamily: 'Georgia, serif', fontSize: '10px',
            color: '#ccbb99', lineSpacing: 3,
            wordWrap: { width: tw },
        }).setOrigin(0, 0).setDepth(3);
        
        this.dQty    = this.add.text(mx, DT + DH - 64, '', {
            fontSize: '14px', color: '#ffffff', fontStyle: 'bold', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);
        
        this.dRarity = this.add.text(mx, DT + DH - 44, '', {
            fontSize: '9px', color: '#888888', fontStyle: 'italic', align: 'center',
        }).setOrigin(0.5, 0).setDepth(3);

        // Botao largar item
        this.dropGrafico  = this.add.graphics().setDepth(3).setVisible(false);
        this.dropTxt  = this.add.text(mx, DT + DH - 18, I18n.t('inventory.drop'), {
            fontSize: '10px', color: '#ff8888',
        }).setOrigin(0.5).setDepth(4).setVisible(false);
        
        this.dropZone = this.add.zone(mx, DT + DH - 18, DW - 24, 20)
            .setInteractive({ useHandCursor: true }).setDepth(5).setVisible(false);
            
        this.dropZone.on('pointerover', () => this.hoverLargar(true));
        this.dropZone.on('pointerout',  () => this.hoverLargar(false));
        this.dropZone.on('pointerdown', () => {
            if (this.selectedIdx >= 0) {
                this.inventario.dropItem(this.selectedIdx);
                this.selectedIdx = -1;
                this.atualizarSlots();
                this.mostrarDetalhes(null, null);
            }
        });

        this.dHint = this.add.text(mx, DT + DH / 2, I18n.t('inventory.empty'), {
            fontSize: '10px', color: '#443322', fontStyle: 'italic',
            fontFamily: 'Georgia, serif', align: 'center',
        }).setOrigin(0.5).setDepth(3);
    }

    hoverLargar(on) {
        this.dropGrafico.clear();
        this.dropGrafico.fillStyle(on ? 0x5a1010 : 0x2a0808, 0.9);
        this.dropGrafico.fillRoundedRect(DL + 12, DT + DH - 28, DW - 24, 20, 4);
        this.dropGrafico.lineStyle(1, on ? 0xff4444 : 0x882222, 0.8);
        this.dropGrafico.strokeRoundedRect(DL + 12, DT + DH - 28, DW - 24, 20, 4);
        this.dropTxt.setStyle({ color: on ? '#ffaaaa' : '#ff8888' });
    }

    mostrarDetalhes(slot, def) {
        const temItem = !!(slot && def);
        this.dHint.setVisible(!temItem);
        this.dIcon.setVisible(temItem);
        this.dName.setText('');
        this.dCat.setText('');
        this.dDivGrafico.clear();
        this.dDesc.setText('');
        this.dQty.setText('');
        this.dRarity.setText('');
        this.dropGrafico.setVisible(false);
        this.dropTxt.setVisible(false);
        this.dropZone.setVisible(false);

        if (!temItem) return;

        this.dIcon.setTexture(def.icon);
        this.dName.setText(def.name);

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
        const idioma = I18n.lang;

        this.dCat.setText(catL[def.category]?.[idioma] ?? '')
            .setStyle({ color: COR_STR_CATEGORIA[def.category] ?? '#aaaaaa' });

        this.dDivGrafico.lineStyle(1, 0x443322, 0.6);
        this.dDivGrafico.lineBetween(DL + 12, DT + 96, DL + DW - 12, DT + 96);

        this.dDesc.setText(I18n.t(`item_desc.${def.icon}`));
        this.dQty.setText(`×${slot.qty}`);
        this.dRarity.setText(rarL[def.rarity]?.[idioma] ?? '')
            .setStyle({ color: COR_STR_RARIDADE[def.rarity] ?? '#aaaaaa' });

        this.dropGrafico.setVisible(true);
        this.dropTxt.setVisible(true);
        this.dropZone.setVisible(true);
        this.hoverLargar(false);
    }
}
