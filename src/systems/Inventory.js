// Base de dados de itens do jogo
// id do item -> { name: nome a mostrar, icon: chave da textura pré-carregada, maxStack: quantidade máxima por slot }
export const ITEM_DB = {
    wood:    { name: 'Madeira',  icon: 'wood',      maxStack: 99 },
    rock:    { name: 'Pedra',    icon: 'rock',      maxStack: 99 },
    fish:    { name: 'Peixe',    icon: 'fish',      maxStack: 99 },
    egg:     { name: 'Ovo',      icon: 'egg',       maxStack: 99 },
    milk:    { name: 'Leite',    icon: 'milk',      maxStack: 99 },
    water:   { name: 'Água',     icon: 'water',     maxStack: 99 },
    carrot:  { name: 'Cenoura',  icon: 'carrot_00', maxStack: 99 },
    potato:  { name: 'Batata',   icon: 'potato_00', maxStack: 99 },
    wheat:   { name: 'Trigo',    icon: 'wheat_00',  maxStack: 99 },
    axe:     { name: 'Machado',  icon: 'axe',       maxStack: 1  },
    pickaxe: { name: 'Picareta', icon: 'pickaxe',   maxStack: 1  },
    hammer:  { name: 'Martelo',  icon: 'hammer',    maxStack: 1  },
    shovel:  { name: 'Pá',       icon: 'shovel',    maxStack: 1  },
    sword:   { name: 'Espada',   icon: 'sword',     maxStack: 1  },
};

// Gere os slots de itens do jogador.
// Emite eventos ('changed', 'itemAdded', 'full', 'selectionChanged') para a HUD se atualizar.
export default class Inventory extends Phaser.Events.EventEmitter {
    constructor(size = 8) {
        super();
        this.size = size;
        this.slots = new Array(size).fill(null); // cada slot: { itemId, qty } ou null
        this.selectedSlot = 0;
    }

    // Adiciona uma quantidade de um item, empilhando nos slots existentes
    // e usando slots vazios quando necessário. Devolve true se coube tudo.
    addItem(itemId, qty = 1) {
        const def = ITEM_DB[itemId];
        const maxStack = def ? def.maxStack : 99;
        let remaining = qty;

        // Tenta empilhar primeiro em slots já existentes do mesmo item
        for (const slot of this.slots) {
            if (remaining <= 0) break;
            if (slot && slot.itemId === itemId && slot.qty < maxStack) {
                const space = maxStack - slot.qty;
                const toAdd = Math.min(space, remaining);
                slot.qty += toAdd;
                remaining -= toAdd;
            }
        }

        // Usa slots vazios para o que faltar
        while (remaining > 0) {
            const emptyIndex = this.slots.findIndex(s => s === null);
            if (emptyIndex === -1) {
                this.emit('full', itemId, remaining);
                break;
            }
            const toAdd = Math.min(maxStack, remaining);
            this.slots[emptyIndex] = { itemId, qty: toAdd };
            remaining -= toAdd;
        }

        const added = qty - remaining;
        if (added > 0) this.emit('itemAdded', itemId, added);
        this.emit('changed', this.slots);

        return remaining === 0;
    }

    // Remove uma quantidade de um item do inventário. Devolve true se conseguiu remover tudo.
    removeItem(itemId, qty = 1) {
        let remaining = qty;

        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (remaining <= 0) break;
            if (slot && slot.itemId === itemId) {
                const toRemove = Math.min(slot.qty, remaining);
                slot.qty -= toRemove;
                remaining -= toRemove;
                if (slot.qty <= 0) this.slots[i] = null;
            }
        }

        this.emit('changed', this.slots);
        return remaining === 0;
    }

    // Quantidade total de um item espalhada por todos os slots
    getQuantity(itemId) {
        return this.slots.reduce(
            (total, slot) => (slot && slot.itemId === itemId ? total + slot.qty : total),
            0
        );
    }

    // Slot atualmente selecionado na hotbar (para usar ferramentas/itens no futuro)
    selectSlot(index) {
        if (index < 0 || index >= this.size) return;
        this.selectedSlot = index;
        this.emit('selectionChanged', this.selectedSlot);
    }

    getSelectedItem() {
        return this.slots[this.selectedSlot];
    }
}