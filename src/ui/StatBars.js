// Componente das 4 barras de status vitais (Vida, Fome, Sede, Energia) no canto superior esquerdo.
export default class StatBars {
  constructor(scene, stats) {
    this.scene = scene;
    this.stats = stats;
    this.layout = null;
    this.grafico = null;
    this.healthTxt = null;
    this.hungerTxt = null;
    this.thirstTxt = null;
    this.energyTxt = null;
  }

  criar() {
    this.layout = {
      barX: 28, barW: 112, barH: 8, textX: 144, iconX: 16,
      rows: [16, 35, 54, 73],
    };
    const L = this.layout;

    const fundo = this.scene.add.graphics().setDepth(1);
    fundo.fillStyle(0x000000, 0.35);
    fundo.fillRoundedRect(6, 6, 178, 90, 6);
    fundo.fillStyle(0x160a00, 0.92);
    fundo.fillRoundedRect(6, 6, 178, 90, 6);
    fundo.lineStyle(1.5, 0xc8901a, 0.72);
    fundo.strokeRoundedRect(6, 6, 178, 90, 6);

    L.rows.forEach((y) => {
      fundo.fillStyle(0x070300, 0.9);
      fundo.fillRoundedRect(L.barX, y, L.barW, L.barH, 4);
    });

    this.grafico = this.scene.add.graphics().setDepth(2);

    [
      { key: "status_icon_vida",    y: L.rows[0] },
      { key: "status_icon_fome",    y: L.rows[1] },
      { key: "status_icon_sede",    y: L.rows[2] },
      { key: "status_icon_energia", y: L.rows[3] },
    ].forEach(({ key, y }) => {
      this.scene.add.image(L.iconX, y + L.barH / 2, key)
        .setDisplaySize(12, 12).setOrigin(0.5).setDepth(3);
    });

    this.healthTxt = this.scene.add.text(L.textX, L.rows[0] - 1, "", { fontSize: "9px", fill: "#ffaaaa" }).setDepth(3);
    this.hungerTxt = this.scene.add.text(L.textX, L.rows[1] - 1, "", { fontSize: "9px", fill: "#ffddaa" }).setDepth(3);
    this.thirstTxt = this.scene.add.text(L.textX, L.rows[2] - 1, "", { fontSize: "9px", fill: "#aaddff" }).setDepth(3);
    this.energyTxt = this.scene.add.text(L.textX, L.rows[3] - 1, "", { fontSize: "9px", fill: "#ccffaa" }).setDepth(3);
  }

  atualizar() {
    if (!this.stats) return;
    const L = this.layout;
    const g = this.grafico;
    g.clear();

    const barras = [
      { cor: 0xff3b30, pct: this.stats.healthPercentagem,  row: L.rows[0] },
      { cor: 0xff9500, pct: this.stats.hungerPercentagem,  row: L.rows[1] },
      { cor: 0x34aadc, pct: this.stats.thirstPercentagem,  row: L.rows[2] },
      { cor: 0xffcc00, pct: this.stats.energyPercentagem,  row: L.rows[3] },
    ];

    barras.forEach(({ cor, pct, row }) => {
      g.fillStyle(cor, 1);
      g.fillRoundedRect(L.barX + 1, row + 1, (L.barW - 2) * pct, L.barH - 2, 3);
    });

    this.healthTxt.setText(`${Math.ceil(this.stats.health)}/100`);
    this.hungerTxt.setText(`${Math.ceil(this.stats.hunger)}/100`);
    this.thirstTxt.setText(`${Math.ceil(this.stats.thirst)}/100`);
    this.energyTxt.setText(`${Math.ceil(this.stats.energy)}/100`);
  }
}
