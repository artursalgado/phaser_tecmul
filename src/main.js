// Importação de todas as cenas que fazem parte do fluxo de jogo do Stranded
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import IntroScene from './scenes/IntroScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import PauseScene from './scenes/PauseScene.js';

// Configuração geral do motor Phaser
const config = {
    // Escolhe automaticamente WebGL se disponível, caso contrário recua para Canvas 2D
    type: Phaser.AUTO,
    scale: {
        // Redimensiona o ecrã do jogo para caber na janela mantendo a proporção de aspeto (aspect ratio)
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centraliza o ecrã na janela do browser
        width: 960,  // Largura nativa em pixels do jogo
        height: 640, // Altura nativa em pixels do jogo
    },
    backgroundColor: '#0a0a1a', // Cor de fundo por baixo do jogo
    physics: {
        default: 'arcade', // Utiliza o motor físico Arcade (mais leve e rápido para jogos 2D simples)
        arcade: {
            gravity: { y: 0 }, // Jogo top-down, logo não há gravidade vertical padrão no mundo
            debug: false // Define a 'true' para desenhar as hitboxes físicas se precisares de testar
        }
    },
    // Registo de todas as cenas na ordem do fluxo do jogo
    scene: [
        BootScene,
        PreloadScene,
        IntroScene,
        MenuScene,
        GameScene,
        HUDScene,
        InventoryScene,
        GameOverScene,
        VictoryScene,
        PauseScene
    ]
};

// Instancia e arranca o jogo com a configuração definida
new Phaser.Game(config);
