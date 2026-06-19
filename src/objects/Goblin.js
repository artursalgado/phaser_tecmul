import Enemy from './Enemy.js';

export default class Goblin extends Enemy {
    // Tabela estática com as propriedades de cada nível (tier) de Goblin.
    // Goblins de nível mais alto têm mais vida, correm mais e dão mais dano, além de cores e escalas diferentes.
    static niveisGoblin = {
        1: { maxHealth: 40,  speed: 55, damage: 6,  tint: null,     scale: 0.75 }, // Goblin Verde Comum (pequeno e fraco)
        2: { maxHealth: 70,  speed: 70, damage: 10, tint: 0xff8888, scale: 0.82 }, // Goblin Vermelho (médio e rápido)
        3: { maxHealth: 110, speed: 85, damage: 15, tint: 0xcc88ff, scale: 0.90 }, // Goblin Roxo Elite (grande e muito forte)
    };

    constructor(scene, x, y, tier = 1) {
        // Inicializa o sprite com a imagem base de repouso do goblin
        super(scene, x, y, 'goblin_idle');

        // Obtém a configuração de atributos para o nível de goblin especificado
        const t = Goblin.niveisGoblin[tier] || Goblin.niveisGoblin[1];
        
        // Define os atributos herdados do Enemy com base no tier do goblin
        this.maxHealth = t.maxHealth;
        this.health = t.maxHealth;
        this.speed = t.speed;
        this.damage = t.damage;
        this.setScale(t.scale);
        
        // Aplica o tom de cor correspondente ao nível de goblin
        if (t.tint) {
            this.setTint(t.tint);
            this.baseTint = t.tint;
        }

        // Prefixo para o Enemy.js saber quais as chaves de animação corretas para carregar
        this.animPrefix = 'goblin';
        
        // Ajusta a origem para Y-sorting (os pés determinam a sobreposição com o jogador e árvores)
        this.setOrigin(0.5, 38 / 64);
        
        // Configura os limites físicos da hitbox do goblin
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true);

        // Inicializa os elementos de desenho da barra de vida do goblin
        this.setupHpBar();
        this.tier = tier;
        
        // Cria as animações específicas do goblin
        this.criarAnimacoes(scene);
        this.play('goblin_idle', true);
    }

    // Regista as animações do Goblin no gestor global de animações do Phaser se ainda não existirem
    criarAnimacoes(scene) {
        const make = (key, tex, n, fps, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: n - 1 }),
                frameRate: fps,
                repeat
            });
        };
        
        // Registando frames das animações a partir das spritesheets carregadas no PreloadScene
        make('goblin_idle',   'goblin_idle',   8,  6);
        make('goblin_walk',   'goblin_walk',   8, 10);
        make('goblin_hurt',   'goblin_hurt',   8, 12, 0); // Sem loop
        make('goblin_death',  'goblin_death',  9,  8, 0); // Sem loop
        make('goblin_attack', 'goblin_attack', 9, 10, 0); // Sem loop
    }
}
