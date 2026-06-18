/**
 * I18n — sistema de internacionalização simples
 * Uso: import I18n from '../systems/I18n.js';
 *      I18n.setLang('pt');
 *      I18n.t('menu.title');
 */

const LANGS = ['pt', 'en'];

class I18n {
    constructor() {
        this._lang = 'pt';
        this._data = {};
    }

    /** Língua atual */
    get lang() { return this._lang; }

    /** Carrega os ficheiros JSON (chamar no preload do Phaser via this.load.json) */
    init(cache) {
        LANGS.forEach(l => {
            const raw = cache.json.get(`i18n_${l}`);
            if (raw) this._data[l] = raw;
        });
    }

    /** Muda a língua ativa */
    setLang(lang) {
        if (LANGS.includes(lang)) this._lang = lang;
    }

    /** Alterna entre as línguas disponíveis */
    toggle() {
        const idx = LANGS.indexOf(this._lang);
        this._lang = LANGS[(idx + 1) % LANGS.length];
    }

    /**
     * Traduz uma chave com notação de ponto
     * ex: I18n.t('menu.title')  →  'STRANDED'
     */
    t(key) {
        const parts = key.split('.');
        let obj = this._data[this._lang] || {};
        for (const p of parts) {
            if (obj && typeof obj === 'object') obj = obj[p];
            else return key;
        }
        return typeof obj === 'string' ? obj : key;
    }

    /** Lista de línguas disponíveis */
    get langs() { return [...LANGS]; }
}

// Singleton global
export default new I18n();
