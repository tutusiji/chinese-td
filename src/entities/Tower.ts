import { TowerType } from '../types/game';
import { TOWER_TYPES } from '../config/towers';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';

export class Tower {
  r: number;
  c: number;
  type: TowerType;
  level: number = 1;
  cd: number = 0;
  range: number;
  /** 等距世界坐标 (运行时注入) */
  worldX: number = 0;
  worldY: number = 0;
  /** 本帧刚刚开火，供渲染器触发攻击动画 (渲染器读取后自行重置) */
  justFired: boolean = false;

  constructor(r: number, c: number, type: TowerType) {
    this.r = r;
    this.c = c;
    this.type = type;
    this.range = TOWER_TYPES[type].r;
  }

  /** 帧更新：索敌 + 发射 */
  update(enemies: Enemy[], addBullet: (bullet: Bullet) => void, speedMultiplier: number) {
    if (this.cd > 0) {
      this.cd = Math.max(0, this.cd - speedMultiplier);
      return;
    }

    const tx = this.worldX;
    const ty = this.worldY;
    let best: Enemy | null = null;
    let bestScore = -Infinity;

    for (const e of enemies) {
      const dx = e.x - tx;
      const dy = e.y - ty;
      const d = dx * dx + dy * dy;
      if (d < this.range * this.range) {
        const distance = Math.sqrt(d);
        let score = e.progress * 1000 - distance * 0.8;
        if (this.type === 'arrow' && e.t === 'horse') score += 350;
        if (this.type === 'ice' && e.frozen <= 0) score += 280;
        if (this.type === 'cannon' && e.t !== 'horse') score += 120;
        if (score > bestScore) {
          bestScore = score;
          best = e;
        }
      }
    }

    if (best) {
      const tp = TOWER_TYPES[this.type];
      let damage = tp.d * (1 + (this.level - 1) * 0.5);
      if (this.type === 'arrow' && best.t === 'horse') damage *= 1.35;
      const bullet = new Bullet(tx, ty, this.type, damage, best, this.level);
      addBullet(bullet);
      this.cd = tp.cd;
      this.justFired = true;
    }
  }

  upgrade(): { success: boolean; cost: number } {
    const tp = TOWER_TYPES[this.type];
    const cost = Math.floor(tp.c * (this.level + 1) * 0.8);
    this.level++;
    this.range = tp.r * (1 + (this.level - 1) * 0.08);
    return { success: true, cost };
  }
}
