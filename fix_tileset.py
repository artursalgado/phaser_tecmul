import json

with open('assets/tilemaps/ilha.json', 'r') as f:
    mapa = json.load(f)

mapa['tilesets'] = [{
    "firstgid": 1,
    "name": "sunnyside",
    "tilewidth": 16,
    "tileheight": 16,
    "tilecount": 4096,
    "columns": 64,
    "imagewidth": 1024,
    "imageheight": 1024,
    "image": "../tilesets/spr_tileset_sunnysideworld_16px.png",
    "margin": 0,
    "spacing": 0
}]

with open('assets/tilemaps/ilha.json', 'w') as f:
    json.dump(mapa, f)

print("Tileset embutido com sucesso!")
