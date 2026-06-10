import { Position } from '../types/game';

export class Castle {
  gridR: number;
  gridC: number;
  hp: number;
  maxHp: number;
  wallGrids: Position[];
  wallHp: number[];
  wallMaxHp: number[];
  name: string;

  constructor(r: number, c: number, maxHp: number, walls: Position[], name: string) {
    this.gridR = r;
    this.gridC = c;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.wallGrids = walls;
    this.wallHp = walls.map(() => 50);
    this.wallMaxHp = walls.map(() => 50);
    this.name = name;
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  repair(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  damageWall(index: number, amount: number): boolean {
    if (index < 0 || index >= this.wallHp.length) return true;
    this.wallHp[index] = Math.max(0, this.wallHp[index] - amount);
    return this.wallHp[index] <= 0;
  }

  hasWallsAlive(): boolean {
    return this.wallHp.some(hp => hp > 0);
  }

  isDestroyed(): boolean {
    return this.hp <= 0;
  }
}
