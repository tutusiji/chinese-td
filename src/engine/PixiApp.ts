import { Application, Container } from 'pixi.js';

/**
 * PixiJS 应用单例 — 封装 WebGL 渲染器初始化
 */
class PixiApp {
  app: Application;
  /** 世界根容器 — 所有等距实体挂载于此，受相机控制 */
  world: Container;
  /** UI 叠加层 (固定在屏幕上，不受相机影响) */
  uiLayer: Container;

  private constructor() {
    this.app = new Application();
    this.world = new Container();
    this.world.label = 'world';
    this.uiLayer = new Container();
    this.uiLayer.label = 'ui';
  }

  /** 初始化渲染器 */
  async init(canvasContainerId: string, bgColor: string = '#1a1410') {
    const container = document.getElementById(canvasContainerId);
    const width = container?.clientWidth || 1100;
    const height = container?.clientHeight || 800;

    await this.app.init({
      width,
      height,
      background: bgColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (container) {
      const canvas = this.app.canvas as HTMLCanvasElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);
    }

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      if (container) {
        const w = container.clientWidth || 1100;
        const h = container.clientHeight || 800;
        this.app.renderer.resize(w, h);
      }
    });

    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.uiLayer);
    return this.app;
  }

  /** 获取画布尺寸 */
  get width(): number { return this.app.screen.width; }
  get height(): number { return this.app.screen.height; }

  /** 添加 ticker 回调 */
  onTick(fn: (ticker: any) => void) {
    this.app.ticker.add(fn);
  }

  static instance: PixiApp;
  static getInstance(): PixiApp {
    if (!PixiApp.instance) {
      PixiApp.instance = new PixiApp();
    }
    return PixiApp.instance;
  }
}

export const pixiApp = PixiApp.getInstance();
