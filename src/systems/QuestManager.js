// QuestManager — controla os 3 recursos da jangada e o estado da quest
// Cada objetivo tem: id, nome, quantidade necessária, ícone
// O GameScene notifica este manager quando o player entrega recursos na jangada.

export const RAFT_PARTS = [
    { id: 'wood',  label: 'Madeira', icon: '🪵', required: 5 },
    { id: 'rope',  label: 'Corda',   icon: '🪢', required: 3 },
    { id: 'sail',  label: 'Vela',    icon: '⛵', required: 1 },
];

export default class QuestManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        // progresso actual de cada recurso (começa a 0)
        this._progress = {};
        RAFT_PARTS.forEach(p => { this._progress[p.id] = 0; });
    }

    // Tenta entregar qty unidades de itemId.
    // Devolve quanto foi realmente aceite (0 se não é um recurso da jangada).
    deliver(itemId, qty) {
        const part = RAFT_PARTS.find(p => p.id === itemId);
        if (!part) return 0;

        const alreadyHave = this._progress[itemId];
        const stillNeed   = part.required - alreadyHave;
        if (stillNeed <= 0) return 0;           // já completo

        const accepted = Math.min(qty, stillNeed);
        this._progress[itemId] += accepted;

        this.emit('partDelivered', itemId, this._progress[itemId], part.required);

        if (this.isComplete()) {
            this.emit('raftComplete');
        }

        return accepted;
    }

    // Aplica penalização de morte: perde 90% do progresso de todos os recursos
    applyDeathPenalty() {
        RAFT_PARTS.forEach(p => {
            this._progress[p.id] = Math.floor(this._progress[p.id] * 0.1);
        });
        this.emit('penaltyApplied');
    }

    // Retorna true se todos os recursos estão completos
    isComplete() {
        return RAFT_PARTS.every(p => this._progress[p.id] >= p.required);
    }

    // Retorna info de progresso para a HUD
    getProgress() {
        return RAFT_PARTS.map(p => ({
            ...p,
            current: this._progress[p.id],
            done: this._progress[p.id] >= p.required,
        }));
    }
}
