// ==========================================
// config.ts — 桶文件，重新导出所有配置
// ==========================================

// 全局常量
export {
  DEFAULT_COLS as COLS,
  DEFAULT_ROWS as ROWS,
  DEFAULT_CELL as CELL,
  DEFAULT_MAP_W as MAP_W,
  DEFAULT_MAP_H as MAP_H,
  UI_W,
  MAX_PARTICLES,
  WAVE_CD_FRAMES,
  PRE_GAME_CD_FRAMES,
} from './config/gameConfig';

// 防御塔
export { TOWER_TYPES as TYPES, towerAssetKey } from './config/towers';

// 敌兵
export { ENEMY_TYPES as ETYPES, enemyAssetKey } from './config/enemies';

// 地图
export { MAPS, DEFAULT_MAP_ID } from './config/maps';

// 关卡
export { LEVELS } from './config/levels';

// 为了向后兼容，保留旧的 PATH 和 PS 导出
// 这些将逐步废弃，请使用 MAPS[mapId].paths
import { MAPS, DEFAULT_MAP_ID } from './config/maps';
import { Position } from './types/game';

const defaultMap = MAPS[DEFAULT_MAP_ID];
export const PATH: Position[] = defaultMap.paths[0];
export const PS = new Set<string>(defaultMap.paths.flatMap(p => p.map(pt => `${pt.r},${pt.c}`)));

// 向后兼容的游戏数值
export const START_GOLD = defaultMap.defenseGold;
export const START_HP = defaultMap.castleHp;
export const TOTAL_WAVES = defaultMap.defenseWaves;
