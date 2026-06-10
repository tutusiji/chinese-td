export type MaterialCategory = 'enemy' | 'tower' | 'terrain' | 'resource' | 'structure' | 'ui';
export type MaterialLevel = 'basic' | 'intermediate' | 'advanced';
export type MaterialSource = 'procedural' | 'ai-2d' | 'ai-3d';

export interface MaterialEntry {
  id: string;
  name: string;
  category: MaterialCategory;
  level: MaterialLevel;
  source: MaterialSource;
  prompt: string;
  description: string;
  /** 关联的实体类型 (用于 3D 预览) */
  entityType?: string;
  /** 2D 预览图 base64/dataUrl */
  imageUrl?: string;
  /** 3D 模型 URL */
  modelUrl?: string;
  /** 骨骼动画列表 */
  skeletonActions?: string[];
  createdAt: number;
  updatedAt: number;
}

/** 预设物料清单 — 覆盖游戏所有视觉资产 */
export const MATERIAL_PRESETS: Omit<MaterialEntry, 'createdAt' | 'updatedAt' | 'imageUrl' | 'modelUrl'>[] = [
  // ── 敌方单位 ──────────────────────────────────────
  { id: 'enemy-sword', name: '刀兵', category: 'enemy', level: 'basic', source: 'procedural', prompt: '中国古代步兵，持刀，布甲，写实风格', description: '基础近战单位', entityType: 'sword' },
  { id: 'enemy-spear', name: '枪兵', category: 'enemy', level: 'basic', source: 'procedural', prompt: '中国古代枪兵，持长枪，皮甲，写实风格', description: '长柄武器单位', entityType: 'spear' },
  { id: 'enemy-cavalry', name: '骑兵', category: 'enemy', level: 'intermediate', source: 'procedural', prompt: '中国古代骑兵，骑马持刀，铁甲，写实风格', description: '高速突击单位', entityType: 'horse' },
  { id: 'enemy-artillery', name: '炮兵', category: 'enemy', level: 'intermediate', source: 'ai-2d', prompt: '中国古代炮兵，操作小型火炮，布甲', description: '远程拆塔单位', entityType: 'artillery' },
  { id: 'enemy-brute', name: '大力士', category: 'enemy', level: 'advanced', source: 'ai-2d', prompt: '中国古代大力士，肌肉壮汉，持锤，重甲', description: '重甲肉盾单位', entityType: 'brute' },
  { id: 'enemy-wizard', name: '巫师', category: 'enemy', level: 'advanced', source: 'ai-2d', prompt: '中国古代方士，持拂尘，道袍，法术光效', description: '范围法术单位', entityType: 'wizard' },
  { id: 'enemy-ram', name: '攻城车', category: 'enemy', level: 'advanced', source: 'ai-3d', prompt: '中国古代攻城槌车，木制结构，金属撞头', description: '破门攻城器械', entityType: 'ram' },
  { id: 'enemy-trebuchet', name: '投石车', category: 'enemy', level: 'advanced', source: 'ai-3d', prompt: '中国古代投石车，杠杆结构，石弹', description: '远程重型攻城器械', entityType: 'trebuchet_unit' },

  // ── 防御塔 ────────────────────────────────────────
  { id: 'tower-arrow-lv1', name: '箭塔 Lv.1', category: 'tower', level: 'basic', source: 'procedural', prompt: '中国古代箭塔，木石结构，单层瓦顶', description: '基础箭塔', entityType: 'arrow', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-arrow-lv2', name: '箭塔 Lv.2', category: 'tower', level: 'intermediate', source: 'procedural', prompt: '中国古代箭塔，砖石强化，双层瓦顶，旗帜', description: '强化箭塔', entityType: 'arrow', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-arrow-lv3', name: '箭塔 Lv.3', category: 'tower', level: 'advanced', source: 'procedural', prompt: '中国古代箭塔，城防重器，三层瓦顶，重弩', description: '重型箭塔', entityType: 'arrow', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-cannon-lv1', name: '炮台 Lv.1', category: 'tower', level: 'basic', source: 'procedural', prompt: '中国古代炮台，石基铁炮，单管', description: '基础炮台', entityType: 'cannon', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-cannon-lv2', name: '炮台 Lv.2', category: 'tower', level: 'intermediate', source: 'procedural', prompt: '中国古代炮台，砖石底座，加长炮管', description: '强化炮台', entityType: 'cannon', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-cannon-lv3', name: '炮台 Lv.3', category: 'tower', level: 'advanced', source: 'procedural', prompt: '中国古代炮台，重型城防炮，双支撑', description: '重型炮台', entityType: 'cannon', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-ice-lv1', name: '冰塔 Lv.1', category: 'tower', level: 'basic', source: 'procedural', prompt: '寒冰机关塔，冰晶核心，石基', description: '基础冰塔', entityType: 'ice', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-ice-lv2', name: '冰塔 Lv.2', category: 'tower', level: 'intermediate', source: 'procedural', prompt: '寒冰机关塔，大型冰晶，环绕冰凌', description: '强化冰塔', entityType: 'ice', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-ice-lv3', name: '冰塔 Lv.3', category: 'tower', level: 'advanced', source: 'procedural', prompt: '寒冰机关塔，巨型冰晶，冰霜扩散', description: '重型冰塔', entityType: 'ice', skeletonActions: ['idle', 'attack'] },
  { id: 'tower-stone-lv1', name: '投石车 Lv.1', category: 'tower', level: 'intermediate', source: 'ai-3d', prompt: '守城投石车，木制杠杆，石弹', description: '基础投石车', entityType: 'stone_thrower', skeletonActions: ['idle', 'attack', 'load'] },
  { id: 'tower-stone-lv2', name: '投石车 Lv.2', category: 'tower', level: 'advanced', source: 'ai-3d', prompt: '守城重型投石车，金属强化，大火弹', description: '强化投石车', entityType: 'stone_thrower', skeletonActions: ['idle', 'attack', 'load'] },
  { id: 'tower-rocket-lv1', name: '火箭塔 Lv.1', category: 'tower', level: 'intermediate', source: 'ai-2d', prompt: '中国古代火箭塔，多管火箭发射架', description: '基础火箭塔', entityType: 'rocket_tower' },

  // ── 地形 ──────────────────────────────────────────
  { id: 'terrain-mountain', name: '山地', category: 'terrain', level: 'basic', source: 'procedural', prompt: '中国山水画风格山峰，岩石质感', description: '山地地形', entityType: 'mountain' },
  { id: 'terrain-tree', name: '树木', category: 'terrain', level: 'basic', source: 'procedural', prompt: '中国风松树，层叠树冠，棕色树干', description: '树木障碍', entityType: 'tree' },
  { id: 'terrain-grass', name: '草地', category: 'terrain', level: 'basic', source: 'procedural', prompt: '绿色草地，散落草叶', description: '可建造草地', entityType: 'grass' },
  { id: 'terrain-river', name: '河流', category: 'terrain', level: 'basic', source: 'procedural', prompt: '浅蓝透明水面', description: '河流地形', entityType: 'river' },

  // ── 资源 ──────────────────────────────────────────
  { id: 'resource-wood', name: '木材', category: 'resource', level: 'basic', source: 'ai-2d', prompt: '中国风木材资源图标，圆木堆，暖色调', description: '建造资源' },
  { id: 'resource-stone', name: '石料', category: 'resource', level: 'basic', source: 'ai-2d', prompt: '中国风石料资源图标，石堆，灰色调', description: '防御升级资源' },
  { id: 'resource-grain', name: '粮草', category: 'resource', level: 'basic', source: 'ai-2d', prompt: '中国风粮草资源图标，米袋谷物，黄色调', description: '兵力维持资源' },
  { id: 'resource-gold', name: '金币', category: 'resource', level: 'basic', source: 'ai-2d', prompt: '中国风金币资源图标，铜钱金锭，金色调', description: '通用资源' },

  // ── 结构 ──────────────────────────────────────────
  { id: 'structure-castle', name: '城池', category: 'structure', level: 'advanced', source: 'procedural', prompt: '中国古代城池，城墙城垛，双层瓦顶，旗帜', description: '主城/大本营', entityType: 'castle', skeletonActions: ['idle'] },
  { id: 'structure-wall', name: '城墙', category: 'structure', level: 'basic', source: 'procedural', prompt: '中国古代城墙段，砖石结构', description: '防御城墙', entityType: 'wall' },
];
