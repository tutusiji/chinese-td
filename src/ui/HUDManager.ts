import { gameStore, GameStore } from '../store/GameStore';
import { TOWER_TYPES } from '../config/towers';
import { ENEMY_TYPES } from '../config/enemies';
import { TowerType, EnemyType } from '../types/game';
import { playUpgradeSound, playSellSound, playPlaceSound } from './sound';
import { gameManager } from '../engine/GameManager';
import { LevelSelectScreen } from './LevelSelectScreen';
import { describeWave, getDefenseWave } from '../config/waves';
import { UICatalogScreen } from './UICatalogScreen';
import { materialManager } from './MaterialManager';
import { ATTACK_UNIT_UI, DEFENSE_WEAPON_UI, UICatalogItem } from '../config/uiCatalog';
import { renderUIArt } from './uiArt';

export class HUDManager {
  private levelSelect: LevelSelectScreen;
  private uiCatalog: UICatalogScreen;

  constructor() {
    this.levelSelect = new LevelSelectScreen();
    this.uiCatalog = new UICatalogScreen();
    this.hydrateTowerShopArt();
    this.initListeners();
    gameStore.subscribe(this.updateUI.bind(this));
  }

  private initListeners() {
    // 兵器谱点击
    document.querySelectorAll('.shop-item').forEach(item => {
      item.addEventListener('click', () => {
        if (gameStore.gameMode !== 'defense') return;
        const typeStr = item.getAttribute('data-type') as TowerType;
        if (gameStore.selectedType === typeStr) {
          gameStore.selectTowerType(null);
        } else {
          gameStore.selectTowerType(typeStr);
        }
      });
    });

    // 速度按钮
    document.getElementById('speed-btn')?.addEventListener('click', () => {
      let nextSpeed = 1;
      if (gameStore.gameSpeed === 1) nextSpeed = 2;
      else if (gameStore.gameSpeed === 2) nextSpeed = 0;
      gameStore.setSpeed(nextSpeed);
    });

    // 静音按钮
    document.getElementById('sound-btn')?.addEventListener('click', () => {
      gameStore.toggleSound();
    });

    document.getElementById('rush-wave-btn')?.addEventListener('click', () => {
      gameManager.startNextDefenseWave(true);
    });

    // 返回关卡选择
    document.getElementById('back-to-level-btn')?.addEventListener('click', () => {
      this.returnToLevelSelect();
    });

    document.getElementById('ui-catalog-btn')?.addEventListener('click', () => {
      this.uiCatalog.show();
    });

    document.getElementById('material-mgr-btn')?.addEventListener('click', () => {
      materialManager.open();
    });

    document.getElementById('save-game-btn')?.addEventListener('click', async () => {
      if (!gameStore.sessionStarted) return;
      await gameStore.saveGame('slot_1');
      alert('游戏已保存');
    });

    document.getElementById('load-game-btn')?.addEventListener('click', async () => {
      const ok = await gameStore.loadGame('slot_1');
      if (ok) {
        alert('读档成功！即将重启关卡...');
        (window as any).startIsoGame(gameStore.currentMapId, gameStore.gameMode);
      } else {
        alert('没有找到存档');
      }
    });

    // 每波自动存档
    gameStore.subscribe(async (store) => {
      if (store.sessionStarted && store.wave > 0 && store.wave !== (window as any)._lastAutoSaveWave) {
        (window as any)._lastAutoSaveWave = store.wave;
        try { await gameStore.saveGame('auto'); } catch {}
      }
    });

    // 升级塔
    document.getElementById('upgrade-btn')?.addEventListener('click', () => {
      const t = gameStore.selectedTower;
      if (!t) return;
      const success = gameStore.upgradeTower(t);
      if (success) {
        playUpgradeSound();
        const cell = gameStore.cellSize;
        gameManager.addParticles(
          t.c * cell + cell / 2, t.r * cell + cell / 2, 200, 160, 60, 12
        );
      }
    });

    // 拆除塔
    document.getElementById('sell-btn')?.addEventListener('click', () => {
      const t = gameStore.selectedTower;
      if (!t) return;
      gameStore.sellTower(t);
      playSellSound();
    });

    // 发兵按钮 (攻城模式)
    document.getElementById('send-wave-btn')?.addEventListener('click', () => {
      if (!gameStore.canSendWave()) return;
      gameManager.spawnAttackWave();
      playPlaceSound();
    });

    // 失败界面按钮
    document.getElementById('retry-defeat-btn')?.addEventListener('click', () => {
      gameStore.reset();
      if (gameStore.gameMode === 'attack') {
        gameManager.initAIDefense();
      }
    });
    document.getElementById('back-defeat-btn')?.addEventListener('click', () => {
      this.returnToLevelSelect();
    });

    // 胜利界面按钮
    document.getElementById('retry-victory-btn')?.addEventListener('click', () => {
      gameStore.reset();
      if (gameStore.gameMode === 'attack') {
        gameManager.initAIDefense();
      }
    });
    document.getElementById('back-victory-btn')?.addEventListener('click', () => {
      this.returnToLevelSelect();
    });

    // 兵力滑块初始化
    this.initTroopSliders();
  }

  /** 初始化攻城兵力配置滑块 */
  private initTroopSliders() {
    const slotsContainer = document.getElementById('troop-slots');
    if (!slotsContainer) return;

    const troopTypes: { type: EnemyType; label: string; art: UICatalogItem }[] = [
      { type: 'sword', label: '步兵', art: this.getAttackArt('infantry') },
      { type: 'spear', label: '大力士', art: this.getAttackArt('brute') },
      { type: 'horse', label: '骑兵', art: this.getAttackArt('cavalry') },
    ];

    slotsContainer.innerHTML = '';
    for (const troop of troopTypes) {
      const config = ENEMY_TYPES[troop.type];
      const div = document.createElement('div');
      div.className = 'troop-slot';
      div.innerHTML = `
        <div class="troop-header">
          <span class="troop-art">${renderUIArt(troop.art, 'sm')}</span>
          <span class="troop-name">${troop.label}</span>
          <span class="troop-cost">×${config.supply}</span>
        </div>
        <div class="troop-controls">
          <button class="troop-btn troop-minus" data-type="${troop.type}">−</button>
          <span class="troop-count" id="troop-count-${troop.type}">0</span>
          <button class="troop-btn troop-plus" data-type="${troop.type}">+</button>
        </div>
        <div class="troop-stats-row">
          <span>HP:${config.hp}</span>
          <span>速:${config.sp}</span>
          <span>赏:${config.rw}</span>
        </div>
      `;
      slotsContainer.appendChild(div);
    }

    // 绑定 +/- 按钮
    slotsContainer.querySelectorAll('.troop-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type') as 'sword' | 'spear' | 'horse';
        const current = gameStore.attackFormation[type];
        gameStore.setAttackFormation(type, current + 1);
        this.updateTroopUI();
      });
    });
    slotsContainer.querySelectorAll('.troop-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type') as 'sword' | 'spear' | 'horse';
        const current = gameStore.attackFormation[type];
        gameStore.setAttackFormation(type, Math.max(0, current - 1));
        this.updateTroopUI();
      });
    });
  }

  private hydrateTowerShopArt() {
    const artByType: Record<TowerType, string> = {
      arrow: 'arrow_lv1',
      cannon: 'cannon_lv1',
      ice: 'ice_lv1',
    };

    document.querySelectorAll('.shop-item').forEach(item => {
      const type = item.getAttribute('data-type') as TowerType;
      const art = DEFENSE_WEAPON_UI.find(x => x.id === artByType[type]);
      const icon = item.querySelector('.tower-icon');
      if (art && icon) {
        icon.innerHTML = renderUIArt(art, 'sm');
        icon.classList.add('tower-icon-bound');
      }
    });
  }

  private getAttackArt(id: string): UICatalogItem {
    return ATTACK_UNIT_UI.find(item => item.id === id) ?? ATTACK_UNIT_UI[0];
  }

  /** 更新兵力UI */
  private updateTroopUI() {
    const formation = gameStore.attackFormation;
    for (const type of ['sword', 'spear', 'horse'] as const) {
      const countEl = document.getElementById(`troop-count-${type}`);
      if (countEl) countEl.textContent = String(formation[type]);
    }

    // 更新剩余 supply 显示
    const remainingEl = document.getElementById('supply-remaining');
    const cost = gameStore.getFormationSupplyCost();
    const remaining = gameStore.supply - cost;
    if (remainingEl) {
      remainingEl.textContent = String(Math.max(0, remaining));
      remainingEl.style.color = remaining < 0 ? '#c43a31' : '#d4af37';
    }

    // 发兵按钮状态
    const sendBtn = document.getElementById('send-wave-btn') as HTMLButtonElement;
    if (sendBtn) {
      const canSend = gameStore.canSendWave();
      sendBtn.disabled = !canSend;
      sendBtn.style.opacity = canSend ? '1' : '0.4';
    }
  }

  /** 返回关卡选择 */
  returnToLevelSelect() {
    gameStore.endSession();
    this.levelSelect.show();
    this.levelSelect['renderCards'](); // 刷新卡片
  }

  /** 主UI更新 */
  private updateUI(store: GameStore) {
    const isAttack = store.gameMode === 'attack';

    // 模式切换UI
    const towerShop = document.getElementById('tower-shop-section');
    const troopConfig = document.getElementById('troop-config-section');
    if (towerShop) towerShop.style.display = !store.sessionStarted || isAttack ? 'none' : '';
    if (troopConfig) troopConfig.classList.toggle('hidden', !store.sessionStarted || !isAttack);

    // HP 显示 (守城=城池HP, 攻城=敌方城池HP)
    const hpVal = document.getElementById('hp-val');
    if (hpVal && store.castle) {
      hpVal.textContent = String(store.castle.hp);
    }

    // Supply 显示
    const supplyItem = document.getElementById('supply-stat-item');
    const supplyVal = document.getElementById('supply-val');
    if (supplyItem) supplyItem.classList.toggle('hidden', !isAttack);
    if (supplyVal) supplyVal.textContent = String(store.supply);

    // 金币
    const goldVal = document.getElementById('gold-val');
    if (goldVal) goldVal.textContent = String(store.gold);

    // 波次信息
    this.updateWaveUI(store, isAttack);

    // 兵器商店 (守城模式)
    if (!isAttack) {
      document.querySelectorAll('.shop-item').forEach(item => {
        const typeStr = item.getAttribute('data-type') as TowerType;
        const config = TOWER_TYPES[typeStr];
        if (!config) return;
        if (store.gold < config.c) item.classList.add('disabled');
        else item.classList.remove('disabled');
        if (store.selectedType === typeStr) item.classList.add('selected');
        else item.classList.remove('selected');
      });
    }

    // 兵力配置UI (攻城模式)
    if (isAttack) {
      this.updateTroopUI();
    }

    // 倍速
    const speedBtn = document.getElementById('speed-btn');
    if (speedBtn) {
      speedBtn.textContent = store.gameSpeed === 0 ? '速度: 暂停' : `速度: ${store.gameSpeed}x`;
    }

    // 静音
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
      soundBtn.textContent = `音效: ${store.soundEnabled ? '开' : '关'}`;
    }

    // 塔控制面板
    this.updateTowerPanel(store);

    // 遮罩层
    const defeatScreen = document.getElementById('defeat-screen');
    if (defeatScreen) {
      defeatScreen.classList.toggle('hidden', !store.gameOver);
    }
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.classList.toggle('hidden', !store.gameWon);
    }
  }

  private updateWaveUI(store: GameStore, isAttack: boolean) {
    const waveLabel = document.getElementById('wave-label-text');
    const waveCount = document.getElementById('wave-count');
    const waveProgress = document.getElementById('wave-progress');
    const nextWavePreview = document.getElementById('next-wave-preview');
    const rushWaveBtn = document.getElementById('rush-wave-btn') as HTMLButtonElement | null;

    if (!store.sessionStarted) {
      if (waveCount) waveCount.textContent = '--';
      if (waveLabel) waveLabel.textContent = '请选择关卡';
      if (waveProgress) waveProgress.style.width = '0%';
      if (nextWavePreview) nextWavePreview.textContent = '选择守城或攻城后开始推演';
      if (rushWaveBtn) rushWaveBtn.classList.add('hidden');
      return;
    }

    if (isAttack) {
      if (waveCount) waveCount.textContent = `⚔️ 攻城`;
      if (waveLabel) waveLabel.textContent = store.enemies.length > 0
        ? `部队推进中 (${store.enemies.length})`
        : '待发兵...';
      if (waveProgress) waveProgress.style.width = store.supply > 0 ? `${(store.supply / store.maxSupply) * 100}%` : '0%';
      if (nextWavePreview) nextWavePreview.textContent = '观察守军火力，分波破阵';
      if (rushWaveBtn) rushWaveBtn.classList.add('hidden');
      return;
    }

    const hasActiveWave = store.enemies.length > 0 || store.spawnQueue.length > 0;
    const canRush = !store.gameWon &&
      store.wave < store.currentMap.defenseWaves &&
      !hasActiveWave &&
      (store.wave === 0 || store.spawnedCount >= store.totalSpawned);
    if (rushWaveBtn) {
      rushWaveBtn.classList.toggle('hidden', !canRush);
      rushWaveBtn.textContent = store.wave === 0
        ? '立即开战'
        : `提前迎敌 +${gameManager.getRushReward()}金`;
    }

    if (nextWavePreview) {
      const nextWave = Math.min(store.wave + 1, store.currentMap.defenseWaves);
      if (store.gameWon) {
        nextWavePreview.textContent = '关隘已守住';
      } else if (hasActiveWave) {
        const def = getDefenseWave(store.wave);
        nextWavePreview.textContent = `${def.title}: ${def.hint}`;
      } else if (store.wave < store.currentMap.defenseWaves) {
        nextWavePreview.textContent = `下一波 ${describeWave(nextWave)}`;
      } else {
        nextWavePreview.textContent = '敌军已尽';
      }
    }

    if (waveCount) {
      waveCount.textContent = `${store.wave}/${store.currentMap.defenseWaves}`;
    }

    if (waveLabel && waveProgress) {
      if (store.gameWon) {
        waveLabel.textContent = '战役胜利！';
        waveProgress.style.width = '100%';
      } else if (store.wave > 0) {
        if (store.enemies.length === 0 && store.spawnedCount >= store.totalSpawned) {
          const pct = (store.waveCD / 150) * 100;
          waveProgress.style.width = `${pct}%`;
          const nextSec = Math.max(0, Math.ceil((150 - store.waveCD) / 60));
          waveLabel.textContent = `下波将至 (${nextSec}s)`;
        } else {
          const total = store.totalSpawned || 1;
          const progress = (store.spawnedCount / total) * 100;
          waveProgress.style.width = `${progress}%`;
          waveLabel.textContent = store.spawnQueue.length > 0
            ? `第 ${store.wave} 波 (敌军入场 ${store.spawnQueue.length})`
            : `第 ${store.wave} 波 (御敌中)`;
        }
      } else {
        waveLabel.textContent = '敌军将至...';
        const pct = (store.waveCD / 120) * 100;
        waveProgress.style.width = `${pct}%`;
      }
    }
  }

  private updateTowerPanel(store: GameStore) {
    const panel = document.getElementById('selected-tower-panel');
    if (!panel) return;

    if (store.selectedTower) {
      const t = store.selectedTower;
      const config = TOWER_TYPES[t.type];
      const ucost = store.getTowerUpgradeCost(t);
      const sellRefund = store.getTowerSellRefund(t);

      const panelTitle = document.getElementById('panel-tower-title');
      if (panelTitle) panelTitle.textContent = `${config.n} 等阶.${t.level}`;

      const panelStatAtk = document.getElementById('panel-stat-atk');
      if (panelStatAtk) {
        panelStatAtk.textContent = `伤害: ${Math.floor(config.d * (1 + (t.level - 1) * 0.5))}`;
      }

      const panelStatRange = document.getElementById('panel-stat-range');
      if (panelStatRange) {
        panelStatRange.textContent = `射程: ${Math.floor(t.range)}`;
      }

      const upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
      if (upgradeBtn) {
        upgradeBtn.textContent = `升级 💰${ucost}`;
        if (store.gold < ucost) upgradeBtn.classList.add('disabled');
        else upgradeBtn.classList.remove('disabled');
      }

      const sellBtn = document.getElementById('sell-btn');
      if (sellBtn) sellBtn.textContent = `拆除 💰${sellRefund}`;

      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
    }
  }
}
