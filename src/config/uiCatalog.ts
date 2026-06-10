export type CatalogGroup = 'attack' | 'defense' | 'terrain' | 'resource';

export interface UICatalogItem {
  id: string;
  group: CatalogGroup;
  name: string;
  subtitle: string;
  role: string;
  glyph: string;
  palette: [string, string, string];
  level?: number;
}

export const ATTACK_UNIT_UI: UICatalogItem[] = [
  { id: 'infantry', group: 'attack', name: '步兵', subtitle: '基础近战', role: '低耗兵种，用于探路与吸引火力', glyph: '步', palette: ['#334737', '#c9a44b', '#17211a'] },
  { id: 'cavalry', group: 'attack', name: '骑兵', subtitle: '高速突击', role: '快速穿线，适合冲击薄弱防线', glyph: '骑', palette: ['#624034', '#d8a85c', '#201512'] },
  { id: 'artillery', group: 'attack', name: '炮兵', subtitle: '远程拆塔', role: '缓慢推进，对建筑有额外威胁', glyph: '炮', palette: ['#51342c', '#dd6b3d', '#1b1210'] },
  { id: 'brute', group: 'attack', name: '大力士', subtitle: '重甲肉盾', role: '高血量顶线，为后排创造输出时间', glyph: '力', palette: ['#4e3e55', '#d4b15f', '#17121c'] },
  { id: 'wizard', group: 'attack', name: '巫师', subtitle: '范围法术', role: '脆弱但爆发高，适合清密集防御', glyph: '巫', palette: ['#293f55', '#8cc8ff', '#101722'] },
  { id: 'ram', group: 'attack', name: '攻城车', subtitle: '破门器械', role: '专门撞击城墙与城门', glyph: '车', palette: ['#4a382c', '#b89758', '#1a120e'] },
  { id: 'trebuchet', group: 'attack', name: '投石车', subtitle: '重型攻城', role: '超远程压制，部署慢但威胁巨大', glyph: '投', palette: ['#39433e', '#d2b77c', '#101815'] },
];

const defenseBase: Omit<UICatalogItem, 'group' | 'level'>[] = [
  { id: 'arrow', name: '箭塔', subtitle: '快射单体', role: '压制骑兵与残血单位', glyph: '箭', palette: ['#4a3c2d', '#c43a31', '#18120e'] },
  { id: 'cannon', name: '炮台', subtitle: '范围溅射', role: '清理密集步兵与枪阵', glyph: '炮', palette: ['#4e3725', '#d48636', '#1c130d'] },
  { id: 'ice', name: '冰塔', subtitle: '群体控制', role: '减速敌军，放大其他武器输出', glyph: '冰', palette: ['#24465a', '#9fd8ff', '#0e1820'] },
  { id: 'stone_thrower', name: '投石车', subtitle: '城防重器', role: '慢速大范围轰击', glyph: '石', palette: ['#3c4039', '#c9b071', '#111512'] },
  { id: 'rocket', name: '火箭塔', subtitle: '远程爆发', role: '打击高价值目标和后排器械', glyph: '火', palette: ['#5a2e28', '#ff9a45', '#1d0e0b'] },
];

export const DEFENSE_WEAPON_UI: UICatalogItem[] = defenseBase.flatMap(item =>
  [1, 2, 3].map(level => ({
    ...item,
    id: `${item.id}_lv${level}`,
    group: 'defense' as const,
    level,
    subtitle: `${item.subtitle} Lv.${level}`,
  }))
);

export const TERRAIN_UI: UICatalogItem[] = [
  { id: 'mountain', group: 'terrain', name: '山地', subtitle: '高地/阻隔', role: '形成天然屏障，适合布置远程观察点', glyph: '山', palette: ['#39433e', '#8aa082', '#121714'] },
  { id: 'grass', group: 'terrain', name: '草地', subtitle: '可建造', role: '基础建造地块，适合扩建城防', glyph: '草', palette: ['#244a32', '#7fb069', '#101911'] },
  { id: 'woods', group: 'terrain', name: '树木', subtitle: '资源/障碍', role: '提供木材，也可作为路径阻挡', glyph: '木', palette: ['#1f3b2b', '#b89758', '#0f1711'] },
  { id: 'river', group: 'terrain', name: '河流', subtitle: '不可建造', role: '天然分割线，可引导敌军路线', glyph: '水', palette: ['#203d55', '#7fc7d9', '#0d151d'] },
];

export const RESOURCE_UI: UICatalogItem[] = [
  { id: 'wood', group: 'resource', name: '木材', subtitle: '建造资源', role: '升级城墙、箭塔和基础建筑', glyph: '木', palette: ['#3d2f20', '#b97a41', '#160f0b'] },
  { id: 'stone', group: 'resource', name: '石料', subtitle: '防御资源', role: '升级城门、炮台和重型器械', glyph: '石', palette: ['#3d4240', '#b8b2a2', '#121514'] },
  { id: 'grain', group: 'resource', name: '粮草', subtitle: '兵力资源', role: '训练部队，维持长期攻守', glyph: '粮', palette: ['#4b3f24', '#d9b85b', '#171308'] },
  { id: 'gold', group: 'resource', name: '金币', subtitle: '通用资源', role: '购买武器、快速升级和提前开波奖励', glyph: '金', palette: ['#5a4620', '#f0c45c', '#1a1306'] },
];

export const UI_CATALOG = [
  ...ATTACK_UNIT_UI,
  ...DEFENSE_WEAPON_UI,
  ...TERRAIN_UI,
  ...RESOURCE_UI,
];
