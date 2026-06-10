import { EnemyType, WaveDefinition } from '../types/game';

const BASE_WAVES: WaveDefinition[] = [
  {
    title: '斥候试探',
    hint: '刀兵小队从正路推进',
    spawns: [{ type: 'sword', count: 6, interval: 24 }],
  },
  {
    title: '刀兵压线',
    hint: '大量轻兵，炮台可快速清场',
    spawns: [{ type: 'sword', count: 12, interval: 16 }],
  },
  {
    title: '枪阵推进',
    hint: '枪兵血量更高，需要集中火力',
    spawns: [
      { type: 'sword', count: 6, interval: 18 },
      { type: 'spear', count: 5, interval: 28, delay: 70 },
    ],
  },
  {
    title: '骑兵突袭',
    hint: '骑兵速度极快，箭塔和冰塔更关键',
    spawns: [
      { type: 'horse', count: 7, interval: 22 },
      { type: 'sword', count: 6, interval: 18, delay: 80 },
    ],
  },
  {
    title: '盾前骑后',
    hint: '枪兵拖住火力，骑兵尝试穿线',
    spawns: [
      { type: 'spear', count: 7, interval: 26 },
      { type: 'horse', count: 6, interval: 20, delay: 90 },
    ],
  },
  {
    title: '三路齐动',
    hint: '多线压力，注意薄弱入口',
    spawns: [
      { type: 'sword', count: 10, interval: 14 },
      { type: 'spear', count: 6, interval: 24, delay: 60 },
      { type: 'horse', count: 5, interval: 18, delay: 120 },
    ],
  },
  {
    title: '重步压城',
    hint: '枪兵密集推进，炮台和升级收益很高',
    spawns: [
      { type: 'spear', count: 12, interval: 20 },
      { type: 'sword', count: 10, interval: 12, delay: 100 },
    ],
  },
  {
    title: '奔袭破口',
    hint: '连续骑兵冲锋，冰塔覆盖决定生死',
    spawns: [
      { type: 'horse', count: 12, interval: 16 },
      { type: 'spear', count: 5, interval: 24, delay: 140 },
    ],
  },
  {
    title: '乱军合围',
    hint: '混兵长波，考验整体火力配置',
    spawns: [
      { type: 'sword', count: 14, interval: 12 },
      { type: 'spear', count: 8, interval: 22, delay: 70 },
      { type: 'horse', count: 8, interval: 18, delay: 130 },
    ],
  },
  {
    title: '精锐冲关',
    hint: '高血量部队压线，提前升级核心塔',
    spawns: [
      { type: 'spear', count: 14, interval: 18 },
      { type: 'horse', count: 10, interval: 16, delay: 100 },
    ],
  },
  {
    title: '背水一战',
    hint: '敌军全线进攻，留金币补关键位置',
    spawns: [
      { type: 'sword', count: 18, interval: 10 },
      { type: 'spear', count: 12, interval: 18, delay: 60 },
      { type: 'horse', count: 12, interval: 14, delay: 120 },
    ],
  },
  {
    title: '关前决战',
    hint: '最终压力波，控制和溅射缺一不可',
    spawns: [
      { type: 'spear', count: 18, interval: 16 },
      { type: 'horse', count: 14, interval: 12, delay: 80 },
      { type: 'sword', count: 20, interval: 9, delay: 150 },
    ],
  },
];

const EXTRA_WAVES: WaveDefinition[] = [
  {
    title: '援军再至',
    hint: '更长的混合进攻，经济规划开始吃紧',
    spawns: [
      { type: 'sword', count: 18, interval: 9 },
      { type: 'spear', count: 16, interval: 16, delay: 60 },
      { type: 'horse', count: 12, interval: 13, delay: 130 },
    ],
  },
  {
    title: '铁骑绕关',
    hint: '骑兵密度极高，冰塔与箭塔必须成组覆盖',
    spawns: [
      { type: 'horse', count: 18, interval: 10 },
      { type: 'spear', count: 10, interval: 18, delay: 120 },
    ],
  },
  {
    title: '死士登城',
    hint: '重步兵持续压迫，炮台溅射价值最大',
    spawns: [
      { type: 'spear', count: 24, interval: 13 },
      { type: 'sword', count: 18, interval: 8, delay: 100 },
    ],
  },
  {
    title: '万军破晓',
    hint: '终局总攻，所有路线都会被充分利用',
    spawns: [
      { type: 'sword', count: 24, interval: 8 },
      { type: 'spear', count: 20, interval: 13, delay: 70 },
      { type: 'horse', count: 18, interval: 10, delay: 140 },
    ],
  },
];

export function getDefenseWave(wave: number): WaveDefinition {
  if (wave <= BASE_WAVES.length) return BASE_WAVES[wave - 1];
  return EXTRA_WAVES[Math.min(wave - BASE_WAVES.length - 1, EXTRA_WAVES.length - 1)];
}

export function describeWave(wave: number): string {
  const def = getDefenseWave(wave);
  const counts = new Map<EnemyType, number>();
  for (const spawn of def.spawns) {
    counts.set(spawn.type, (counts.get(spawn.type) ?? 0) + spawn.count);
  }
  const label: Record<EnemyType, string> = { sword: '刀兵', spear: '枪兵', horse: '骑兵' };
  const parts = Array.from(counts.entries()).map(([type, count]) => `${label[type]}x${count}`);
  return `${def.title}: ${parts.join(' / ')}`;
}
