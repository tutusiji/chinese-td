import { EnemyType } from '../types/game';
import { ETYPES } from '../config';

export class Enemy {
  t: EnemyType;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  sp: number;       // 世界空间移速 (像素/帧)
  rw: number;
  cl: string;
  sz: number;
  frozen: number = 0;
  pi: number = 0;

  /** 世界空间路径 (预转换的等距坐标点) */
  worldPath: { x: number; y: number }[];

  constructor(
    type: EnemyType,
    wave: number,
    worldPath: { x: number; y: number }[]
    
  ) {
    const ed = ETYPES[type];
    this.t = type;
    this.hp = ed.hp + wave * 10;
    this.maxHp = ed.hp + wave * 10;
    this.worldPath = worldPath;
    // 初始位置 = 路径起点
    this.x = worldPath[0]?.x ?? 0;
    this.y = worldPath[0]?.y ?? 0;
    this.sp = ed.sp * 1.5; // 等距世界空间移速调整
    this.rw = ed.rw;
    this.cl = ed.cl;
    this.sz = ed.sz;
  }

  get progress(): number {
    const total = Math.max(1, this.worldPath.length - 1);
    return this.pi / total;
  }

  /** 世界空间移动更新 */
  update(speedMultiplier: number): { reachedEnd: boolean; dead: boolean } {
    let reachedEnd = false;
    let dead = false;

    const sp = this.frozen > 0 ? this.sp * 0.3 : this.sp;
    if (this.frozen > 0) {
      this.frozen = Math.max(0, this.frozen - speedMultiplier);
    }

    let moveLeft = sp * speedMultiplier;

    while (moveLeft > 0 && this.pi < this.worldPath.length - 1) {
      const tgt = this.worldPath[this.pi + 1];
      const dx = tgt.x - this.x;
      const dy = tgt.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d <= moveLeft) {
        this.pi++;
        this.x = tgt.x;
        this.y = tgt.y;
        moveLeft -= d;
      } else {
        this.x += (dx / d) * moveLeft;
        this.y += (dy / d) * moveLeft;
        moveLeft = 0;
      }
    }

    if (this.pi >= this.worldPath.length - 1) {
      reachedEnd = true;
    }

    if (this.hp <= 0) {
      dead = true;
    }

    return { reachedEnd, dead };
  }
}
