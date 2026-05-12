export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    // Carrega assets mínimos antes de tudo
    preload() {
    }

    // Vai direto para a cena de pré-carregamento
    create() {
        this.scene.start('PreloadScene');
    }
}