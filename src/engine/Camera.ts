import { Container } from 'pixi.js';

/**
 * 等距相机 — 管理世界容器的平移和缩放
 */
export class Camera {
  world: Container;
  minScale: number = 0.4;
  maxScale: number = 2.0;
  scale: number = 1.0;
  targetX: number = 0;
  targetY: number = 0;

  private dragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private worldStartX: number = 0;
  private worldStartY: number = 0;

  /** 画布尺寸引用 */
  private viewW: number = 1200;
  private viewH: number = 800;

  constructor(world: Container, viewW: number = 1200, viewH: number = 800) {
    this.world = world;
    this.viewW = viewW;
    this.viewH = viewH;
  }

  /** 聚焦到指定世界坐标 */
  focusOn(worldX: number, worldY: number) {
    this.targetX = -(worldX * this.scale - this.viewW / 2);
    this.targetY = -(worldY * this.scale - this.viewH / 2);
    this.world.position.set(this.targetX, this.targetY);
    this.world.scale.set(this.scale);
  }

  /** 自动适配地图边界框到视图，居中显示 */
  fitBounds(minX: number, minY: number, maxX: number, maxY: number, padding: number = 60) {
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const availW = this.viewW - padding * 2;
    const availH = this.viewH - padding * 2;

    const scaleX = availW / contentW;
    const scaleY = availH / contentH;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.focusOn(centerX, centerY);
  }

  startDrag(screenX: number, screenY: number) {
    this.dragging = true;
    this.dragStartX = screenX;
    this.dragStartY = screenY;
    this.worldStartX = this.world.position.x;
    this.worldStartY = this.world.position.y;
  }

  updateDrag(screenX: number, screenY: number) {
    if (!this.dragging) return;
    this.world.position.set(
      this.worldStartX + (screenX - this.dragStartX),
      this.worldStartY + (screenY - this.dragStartY)
    );
  }

  endDrag() { this.dragging = false; }

  zoom(delta: number, centerX: number, centerY: number) {
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
    if (newScale === this.scale) return;

    const worldBeforeX = (centerX - this.world.position.x) / this.scale;
    const worldBeforeY = (centerY - this.world.position.y) / this.scale;
    this.scale = newScale;
    this.world.position.set(
      centerX - worldBeforeX * this.scale,
      centerY - worldBeforeY * this.scale
    );
    this.world.scale.set(this.scale);
  }

  updateViewSize(w: number, h: number) {
    this.viewW = w;
    this.viewH = h;
  }

  destroy() { this.dragging = false; }
}
