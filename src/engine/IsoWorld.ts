import { Container } from 'pixi.js';
import { IsoMath } from './IsoMath';
import { Camera } from './Camera';
import { pixiApp } from './PixiApp';
import { MapDefinition } from '../types/game';

/**
 * 等距世界 — 固定 2.5D 俯视视角，不可旋转
 */
export class IsoWorld {
  iso: IsoMath;
  camera: Camera;
  groundLayer: Container;
  entityLayer: Container;
  effectLayer: Container;
  map: MapDefinition;

  constructor(map: MapDefinition) {
    this.map = map;
    this.iso = new IsoMath(map.tileWidth, map.tileHeight);

    this.groundLayer = new Container(); this.groundLayer.label = 'ground';
    this.entityLayer = new Container(); this.entityLayer.label = 'entities';
    this.effectLayer = new Container(); this.effectLayer.label = 'effects';

    const world = pixiApp.world;
    world.addChild(this.groundLayer);
    world.addChild(this.entityLayer);
    world.addChild(this.effectLayer);

    this.camera = new Camera(world, pixiApp.width, pixiApp.height);
    this.bindCameraEvents();
    window.addEventListener('resize', this.handleResize);
  }

  /** 网格坐标 → 世界坐标 */
  gridToWorld(r: number, c: number, elevation: number = 0): { x: number; y: number } {
    return this.iso.gridToScreen(r, c, elevation);
  }

  /** 世界坐标 → 网格坐标 */
  worldToGrid(worldX: number, worldY: number): { r: number; c: number } {
    return this.iso.screenToGrid(worldX, worldY);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const w = pixiApp.world;
    return {
      x: (screenX - w.position.x) / w.scale.x,
      y: (screenY - w.position.y) / w.scale.y,
    };
  }

  screenToGrid(screenX: number, screenY: number): { r: number; c: number } | null {
    const wp = this.screenToWorld(screenX, screenY);
    const grid = this.worldToGrid(wp.x, wp.y);
    if (grid.r < 0 || grid.r >= this.map.rows || grid.c < 0 || grid.c >= this.map.cols) return null;
    return grid;
  }

  depth(r: number, c: number): number { return r + c; }

  focusOnGrid(r: number, c: number) {
    const wp = this.gridToWorld(r, c);
    this.camera.focusOn(wp.x, wp.y);
  }

  private bindCameraEvents() {
    const canvas = pixiApp.app.canvas as HTMLCanvasElement;
    if (!canvas) return;

    // 右键/中键拖拽 → 平移
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) {
        this.camera.startDrag(e.clientX, e.clientY);
        e.preventDefault();
      }
    });
    canvas.addEventListener('mousemove', (e) => {
      this.camera.updateDrag(e.clientX, e.clientY);
    });
    canvas.addEventListener('mouseup', () => {
      this.camera.endDrag();
    });

    // 鼠标离开画布时结束拖拽
    canvas.addEventListener('mouseleave', () => {
      this.camera.endDrag();
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
      this.camera.zoom(e.deltaY, e.clientX, e.clientY);
      e.preventDefault();
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 窗口失焦时安全结束拖拽
    window.addEventListener('blur', () => {
      this.camera.endDrag();
    });
  }

  /** 计算地图边界框（所有 tile 的极值，含 tile 半尺寸边缘） */
  getMapBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const hw = this.iso.halfTileW;
    const hh = this.iso.halfTileH;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const pos = this.gridToWorld(r, c);
        minX = Math.min(minX, pos.x - hw);
        minY = Math.min(minY, pos.y - hh);
        maxX = Math.max(maxX, pos.x + hw);
        maxY = Math.max(maxY, pos.y + hh);
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /** 自动缩放并居中显示整个地图 */
  fitMapToView(padding: number = 60) {
    const bounds = this.getMapBounds();
    this.camera.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, padding);
  }

  sortEntities() {
    const children = this.entityLayer.children.slice();
    children.sort((a, b) => {
      return ((a as any)._depth ?? 0) - ((b as any)._depth ?? 0);
    });
    for (let i = 0; i < children.length; i++) {
      this.entityLayer.setChildIndex(children[i], i);
    }
  }

  destroy() {
    this.camera.destroy();
    window.removeEventListener('resize', this.handleResize);
    pixiApp.world.removeChild(this.groundLayer);
    pixiApp.world.removeChild(this.entityLayer);
    pixiApp.world.removeChild(this.effectLayer);
  }

  private handleResize = () => {
    this.camera.updateViewSize(pixiApp.width, pixiApp.height);
    this.fitMapToView(80);
  };
}
