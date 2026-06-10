import { UICatalogItem } from '../config/uiCatalog';
import { UI_ATLAS } from '../config/uiAtlas';
import uiStyleBoardUrl from '../assets/generated/ui-style-board.png';

export function renderUIArt(item: UICatalogItem, size: 'sm' | 'md' = 'md'): string {
  const region = UI_ATLAS[item.id];
  if (region) {
    return `
      <div class="asset-icon asset-atlas asset-${size}" style="--atlas-url:url('${uiStyleBoardUrl}');--atlas-x:${region.x}%;--atlas-y:${region.y}%;" title="${item.name}">
        <span class="sr-only">${item.name}</span>
      </div>
    `;
  }

  const [base, accent, dark] = item.palette;
  const levelClass = item.level ? ` asset-level-${item.level}` : '';
  const towers = item.group === 'defense'
    ? '<span class="asset-roof"></span><span class="asset-base"></span>'
    : '';

  return `
    <div class="asset-icon ${item.group} asset-${size}${levelClass}" style="--asset-base:${base};--asset-accent:${accent};--asset-dark:${dark};">
      <span class="asset-halo"></span>
      ${towers}
      <span class="asset-glyph">${item.glyph}</span>
    </div>
  `;
}
