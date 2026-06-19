import { burst } from "../systems/Particles.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    // Inicializa o sprite do inimigo com a textura base
    super(scene, x, y, textureKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Atributos de combate base (são depois redefinidos nas subclasses como Goblin ou Esqueleto)
    this.maxHealth = 40;
    this.health = 40;
    this.speed = 55;
    this.damage = 10;
    this.detectionRange = 200; // Raio em pixels para começar a perseguir o jogador
    this.attackRange = 22; // Distância mínima para iniciar a animação de ataque
    this.damageCooldown = 900; // Tempo em milissegundos entre ataques do inimigo
    this.lastDamageTime = 0; // Regista o tempo do último golpe dado

    // Atributos visuais e estilização de cada tipo de inimigo
    this.baseTint = null; // Cor de sobreposição se aplicável
    this.animPrefix = "enemy"; // Prefixo para carregar as animações corretas (ex: goblin_idle, skeleton_idle)
    this.damageTextColor = "#ff4444"; // Cor do texto de dano flutuante
    this.attackFlashTint = 0xffff00; // Cor amarela para piscar e dar aviso visual que vai atacar
    this.attackFlashDelay = 200; // Atraso entre o aviso visual de ataque e o dano real

    // Atributos de recuo (knockback) e atordoamento (stun)
    // Quando o jogador atinge um inimigo, ele é empurrado para trás e fica paralisado temporariamente.
    this.knockbackX = 200;
    this.knockbackY = -80;
    this.stunDuration = 350; // Tempo em ms que fica paralisado
    this.stunUntil = 0; // Tempo de jogo até ao qual o atordoamento dura

    // Definições da Inteligência Artificial de Patrulha
    this.patrolSpeedMult = 0.45; // Anda mais devagar na patrulha do que a perseguir
    this.patrolTimerMin = 1500; // Tempo mínimo em ms parado num ponto da patrulha
    this.patrolTimerMax = 3500; // Tempo máximo em ms parado num ponto da patrulha
    this.patrolRangeMin = 40; // Distância mínima do deslocamento aleatório
    this.patrolRangeMax = 100; // Distância máxima do deslocamento aleatório
    this.patrolTarget = { x, y }; // Ponto X/Y para onde o inimigo se está a deslocar
    this.patrolTimer = 0;

    // Configuração visual de morte
    this.deathColor = 0xcc3322;
    this.deathYOffset = -4;

    // Flags de controlo de estado da IA
    this.dead = false;
    this.attacking = false;

    // Configuração da barra de vida flutuante
    // Desenhada diretamente sobre o inimigo para sabermos a sua vida atual.
    this.hpBarWidth = 24;
    this.hpBarHeight = 4;
    this.hpBarYOffset = -15; // Posição acima da cabeça do sprite
    this.hpBarColor = 0xff3333; // Vermelho para a vida restante
    this.hpBgColor = 0x440000; // Vermelho escuro para o fundo da barra
  }

  // Cria as caixas gráficas da barra de vida e adiciona-as à cena.
  // É chamado no final do construtor dos filhos para usar as dimensões corretas.
  setupHpBar() {
    const hw = this.hpBarWidth;
    this.hpBg = this.scene.add
      .rectangle(
        this.x,
        this.y + this.hpBarYOffset,
        hw,
        this.hpBarHeight,
        this.hpBgColor,
      )
      .setDepth(10)
      .setVisible(false);
    this.hpBar = this.scene.add
      .rectangle(
        this.x - hw / 2,
        this.y + this.hpBarYOffset,
        hw,
        this.hpBarHeight,
        this.hpBarColor,
      )
      .setDepth(11)
      .setOrigin(0, 0.5)
      .setVisible(false);
  }

  // Atualiza a posição e o tamanho da barra de vida conforme o inimigo se move
  sincronizarBarraVida() {
    const percentagem = Math.max(0, this.health / this.maxHealth);
    const yBarra = this.y + this.hpBarYOffset;

    this.hpBg.setPosition(this.x, yBarra);
    this.hpBar.setPosition(this.x - this.hpBarWidth / 2, yBarra);
    this.hpBar.setDisplaySize(this.hpBarWidth * percentagem, this.hpBarHeight);

    // Só exibe a barra se o inimigo tiver perdido vida e ainda estiver vivo
    const visivel = percentagem < 1 && !this.dead;
    this.hpBg.setVisible(visivel);
    this.hpBar.setVisible(visivel);
  }

  // Executado a cada frame pelo ciclo de física do jogo
  update(player, time, delta) {
    if (this.dead) {
      return;
    }
    this.sincronizarBarraVida();

    // Se estiver atordoado pelo golpe do jogador, não se move
    if (time < this.stunUntil) {
      this.body.setVelocity(0);
      return;
    }

    // Se estiver a meio de uma animação de ataque, não faz mais nada
    if (this.attacking) {
      return;
    }

    // Ajusta atributos se for de noite (ciclo dia/noite da GameScene).
    // À noite, os monstros ficam enfurecidos: detetam o jogador mais longe e andam mais depressa.
    const isNight = this.scene.isNight;
    const velocidadeAtual = isNight ? this.speed * 1.25 : this.speed;
    const alcanceDetecao = isNight
      ? this.detectionRange * 1.5
      : this.detectionRange;

    // Calcula a distância até ao jogador usando vetor de diferença
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const prefixo = this.animPrefix;

    // Lógica de perseguição/ataque
    if (distancia < alcanceDetecao) {
      // Se estiver suficientemente perto do jogador para desferir um golpe
      if (distancia < this.attackRange) {
        this.body.setVelocity(0);
        if (time > this.lastDamageTime + this.damageCooldown) {
          this.lastDamageTime = time;
          this.realizarAtaque(player);
        } else {
          this.play(`${prefixo}_idle`, true);
        }
      } else {
        // Persegue o jogador calculando o vetor unitário de direção
        const nx = dx / distancia;
        const ny = dy / distancia;
        this.body.setVelocityX(nx * velocidadeAtual);
        this.body.setVelocityY(ny * velocidadeAtual);

        // Vira o sprite na direção do jogador
        this.setFlipX(dx < 0);
        this.play(`${prefixo}_walk`, true);
      }
    } else {
      // Se o jogador estiver longe, o inimigo patrulha a área aleatoriamente
      this.patrolTimer -= delta || 16;
      if (this.patrolTimer <= 0) {
        // Escolhe um novo ponto aleatório ao redor
        this.patrolTimer = Phaser.Math.Between(
          this.patrolTimerMin,
          this.patrolTimerMax,
        );
        const angulo = Math.random() * Math.PI * 2;
        const r = Phaser.Math.Between(this.patrolRangeMin, this.patrolRangeMax);
        this.patrolTarget = {
          x: this.x + Math.cos(angulo) * r,
          y: this.y + Math.sin(angulo) * r,
        };
      }

      // Move-se em direção ao ponto de patrulha
      const pdx = this.patrolTarget.x - this.x;
      const pdy = this.patrolTarget.y - this.y;
      const pd = Math.sqrt(pdx * pdx + pdy * pdy);

      if (pd > 8) {
        // Aplica velocidade de patrulha (mais baixa que a velocidade de perseguição)
        this.body.setVelocityX(
          (pdx / pd) * velocidadeAtual * this.patrolSpeedMult,
        );
        this.body.setVelocityY(
          (pdy / pd) * velocidadeAtual * this.patrolSpeedMult,
        );
        this.setFlipX(pdx < 0);
        this.play(`${prefixo}_walk`, true);
      } else {
        // Fica parado se chegou ao ponto de destino da patrulha
        this.body.setVelocity(0);
        this.play(`${prefixo}_idle`, true);
      }
    }
  }

  // Lógica para desferir um ataque ao jogador
  realizarAtaque(player) {
    this.attacking = true;
    this.body.setVelocity(0);
    const prefixo = this.animPrefix;
    this.play(`${prefixo}_attack`, true);

    // Pisca a amarelo para alertar o jogador e após um pequeno atraso causa dano real
    this.setTint(this.attackFlashTint);
    this.scene.time.delayedCall(this.attackFlashDelay, () => {
      if (!this.dead) {
        this.clearTint();
        if (this.baseTint) {
          this.setTint(this.baseTint);
        }

        // Dispara o evento de dano que a GameScene vai escutar para retirar vida ao jogador
        this.scene.events.emit("playerDamaged", this.damage);
      }
    });

    // Quando a animação de ataque acaba, volta ao estado normal
    this.once("animationcomplete", () => {
      this.attacking = false;
      if (!this.dead) {
        this.play(`${prefixo}_idle`, true);
      }
    });
  }

  // Chamado pelo Player.js quando atinge este inimigo
  takeDamage(amount, fromDir = "right") {
    if (this.dead) {
      return;
    }
    this.health -= amount;
    this.attacking = false; // Cancela ataques pendentes

    // Aplica o knockback (empurrão) na direção oposta ao ataque e inicia paralisia temporária (stun)
    const empurroX = fromDir === "right" ? this.knockbackX : -this.knockbackX;
    this.body.setVelocity(empurroX, this.knockbackY);
    this.stunUntil = this.scene.time.now + this.stunDuration;

    const prefixo = this.animPrefix;
    this.play(`${prefixo}_hurt`, true);
    this.setTint(0xff4444); // Pisca em vermelho para feedback visual

    // Remove a cor de dano vermelho após o fim do atordoamento
    this.scene.time.delayedCall(this.stunDuration, () => {
      if (!this.dead) {
        this.clearTint();
        if (this.baseTint) {
          this.setTint(this.baseTint);
        }
        this.play(`${prefixo}_walk`, true);
      }
    });

    // Cria texto dinâmico a flutuar com o valor do dano
    const textoDano = this.scene.add
      .text(this.x, this.y - 12, `-${amount}`, {
        fontSize: "14px",
        fill: this.damageTextColor,
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Tween para o texto flutuar para cima e desvanecer gradualmente
    this.scene.tweens.add({
      targets: textoDano,
      y: textoDano.y - 30,
      alpha: 0,
      duration: 700,
      onComplete: () => textoDano.destroy(),
    });

    // Atualiza a barra de vida e verifica se o inimigo morreu
    this.sincronizarBarraVida();
    if (this.health <= 0) {
      this.morrer();
    }
  }

  // Executa a animação de morte, cria efeitos de sangue/partículas e apaga o objeto
  morrer() {
    this.dead = true;
    this.hpBar?.destroy();
    this.hpBg?.destroy();
    this.body.setVelocity(0);
    this.body.enable = false; // Desativa colisões físicas
    this.clearTint();
    this.play(`${this.animPrefix}_death`, true);

    // Cria a explosão de partículas vermelhas (burst de sangue)
    burst(this.scene, this.x, this.y + this.deathYOffset, {
      color: this.deathColor,
      count: 10,
      speed: 110,
      lifespan: 500,
      scale: 0.7,
    });

    // Espera a animação de morte terminar e desativa (pool) em vez de destruir
    this.once("animationcomplete", () => {
      this.scene.events.emit("enemyDied", this.x, this.y);
      this.setActive(false).setVisible(false);
    });
  }

  // Reinicia o inimigo para reutilização via pool
  resetar(x, y) {
    this.health = this.maxHealth;
    this.dead = false;
    this.attacking = false;
    this.stunUntil = 0;
    this.lastDamageTime = 0;
    this.patrolTarget = { x, y };
    this.patrolTimer = 0;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.clearTint();
    if (this.baseTint) this.setTint(this.baseTint);
    if (this.body) { this.body.enable = true; this.body.reset(x, y); }
    this.play(`${this.animPrefix}_idle`, true);
  }
}
