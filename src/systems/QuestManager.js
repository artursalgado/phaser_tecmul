export const RAFT_PARTS = [
    { id: 'sail', label: 'Vela',    icon: '⛵', required: 1 },
    { id: 'rope', label: 'Corda',   icon: '🪢', required: 3 },
    { id: 'wood', label: 'Madeira', icon: '🪵', required: 5 },
];

export default class QuestManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();

        // Estado interno com os recursos necessarios para a jangada
        this.state = {};
        RAFT_PARTS.forEach(p => {
            this.state[p.id] = { have: 0, need: p.required };
        });

        this.complete = false;
        this.bus = null;
    }

    // Inicializa o barramento de eventos global do jogo
    init(scene) {
        this.bus = scene.game.events;
    }

    // Adiciona uma quantidade de recursos entregues
    add(resource, qty) {
        const entry = this.state[resource];
        if (!entry) return 0;

        const stillNeed = entry.need - entry.have;
        if (stillNeed <= 0) return 0;

        const accepted = Math.min(qty, stillNeed);
        entry.have += accepted;

        this.emit('partDelivered', resource, entry.have, entry.need);
        this.emitUpdated();

        if (!this.complete && this.isComplete()) {
            this.complete = true;
            this.emit('raftComplete');
            if (this.bus) this.bus.emit('quest:complete');
        }

        return accepted;
    }

    // Alias para o metodo add
    deliver(itemId, qty) {
        return this.add(itemId, qty);
    }

    // Verifica se todos os recursos foram recolhidos
    isComplete() {
        return RAFT_PARTS.every(p => this.state[p.id].have >= this.state[p.id].need);
    }

    // Retorna o progresso atual formatado
    progress() {
        const snap = {};
        RAFT_PARTS.forEach(p => {
            snap[p.id] = { have: this.state[p.id].have, need: this.state[p.id].need };
        });
        return snap;
    }

    // Retorna o progresso em formato de array para a HUD
    getProgress() {
        return RAFT_PARTS.map(p => ({
            ...p,
            current: this.state[p.id].have,
            done:    this.state[p.id].have >= this.state[p.id].need,
        }));
    }

    // Penalidade por morte: perde 90% dos recursos recolhidos
    applyDeathPenalty() {
        RAFT_PARTS.forEach(p => {
            this.state[p.id].have = Math.floor(this.state[p.id].have * 0.1);
        });
        this.complete = false;

        this.emit('penaltyApplied');
        if (this.bus) this.bus.emit('quest:penalty', this.progress());
        this.emitUpdated();
    }

    // Emite evento de atualizacao no barramento global
    emitUpdated() {
        if (this.bus) this.bus.emit('quest:updated', this.progress());
    }

    toJSON() {
        return {
            state: JSON.parse(JSON.stringify(this.state)),
            complete: this.complete
        };
    }

    fromJSON(data) {
        if (!data) return;
        const savedState = data.state || data._state;
        if (savedState) {
            for (const key in savedState) {
                if (this.state[key]) {
                    this.state[key].have = savedState[key].have;
                    if (typeof savedState[key].need === 'number') {
                        this.state[key].need = savedState[key].need;
                    }
                }
            }
        }
        const savedComplete = data.complete !== undefined ? data.complete : data._complete;
        if (typeof savedComplete === 'boolean') {
            this.complete = savedComplete;
        }
        this.emitUpdated();
    }
}
