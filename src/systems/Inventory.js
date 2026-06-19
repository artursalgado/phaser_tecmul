export const ITEM_DB = {
    wood:    { name: 'Madeira',  icon: 'wood',    maxStack: 99, category: 'resource', rarity: 'common' },
    rock:    { name: 'Pedra',    icon: 'rock',    maxStack: 99, category: 'resource', rarity: 'common' },
    fish:    { name: 'Peixe',    icon: 'fish',    maxStack: 99, category: 'food',     rarity: 'common' },
    egg:     { name: 'Ovo',      icon: 'egg',     maxStack: 99, category: 'food',     rarity: 'common' },
    milk:    { name: 'Leite',    icon: 'milk',    maxStack: 99, category: 'food',     rarity: 'common' },
    water:   { name: 'Água',     icon: 'water',   maxStack: 99, category: 'food',     rarity: 'common' },
    carrot:  { name: 'Cenoura',  icon: 'carrot',  maxStack: 99, category: 'food',     rarity: 'common' },
    potato:  { name: 'Batata',   icon: 'potato',  maxStack: 99, category: 'food',     rarity: 'common' },
    wheat:   { name: 'Trigo',    icon: 'wheat',   maxStack: 99, category: 'food',     rarity: 'common' },
    axe:     { name: 'Machado',  icon: 'axe',     maxStack: 1,  category: 'tool',     rarity: 'common' },
    pickaxe: { name: 'Picareta', icon: 'pickaxe', maxStack: 1,  category: 'tool',     rarity: 'common' },
    hammer:  { name: 'Martelo',  icon: 'hammer',  maxStack: 1,  category: 'tool',     rarity: 'common' },
    shovel:  { name: 'Pá',       icon: 'shovel',  maxStack: 1,  category: 'tool',     rarity: 'common' },
    sword:   { name: 'Espada',   icon: 'sword',   maxStack: 1,  category: 'tool',     rarity: 'rare'   },
    rope:    { name: 'Corda',    icon: 'rope',    maxStack: 99, category: 'resource', rarity: 'rare'   },
    sail:    { name: 'Vela',     icon: 'sail',    maxStack: 99, category: 'resource', rarity: 'rare'   },
    book:    { name: 'Diário',   icon: 'book',    maxStack: 1,  category: 'quest',    rarity: 'quest'  },
};

export default class Inventory extends Phaser.Events.EventEmitter {
    constructor(size = 8) {
        super();
        this.size  = size;
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
            const toAdd     = Math.min(maxStack, remaining);
            this.slots[idx] = { itemId, qty: toAdd };
            remaining      -= toAdd;
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

    dropItem(idx) {
        if (idx < 0 || idx >= this.slots.length || !this.slots[idx]) return;
        this.slots[idx] = null;
        this.emit('changed', this.slots);
    }

    moveSlot(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        if (fromIdx < 0 || toIdx < 0) return;
        if (fromIdx >= this.slots.length || toIdx >= this.slots.length) return;
        const tmp          = this.slots[fromIdx];
        this.slots[fromIdx] = this.slots[toIdx];
        this.slots[toIdx]  = tmp;
        this.emit('changed', this.slots);
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

    toJSON() {
        return {
            size: this.size,
            slots: this.slots.map(s => s ? { itemId: s.itemId, qty: s.qty } : null),
            selectedSlot: this.selectedSlot
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (typeof data.size === 'number') this.size = data.size;
        if (Array.isArray(data.slots)) {
            this.slots = data.slots.map(s => s ? { itemId: s.itemId, qty: s.qty } : null);
        }
        if (typeof data.selectedSlot === 'number') this.selectedSlot = data.selectedSlot;
        this.emit('changed', this.slots);
        this.emit('selectionChanged', this.selectedSlot);
    }
}
