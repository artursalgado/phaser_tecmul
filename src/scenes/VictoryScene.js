import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';
import makeBtn from '../utils/makeBtn.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create(data) {
        const W = 960, H = 640;
        const score = data?.score ?? 0;
        const kills = data?.kills ?? 0;
        const time  = data?.time  ?? 0;

        SoundManager.play('victory');
        SoundManager.stopBgMusic();

        this.cameras.main.fadeIn(700, 0, 0, 0);

        const bgJangada = this.add.image(W/2, H/2, 'fim_jangada').setDepth(0);
        const bgHappy = this.add.image(W/2, H/2, 'fim_happy').setDepth(0).setAlpha(0);

        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x1a1000, 0.35).setDepth(1);

        // Painel central
        const painelW = 480, painelH = 370;
        const cx = W/2 - painelW/2;
        const cy = (H/2 - 10) - painelH/2;

        const painel = this.add.graphics().setAlpha(0).setDepth(5);
        
        // Sombra
        painel.fillStyle(0x000000, 0.35);
        painel.fillRoundedRect(cx + 4, cy + 4, painelW, painelH, 6);
        
        // Fundo castanho escuro
        painel.fillStyle(0x160a00, 0.92);
        painel.fillRoundedRect(cx, cy, painelW, painelH, 6);
        
        // Borda dourada
        painel.lineStyle(1.5, 0xc8901a, 0.72);
        painel.strokeRoundedRect(cx, cy, painelW, painelH, 6);

        // Titulo de vitoria
        const titulo = this.add.text(W/2, H/2 - 130, I18n.t('victory.title'), {
            fontFamily: 'Georgia, serif', fontSize: '44px', fill: '#f0c030', fontStyle: 'bold',
            stroke: '#3a2000', strokeThickness: 4,
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        const sub = this.add.text(W/2, H/2 - 68, I18n.t('victory.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#c8a878', fontStyle: 'italic',
            wordWrap: { width: 420 }, align: 'center',
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Linha divisoria
        const divGrafico = this.add.graphics().setAlpha(0).setDepth(6);
        divGrafico.lineStyle(1, 0xc8901a, 0.7);
        divGrafico.lineBetween(W/2 - 180, H/2 - 26, W/2 + 180, H/2 - 26);

        const mm = Math.floor(time / 60), ss = String(time % 60).padStart(2,'0');
        const etiquetaEstatisticas = `⏱  ${mm}:${ss}     ☠  ${kills}     ★  ${score} pts`;

        const textoEstatisticas = this.add.text(W/2, H/2 - 4, etiquetaEstatisticas, {
            fontFamily: 'Georgia, serif', fontSize: '15px', fill: '#c8a878', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(6);

        // Criacao dos botoes
        const btnRestart = makeBtn(this, W/2, H/2 + 55, 260, 46, I18n.t('victory.restart'), { alpha: 0 });
        const btnMenu    = makeBtn(this, W/2, H/2 + 111, 260, 46, I18n.t('victory.menu'), { alpha: 0 });
        btnRestart.zone.disableInteractive();
        btnMenu.zone.disableInteractive();

        btnRestart.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
        });
        btnMenu.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('VictoryScene');
            this.scene.start('MenuScene');
        });

        this.input.keyboard.once('keydown-R', () => {
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene');
        });

        const textoCutscene = this.add.text(W/2, H/2 - 20, '', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'italic',
            align: 'center', wordWrap: { width: 700 },
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(6);

        const dadosIdioma = this.cache.json.get(I18n.lang === 'pt' ? 'i18n_pt' : 'i18n_en');
        const linhas = dadosIdioma?.victory?.cutscene || [];

        // Mostra as falas da cutscene uma a uma
        const mostrarLinha = (i) => {
            if (i >= linhas.length) {
                textoCutscene.destroy();
                this.tweens.add({
                    targets: bgJangada,
                    alpha: 0,
                    duration: 800
                });
                this.tweens.add({
                    targets: bgHappy,
                    alpha: 1,
                    duration: 800
                });
                this.tweens.add({
                    targets: overlay,
                    alpha: 0.55,
                    duration: 800
                });
                
                this.time.delayedCall(2500, () => {
                    this.tweens.add({
                        targets: [
                            painel, titulo, sub, divGrafico, textoEstatisticas,
                            btnRestart.grafico, btnRestart.txt,
                            btnMenu.grafico, btnMenu.txt,
                        ],
                        alpha: 1,
                        duration: 600,
                        onComplete: () => {
                            btnRestart.zone.setInteractive();
                            btnMenu.zone.setInteractive();
                        }
                    });
                });
                return;
            }
            textoCutscene.setText(linhas[i]).setAlpha(0);
            this.tweens.add({
                targets: textoCutscene, alpha: 1, duration: 500,
                onComplete: () => {
                    this.time.delayedCall(1500, () => {
                        this.tweens.add({
                            targets: textoCutscene, alpha: 0, duration: 400,
                            onComplete: () => mostrarLinha(i + 1)
                        });
                    });
                }
            });
        };
        mostrarLinha(0);
    }
}