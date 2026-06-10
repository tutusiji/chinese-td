import { gameStore } from '../store/GameStore';
import { MAX_PARTICLES, WAVE_CD_FRAMES, PRE_GAME_CD_FRAMES } from '../config';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Particle } from '../entities/Particle';
import { EnemyType } from '../types/game';
import { getDefenseWave } from '../config/waves';
import {
  playCoinSound, playHurtSound, playVictorySound, playDefeatSound
} from '../ui/sound';

/** 全局 IsoWorld 引用 (main.ts 注入) */
let isoWorldRef: any = null;

export function setIsoWorld(w: any) { isoWorldRef = w; }
export function getIsoWorld() { return isoWorldRef; }

export class GameManager {
  addParticles(x: number, y: number, r: number, g: number, b: number, count: number) {
    for (let i = 0; i < count && gameStore.particles.length < MAX_PARTICLES; i++) {
      gameStore.particles.push(new Particle(x, y, r, g, b));
    }
  }

  /** 守城 — 刷一波敌兵 */
  private queueDefenseWave(wave: number) {
    const map = gameStore.currentMap;
    const paths = map.paths;
    const def = getDefenseWave(wave);
    let total = 0;
    const queue = [];

    for (const spawn of def.spawns) {
      const interval = spawn.interval ?? 20;
      const baseDelay = spawn.delay ?? 0;
      for (let i = 0; i < spawn.count; i++) {
        const pathIndex = spawn.path ?? ((total + i) % paths.length);
        queue.push({
          type: spawn.type,
          wave,
          pathIndex,
          delay: baseDelay + i * interval,
        });
      }
      total += spawn.count;
    }

    gameStore.spawnQueue = queue.sort((a, b) => a.delay - b.delay);
    gameStore.totalSpawned = total;
    gameStore.spawnedCount = 0;
  }

  private releaseQueuedEnemies(stepMultiplier: number) {
    const map = gameStore.currentMap;
    const world = isoWorldRef;
    if (!world || gameStore.spawnQueue.length === 0) return;

    for (const item of gameStore.spawnQueue) {
      item.delay -= stepMultiplier;
    }

    while (gameStore.spawnQueue.length > 0 && gameStore.spawnQueue[0].delay <= 0) {
      const item = gameStore.spawnQueue.shift()!;
      const path = map.paths[item.pathIndex % map.paths.length];
      const worldPath = path.map(pt => world.gridToWorld(pt.r, pt.c, 0));
      gameStore.enemies.push(new Enemy(item.type as EnemyType, item.wave, worldPath));
    }
  }

  /** 攻城 — 发兵 */
  spawnAttackWave() {
    const map = gameStore.currentMap;
    const paths = map.paths;
    const world = isoWorldRef;
    if (!world) return;

    const formation = gameStore.attackFormation;
    const enemies: Enemy[] = [];

    const addType = (type: EnemyType, count: number) => {
      for (let i = 0; i < count; i++) {
        const pathIndex = i % paths.length;
        const worldPath = paths[pathIndex].map((pt: { r: number; c: number }) =>
          world.gridToWorld(pt.r, pt.c, 0)
        );
        enemies.push(new Enemy(type, gameStore.wave || 1, worldPath));
      }
    };

    addType('sword', formation.sword);
    addType('spear', formation.spear);
    addType('horse', formation.horse);

    const cost = gameStore.getFormationSupplyCost();
    gameStore.supply -= cost;
    gameStore.attackFormation = { sword: 0, spear: 0, horse: 0 };
    gameStore.enemies.push(...enemies);
    gameStore.totalSpawned = enemies.length;
    gameStore.spawnedCount = 0;
    gameStore.notify();
  }

  private tickFrame(stepMultiplier: number) {
    const map = gameStore.currentMap;

    this.releaseQueuedEnemies(stepMultiplier);

    // 粒子
    for (let i = gameStore.particles.length - 1; i >= 0; i--) {
      if (gameStore.particles[i].update(stepMultiplier)) {
        gameStore.particles.splice(i, 1);
      }
    }

    // 敌兵
    for (let i = gameStore.enemies.length - 1; i >= 0; i--) {
      const e = gameStore.enemies[i];
      const { reachedEnd, dead } = e.update(stepMultiplier);

      if (reachedEnd) {
        if (gameStore.castle) {
          gameStore.castle.takeDamage(1);
          this.addParticles(e.x, e.y, 180, 50, 40, 6);
          playHurtSound();
          if (gameStore.castle.isDestroyed()) {
            if (gameStore.gameMode === 'defense') {
              gameStore.gameOver = true;
              playDefeatSound();
            } else {
              gameStore.gameWon = true;
              playVictorySound();
            }
          }
        }
        gameStore.enemies.splice(i, 1);
        gameStore.spawnedCount++;
        continue;
      }

      if (dead) {
        gameStore.gold += e.rw;
        gameStore.enemies.splice(i, 1);
        gameStore.spawnedCount++;
        this.addParticles(e.x, e.y, 200, 160, 60, 5);
        playCoinSound();
      }
    }

    // 防御塔
    const addBullet = (bullet: Bullet) => { gameStore.bullets.push(bullet); };
    for (const t of gameStore.towers) {
      t.update(gameStore.enemies, addBullet, stepMultiplier);
    }

    // 子弹
    for (let i = gameStore.bullets.length - 1; i >= 0; i--) {
      const b = gameStore.bullets[i];
      const { hit, destroy } = b.update(stepMultiplier, gameStore.enemies);
      if (hit) this.addParticles(b.x, b.y, 255, 200, 100, 3);
      if (destroy) gameStore.bullets.splice(i, 1);
    }

    // 波次管理
    if (gameStore.gameMode === 'defense') {
      this.tickDefenseWaves(stepMultiplier, map.defenseWaves);
    } else {
      this.tickAttackWaves();
    }
  }

  private tickDefenseWaves(stepMultiplier: number, totalWaves: number) {
    if (gameStore.wave > 0 &&
        gameStore.spawnQueue.length === 0 &&
        gameStore.spawnedCount >= gameStore.totalSpawned &&
        gameStore.enemies.length === 0) {
      if (gameStore.wave >= totalWaves) {
        gameStore.gameWon = true;
        playVictorySound();
        return;
      }
      gameStore.waveCD += stepMultiplier;
      if (gameStore.waveCD >= WAVE_CD_FRAMES) {
        this.startNextDefenseWave();
      }
    } else if (gameStore.wave === 0 && gameStore.enemies.length === 0 && !gameStore.gameOver) {
      gameStore.waveCD += stepMultiplier;
      if (gameStore.waveCD >= PRE_GAME_CD_FRAMES) {
        this.startNextDefenseWave();
      }
    }
  }

  startNextDefenseWave(earlyReward: boolean = false) {
    const totalWaves = gameStore.currentMap.defenseWaves;
    if (gameStore.gameMode !== 'defense' || gameStore.wave >= totalWaves) return false;
    if (gameStore.enemies.length > 0 || gameStore.spawnQueue.length > 0) return false;
    if (gameStore.wave > 0 && gameStore.spawnedCount < gameStore.totalSpawned) return false;

    if (earlyReward && gameStore.wave > 0) {
      gameStore.gold += this.getRushReward();
      playCoinSound();
    }

    gameStore.waveCD = 0;
    gameStore.wave++;
    this.queueDefenseWave(gameStore.wave);
    gameStore.notify();
    return true;
  }

  getRushReward(): number {
    return 12 + gameStore.wave * 4;
  }

  private tickAttackWaves() {
    if (gameStore.enemies.length === 0 &&
        gameStore.totalSpawned > 0 &&
        gameStore.supply <= 0 &&
        gameStore.getFormationSupplyCost() === 0) {
      gameStore.gameOver = true;
      playDefeatSound();
    }
  }

  /** 攻城模式 — 初始化 AI 防守塔 */
  initAIDefense() {
    const layout = gameStore.currentMap.aiDefenseLayout;
    for (const slot of layout) {
      const { success } = gameStore.buildTower(slot.r, slot.c, slot.type);
      if (success) {
        const tower = gameStore.towers[gameStore.towers.length - 1];
        for (let i = 1; i < slot.level; i++) tower.upgrade();
      }
    }
    // 同步塔的世界坐标
    this.syncTowerPositions();
  }

  /** 将所有塔的 worldX/worldY 同步到当前 IsoWorld */
  syncTowerPositions() {
    const world = isoWorldRef;
    if (!world) return;
    for (const t of gameStore.towers) {
      const pos = world.gridToWorld(t.r, t.c, 0);
      t.worldX = pos.x;
      t.worldY = pos.y;
    }
  }

  update() {
    if (!gameStore.sessionStarted) return;
    if (gameStore.gameOver || gameStore.gameWon) return;
    if (gameStore.gameSpeed > 0) {
      this.tickFrame(gameStore.gameSpeed);
      gameStore.notify();
    }
  }
}

export const gameManager = new GameManager();
