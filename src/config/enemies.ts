import { EnemyType, EnemyConfig } from '../types/game';

export const ENEMY_TYPES: Record<EnemyType, EnemyConfig> = {
  sword: {
    n: '刀兵',
    hp: 60,
    sp: 1.3,
    rw: 15,
    cl: '#d4a574',
    sz: 13,
    supply: 20
  },
  spear: {
    n: '枪兵',
    hp: 100,
    sp: 1.0,
    rw: 25,
    cl: '#c43a31',
    sz: 15,
    supply: 35
  },
  horse: {
    n: '骑兵',
    hp: 80,
    sp: 2.0,
    rw: 30,
    cl: '#8b6914',
    sz: 17,
    supply: 50
  }
};

/** 由敌兵类型推导素材 key */
export function enemyAssetKey(type: EnemyType): string {
  return `enemy.${type}`;
}
