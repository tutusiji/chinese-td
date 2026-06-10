export type ModelAssetGroup = 'attack' | 'defense' | 'terrain' | 'resource' | 'structure';

export interface ModelAssetDefinition {
  id: string;
  name: string;
  group: ModelAssetGroup;
  path: string;
  description: string;
  level?: number;
}

export const MODEL_ASSETS: ModelAssetDefinition[] = [
  { id: 'infantry', name: '步兵', group: 'attack', path: 'infantry.png', description: '基础近战单位' },
  { id: 'cavalry', name: '骑兵', group: 'attack', path: 'cavalry.png', description: '高速突击单位' },
  { id: 'artillery', name: '炮兵', group: 'attack', path: 'artillery.png', description: '远程拆塔单位' },
  { id: 'brute', name: '大力士', group: 'attack', path: 'brute.png', description: '重甲肉盾单位' },
  { id: 'wizard', name: '巫师', group: 'attack', path: 'wizard.png', description: '范围法术单位' },
  { id: 'ram', name: '攻城车', group: 'attack', path: 'ram.png', description: '破门攻城器械' },
  { id: 'trebuchet_unit', name: '投石车', group: 'attack', path: 'trebuchet-unit.png', description: '远程重型攻城器械' },

  { id: 'arrow_tower_lv1', name: '箭塔 Lv.1', group: 'defense', path: 'arrow-tower-lv1.png', description: '基础箭塔', level: 1 },
  { id: 'arrow_tower_lv2', name: '箭塔 Lv.2', group: 'defense', path: 'arrow-tower-lv2.png', description: '强化箭塔', level: 2 },
  { id: 'arrow_tower_lv3', name: '箭塔 Lv.3', group: 'defense', path: 'arrow-tower-lv3.png', description: '重型箭塔', level: 3 },
  { id: 'cannon_tower_lv1', name: '炮台 Lv.1', group: 'defense', path: 'cannon-tower-lv1.png', description: '基础炮台', level: 1 },
  { id: 'cannon_tower_lv2', name: '炮台 Lv.2', group: 'defense', path: 'cannon-tower-lv2.png', description: '强化炮台', level: 2 },
  { id: 'cannon_tower_lv3', name: '炮台 Lv.3', group: 'defense', path: 'cannon-tower-lv3.png', description: '重型炮台', level: 3 },
  { id: 'ice_tower_lv1', name: '冰塔 Lv.1', group: 'defense', path: 'ice-tower-lv1.png', description: '基础冰塔', level: 1 },
  { id: 'ice_tower_lv2', name: '冰塔 Lv.2', group: 'defense', path: 'ice-tower-lv2.png', description: '强化冰塔', level: 2 },
  { id: 'ice_tower_lv3', name: '冰塔 Lv.3', group: 'defense', path: 'ice-tower-lv3.png', description: '重型冰塔', level: 3 },
  { id: 'stone_thrower_lv1', name: '守城投石车 Lv.1', group: 'defense', path: 'stone-thrower-lv1.png', description: '基础守城投石车', level: 1 },
  { id: 'stone_thrower_lv2', name: '守城投石车 Lv.2', group: 'defense', path: 'stone-thrower-lv2.png', description: '强化守城投石车', level: 2 },
  { id: 'stone_thrower_lv3', name: '守城投石车 Lv.3', group: 'defense', path: 'stone-thrower-lv3.png', description: '重型守城投石车', level: 3 },
  { id: 'rocket_tower_lv1', name: '火箭塔 Lv.1', group: 'defense', path: 'rocket-tower-lv1.png', description: '基础火箭塔', level: 1 },
  { id: 'rocket_tower_lv2', name: '火箭塔 Lv.2', group: 'defense', path: 'rocket-tower-lv2.png', description: '强化火箭塔', level: 2 },
  { id: 'rocket_tower_lv3', name: '火箭塔 Lv.3', group: 'defense', path: 'rocket-tower-lv3.png', description: '重型火箭塔', level: 3 },

  { id: 'mountain', name: '山地', group: 'terrain', path: 'terrain-mountain.png', description: '山地地形' },
  { id: 'grass', name: '草地', group: 'terrain', path: 'terrain-grass.png', description: '可建造草地' },
  { id: 'tree', name: '树木', group: 'terrain', path: 'terrain-tree.png', description: '树木资源/障碍' },
  { id: 'river', name: '河流', group: 'terrain', path: 'terrain-river.png', description: '河流地形' },

  { id: 'wood', name: '木材', group: 'resource', path: 'resource-wood.png', description: '建造资源' },
  { id: 'stone', name: '石料', group: 'resource', path: 'resource-stone.png', description: '防御升级资源' },
  { id: 'grain', name: '粮草', group: 'resource', path: 'resource-grain.png', description: '兵力维持资源' },
  { id: 'gold', name: '金币', group: 'resource', path: 'resource-gold.png', description: '通用资源' },

  { id: 'castle', name: '城池', group: 'structure', path: 'structure-castle.png', description: '主城/大本营' },
  { id: 'wall', name: '城墙', group: 'structure', path: 'structure-wall.png', description: '可升级城墙' },
];
