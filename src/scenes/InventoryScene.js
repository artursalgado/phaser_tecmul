import { ITEM_DB } from "../systems/Inventory.js";
import I18n from "../systems/I18n.js";
import SoundManager from "../systems/SoundManager.js";

// Cores associadas a cada categoria de item para pintar a borda do slot selecionado
const ACENTO_CATEGORIA = {
  tool: 0x4499cc, // Ferramentas: Azul
  resource: 0x55bb55, // Recursos: Verde
  food: 0xffaa44, // Comida: Laranja
  quest: 0xaa66ff, // Missões: Roxo
};

// Cores em formato string hexadecimal para formatação de texto em HTML
const COR_STR_CATEGORIA = {
  tool: "#4499cc",
  resource: "#55bb55",
  food: "#ffaa44",
  quest: "#aa66ff",
};
const COR_STR_RARIDADE = {
  common: "#aaaaaa",
  rare: "#ffdd88",
  quest: "#cc88ff",
};

// Lista de filtros de categoria disponíveis no topo do inventário
const FILTROS = ["all", "tool", "resource", "food", "quest"];

// Constantes de coordenadas para desenhar o layout de UI RPG do painel de inventário
const W = 960,
  H = 640;
const PW = 600,
  PH = 380; // Largura e altura do painel interno
const CX = W / 2,
  CY = H / 2;
const PL = CX - PW / 2;
const PR = CX + PW / 2;
const PT = CY - PH / 2;
const PB = CY + PH / 2;
const HDR = 40; // Altura do cabeçalho
const FLT = 26; // Altura da barra de filtros
const PAD = 14; // Espaçamento interno

const TAMANHO_SLOT = 44; // Dimensões do quadrado do slot do inventário
const ESPACAMENTO = 8; // Distância entre slots
const COLUNAS = 4; // Número de colunas na grelha de slots

const GL = PL + PAD; // Posição X esquerda da grelha de slots
const GT = PT + HDR + FLT + 8; // Posição Y topo da grelha de slots
const GR = GL + COLUNAS * (TAMANHO_SLOT + ESPACAMENTO) - ESPACAMENTO; // Posição X direita da grelha

const DL = GR + 14; // Posição X esquerda do painel de detalhes (lado direito)
const DW = PR - PAD - DL; // Largura do painel de detalhes
const DT = PT + HDR + 8; // Posição Y topo do painel de detalhes
const DH = PB - 28 - DT; // Altura do painel de detalhes

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super("InventoryScene");
  }

  create() {
    // Obtém o inventário ativo da GameScene principal
    this.inventario = this.scene.get("GameScene").inventory;
    this.selectedIdx = -1; // Slot selecionado atualmente no painel de detalhes (-1 = nenhum)
    this.filterCat = "all"; // Filtro de categoria selecionado
    this.dragFrom = -1; // Slot inicial do item que está a ser arrastado
    this.ghostIcon = null; // Sprite fantasma flutuante que acompanha o rato durante o arrasto

    // Desenha um fundo escuro semitransparente. Parâmetros de rectangle: (centro X, centro Y, largura, altura, cor preta, opacidade)
    this.add
      .rectangle(CX, CY, W, H, 0x000000, 0.62)
      .setInteractive()
      .setDepth(0);

    // Desenha os gráficos de fundo do painel castanho RPG
    this.desenharFundoPainel();

    // Título "INVENTÁRIO"
    this.add
      .text(CX, PT + 22, I18n.t("inventory.title"), {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#f5e0b0",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.criarFiltros();
    this.criarSlots();
    this.criarPainelDetalhes();

    // Dica informativa no fundo de como fechar o painel
    this.add
      .text(CX, PB - 14, I18n.t("inventory.hint"), {
        fontSize: "9px",
        color: "#665544",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Associa atalhos de teclado (ESC ou I) para fechar o inventário
    this.input.keyboard.on("keydown-ESC", () => this.fechar());
    this.input.keyboard.on("keydown-I", () => this.fechar());

    // Lógica de arrastar e largar (Drag & Drop) - Escuta movimentos do ponteiro
    this.input.on("pointermove", (ptr) => {
      // Se houver um ícone fantasma a ser arrastado, move-o para as coordenadas atuais do rato
      if (this.ghostIcon) {
        this.ghostIcon.setPosition(ptr.x, ptr.y);
      }
    });

    // Escuta quando o clique do rato/toque é libertado
    this.input.on("pointerup", (ptr) => {
      if (this.dragFrom < 0) {
        return;
      }

      const de = this.dragFrom;
      let paraIdx = -1;

      // Verifica se o rato foi largado em cima de algum slot retangular do inventário
      for (let j = 0; j < this.slotObjs.length; j++) {
        const { sx, sy } = this.slotObjs[j];
        if (
          Math.abs(ptr.x - sx) < TAMANHO_SLOT / 2 &&
          Math.abs(ptr.y - sy) < TAMANHO_SLOT / 2
        ) {
          paraIdx = j;
          break;
        }
      }

      // Apaga o ícone fantasma flutuante
      if (this.ghostIcon) {
        this.ghostIcon.destroy();
        this.ghostIcon = null;
      }
      this.dragFrom = -1;

      // Se largou num slot válido diferente do inicial, troca-os de lugar no inventário
      if (paraIdx >= 0 && paraIdx !== de) {
        this.inventario.moveSlot(de, paraIdx);
      } else if (paraIdx === de || paraIdx < 0) {
        // Se largou fora ou no mesmo slot, interpreta como um clique normal para ver detalhes
        this.clicarSlot(de);
      }

      this.atualizarSlots();
    });

    // Ouve atualizações de estado do inventário para redesenhar slots em tempo real
    this.onChanged = () => this.atualizarSlots();
    this.inventario.on("changed", this.onChanged);

    // Limpa os ouvintes globais ao fechar a cena para evitar acumulação de referências (fugas de memória)
    this.events.once("shutdown", () => {
      this.inventario.off("changed", this.onChanged);
      this.input.off("pointermove");
      this.input.off("pointerup");
    });
  }

  fechar() {
    this.scene.stop();
  }

  // Desenha as formas geométricas do fundo do painel e do cabeçalho dourado
  desenharFundoPainel() {
    const g = this.add.graphics().setDepth(1);
    const r = 8; // Raio dos cantos

    // Sombra
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(PL + 6, PT + 6, PW, PH, r);

    // Fundo castanho principal
    g.fillStyle(0x1a1208, 1);
    g.fillRoundedRect(PL, PT, PW, PH, r);

    // Borda dourada ornamentada
    g.lineStyle(2, 0xc8901a, 0.8);
    g.strokeRoundedRect(PL + 1, PT + 1, PW - 2, PH - 2, r);

    // Caixa do cabeçalho
    g.fillStyle(0x3d1a00, 0.9);
    g.fillRoundedRect(PL, PT, PW, HDR, { tl: r, tr: r, bl: 0, br: 0 });

    g.lineStyle(1, 0xc8901a, 0.5);
    g.lineBetween(PL, PT + HDR, PR, PT + HDR);
  }

  // Cria os botões horizontais de filtros de categorias no topo dos slots (Ferramentas, Recursos...)
  criarFiltros() {
    const chaves = [
      "filter_all",
      "filter_tool",
      "filter_resource",
      "filter_food",
      "filter_quest",
    ];
    const BW = 82,
      BH = 18,
      GAP = 5;
    const total = FILTROS.length * BW + (FILTROS.length - 1) * GAP;
    let bx = CX - total / 2; // Posição X inicial centralizada

    this.filterBtns = [];

    FILTROS.forEach((cat, idx) => {
      const x = bx + idx * (BW + GAP) + BW / 2;
      const y = PT + HDR + 14;

      const g = this.add.graphics().setDepth(2);

      // Texto traduzido da categoria
      const txt = this.add
        .text(x, y, I18n.t(`inventory.${chaves[idx]}`), {
          fontSize: "9px",
          fill: "#c8a870",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(3);

      // Função local para desenhar o botão dependendo se é a categoria ativa
      const desenharBtn = () => {
        g.clear();
        const ativa = this.filterCat === cat;
        g.fillStyle(ativa ? 0x6b3a1a : 0x2d1a0e, 1);
        g.fillRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 4);
        g.lineStyle(1, 0xc8901a, ativa ? 1 : 0.4);
        g.strokeRoundedRect(x - BW / 2, y - BH / 2, BW, BH, 4);
      };
      desenharBtn();

      // Zona de colisão para capturar cliques na categoria
      const zone = this.add
        .zone(x, y, BW, BH)
        .setInteractive({ useHandCursor: true })
        .setDepth(4);

      zone.on("pointerdown", () => {
        SoundManager.play("menu_click");
        this.filterCat = cat;
        this.selectedIdx = -1; // Limpa seleção atual

        // Redesenha todos os botões de filtro para atualizar o destaque
        this.filterBtns.forEach((b) => b.redraw());
        this.atualizarSlots();
      });

      this.filterBtns.push({ redraw: desenharBtn });
    });
  }

  // Cria as posições físicas de todos os slots de inventário no ecrã (grelha bidimensional)
  criarSlots() {
    this.slotObjs = [];

    for (let i = 0; i < this.inventario.size; i++) {
      const col = i % COLUNAS;
      const lin = Math.floor(i / COLUNAS);

      const sx = GL + col * (TAMANHO_SLOT + ESPACAMENTO) + TAMANHO_SLOT / 2;
      const sy = GT + lin * (TAMANHO_SLOT + ESPACAMENTO) + TAMANHO_SLOT / 2;

      // Retângulo gráfico de fundo do slot
      const g = this.add.graphics().setDepth(2);

      // Ícone do item no slot
      const icon = this.add
        .image(sx, sy, "wood")
        .setScale(2)
        .setVisible(false)
        .setDepth(3);

      // Texto da quantidade de itens
      const count = this.add
        .text(sx + 16, sy + 16, "", {
          fontSize: "11px",
          fill: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(1, 1)
        .setDepth(4);

      // Borda dourada fina para destacar se for um slot da Hotbar (atalho rápido no jogo)
      const ehHotbar = i < 8;
      const bordaGfx = this.add.graphics().setDepth(3);
      if (ehHotbar) {
        bordaGfx.lineStyle(1, 0xc8901a, 0.45);
        bordaGfx.strokeRoundedRect(
          sx - TAMANHO_SLOT / 2 + 2,
          sy - TAMANHO_SLOT / 2 + 2,
          TAMANHO_SLOT - 4,
          TAMANHO_SLOT - 4,
          4,
        );
        // Desenha o número de atalho correspondente (1 a 8) no canto superior esquerdo
        this.add
          .text(
            sx - TAMANHO_SLOT / 2 + 4,
            sy - TAMANHO_SLOT / 2 + 4,
            String(i + 1),
            {
              fontSize: "8px",
              fill: "#8b6b4c",
            },
          )
          .setDepth(4);
      }

      // Divisória dourada que separa visualmente a Hotbar da mochila comum
      if (i === 7) {
        const divisoriaGfx = this.add.graphics().setDepth(2);
        divisoriaGfx.lineStyle(2, 0xc8901a, 0.85); // Linha dourada grossa
        divisoriaGfx.lineBetween(
          GL,
          sy + TAMANHO_SLOT / 2 + 3.5,
          GR,
          sy + TAMANHO_SLOT / 2 + 3.5,
        );
      }

      // Configura interatividade do slot para clique e arrastar (Drag)
      const zone = this.add
        .zone(sx, sy, TAMANHO_SLOT, TAMANHO_SLOT)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      // Ouvinte ao clicar no slot (inicia lógica de arrastar)
      zone.on("pointerdown", (ptr) => {
        const slot = this.inventario.slots[i];
        if (!slot) {
          return;
        }

        this.dragFrom = i;

        // Cria o ícone fantasma transparente que segue o rato
        const def = ITEM_DB[slot.itemId];
        this.ghostIcon = this.add
          .image(ptr.x, ptr.y, def ? def.icon : slot.itemId)
          .setScale(2.5)
          .setAlpha(0.65)
          .setDepth(20);
      });

      this.slotObjs.push({ sx, sy, g, icon, count, bordaGfx });
    }

    // Executa atualização visual inicial
    this.atualizarSlots();
  }

  // Desenha o painel lateral do lado direito onde são exibidas informações do item selecionado
  criarPainelDetalhes() {
    const cx = DL + DW / 2;

    this.detalhesGfx = this.add.graphics().setDepth(2);

    // Fundo do painel de detalhes
    this.detalhesGfx.fillStyle(0x0e0703, 0.85);
    this.detalhesGfx.fillRoundedRect(DL, DT, DW, DH, 6);
    this.detalhesGfx.lineStyle(1, 0xc8901a, 0.4);
    this.detalhesGfx.strokeRoundedRect(DL, DT, DW, DH, 6);

    // Ícone ampliado do item
    this.detalhesIcon = this.add
      .image(cx, DT + 56, "wood")
      .setScale(3.5)
      .setVisible(false)
      .setDepth(3);

    // Borda decorativa dourada à volta do ícone
    this.detalhesIconMoldura = this.add
      .graphics()
      .setDepth(2)
      .setVisible(false);

    // Textos descritivos (Título, Tipo, Raridade, Descrição...)
    this.detalhesTitulo = this.add
      .text(cx, DT + 110, "", {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: "#ffdd99",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.detalhesTipo = this.add
      .text(cx, DT + 132, "", {
        fontSize: "9px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.detalhesDesc = this.add
      .text(cx, DT + 154, "", {
        fontSize: "10px",
        color: "#ddccaa",
        wordWrap: { width: DW - 24 },
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setDepth(3);

    // Criamos o botão "USAR / EQUIPAR" no fundo do painel
    this.btnUsar = makeBtn(this, cx, PB - 44, DW - 28, 30, "USAR", {
      depth: 3,
      fontSize: "12px",
    });
    this.ocultarBotaoUsar(); // Começa oculto
  }

  ocultarBotaoUsar() {
    this.btnUsar.grafico.setVisible(false);
    this.btnUsar.txt.setVisible(false);
    this.btnUsar.zone.disableInteractive();
  }

  exibirBotaoUsar(label) {
    this.btnUsar.grafico.setVisible(true);
    this.btnUsar.txt.setVisible(true);
    this.btnUsar.txt.setText(label);
    this.btnUsar.zone.setInteractive();
  }

  // Processa a seleção de um slot por clique
  clicarSlot(idx) {
    const slot = this.inventario.slots[idx];
    if (!slot) {
      this.selectedIdx = -1;
      this.atualizarPainelDetalhes();
      return;
    }

    const def = ITEM_DB[slot.itemId];

    // Verifica se o item pertence à categoria do filtro ativo.
    // Se ativou um filtro e clicou num slot ocultado por este, não faz nada.
    if (this.filterCat !== "all" && def && def.category !== this.filterCat) {
      return;
    }

    // Se clicou no item que já estava selecionado, equipa-o ou usa-o automaticamente
    if (this.selectedIdx === idx) {
      this.usarItemSelecionado();
    } else {
      this.selectedIdx = idx;
    }

    this.atualizarPainelDetalhes();
  }

  // Lógica para consumir ou equipar o item selecionado
  usarItemSelecionado() {
    if (this.selectedIdx < 0) {
      return;
    }
    const slot = this.inventario.slots[this.selectedIdx];
    if (!slot) {
      return;
    }

    const def = ITEM_DB[slot.itemId];
    if (!def) {
      return;
    }

    // Se for um item de consumo (Comida ou Bebida)
    if (def.category === "food") {
      const gameScene = this.scene.get("GameScene");
      const stats = gameScene.stats;

      // Tenta comer o item aplicando os benefícios de status definidos na GameScene
      const consumiu = gameScene.consumirAlimento(slot.itemId);
      if (consumiu) {
        // Remove 1 unidade da mochila e atualiza
        this.inventario.removeItem(slot.itemId, 1);

        // Se a pilha acabou, limpa a seleção
        if (!this.inventario.slots[this.selectedIdx]) {
          this.selectedIdx = -1;
        }
      }
    } else if (def.category === "tool") {
      // Se for uma ferramenta ou arma, seleciona o slot correspondente na hotbar ativa
      this.inventario.selectSlot(this.selectedIdx);
      SoundManager.play("menu_click");
      this.fechar(); // Fecha o inventário para voltar a jogar com a arma na mão
    }
  }

  // Desenha as informações detalhadas do item do slot selecionado no painel da direita
  atualizarPainelDetalhes() {
    if (this.selectedIdx < 0 || !this.inventario.slots[this.selectedIdx]) {
      // Se não houver nada selecionado, esconde tudo e limpa textos
      this.detalhesIcon.setVisible(false);
      this.detalhesIconMoldura.setVisible(false);
      this.detalhesTitulo.setText("");
      this.detalhesTipo.setText("");
      this.detalhesDesc.setText("");
      this.ocultarBotaoUsar();
      return;
    }

    const slot = this.inventario.slots[this.selectedIdx];
    const def = ITEM_DB[slot.itemId];
    if (!def) {
      return;
    }

    // Revela o ícone ampliado
    this.detalhesIcon.setTexture(def.icon).setVisible(true);

    // Desenha a moldura de cor da categoria em volta do ícone de detalhes
    const corCategoria = ACENTO_CATEGORIA[def.category] || 0xc8901a;
    this.detalhesIconMoldura.clear();
    this.detalhesIconMoldura.lineStyle(2, corCategoria, 0.7);
    this.detalhesIconMoldura.strokeRoundedRect(
      this.detalhesIcon.x - 26,
      this.detalhesIcon.y - 26,
      52,
      52,
      6,
    );
    this.detalhesIconMoldura.setVisible(true);

    // Título e metadados com cor de raridade
    const corRaridadeStr = COR_STR_RARIDADE[def.rarity] || "#aaaaaa";
    this.detalhesTitulo.setText(def.name);
    this.detalhesTitulo.setStyle({ fill: corRaridadeStr });

    // Tipo do item
    const corCategoriaStr = COR_STR_CATEGORIA[def.category] || "#c8901a";
    this.detalhesTipo.setText(
      I18n.t(`items.category.${def.category}`).toUpperCase(),
    );
    this.detalhesTipo.setStyle({ fill: corCategoriaStr });

    // Descrição do item carregada a partir das traduções de I18n
    this.detalhesDesc.setText(I18n.t(`items.desc.${slot.itemId}`));

    // Configura o comportamento do botão "USAR"
    if (def.category === "food") {
      // Itens comestíveis mostram "COMER" ou "BEBER"
      const labelConsumir =
        slot.itemId === "water" || slot.itemId === "milk"
          ? I18n.lang === "pt"
            ? "BEBER"
            : "DRINK"
          : I18n.lang === "pt"
            ? "COMER"
            : "EAT";

      this.exibirBotaoUsar(labelConsumir);

      // Associa a função de consumo ao clique do botão
      this.btnUsar.zone.off("pointerdown");
      this.btnUsar.zone.on("pointerdown", () => {
        this.usarItemSelecionado();
        this.atualizarPainelDetalhes();
      });
    } else if (def.category === "tool") {
      // Ferramentas mostram "EQUIPAR" se não estiverem selecionadas na hotbar
      const jaEquipado = this.inventario.selectedSlot === this.selectedIdx;
      const etiquetaBotao = jaEquipado
        ? I18n.lang === "pt"
          ? "EQUIPADO"
          : "EQUIPPED"
        : I18n.lang === "pt"
          ? "EQUIPAR"
          : "EQUIP";

      this.exibirBotaoUsar(etiquetaBotao);

      this.btnUsar.zone.off("pointerdown");
      if (jaEquipado) {
        // Desativa clique se já estiver ativo na mão
        this.btnUsar.zone.disableInteractive();
        this.btnUsar.grafico.setAlpha(0.45);
      } else {
        this.btnUsar.grafico.setAlpha(1);
        this.btnUsar.zone.on("pointerdown", () => {
          this.usarItemSelecionado();
        });
      }
    } else {
      // Itens de missões ou materiais de construção comuns não podem ser consumidos diretamente
      this.ocultarBotaoUsar();
    }
  }

  // Desenha e atualiza graficamente todos os slots conforme as regras de filtros e seleção
  atualizarSlots() {
    for (let i = 0; i < this.inventario.size; i++) {
      const slot = this.inventario.slots[i];
      const sObj = this.slotObjs[i];
      if (!sObj) {
        continue;
      }

      const { g, icon, count } = sObj;
      g.clear();

      // Limpa destaque se houver alteração
      sObj.bordaGfx.clear();

      // Se o slot estiver completamente vazio
      if (!slot) {
        g.fillStyle(0x0e0703, 0.45); // Fundo escuro simples
        g.fillRoundedRect(
          sObj.sx - TAMANHO_SLOT / 2,
          sObj.sy - TAMANHO_SLOT / 2,
          TAMANHO_SLOT,
          TAMANHO_SLOT,
          4,
        );
        g.lineStyle(1.5, 0xc8901a, 0.15); // Borda muito opaca
        g.strokeRoundedRect(
          sObj.sx - TAMANHO_SLOT / 2,
          sObj.sy - TAMANHO_SLOT / 2,
          TAMANHO_SLOT,
          TAMANHO_SLOT,
          4,
        );

        icon.setVisible(false);
        count.setText("");
        continue;
      }

      const def = ITEM_DB[slot.itemId];

      // Lógica do filtro de categorias:
      // Se o item do slot não pertencer à categoria selecionada, deixa o slot cinzento e oculta o ícone
      const visivelPeloFiltro =
        this.filterCat === "all" || (def && def.category === this.filterCat);

      if (!visivelPeloFiltro) {
        // Desenha fundo inativo acinzentado escuro
        g.fillStyle(0x080402, 0.15);
        g.fillRoundedRect(
          sObj.sx - TAMANHO_SLOT / 2,
          sObj.sy - TAMANHO_SLOT / 2,
          TAMANHO_SLOT,
          TAMANHO_SLOT,
          4,
        );
        g.lineStyle(1, 0xc8901a, 0.05);
        g.strokeRoundedRect(
          sObj.sx - TAMANHO_SLOT / 2,
          sObj.sy - TAMANHO_SLOT / 2,
          TAMANHO_SLOT,
          TAMANHO_SLOT,
          4,
        );

        icon.setVisible(false);
        count.setText("");
        continue;
      }

      // Se for visível, desenha o slot normalmente com o ícone do item correspondente
      icon.setTexture(def ? def.icon : slot.itemId).setVisible(true);

      // Escreve a quantidade de itens empilhados se for maior que 1
      count.setText(slot.qty > 1 ? String(slot.qty) : "");

      // Determina as cores de destaque se o slot for o selecionado
      const selecionado = this.selectedIdx === i;
      const corDestaque = selecionado
        ? def
          ? ACENTO_CATEGORIA[def.category]
          : 0xffffff
        : 0x9a6030;

      // Borda amarela se for o item ativo na mão do jogador (apenas para ferramentas)
      const ehAtivoNaMao =
        this.inventario.selectedSlot === i && def && def.category === "tool";

      g.fillStyle(selecionado ? 0x6b3a1a : 0x221208, 0.85); // Fundo mais brilhante se selecionado
      g.fillRoundedRect(
        sObj.sx - TAMANHO_SLOT / 2,
        sObj.sy - TAMANHO_SLOT / 2,
        TAMANHO_SLOT,
        TAMANHO_SLOT,
        4,
      );

      g.lineStyle(selecionado ? 2 : 1.5, corDestaque, selecionado ? 1 : 0.45);
      g.strokeRoundedRect(
        sObj.sx - TAMANHO_SLOT / 2,
        sObj.sy - TAMANHO_SLOT / 2,
        TAMANHO_SLOT,
        TAMANHO_SLOT,
        4,
      );

      // Se for a arma equipada na mão, desenha um contorno verde/dourado brilhante em volta do slot
      if (ehAtivoNaMao) {
        sObj.bordaGfx.lineStyle(2, 0x88ff33, 0.8); // Verde limão
        sObj.bordaGfx.strokeRoundedRect(
          sObj.sx - TAMANHO_SLOT / 2 - 2,
          sObj.sy - TAMANHO_SLOT / 2 - 2,
          TAMANHO_SLOT + 4,
          TAMANHO_SLOT + 4,
          6,
        );
      }
    }
  }
}
