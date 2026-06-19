class SaveManager {
    save(scene) {
        if (!scene) return;
        const saveData = {
            inventory: scene.inventory ? scene.inventory.toJSON() : null,
            stats: scene.stats ? scene.stats.toJSON() : null,
            quest: scene.quest ? scene.quest.toJSON() : null,
            score: scene._score,
            killCount: scene._killCount,
            elapsedSec: scene._elapsedSec,
            hasExtraLife: scene._hasExtraLife,
            enemiesUnlocked: scene._enemiesUnlocked,
            waveTimer: scene._waveTimer,
            waveWarningShown: scene._waveWarningShown,
            waveNumber: scene._waveNumber,
            playerPosition: scene.player ? { x: scene.player.x, y: scene.player.y } : null
        };
        try {
            localStorage.setItem('stranded_save', JSON.stringify(saveData));
            console.log('[SaveManager] Game saved successfully.');
        } catch (e) {
            console.error('[SaveManager] Failed to save game to localStorage:', e);
        }
    }

    load() {
        try {
            const dataStr = localStorage.getItem('stranded_save');
            if (!dataStr) return null;
            return JSON.parse(dataStr);
        } catch (e) {
            console.error('[SaveManager] Failed to load game from localStorage:', e);
            return null;
        }
    }

    clear() {
        try {
            localStorage.removeItem('stranded_save');
            console.log('[SaveManager] Save cleared.');
        } catch (e) {
            console.error('[SaveManager] Failed to clear save from localStorage:', e);
        }
    }

    hasSave() {
        try {
            return localStorage.getItem('stranded_save') !== null;
        } catch (e) {
            return false;
        }
    }
}

export default new SaveManager();
