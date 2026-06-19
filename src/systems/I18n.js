const LANGS = ["pt", "en"]; // Lista de idiomas disponíveis no jogo

class I18n {
  constructor() {
    this.lang = "pt"; // Idioma padrão inicial (Português)
    this.data = {}; // Dicionário com todas as traduções carregadas
  }

  // Inicializa carregando as traduções a partir da cache JSON do Phaser (PreloadScene)
  init(cache) {
    LANGS.forEach((l) => {
      const raw = cache.json.get(`i18n_${l}`);
      if (raw) {
        this.data[l] = raw;
      } // Associa os dados em dados[pt] ou dados[en]
    });
  }

  // Define manualmente um idioma específico se estiver na lista de válidos
  setLang(lang) {
    if (LANGS.includes(lang)) {
      this.lang = lang;
    }
  }

  // Alterna de forma circular entre os idiomas disponíveis (Útil para o botão do menu)
  toggle() {
    const idx = LANGS.indexOf(this.lang);
    this.lang = LANGS[(idx + 1) % LANGS.length];
  }

  // Traduz uma chave com suporte a aninhamento de pontos (ex: 'menu.start_btn')
  t(key) {
    const parts = key.split("."); // Divide 'menu.start_btn' em ['menu', 'start_btn']
    let obj = this.data[this.lang] || {};

    // Varre a árvore do objeto de tradução correspondente ao idioma atual
    for (const p of parts) {
      if (obj && typeof obj === "object") {
        obj = obj[p];
      } else {
        return key; // Devolve a chave original se o caminho não for válido
      }
    }

    // Devolve o texto traduzido se encontrado, ou a chave se for um nó intermédio
    return typeof obj === "string" ? obj : key;
  }
}

export default new I18n(); // Exporta uma única instância do gestor de traduções (Singleton)
