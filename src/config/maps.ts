import { MapDefinition } from '../types/game';

const TILE_W = 64;
const TILE_H = 48;  // 64:48 ≈ 1.33:1 倾斜角 ~37°，接近部落冲突的 3D 视角

/** 生成两个网格坐标之间的直线路径 */
function linePath(r1: number, c1: number, r2: number, c2: number): { r: number; c: number }[] {
  const points: { r: number; c: number }[] = [];
  const dr = r2 - r1;
  const dc = c2 - c1;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    points.push({
      r: Math.round(r1 + dr * t),
      c: Math.round(c1 + dc * t),
    });
  }
  return points;
}

/** 连接多个拐点生成完整路径 */
function buildPath(waypoints: { r: number; c: number }[]): { r: number; c: number }[] {
  const fullPath: { r: number; c: number }[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = linePath(
      waypoints[i].r, waypoints[i].c,
      waypoints[i + 1].r, waypoints[i + 1].c
    );
    if (i === 0) fullPath.push(...segment);
    else fullPath.push(...segment.slice(1)); // 去重连接点
  }
  return fullPath;
}

/** 构建路径集合 (用于快速查询) */
function pathSet(paths: { r: number; c: number }[][]): Set<string> {
  const s = new Set<string>();
  for (const p of paths) {
    for (const pt of p) s.add(`${pt.r},${pt.c}`);
  }
  return s;
}

// ==========================================
// 雁门关 — 32×22 — 秋褐色调北方边塞
// ==========================================
const yanmenWalls = [
  { r: 19, c: 29 }, { r: 19, c: 30 }, { r: 19, c: 31 },
  { r: 20, c: 28 }, { r: 20, c: 29 }, { r: 20, c: 30 }, { r: 20, c: 31 },
  { r: 21, c: 28 }, { r: 21, c: 29 }, { r: 21, c: 31 },
];

const yanmenPaths = [
  buildPath([
    { r: 0, c: 2 }, { r: 0, c: 8 }, { r: 4, c: 8 }, { r: 4, c: 4 },
    { r: 8, c: 4 }, { r: 8, c: 12 }, { r: 4, c: 12 }, { r: 4, c: 16 },
    { r: 10, c: 16 }, { r: 10, c: 12 }, { r: 14, c: 12 },
    { r: 14, c: 18 }, { r: 18, c: 18 }, { r: 18, c: 22 },
    { r: 20, c: 22 }, { r: 20, c: 27 },
  ]),
  buildPath([
    { r: 6, c: 0 }, { r: 6, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 12 },
    { r: 4, c: 12 }, { r: 4, c: 16 }, { r: 10, c: 16 },
    { r: 10, c: 12 }, { r: 14, c: 12 }, { r: 14, c: 18 },
    { r: 18, c: 18 }, { r: 18, c: 22 }, { r: 20, c: 22 },
    { r: 20, c: 27 },
  ]),
  buildPath([
    { r: 14, c: 0 }, { r: 14, c: 6 }, { r: 16, c: 8 },
    { r: 16, c: 12 }, { r: 14, c: 12 }, { r: 14, c: 18 },
    { r: 18, c: 18 }, { r: 18, c: 22 }, { r: 20, c: 22 },
    { r: 20, c: 27 },
  ]),
];

const yanmenPathSet = pathSet(yanmenPaths);
const yanmenBlocked = new Set([
  ...yanmenWalls.map(p => `${p.r},${p.c}`),
  '20,27', '20,28',
]);

const yanmenBuildable: { r: number; c: number }[] = [];
for (let r = 0; r < 22; r++) {
  for (let c = 0; c < 32; c++) {
    if (!yanmenPathSet.has(`${r},${c}`) && !yanmenBlocked.has(`${r},${c}`)) {
      yanmenBuildable.push({ r, c });
    }
  }
}

const yanmenTerrain = [
  { r: 1, c: 18, type: 'mountain' as const }, { r: 2, c: 19, type: 'mountain' as const },
  { r: 3, c: 24, type: 'mountain' as const }, { r: 5, c: 27, type: 'mountain' as const },
  { r: 10, c: 2, type: 'tree' as const }, { r: 11, c: 3, type: 'tree' as const },
  { r: 12, c: 5, type: 'grass' as const }, { r: 13, c: 8, type: 'grass' as const },
  { r: 17, c: 2, type: 'river' as const }, { r: 18, c: 3, type: 'river' as const },
  { r: 19, c: 4, type: 'river' as const }, { r: 20, c: 6, type: 'grass' as const },
];

const yanmen: MapDefinition = {
  id: 'yanmen', name: '雁门关', subtitle: '天下九塞，雁门为首',
  cols: 32, rows: 22, cellSize: 64,
  tileWidth: TILE_W, tileHeight: TILE_H,
  castleGrid: { r: 20, c: 28 }, castleHp: 30,
  wallGrids: yanmenWalls,
  terrain: yanmenTerrain,
  paths: yanmenPaths,
  spawnPoints: [{ r: 0, c: 2 }, { r: 6, c: 0 }, { r: 14, c: 0 }],
  buildableZone: yanmenBuildable,
  mountainTheme: {
    layers: [
      { r: 35, g: 28, b: 20, alpha: 75 },
      { r: 42, g: 32, b: 22, alpha: 68 },
      { r: 50, g: 38, b: 26, alpha: 60 },
      { r: 58, g: 44, b: 30, alpha: 52 },
      { r: 66, g: 52, b: 36, alpha: 44 },
    ],
  },
  groundColor: { path: '#2e2618', buildable: '#221c14', blocked: '#1a1410', castle: '#3a2e20', wall: '#4a3c2a' },
  ambientColor: '#1a1410',
  defenseGold: 250, defenseWaves: 12, attackSupply: 300,
  aiDefenseLayout: [
    { r: 6, c: 14, type: 'arrow', level: 2 },
    { r: 6, c: 20, type: 'cannon', level: 2 },
    { r: 12, c: 10, type: 'ice', level: 2 },
    { r: 16, c: 15, type: 'cannon', level: 2 },
    { r: 18, c: 24, type: 'arrow', level: 3 },
    { r: 12, c: 22, type: 'ice', level: 2 },
  ],
};

// ==========================================
// 剑门关 — 30×24 — 青翠色调蜀道天险
// ==========================================
const jianmenWalls = [
  { r: 21, c: 26 }, { r: 21, c: 27 }, { r: 21, c: 28 }, { r: 21, c: 29 },
  { r: 22, c: 25 }, { r: 22, c: 26 }, { r: 22, c: 28 }, { r: 22, c: 29 },
  { r: 23, c: 25 }, { r: 23, c: 26 }, { r: 23, c: 27 }, { r: 23, c: 29 },
];

const jianmenPaths = [
  buildPath([
    { r: 0, c: 2 }, { r: 3, c: 2 }, { r: 3, c: 6 }, { r: 1, c: 8 },
    { r: 1, c: 14 }, { r: 5, c: 14 }, { r: 5, c: 8 },
    { r: 8, c: 8 }, { r: 8, c: 16 }, { r: 5, c: 16 },
    { r: 5, c: 20 }, { r: 10, c: 20 }, { r: 10, c: 14 },
    { r: 14, c: 14 }, { r: 14, c: 20 }, { r: 12, c: 22 },
    { r: 16, c: 22 }, { r: 16, c: 18 }, { r: 20, c: 18 },
    { r: 20, c: 22 }, { r: 22, c: 22 }, { r: 22, c: 24 },
  ]),
  buildPath([
    { r: 5, c: 0 }, { r: 5, c: 2 }, { r: 5, c: 8 }, { r: 8, c: 8 },
    { r: 8, c: 16 }, { r: 5, c: 16 }, { r: 5, c: 20 },
    { r: 10, c: 20 }, { r: 10, c: 14 }, { r: 14, c: 14 },
    { r: 14, c: 20 }, { r: 12, c: 22 }, { r: 16, c: 22 },
    { r: 16, c: 18 }, { r: 20, c: 18 }, { r: 20, c: 22 },
    { r: 22, c: 22 }, { r: 22, c: 24 },
  ]),
];

const jianmenPathSet = pathSet(jianmenPaths);
const jianmenBlocked = new Set([...jianmenWalls.map(p => `${p.r},${p.c}`), '22,24', '22,25']);
const jianmenBuildable: { r: number; c: number }[] = [];
for (let r = 0; r < 24; r++) {
  for (let c = 0; c < 30; c++) {
    if (!jianmenPathSet.has(`${r},${c}`) && !jianmenBlocked.has(`${r},${c}`)) {
      jianmenBuildable.push({ r, c });
    }
  }
}

const jianmenTerrain = [
  { r: 0, c: 18, type: 'mountain' as const }, { r: 1, c: 19, type: 'mountain' as const },
  { r: 2, c: 22, type: 'mountain' as const }, { r: 3, c: 24, type: 'mountain' as const },
  { r: 9, c: 2, type: 'tree' as const }, { r: 10, c: 3, type: 'tree' as const },
  { r: 11, c: 5, type: 'grass' as const }, { r: 12, c: 7, type: 'grass' as const },
  { r: 18, c: 3, type: 'river' as const }, { r: 19, c: 4, type: 'river' as const },
  { r: 20, c: 5, type: 'river' as const }, { r: 21, c: 8, type: 'tree' as const },
];

const jianmen: MapDefinition = {
  id: 'jianmen', name: '剑门关', subtitle: '一夫当关，万夫莫开',
  cols: 30, rows: 24, cellSize: 64,
  tileWidth: TILE_W, tileHeight: TILE_H,
  castleGrid: { r: 22, c: 25 }, castleHp: 25,
  wallGrids: jianmenWalls,
  terrain: jianmenTerrain,
  paths: jianmenPaths,
  spawnPoints: [{ r: 0, c: 2 }, { r: 5, c: 0 }],
  buildableZone: jianmenBuildable,
  mountainTheme: {
    layers: [
      { r: 26, g: 35, b: 24, alpha: 75 },
      { r: 30, g: 42, b: 28, alpha: 68 },
      { r: 35, g: 50, b: 32, alpha: 60 },
      { r: 40, g: 58, b: 38, alpha: 52 },
      { r: 46, g: 66, b: 44, alpha: 44 },
    ],
  },
  groundColor: { path: '#1e2818', buildable: '#182216', blocked: '#101a10', castle: '#2a3622', wall: '#3a4a30' },
  ambientColor: '#101a10',
  defenseGold: 200, defenseWaves: 14, attackSupply: 250,
  aiDefenseLayout: [
    { r: 3, c: 12, type: 'ice', level: 2 },
    { r: 7, c: 10, type: 'cannon', level: 2 },
    { r: 7, c: 18, type: 'arrow', level: 3 },
    { r: 16, c: 16, type: 'cannon', level: 2 },
    { r: 18, c: 24, type: 'ice', level: 3 },
    { r: 12, c: 12, type: 'arrow', level: 2 },
  ],
};

// ==========================================
// 山海关 — 34×20 — 暮紫色调海陆雄关
// ==========================================
const shanhaiWalls = [
  { r: 16, c: 30 }, { r: 16, c: 31 }, { r: 16, c: 32 }, { r: 16, c: 33 },
  { r: 17, c: 29 }, { r: 17, c: 30 }, { r: 17, c: 32 }, { r: 17, c: 33 },
  { r: 18, c: 29 }, { r: 18, c: 30 }, { r: 18, c: 31 }, { r: 18, c: 33 },
];

const shanhaiPaths = [
  buildPath([
    { r: 0, c: 2 }, { r: 0, c: 8 }, { r: 2, c: 8 }, { r: 2, c: 4 },
    { r: 6, c: 4 }, { r: 6, c: 12 }, { r: 4, c: 14 },
    { r: 4, c: 20 }, { r: 8, c: 20 }, { r: 8, c: 14 },
    { r: 12, c: 14 }, { r: 12, c: 22 }, { r: 10, c: 24 },
    { r: 14, c: 24 }, { r: 14, c: 20 }, { r: 16, c: 20 },
    { r: 16, c: 26 }, { r: 17, c: 26 }, { r: 17, c: 28 },
  ]),
  buildPath([
    { r: 6, c: 0 }, { r: 6, c: 4 }, { r: 6, c: 12 },
    { r: 4, c: 14 }, { r: 4, c: 20 }, { r: 8, c: 20 },
    { r: 8, c: 14 }, { r: 12, c: 14 }, { r: 12, c: 22 },
    { r: 10, c: 24 }, { r: 14, c: 24 }, { r: 14, c: 20 },
    { r: 16, c: 20 }, { r: 16, c: 26 }, { r: 17, c: 26 },
    { r: 17, c: 28 },
  ]),
];

const shanhaiPathSet = pathSet(shanhaiPaths);
const shanhaiBlocked = new Set([...shanhaiWalls.map(p => `${p.r},${p.c}`), '17,28', '17,29']);
const shanhaiBuildable: { r: number; c: number }[] = [];
for (let r = 0; r < 20; r++) {
  for (let c = 0; c < 34; c++) {
    if (!shanhaiPathSet.has(`${r},${c}`) && !shanhaiBlocked.has(`${r},${c}`)) {
      shanhaiBuildable.push({ r, c });
    }
  }
}

const shanhaiTerrain = [
  { r: 1, c: 24, type: 'mountain' as const }, { r: 2, c: 26, type: 'mountain' as const },
  { r: 3, c: 29, type: 'mountain' as const }, { r: 5, c: 31, type: 'tree' as const },
  { r: 9, c: 1, type: 'river' as const }, { r: 10, c: 2, type: 'river' as const },
  { r: 11, c: 3, type: 'river' as const }, { r: 13, c: 5, type: 'grass' as const },
  { r: 15, c: 8, type: 'tree' as const }, { r: 18, c: 12, type: 'grass' as const },
  { r: 3, c: 6, type: 'grass' as const }, { r: 4, c: 8, type: 'tree' as const },
];

const shanhai: MapDefinition = {
  id: 'shanhai', name: '山海关', subtitle: '两京锁钥无双地，万里长城第一关',
  cols: 34, rows: 20, cellSize: 64,
  tileWidth: TILE_W, tileHeight: TILE_H,
  castleGrid: { r: 17, c: 29 }, castleHp: 35,
  wallGrids: shanhaiWalls,
  terrain: shanhaiTerrain,
  paths: shanhaiPaths,
  spawnPoints: [{ r: 0, c: 2 }, { r: 6, c: 0 }],
  buildableZone: shanhaiBuildable,
  mountainTheme: {
    layers: [
      { r: 30, g: 24, b: 38, alpha: 75 },
      { r: 36, g: 28, b: 46, alpha: 68 },
      { r: 42, g: 34, b: 54, alpha: 60 },
      { r: 50, g: 40, b: 62, alpha: 52 },
      { r: 58, g: 48, b: 70, alpha: 44 },
    ],
  },
  groundColor: { path: '#221e2a', buildable: '#1a1622', blocked: '#12101a', castle: '#2e2638', wall: '#3e3448' },
  ambientColor: '#12101a',
  defenseGold: 300, defenseWaves: 16, attackSupply: 350,
  aiDefenseLayout: [
    { r: 2, c: 16, type: 'cannon', level: 2 },
    { r: 8, c: 10, type: 'ice', level: 3 },
    { r: 10, c: 18, type: 'cannon', level: 2 },
    { r: 6, c: 22, type: 'arrow', level: 3 },
    { r: 14, c: 16, type: 'arrow', level: 2 },
    { r: 16, c: 22, type: 'cannon', level: 3 },
    { r: 12, c: 26, type: 'ice', level: 2 },
  ],
};

// ==========================================
// 地图集
// ==========================================
export const MAPS: Record<string, MapDefinition> = { yanmen, jianmen, shanhai };
export const DEFAULT_MAP_ID = 'yanmen';
