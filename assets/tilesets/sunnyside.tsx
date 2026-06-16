<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.12.1" name="sunnyside" tilewidth="16" tileheight="16" tilecount="4096" columns="64">
 <image source="spr_tileset_sunnysideworld_16px.png" width="1024" height="1024"/>
 <!--
   Wang set "terreno" (corner-type) para pintar costas com autotiling no Tiled.
   Cores: 1=agua, 2=areia, 3=relva. tileid = gid - 1.
   Ordem wangid: Top,TR,Right,BR,Bottom,BL,Left,TL (cantos nos índices 1,3,5,7).
   Tiles de costa lidos em inspect_H_sandwater.png (407=N,341=S,340=SW,342=SE,404=NW,410=NE).
   Mantém isto em sincronia com o dict COAST de generate_map.py.
 -->
 <wangsets>
  <wangset name="terreno" type="corner" tile="-1">
   <wangcolor name="agua"  color="#4da8ff" tile="68" probability="1"/>
   <wangcolor name="areia" color="#e4d472" tile="67" probability="1"/>
   <wangcolor name="relva" color="#62c54e" tile="65" probability="1"/>
   <wangtile tileid="68"  wangid="0,1,0,1,0,1,0,1"/>
   <wangtile tileid="67"  wangid="0,2,0,2,0,2,0,2"/>
   <wangtile tileid="65"  wangid="0,3,0,3,0,3,0,3"/>
   <wangtile tileid="406" wangid="0,1,0,2,0,2,0,1"/>
   <wangtile tileid="340" wangid="0,2,0,1,0,1,0,2"/>
   <wangtile tileid="339" wangid="0,2,0,2,0,1,0,2"/>
   <wangtile tileid="341" wangid="0,2,0,1,0,2,0,2"/>
   <wangtile tileid="403" wangid="0,2,0,2,0,2,0,1"/>
   <wangtile tileid="409" wangid="0,1,0,2,0,2,0,2"/>
  </wangset>
 </wangsets>
</tileset>
