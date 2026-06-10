import { TowerType } from '../types/game';
import { Enemy } from './Enemy';

export class Bullet {
  x: number;
  y: number;
  type: TowerType;
  dmg: number;
  target: Enemy;
  cl: string;
  sp: number = 6;
  level: number;
  splashRadius: number = 0;
  slowRadius: number = 0;

  constructor(x: number, y: number, type: TowerType, dmg: number, target: Enemy, level: number = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.dmg = dmg;
    this.target = target;
    this.level = level;
    if (type === 'ice') this.cl = '#5b9ecf';
    else if (type === 'cannon') this.cl = '#8b6914';
    else this.cl = '#c43a31';
    if (type === 'cannon') this.splashRadius = 42 + level * 7;
    if (type === 'ice') this.slowRadius = 36 + level * 8;
  }

  update(speedMultiplier: number, enemies: Enemy[]): { hit: boolean; destroy: boolean } {
    if (!this.target || this.target.hp <= 0) {
      return { hit: false, destroy: true };
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const step = this.sp * speedMultiplier;

    if (d < step + 8) {
      if (this.type === 'cannon') {
        this.applySplash(enemies);
      } else if (this.type === 'ice') {
        this.applyFrost(enemies);
      } else {
        this.target.hp -= this.dmg;
      }
      return { hit: true, destroy: true };
    }

    this.x += (dx / d) * step;
    this.y += (dy / d) * step;

    // 超远距离出界判定
    const outOfBounds = d > 3000;
    return { hit: false, destroy: outOfBounds };
  }

  private applySplash(enemies: Enemy[]) {
    const r2 = this.splashRadius * this.splashRadius;
    for (const e of enemies) {
      const dx = e.x - this.target.x;
      const dy = e.y - this.target.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        const falloff = e === this.target ? 1 : 0.55;
        e.hp -= this.dmg * falloff;
      }
    }
  }

  private applyFrost(enemies: Enemy[]) {
    const r2 = this.slowRadius * this.slowRadius;
    for (const e of enemies) {
      const dx = e.x - this.target.x;
      const dy = e.y - this.target.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        e.frozen = Math.max(e.frozen, 50 + this.level * 8);
        e.hp -= e === this.target ? this.dmg : this.dmg * 0.35;
      }
    }
  }
}
