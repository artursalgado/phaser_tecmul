const LANGS = ['pt', 'en'];

class I18n {
    constructor() {
        this.lang = 'pt';
        this.data = {};
    }

    // Carrega as traducoes dos ficheiros JSON
    init(cache) {
        LANGS.forEach(l => {
            const raw = cache.json.get(`i18n_${l}`);
            if (raw) this.data[l] = raw;
        });
    }

    // Define o idioma atual
    setLang(lang) {
        if (LANGS.includes(lang)) {
            this.lang = lang;
        }
    }

    // Alterna o idioma do jogo
    toggle() {
        const idx = LANGS.indexOf(this.lang);
        this.lang = LANGS[(idx + 1) % LANGS.length];
    }

    // Traduz a chave indicada
    t(key) {
        const parts = key.split('.');
        let obj = this.data[this.lang] || {};
        for (const p of parts) {
            if (obj && typeof obj === 'object') {
                obj = obj[p];
            } else {
                return key;
            }
        }
        return typeof obj === 'string' ? obj : key;
    }
}

export default new I18n();
