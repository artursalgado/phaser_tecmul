// Tabela com os atributos de cada ferramenta/arma equipável.
// Serve para o ataque ler o dano, alcance e cooldown corretos dinamicamente.
const WEAPON_STATS = {
    axe:     { damage: 25, range: 52, cooldown: 700 }, // Machado: bom para cortar árvores
    pickaxe: { damage: 15, range: 44, cooldown: 500 }, // Picareta: rápida, boa para pedras
    sword:   { damage: 20, range: 60, cooldown: 550 }, // Espada: maior alcance para combate
    hammer:  { damage: 35, range: 40, cooldown: 900 }, // Martelo: lento mas dá muito dano
    none:    { damage: 10, range: 36, cooldown: 600 }  // Mãos vazias: dano mínimo e curto alcance
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Inicializa o sprite base com a animação de idle padrão
        super(scene, x, y, 'player_base_idle', 0);
        
        // Regista o jogador na cena e no sistema de física do Phaser
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene       = scene;
        this.speedWalk   = 90;  // Velocidade de andar normal
        this.speedRun    = 160; // Velocidade de corrida (gasta energia)
        this.facing      = 'right';
        this.isBusy      = false; // Bloqueia movimentos quando ataca ou sofre dano

        // Atributos de ataque temporários (são atualizados conforme o item na mão)
        this.attackDamage   = 20;
        this.attackRange    = 48;
        this.attackCooldown = 600;
        this.lastAttackTime = 0; // Guarda quando foi o último ataque para controlar o cooldown
        
        // Vetor de orientação para saber para onde o jogador está a olhar (usado no alcance do ataque)
        this.facingX        = 1;
        this.facingY        = 0;

        // Controlo de passos (toca som de passos periodicamente enquanto anda)
        this.stepTimer = 0;
        this.stepInterval = 320;

        // Configurações básicas de renderização do sprite
        this.setScale(1);
        this.setDepth(5); // Renderizado acima do chão e abaixo de overlays da UI
        this.setOrigin(0.5, 38 / 64); // Ajusta a origem para os pés do jogador para Y-sorting funcionar

        // Configura a hitbox física do jogador
        // Deixamos a caixa pequena e localizada nos pés para que o jogador possa
        // passar por trás de árvores e rochas de forma natural (Y-sorting).
        this.body.setSize(16, 14);
        this.body.setOffset(40, 24);
        this.body.setCollideWorldBounds(true); // Impede o jogador de sair dos limites do mapa

        // Desenha uma elipse preta semitransparente por baixo dos pés para simular a sombra do jogador
        this.shadow = scene.add.ellipse(x, y + 1, 20, 7, 0x000000, 0.3).setDepth(4);

        // Cria sprites adicionais sobrepostos para o cabelo e ferramentas.
        // Como o sprite do corpo não tem cabelo nem armas desenhadas, criamos estas camadas
        // que vão seguir a posição do corpo e correr as animações em sintonia.
        this.hairSprite = scene.add.sprite(x, y, 'player_hair_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(6);
        this.toolSprite = scene.add.sprite(x, y, 'player_tools_idle', 0)
            .setScale(1).setOrigin(0.5, 38 / 64).setDepth(7).setVisible(false);

        // Cria as animações de todas as camadas
        this.criarAnimacoes(scene);
        this.playAnim('idle');

        // Mapeia as teclas de atalho de ataque (Espaço) e corrida (Shift)
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    // Cria as animações no registo global do Phaser se ainda não existirem
    criarAnimacoes(scene) {
        const make = (key, tex, nFrames, fps, repeat = -1) => {
            if (scene.anims.exists(key)) return;
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: nFrames - 1 }),
                frameRate: fps,
                repeat
            });
        };
        
        // Animações do corpo base do jogador
        make('player_idle',   'player_base_idle',    9,  6);
        make('player_walk',   'player_base_walk',    8, 10);
        make('player_run',    'player_base_run',     8, 14);
        make('player_hurt',   'player_base_hurt',    8, 12, 0); // Sem repetição (toca uma vez)
        make('player_death',  'player_base_death',  13,  8, 0);
        make('player_axe',    'player_base_axe',    10, 12, 0);
        make('player_mining', 'player_base_mining', 10, 12, 0);
        
        // Animações correspondentes do cabelo
        make('hair_idle',     'player_hair_idle',    9,  6);
        make('hair_walk',     'player_hair_walk',    8, 10);
        make('hair_run',      'player_hair_run',     8, 14);
        make('hair_hurt',     'player_hair_hurt',    8, 12, 0);
        make('hair_death',    'player_hair_death',  13,  8, 0);
        make('hair_axe',      'player_hair_axe',    10, 12, 0);
        make('hair_mining',   'player_hair_mining', 10, 12, 0);
        
        // Animações correspondentes das ferramentas visuais
        make('tools_idle',    'player_tools_idle',   9,  6);
        make('tools_walk',    'player_tools_walk',   8, 10);
        make('tools_run',     'player_tools_run',    8, 14);
        make('tools_axe',     'player_tools_axe',   10, 12, 0);
        make('tools_mining',  'player_tools_mining',10, 12, 0);
    }

    // Toca a animação especificada em todas as camadas (corpo, cabelo e ferramenta)
    playAnim(name, showTool = false) {
        this.play('player_' + name, true);
        this.hairSprite.play('hair_' + name, true);
        
        // Só mostra a ferramenta se estiver a andar/correr ou a atacar com arma
        this.toolSprite.setVisible(showTool);
        if (showTool && this.scene.anims.exists('tools_' + name)) {
            this.toolSprite.play('tools_' + name, true);
        }
    }

    // Inverte a escala X de todos os sprites sobrepostos para virar o personagem
    atualizarDirecao(val) {
        this.setFlipX(val);
        this.hairSprite.setFlipX(val);
        this.toolSprite.setFlipX(val);
    }

    // Copia a posição X/Y e orientação do corpo principal para as camadas e a sombra
    sincronizarCamadas() {
        this.hairSprite.setPosition(this.x, this.y);
        this.toolSprite.setPosition(this.x, this.y);
        this.shadow.setPosition(this.x, this.y + 1);
        this.hairSprite.setFlipX(this.flipX);
        this.toolSprite.setFlipX(this.flipX);
    }

    // Devolve um multiplicador baseado na energia do jogador.
    // Se o jogador estiver com pouca energia, ele fica cansado ou exausto,
    // o que reduz a sua velocidade e o dano causado.
    obterMultiplicadorEnergia() {
        if (!this.scene.stats) return 1;

        const percentagem = this.scene.stats.energyPercentagem;
        if (percentagem > 0.30) {
            return 1.0; // Estado normal
        } else if (percentagem >= 0.10) {
            return 0.70; // Cansado: 70% da capacidade
        } else {
            return 0.50; // Exausto: 50% da capacidade
        }
    }

    update(cursors, wasd, time, delta) {
        // Garante que o cabelo e ferramentas seguem o corpo do jogador
        this.sincronizarCamadas();

        // Se estiver preso a sofrer dano ou a atacar, não lê controlos de movimento
        if (this.isBusy) return;

        // Atualiza dinamicamente as estatísticas de ataque com base no item ativo na hotbar
        const slot = this.scene.inventory?.getSelectedItem();
        const itemId = slot?.itemId;
        const stats = WEAPON_STATS[itemId] || WEAPON_STATS.none;
        this.attackDamage = stats.damage;
        this.attackRange = stats.range;
        this.attackCooldown = stats.cooldown;

        // Calcula o cooldown efetivo (se estiver exausto, o cooldown demora o dobro do tempo)
        const cooldownEfetivo = this.attackCooldown / this.obterMultiplicadorEnergia();
        
        // Verifica se a tecla de ataque foi premida e o cooldown já passou
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) &&
            time > this.lastAttackTime + cooldownEfetivo) {
            this.realizarAtaque(time);
            return;
        }

        // Reseta velocidade física antes de aplicar o input do frame atual
        this.body.setVelocity(0);

        // Processa as teclas de movimento (WASD ou setas direcionais)
        let dx = 0, dy = 0;
        if (cursors.left.isDown  || wasd.left.isDown)  dx = -1;
        if (cursors.right.isDown || wasd.right.isDown) dx =  1;
        if (cursors.up.isDown    || wasd.up.isDown)    dy = -1;
        if (cursors.down.isDown  || wasd.down.isDown)  dy =  1;

        // Normalização do vetor diagonal.
        // Se mover para cima e direita simultaneamente, a velocidade seria 1.41x maior (hipotenusa).
        // Multiplicamos por 0.707 (raiz de 0.5) para manter a velocidade normal de movimento.
        if (dx !== 0 && dy !== 0) { 
            dx *= 0.707; 
            dy *= 0.707; 
        }

        // Verifica se pode correr (precisa de premir Shift, estar a mover-se e ter energia > 10%)
        const temEnergia = this.scene.stats ? (this.scene.stats.energy > 0 && this.scene.stats.energyPercentagem >= 0.10) : true;
        const running = this.shiftKey.isDown && (dx !== 0 || dy !== 0) && temEnergia;
        
        // A velocidade de andar é afetada pela exaustão. A de correr é sempre máxima.
        const speed = running ? this.speedRun : this.speedWalk * this.obterMultiplicadorEnergia();

        // Consome energia continuamente enquanto corre
        if (running && this.scene.stats) {
            this.scene.stats.energy = Math.max(0, this.scene.stats.energy - 6 * (delta / 1000));
        }

        // Aplica velocidade no motor de física
        this.body.setVelocityX(dx * speed);
        this.body.setVelocityY(dy * speed);

        // Atualiza a orientação e as animações se houver movimento
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            this.facingX = dx / len;
            this.facingY = dy / len;

            if (dx < 0) this.atualizarDirecao(true);   // Vira para a esquerda
            else if (dx > 0) this.atualizarDirecao(false); // Vira para a direita
            
            this.playAnim(running ? 'run' : 'walk', running);

            // Temporizador para emitir sons de passos periodicamente
            this.stepTimer -= delta || 16;
            if (this.stepTimer <= 0) {
                this.stepTimer = running ? this.stepInterval * 0.6 : this.stepInterval;
                this.scene.events.emit('playerStep');
            }
        } else {
            // Se parado, reseta som de passos e toca animação de repouso (idle)
            this.stepTimer = 0;
            this.playAnim('idle');
        }

        // Efeito visual (tom cinzento/azul) quando o jogador está exausto para dar feedback
        if (this.scene.stats) {
            if (this.scene.stats.energyPercentagem < 0.30) {
                this.setTint(0xaaaacc);
                this.hairSprite.setTint(0xaaaacc);
                this.toolSprite.setTint(0xaaaacc);
            } else {
                this.clearTint();
                this.hairSprite.clearTint();
                this.toolSprite.clearTint();
            }
        }
    }

    // Executa a lógica de ataque (Spacebar)
    realizarAtaque(time) {
        this.lastAttackTime = time;
        this.isBusy = true;
        this.body.setVelocity(0); // Para o jogador durante o golpe

        this.scene.events.emit('playerAttack');

        // Escolhe a animação com base no item (picareta mina, outras ferramentas batem com machado)
        const slot     = this.scene.inventory?.getSelectedItem();
        const itemId   = slot?.itemId;
        const isWeapon = itemId && itemId in WEAPON_STATS && itemId !== 'none';
        const anim     = itemId === 'pickaxe' ? 'mining' : 'axe';
        this.playAnim(anim, isWeapon);

        // Define a posição central do ataque.
        // Coloca a área de colisão um pouco à frente de onde o jogador está a olhar.
        const alcanceAtaque = this.attackRange * 0.5;
        const hitX  = this.x + this.facingX * alcanceAtaque;
        const hitY  = this.y + this.facingY * alcanceAtaque;

        const multiplicador = this.obterMultiplicadorEnergia();

        // 1. Procura goblins/esqueletos na área do ataque
        const goblins = this.scene.goblins?.getChildren() ?? [];
        goblins.forEach(g => {
            if (!g.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, g.x, g.y);
                if (d < this.attackRange) {
                    // Causa dano e empurra o inimigo na direção do ataque
                    g.takeDamage(this.attackDamage * multiplicador, this.facingX < 0 ? 'left' : 'right');
                    this.scene.events.emit('enemyHurt');
                }
            }
        });

        // 2. Procura árvores na área do ataque
        const trees = this.scene.trees?.getChildren() ?? [];
        trees.forEach(t => {
            if (!t.dead) {
                const d = Phaser.Math.Distance.Between(hitX, hitY, t.x, t.y);
                if (d < this.attackRange) {
                    // Emite dano à árvore e causa sua queda
                    if (Math.random() < multiplicador) {
                        t.chop();
                    }
                }
            }
        });

        // Desenha um anel amarelo temporário para feedback visual do golpe
        const ring = this.scene.add.circle(hitX, hitY, 10, 0xffff88, 0.55).setDepth(10);
        this.scene.tweens.add({
            targets: ring, scaleX: 1.8, scaleY: 1.8, alpha: 0,
            duration: 220, onComplete: () => ring.destroy()
        });

        // Quando a animação de ataque termina, o jogador pode mover-se novamente
        this.once('animationcomplete', () => {
            this.isBusy = false;
            this.playAnim('idle');
        });
    }

    // Efeito de piscar vermelho quando o jogador sofre dano de inimigos ou fome
    flashHurt() {
        this.playAnim('hurt');
        const targets = [this, this.hairSprite, this.toolSprite];
        
        // Faz os sprites piscarem reduzindo a opacidade repetidamente
        this.scene.tweens.add({
            targets, alpha: 0.15, duration: 65, yoyo: true, repeat: 5,
            onComplete: () => {
                targets.forEach(t => t.setAlpha(1));
                if (!this.isBusy) this.playAnim('idle');
            }
        });
    }

    // Limpa os sprites secundários ao apagar o objeto do jogador para evitar fugas de memória
    destroy() {
        this.shadow?.destroy();
        this.hairSprite?.destroy();
        this.toolSprite?.destroy();
        super.destroy();
    }
}
