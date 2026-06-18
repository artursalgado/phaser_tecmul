// Base de dados de itens do jogo
export const ITEM_DB = {
    wood:    { name: 'Madeira',  icon: 'wood',    maxStack: 99 },
    rock:    { name: 'Pedra',    icon: 'rock',    maxStack: 99 },
    fish:    { name: 'Peixe',    icon: 'fish',    maxStack: 99 },
    egg:     { name: 'Ovo',      icon: 'egg',     maxStack: 99 },
    milk:    { name: 'Leite',    icon: 'milk',    maxStack: 99 },
    water:   { name: 'Água',     icon: 'water',   maxStack: 99 },
    // Vegetais — carregados com a key sem "_00" no PreloadScene
    carrot:  { name: 'Cenoura',  icon: 'carrot',  maxStack: 99 },
    potato:  { name: 'Batata',   icon: 'potato',  maxStack: 99 },
    wheat:   { name: 'Trigo',    icon: 'wheat',   maxStack: 99 },
    // Ferramentas
    axe:     { name: 'Machado',  icon: 'axe',     maxStack: 1  },
    pickaxe: { name: 'Picareta', icon: 'pickaxe', maxStack: 1  },
    hammer:  { name: 'Martelo',  icon: 'hammer',  maxStack: 1  },
    shovel:  { name: 'Pá',       icon: 'shovel',  maxStack: 1  },
    sword:   { name: 'Espada',   icon: 'sword',   maxStack: 1  },
    // Recursos da jangada (commit 2 da EPIC de fuga)
    rope:    { name: 'Corda',    icon: 'rope',    maxStack: 99 },
    sail:    { name: 'Vela',     icon: 'sail',    maxStack: 99 },
    // Diário do náufrago
    book:    { name: 'Diário',   icon: 'book',    maxStack: 1  },
};

export default class Inventory extends Phaser.Events.EventEmitter {
    constructor(size = 8) {
        super();
        this.size = size;
        this.slots = new Array(size).fill(null);
        this.selectedSlot = 0;
    }

    addItem(itemId, qty = 1) {
        const def      = ITEM_DB[itemId];
        const maxStack = def ? def.maxStack : 99;
        let remaining  = qty;

        for (const slot of this.slots) {
            if (remaining <= 0) break;
            if (slot && slot.itemId === itemId && slot.qty < maxStack) {
                const toAdd = Math.min(maxStack - slot.qty, remaining);
                slot.qty   += toAdd;
                remaining  -= toAdd;
            }
        }

        while (remaining > 0) {
            const idx = this.slots.findIndex(s => s === null);
            if (idx === -1) { this.emit('full', itemId, remaining); break; }
            const toAdd       = Math.min(maxStack, remaining);
            this.slots[idx]   = { itemId, qty: toAdd };
            remaining        -= toAdd;
        }

        const added = qty - remaining;
        if (added > 0) this.emit('itemAdded', itemId, added);
        this.emit('changed', this.slots);
        return remaining === 0;
    }

    removeItem(itemId, qty = 1) {
        let remaining = qty;
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (remaining <= 0) break;
            if (slot && slot.itemId === itemId) {
                const toRemove = Math.min(slot.qty, remaining);
                slot.qty      -= toRemove;
                remaining     -= toRemove;
                if (slot.qty <= 0) this.slots[i] = null;
            }
        }
        this.emit('changed', this.slots);
        return remaining === 0;
    }

    getQuantity(itemId) {
        return this.slots.reduce(
            (t, s) => (s && s.itemId === itemId ? t + s.qty : t), 0
        );
    }

    selectSlot(index) {
        if (index < 0 || index >= this.size) return;
        this.selectedSlot = index;
        this.emit('selectionChanged', this.selectedSlot);
    }

    getSelectedItem() {
        return this.slots[this.selectedSlot];
    }
}
