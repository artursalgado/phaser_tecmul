import { ITEM_DB } from "../systems/Inventory.js";

const HOTBAR_TAMANHO = 8;

// Componente da barra de atalhos rápidos (slots 1-8) no fundo do ecrã.
// Criado pela HUDScene; gere os seus próprios objetos Phaser e estado interno.
export default class Hotbar {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
    this.slotBgs = [];
    this.slotIcons = [];
    this.slotTexts = [];
    this.labelItemSelecionado = null;
  }

  criar(W, H) {
    const tamanhoSlot = 18 * 3;
    const espacamento = 6;
    const larguraTotal = HOTBAR_TAMANHO * tamanhoSlot + (HOTBAR_TAMANHO - 1) * espacamento;
    const hotbarX = (W - larguraTotal) / 2 + tamanhoSlot / 2;
    const hotbarY = H - 38;

    // Fundo do painel
    const larguraFundo = larguraTotal + 28;
    const g = this.scene.add.graphics().setDepth(0);

    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(W / 2 - larguraFundo / 2 + 3, hotbarY - 47, larguraFundo, 82, 8);
    g.fillStyle(0x160a00, 0.92);
    g.fillRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
    g.lineStyle(1.5, 0xc8901a, 0.72);
    g.strokeRoundedRect(W / 2 - larguraFundo / 2, hotbarY - 50, larguraFundo, 82, 8);
    g.lineStyle(1, 0x6b3a1a, 0.5);
    g.lineBetween(W / 2 - larguraFundo / 2 + 12, hotbarY - 30, W / 2 + larguraFundo / 2 - 12, hotbarY - 30);

    // Dica de teclas
    const I18n = this.scene.sys.registry.get?.("i18n");
    const textoDica = I18n?.lang === "en"
      ? "[E] use   ·   [Q] raft   ·   [I] inventory   ·   [M] map"
      : "[E] usar   ·   [Q] jangada   ·   [I] inventário   ·   [M] mapa";
    this.scene.add.text(W / 2, hotbarY - 40, textoDica, {
      fontSize: "9px", fill: "#c8a870", stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);

    // Slots
    for (let i = 0; i < HOTBAR_TAMANHO; i++) {
      const x = hotbarX + i * (tamanhoSlot + espacamento);

      const bg   = this.scene.add.image(x, hotbarY, "itemdisc_01").setScale(3).setDepth(1);
      const icon = this.scene.add.image(x, hotbarY, "wood").setScale(2.5).setVisible(false).setDepth(2);
      const text = this.scene.add.text(x + 18, hotbarY + 18, "", {
        fontSize: "11px", fill: "#ffffff", fontStyle: "bold",
      }).setOrigin(1, 1).setDepth(3);

      this.scene.add.text(x - 20, hotbarY - 22, String(i + 1), {
        fontSize: "9px", fill: "#c8a870", stroke: "#000000", strokeThickness: 2,
      }).setOrigin(0, 0).setDepth(3);

      this.slotBgs.push(bg);
      this.slotIcons.push(icon);
      this.slotTexts.push(text);
    }

    this.labelItemSelecionado = this.scene.add.text(W / 2, hotbarY - 64, "", {
      fontSize: "11px", fill: "#f5e0b0", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }

  atualizar() {
    if (!this.inventory) return;

    const slotAtivo = this.inventory.selectedSlot;

    for (let i = 0; i < HOTBAR_TAMANHO; i++) {
      const slot = this.inventory.slots[i];
      const icon = this.slotIcons[i];
      const text = this.slotTexts[i];
      const bg   = this.slotBgs[i];

      if (slot) {
        const def = ITEM_DB[slot.itemId];
        icon.setTexture(def ? def.icon : slot.itemId).setVisible(true);
        text.setText(slot.qty > 1 ? String(slot.qty) : "");
      } else {
        icon.setVisible(false);
        text.setText("");
      }

      bg.setTexture(i === slotAtivo ? "itemdisc_02" : "itemdisc_01");
    }

    const slotAtivoObj = this.inventory.getSelectedItem();
    if (slotAtivoObj) {
      const def = ITEM_DB[slotAtivoObj.itemId];
      this.labelItemSelecionado.setText(def ? def.name.toUpperCase() : slotAtivoObj.itemId.toUpperCase());
    } else {
      this.labelItemSelecionado.setText("");
    }
  }
}
