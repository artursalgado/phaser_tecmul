import I18n from '../systems/I18n.js';
import SoundManager from '../systems/SoundManager.js';
import makeBtn from '../utils/makeBtn.js';
import SaveManager from '../systems/SaveManager.js';

const CONFIG_BOTAO_MENU = { depth: 3, fontSize: '19px', idleFill: '#f5e0b0', border: 0xc8901a, borderIdleAlpha: 0.6, alpha: 1 };

// Cria os botoes pequenos de idioma (PT e EN)
function criarBotaoIdioma(scene, x, y, label, depth = 3) {
    const w = 88, h = 32;
    const grafico = scene.add.graphics().setDepth(depth);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '13px',
        fill: '#c8a070', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1);

    let ativo = false;

    const desenhar = () => {
        grafico.clear();
        grafico.fillStyle(ativo ? 0x6b3810 : 0x2a1505, 1);
        grafico.fillRoundedRect(x - w/2, y - h/2, w, h, 6);
        grafico.lineStyle(2, 0xc8901a, ativo ? 1 : 0.4);
        grafico.strokeRoundedRect(x - w/2, y - h/2, w, h, 6);
    };
    desenhar();

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    return {
        grafico, txt, zone,
        setActive: (v) => {
            ativo = v;
            desenhar();
            txt.setStyle({ fill: v ? '#ffffff' : '#c8a070' });
        },
    };
}

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        SoundManager.init();

        const W = 960, H = 640;

        // Fundo e overlay de contraste
        this.add.image(W/2, H/2, 'intro_praia').setDisplaySize(W, H);
        this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.45);

        // Painel central
        const scrollH = 480;
        this.menuBg = this.add.nineslice(W/2, H/2 - 10, 'scroll_rpg', null, 460, scrollH, 18, 18, 24, 24)
            .setDepth(1);

        // Titulo do jogo
        const titulo = this.add.text(W/2, H/2 - 188, I18n.t('menu.title'), {
            fontFamily: 'Georgia, serif', fontSize: '60px', fill: '#3d2008',
            fontStyle: 'bold', align: 'center',
            stroke: '#c8a060', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(2);

        // Subtitulo do jogo
        const subtitulo = this.add.text(W/2, H/2 - 112, I18n.t('menu.subtitle'), {
            fontFamily: 'Georgia, serif', fontSize: '14px', fill: '#6b4820',
            fontStyle: 'italic', align: 'center',
        }).setOrigin(0.5).setDepth(2);

        // Linha divisoria
        const divGrafico = this.add.graphics().setDepth(2);
        const desenharDivisoria = () => {
            divGrafico.clear();
            divGrafico.lineStyle(1, 0x9a6030, 0.5);
            divGrafico.lineBetween(W/2 - 170, H/2 - 86, W/2 + 170, H/2 - 86);
            divGrafico.fillStyle(0x9a6030, 0.6);
            divGrafico.fillTriangle(W/2 - 10, H/2 - 86, W/2, H/2 - 80, W/2 + 10, H/2 - 86);
        };
        desenharDivisoria();

        // Posicionamento dos botoes
        const temSave = SaveManager.hasSave();
        const jogarY = temSave ? H/2 - 54 : H/2 - 24;
        const continuarY = H/2 + 6;
        const idiomaY = temSave ? H/2 + 66 : H/2 + 36;

        // Botao Jogar
        const btnJogar = makeBtn(this, W/2, jogarY, 260, 52, I18n.t('menu.play'), { ...CONFIG_BOTAO_MENU, depth: 2 });
        btnJogar.zone.on('pointerdown', () => {
            SoundManager.play('menu_click');
            SoundManager.resume();
            SoundManager.stopBgMusic();
            SaveManager.clear();
            this.time.delayedCall(120, () => this.scene.start('IntroScene'));
        });

        // Botao Continuar
        let btnContinuar = null;
        if (temSave) {
            btnContinuar = makeBtn(this, W/2, continuarY, 260, 52, I18n.t('menu.continue'), { ...CONFIG_BOTAO_MENU, depth: 2 });
            btnContinuar.zone.on('pointerdown', () => {
                SoundManager.play('menu_click');
                SoundManager.resume();
                SoundManager.stopBgMusic();
                this.time.delayedCall(120, () => this.scene.start('GameScene', { loadSave: true }));
            });
        }

        // Botoes de idioma
        const langPT = criarBotaoIdioma(this, W/2 - 58, idiomaY, '🇵🇹 PT', 2);
        const langEN = criarBotaoIdioma(this, W/2 + 58, idiomaY, '🇬🇧 EN', 2);

        // Creditos
        const creditos = this.add.text(W/2, H/2 + 182, I18n.t('menu.credits'), {
            fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#6b4820',
            fontStyle: 'italic', align: 'center', wordWrap: { width: 400 },
        }).setOrigin(0.5).setDepth(2);

        // Botao Mute
        const imagemMute = this.add.image(W - 36, 36, SoundManager.muted ? 'sound_off' : 'sound_on')
            .setScale(1.5).setDepth(5).setInteractive({ useHandCursor: true });
            
        imagemMute.on('pointerdown', () => {
            SoundManager.toggleMute();
            imagemMute.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
        });
        imagemMute.on('pointerover', () => imagemMute.setAlpha(0.7));
        imagemMute.on('pointerout',  () => imagemMute.setAlpha(1));

        // Atualiza textos do menu conforme idioma
        const atualizarTextos = () => {
            titulo.setText(I18n.t('menu.title'));
            subtitulo.setText(I18n.t('menu.subtitle'));
            btnJogar.setLabel(I18n.t('menu.play'));
            if (btnContinuar) {
                btnContinuar.setLabel(I18n.t('menu.continue'));
            }
            creditos.setText(I18n.t('menu.credits'));
            imagemMute.setTexture(SoundManager.muted ? 'sound_off' : 'sound_on');
            langPT.setActive(I18n.lang === 'pt');
            langEN.setActive(I18n.lang === 'en');
        };

        langPT.zone.on('pointerdown', () => { SoundManager.play('menu_click'); I18n.setLang('pt'); atualizarTextos(); });
        langEN.zone.on('pointerdown', () => { SoundManager.play('menu_click'); I18n.setLang('en'); atualizarTextos(); });

        atualizarTextos();

        this.add.text(16, H - 16, 'v0.3', { fontSize: '11px', fill: '#2a1a08' }).setDepth(2);

        // Animacao de pulso no titulo
        this.tweens.add({
            targets: titulo, alpha: 0.75,
            duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        SoundManager.resume();
        SoundManager.startBgMusic();
    }
}
