export class Particle {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  vx: number;
  vy: number;
  life: number = 18;
  maxL: number = 18;

  constructor(x: number, y: number, r: number, g: number, b: number) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.g = g;
    this.b = b;
    this.vx = Math.random() * 4 - 2;
    this.vy = Math.random() * 2.5 - 3;
  }

  update(speedMultiplier: number): boolean {
    this.life -= speedMultiplier;
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.vy += 0.1 * speedMultiplier;
    return this.life <= 0;
  }
}
