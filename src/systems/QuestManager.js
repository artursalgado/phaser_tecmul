/**
 * QuestManager — tracks the 3 raft objectives (wood, rope, sail).
 *
 * State shape:
 *   { wood: { have: 0, need: 5 },
 *     rope: { have: 0, need: 3 },
 *     sail: { have: 0, need: 1 } }
 *
 * Public API (as specified in issue #3):
 *   add(resource, qty)  — deliver qty units of resource; returns accepted amount
 *   isComplete()        — true when all 3 resources reach their need
 *   progress()          — returns full state snapshot { wood, rope, sail }
 *
 * Events emitted on the Phaser global event bus (scene.game.events):
 *   'quest:updated'   — after every add(); payload: progress snapshot
 *   'quest:complete'  — when isComplete() first becomes true
 *   'quest:penalty'   — after death penalty (90 % loss); payload: progress snapshot
 *
 * Legacy events (kept for HUDScene compatibility):
 *   'partDelivered'   — (id, have, need)
 *   'raftComplete'    — ()
 *   'penaltyApplied'  — ()
 */

export const RAFT_PARTS = [
    { id: 'sail', label: 'Vela',    icon: '⛵', required: 1 },
    { id: 'rope', label: 'Corda',   icon: '🪢', required: 3 },
    { id: 'wood', label: 'Madeira', icon: '🪵', required: 5 },
];

export default class QuestManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();

        // Internal state: { wood: { have, need }, rope: { have, need }, sail: { have, need } }
        this._state = {};
        RAFT_PARTS.forEach(p => {
            this._state[p.id] = { have: 0, need: p.required };
        });

        this._complete = false;
        // Reference to the Phaser game event bus — set via init(scene) or lazily
        this._bus = null;
    }

    // Call once from GameScene.create() so we can reach the global event bus.
    init(scene) {
        this._bus = scene.game.events;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Deliver qty units of resource.
     * Returns the number actually accepted (0 if resource unknown or already full).
     */
    add(resource, qty) {
        const entry = this._state[resource];
        if (!entry) return 0;

        const stillNeed = entry.need - entry.have;
        if (stillNeed <= 0) return 0;

        const accepted = Math.min(qty, stillNeed);
        entry.have += accepted;

        // Legacy event (HUDScene listens to this)
        this.emit('partDelivered', resource, entry.have, entry.need);

        // Global bus event
        this._emitUpdated();

        if (!this._complete && this.isComplete()) {
            this._complete = true;
            this.emit('raftComplete');
            if (this._bus) this._bus.emit('quest:complete');
        }

        return accepted;
    }

    /**
     * Alias kept so GameScene._tryBuildRaft() keeps working with deliver().
     */
    deliver(itemId, qty) {
        return this.add(itemId, qty);
    }

    /** Returns true when all 3 resources have reached their need. */
    isComplete() {
        return RAFT_PARTS.every(p => this._state[p.id].have >= this._state[p.id].need);
    }

    /**
     * Returns the full state snapshot:
     *   { wood: { have, need }, rope: { have, need }, sail: { have, need } }
     */
    progress() {
        const snap = {};
        RAFT_PARTS.forEach(p => {
            snap[p.id] = { have: this._state[p.id].have, need: this._state[p.id].need };
        });
        return snap;
    }

    /**
     * Returns progress as an array (used by HUDScene).
     * Each entry: { id, label, icon, required, current, done }
     */
    getProgress() {
        return RAFT_PARTS.map(p => ({
            ...p,
            current: this._state[p.id].have,
            done:    this._state[p.id].have >= this._state[p.id].need,
        }));
    }

    /**
     * Death penalty: lose 90 % of all progress (keep 10 %, floored).
     * Resets the complete flag so the player must re-earn the win condition.
     */
    applyDeathPenalty() {
        RAFT_PARTS.forEach(p => {
            this._state[p.id].have = Math.floor(this._state[p.id].have * 0.1);
        });
        this._complete = false;

        // Legacy event
        this.emit('penaltyApplied');

        // Global bus event
        if (this._bus) this._bus.emit('quest:penalty', this.progress());
        this._emitUpdated();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _emitUpdated() {
        if (this._bus) this._bus.emit('quest:updated', this.progress());
    }
}
