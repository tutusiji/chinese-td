import { Texture, Graphics } from 'pixi.js';

type AssetDrawFn = (g: Graphics, w: number, h: number, state?: Record<string, any>) => void;

/**
 * AssetManager — 素材注册中心 (PixiJS 版)
 *
 * 程序化生成纹理，后续替换为 Texture.from('sprites/xxx.png')
 */
class AssetManager {
  private registry: Map<string, AssetDrawFn> = new Map();

  register(key: string, drawFn: AssetDrawFn): void {
    this.registry.set(key, drawFn);
  }

  registerAll(entries: Record<string, AssetDrawFn>): void {
    for (const [key, fn] of Object.entries(entries)) {
      this.register(key, fn);
    }
  }

  generateTexture(key: string, w: number, h: number, state?: Record<string, any>): Texture {
    const fn = this.registry.get(key);
    const g = new Graphics();
    if (fn) {
      fn(g, w, h, state);
    } else {
      g.rect(0, 0, w, h);
      g.fill({ color: 0xff00ff, alpha: 1 });
    }
    return Texture.WHITE;
  }

  has(key: string): boolean { return this.registry.has(key); }
  clear(): void { this.registry.clear(); }
}

export const assetManager = new AssetManager();
