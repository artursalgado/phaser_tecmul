/**
 * SoundManager — sons procedurais via Web Audio API
 * Não precisa de ficheiros .mp3/.ogg — gera os sons em tempo real.
 */

class SoundManager {
    constructor() {
        this._ctx    = null;
        this._muted  = false;
        this._volume = 0.3;
        this._bgNode = null;   // nó da música de fundo
        this._bgGain = null;
    }

    init() {
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('Web Audio API não disponível:', e);
        }
    }

    resume() {
        if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
    }

    get muted() { return this._muted; }

    toggleMute() {
        this._muted = !this._muted;
        if (this._bgGain) {
            this._bgGain.gain.value = this._muted ? 0 : 0.07;
        }
    }

    // ── Música de fundo (loop ambient) ────────────────────────────────────────
    startBgMusic() {
        if (!this._ctx || this._bgNode) return;
        this.resume();

        this._bgGain = this._ctx.createGain();
        this._bgGain.gain.value = this._muted ? 0 : 0.07;
        this._bgGain.connect(this._ctx.destination);

        // Drone base — onda sine grave em Lá (110 Hz)
        const drone = this._ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 110;
        const droneGain = this._ctx.createGain();
        droneGain.gain.value = 0.4;
        drone.connect(droneGain);
        droneGain.connect(this._bgGain);
        drone.start();

        // Harmónico — 5ª (165 Hz) com LFO lento
        const harm = this._ctx.createOscillator();
        harm.type = 'triangle';
        harm.frequency.value = 165;
        const harmGain = this._ctx.createGain();
        harmGain.gain.value = 0.2;
        harm.connect(harmGain);
        harmGain.connect(this._bgGain);
        harm.start();

        // LFO de amplitude (tremolo lento ~0.15 Hz)
        const lfo = this._ctx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = this._ctx.createGain();
        lfoGain.gain.value = 0.18;
        lfo.connect(lfoGain);
        lfoGain.connect(harmGain.gain);
        lfo.start();

        // Ruído ambiente filtrado (vento suave)
        const bufSize = this._ctx.sampleRate * 2;
        const buf = this._ctx.createBuffer(1, bufSize, this._ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const wind = this._ctx.createBufferSource();
        wind.buffer = buf;
        wind.loop = true;
        const windFilter = this._ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 300;
        const windGain = this._ctx.createGain();
        windGain.gain.value = 0.08;
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this._bgGain);
        wind.start();

        this._bgNode = { drone, harm, lfo, wind };
    }

    stopBgMusic() {
        if (!this._bgNode) return;
        try {
            this._bgNode.drone.stop();
            this._bgNode.harm.stop();
            this._bgNode.lfo.stop();
            this._bgNode.wind.stop();
        } catch(e) {}
        this._bgNode = null;
    }

    // ── Efeitos sonoros ───────────────────────────────────────────────────────
    play(name) {
        if (!this._ctx || this._muted) return;
        this.resume();
        switch (name) {
            case 'pickup':      this._pickup();     break;
            case 'hurt':        this._hurt();       break;
            case 'die':         this._die();        break;
            case 'attack':      this._attack();     break;
            case 'step':        this._step();       break;
            case 'goblin_hurt': this._goblinHurt(); break;
            case 'menu_click':  this._menuClick();  break;
            case 'victory':     this._victory();    break;
            case 'pause':       this._pauseSound(); break;
            default: break;
        }
    }

    _pickup() {
        this._tone(880,  0.08, 'sine', 0,    0.1);
        this._tone(1320, 0.08, 'sine', 0.07, 0.1);
    }

    _hurt() {
        const osc  = this._osc('sawtooth', 400);
        const gain = this._gainNode(0.25);
        osc.connect(gain); gain.connect(this._ctx.destination);
        osc.frequency.exponentialRampToValueAtTime(80, this._ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.2);
        osc.start(); osc.stop(this._ctx.currentTime + 0.2);
    }

    _die() {
        for (let i = 0; i < 3; i++) {
            const t    = this._ctx.currentTime + i * 0.12;
            const osc  = this._osc('sawtooth', 300 - i * 80);
            const gain = this._gainNode(0.2);
            osc.connect(gain); gain.connect(this._ctx.destination);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.start(t); osc.stop(t + 0.35);
        }
    }

    _attack() {
        this._noise(0.15, 0.15, 0.18);
    }

    _step() {
        this._noise(0.04, 0.05, 0.07);
    }

    _goblinHurt() {
        const osc  = this._osc('square', 600);
        const gain = this._gainNode(0.15);
        osc.connect(gain); gain.connect(this._ctx.destination);
        osc.frequency.exponentialRampToValueAtTime(200, this._ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15);
        osc.start(); osc.stop(this._ctx.currentTime + 0.15);
    }

    _menuClick() {
        this._tone(660, 0.12, 'sine', 0, 0.08);
    }

    _pauseSound() {
        this._tone(440, 0.1, 'sine', 0,    0.06);
        this._tone(330, 0.1, 'sine', 0.07, 0.06);
    }

    _victory() {
        [523, 659, 784, 1047].forEach((f, i) =>
            this._tone(f, 0.25, 'sine', i * 0.13, 0.18));
    }

    // ── Utilitários ───────────────────────────────────────────────────────────
    _tone(freq, vol, type, delay, duration) {
        const t    = this._ctx.currentTime + delay;
        const osc  = this._osc(type, freq);
        const gain = this._gainNode(vol * this._volume);
        osc.connect(gain); gain.connect(this._ctx.destination);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t); osc.stop(t + duration + 0.01);
    }

    _noise(vol, attack, duration) {
        const rate   = this._ctx.sampleRate;
        const buf    = this._ctx.createBuffer(1, rate * duration, rate);
        const data   = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src    = this._ctx.createBufferSource();
        src.buffer   = buf;
        const filter = this._ctx.createBiquadFilter();
        filter.type  = 'bandpass';
        filter.frequency.value = 1000;
        const gain   = this._gainNode(vol * this._volume);
        src.connect(filter); filter.connect(gain); gain.connect(this._ctx.destination);
        src.start();
    }

    _osc(type, freq) {
        const o = this._ctx.createOscillator();
        o.type = type; o.frequency.value = freq; return o;
    }

    _gainNode(vol) {
        const g = this._ctx.createGain();
        g.gain.value = Math.min(Math.max(vol, 0), 1); return g;
    }
}

export default new SoundManager();
