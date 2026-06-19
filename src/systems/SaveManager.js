class SaveManager {
    // Guarda o estado atual do jogo no localStorage
    save(scene) {
        if (!scene) return;
        const dados = {
            inventory: scene.inventory ? scene.inventory.toJSON() : null,
            stats: scene.stats ? scene.stats.toJSON() : null,
            quest: scene.quest ? scene.quest.toJSON() : null,
            score: scene.score,
            killCount: scene.killCount,
            elapsedSec: scene.elapsedSec,
            hasExtraLife: scene.hasExtraLife,
            enemiesUnlocked: scene.enemiesUnlocked,
            waveTimer: scene.waveTimer,
            waveWarningShown: scene.waveWarningShown,
            waveNumber: scene.waveNumber,
            playerPosition: scene.player ? { x: scene.player.x, y: scene.player.y } : null
        };
        try {
            localStorage.setItem('stranded_save', JSON.stringify(dados));
        } catch (e) {
            // falha silenciosa
        }
    }

    // Carrega o estado do jogo do localStorage
    load() {
        try {
            const dadosTexto = localStorage.getItem('stranded_save');
            if (!dadosTexto) return null;
            return JSON.parse(dadosTexto);
        } catch (e) {
            return null;
        }
    }

    // Apaga o save do localStorage
    clear() {
        try {
            localStorage.removeItem('stranded_save');
        } catch (e) {
            // falha silenciosa
        }
    }

    // Verifica se existe algum save guardado
    hasSave() {
        try {
            return localStorage.getItem('stranded_save') !== null;
        } catch (e) {
            return false;
        }
    }
}

export default new SaveManager();
