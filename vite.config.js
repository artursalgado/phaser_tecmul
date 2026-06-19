import { defineConfig } from "vite";

export default defineConfig({
  // O Phaser é carregado via CDN no index.html; não precisamos de o incluir no bundle.
  // Se quisermos mudar para npm install phaser, basta remover esta secção.
  build: {
    outDir: "dist",
    rollupOptions: {
      external: ["phaser"],
      output: {
        globals: { phaser: "Phaser" },
      },
    },
  },
  server: {
    open: true,
  },
});
