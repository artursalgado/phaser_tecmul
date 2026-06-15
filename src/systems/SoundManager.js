/**
 * SoundManager — sons procedurais via Web Audio API
 * Não precisa de ficheiros .mp3/.ogg — gera os sons em tempo real.
 * 
 * Uso:
 *   import SoundManager from '../systems/SoundManager.js';
 *   SoundManager.init();
 *   SoundManager.play('pickup');
 *   SoundManager.play('hurt');
 *   SoundManager.play('die');
 *   SoundManager.play('attack');
 *   SoundManager.play('step');
 */

class SoundManager {
    constructor() {
        this._ctx = null;
        this._muted = false;
        this._volume = 0.3;
    }

    init() {
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('Web Audio API não disponível:', e);
        }
    }

    /** Resume o contexto após interação do utilizador (obrigatório em browsers modernos) */
    resume() {
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
    }

    get muted() { return this._muted; }
    toggleMute() { this._muted = !this._muted; }

    /**
     * Toca um som pelo nome
     * @param {'pickup'|'hurt'|'die'|'attack'|'step'|'goblin_hurt'|'menu_click'|'victory'} name
     */
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
            default: break;
        }
    }

    // ── Sons individuais ────────────────────────────────────────────────────

    _pickup() {
        // Tom ascendente curto — "ding"
        this._tone(880, 0.08, 'sine', 0, 0.12);
        this._tone(1320, 0.08, 'sine', 0.06, 0.12);
    }

    _hurt() {
        // Ruído com pitch descendente — "ouch"
        const osc = this._osc('sawtooth', 400);
        const gain = this._gainNode(0.25);
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.frequency.exponentialRampToValueAtTime(80, this._ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.2);
        osc.start();
        osc.stop(this._ctx.currentTime + 0.2);
    }

    _die() {
        // Queda longa
        for (let i = 0; i < 3; i++) {
            const t = this._ctx.currentTime + i * 0.12;
            const osc = this._osc('sawtooth', 300 - i * 80);
            const gain = this._gainNode(0.2);
            osc.connect(gain);
            gain.connect(this._ctx.destination);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.start(t);
            osc.stop(t + 0.35);
        }
    }

    _attack() {
        // "Swoosh" rápido
        this._noise(0.15, 0.15, 0.18);
    }

    _step() {
        // Passo suave
        this._noise(0.04, 0.05, 0.08);
    }

    _goblinHurt() {
        // Grunhido agudo
        const osc = this._osc('square', 600);
        const gain = this._gainNode(0.15);
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.frequency.exponentialRampToValueAtTime(200, this._ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15);
        osc.start();
        osc.stop(this._ctx.currentTime + 0.15);
    }

    _menuClick() {
        this._tone(660, 0.1, 'sine', 0, 0.08);
    }

    _victory() {
        // Fanfarra simples
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            this._tone(freq, 0.25, 'sine', i * 0.12, 0.15);
        });
    }

    // ── Utilitários internos ────────────────────────────────────────────────

    _tone(freq, vol, type, delay, duration) {
        const t = this._ctx.currentTime + delay;
        const osc = this._osc(type, freq);
        const gain = this._gainNode(vol * this._volume);
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    _noise(vol, attack, duration) {
        const bufSize = this._ctx.sampleRate * duration;
        const buffer = this._ctx.createBuffer(1, bufSize, this._ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this._ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this._gainNode(vol * this._volume);
        const filter = this._ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this._ctx.destination);
        source.start();
    }

    _osc(type, freq) {
        const osc = this._ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        return osc;
    }

    _gainNode(vol) {
        const g = this._ctx.createGain();
        g.gain.value = Math.min(vol, 1);
        return g;
    }
}

export default new SoundManager();
