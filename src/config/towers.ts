import { TowerType, TowerConfig } from '../types/game';

export const TOWER_TYPES: Record<TowerType, TowerConfig> = {
  arrow: {
    n: '箭塔',
    c: 50,
    r: 120,
    d: 15,
    cd: 25,
    cl: '#c43a31',
    ic: '🏹',
    dc: '射速极快，克制移速单位'
  },
  cannon: {
    n: '炮台',
    c: 100,
    r: 96,
    d: 40,
    cd: 55,
    cl: '#8b6914',
    ic: '💣',
    dc: '威力极大，附带群体伤害'
  },
  ice: {
    n: '冰塔',
    c: 75,
    r: 104,
    d: 8,
    cd: 35,
    cl: '#5b9ecf',
    ic: '❄️',
    dc: '降低敌军移速，提供强力控制'
  }
};

/** 由塔类型推导素材 key */
export function towerAssetKey(type: TowerType): string {
  return `tower.${type}`;
}
