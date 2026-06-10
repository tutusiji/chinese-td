export interface UIAtlasRegion {
  x: number;
  y: number;
}

// Centers are normalized percentages on src/assets/generated/ui-style-board.png.
// The generated board is not a strict grid, so only visually isolated cells are mapped here.
export const UI_ATLAS: Record<string, UIAtlasRegion> = {
  infantry: { x: 8.5, y: 9.8 },
  cavalry: { x: 24.8, y: 9.8 },
  artillery: { x: 40.7, y: 9.8 },
  brute: { x: 56.4, y: 9.8 },
  wizard: { x: 72.1, y: 9.8 },
  ram: { x: 86.4, y: 9.8 },
  trebuchet: { x: 94.6, y: 9.8 },

  arrow_lv1: { x: 8.5, y: 29.0 },
  arrow_lv2: { x: 24.8, y: 29.0 },
  arrow_lv3: { x: 40.7, y: 29.0 },
  cannon_lv1: { x: 56.4, y: 29.0 },
  cannon_lv2: { x: 72.1, y: 29.0 },
  cannon_lv3: { x: 88.6, y: 29.0 },

  ice_lv1: { x: 8.5, y: 48.5 },
  ice_lv2: { x: 24.8, y: 48.5 },
  ice_lv3: { x: 40.7, y: 48.5 },
  stone_thrower_lv1: { x: 56.4, y: 48.5 },
  stone_thrower_lv2: { x: 72.1, y: 48.5 },
  stone_thrower_lv3: { x: 88.6, y: 48.5 },

  rocket_lv1: { x: 8.5, y: 68.0 },
  rocket_lv2: { x: 24.8, y: 68.0 },
  rocket_lv3: { x: 40.7, y: 68.0 },

  mountain: { x: 8.5, y: 88.4 },
  grass: { x: 24.8, y: 88.4 },
  woods: { x: 40.7, y: 88.4 },
  river: { x: 56.4, y: 88.4 },
  wood: { x: 72.1, y: 88.4 },
  gold: { x: 88.6, y: 88.4 },
};
