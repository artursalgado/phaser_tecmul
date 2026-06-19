class SoundManager {
    constructor() {
        this.ctx    = null;
        this.muted  = false;
        this.volume = 0.3;
        this.musicaFundoNode = null;
        this.musicaFundoGain = null;
    }

    // Inicializa o contexto de audio
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            // falha silenciosa
        }
    }

    // Retoma o audio se estiver suspenso
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Toca ou pausa o som geral
    toggleMute() {
        this.muted = !this.muted;
        if (this.musicaFundoGain) {
            this.musicaFundoGain.gain.value = this.muted ? 0 : 0.07;
        }
    }

    // Inicia a musica de fundo (procedural)
    startBgMusic() {
        if (!this.ctx || this.musicaFundoNode) return;
        this.resume();

        this.musicaFundoGain = this.ctx.createGain();
        this.musicaFundoGain.gain.value = this.muted ? 0 : 0.07;
        this.musicaFundoGain.connect(this.ctx.destination);

        // Som de fundo grave
        const drone = this.ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 110;
        const droneGain = this.ctx.createGain();
        droneGain.gain.value = 0.4;
        drone.connect(droneGain);
        droneGain.connect(this.musicaFundoGain);
        drone.start();

        // Som harmonico
        const harm = this.ctx.createOscillator();
        harm.type = 'triangle';
        harm.frequency.value = 165;
        const harmGain = this.ctx.createGain();
        harmGain.gain.value = 0.2;
        harm.connect(harmGain);
        harmGain.connect(this.musicaFundoGain);
        harm.start();

        // Efeito de oscilacao lenta
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.18;
        lfo.connect(lfoGain);
        lfoGain.connect(harmGain.gain);
        lfo.start();

        // Som de vento continuo
        const bufferTamanho = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferTamanho, this.ctx.sampleRate);
        const canalDados = buffer.getChannelData(0);
        for (let i = 0; i < bufferTamanho; i++) {
            canalDados[i] = Math.random() * 2 - 1;
        }
        const vento = this.ctx.createBufferSource();
        vento.buffer = buffer;
        vento.loop = true;
        const ventoFiltro = this.ctx.createBiquadFilter();
        ventoFiltro.type = 'lowpass';
        ventoFiltro.frequency.value = 300;
        const ventoGain = this.ctx.createGain();
        ventoGain.gain.value = 0.08;
        vento.connect(ventoFiltro);
        ventoFiltro.connect(ventoGain);
        ventoGain.connect(this.musicaFundoGain);
        vento.start();

        this.musicaFundoNode = { drone, harm, lfo, vento };
    }

    // Para a musica de fundo
    stopBgMusic() {
        if (!this.musicaFundoNode) return;
        try {
            this.musicaFundoNode.drone.stop();
            this.musicaFundoNode.harm.stop();
            this.musicaFundoNode.lfo.stop();
            this.musicaFundoNode.vento.stop();
        } catch(e) {}
        this.musicaFundoNode = null;
    }

    // Toca um efeito sonoro especifico
    play(name) {
        if (!this.ctx || this.muted) return;
        this.resume();
        switch (name) {
            case 'pickup':      this.somApanhar();     break;
            case 'hurt':        this.somDano();        break;
            case 'die':         this.somMorte();       break;
            case 'attack':      this.somAtaque();      break;
            case 'step':        this.somPasso();       break;
            case 'goblin_hurt': this.somGoblinDano();  break;
            case 'menu_click':  this.somClickMenu();   break;
            case 'victory':     this.somVitoria();     break;
            case 'pause':       this.somPausa();       break;
            default: break;
        }
    }

    somApanhar() {
        this.tocarTom(880,  0.08, 'sine', 0,    0.1);
        this.tocarTom(1320, 0.08, 'sine', 0.07, 0.1);
    }

    somDano() {
        const oscilador = this.criarOscilador('sawtooth', 400);
        const volumeNode = this.criarGainNode(0.25);
        oscilador.connect(volumeNode);
        volumeNode.connect(this.ctx.destination);
        oscilador.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        volumeNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        oscilador.start();
        oscilador.stop(this.ctx.currentTime + 0.2);
    }

    somMorte() {
        for (let i = 0; i < 3; i++) {
            const tempo = this.ctx.currentTime + i * 0.12;
            const oscilador = this.criarOscilador('sawtooth', 300 - i * 80);
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

    somAtaque() {
        this.tocarRuido(0.15, 0.15, 0.18);
    }

    somPasso() {
        this.tocarRuido(0.04, 0.05, 0.07);
    }

    somGoblinDano() {
        const oscilador = this.criarOscilador('square', 600);
        const volumeNode = this.criarGainNode(0.15);
        oscilador.connect(volumeNode);
        volumeNode.connect(this.ctx.destination);
        oscilador.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.12);
        volumeNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        oscilador.start();
        oscilador.stop(this.ctx.currentTime + 0.15);
    }

    somClickMenu() {
        this.tocarTom(660, 0.12, 'sine', 0, 0.08);
    }

    somPausa() {
        this.tocarTom(440, 0.1, 'sine', 0,    0.06);
        this.tocarTom(330, 0.1, 'sine', 0.07, 0.06);
    }

    somVitoria() {
        [523, 659, 784, 1047].forEach((f, i) => {
            this.tocarTom(f, 0.25, 'sine', i * 0.13, 0.18);
        });
    }

    // Toca uma frequencia pura
    tocarTom(freq, vol, tipo, atraso, duracao) {
        const tempo = this.ctx.currentTime + atraso;
        const oscilador = this.criarOscilador(tipo, freq);
        const volumeNode = this.criarGainNode(vol * this.volume);
        oscilador.connect(volumeNode);
        volumeNode.connect(this.ctx.destination);
        volumeNode.gain.exponentialRampToValueAtTime(0.001, tempo + duracao);
        oscilador.start(tempo);
        oscilador.stop(tempo + duracao + 0.01);
    }

    // Toca ruido branco
    tocarRuido(vol, ataque, duracao) {
        const frequenciaAmostragem = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, frequenciaAmostragem * duracao, frequenciaAmostragem);
        const canalDados = buffer.getChannelData(0);
        for (let i = 0; i < canalDados.length; i++) {
            canalDados[i] = Math.random() * 2 - 1;
        }
        const fonte = this.ctx.createBufferSource();
        fonte.buffer = buffer;
        const filtro = this.ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = 1000;
        const volumeNode = this.criarGainNode(vol * this.volume);
        fonte.connect(filtro);
        filtro.connect(volumeNode);
        volumeNode.connect(this.ctx.destination);
        fonte.start();
    }

    criarOscilador(tipo, freq) {
        const oscilador = this.ctx.createOscillator();
        oscilador.type = tipo;
        oscilador.frequency.value = freq;
        return oscilador;
    }

    criarGainNode(vol) {
        const volumeNode = this.ctx.createGain();
        volumeNode.gain.value = Math.min(Math.max(vol, 0), 1);
        return volumeNode;
    }
}

export default new SoundManager();
