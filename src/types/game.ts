// ==========================================
// 游戏模式
// ==========================================
export type GameMode = 'defense' | 'attack';

// ==========================================
// 防御塔类型
// ==========================================
export type TowerType = 'arrow' | 'cannon' | 'ice';

// ==========================================
// 敌兵类型
// ==========================================
export type EnemyType = 'sword' | 'spear' | 'horse';

// ==========================================
// 地图网格单元格类型
// ==========================================
export type GridCellType = 'path' | 'start' | 'end' | 'tower' | 'wall' | 'castle' | 'buildable' | 'blocked' | null;

export type TerrainType = 'mountain' | 'grass' | 'tree' | 'river';

// ==========================================
// 行列网格位置坐标
// ==========================================
export interface Position {
  r: number;
  c: number;
}

// ==========================================
// 防御塔静态配置接口
// ==========================================
export interface TowerConfig {
  n: string;   // 名字
  c: number;   // 价格 (cost)
  r: number;   // 射程 (range)
  d: number;   // 基础攻击伤害 (damage)
  cd: number;  // 攻击冷却帧数 (cooldown)
  cl: string;  // 配色 (color hex)
  ic: string;  // 图标 emoji
  dc: string;  // 兵器描述
}

// ==========================================
// 敌兵静态配置接口
// ==========================================
export interface EnemyConfig {
  n: string;   // 名字
  hp: number;  // 基础血量
  sp: number;  // 移速
  rw: number;  // 杀敌金币奖励
  cl: string;  // 配色
  sz: number;  // 碰撞体圆半径大小
  supply: number; // 攻城模式招募所需 supply
}

// ==========================================
// 波次配置
// ==========================================
export interface WaveSpawn {
  type: EnemyType;
  count: number;
  interval?: number;
  delay?: number;
  path?: number;
}

export interface WaveDefinition {
  title: string;
  hint: string;
  spawns: WaveSpawn[];
}

export interface SpawnQueueItem {
  type: EnemyType;
  wave: number;
  pathIndex: number;
  delay: number;
}

// ==========================================
// 城池/城墙配置
// ==========================================
export interface CastleConfig {
  maxHp: number;
  wallHp: number;         // 每段城墙血量
  repairCost: number;     // 修复费用 (每点HP)
  upgradeCost: number;    // 城墙升级费用
}

// ==========================================
// 地图远山主题
// ==========================================
export interface MountainLayerTheme {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

export interface MountainTheme {
  layers: MountainLayerTheme[];
}

// ==========================================
// 地图配色方案
// ==========================================
export interface GroundColorTheme {
  path: string;
  buildable: string;
  blocked: string;
  castle: string;
  wall: string;
}

// ==========================================
// AI 防御塔预设
// ==========================================
export interface AIDefenseSlot {
  r: number;
  c: number;
  type: TowerType;
  level: number;
}

// ==========================================
// 地图定义
// ==========================================
export interface MapDefinition {
  id: string;
  name: string;
  subtitle: string;
  cols: number;
  rows: number;
  cellSize: number;

  // 等距 tile 尺寸
  tileWidth: number;        // 菱形地块宽度 (px)
  tileHeight: number;       // 菱形地块高度 (px)

  // 高程图 (0=平地, 1=高地, -1=水域)
  elevation?: number[][];

  // 装饰物
  decoration?: { r: number; c: number; assetKey: string }[];

  // 地形图层
  terrain?: { r: number; c: number; type: TerrainType }[];

  // 城池位置与配置
  castleGrid: Position;
  castleHp: number;
  wallGrids: Position[];

  // 敌军路线 (可多条)
  paths: Position[][];

  // 可建造防御塔的格子
  buildableZone: Position[];

  // 敌军出生点
  spawnPoints: Position[];

  // 视觉主题
  mountainTheme: MountainTheme;
  groundColor: GroundColorTheme;
  ambientColor: string;

  // 守城模式配置
  defenseGold: number;
  defenseWaves: number;

  // 攻城模式配置
  attackSupply: number;

  // AI 防守布局 (攻城模式用)
  aiDefenseLayout: AIDefenseSlot[];
}

// ==========================================
// 关卡定义 (地图 + 难度参数)
// ==========================================
export interface LevelDefinition {
  mapId: string;
  difficulty: number;    // 1-5 星
  description: string;   // 关卡描述
}

// ==========================================
// 攻城兵力编队
// ==========================================
export interface AttackFormation {
  sword: number;
  spear: number;
  horse: number;
}
