import I18n from "../systems/I18n.js";
import SoundManager from "../systems/SoundManager.js";
import makeBtn from "../utils/makeBtn.js";

const W = 960, H = 640;
const PW = 440, PH = 400;
const PX = W / 2 - PW / 2;
const PY = H / 2 - PH / 2;

// Persiste as definições no localStorage para sobreviverem entre sessões
const STORAGE_KEY = "stranded_settings";

function carregarDefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function guardarDefs(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
}

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  // Aplica as definições guardadas ao arrancar o jogo (chamar de BootScene ou MenuScene)
  static aplicar() {
    const defs = carregarDefs();
    if (typeof defs.volume === "number") {
      SoundManager.volume = defs.volume;
      if (SoundManager.musicaFundoGain) {
        SoundManager.musicaFundoGain.gain.value = defs.muted ? 0 : 0.07 * defs.volume;
      }
    }
    if (defs.muted !== undefined) SoundManager.muted = defs.muted;
    if (defs.lang) I18n.setLang(defs.lang);
    if (defs.highContrast) document.body.classList.add("high-contrast");
  }

  create() {
    this.defs = carregarDefs();
    if (this.defs.volume === undefined) this.defs.volume = 0.3;

    // Fundo escuro
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
      .setInteractive()
      .setDepth(0);

    // Painel
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(PX + 4, PY + 4, PW, PH, 8);
    g.fillStyle(0x160a00, 0.96);
    g.fillRoundedRect(PX, PY, PW, PH, 8);
    g.lineStyle(1.5, 0xc8901a, 0.8);
    g.strokeRoundedRect(PX, PY, PW, PH, 8);
    g.fillStyle(0x3d1a00, 1);
    g.fillRoundedRect(PX, PY, PW, 36, { tl: 8, tr: 8, bl: 0, br: 0 });

    const titulo = I18n.lang === "en" ? "SETTINGS" : "DEFINIÇÕES";
    this.add.text(W / 2, PY + 18, titulo, {
      fontSize: "13px", fill: "#f5c070", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(2);

    let cy = PY + 60;
    const SEC = (label) => {
      this.add.text(PX + 20, cy, label, { fontSize: "10px", fill: "#c8901a", fontStyle: "bold" }).setDepth(2);
      cy += 20;
    };

    // — Áudio —
    SEC(I18n.lang === "en" ? "AUDIO" : "ÁUDIO");
    cy = this.criarSliderVolume(cy);
    cy = this.criarToggleMute(cy);
    cy += 16;

    // — Idioma —
    SEC(I18n.lang === "en" ? "LANGUAGE" : "IDIOMA");
    cy = this.criarSeletorIdioma(cy);
    cy += 16;

    // — Acessibilidade —
    SEC(I18n.lang === "en" ? "ACCESSIBILITY" : "ACESSIBILIDADE");
    cy = this.criarToggleContraste(cy);

    // Botão Fechar
    const btnFechar = makeBtn(this, W / 2, PY + PH - 34, 200, 34,
      I18n.lang === "en" ? "Close" : "Fechar", { depth: 2, fontSize: "12px" });
    btnFechar.zone.on("pointerdown", () => {
      SoundManager.play("menu_click");
      guardarDefs(this.defs);
      this.scene.stop("SettingsScene");
    });

    this.input.keyboard.once("keydown-ESC", () => {
      guardarDefs(this.defs);
      this.scene.stop("SettingsScene");
    });
  }

  criarSliderVolume(cy) {
    const label = I18n.lang === "en" ? "Volume" : "Volume";
    this.add.text(PX + 20, cy, label, { fontSize: "11px", fill: "#ddccaa" }).setDepth(2);

    const sx = PX + 140, sy = cy + 7, sw = 200;
    const trilho = this.add.rectangle(sx + sw / 2, sy, sw, 4, 0x6b4820).setDepth(2);
    const fill = this.add.rectangle(sx, sy, sw * this.defs.volume, 4, 0xc8901a).setOrigin(0, 0.5).setDepth(3);
    const thumb = this.add.circle(sx + sw * this.defs.volume, sy, 8, 0xffcc66).setDepth(4);

    const zona = this.add.zone(sx + sw / 2, sy, sw + 20, 24).setInteractive().setDepth(5);
    const atualizar = (ptr) => {
      const v = Phaser.Math.Clamp((ptr.x - sx) / sw, 0, 1);
      this.defs.volume = v;
      SoundManager.volume = v;
      fill.setDisplaySize(sw * v, 4);
      thumb.setPosition(sx + sw * v, sy);
    };
    zona.on("pointerdown", atualizar);
    zona.on("pointermove", (ptr) => { if (ptr.isDown) atualizar(ptr); });

    this.add.text(PX + 350, cy, `${Math.round(this.defs.volume * 100)}%`, {
      fontSize: "10px", fill: "#aaaaaa",
    }).setDepth(2).setName("vol_pct");

    return cy + 28;
  }

  criarToggleMute(cy) {
    const label = I18n.lang === "en" ? "Mute" : "Silenciar";
    this.add.text(PX + 20, cy, label, { fontSize: "11px", fill: "#ddccaa" }).setDepth(2);

    const btn = this.add.rectangle(PX + 150, cy + 7, 44, 20, SoundManager.muted ? 0x884444 : 0x448844, 1)
      .setDepth(3).setInteractive({ useHandCursor: true });
    const dot = this.add.circle(SoundManager.muted ? PX + 150 + 11 : PX + 150 - 11, cy + 7, 7, 0xffffff).setDepth(4);

    btn.on("pointerdown", () => {
      SoundManager.toggleMute();
      this.defs.muted = SoundManager.muted;
      btn.setFillStyle(SoundManager.muted ? 0x884444 : 0x448844);
      dot.setPosition(SoundManager.muted ? PX + 150 + 11 : PX + 150 - 11, cy + 7);
    });

    return cy + 28;
  }

  criarSeletorIdioma(cy) {
    ["PT", "EN"].forEach((lang, i) => {
      const lx = PX + 60 + i * 100;
      const ativo = I18n.lang === lang.toLowerCase();
      const r = this.add.rectangle(lx, cy + 10, 80, 26, ativo ? 0x6b3810 : 0x2a1505)
        .setDepth(2).setInteractive({ useHandCursor: true });
      this.add.text(lx, cy + 10, lang, {
        fontSize: "12px", fill: ativo ? "#ffffff" : "#c8a070", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(3);

      r.on("pointerdown", () => {
        SoundManager.play("menu_click");
        I18n.setLang(lang.toLowerCase());
        this.defs.lang = lang.toLowerCase();
        guardarDefs(this.defs);
        this.scene.restart();
      });
    });
    return cy + 36;
  }

  criarToggleContraste(cy) {
    const label = I18n.lang === "en" ? "High Contrast" : "Alto Contraste";
    this.add.text(PX + 20, cy, label, { fontSize: "11px", fill: "#ddccaa" }).setDepth(2);

    const ativo = !!this.defs.highContrast;
    const btn = this.add.rectangle(PX + 150, cy + 7, 44, 20, ativo ? 0x448844 : 0x884444, 1)
      .setDepth(3).setInteractive({ useHandCursor: true });
    const dot = this.add.circle(ativo ? PX + 150 + 11 : PX + 150 - 11, cy + 7, 7, 0xffffff).setDepth(4);

    btn.on("pointerdown", () => {
      this.defs.highContrast = !this.defs.highContrast;
      btn.setFillStyle(this.defs.highContrast ? 0x448844 : 0x884444);
      dot.setPosition(this.defs.highContrast ? PX + 150 + 11 : PX + 150 - 11, cy + 7);
      document.body.classList.toggle("high-contrast", this.defs.highContrast);
    });

    return cy + 28;
  }
}
