// Utilitário global de partículas rápidas (one-shot).
// Requer que a textura 'particle_sq' (um pequeno quadrado branco procedural)
// tenha sido gerada e carregada na cache de texturas do Phaser (PreloadScene -> create).
export function burst(scene, x, y, {
    color    = 0xffffff, // Cor das partículas (branco por defeito)
    count    = 8,        // Quantas partículas são geradas na explosão
    speed    = 130,      // Velocidade máxima de dispersão
    lifespan = 500,      // Tempo de vida em ms de cada partícula antes de desaparecer
    scale    = 0.7,      // Escala inicial
    gravity  = 180,      // Gravidade Y que puxa as partículas para baixo (efeito de queda)
    depth    = 15,       // Profundidade visual de renderização
} = {}) {
    
    // Instancia o emissor de partículas no ponto X/Y especificado
    const emitter = scene.add.particles(x, y, 'particle_sq', {
        speed:    { min: speed * 0.3, max: speed }, // Velocidades aleatórias
        angle:    { min: 0, max: 360 },             // Dispersa em todas as direções (360 graus)
        scale:    { start: scale, end: 0 },         // Encolhe até desaparecer (de escala inicial a zero)
        tint:     color,                            // Cor aplicada às partículas
        lifespan,
        gravityY: gravity,
        quantity: count,
        emitting: false,                            // Desativa emissão contínua
        depth,
    });

    // Explode imediatamente o número de partículas definido de forma instantânea
    emitter.explode(count, x, y);
    
    // Destrói o emissor da cena após o fim da animação de vida das partículas para evitar fugas de memória
    scene.time.delayedCall(lifespan + 200, () => {
        if (emitter && emitter.scene) emitter.destroy();
    });
}
