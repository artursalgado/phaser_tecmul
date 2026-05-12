export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {

    }

    create() {
        // Adicionar retangulo / centrar / tamanho / cor
        this.add.rectangle(480, 320, 960, 640, 0x000000);
        // Título do jogo
        const titulo = this.add.text(480, 200, 'STRANDED', {
            fontSize: '72px',
            fill: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 8
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(480, 280, 'Uma ilha. Sem saída. Encontra um caminho.', {
            fontSize: '18px',
            fill: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Botão Jogar
        const botaoJogar = this.add.text(480, 400, '▶  JOGAR', {
            fontSize: '36px',
            fill: '#f0e68c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Torna o botão clicável
        botaoJogar.setInteractive({ useHandCursor: true });

        // Efeito hover — rato por cima
        botaoJogar.on('pointerover', () => {
            botaoJogar.setStyle({ fill: '#ffffff' });
        });

        // Efeito hover — rato sai
        botaoJogar.on('pointerout', () => {
            botaoJogar.setStyle({ fill: '#f0e68c' });
        });

        // Clique — inicia o jogo
        botaoJogar.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // tipo de língua
        this.add.text(480, 580, '🇵🇹 PT     🇬🇧 EN', {
            fontSize: '20px',
            fill: '#888888'
        }).setOrigin(0.5);

        // Versão
        this.add.text(16, 620, 'v0.1', {
            fontSize: '12px',
            fill: '#444444'
        });

        // Animação de pulsar no título
        this.tweens.add({
            targets: titulo,        // guardar o título numa variável primeiro
            alpha: 0.6,             // transparência mínima
            duration: 2000,         // duração em ms
            yoyo: true,             // volta ao início
            repeat: -1              // repete infinitamente
        });
    }

    update() {

    }
}