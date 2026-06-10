import { TowerType, GridCellType, GameMode, MapDefinition, AttackFormation, SpawnQueueItem } from '../types/game';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Particle } from '../entities/Particle';
import { Castle } from '../entities/Castle';
import { TOWER_TYPES } from '../config/towers';
import { ENEMY_TYPES } from '../config/enemies';
import { MAPS, DEFAULT_MAP_ID } from '../config/maps';

export class GameStore {
  // ==========================================
  // 核心数值状态
  // ==========================================
  gold: number = 200;
  hp: number = 20;
  wave: number = 0;
  waveCD: number = 0;
  totalSpawned: number = 0;
  spawnedCount: number = 0;
  gameOver: boolean = false;
  gameWon: boolean = false;
  gameMode: GameMode = 'defense';
  sessionStarted: boolean = false;

  // ==========================================
  // 地图相关
  // ==========================================
  currentMapId: string = DEFAULT_MAP_ID;
  currentMap: MapDefinition = MAPS[DEFAULT_MAP_ID];
  cols: number = 12;
  rows: number = 8;
  cellSize: number = 64;

  // ==========================================
  // 实体集合
  // ==========================================
  towers: Tower[] = [];
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  spawnQueue: SpawnQueueItem[] = [];
  castle: Castle | null = null;

  // ==========================================
  // 攻城模式
  // ==========================================
  supply: number = 200;
  maxSupply: number = 200;
  attackFormation: AttackFormation = { sword: 0, spear: 0, horse: 0 };

  // ==========================================
  // 地图单元格占用网格
  // ==========================================
  grid: GridCellType[][] = [];

  // ==========================================
  // 系统参数
  // ==========================================
  gameSpeed: number = 1;
  soundEnabled: boolean = true;

  // ==========================================
  // UI 交互临时状态
  // ==========================================
  selectedType: TowerType | null = null;
  selectedTower: Tower | null = null;

  // ==========================================
  // 观察者队列
  // ==========================================
  private listeners: Set<(store: GameStore) => void> = new Set();

  constructor() {
    this.reset();
  }

  // ==========================================
  // 观察者模式
  // ==========================================
  subscribe(listener: (store: GameStore) => void): () => void {
    this.listeners.add(listener);
    listener(this);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  // ==========================================
  // 状态突变动作
  // ==========================================

  beginSession() {
    this.sessionStarted = true;
  }

  endSession() {
    this.sessionStarted = false;
    this.gameOver = false;
    this.gameWon = false;
    this.wave = 0;
    this.waveCD = 0;
    this.totalSpawned = 0;
    this.spawnedCount = 0;
    this.selectedType = null;
    this.selectedTower = null;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnQueue = [];
    this.notify();
  }

  /** 重置游戏 (使用当前已选的地图和模式) */
  reset() {
    const map = this.currentMap;

    this.gold = map.defenseGold;
    this.hp = map.castleHp;
    this.wave = 0;
    this.waveCD = 0;
    this.totalSpawned = 0;
    this.spawnedCount = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.selectedType = null;
    this.selectedTower = null;
    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnQueue = [];
    this.cols = map.cols;
    this.rows = map.rows;
    this.cellSize = map.cellSize;

    if (this.gameMode === 'attack') {
      this.supply = map.attackSupply;
      this.maxSupply = map.attackSupply;
      this.attackFormation = { sword: 0, spear: 0, horse: 0 };
    }

    // 初始化网格
    this.initGrid(map);

    // 创建城池
    this.castle = new Castle(
      map.castleGrid.r,
      map.castleGrid.c,
      map.castleHp,
      map.wallGrids,
      map.name
    );

    this.notify();
  }

  /** 选择地图 */
  selectMap(mapId: string) {
    if (!MAPS[mapId]) return;
    this.currentMapId = mapId;
    this.currentMap = MAPS[mapId];
  }

  /** 设置游戏模式 */
  setGameMode(mode: GameMode) {
    this.gameMode = mode;
    this.notify();
  }

  /** 初始化网格 */
  private initGrid(map: MapDefinition) {
    this.grid = [];
    for (let r = 0; r < map.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < map.cols; c++) {
        this.grid[r][c] = null;
      }
    }

    // 标记路径
    for (const path of map.paths) {
      for (const pt of path) {
        this.grid[pt.r][pt.c] = 'path';
      }
    }

    // 标记出生点
    for (const sp of map.spawnPoints) {
      this.grid[sp.r][sp.c] = 'start';
    }

    // 标记城池
    this.grid[map.castleGrid.r][map.castleGrid.c] = 'castle';
    for (const wg of map.wallGrids) {
      this.grid[wg.r][wg.c] = 'wall';
    }

    // 标记路径末端为 end (每条路径最后一个点)
    for (const path of map.paths) {
      if (path.length > 0) {
        const last = path[path.length - 1];
        this.grid[last.r][last.c] = 'end';
      }
    }

    // 标记可建造区。地图配置是关卡设计的一部分，不能让玩家随意铺满非路径格。
    for (const bz of map.buildableZone) {
      if (this.grid[bz.r]?.[bz.c] === null) {
        this.grid[bz.r][bz.c] = 'buildable';
      }
    }

    for (const terrain of map.terrain ?? []) {
      if (terrain.type !== 'grass' && this.grid[terrain.r]?.[terrain.c] === 'buildable') {
        this.grid[terrain.r][terrain.c] = 'blocked';
      }
    }
  }

  /** 检查某格是否可建造防御塔 */
  canBuildAt(r: number, c: number): boolean {
    const cell = this.grid[r]?.[c];
    return cell === 'buildable';
  }

  // 选择兵器谱中的塔类型
  selectTowerType(type: TowerType | null) {
    this.selectedType = type;
    this.selectedTower = null;
    this.notify();
  }

  // 选中地图上的塔实例
  selectTowerInstance(tower: Tower | null) {
    this.selectedTower = tower;
    this.selectedType = null;
    this.notify();
  }

  // 建造新塔
  buildTower(r: number, c: number, type: TowerType): { success: boolean; tower?: Tower } {
    const cost = this.getTowerCost(type);
    if (this.gold >= cost && this.canBuildAt(r, c)) {
      this.gold -= cost;
      const newTower = new Tower(r, c, type);
      this.towers.push(newTower);
      this.grid[r][c] = 'tower';
      this.notify();
      return { success: true, tower: newTower };
    }
    return { success: false };
  }

  // 升级塔
  upgradeTower(tower: Tower): boolean {
    const cost = this.getTowerUpgradeCost(tower);
    if (this.gold >= cost) {
      this.gold -= cost;
      tower.upgrade();
      this.notify();
      return true;
    }
    return false;
  }

  // 拆除塔
  sellTower(tower: Tower) {
    const refund = this.getTowerSellRefund(tower);
    this.gold += refund;
    this.grid[tower.r][tower.c] = 'buildable';
    this.towers = this.towers.filter(t => t !== tower);
    if (this.selectedTower === tower) {
      this.selectedTower = null;
    }
    this.notify();
  }

  // 倍速
  setSpeed(speed: number) {
    this.gameSpeed = speed;
    this.notify();
  }

  // 静音
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.notify();
  }

  // ==========================================
  // 攻城模式专用
  // ==========================================

  /** 设置攻城兵力配置 */
  setAttackFormation(type: 'sword' | 'spear' | 'horse', count: number) {
    this.attackFormation[type] = Math.max(0, count);
    this.notify();
  }

  /** 计算当前编队消耗的总 supply */
  getFormationSupplyCost(): number {
    return (
      this.attackFormation.sword * ENEMY_TYPES.sword.supply +
      this.attackFormation.spear * ENEMY_TYPES.spear.supply +
      this.attackFormation.horse * ENEMY_TYPES.horse.supply
    );
  }

  /** 消耗 supply 发起一波进攻 */
  canSendWave(): boolean {
    const cost = this.getFormationSupplyCost();
    return cost > 0 && cost <= this.supply;
  }

  // ==========================================
  // 数值计算辅助方法
  // ==========================================

  getTowerCost(type: TowerType): number {
    return TOWER_TYPES[type]?.c || 0;
  }

  getTowerUpgradeCost(tower: Tower): number {
    const baseCost = this.getTowerCost(tower.type);
    return Math.floor(baseCost * (tower.level + 1) * 0.8);
  }

  getTowerSellRefund(tower: Tower): number {
    const baseCost = this.getTowerCost(tower.type);
    return Math.floor(baseCost * tower.level * 0.5);
  }

  // ==========================================
  // 存档 (通过 Server API → SQLite)
  // ==========================================

  async saveGame(slot: string = 'auto') {
    const label = `${this.currentMap.name || this.currentMapId} - ${this.gameMode === 'defense' ? '守城' : '攻城'} W${this.wave}`;
    try {
      await fetch(`/api/saves/${slot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          mapId: this.currentMapId,
          mode: this.gameMode,
          gold: this.gold,
          castleHp: this.castle?.hp ?? this.hp,
          wave: this.wave,
          waveCd: this.waveCD,
          spawnedCount: this.spawnedCount,
          totalSpawned: this.totalSpawned,
          gameSpeed: this.gameSpeed,
          towers: this.towers.map(t => ({ r: t.r, c: t.c, type: t.type, level: t.level })),
          attackFormation: this.attackFormation,
          supply: this.supply,
        }),
      });
    } catch { /* 服务端不可用时静默失败 */ }
  }

  async loadGame(slot: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/saves/${slot}`);
      if (!res.ok) return false;
      const save = await res.json();
      if (!save) return false;

      this.selectMap(save.mapId);
      this.setGameMode(save.mode);
      this.gold = save.gold;
      this.hp = save.castleHp;
      this.wave = save.wave;
      this.waveCD = save.waveCd;
      this.spawnedCount = save.spawnedCount;
      this.totalSpawned = save.totalSpawned;
      this.gameSpeed = save.gameSpeed;
      this.attackFormation = save.attackFormation ?? { sword: 0, spear: 0, horse: 0 };
      this.supply = save.supply ?? this.maxSupply;
      this.gameOver = false;
      this.gameWon = false;

      this.towers = [];
      for (const t of save.towers) {
        const tower = new Tower(t.r, t.c, t.type as any);
        tower.level = t.level;
        this.towers.push(tower);
      }

      return true;
    } catch { return false; }
  }
}

export const gameStore = new GameStore();
export type gameStoreType = GameStore;
