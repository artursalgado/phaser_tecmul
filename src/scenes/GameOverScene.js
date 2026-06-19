import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';
import makeBtn from '../utils/makeBtn.js';
import SaveManager from '../systems/SaveManager.js';

// Cena de Game Over aparece quando o jogador perde toda a vida e não tem vidas extra
export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const W = 960, H = 640;

        // Lê as estatísticas da partida passadas 
        // pela GameScene ao mudar de cena
        const score = data?.score ?? 0;
        const kills = data?.kills ?? 0;
        const time = data?.time ?? 0;

        // Para a música de fundo e toca o som de morte
        SoundManager.stopBgMusic();
        SoundManager.play('die');

        // Cria um overlay preto. Parâmetros de rectangle: (centro X, centro Y, largura, altura, cor em hex, opacidade inicial)
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
        // Transição de fade-in. Parâmetros do tween: (targets: objeto a animar, alpha: opacidade final, duration: tempo em milissegundos)
        this.tweens.add({ targets: overlay, alpha: 0.88, duration: 700 });

        // Cria gotas de sangue decorativas a cair suavemente do ecrã para efeitos dramáticos
        for (let i = 0; i < 18; i++) {
            // Cria um círculo de sangue. Parâmetros de circle: (centro X, centro Y, raio do círculo, cor vermelha, opacidade)
            const gota = this.add.circle(
                Phaser.Math.Between(80, W - 80),
                Phaser.Math.Between(-40, H / 2),
                Phaser.Math.Between(3, 9), 0xaa0000, 0.7
            );
            // Transição de queda. Parâmetros de tween: (targets: alvo, y: posição Y final, alpha: opacidade final, duration: tempo em ms, delay: atraso de início, ease: curva de aceleração)
            this.tweens.add({
                targets: gota,
                y: gota.y + Phaser.Math.Between(200, 500),
                alpha: 0,
                duration: Phaser.Math.Between(1200, 2400),
                delay: Phaser.Math.Between(0, 800),
                ease: 'Quad.easeIn'
            });
        }

        // Definição das coordenadas e dimensões do painel central RPG
        const painelW = 480, painelH = 370;
        const cx = W / 2 - painelW / 2;
        const cy = (H / 2 - 10) - painelH / 2;

        // Cria os gráficos do painel central
        const painel = this.add.graphics().setAlpha(0).setDepth(5);

        // Sombra
        painel.fillStyle(0x000000, 0.35);
        painel.fillRoundedRect(cx + 4, cy + 4, painelW, painelH, 6);

        // Fundo castanho escuro
        painel.fillStyle(0x160a00, 0.92);
        painel.fillRoundedRect(cx, cy, painelW, painelH, 6);

        // Borda dourada ornamentada
        painel.lineStyle(1.5, 0xc8901a, 0.72);
        painel.strokeRoundedRect(cx, cy, painelW, painelH, 6);

        // Título de "Derrota" estilizado em vermelho sangue
        const titulo = this.add.text(W / 2, H / 2 - 130, I18n.t('gameover.title'), {
            fontFamily: 'Georgia, serif', fontSize: '52px', fill: '#cc2200', fontStyle: 'bold',
            stroke: '#330000', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Subtítulo descritivo
        const sub = this.add.text(W / 2, H / 2 - 60, I18n.t('gameover.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '17px', fill: '#c8a878', fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Linha divisória horizontal dourada
        const divGrafico = this.add.graphics().setAlpha(0).setDepth(6);
        divGrafico.lineStyle(1, 0x9a6030, 0.7);
        divGrafico.lineBetween(W / 2 - 180, H / 2 - 34, W / 2 + 180, H / 2 - 34);

        // Formata o tempo decorrido em MM:SS
        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2, '0');
        const etiquetaEstatisticas = `⏱  ${mm}:${ss}     ☠  ${kills}     ★  ${score} pts`;

        // Desenha a linha de estatísticas obtidas na partida
        const textoEstatisticas = this.add.text(W / 2, H / 2 - 14, etiquetaEstatisticas, {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#c8a878', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Cria os botões para Tentar de Novo ou ir para o Menu Principal
        const btnRestart = makeBtn(this, W / 2, H / 2 + 60, 260, 46, I18n.t('gameover.restart'));
        const btnMenu = makeBtn(this, W / 2, H / 2 + 116, 260, 46, I18n.t('gameover.menu'));

        // Ouvintes de clique nos botões
        btnRestart.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SaveManager.clear(); // Apaga o save corrompido de morte
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });

        btnMenu.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SaveManager.clear(); // Apaga o save corrompido de morte
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Efeito de transição de fade-in para todos os elementos do painel central
        this.tweens.add({
            targets: [
                painel, titulo, sub, divGrafico, textoEstatisticas,
                btnRestart.grafico, btnRestart.txt,
                btnMenu.grafico, btnMenu.txt,
            ],
            alpha: 1, duration: 900, delay: 400
        });

        // Regista atalhos rápidos de teclado para voltar a jogar ou ir para o menu
        this.input.keyboard.once('keydown-R', () => {
            SaveManager.clear();
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });
        this.input.keyboard.once('keydown-M', () => {
            SaveManager.clear();
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Mostra legenda explicativa sobre as teclas de atalho
        this.add.text(W / 2, H - 24, I18n.t('gameover.keys'),
            { fontSize: '11px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5);
    }
}
