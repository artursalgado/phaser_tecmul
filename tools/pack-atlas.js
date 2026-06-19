#!/usr/bin/env node
// Script para empacotar os ícones de itens do jogo num único texture atlas JSON.
// Usa apenas módulos built-in do Node — não precisa de dependências externas.
// Executa com: node tools/pack-atlas.js
//
// Output: assets/atlas/items.json + assets/atlas/items.png
// (requer sharp: npm install sharp --save-dev, ou usar free-tex-packer via npx)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, basename, extname } from "path";

const ASSETS_DIR  = join(import.meta.dirname, "..", "assets", "images");
const OUT_DIR     = join(import.meta.dirname, "..", "assets", "atlas");
const ATLAS_NAME  = "items";

// Itens cujos ícones são usados como texturas individuais no jogo
const ITEM_ICONS = [
  "wood", "rock", "fish", "egg", "milk", "water", "carrot", "potato", "wheat",
  "axe", "pickaxe", "hammer", "shovel", "sword", "rope", "sail", "book",
];

mkdirSync(OUT_DIR, { recursive: true });

// Verifica quais ficheiros existem
const encontrados = ITEM_ICONS.filter((id) => {
  const candidatos = [
    join(ASSETS_DIR, `${id}.png`),
    join(ASSETS_DIR, `${id}_00.png`),
  ];
  return candidatos.some((p) => existsSync(p));
});

const faltam = ITEM_ICONS.filter((id) => !encontrados.includes(id));

console.log(`\n=== pack-atlas ===`);
console.log(`Ícones encontrados : ${encontrados.length}/${ITEM_ICONS.length}`);
if (faltam.length) console.log(`Ícones em falta    : ${faltam.join(", ")}`);

// Gera o JSON do atlas no formato hash (Phaser atlas loader)
// Cada frame aponta para a imagem individual (atlas "virtual" — single sprites ainda separados)
// Para um atlas real com sharp: substitui as coords pelo packer
const frames = {};
encontrados.forEach((id, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  const SIZE = 32;
  frames[id] = {
    frame: { x: col * SIZE, y: row * SIZE, w: SIZE, h: SIZE },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE },
    sourceSize: { w: SIZE, h: SIZE },
  };
});

const meta = {
  app: "Stranded pack-atlas",
  version: "1.0",
  image: `${ATLAS_NAME}.png`,
  format: "RGBA8888",
  size: { w: 8 * 32, h: Math.ceil(ITEM_ICONS.length / 8) * 32 },
  scale: "1",
};

const atlasJSON = JSON.stringify({ frames, meta }, null, 2);
const outJSON = join(OUT_DIR, `${ATLAS_NAME}.json`);
writeFileSync(outJSON, atlasJSON);

console.log(`\nAtlas JSON gerado  : ${outJSON}`);
console.log(`\nPasso seguinte:`);
console.log(`  npx free-tex-packer-cli --source assets/images/ --output assets/atlas/ --name items`);
console.log(`  (ou instalar TexturePacker e usar a interface gráfica)`);
console.log(`\nDepois atualizar PreloadScene.js:`);
console.log(`  this.load.atlas("items", "assets/atlas/items.png", "assets/atlas/items.json");`);
console.log(`  // e substituir this.load.image("wood", ...) etc. por referências ao atlas\n`);
