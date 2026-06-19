// O SaveManager gere a gravação e carregamento do progresso do jogador
// utilizando o localStorage do browser para persistência simples entre sessões.
class SaveManager {
    // Guarda o estado atual completo do jogo
    save(scene) {
        if (!scene) return;
        
        // Estrutura um objeto JSON simples com todas as propriedades necessárias do estado
        const dados = {
            inventory: scene.inventory ? scene.inventory.toJSON() : null, // Estado da mochila
            stats: scene.stats ? scene.stats.toJSON() : null,             // Vida, fome, sede, energia
            quest: scene.quest ? scene.quest.toJSON() : null,             // Peças da jangada entregues
            score: scene.score,                                           // Pontuação acumulada
            killCount: scene.killCount,                                   // Inimigos eliminados
            elapsedSec: scene.elapsedSec,                                 // Tempo de sobrevivência em segundos
            hasExtraLife: scene.hasExtraLife,                             // Flag de segunda chance de vida
            enemiesUnlocked: scene.enemiesUnlocked,                       // Indica se as waves de monstros já ativaram
            waveTimer: scene.waveTimer,                                   // Tempo restante para a próxima wave
            waveWarningShown: scene.waveWarningShown,                     // Se o alerta de "onda a aproximar-se" foi mostrado
            waveNumber: scene.waveNumber,                                 // Número da wave atual
            playerPosition: scene.player ? { x: scene.player.x, y: scene.player.y } : null // Posição X/Y do jogador
        };
        
        try {
            // Converte o objeto para uma string e grava no localStorage
            localStorage.setItem('stranded_save', JSON.stringify(dados));
        } catch (e) {
            // Falha silenciosa caso o browser tenha os cookies/armazenamento local desativados
        }
    }

    // Carrega o estado do jogo guardado
    load() {
        try {
            // Procura a chave de save do jogo no localStorage
            const dadosTexto = localStorage.getItem('stranded_save');
            if (!dadosTexto) return null; // Retorna null se não houver dados gravados
            
            return JSON.parse(dadosTexto); // Devolve o objeto desserializado
        } catch (e) {
            return null; // Caso ocorra um erro de sintaxe ou parse do JSON corrompido
        }
    }

    // Apaga completamente o save atual (ex: ao clicar em "Limpar Progresso" ou no Game Over)
    clear() {
        try {
            localStorage.removeItem('stranded_save');
        } catch (e) {
            // Falha silenciosa
        }
    }

    // Verifica de forma rápida se existe algum save válido armazenado no browser
    hasSave() {
        try {
            return localStorage.getItem('stranded_save') !== null;
        } catch (e) {
            return false;
        }
    }
}

// Exporta uma única instância global do gestor de gravações (Singleton)
export default new SaveManager();
