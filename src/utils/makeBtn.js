// Função utilitária para desenhar um botão gráfico em estilo RPG (cor castanha e ouro).
// Cria um retângulo arredondado com efeitos de hover (passar o rato) e zona de clique interativa.
export default function makeBtn(
  scene,
  x,
  y,
  w,
  h,
  label,
  {
    depth = 6,
    fontSize = "16px",
    idleFill = "#f0ddb8", // Cor do texto quando em repouso
    hoverFill = "#ffffff", // Cor do texto quando o rato está por cima
    border = 0x9a6030, // Cor da borda
    borderIdleAlpha = 1,
    alpha = 1,
  } = {},
) {
  const BG_IDLE = 0x3d2008; // Castanho escuro para o botão inativo
  const BG_HOVER = 0x6b3810; // Castanho mais claro para quando o botão está em hover
  const RADIUS = 8; // Raio de arredondamento dos cantos do botão

  // Cria o elemento gráfico para desenhar o botão
  const grafico = scene.add.graphics().setDepth(depth).setAlpha(alpha);

  // Cria o texto do botão centralizado
  const txt = scene.add
    .text(x, y, label, {
      fontFamily: "Georgia, serif",
      fontSize,
      fill: idleFill,
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(depth + 1)
    .setAlpha(alpha);

  // Redesenha a forma geométrica do botão aplicando a cor correspondente ao estado
  const desenhar = (hover) => {
    grafico.clear();
    grafico.fillStyle(hover ? BG_HOVER : BG_IDLE, 1);
    grafico.fillRoundedRect(x - w / 2, y - h / 2, w, h, RADIUS);
    grafico.lineStyle(2, border, hover ? 1 : borderIdleAlpha);
    grafico.strokeRoundedRect(x - w / 2, y - h / 2, w, h, RADIUS);
  };

  // Desenha o botão inicialmente no estado inativo
  desenhar(false);

  // Cria uma zona interativa retangular invisível sobre o botão para capturar cliques e hovers
  const zone = scene.add
    .zone(x, y, w, h)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2);

  // Adiciona os ouvintes de eventos para alterar a cor do botão ao passar o rato
  zone.on("pointerover", () => {
    desenhar(true);
    txt.setStyle({ fill: hoverFill });
  });
  zone.on("pointerout", () => {
    desenhar(false);
    txt.setStyle({ fill: idleFill });
  });

  // Retorna referências do botão para a cena conseguir alterar textos ou escutar cliques (.zone.on('pointerdown', ...))
  return { grafico, txt, zone, setLabel: (s) => txt.setText(s) };
}
