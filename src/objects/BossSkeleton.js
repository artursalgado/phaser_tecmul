import Skeleton from "./Skeleton.js";
import CollectibleItem from "./CollectibleItem.js";
import { burst } from "../systems/Particles.js";

export default class BossSkeleton extends Skeleton {
  constructor(scene, x, y) {
    // Inicializa o Boss reutilizando o sprite e animações do Esqueleto normal
    super(scene, x, y);

    // Atributos especiais do Boss:
    // Vida muito alta (120 HP), dano pesado (15), escala de tamanho aumentada e cor de fogo
    this.maxHealth = 120;
    this.health = 120;
    this.damage = 15;
    this.speed = 75;
    this.detectionRange = 320; // Deteta o jogador de muito longe
    this.setScale(1.05);

    this.setTint(0xff6622);
    this.bossTint = 0xff6622;

    // Cria a barra de vida gigante na parte de cima do ecrã
    this.criarBarraVidaBoss(scene);
    this.roared = false;

    // Controlo de fases e ataques especiais
    this.fase2Ativa = false;
    this.chargeTimer = 0;       // Conta regressiva para a próxima carga
    this.chargeCooldown = 8000; // ms entre cargas
    this.emCharge = false;      // A executar carga agora?
    this.spinTimer = 0;
    this.spinCooldown = 12000;
    this.stunUntil = 0;         // Tempo até o qual o boss fica stunado após carga falhada
  }

  // Cria os retângulos de UI que mostram a barra de vida do Boss fixada no topo do ecrã
  criarBarraVidaBoss(scene) {
    const W = scene.scale.width;

    // Fundo vermelho escuro com borda branca, não acompanha a câmara de jogo (ScrollFactor a 0)
    this.bossBarBg = scene.add
      .rectangle(W / 2, 22, 200, 14, 0x330000)
      .setScrollFactor(0)
      .setDepth(200)
      .setStrokeStyle(2, 0xffffff, 0.6);

    // Barra vermelha de vida que é redimensionada dinamicamente
    this.bossBar = scene.add
      .rectangle(W / 2 - 98, 22, 196, 10, 0xff3300)
      .setScrollFactor(0)
      .setDepth(201)
      .setOrigin(0, 0.5);

    // Texto identificativo do Boss
    this.bossLabel = scene.add
      .text(W / 2, 10, "💀 BOSS SKELETON", {
        fontSize: "9px",
        fill: "#ffaa66",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
  }

  // Atualiza a largura do preenchimento da barra de vida com base na percentagem restante
  atualizarBarraVidaBoss() {
    const percentagem = Math.max(0, this.health / this.maxHealth);
    this.bossBar.setDisplaySize(196 * percentagem, 10);
  }

  // Efeito de introdução dramática ao encontrar o Boss (treme o ecrã e aproxima a câmara)
  rugir() {
    if (this.roared) {
      return;
    }
    this.roared = true;
    const scene = this.scene;

    // Treme a câmara principal por 300ms
    scene.cameras.main.shake(300, 0.005);

    // Faz zoom in rápido e zoom out de volta para dar sensação de impacto
    const cam = scene.cameras.main;
    scene.tweens.add({
      targets: cam,
      zoom: cam.zoom * 1.1,
      duration: 250,
      ease: "Sine.easeOut",
      onComplete: () => {
        scene.tweens.add({
          targets: cam,
          zoom: cam.zoom / 1.1,
          duration: 400,
          ease: "Sine.easeIn",
        });
      },
    });

    // Mensagem de alerta vermelha flutuante na tela
    const textoAviso = scene.add
      .text(scene.scale.width / 2, 50, "💀 BOSS APARECEU!", {
        fontSize: "18px",
        fill: "#ff4400",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202);

    scene.tweens.add({
      targets: textoAviso,
      alpha: 0,
      delay: 1800,
      duration: 800,
      onComplete: () => textoAviso.destroy(),
    });
  }

  update(player, time, delta) {
    if (this.dead) return;

    this.atualizarBarraVidaBoss();

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < this.detectionRange) {
      this.rugir();
    }

    // Ativa a fase 2 ao chegar a 50% de vida pela primeira vez
    if (!this.fase2Ativa && this.health <= this.maxHealth * 0.5) {
      this.ativarFase2();
    }

    // Durante stun não faz nada
    if (time < this.stunUntil) {
      this.body.setVelocity(0);
      return;
    }

    // Ataque de carga (fase 1 e 2)
    if (!this.emCharge && this.roared) {
      this.chargeTimer -= delta;
      if (this.chargeTimer <= 0) {
        this.chargeTimer = this.chargeCooldown;
        this.iniciarCarga(player, time);
        return;
      }
    }

    // Ataque de spin (só fase 2)
    if (this.fase2Ativa && !this.emCharge) {
      this.spinTimer -= delta;
      if (this.spinTimer <= 0) {
        this.spinTimer = this.spinCooldown;
        this.atacarSpin(player);
      }
    }

    if (!this.emCharge) {
      super.update(player, time, delta);
    }
  }

  iniciarCarga(player, time) {
    // Flash vermelho de aviso por 0.8s antes de carregar
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.setTint(0xff0000);
    this.body.setVelocity(0);

    this.scene.time.delayedCall(800, () => {
      if (this.dead) return;
      this.emCharge = true;
      this.clearTint();
      this.setTint(this.bossTint);

      // Velocidade de carga: 3× a velocidade normal
      const vx = (dx / dist) * this.speed * 3;
      const vy = (dy / dist) * this.speed * 3;
      this.body.setVelocity(vx, vy);

      // Após 1s verifica se acertou (colisão tratada pela GameScene) e para
      this.scene.time.delayedCall(1000, () => {
        if (this.dead) return;
        this.emCharge = false;
        this.body.setVelocity(0);

        // Stun de 1.5s por falhar a carga
        this.stunUntil = this.scene.time.now + 1500;
        this.setTint(0xaaaaff); // Azul de atordoado
        this.scene.time.delayedCall(1500, () => {
          if (!this.dead) this.setTint(this.bossTint);
        });
      });
    });
  }

  atacarSpin(player) {
    const raio = 60;
    const dano = 20;

    // Círculo visual de expansão
    const circulo = this.scene.add.circle(this.x, this.y, 4, 0xff4400, 0.5).setDepth(10);
    this.scene.tweens.add({
      targets: circulo,
      scaleX: raio / 4,
      scaleY: raio / 4,
      alpha: 0,
      duration: 400,
      onComplete: () => circulo.destroy(),
    });

    // Dano ao jogador se estiver no raio
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.sqrt(dx * dx + dy * dy) <= raio) {
      player.sofrerDano?.(dano);
    }
  }

  ativarFase2() {
    this.fase2Ativa = true;
    this.speed = 100;
    this.bossTint = 0xff2200;
    this.setTint(this.bossTint);
    this.chargeCooldown = 6000;

    // Flash branco e tremor de transição
    this.scene.cameras.main.shake(600, 0.01);
    this.setTint(0xffffff);
    this.scene.time.delayedCall(300, () => {
      if (!this.dead) this.setTint(this.bossTint);
    });

    // Aviso no ecrã
    const aviso = this.scene.add
      .text(this.scene.scale.width / 2, 70, "💀 BOSS ENFURECEU!", {
        fontSize: "22px",
        fill: "#ff2200",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202);

    this.scene.tweens.add({
      targets: aviso,
      alpha: 0,
      delay: 2000,
      duration: 600,
      onComplete: () => aviso.destroy(),
    });
  }

  takeDamage(amount, fromDir = "right") {
    if (this.dead) {
      return;
    }

    // Aplica o dano normal do esqueleto
    super.takeDamage(amount, fromDir);

    // Redefine a cor laranja do boss após a animação de piscar vermelho de dano
    if (!this.dead) {
      this.scene.time.delayedCall(300, () => {
        if (!this.dead) {
          this.setTint(this.bossTint);
        }
      });
    }
    this.atualizarBarraVidaBoss();
  }

  // Sobrescreve a morte para tremer o ecrã intensamente, gerar mais partículas e largar o item da quest
  morrer() {
    this.dead = true;
    this.hpBar?.destroy();
    this.hpBg?.destroy();
    this.body.setVelocity(0);
    this.body.enable = false;
    this.clearTint();
    this.play("skeleton_death", true);

    // Slow-mo por 1s e tremor forte de câmara
    const sc = this.scene;
    if (sc) {
      sc.time.timeScale = 0.3;
      sc.time.delayedCall(1000, () => { if (sc.time) sc.time.timeScale = 1; });
      sc.cameras.main.shake(500, 0.012);
    }

    // Gera explosões massivas de sangue laranja e fagulhas amarelas
    burst(this.scene, this.x, this.y - 20, {
      color: 0xff6622,
      count: 20,
      speed: 180,
      lifespan: 700,
      scale: 1.0,
      gravity: 200,
    });
    burst(this.scene, this.x, this.y - 20, {
      color: 0xffdd44,
      count: 10,
      speed: 100,
      lifespan: 500,
      scale: 0.5,
    });

    // Limpa a UI do boss do topo da tela
    this.bossBar?.destroy();
    this.bossBarBg?.destroy();
    this.bossLabel?.destroy();

    // Quando a animação de morte acaba, faz cair a vela da jangada (sail)
    this.once("animationcomplete", () => {
      const vela = new CollectibleItem(this.scene, this.x, this.y, "sail", 1);
      this.scene.pickups.add(vela);

      // Avisa o jogador com texto no chão onde caiu a vela
      const textoQueda = this.scene.add
        .text(this.x, this.y - 40, "⚓ VELA CAIU!", {
          fontSize: "14px",
          fill: "#ffdd66",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(30);

      this.scene.tweens.add({
        targets: textoQueda,
        y: textoQueda.y - 40,
        alpha: 0,
        duration: 1500,
        onComplete: () => textoQueda.destroy(),
      });

      // Avisa a GameScene para parar spawn de monstros por agora ou registar morte
      this.scene.events.emit("bossDefeated");
      this.scene.events.emit("enemyDied", this.x, this.y);
      this.destroy();
    });
  }
}
