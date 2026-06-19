import Enemy from "./Enemy.js";

export default class Skeleton extends Enemy {
  constructor(scene, x, y) {
    // Inicializa o sprite base com a textura de repouso do esqueleto
    super(scene, x, y, "skeleton_idle");

    // Configuração de atributos específicos do esqueleto.
    // O esqueleto é mais frágil que o goblin, mas move-se muito mais rápido e ataca com maior frequência.
    this.maxHealth = 30;
    this.health = 30;
    this.speed = 90; // Velocidade de perseguição rápida
    this.damage = 8;
    this.setScale(0.75);
    this.setTint(0xaaddff); // Tom azul-claro fantasmagórico
    this.baseTint = 0xaaddff;

    // Atributos de comportamento e combate
    this.detectionRange = 240; // Deteta o jogador a uma distância maior
    this.damageCooldown = 750; // Tempo de recarga de ataque menor
    this.animPrefix = "skeleton";

    // Origem de desenho nos pés para efeitos de Y-sorting
    this.setOrigin(0.5, 39 / 64);

    // Hitbox física adaptada ao corpo do esqueleto
    this.body.setSize(18, 16);
    this.body.setOffset(39, 23);
    this.body.setCollideWorldBounds(true);

    // Parametrização customizada da barra de vida (barra azulada em vez de vermelha)
    this.hpBarWidth = 22;
    this.hpBarYOffset = -13;
    this.hpBarColor = 0x4499ff;
    this.hpBgColor = 0x000033;
    this.deathColor = 0xaaddff; // Partículas azuis ao morrer
    this.deathYOffset = -7;
    this.damageTextColor = "#4499ff";
    this.attackFlashTint = 0xffffff;
    this.attackFlashDelay = 160;

    // Efeitos de knockback (esqueletos voam mais longe ao serem atingidos porque são leves)
    this.knockbackX = 250;
    this.knockbackY = -100;
    this.stunDuration = 280; // Recupera ligeiramente mais rápido do atordoamento

    // Ajustes da patrulha aleatória do esqueleto
    this.patrolSpeedMult = 0.5;
    this.patrolTimerMin = 1000;
    this.patrolTimerMax = 2500;
    this.patrolRangeMin = 50;
    this.patrolRangeMax = 120;

    // Cria a barra de vida e as animações
    this.setupHpBar();
    this.criarAnimacoes(scene);
    this.play("skeleton_idle", true);
  }

  // Regista as animações do Esqueleto no Phaser
  criarAnimacoes(scene) {
    const make = (key, texture, nFrames, rate, repeat = -1) => {
      if (scene.anims.exists(key)) {
        return;
      }
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, {
          start: 0,
          end: nFrames - 1,
        }),
        frameRate: rate,
        repeat,
      });
    };

    // Carrega frames das spritesheets correspondentes carregadas no PreloadScene
    make("skeleton_idle", "skeleton_idle", 6, 6);
    make("skeleton_walk", "skeleton_walk", 8, 12);
    make("skeleton_hurt", "skeleton_hurt", 7, 14, 0); // Toca uma vez
    make("skeleton_death", "skeleton_death", 10, 8, 0); // Toca uma vez
    make("skeleton_attack", "skeleton_attack", 7, 12, 0); // Toca uma vez
  }
}
