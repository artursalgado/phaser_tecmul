// Cena de overlay para controlos touch (mobile).
// Só é ativa se o dispositivo tiver ecrã táctil.
// Escreve em gameScene.touchInput que o Player.js lê junto com o teclado.
export default class TouchScene extends Phaser.Scene {
  constructor() {
    super({ key: "TouchScene", active: false });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const gameScene = this.scene.get("GameScene");
    if (!gameScene) return;

    // Estado partilhado com o Player
    gameScene.touchInput = { dx: 0, dy: 0, sprint: false, justAttack: false };
    this.input$ = gameScene.touchInput;

    // Joystick (canto inferior esquerdo)
    const jx = 110, jy = H - 110;
    const RAIO_BASE = 60, RAIO_THUMB = 22;

    const base = this.add.circle(jx, jy, RAIO_BASE, 0xffffff, 0.12).setDepth(50).setScrollFactor(0);
    this.add.circle(jx, jy, RAIO_BASE, 0x000000, 0).setDepth(50).setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff, 0.25);
    const thumb = this.add.circle(jx, jy, RAIO_THUMB, 0xffffff, 0.35).setDepth(51).setScrollFactor(0);

    let joystickPtrId = null;

    this.input.on("pointerdown", (ptr) => {
      // Só captura toques na zona do joystick
      if (Phaser.Math.Distance.Between(ptr.x, ptr.y, jx, jy) < RAIO_BASE + 20 && joystickPtrId === null) {
        joystickPtrId = ptr.id;
      }
    });

    this.input.on("pointermove", (ptr) => {
      if (ptr.id !== joystickPtrId) return;
      const dx = ptr.x - jx;
      const dy = ptr.y - jy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, RAIO_BASE);
      const nx = dist > 0 ? dx / dist : 0;
      const ny = dist > 0 ? dy / dist : 0;
      thumb.setPosition(jx + nx * clamped, jy + ny * clamped);
      this.input$.dx = dist > 8 ? nx : 0;
      this.input$.dy = dist > 8 ? ny : 0;
    });

    this.input.on("pointerup", (ptr) => {
      if (ptr.id !== joystickPtrId) return;
      joystickPtrId = null;
      thumb.setPosition(jx, jy);
      this.input$.dx = 0;
      this.input$.dy = 0;
    });

    // Botão de ataque (canto inferior direito)
    const ax = W - 80, ay = H - 130;
    this.criarBotaoTouch(ax, ay, "⚔", 0xff6644, () => { this.input$.justAttack = true; });

    // Botão de sprint (ao lado do joystick)
    const sx = jx + 90, sy = jy;
    const btnSprint = this.add.circle(sx, sy, 28, 0xffdd44, 0.2).setDepth(50).setScrollFactor(0);
    this.add.text(sx, sy, "⚡", { fontSize: "18px" }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    btnSprint.setInteractive();
    btnSprint.on("pointerdown", () => { this.input$.sprint = true; btnSprint.setAlpha(0.5); });
    btnSprint.on("pointerup",   () => { this.input$.sprint = false; btnSprint.setAlpha(0.2); });

    // Botão de inventário (canto superior direito)
    const ix = W - 44, iy = 44;
    this.criarBotaoTouch(ix, iy, "🎒", 0x8866cc, () => {
      gameScene.events.emit("openInventory");
    }, 22);

    // Botão de ação E (usar item / entregar na jangada)
    const ex = W - 80, ey = H - 220;
    this.criarBotaoTouch(ex, ey, "E", 0x44aa88, () => {
      gameScene.events.emit("touchAction");
    });
  }

  criarBotaoTouch(x, y, label, cor, onClick, raio = 32) {
    const circ = this.add.circle(x, y, raio, cor, 0.2).setDepth(50).setScrollFactor(0);
    this.add.circle(x, y, raio, 0x000000, 0).setDepth(50).setScrollFactor(0).setStrokeStyle(2, cor, 0.5);
    this.add.text(x, y, label, { fontSize: raio > 25 ? "18px" : "13px" }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    circ.setInteractive(new Phaser.Geom.Circle(0, 0, raio), Phaser.Geom.Circle.Contains);
    circ.on("pointerdown", () => { circ.setAlpha(0.55); onClick(); });
    circ.on("pointerup",   () => { circ.setAlpha(0.2); });
    // justAttack precisa de ser limpo após leitura
    return circ;
  }

  update() {
    // Limpa o justAttack após um frame (o Player já o leu)
    if (this.input$?.justAttack) {
      this.input$.justAttack = false;
    }
  }
}
