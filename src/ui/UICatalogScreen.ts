import { ATTACK_UNIT_UI, DEFENSE_WEAPON_UI, RESOURCE_UI, TERRAIN_UI, UICatalogItem } from '../config/uiCatalog';
import uiStyleBoardUrl from '../assets/generated/ui-style-board.png';
import { renderUIArt } from './uiArt';
import { MODEL_SHOWCASE, ModelShowcaseItem } from '../config/modelShowcase';

export class UICatalogScreen {
  private screen: HTMLElement;
  private content: HTMLElement;

  constructor() {
    this.screen = document.getElementById('ui-catalog-screen')!;
    this.content = document.getElementById('ui-catalog-content')!;
    this.render();
    this.bind();
  }

  show() {
    this.screen.classList.remove('hidden');
  }

  hide() {
    this.screen.classList.add('hidden');
  }

  private bind() {
    document.getElementById('ui-catalog-close')?.addEventListener('click', () => this.hide());
  }

  private render() {
    this.content.innerHTML = [
      this.renderModelShowcase(),
      this.renderArtBoard(),
      this.renderSection('攻城职业', ATTACK_UNIT_UI),
      this.renderSection('防守武器升级', DEFENSE_WEAPON_UI),
      this.renderSection('地图地形', TERRAIN_UI),
      this.renderSection('生存建造资源', RESOURCE_UI),
    ].join('');
  }

  private renderModelShowcase(): string {
    return `
      <section class="catalog-section">
        <div class="catalog-section-head">
          <h3>2.5D 动态模型</h3>
          <span>独立模型图 + 伪 3D 动效</span>
        </div>
        <div class="model-showcase-grid">
          ${MODEL_SHOWCASE.map(item => this.renderModelCard(item)).join('')}
        </div>
      </section>
    `;
  }

  private renderModelCard(item: ModelShowcaseItem): string {
    return `
      <article class="model-card ${item.motion}">
        <div class="model-stage">
          <span class="model-shadow"></span>
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="model-meta">
          <strong>${item.name}</strong>
          <span>${item.description}</span>
        </div>
      </article>
    `;
  }

  private renderArtBoard(): string {
    return `
      <section class="catalog-section">
        <div class="catalog-section-head">
          <h3>美术总览</h3>
          <span>生成图用于统一风格，单项卡片用于实际 UI 接入</span>
        </div>
        <div class="catalog-art-board">
          <img src="${uiStyleBoardUrl}" alt="中国风攻城守城 UI 图总览" onerror="this.parentElement?.classList.add('missing-art')" />
          <p>等待生成 ui-style-board.png</p>
        </div>
      </section>
    `;
  }

  private renderSection(title: string, items: UICatalogItem[]): string {
    return `
      <section class="catalog-section">
        <div class="catalog-section-head">
          <h3>${title}</h3>
          <span>${items.length} 项</span>
        </div>
        <div class="catalog-grid">
          ${items.map(item => this.renderCard(item)).join('')}
        </div>
      </section>
    `;
  }

  private renderCard(item: UICatalogItem): string {
    return `
      <article class="catalog-card">
        ${renderUIArt(item)}
        <div class="catalog-card-body">
          <div class="catalog-card-title">
            <strong>${item.name}</strong>
            <span>${item.subtitle}</span>
          </div>
          <p>${item.role}</p>
        </div>
      </article>
    `;
  }
}
