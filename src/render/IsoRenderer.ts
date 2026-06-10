import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IsoWorld } from '../engine/IsoWorld';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Castle } from '../entities/Castle';
import { Bullet } from '../entities/Bullet';
import { TOWER_TYPES } from '../config/towers';
import { ENEMY_TYPES } from '../config/enemies';

/**
 * 等距渲染器 — 管理所有游戏实体的 PixiJS 精灵
 *
 * 每个实体对应一个 PixiJS Graphics 对象。
 * 每帧调用 sync() 将实体逻辑状态同步到渲染位置。
 */
export class IsoRenderer {
  private world: IsoWorld;

  // 精灵映射
  private towerSprites: Map<Tower, Container> = new Map();
  private enemySprites: Map<Enemy, Container> = new Map();
  private bulletSprites: Map<Bullet, Graphics> = new Map();
  private castleSprite: Container | null = null;

  // 高亮图形
  private rangeCircle: Graphics | null = null;
  // private hoverTile: Graphics | null = null;

  constructor(world: IsoWorld) {
    this.world = world;
  }

  // ==========================================
  // 塔精灵
  // ==========================================
  createTowerSprite(tower: Tower): Container {
    const container = new Container();
    const pos = this.world.gridToWorld(tower.r, tower.c);
    container.position.set(pos.x, pos.y);
    (container as any)._depth = this.world.depth(tower.r, tower.c);

    const config = TOWER_TYPES[tower.type];

    // 塔基座
    const base = new Graphics();
    base.moveTo(0, -14);
    base.lineTo(20, -4);
    base.lineTo(0, 8);
    base.lineTo(-20, -4);
    base.closePath();
    base.fill({ color: 0x3b342b, alpha: 1 });
    base.stroke({ color: 0xb89758, width: 1, alpha: 0.45 });
    container.addChild(base);

    // 塔身 (根据等级决定高度)
    for (let i = 0; i < tower.level; i++) {
      const layer = new Graphics();
      const sz = 14 - i * 2;
      const yo = -20 - i * 14;
      layer.rect(-sz * 1.15, yo, sz * 2.3, 6);
      layer.fill({ color: 0x211b18, alpha: 1 });
      container.addChild(layer);

      const body = new Graphics();
      const bodyColor = parseInt(config.cl.replace('#', ''), 16);
      body.rect(-sz, yo + 6, sz * 2, 10);
      body.fill({ color: bodyColor, alpha: 1 });
      body.stroke({ color: 0xf1d38a, width: 1, alpha: 0.25 });
      container.addChild(body);
    }

    if (tower.type === 'arrow') {
      const bow = new Graphics();
      bow.arc(0, -38 - tower.level * 9, 13, -1.2, 1.2);
      bow.stroke({ color: 0xe5c06a, width: 2, alpha: 0.95 });
      bow.moveTo(6, -49 - tower.level * 9);
      bow.lineTo(6, -27 - tower.level * 9);
      bow.stroke({ color: 0xdcc8a0, width: 1, alpha: 0.8 });
      container.addChild(bow);
    } else if (tower.type === 'cannon') {
      const barrel = new Graphics();
      barrel.rect(-5, -48 - tower.level * 8, 10, 24);
      barrel.fill({ color: 0x241a14, alpha: 1 });
      barrel.stroke({ color: 0xc8a03c, width: 1, alpha: 0.35 });
      barrel.rotation = -0.35;
      container.addChild(barrel);
    } else if (tower.type === 'ice') {
      const core = new Graphics();
      core.circle(0, -40 - tower.level * 8, 11);
      core.fill({ color: 0x9fd8ff, alpha: 0.28 });
      core.stroke({ color: 0xbbe7ff, width: 2, alpha: 0.65 });
      core.moveTo(0, -54 - tower.level * 8);
      core.lineTo(0, -26 - tower.level * 8);
      core.moveTo(-12, -40 - tower.level * 8);
      core.lineTo(12, -40 - tower.level * 8);
      core.stroke({ color: 0xd7f3ff, width: 1, alpha: 0.75 });
      container.addChild(core);
    }

    // 宝顶
    const peak = new Graphics();
    peak.moveTo(0, -32 - tower.level * 10);
    peak.lineTo(-6, -20 - tower.level * 8);
    peak.lineTo(6, -20 - tower.level * 8);
    peak.closePath();
    peak.fill({ color: 0xc8a03c, alpha: 1 });
    container.addChild(peak);

    container.label = `tower_${tower.r}_${tower.c}`;
    this.world.entityLayer.addChild(container);
    this.towerSprites.set(tower, container);
    return container;
  }

  removeTowerSprite(tower: Tower) {
    const sprite = this.towerSprites.get(tower);
    if (sprite) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy({ children: true });
      this.towerSprites.delete(tower);
    }
  }

  // ==========================================
  // 敌兵精灵
  // ==========================================
  createEnemySprite(enemy: Enemy): Container {
    const container = new Container();
    const ed = ENEMY_TYPES[enemy.t];
    const color = parseInt(ed.cl.replace('#', ''), 16);

    // 阴影
    const shadow = new Graphics();
    shadow.ellipse(0, 4, 10, 6);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    // 身体
    const body = new Graphics();
    const shape = enemy.t === 'spear' ? 'diamond' : 'circle';
    if (shape === 'diamond') {
      body.moveTo(0, -enemy.sz / 2);
      body.lineTo(enemy.sz / 2, 0);
      body.lineTo(0, enemy.sz / 2);
      body.lineTo(-enemy.sz / 2, 0);
      body.closePath();
    } else {
      body.circle(0, 0, enemy.sz);
    }
    body.fill({ color, alpha: 1 });
    body.stroke({ color: 0x24170f, width: 1, alpha: 0.65 });
    container.addChild(body);

    const head = new Graphics();
    head.circle(0, -enemy.sz * 0.72, Math.max(4, enemy.sz * 0.32));
    head.fill({ color: 0x2a2118, alpha: 1 });
    container.addChild(head);

    if (enemy.t === 'sword') {
      const blade = new Graphics();
      blade.rect(enemy.sz * 0.45, -enemy.sz, 3, enemy.sz * 1.2);
      blade.fill({ color: 0xdcc8a0, alpha: 0.85 });
      blade.rotation = -0.35;
      container.addChild(blade);
    }

    if (enemy.t === 'spear') {
      const spear = new Graphics();
      spear.moveTo(enemy.sz * 0.55, -enemy.sz * 1.25);
      spear.lineTo(enemy.sz * 0.9, enemy.sz * 0.55);
      spear.stroke({ color: 0xdcc8a0, width: 2, alpha: 0.9 });
      spear.moveTo(enemy.sz * 0.55, -enemy.sz * 1.35);
      spear.lineTo(enemy.sz * 0.38, -enemy.sz * 1.05);
      spear.lineTo(enemy.sz * 0.72, -enemy.sz * 1.05);
      spear.closePath();
      spear.fill({ color: 0xe8d8c8, alpha: 0.9 });
      container.addChild(spear);
    }

    // 骑兵额外装饰
    if (enemy.t === 'horse') {
      const crest = new Graphics();
      crest.moveTo(0, -enemy.sz / 2);
      crest.lineTo(-4, 0);
      crest.lineTo(4, 0);
      crest.closePath();
      crest.fill({ color: 0xc8a03c, alpha: 1 });
      container.addChild(crest);

      const horseMark = new Graphics();
      horseMark.rect(-enemy.sz * 0.8, enemy.sz * 0.35, enemy.sz * 1.6, 4);
      horseMark.fill({ color: 0x2c1a10, alpha: 0.8 });
      container.addChild(horseMark);
    }

    const frost = new Graphics();
    frost.label = 'frost';
    frost.circle(0, 0, enemy.sz + 4);
    frost.stroke({ color: 0xbbe7ff, width: 2, alpha: 0 });
    container.addChild(frost);

    // 血条
    const hpBar = new Graphics();
    hpBar.label = 'hpBar';
    hpBar.rect(-12, -enemy.sz - 10, 24, 4);
    hpBar.fill({ color: 0x280a0a, alpha: 1 });
    container.addChild(hpBar);

    const hpFill = new Graphics();
    hpFill.label = 'hpFill';
    const pct = enemy.hp / enemy.maxHp;
    const hpColor = pct > 0.5 ? 0x5b8c5a : pct > 0.25 ? 0xc9a44b : 0xc43a31;
    hpFill.rect(-12, -enemy.sz - 10, 24 * pct, 4);
    hpFill.fill({ color: hpColor, alpha: 1 });
    container.addChild(hpFill);

    container.label = `enemy_${enemy.t}`;
    this.world.entityLayer.addChild(container);
    this.enemySprites.set(enemy, container);
    return container;
  }

  removeEnemySprite(enemy: Enemy) {
    const sprite = this.enemySprites.get(enemy);
    if (sprite) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy({ children: true });
      this.enemySprites.delete(enemy);
    }
  }

  // ==========================================
  // 子弹精灵
  // ==========================================
  createBulletSprite(bullet: Bullet): Graphics {
    const g = new Graphics();
    const isIce = bullet.type === 'ice';
    const isCannon = bullet.type === 'cannon';

    if (isIce) {
      g.circle(0, 0, 5);
      g.fill({ color: 0x96c8ff, alpha: 1 });
    } else if (isCannon) {
      g.circle(0, 0, 7);
      g.fill({ color: 0x3c2814, alpha: 1 });
      g.circle(0, 0, 3);
      g.fill({ color: 0xc8a03c, alpha: 0.8 });
    } else {
      g.moveTo(8, 0);
      g.lineTo(-4, -3);
      g.lineTo(-4, 3);
      g.closePath();
      g.fill({ color: 0xc8a03c, alpha: 1 });
    }

    this.world.entityLayer.addChild(g);
    this.bulletSprites.set(bullet, g);
    return g;
  }

  removeBulletSprite(bullet: Bullet) {
    const sprite = this.bulletSprites.get(bullet);
    if (sprite) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy();
      this.bulletSprites.delete(bullet);
    }
  }

  // ==========================================
  // 城池精灵
  // ==========================================
  createCastleSprite(castle: Castle): Container {
    const container = new Container();
    const pos = this.world.gridToWorld(castle.gridR, castle.gridC);
    container.position.set(pos.x, pos.y - 30);
    (container as any)._depth = this.world.depth(castle.gridR, castle.gridC);

    // 台基
    const base = new Graphics();
    base.rect(-28, -4, 56, 20);
    base.fill({ color: 0x41382d, alpha: 1 });
    container.addChild(base);

    // 城墙主体
    const body = new Graphics();
    body.rect(-24, -30, 48, 30);
    body.fill({ color: 0x504438, alpha: 1 });
    container.addChild(body);

    // 雉堞
    for (let i = 0; i < 5; i++) {
      const merlon = new Graphics();
      merlon.rect(-22 + i * 10, -38, 6, 10);
      merlon.fill({ color: 0x5a4c3e, alpha: 1 });
      container.addChild(merlon);
    }

    // 城门
    const gate = new Graphics();
    gate.rect(-7, -14, 14, 18);
    gate.fill({ color: 0x1e1a12, alpha: 1 });
    container.addChild(gate);

    // 飞檐城楼
    for (let i = 0; i < 2; i++) {
      const yOff = -46 - i * 20;
      const roof = new Graphics();
      roof.rect(-20 + i * 3, yOff, 34 - i * 6, 8);
      roof.fill({ color: 0x28221a + i * 0x040404, alpha: 1 });
      container.addChild(roof);

      const tower = new Graphics();
      tower.rect(-16 + i * 2, yOff + 8, 28 - i * 4, 12);
      tower.fill({ color: 0xc09030 + i * 0x101010, alpha: 1 });
      container.addChild(tower);
    }

    // 宝顶
    const peak = new Graphics();
    peak.moveTo(0, -76);
    peak.lineTo(-7, -58);
    peak.lineTo(7, -58);
    peak.closePath();
    peak.fill({ color: 0xc8a03c, alpha: 1 });
    container.addChild(peak);

    // 血条
    const hpBar = new Graphics();
    hpBar.label = 'castleHpBar';
    hpBar.rect(-24, -80, 48, 5);
    hpBar.fill({ color: 0x280a0a, alpha: 1 });
    container.addChild(hpBar);

    const hpFill = new Graphics();
    hpFill.label = 'castleHpFill';
    const pct = castle.hp / castle.maxHp;
    const hpColor = pct > 0.5 ? 0x5b8c5a : pct > 0.25 ? 0xc9a44b : 0xc43a31;
    hpFill.rect(-24, -80, 48 * pct, 5);
    hpFill.fill({ color: hpColor, alpha: 1 });
    container.addChild(hpFill);

    // 城名牌
    const style = new TextStyle({ fontSize: 10, fill: 0xdcc8a0, fontFamily: 'Noto Serif SC' });
    const label = new Text({ text: castle.name, style });
    label.anchor.set(0.5);
    label.position.set(0, -88);
    container.addChild(label);

    container.label = 'castle';
    this.world.entityLayer.addChild(container);
    this.castleSprite = container;
    return container;
  }

  // ==========================================
  // 同步 — 每帧调用
  // ==========================================
  sync(
    towers: Tower[],
    enemies: Enemy[],
    bullets: Bullet[],
    castle: Castle | null
  ) {
    // 清理已移除的实体
    for (const [tower, _sprite] of this.towerSprites) {
      if (!towers.includes(tower)) {
        this.removeTowerSprite(tower);
      }
    }
    for (const [enemy, _sprite] of this.enemySprites) {
      if (!enemies.includes(enemy)) {
        this.removeEnemySprite(enemy);
      }
    }
    for (const [bullet, _sprite] of this.bulletSprites) {
      if (!bullets.includes(bullet)) {
        this.removeBulletSprite(bullet);
      }
    }

    // 创建新精灵
    for (const t of towers) {
      if (!this.towerSprites.has(t)) this.createTowerSprite(t);
    }
    for (const e of enemies) {
      if (!this.enemySprites.has(e)) this.createEnemySprite(e);
    }
    for (const b of bullets) {
      if (!this.bulletSprites.has(b)) this.createBulletSprite(b);
    }

    // 更新城池
    if (castle && !this.castleSprite) {
      this.createCastleSprite(castle);
    }
    if (castle && this.castleSprite) {
      // 更新城池血条
      const hpFill = this.castleSprite.getChildByLabel('castleHpFill') as Graphics;
      if (hpFill) {
        const pct = castle.hp / castle.maxHp;
        hpFill.clear();
        hpFill.rect(-24, -80, 48 * pct, 5);
        const hpColor = pct > 0.5 ? 0x5b8c5a : pct > 0.25 ? 0xc9a44b : 0xc43a31;
        hpFill.fill({ color: hpColor, alpha: 1 });
      }
    }

    // 同步敌人位置
    for (const e of enemies) {
      const sprite = this.enemySprites.get(e);
      if (sprite) {
        sprite.position.set(e.x, e.y);
        (sprite as any)._depth = e.y; // 用 y 坐标作为深度

        // 更新血条
        const hpFill = sprite.getChildByLabel('hpFill') as Graphics;
        if (hpFill) {
          const pct = e.hp / e.maxHp;
          hpFill.clear();
          const hpColor = pct > 0.5 ? 0x5b8c5a : pct > 0.25 ? 0xc9a44b : 0xc43a31;
          hpFill.rect(-12, -e.sz - 10, 24 * pct, 4);
          hpFill.fill({ color: hpColor, alpha: 1 });
        }

        const frost = sprite.getChildByLabel('frost') as Graphics;
        if (frost) {
          frost.clear();
          if (e.frozen > 0) {
            frost.circle(0, 0, e.sz + 4);
            frost.stroke({ color: 0xbbe7ff, width: 2, alpha: 0.65 });
            sprite.tint = 0xbde8ff;
          } else {
            sprite.tint = 0xffffff;
          }
        }
      }
    }

    // 同步子弹位置
    for (const b of bullets) {
      const sprite = this.bulletSprites.get(b);
      if (sprite) {
        sprite.position.set(b.x, b.y);
        if (b.type === 'arrow' && b.target) {
          sprite.rotation = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        }
      }
    }

    // 深度排序
    this.world.sortEntities();
  }

  /** 显示射程预览圈 */
  showRangeCircle(worldX: number, worldY: number, range: number) {
    this.clearRangeCircle();
    this.rangeCircle = new Graphics();
    this.rangeCircle.circle(worldX, worldY, range);
    this.rangeCircle.stroke({ color: 0xffc832, width: 2, alpha: 0.5 });
    this.world.entityLayer.addChild(this.rangeCircle);
  }

  clearRangeCircle() {
    if (this.rangeCircle) {
      this.world.entityLayer.removeChild(this.rangeCircle);
      this.rangeCircle.destroy();
      this.rangeCircle = null;
    }
  }

  /** 销毁全部 */
  destroy() {
    for (const sprite of this.towerSprites.values()) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy({ children: true });
    }
    for (const sprite of this.enemySprites.values()) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy({ children: true });
    }
    for (const sprite of this.bulletSprites.values()) {
      this.world.entityLayer.removeChild(sprite);
      sprite.destroy();
    }
    this.towerSprites.clear();
    this.enemySprites.clear();
    this.bulletSprites.clear();
    this.clearRangeCircle();
  }
}
