export default function makeBtn(scene, x, y, w, h, label, {
    depth = 6,
    fontSize = '16px',
    idleFill = '#f0ddb8',
    hoverFill = '#ffffff',
    border = 0x9a6030,
    borderIdleAlpha = 1,
    alpha = 0,
} = {}) {
    const BG_IDLE  = 0x3d2008;
    const BG_HOVER = 0x6b3810;
    const RADIUS   = 8;

    const gfx = scene.add.graphics().setDepth(depth).setAlpha(alpha);
    const txt = scene.add.text(x, y, label, {
        fontFamily: 'Georgia, serif', fontSize,
        fill: idleFill, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1).setAlpha(alpha);

    const draw = (hover) => {
        gfx.clear();
        gfx.fillStyle(hover ? BG_HOVER : BG_IDLE, 1);
        gfx.fillRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
        gfx.lineStyle(2, border, hover ? 1 : borderIdleAlpha);
        gfx.strokeRoundedRect(x - w/2, y - h/2, w, h, RADIUS);
    };

    draw(false);

    const zone = scene.add.zone(x, y, w, h)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

    zone.on('pointerover',  () => { draw(true);  txt.setStyle({ fill: hoverFill }); });
    zone.on('pointerout',   () => { draw(false); txt.setStyle({ fill: idleFill }); });

    return { gfx, txt, zone, setLabel: (s) => txt.setText(s) };
}
