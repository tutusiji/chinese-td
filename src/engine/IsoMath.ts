/**
 * 等距投影坐标转换工具
 *
 * 标准菱形等距投影:
 *   screenX = (c - r) * halfTileW
 *   screenY = (c + r) * halfTileH - elevation * tileH
 */
export class IsoMath {
  /** 地块半宽 */
  halfTileW: number;
  /** 地块半高 */
  halfTileH: number;
  /** 地块全高 (用于 elevation 计算) */
  tileH: number;

  constructor(tileW: number, tileH: number) {
    this.halfTileW = tileW / 2;
    this.halfTileH = tileH / 2;
    this.tileH = tileH;
  }

  /** 网格坐标 → 等距屏幕坐标 (相对于世界原点) */
  gridToScreen(r: number, c: number, elevation: number = 0): { x: number; y: number } {
    const x = (c - r) * this.halfTileW;
    const y = (c + r) * this.halfTileH - elevation * this.tileH;
    return { x, y };
  }

  /** 屏幕坐标 → 网格坐标 (最接近的 tile) */
  screenToGrid(screenX: number, screenY: number): { r: number; c: number } {
    // 逆投影
    const c = (screenX / this.halfTileW + screenY / this.halfTileH) / 2;
    const r = (screenY / this.halfTileH - screenX / this.halfTileW) / 2;
    // 四舍五入到最近的整数网格
    return {
      r: Math.round(r),
      c: Math.round(c),
    };
  }

  /** 精确屏幕坐标 → 浮点网格坐标 (用于平滑移动) */
  screenToGridFloat(screenX: number, screenY: number): { r: number; c: number } {
    const c = (screenX / this.halfTileW + screenY / this.halfTileH) / 2;
    const r = (screenY / this.halfTileH - screenX / this.halfTileW) / 2;
    return { r, c };
  }

  /** 两个网格坐标之间的距离 (曼哈顿距离) */
  gridDistance(r1: number, c1: number, r2: number, c2: number): number {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  }

  /** 计算等距世界的总像素尺寸 */
  worldSize(rows: number, cols: number): { w: number; h: number } {
    // 从左下角 (row=rows, col=0) 到右上角 (row=0, col=cols)
    const bottomLeft = this.gridToScreen(rows, 0, 0);
    const topRight = this.gridToScreen(0, cols, 0);
    return {
      w: Math.abs(topRight.x - bottomLeft.x) + this.halfTileW * 2,
      h: Math.abs(bottomLeft.y - topRight.y) + this.halfTileH * 2,
    };
  }

  /** 等距世界中心点 (用于初始相机定位) */
  worldCenter(rows: number, cols: number): { x: number; y: number } {
    return this.gridToScreen(Math.floor(rows / 2), Math.floor(cols / 2), 0);
  }
}
