// Cena inicial de arranque do jogo.
// Serve para configurar definições globais do sistema antes de carregar os assets.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  // Carrega assets mínimos que sejam necessários antes da barra de progresso do carregamento.
  preload() {}

  // Inicializado logo a seguir ao preload. Salta diretamente para o pré-carregamento principal.
  create() {
    this.scene.start("PreloadScene");
  }
}
