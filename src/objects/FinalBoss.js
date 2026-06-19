import BossSkeleton from "./BossSkeleton.js";

// Criatura final que surge apenas quando a jangada está completa.
// É um esqueleto muito maior, mais forte e com cor roxa escura.
export default class FinalBoss extends BossSkeleton {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.maxHealth = 350;
    this.health    = 350;
    this.damage    = 25;
    this.speed     = 55;
    this.detectionRange = 500;

    this.setScale(2.2);
    this.clearTint();
    this.setTint(0x6600cc);
    this.bossTint = 0x6600cc;

    // Atualiza a barra de vida que o BossSkeleton já criou
    this.bossBar.setFillStyle(0x9900ff);
    this.bossLabel.setText("☠ CRIATURA ANTIGA");
    this.bossLabel.setStyle({ fill: "#cc88ff", fontStyle: "bold", fontSize: "9px", stroke: "#000000", strokeThickness: 2 });
  }

  // Substitui o rugido do boss normal por uma mensagem diferente
  rugir() {
    if (this.roared) return;
    this.roared = true;
    const scene = this.scene;
    if (!scene) return;

    scene.cameras.main.shake(600, 0.012);

    const cam = scene.cameras.main;
    scene.tweens.add({
      targets: cam,
      zoom: cam.zoom * 1.15,
      duration: 300,
      ease: "Sine.easeOut",
      onComplete: () => {
        scene.tweens.add({ targets: cam, zoom: cam.zoom / 1.15, duration: 500, ease: "Sine.easeIn" });
      },
    });

    // Flash escuro roxo no ecrã inteiro
    scene.cameras.main.flash(800, 40, 0, 80);

    // Mensagem principal no centro do ecrã
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    const sombra = scene.add.rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(300);

    const linha1 = scene.add.text(cx, cy - 30, "Despertaste uma criatura diferente...", {
      fontSize: "20px", fill: "#cc88ff", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0);

    const linha2 = scene.add.text(cx, cy + 10, "Derrota-a para escapar da ilha!", {
      fontSize: "13px", fill: "#ffffff",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0);

    scene.tweens.add({ targets: [linha1, linha2], alpha: 1, duration: 600, ease: "Sine.easeIn" });
    scene.tweens.add({
      targets: [sombra, linha1, linha2], alpha: 0, duration: 700,
      delay: 2800, ease: "Sine.easeOut",
      onComplete: () => { sombra.destroy(); linha1.destroy(); linha2.destroy(); },
    });
  }
}
