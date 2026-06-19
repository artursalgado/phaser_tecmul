// Estatisticas de sobrevivencia do jogador (vida, fome, sede e energia)
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

        // Velocidade que os atributos descem por segundo
        this.hungerDecay = 0.17;
        this.thirstDecay = 0.25;
        this.energyDecay = 0.08;

        // Dano por segundo quando a fome ou sede chega a zero
        this.starveDamage  = 1.0;
        this.dehydrateDamage  = 1.5;
    }

    // Atualiza os valores a cada frame
    update(delta) {
        if (this.dead) return;
        const segundos = delta / 1000;

        this.hunger = Math.max(0, this.hunger - this.hungerDecay * segundos);
        this.thirst = Math.max(0, this.thirst - this.thirstDecay * segundos);
        this.energy = Math.max(0, this.energy - this.energyDecay * segundos);

        if (this.hunger <= 0) this.takeDamage(this.starveDamage * segundos);
        if (this.thirst <= 0) this.takeDamage(this.dehydrateDamage * segundos);

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

    // Reseta todos os atributos para o valor maximo
    reset() {
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.energy = this.maxEnergy;
        this.dead   = false;
        this.emit('changed', this);
    }

    // Retorna a percentagem atual de cada atributo (entre 0 e 1)
    get healthPercentagem()  { return this.health  / this.maxHealth;  }
    get hungerPercentagem()  { return this.hunger  / this.maxHunger;  }
    get thirstPercentagem()  { return this.thirst  / this.maxThirst;  }
    get energyPercentagem()  { return this.energy  / this.maxEnergy;  }

    toJSON() {
        return {
            health: this.health,
            hunger: this.hunger,
            thirst: this.thirst,
            energy: this.energy,
            dead: this.dead
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (typeof data.health === 'number') this.health = data.health;
        if (typeof data.hunger === 'number') this.hunger = data.hunger;
        if (typeof data.thirst === 'number') this.thirst = data.thirst;
        if (typeof data.energy === 'number') this.energy = data.energy;
        if (typeof data.dead === 'boolean') this.dead = data.dead;
        this.emit('changed', this);
    }
}
