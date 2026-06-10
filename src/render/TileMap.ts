import { Container, Graphics } from 'pixi.js';
import { IsoWorld } from '../engine/IsoWorld';
import { MapDefinition } from '../types/game';

/**
 * 等距地块渲染器 — 绘制所有地面 tile
 *
 * 每个 tile 是一个菱形，根据类型填不同颜色。
 * 按行+列顺序绘制，自然形成深度遮挡。
 */
export class TileMap {
  private world: IsoWorld;
  private container: Container;

  // 每种地块类型的颜色
  private colors: Record<string, number> = {};

  constructor(world: IsoWorld) {
    this.world = world;
    this.container = new Container();
    this.container.label = 'tilemap';
    world.groundLayer.addChild(this.container);

    this.colors = {
      path: 0x3a3428,
      buildable: 0x2a2418,
      blocked: 0x1a1410,
      castle: 0x4a3a28,
      wall: 0x5a4a32,
      start: 0x3a4428,
      end: 0x5a3028,
      water: 0x283848,
    };
  }

  /** 预计算的类型查找表 (O(1) 查询) */
  private typeMap: string[][] = [];

  /** 根据地图配置重新绘制所有地块 */
  buildFromMap(map: MapDefinition) {
    this.container.removeChildren();
    this.colors = {
      path: this.hex(map.groundColor.path),
      buildable: this.hex(map.groundColor.buildable),
      blocked: this.hex(map.groundColor.blocked),
      castle: this.hex(map.groundColor.castle),
      wall: this.hex(map.groundColor.wall),
      start: this.tint(this.hex(map.groundColor.path), 0x355a38, 0.35),
      end: this.tint(this.hex(map.groundColor.path), 0x71382f, 0.42),
      water: 0x263d4e,
      mountain: 0x3b423b,
      grass: 0x244a32,
      tree: 0x203829,
      river: 0x203d55,
    };

    // 预计算类型查找表 (一次性 O(rows*cols + paths), 避免 O(rows*cols*paths))
    this.buildTypeMap(map);

    // 绘制
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        this.drawTile(r, c, map);
      }
    }
  }

  /** 预计算每个格子类型 */
  private buildTypeMap(map: MapDefinition) {
    this.typeMap = [];
    for (let r = 0; r < map.rows; r++) {
      this.typeMap[r] = new Array(map.cols).fill('blocked');
    }

    // 标记路径
    for (const path of map.paths) {
      for (let i = 0; i < path.length; i++) {
        const pt = path[i];
        if (i === 0) this.typeMap[pt.r][pt.c] = 'start';
        else if (i === path.length - 1) this.typeMap[pt.r][pt.c] = 'end';
        else this.typeMap[pt.r][pt.c] = 'path';
      }
    }

    // 标记城池
    this.typeMap[map.castleGrid.r][map.castleGrid.c] = 'castle';

    // 标记城墙
    for (const wg of map.wallGrids) {
      this.typeMap[wg.r][wg.c] = 'wall';
    }

    // 标记可建造区
    for (const bz of map.buildableZone) {
      if (this.typeMap[bz.r][bz.c] === 'blocked') {
        this.typeMap[bz.r][bz.c] = 'buildable';
      }
    }

    // 标记地形。路径、城墙、城池优先级更高。
    for (const t of map.terrain ?? []) {
      const current = this.typeMap[t.r]?.[t.c];
      if (current === 'buildable' || current === 'blocked') {
        this.typeMap[t.r][t.c] = t.type;
      }
    }

    // 标记水域
    if (map.elevation) {
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          if (map.elevation[r]?.[c] === -1) {
            this.typeMap[r][c] = 'water';
          }
        }
      }
    }
  }

  /** 绘制单个菱形地块 */
  private drawTile(r: number, c: number, _map: MapDefinition) {
    const pos = this.world.gridToWorld(r, c, 0);
    const hw = this.world.iso.halfTileW;
    const hh = this.world.iso.halfTileH;

    const cellType = this.typeMap[r]?.[c] || 'blocked';
    const color = this.colors[cellType] || 0x2a2418;

    const g = new Graphics();
    g.moveTo(pos.x, pos.y - hh);
    g.lineTo(pos.x + hw, pos.y);
    g.lineTo(pos.x, pos.y + hh);
    g.lineTo(pos.x - hw, pos.y);
    g.closePath();
    g.fill({ color, alpha: 1 });
    g.stroke({ color: this.tint(color, 0xd2b77c, cellType === 'path' ? 0.18 : 0.08), width: 1, alpha: 0.55 });

    if (cellType === 'path') {
      g.moveTo(pos.x - hw * 0.52, pos.y);
      g.lineTo(pos.x, pos.y - hh * 0.52);
      g.lineTo(pos.x + hw * 0.52, pos.y);
      g.lineTo(pos.x, pos.y + hh * 0.52);
      g.closePath();
      g.stroke({ color: 0xb89758, width: 1, alpha: 0.14 });
    } else if (cellType === 'buildable') {
      g.circle(pos.x, pos.y, 2.2);
      g.fill({ color: 0xd4af37, alpha: 0.16 });
    } else if (cellType === 'wall') {
      g.moveTo(pos.x - hw * 0.35, pos.y - hh * 0.05);
      g.lineTo(pos.x, pos.y - hh * 0.35);
      g.lineTo(pos.x + hw * 0.35, pos.y - hh * 0.05);
      g.stroke({ color: 0xd2b77c, width: 2, alpha: 0.24 });
    } else if (cellType === 'start') {
      g.circle(pos.x, pos.y, 5);
      g.fill({ color: 0x86c477, alpha: 0.22 });
    } else if (cellType === 'end') {
      g.circle(pos.x, pos.y, 5);
      g.fill({ color: 0xd84a38, alpha: 0.22 });
    } else if (cellType === 'mountain') {
      g.moveTo(pos.x - 16, pos.y + 3);
      g.lineTo(pos.x - 2, pos.y - 18);
      g.lineTo(pos.x + 9, pos.y + 2);
      g.lineTo(pos.x + 18, pos.y + 8);
      g.lineTo(pos.x - 16, pos.y + 8);
      g.closePath();
      g.fill({ color: 0x6f7b6d, alpha: 0.62 });
      g.stroke({ color: 0xd2b77c, width: 1, alpha: 0.18 });
    } else if (cellType === 'tree') {
      g.rect(pos.x - 2, pos.y - 4, 4, 12);
      g.fill({ color: 0x5a3b22, alpha: 0.75 });
      g.circle(pos.x, pos.y - 9, 10);
      g.fill({ color: 0x35633f, alpha: 0.78 });
      g.circle(pos.x - 7, pos.y - 5, 7);
      g.fill({ color: 0x274f34, alpha: 0.8 });
    } else if (cellType === 'grass') {
      for (let i = 0; i < 3; i++) {
        const ox = -10 + i * 9;
        g.moveTo(pos.x + ox, pos.y + 6);
        g.lineTo(pos.x + ox + 3, pos.y - 1);
        g.lineTo(pos.x + ox + 6, pos.y + 6);
        g.stroke({ color: 0x7fb069, width: 1, alpha: 0.42 });
      }
    } else if (cellType === 'river') {
      g.moveTo(pos.x - hw * 0.62, pos.y);
      g.bezierCurveTo(pos.x - 10, pos.y - 8, pos.x + 10, pos.y + 8, pos.x + hw * 0.62, pos.y);
      g.stroke({ color: 0x7fc7d9, width: 3, alpha: 0.42 });
    }

    (g as any)._gridR = r;
    (g as any)._gridC = c;
    this.container.addChild(g);
  }

  private hex(value: string): number {
    return parseInt(value.replace('#', ''), 16);
  }

  private tint(base: number, mix: number, amount: number): number {
    const br = (base >> 16) & 255;
    const bg = (base >> 8) & 255;
    const bb = base & 255;
    const mr = (mix >> 16) & 255;
    const mg = (mix >> 8) & 255;
    const mb = mix & 255;
    const r = Math.round(br * (1 - amount) + mr * amount);
    const g = Math.round(bg * (1 - amount) + mg * amount);
    const b = Math.round(bb * (1 - amount) + mb * amount);
    return (r << 16) | (g << 8) | b;
  }

  /** 高亮某个地块 */
  highlightTile(r: number, c: number, color: number = 0xffdd66, alpha: number = 0.3) {
    const pos = this.world.gridToWorld(r, c, 0);
    const hw = this.world.iso.halfTileW;
    const hh = this.world.iso.halfTileH;

    const hl = new Graphics();
    hl.label = 'highlight';
    hl.moveTo(pos.x, pos.y - hh);
    hl.lineTo(pos.x + hw, pos.y);
    hl.lineTo(pos.x, pos.y + hh);
    hl.lineTo(pos.x - hw, pos.y);
    hl.closePath();
    hl.fill({ color, alpha });
    this.container.addChild(hl);
    return hl;
  }

  /** 清除所有高亮 */
  clearHighlights() {
    const toRemove = this.container.children.filter(c => c.label === 'highlight');
    for (const c of toRemove) {
      this.container.removeChild(c);
      c.destroy();
    }
  }

  /** 销毁 */
  destroy() {
    this.container.destroy({ children: true });
  }
}
