import * as THREE from 'three';
import {
  AnimationClip,
  ClipSet,
  EntityAnimState,
} from './AnimationController';
import { EnemyType, TowerType } from '../types/game';

// ─── 工具函数 ────────────────────────────────────────────

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ─── 敌方动画 ────────────────────────────────────────────

/** 步兵/枪兵 行走 */
function enemyWalkClip(): AnimationClip {
  return {
    name: 'walk',
    duration: 0.6,
    loop: true,
    tracks: [
      // 左腿前后摆动 (绕 X 轴)
      {
        target: 'leftLeg',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0.45, 0, 0) },
          { time: 0.3, value: v3(-0.45, 0, 0) },
          { time: 0.6, value: v3(0.45, 0, 0) },
        ],
      },
      // 右腿相反相位
      {
        target: 'rightLeg',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(-0.45, 0, 0) },
          { time: 0.3, value: v3(0.45, 0, 0) },
          { time: 0.6, value: v3(-0.45, 0, 0) },
        ],
      },
      // 左臂
      {
        target: 'leftArm',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(-0.25, 0, 0) },
          { time: 0.3, value: v3(0.25, 0, 0) },
          { time: 0.6, value: v3(-0.25, 0, 0) },
        ],
      },
      // 右臂
      {
        target: 'rightArm',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0.25, 0, 0) },
          { time: 0.3, value: v3(-0.25, 0, 0) },
          { time: 0.6, value: v3(0.25, 0, 0) },
        ],
      },
      // 身体上下浮动
      {
        target: 'body',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.15, value: v3(0, 0.02, 0) },
          { time: 0.3, value: v3(0, 0, 0) },
          { time: 0.45, value: v3(0, 0.02, 0) },
          { time: 0.6, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 敌人攻击 (挥砍/刺击) */
function enemyAttackClip(): AnimationClip {
  return {
    name: 'attack',
    duration: 0.4,
    loop: false,
    tracks: [
      {
        target: 'rightArm',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.08, value: v3(-1.2, 0, 0) },   // 抬手
          { time: 0.18, value: v3(1.5, 0, 0) },     // 前挥
          { time: 0.35, value: v3(0.2, 0, 0) },     // 收势
          { time: 0.4, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 敌人死亡 (侧倒 + 下沉) */
function enemyDeathClip(): AnimationClip {
  return {
    name: 'death',
    duration: 0.8,
    loop: false,
    tracks: [
      {
        target: 'body',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.3, value: v3(0, 0, 1.2) },
          { time: 0.8, value: v3(0, 0, 1.4) },
        ],
      },
      {
        target: 'body',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.4, value: v3(0, -0.03, 0) },
          { time: 0.8, value: v3(0, -0.2, 0) },
        ],
      },
      {
        target: 'model',
        property: 'scale',
        keys: [
          { time: 0, value: v3(1, 1, 1) },
          { time: 0.5, value: v3(1, 1, 1) },
          { time: 0.8, value: v3(0.01, 0.01, 0.01) },
        ],
      },
    ],
  };
}

/** 敌人待机 (呼吸) — 作用于模型根节点 */
function enemyIdleClip(): AnimationClip {
  return {
    name: 'idle',
    duration: 1.2,
    loop: true,
    tracks: [
      {
        target: 'model',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.6, value: v3(0, 0.008, 0) },
          { time: 1.2, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 冰冻状态 (减速颤抖) — 作用于根节点 */
function enemyFrozenClip(): AnimationClip {
  return {
    name: 'frozen',
    duration: 0.3,
    loop: true,
    tracks: [
      {
        target: 'model',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.05, value: v3(0.01, 0, 0) },
          { time: 0.1, value: v3(-0.01, 0, 0) },
          { time: 0.15, value: v3(0.01, 0, 0) },
          { time: 0.2, value: v3(-0.01, 0, 0) },
          { time: 0.3, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 骑兵行走 — 马腿步态 */
function cavalryWalkClip(): AnimationClip {
  const legKeys = (_phase: number) => [
    { time: 0, value: v3(0.25, 0, 0) },
    { time: 0.15, value: v3(-0.25, 0, 0) },
    { time: 0.3, value: v3(0.25, 0, 0) },
    { time: 0.45, value: v3(-0.25, 0, 0) },
    { time: 0.6, value: v3(0.25, 0, 0) },
  ];
  return {
    name: 'walk',
    duration: 0.6,
    loop: true,
    tracks: [
      { target: 'legFL', property: 'rotation', keys: legKeys(0) },
      { target: 'legFR', property: 'rotation', keys: legKeys(0.3) },
      { target: 'legBL', property: 'rotation', keys: legKeys(0.3) },
      { target: 'legBR', property: 'rotation', keys: legKeys(0) },
      {
        target: 'horseBody',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.15, value: v3(0, 0.015, 0) },
          { time: 0.3, value: v3(0, 0, 0) },
          { time: 0.45, value: v3(0, 0.015, 0) },
          { time: 0.6, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

// ─── 塔动画 ──────────────────────────────────────────────

/** 箭塔攻击 (弓臂拉回 + 释放) */
function arrowTowerAttackClip(): AnimationClip {
  return {
    name: 'attack',
    duration: 0.35,
    loop: false,
    tracks: [
      {
        target: 'bowLeft',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.12, value: v3(0, 0, -0.25) },  // 拉弓
          { time: 0.2, value: v3(0, 0, 0.08) },    // 释放反弹
          { time: 0.35, value: v3(0, 0, 0) },      // 复位
        ],
      },
      {
        target: 'bowRight',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.12, value: v3(0, 0, 0.25) },
          { time: 0.2, value: v3(0, 0, -0.08) },
          { time: 0.35, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 炮台攻击 (炮管后座) */
function cannonTowerAttackClip(): AnimationClip {
  return {
    name: 'attack',
    duration: 0.5,
    loop: false,
    tracks: [
      {
        target: 'barrel',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.06, value: v3(-0.06, 0, 0) },   // 后座
          { time: 0.25, value: v3(0.02, 0, 0) },     // 前推恢复
          { time: 0.5, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 冰塔攻击 (水晶脉冲) */
function iceTowerAttackClip(): AnimationClip {
  return {
    name: 'attack',
    duration: 0.45,
    loop: false,
    tracks: [
      {
        target: 'crystal',
        property: 'scale',
        keys: [
          { time: 0, value: v3(1, 1, 1) },
          { time: 0.1, value: v3(1.35, 1.35, 1.35) },  // 膨胀
          { time: 0.25, value: v3(0.85, 0.85, 0.85) },  // 收缩
          { time: 0.35, value: v3(1.05, 1.05, 1.05) },  // 过冲
          { time: 0.45, value: v3(1, 1, 1) },
        ],
      },
      {
        target: 'crystal',
        property: 'position',
        keys: [
          { time: 0, value: v3(0, 0, 0) },
          { time: 0.1, value: v3(0, 0.04, 0) },
          { time: 0.45, value: v3(0, 0, 0) },
        ],
      },
    ],
  };
}

/** 塔待机 (无动画 — 静态) */
function towerIdleClip(): AnimationClip {
  return {
    name: 'idle',
    duration: 1.0,
    loop: true,
    tracks: [],
  };
}

// ─── 城堡动画 ────────────────────────────────────────────

function castleIdleClip(): AnimationClip {
  return {
    name: 'idle',
    duration: 2.0,
    loop: true,
    tracks: [
      {
        target: 'flag',
        property: 'rotation',
        keys: [
          { time: 0, value: v3(0, 0, 0.05) },
          { time: 0.5, value: v3(0, 0, -0.15) },
          { time: 1.0, value: v3(0, 0, 0.08) },
          { time: 1.5, value: v3(0, 0, -0.1) },
          { time: 2.0, value: v3(0, 0, 0.05) },
        ],
      },
    ],
  };
}

// ─── 对外接口 ────────────────────────────────────────────

export function getEnemyClips(type: EnemyType): ClipSet {
  const isCavalry = type === 'horse';
  return {
    [EntityAnimState.IDLE]: enemyIdleClip(),
    [EntityAnimState.WALK]: isCavalry ? cavalryWalkClip() : enemyWalkClip(),
    [EntityAnimState.ATTACK]: enemyAttackClip(),
    [EntityAnimState.DEATH]: enemyDeathClip(),
    [EntityAnimState.FROZEN]: enemyFrozenClip(),
  };
}

export function getTowerClips(type: TowerType): ClipSet {
  let attackClip: AnimationClip;
  switch (type) {
    case 'cannon':
      attackClip = cannonTowerAttackClip();
      break;
    case 'ice':
      attackClip = iceTowerAttackClip();
      break;
    default:
      attackClip = arrowTowerAttackClip();
  }
  return {
    [EntityAnimState.IDLE]: towerIdleClip(),
    [EntityAnimState.ATTACK]: attackClip,
  };
}

export function getCastleClips(): ClipSet {
  return {
    [EntityAnimState.IDLE]: castleIdleClip(),
  };
}
