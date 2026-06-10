import { HUDManager } from "./ui/HUDManager";
import { pixiApp } from './engine/PixiApp';
import { IsoWorld } from './engine/IsoWorld';
import { IsoRenderer } from './render/IsoRenderer';
import { TileMap } from './render/TileMap';
import { Web3DRenderer } from './render/Web3DRenderer';
import { gameStore } from './store/GameStore';
import { gameManager, setIsoWorld } from './engine/GameManager';
import { TOWER_TYPES } from './config/towers';
import { playPlaceSound } from './ui/sound';
import { TowerType } from './types/game';

let isoWorld: IsoWorld;
let tileMap: TileMap;
let isoRenderer: IsoRenderer;
let web3dRenderer: Web3DRenderer;

async function main() {
  try {
    console.log('[墨守] 初始化...');
    await pixiApp.init('canvas-container', '#1a1410');
    console.log('[墨守] PixiJS OK:', pixiApp.width, 'x', pixiApp.height);

    // 等距世界 (长期持有，不销毁)
    isoWorld = new IsoWorld(gameStore.currentMap);
    setIsoWorld(isoWorld);

    // 地图 + 实体渲染
    tileMap = new TileMap(isoWorld);
    tileMap.buildFromMap(gameStore.currentMap);
    isoRenderer = new IsoRenderer(isoWorld);
    web3dRenderer = new Web3DRenderer(
      document.getElementById('canvas-container')!,
      gameStore.currentMap,
      isoWorld
    );

    // UI
    new HUDManager();

    // 主循环
    pixiApp.onTick(() => {
      if (gameStore.sessionStarted && !gameStore.gameOver && !gameStore.gameWon && gameStore.gameSpeed > 0) {
        gameManager.update();
      }
      isoRenderer.sync(gameStore.towers, gameStore.enemies, gameStore.bullets, gameStore.castle);
      web3dRenderer.sync(gameStore.towers, gameStore.enemies, gameStore.bullets, gameStore.castle);
    });

    // 交互
    bindInteraction();

    // 键盘
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') resetGame();
      if (e.key === 'Escape') { gameStore.selectTowerType(null); gameStore.selectTowerInstance(null); isoRenderer.clearRangeCircle(); }
      if (e.key === '1') selectShortcut('arrow');
      if (e.key === '2') selectShortcut('cannon');
      if (e.key === '3') selectShortcut('ice');
    });

    window.addEventListener('resize', () => {
      const container = document.getElementById('canvas-container');
      if (container) web3dRenderer.resize(container.clientWidth, container.clientHeight);
    });

    console.log('[墨守] ✅ 就绪');
  } catch (err) {
    console.error('[墨守] 初始化失败:', err);
  }
}

/** 开始/切换关卡 */
(window as any).startIsoGame = (mapId: string, mode: string) => {
  try {
    console.log('[墨守] 启动关卡:', mapId, mode);

    // 切换地图
    gameStore.selectMap(mapId);
    gameStore.setGameMode(mode as any);
    gameStore.beginSession();
    gameStore.reset();

    // 更新世界参数
    const map = gameStore.currentMap;
    isoWorld.map = map;
    isoWorld.iso.halfTileW = map.tileWidth / 2;
    isoWorld.iso.halfTileH = map.tileHeight / 2;

    // 重建地面
    tileMap.buildFromMap(map);
    web3dRenderer.buildFromMap(map);
    console.log('[墨守] 地面:', map.rows * map.cols, '块');

    // 重建实体渲染器
    isoRenderer.destroy();
    isoRenderer = new IsoRenderer(isoWorld);

    // 攻城AI
    if (mode === 'attack') {
      gameManager.initAIDefense();
      gameManager.syncTowerPositions();
    }

    isoWorld.camera.updateViewSize(pixiApp.width, pixiApp.height);
    // 自动适配显示整个地图全貌，保持地图主体居中。
    isoWorld.fitMapToView(80);

    console.log('[墨守] ✅', map.name, mode);
  } catch (err) {
    console.error('[墨守] 启动失败:', err);
  }
};

function resetGame() {
  if (!gameStore.sessionStarted) return;
  gameStore.reset();
  tileMap.buildFromMap(gameStore.currentMap);
  web3dRenderer.buildFromMap(gameStore.currentMap);
  isoRenderer.destroy();
  isoRenderer = new IsoRenderer(isoWorld);
  if (gameStore.gameMode === 'attack') {
    gameManager.initAIDefense();
    gameManager.syncTowerPositions();
  }
}

function selectShortcut(type: TowerType) {
  if (!gameStore.sessionStarted) return;
  if (gameStore.gold >= TOWER_TYPES[type].c) gameStore.selectTowerType(type);
}

function bindInteraction() {
  const canvas = pixiApp.app.canvas as HTMLCanvasElement;
  if (!canvas) return;

  canvas.addEventListener('click', (e) => {
    if (!gameStore.sessionStarted || gameStore.gameOver || gameStore.gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const grid = isoWorld.screenToGrid(sx, sy);
    if (!grid || grid.r < 0 || grid.r >= gameStore.rows || grid.c < 0 || grid.c >= gameStore.cols) return;

    const { r, c } = grid;
    const cellType = gameStore.grid[r]?.[c];
    if (cellType === 'path' || cellType === 'start' || cellType === 'end' || cellType === 'castle' || cellType === 'wall') {
      gameStore.selectTowerInstance(null);
      isoRenderer.clearRangeCircle();
      return;
    }

    const existing = gameStore.towers.find(t => t.r === r && t.c === c);

    if (gameStore.selectedType && !existing && gameStore.canBuildAt(r, c)) {
      const { success, tower } = gameStore.buildTower(r, c, gameStore.selectedType);
      if (success && tower) {
        const pos = isoWorld.gridToWorld(r, c, 0);
        tower.worldX = pos.x;
        tower.worldY = pos.y;
        playPlaceSound();
        gameManager.addParticles(pos.x, pos.y, 200, 160, 60, 8);
        gameStore.selectTowerType(null);
      }
    } else if (existing) {
      gameStore.selectTowerInstance(existing);
      const pos = isoWorld.gridToWorld(r, c, 0);
      isoRenderer.showRangeCircle(pos.x, pos.y, existing.range);
    } else {
      gameStore.selectTowerInstance(null);
      gameStore.selectTowerType(null);
      isoRenderer.clearRangeCircle();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!gameStore.sessionStarted || gameStore.gameOver || gameStore.gameWon) return;
    const rect = canvas.getBoundingClientRect();
    const grid = isoWorld.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
    if (!grid) return;

    const { r, c } = grid;
    if (r < 0 || r >= gameStore.rows || c < 0 || c >= gameStore.cols) return;

    tileMap.clearHighlights();
    const ct = gameStore.grid[r]?.[c];
    if (ct !== 'path' && ct !== 'start' && ct !== 'end' && ct !== 'castle' && ct !== 'wall') {
      tileMap.highlightTile(r, c, 0xffdd66, 0.25);
    }
  });
}

main();
