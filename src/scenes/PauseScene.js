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

        // Overlay semitransparente
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0);
        this.tweens.add({ targets: overlay, alpha: 0.72, duration: 200 });

        // Painel central RPG
        const panelW = 300, panelH = 340;
        const cx = W / 2 - panelW / 2;
        const cy = H / 2 - panelH / 2;
        const HEADER_H = 34;

        const panelGfx = this.add.graphics().setDepth(1);
        // Sombra
        panelGfx.fillStyle(0x000000, 0.35);
        panelGfx.fillRoundedRect(cx + 4, cy + 4, panelW, panelH, 6);
        // Fundo castanho escuro
        panelGfx.fillStyle(0x160a00, 0.92);
        panelGfx.fillRoundedRect(cx, cy, panelW, panelH, 6);
        // Borda dourada
        panelGfx.lineStyle(1.5, 0xc8901a, 0.72);
        panelGfx.strokeRoundedRect(cx, cy, panelW, panelH, 6);
        // Header band
        panelGfx.fillStyle(0x3d1a00, 1);
        panelGfx.fillRoundedRect(cx, cy, panelW, HEADER_H, { tl: 6, tr: 6, bl: 0, br: 0 });
        // Linha divisória dourada
        panelGfx.lineStyle(1, 0xc8901a, 0.6);
        panelGfx.lineBetween(cx + 8, cy + HEADER_H, cx + panelW - 8, cy + HEADER_H);

        const titleText = I18n.lang === 'en' ? 'PAUSED' : 'PAUSA';
        const title = this.add.text(W / 2, cy + HEADER_H / 2, titleText, {
            fontSize: '12px', fill: '#f5c070', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);

        // Botão Continuar
        const btnContinueText = I18n.lang === 'en' ? 'Continue' : 'Continuar';
        const btnContinue = makeBtn(this, W/2, H/2 - 75, 220, 38, btnContinueText, { depth: 2 });
        btnContinue.zone.on('pointerdown', () => this._resume());

        // Botão Mute
        const muteLabel = () => SoundManager.muted
            ? (I18n.lang === 'en' ? '🔇 Unmute' : '🔇 Ativar som')
            : (I18n.lang === 'en' ? '🔊 Mute'   : '🔊 Silenciar');

        const btnMute = makeBtn(this, W/2, H/2 - 25, 220, 38, muteLabel(), { depth: 2 });
        btnMute.zone.on('pointerdown', () => {
            SoundManager.toggleMute();
            btnMute.txt.setText(muteLabel());
        });

        // Botão Apagar Save
        const btnClearSave = makeBtn(this, W/2, H/2 + 25, 220, 38, I18n.t('pause.delete_save'), { depth: 2 });
        btnClearSave.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SaveManager.clear();
            btnClearSave.txt.setText(I18n.t('pause.save_deleted'));
        });

        // Botão Menu
        const btnMenuText = I18n.lang === 'en' ? 'Main Menu' : 'Menu Principal';
        const btnMenu = makeBtn(this, W/2, H/2 + 75, 220, 38, btnMenuText, { depth: 2 });
        btnMenu.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            this.scene.stop('PauseScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Dica
        this.add.text(W/2, H/2 + 125,
            I18n.lang === 'en' ? '[ESC] to resume' : '[ESC] para continuar',
            { fontSize: '11px', fill: '#c8a870', stroke: '#000000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(2);

        // ESC para fechar
        this.input.keyboard.once('keydown-ESC', () => this._resume());
    }

    _resume() {
        SoundManager.play('menu_click');
        this.scene.stop('PauseScene');
        this.scene.resume('GameScene');
    }
}
