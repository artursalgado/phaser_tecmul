// Utilitário de partículas one-shot.
// Requer que 'particle_sq' esteja carregado (gerado em PreloadScene).
export function burst(scene, x, y, {
    color    = 0xffffff,
    count    = 8,
    speed    = 130,
    lifespan = 500,
    scale    = 0.7,
    gravity  = 180,
    depth    = 15,
} = {}) {
    const emitter = scene.add.particles(x, y, 'particle_sq', {
        speed:    { min: speed * 0.3, max: speed },
        angle:    { min: 0, max: 360 },
        scale:    { start: scale, end: 0 },
        tint:     color,
        lifespan,
        gravityY: gravity,
        quantity: count,
        emitting: false,
        depth,
    });
    emitter.explode(count, x, y);
    scene.time.delayedCall(lifespan + 200, () => {
        if (emitter && emitter.scene) emitter.destroy();
    });
}
