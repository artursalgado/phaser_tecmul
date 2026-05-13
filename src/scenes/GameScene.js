export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {

    }

    create() {

        //////
        // CRIAR TILEMAP BASEADO NO JSON
        //////
        const mapa = this.make.tilemap({ key: 'ilha' });

        // Ligar o tileset ao mapa
        const tileset = mapa.addTilesetImage('sunnyside', 'sunnyside');

        // Criar as 3 layers
        const chao = mapa.createLayer('chao', tileset, 0, 0);
        const decoracao = mapa.createLayer('decoracao', tileset, 0, 0);
        const colisao = mapa.createLayer('colisao', tileset, 0, 0);

        /////////
        // CRIAR PLAYER BASEADO
        /////////

        this.player = this.add.rectangle(640, 480, 16, 16, 0xff0000);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        /////////
        // CAMERA
        /////////
        this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        ///////// 
        // MOVIMENTAÇÃO
        ///////// 
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D

        });

    }

    update() {


    }
}