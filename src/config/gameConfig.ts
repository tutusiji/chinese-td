// 默认画布尺寸 (作为后备，实际从地图配置读取)
export const DEFAULT_COLS = 12;
export const DEFAULT_ROWS = 8;
export const DEFAULT_CELL = 64;
export const DEFAULT_MAP_W = DEFAULT_COLS * DEFAULT_CELL;
export const DEFAULT_MAP_H = DEFAULT_ROWS * DEFAULT_CELL;
export const UI_W = 180;

// 粒子系统
export const MAX_PARTICLES = 80;

// 倍速选项
export const SPEED_OPTIONS = [0, 1, 2] as const;

// 波次间隔 (帧数)
export const WAVE_CD_FRAMES = 150;
export const PRE_GAME_CD_FRAMES = 120;
