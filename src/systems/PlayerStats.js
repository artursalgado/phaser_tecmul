// Estatísticas de sobrevivência e atributos vitais do jogador (vida, fome, sede e energia).
// Estende o EventEmitter para emitir eventos de alteração ou morte para a GameScene e HUDScene.
export default class PlayerStats extends Phaser.Events.EventEmitter {
  constructor() {
    super();

    // Valores máximos admissíveis de cada atributo
    this.maxHealth = 100;
    this.maxHunger = 100;
    this.maxThirst = 100;
    this.maxEnergy = 100;

    // Valores iniciais padrão ao começar uma nova partida
    this.health = 100;
    this.hunger = 100;
    this.thirst = 100;
    this.energy = 100;

    // Flag indicando se o jogador está morto
    this.dead = false;

    // Velocidade que as barras de sobrevivência descem por segundo
    this.hungerDecay = 0.17; // Fome desce cerca de 10 unidades por minuto
    this.thirstDecay = 0.25; // Sede desce mais rápido que a fome
    this.energyDecay = 0.08; // Energia decai lentamente por estar acordado

    // Quantidade de dano sofrido por segundo quando a fome ou a sede chegam a zero
    this.starveDamage = 1.0;
    this.dehydrateDamage = 1.5; // Desidratação é mais perigosa que a inanição

    // Valores anteriores (ceil) para evitar redesenhar o HUD a 60fps sem mudanças visíveis
    this._prevH = 100;
    this._prevF = 100;
    this._prevT = 100;
    this._prevE = 100;
  }

  // Atualiza os valores vitais a cada frame do jogo
  update(delta) {
    if (this.dead) {
      return;
    }

    // Converte delta (milissegundos do frame) em fração de segundos
    const segundos = delta / 1000;

    // Aplica o decaimento com base no tempo decorrido no frame
    this.hunger = Math.max(0, this.hunger - this.hungerDecay * segundos);
    this.thirst = Math.max(0, this.thirst - this.thirstDecay * segundos);
    this.energy = Math.max(0, this.energy - this.energyDecay * segundos);

    // Se fome ou sede chegar a zero, retira vida continuamente ao jogador
    if (this.hunger <= 0) {
      this.takeDamage(this.starveDamage * segundos);
    }
    if (this.thirst <= 0) {
      this.takeDamage(this.dehydrateDamage * segundos);
    }

    // Só emite se algum valor visível (arredondado para cima) mudou — evita 60 redesenhos/s desnecessários
    const ch = Math.ceil(this.health);
    const cf = Math.ceil(this.hunger);
    const ct = Math.ceil(this.thirst);
    const ce = Math.ceil(this.energy);
    if (ch !== this._prevH || cf !== this._prevF || ct !== this._prevT || ce !== this._prevE) {
      this._prevH = ch;
      this._prevF = cf;
      this._prevT = ct;
      this._prevE = ce;
      this.emit("changed", this);
    }
  }

  // Aplica dano ao jogador e verifica se morreu
  takeDamage(amount) {
    if (this.dead) {
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.emit("damaged", amount); // Usado para efeitos visuais como piscar vermelho

    // Verifica se a vida chegou a zero
    if (this.health <= 0) {
      this.dead = true;
      this.emit("died"); // A GameScene escuta isto para ativar o GameOver ou segunda vida
    }
  }

  // Cura a vida do jogador (não excede o máximo)
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.emit("changed", this);
  }

  // Restaura o nível de fome ao comer itens (cenouras, peixe, etc.)
  eat(foodValue) {
    this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
    this.emit("changed", this);
  }

  // Restaura o nível de sede ao beber (água, leite, etc.)
  drink(waterValue) {
    this.thirst = Math.min(this.maxThirst, this.thirst + waterValue);
    this.emit("changed", this);
  }

  // Restaura energia (seja por poções ou dormir na cabana, etc.)
  rest(energyValue) {
    this.energy = Math.min(this.maxEnergy, this.energy + energyValue);
    this.emit("changed", this);
  }

  // Repõe todos os atributos no nível máximo (usado ao renascer ou iniciar jogo novo)
  reset() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.thirst = this.maxThirst;
    this.energy = this.maxEnergy;
    this.dead = false;
    this.emit("changed", this);
  }

  // Getters de conveniência que devolvem a percentagem de 0.0 a 1.0 de cada barra
  // Utilizados diretamente na HUDScene para desenhar a escala das barras gráficas.
  get healthPercentagem() {
    return this.health / this.maxHealth;
  }
  get hungerPercentagem() {
    return this.hunger / this.maxHunger;
  }
  get thirstPercentagem() {
    return this.thirst / this.maxThirst;
  }
  get energyPercentagem() {
    return this.energy / this.maxEnergy;
  }

  // Serializa os atributos de status para guardar no ficheiro de save
  toJSON() {
    return {
      health: this.health,
      hunger: this.hunger,
      thirst: this.thirst,
      energy: this.energy,
      dead: this.dead,
    };
  }

  // Repõe os atributos vitais ao carregar o jogo a partir de um save
  fromJSON(data) {
    if (!data) {
      return;
    }
    if (typeof data.health === "number") {
      this.health = data.health;
    }
    if (typeof data.hunger === "number") {
      this.hunger = data.hunger;
    }
    if (typeof data.thirst === "number") {
      this.thirst = data.thirst;
    }
    if (typeof data.energy === "number") {
      this.energy = data.energy;
    }
    if (typeof data.dead === "boolean") {
      this.dead = data.dead;
    }

    this.emit("changed", this);
  }
}
