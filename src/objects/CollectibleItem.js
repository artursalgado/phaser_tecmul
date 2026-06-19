import { ITEM_DB } from "../systems/Inventory.js";

// Representa um item colecionável colocado no mapa.
// Suporta pooling: em vez de destroy() usa deactivar(), e reviver() reinicia o objeto.
export default class CollectibleItem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, itemId, quantity = 1) {
    const def = ITEM_DB[itemId];
    super(scene, x, y, def ? def.icon : itemId);

    this.itemId = itemId;
    this.quantity = quantity;
    this._floatTween = null;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setImmovable(true);
    this.setScale(1.2);
    this.setDepth(2);

    this._iniciarFloat();
  }

  _iniciarFloat() {
    this._floatTween?.stop();
    this._floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 3,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Devolve ao pool: esconde e desativa sem destruir o objeto
  deactivar() {
    this._floatTween?.stop();
    this._floatTween = null;
    this.setActive(false).setVisible(false);
    if (this.body) this.body.enable = false;
  }

  // Reutiliza um objeto do pool com novos dados
  reviver(x, y, itemId, quantity = 1) {
    const def = ITEM_DB[itemId];
    this.itemId = itemId;
    this.quantity = quantity;
    this.setTexture(def ? def.icon : itemId);
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    if (this.body) { this.body.enable = true; this.body.reset(x, y); }
    this._iniciarFloat();
  }
}
