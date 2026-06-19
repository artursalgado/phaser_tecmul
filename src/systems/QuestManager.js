// Lista de componentes necessários para reparar a jangada e escapar da ilha.
// Define o tipo de item, o nome visível, o ícone na HUD e a quantidade necessária.
export const RAFT_PARTS = [
  { id: "sail", label: "Vela", icon: "⛵", required: 1 }, // Larga pelo Boss Esqueleto
  { id: "rope", label: "Corda", icon: "🪢", required: 3 }, // Encontrado em caixas na ilha
  { id: "wood", label: "Madeira", icon: "🪵", required: 5 }, // Cortada de árvores
];

// O QuestManager gere o progresso do objetivo final do jogo: a reparação da jangada.
export default class QuestManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();

    // Estado atual de entrega dos recursos.
    // Inicializa todas as peças com 0 entregues e a quantidade pedida
    this.state = {};
    RAFT_PARTS.forEach((p) => {
      this.state[p.id] = { have: 0, need: p.required };
    });

    this.complete = false;
    this.bus = null; // Barramento global de eventos do Phaser
  }

  // Liga o QuestManager ao barramento de eventos do jogo para comunicar com a HUD
  init(scene) {
    this.bus = scene.game.events;
  }

  // Regista a entrega de recursos na zona da jangada
  add(resource, qty) {
    const entry = this.state[resource];
    if (!entry) {
      return 0;
    }

    // Calcula a quantidade ainda necessária daquele recurso
    const stillNeed = entry.need - entry.have;
    if (stillNeed <= 0) {
      return 0;
    } // Já entregou tudo o que precisava

    // Aceita apenas a quantidade que falta para preencher o requisito
    const accepted = Math.min(qty, stillNeed);
    entry.have += accepted;

    // Dispara eventos de entrega
    this.emit("partDelivered", resource, entry.have, entry.need);
    this.emitUpdated();

    // Se acabou de entregar a última peça restante, completa a quest
    if (!this.complete && this.isComplete()) {
      this.complete = true;
      this.emit("raftComplete");
      if (this.bus) {
        this.bus.emit("quest:complete");
      }
    }

    return accepted; // Retorna a quantidade que foi realmente descontada do inventário
  }

  // Atalho de semântica equivalente a 'add'
  deliver(itemId, qty) {
    return this.add(itemId, qty);
  }

  // Verifica se todos os recursos necessários atingiram a meta
  isComplete() {
    return RAFT_PARTS.every(
      (p) => this.state[p.id].have >= this.state[p.id].need,
    );
  }

  // Retorna uma cópia do progresso atual para leitura
  progress() {
    const snap = {};
    RAFT_PARTS.forEach((p) => {
      snap[p.id] = { have: this.state[p.id].have, need: this.state[p.id].need };
    });
    return snap;
  }

  // Retorna uma lista de progresso estruturada formatada para a HUDScene desenhar
  getProgress() {
    return RAFT_PARTS.map((p) => ({
      ...p,
      current: this.state[p.id].have,
      done: this.state[p.id].have >= this.state[p.id].need,
    }));
  }

  // Penalidade aplicada ao morrer: perde 90% de todo o progresso de itens já entregues na jangada
  applyDeathPenalty() {
    RAFT_PARTS.forEach((p) => {
      this.state[p.id].have = Math.floor(this.state[p.id].have * 0.1);
    });
    this.complete = false;

    this.emit("penaltyApplied");
    if (this.bus) {
      this.bus.emit("quest:penalty", this.progress());
    }
    this.emitUpdated();
  }

  // Envia uma atualização geral de estado para o barramento de eventos do jogo
  emitUpdated() {
    if (this.bus) {
      this.bus.emit("quest:updated", this.progress());
    }
  }

  // Converte os dados da quest para salvar o jogo
  toJSON() {
    return {
      state: JSON.parse(JSON.stringify(this.state)),
      complete: this.complete,
    };
  }

  // Restaura o progresso da jangada a partir de um save
  fromJSON(data) {
    if (!data) {
      return;
    }
    const savedState = data.state || data._state;
    if (savedState) {
      for (const key in savedState) {
        if (this.state[key]) {
          this.state[key].have = savedState[key].have;
          if (typeof savedState[key].need === "number") {
            this.state[key].need = savedState[key].need;
          }
        }
      }
    }

    const savedComplete =
      data.complete !== undefined ? data.complete : data._complete;
    if (typeof savedComplete === "boolean") {
      this.complete = savedComplete;
    }

    this.emitUpdated();
  }
}
