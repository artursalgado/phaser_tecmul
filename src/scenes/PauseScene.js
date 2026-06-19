import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';
import makeBtn from '../utils/makeBtn.js';
import SaveManager from '../systems/SaveManager.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const W = 960, H = 640;

        // Fundo escuro com transicao suave
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.72, duration: 200 });

        // Painel central RPG
        const painelW = 300, painelH = 340;
        const cx = W / 2 - painelW / 2;
        const cy = H / 2 - painelH / 2;
        const HEADER_H = 34;

        const painelGrafico = this.add.graphics().setDepth(1);
        
        // Sombra
        painelGrafico.fillStyle(0x000000, 0.35);
        painelGrafico.fillRoundedRect(cx + 4, cy + 4, painelW, painelH, 6);
        
        // Fundo castanho escuro
        painelGrafico.fillStyle(0x160a00, 0.92);
        painelGrafico.fillRoundedRect(cx, cy, painelW, painelH, 6);
        
        // Borda dourada
        painelGrafico.lineStyle(1.5, 0xc8901a, 0.72);
        painelGrafico.strokeRoundedRect(cx, cy, painelW, painelH, 6);
        
        // Banda do header
        painelGrafico.fillStyle(0x3d1a00, 1);
        painelGrafico.fillRoundedRect(cx, cy, painelW, HEADER_H, { tl: 6, tr: 6, bl: 0, br: 0 });
        
        // Linha divisoria dourada
        painelGrafico.lineStyle(1, 0xc8901a, 0.6);
        painelGrafico.lineBetween(cx + 8, cy + HEADER_H, cx + painelW - 8, cy + HEADER_H);

        const textoTitulo = I18n.lang === 'en' ? 'PAUSED' : 'PAUSA';
        const titulo = this.add.text(W / 2, cy + HEADER_H / 2, textoTitulo, {
            fontSize: '12px', fill: '#f5c070', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);

        // Botao Continuar
        const textoContinuar = I18n.lang === 'en' ? 'Continue' : 'Continuar';
        const btnContinue = makeBtn(this, W/2, H/2 - 75, 220, 38, textoContinuar, { depth: 2 });
        btnContinue.zone.on('pointerdown', () => this.retomar());

        // Botao Mute
        const obterEtiquetaMute = () => SoundManager.muted
            ? (I18n.lang === 'en' ? '🔇 Unmute' : '🔇 Ativar som')
            : (I18n.lang === 'en' ? '🔊 Mute'   : '🔊 Silenciar');

        const btnMute = makeBtn(this, W/2, H/2 - 25, 220, 38, obterEtiquetaMute(), { depth: 2 });
        btnMute.zone.on('pointerdown', () => {
            SoundManager.toggleMute();
            btnMute.txt.setText(obterEtiquetaMute());
        });

        // Botao Apagar Save
        const btnClearSave = makeBtn(this, W/2, H/2 + 25, 220, 38, I18n.t('pause.delete_save'), { depth: 2 });
        btnClearSave.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SaveManager.clear();
            btnClearSave.txt.setText(I18n.t('pause.save_deleted'));
        });

        // Botao Menu
        const textoMenu = I18n.lang === 'en' ? 'Main Menu' : 'Menu Principal';
        const btnMenu = makeBtn(this, W/2, H/2 + 75, 220, 38, textoMenu, { depth: 2 });
        btnMenu.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('PauseScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Legenda informativa
        this.add.text(W/2, H/2 + 125,
            I18n.lang === 'en' ? '[ESC] to resume' : '[ESC] para continuar',
            { fontSize: '11px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(2);

        // ESC para retomar o jogo
        this.input.keyboard.once('keydown-ESC', () => this.retomar());
    }

    // Retoma o jogo
    retomar() {
        SoundManager.play('menu_click');
        this.scene.stop('PauseScene');
        this.scene.resume('GameScene');
    }
}
