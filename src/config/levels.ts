import { LevelDefinition } from '../types/game';

export const LEVELS: LevelDefinition[] = [
  {
    mapId: 'yanmen',
    difficulty: 2,
    description: '雁门关地势开阔，敌军可从多路突进。适合新手熟悉守城布阵与基础塔型搭配。'
  },
  {
    mapId: 'jianmen',
    difficulty: 3,
    description: '剑门关一夫当关万夫莫开，蜀道蜿蜒狭窄。考验玩家在有限空间内的布防智慧。'
  },
  {
    mapId: 'shanhai',
    difficulty: 4,
    description: '山海关乃长城入海处，敌军海陆并进。波次漫长，需精打细算才能守住这座天下第一关。'
  },
];
