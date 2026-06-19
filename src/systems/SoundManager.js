// O SoundManager gere todos os sons do jogo de forma procedural usando a Web Audio API nativa.
// Em vez de carregar ficheiros MP3 ou WAV pesados pela rede, gera programaticamente as ondas
// de som (sinusoidal, triangular, ruído branco) e os efeitos em tempo real através do navegador.
class SoundManager {
  constructor() {
    this.ctx = null; // Contexto de Áudio da Web (AudioContext)
    this.muted = false;
    this.volume = 0.3; // Volume geral dos efeitos sonoros (SFX)
    this.musicaFundoNode = null; // Guarda referências dos nós da música ambiente
    this.musicaFundoGain = null; // Nó de volume da música de fundo
  }

  // Inicializa o contexto de áudio do browser.
  // Tem de ser chamado após uma interação do utilizador (clique) devido às políticas de segurança dos navegadores.
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Falha silenciosa se o browser não suportar a Web Audio API
    }
  }

  // Retoma o processamento de áudio se o browser o tiver colocado em suspensão automática
  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Liga ou desliga todos os sons do jogo alterando o volume dos nós ativos
  toggleMute() {
    this.muted = !this.muted;
    if (this.musicaFundoGain) {
      // Se silenciado, define ganho a 0, senão repõe o volume baixo da música ambiente (0.07)
      this.musicaFundoGain.gain.value = this.muted ? 0 : 0.07;
    }
  }

  // Inicia a reprodução da música ambiente e efeitos atmosféricos procedurais
  startBgMusic() {
    if (!this.ctx || this.musicaFundoNode) {
      return;
    }
    this.resume();

    // 1. Cria o nó de volume (GainNode) principal da música de fundo e liga-o à saída de áudio
    this.musicaFundoGain = this.ctx.createGain();
    this.musicaFundoGain.gain.value = this.muted ? 0 : 0.07;
    this.musicaFundoGain.connect(this.ctx.destination);

    // 2. Drone Grave (Som contínuo profundo de fundo)
    // Usa uma onda sinusoidal a 110Hz para criar um tom de suspense
    const drone = this.ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 110;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.4;
    drone.connect(droneGain);
    droneGain.connect(this.musicaFundoGain);
    drone.start();

    // 3. Tom Harmónico (Frequência superior)
    // Usa uma onda triangular suave a 165Hz para dar melodia à atmosfera
    const harm = this.ctx.createOscillator();
    harm.type = "triangle";
    harm.frequency.value = 165;
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.2;
    harm.connect(harmGain);
    harmGain.connect(this.musicaFundoGain);
    harm.start();

    // 4. Oscilador de Baixa Frequência (LFO - Low Frequency Oscillator)
    // Modula lentamente o volume do tom harmónico a uma taxa de 0.15Hz (uma oscilação a cada ~6 segundos),
    // fazendo com que a melodia "respire" e varie ao longo do tempo.
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.18; // Intensidade da oscilação
    lfo.connect(lfoGain);
    lfoGain.connect(harmGain.gain); // Liga o LFO diretamente ao parâmetro de ganho do tom harmónico!
    lfo.start();

    // 5. Simulador de Som de Vento Atmosférico (Ruído Branco com Filtro Passa-Baixo)
    // Cria um buffer de áudio de 2 segundos preenchido com dados aleatórios de amplitude
    const bufferTamanho = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferTamanho, this.ctx.sampleRate);
    const canalDados = buffer.getChannelData(0);
    for (let i = 0; i < bufferTamanho; i++) {
      canalDados[i] = Math.random() * 2 - 1; // Ruído branco puro (-1.0 a 1.0)
    }

    // Configura a fonte de som para ler o buffer em loop contínuo
    const vento = this.ctx.createBufferSource();
    vento.buffer = buffer;
    vento.loop = true;

    // Aplica um filtro passa-baixo (lowpass) a 300Hz para cortar as frequências agudas e ásperas,
    // transformando o ruído branco num sopro abafado semelhante a vento.
    const ventoFiltro = this.ctx.createBiquadFilter();
    ventoFiltro.type = "lowpass";
    ventoFiltro.frequency.value = 300;

    const ventoGain = this.ctx.createGain();
    ventoGain.gain.value = 0.08;

    vento.connect(ventoFiltro);
    ventoFiltro.connect(ventoGain);
    ventoGain.connect(this.musicaFundoGain);
    vento.start();

    // Guarda as referências de todos os nós gerados para podermos pará-los mais tarde
    this.musicaFundoNode = { drone, harm, lfo, vento };
  }

  // Para e desliga todos os geradores da música de fundo
  stopBgMusic() {
    if (!this.musicaFundoNode) {
      return;
    }
    try {
      this.musicaFundoNode.drone.stop();
      this.musicaFundoNode.harm.stop();
      this.musicaFundoNode.lfo.stop();
      this.musicaFundoNode.vento.stop();
    } catch (e) {}
    this.musicaFundoNode = null;
  }

  // Toca um efeito sonoro (SFX) específico mapeado por nome
  play(name) {
    if (!this.ctx || this.muted) {
      return;
    }
    this.resume();
    switch (name) {
      case "pickup":
        this.somApanhar();
        break;
      case "hurt":
        this.somDano();
        break;
      case "die":
        this.somMorte();
        break;
      case "attack":
        this.somAtaque();
        break;
      case "step":
        this.somPasso();
        break;
      case "goblin_hurt":
        this.somGoblinDano();
        break;
      case "menu_click":
        this.somClickMenu();
        break;
      case "victory":
        this.somVitoria();
        break;
      case "pause":
        this.somPausa();
        break;
      default:
        break;
    }
  }

  // Som curto ascendente de apanhar item (dois tons rápidos em escala)
  somApanhar() {
    this.tocarTom(880, 0.08, "sine", 0, 0.1);
    this.tocarTom(1320, 0.08, "sine", 0.07, 0.1);
  }

  // Som de dano sofrido (onda dente de serra grave que desce de frequência rapidamente)
  somDano() {
    const oscilador = this.criarOscilador("sawtooth", 400);
    const volumeNode = this.criarGainNode(0.25);
    oscilador.connect(volumeNode);
    volumeNode.connect(this.ctx.destination);

    // Faz a frequência cair de 400Hz para 80Hz em 150ms
    oscilador.frequency.exponentialRampToValueAtTime(
      80,
      this.ctx.currentTime + 0.15,
    );
    // Faz o volume desvanecer até 0.001 em 200ms
    volumeNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + 0.2,
    );

    oscilador.start();
    oscilador.stop(this.ctx.currentTime + 0.2);
  }

  // Som de morte do jogador (uma sequência descendente de 3 notas graves abafadas)
  somMorte() {
    for (let i = 0; i < 3; i++) {
      const tempo = this.ctx.currentTime + i * 0.12;
      const oscilador = this.criarOscilador("sawtooth", 300 - i * 80);
      const volumeNode = this.criarGainNode(0.2);
      oscilador.connect(volumeNode);
      volumeNode.connect(this.ctx.destination);

      oscilador.frequency.exponentialRampToValueAtTime(40, tempo + 0.3);
      volumeNode.gain.setValueAtTime(0.2, tempo);
      volumeNode.gain.exponentialRampToValueAtTime(0.001, tempo + 0.35);

      oscilador.start(tempo);
      oscilador.stop(tempo + 0.35);
    }
  }

  // Som do ataque do jogador (rajada muito rápida de ruído branco para simular o vento do golpe)
  somAtaque() {
    this.tocarRuido(0.15, 0.15, 0.18);
  }

  // Som de passos na relva (ruído branco muito curto com volume baixo)
  somPasso() {
    this.tocarRuido(0.04, 0.05, 0.07);
  }

  // Som agudo e estridente de monstro a sofrer dano (onda quadrada rápida descendente)
  somGoblinDano() {
    const oscilador = this.criarOscilador("square", 600);
    const volumeNode = this.criarGainNode(0.15);
    oscilador.connect(volumeNode);
    volumeNode.connect(this.ctx.destination);

    oscilador.frequency.exponentialRampToValueAtTime(
      200,
      this.ctx.currentTime + 0.12,
    );
    volumeNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + 0.15,
    );

    oscilador.start();
    oscilador.stop(this.ctx.currentTime + 0.15);
  }

  // Som curto de clique de menu
  somClickMenu() {
    this.tocarTom(660, 0.12, "sine", 0, 0.08);
  }

  // Som de pausa do jogo (dois tons descendentes rápidos)
  somPausa() {
    this.tocarTom(440, 0.1, "sine", 0, 0.06);
    this.tocarTom(330, 0.1, "sine", 0.07, 0.06);
  }

  // Fanfarra de vitória (uma sequência de 4 notas ascendentes maiores)
  somVitoria() {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tocarTom(f, 0.25, "sine", i * 0.13, 0.18);
    });
  }

  // Utilitário para tocar um tom simples de frequência e forma de onda definidas
  tocarTom(freq, vol, tipo, atraso, duracao) {
    const tempo = this.ctx.currentTime + atraso;
    const oscilador = this.criarOscilador(tipo, freq);
    const volumeNode = this.criarGainNode(vol * this.volume);

    oscilador.connect(volumeNode);
    volumeNode.connect(this.ctx.destination);

    // Faz desvanecer exponencialmente para evitar cliques ou ruídos ao cortar o áudio
    volumeNode.gain.exponentialRampToValueAtTime(0.001, tempo + duracao);

    oscilador.start(tempo);
    oscilador.stop(tempo + duracao + 0.01);
  }

  // Utilitário para gerar uma rajada rápida de ruído branco (usado para percussão/efeito físico)
  tocarRuido(vol, ataque, duracao) {
    const frequenciaAmostragem = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(
      1,
      frequenciaAmostragem * duracao,
      frequenciaAmostragem,
    );
    const canalDados = buffer.getChannelData(0);
    for (let i = 0; i < canalDados.length; i++) {
      canalDados[i] = Math.random() * 2 - 1;
    }

    const fonte = this.ctx.createBufferSource();
    fonte.buffer = buffer;

    // Aplica um filtro bandpass para dar um som de "clique/físico"
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 1000;

    const volumeNode = this.criarGainNode(vol * this.volume);

    fonte.connect(filtro);
    filtro.connect(volumeNode);
    volumeNode.connect(this.ctx.destination);

    fonte.start();
  }

  // Cria e retorna um nó de oscilador configurado
  criarOscilador(tipo, freq) {
    const oscilador = this.ctx.createOscillator();
    oscilador.type = tipo;
    oscilador.frequency.value = freq;
    return oscilador;
  }

  // Cria e retorna um nó de controlo de volume de forma segura
  criarGainNode(vol) {
    const volumeNode = this.ctx.createGain();
    volumeNode.gain.value = Math.min(Math.max(vol, 0), 1);
    return volumeNode;
  }
}

// Exporta uma única instância global do SoundManager
export default new SoundManager();
