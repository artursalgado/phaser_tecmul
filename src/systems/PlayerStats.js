// Sistema de estatísticas de sobrevivência do jogador
// Gere vida, fome, sede e energia — emite eventos para a HUD reagir
export default class PlayerStats extends Phaser.Events.EventEmitter {
    constructor() {
        super();

        this.maxHealth  = 100;
        this.maxHunger  = 100;
        this.maxThirst  = 100;
        this.maxEnergy  = 100;

        this.health  = 100;
        this.hunger  = 100;
        this.thirst  = 100;
        this.energy  = 100;

        this.dead = false;

        // Velocidade de decaimento por segundo (ajustável)
        this.hungerDecay = 0.17;  // zero em ~10 min
        this.thirstDecay = 0.25;  // zero em ~7 min (mais urgente)
        this.energyDecay = 0.08;  // zero em ~20 min

        // Dano por segundo quando fome/sede chega a 0
        this.starveDamage  = 1.0;
        this.dehydrateDmg  = 1.5;
    }

    // Chamado pelo GameScene a cada frame (delta em ms)
    update(delta) {
        if (this.dead) return;
        const dt = delta / 1000; // converter para segundos

        // Decaimento natural
        this.hunger = Math.max(0, this.hunger - this.hungerDecay * dt);
        this.thirst = Math.max(0, this.thirst - this.thirstDecay * dt);
        this.energy = Math.max(0, this.energy - this.energyDecay * dt);

        // Dano por fome/sede em 0
        if (this.hunger <= 0) this.takeDamage(this.starveDamage * dt);
        if (this.thirst <= 0) this.takeDamage(this.dehydrateDmg * dt);

        this.emit('changed', this);
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.health = Math.max(0, this.health - amount);
        this.emit('damaged', amount);
        if (this.health <= 0) {
            this.dead = true;
            this.emit('died');
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.emit('changed', this);
    }

    eat(foodValue) {
        this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
        this.emit('changed', this);
    }

    drink(waterValue) {
        this.thirst = Math.min(this.maxThirst, this.thirst + waterValue);
        this.emit('changed', this);
    }

    rest(energyValue) {
        this.energy = Math.min(this.maxEnergy, this.energy + energyValue);
        this.emit('changed', this);
    }

    // Repõe tudo a 100% e tira o estado de "morto".
    // Usado no respawn (1 vida extra) — o jogador volta a ter stats cheios.
    reset() {
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.energy = this.maxEnergy;
        this.dead   = false;
        this.emit('changed', this);
    }

    // Percentagem de 0 a 1 de cada stat
    get healthPct()  { return this.health  / this.maxHealth;  }
    get hungerPct()  { return this.hunger  / this.maxHunger;  }
    get thirstPct()  { return this.thirst  / this.maxThirst;  }
    get energyPct()  { return this.energy  / this.maxEnergy;  }
}
