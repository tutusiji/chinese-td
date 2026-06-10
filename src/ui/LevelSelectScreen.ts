import { MAPS } from '../config/maps';
import { LEVELS } from '../config/levels';
import { GameMode } from '../types/game';

export class LevelSelectScreen {
  private screen: HTMLElement;
  private cardsContainer: HTMLElement;

  constructor() {
    this.screen = document.getElementById('level-select-screen')!;
    this.cardsContainer = document.getElementById('level-cards')!;
    this.renderCards();
  }

  private renderCards() {
    this.cardsContainer.innerHTML = '';

    for (const level of LEVELS) {
      const map = MAPS[level.mapId];
      if (!map) continue;

      const card = document.createElement('div');
      card.className = 'level-card';

      // 主题色预览条
      const themeBar = document.createElement('div');
      themeBar.className = 'level-card-theme';
      const gradient = map.mountainTheme.layers
        .map(l => `rgb(${l.r},${l.g},${l.b})`)
        .join(', ');
      themeBar.style.background = `linear-gradient(90deg, ${gradient})`;

      // 卡片内容
      card.innerHTML = `
        <h3 class="level-name">${map.name}</h3>
        <p class="level-subtitle">${map.subtitle}</p>
        <div class="level-difficulty">${'★'.repeat(level.difficulty)}${'☆'.repeat(5 - level.difficulty)}</div>
        <p class="level-desc">${level.description}</p>
        <div class="level-actions">
          <button class="level-btn defense-btn" data-map="${map.id}" data-mode="defense">🛡️ 守城</button>
          <button class="level-btn attack-btn" data-map="${map.id}" data-mode="attack">⚔️ 攻城</button>
        </div>
      `;

      card.insertBefore(themeBar, card.firstChild);
      this.cardsContainer.appendChild(card);
    }

    // 绑定按钮事件
    this.cardsContainer.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const mapId = target.getAttribute('data-map')!;
        const mode = target.getAttribute('data-mode') as GameMode;
        this.startGame(mapId, mode);
      });
    });
  }

  private startGame(mapId: string, mode: GameMode) {
    // 隐藏关卡选择
    this.hide();

    // 更新HUD标题
    const map = MAPS[mapId];
    const modeLabel = document.getElementById('hud-mode-label');
    if (modeLabel) {
      const modeText = mode === 'defense' ? '守城' : '攻城';
      modeLabel.textContent = `${modeText} · ${map.name}`;
    }

    // 调用全局启动函数 (main.ts 注入)
    const startFn = (window as any).startIsoGame;
    if (startFn) {
      startFn(mapId, mode);
    }
  }

  show() {
    this.screen.classList.remove('hidden');
  }

  hide() {
    this.screen.classList.add('hidden');
  }
}
