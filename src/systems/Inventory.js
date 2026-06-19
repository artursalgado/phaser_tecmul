// Base de dados com as informações e metadados de todos os itens do jogo.
// Define propriedades como nome legível, ícone do sprite, empilhamento máximo, categoria e raridade.
export const ITEM_DB = {
  wood: {
    name: "Madeira",
    icon: "wood",
    maxStack: 99,
    category: "resource",
    rarity: "common",
  },
  rock: {
    name: "Pedra",
    icon: "rock",
    maxStack: 99,
    category: "resource",
    rarity: "common",
  },
  fish: {
    name: "Peixe",
    icon: "fish",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  egg: {
    name: "Ovo",
    icon: "egg",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  milk: {
    name: "Leite",
    icon: "milk",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  water: {
    name: "Água",
    icon: "water",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  carrot: {
    name: "Cenoura",
    icon: "carrot",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  potato: {
    name: "Batata",
    icon: "potato",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  wheat: {
    name: "Trigo",
    icon: "wheat",
    maxStack: 99,
    category: "food",
    rarity: "common",
  },
  axe: {
    name: "Machado",
    icon: "axe",
    maxStack: 1,
    category: "tool",
    rarity: "common",
  },
  pickaxe: {
    name: "Picareta",
    icon: "pickaxe",
    maxStack: 1,
    category: "tool",
    rarity: "common",
  },
  hammer: {
    name: "Martelo",
    icon: "hammer",
    maxStack: 1,
    category: "tool",
    rarity: "common",
  },
  shovel: {
    name: "Pá",
    icon: "shovel",
    maxStack: 1,
    category: "tool",
    rarity: "common",
  },
  sword: {
    name: "Espada",
    icon: "sword",
    maxStack: 1,
    category: "tool",
    rarity: "rare",
  },
  rope: {
    name: "Corda",
    icon: "rope",
    maxStack: 99,
    category: "resource",
    rarity: "rare",
  },
  sail: {
    name: "Vela",
    icon: "sail",
    maxStack: 99,
    category: "resource",
    rarity: "rare",
  },
  book: {
    name: "Diário",
    icon: "book",
    maxStack: 1,
    category: "quest",
    rarity: "quest",
  },
};

// A classe Inventory gere a coleção de itens do jogador, manipulando um array simples de slots.
// Estende o EventEmitter do Phaser para disparar eventos sempre que ocorrem alterações.
export default class Inventory extends Phaser.Events.EventEmitter {
  constructor(size = 8) {
    super();
    this.size = size;
    this.slots = new Array(size).fill(null); // Cria slots vazios (nulos) por padrão
    this.selectedSlot = 0; // Slot selecionado da hotbar (0 a 7)
  }

  // Adiciona um item ao inventário respeitando os limites de empilhamento (stacking)
  addItem(itemId, qty = 1) {
    const def = ITEM_DB[itemId];
    const maxStack = def ? def.maxStack : 99;
    let remaining = qty;

    // 1. Tenta empilhar em slots existentes que já contêm o mesmo item
    for (const slot of this.slots) {
      if (remaining <= 0) {
        break;
      }
      if (slot && slot.itemId === itemId && slot.qty < maxStack) {
        const toAdd = Math.min(maxStack - slot.qty, remaining);
        slot.qty += toAdd;
        remaining -= toAdd;
      }
    }

    // 2. Se ainda restarem itens, coloca-os em novos slots vazios
    while (remaining > 0) {
      const idx = this.slots.findIndex((s) => s === null);
      if (idx === -1) {
        // Inventário completamente cheio: dispara evento 'full'
        this.emit("full", itemId, remaining);
        break;
      }
      const toAdd = Math.min(maxStack, remaining);
      this.slots[idx] = { itemId, qty: toAdd };
      remaining -= toAdd;
    }

    // Emite eventos de alteração se algum item foi realmente adicionado
    const added = qty - remaining;
    if (added > 0) {
      this.emit("itemAdded", itemId, added);
    }
    this.emit("changed", this.slots);

    return remaining === 0; // Retorna true se todos os itens couberam no inventário
  }

  // Remove uma quantidade específica de um item do inventário
  removeItem(itemId, qty = 1) {
    let remaining = qty;

    // Varre os slots do inventário para deduzir a quantidade necessária
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (remaining <= 0) {
        break;
      }
      if (slot && slot.itemId === itemId) {
        const toRemove = Math.min(slot.qty, remaining);
        slot.qty -= toRemove;
        remaining -= toRemove;

        // Se esvaziou o slot, limpa-o para nulo
        if (slot.qty <= 0) {
          this.slots[i] = null;
        }
      }
    }

    this.emit("changed", this.slots);
    return remaining === 0; // Devolve true se conseguiu remover a quantidade total pedida
  }

  // Descarta o conteúdo de um slot específico
  dropItem(idx) {
    if (idx < 0 || idx >= this.slots.length || !this.slots[idx]) {
      return;
    }
    this.slots[idx] = null;
    this.emit("changed", this.slots);
  }

  // Troca os itens entre dois slots (usado no arrastar e largar da UI)
  moveSlot(fromIdx, toIdx) {
    if (fromIdx === toIdx) {
      return;
    }
    if (fromIdx < 0 || toIdx < 0) {
      return;
    }
    if (fromIdx >= this.slots.length || toIdx >= this.slots.length) {
      return;
    }

    const tmp = this.slots[fromIdx];
    this.slots[fromIdx] = this.slots[toIdx];
    this.slots[toIdx] = tmp;

    this.emit("changed", this.slots);
  }

  // Conta a quantidade total acumulada de um determinado item no inventário
  getQuantity(itemId) {
    return this.slots.reduce(
      (t, s) => (s && s.itemId === itemId ? t + s.qty : t),
      0,
    );
  }

  // Altera o slot atualmente selecionado na hotbar ativa
  selectSlot(index) {
    if (index < 0 || index >= this.size) {
      return;
    }
    this.selectedSlot = index;
    this.emit("selectionChanged", this.selectedSlot);
  }

  // Devolve o item que está no slot atualmente selecionado
  getSelectedItem() {
    return this.slots[this.selectedSlot];
  }

  // Converte os dados do inventário para formato JSON legível para salvar o jogo
  toJSON() {
    return {
      size: this.size,
      slots: this.slots.map((s) =>
        s ? { itemId: s.itemId, qty: s.qty } : null,
      ),
      selectedSlot: this.selectedSlot,
    };
  }

  // Repõe o estado do inventário a partir dos dados do ficheiro de gravação (save)
  fromJSON(data) {
    if (!data) {
      return;
    }
    if (typeof data.size === "number") {
      this.size = data.size;
    }
    if (Array.isArray(data.slots)) {
      this.slots = data.slots.map((s) =>
        s ? { itemId: s.itemId, qty: s.qty } : null,
      );
    }
    if (typeof data.selectedSlot === "number") {
      this.selectedSlot = data.selectedSlot;
    }

    this.emit("changed", this.slots);
    this.emit("selectionChanged", this.selectedSlot);
  }
}
