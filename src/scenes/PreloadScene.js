export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        //Tile map da ilha / carrega o JSON do Tiled com a chave 'ilha'
        this.load.tilemapTiledJSON('ilha', 'assets/tilemaps/ilha.json');

        //Tilesets / imagens que o Tiled utiliza no mapa (recurso free))
        this.load.image('sunnyside', 'assets/tilesets/spr_tileset_sunnysideworld_16px.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

