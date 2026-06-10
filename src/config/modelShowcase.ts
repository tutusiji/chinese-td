import { MODEL_ASSETS, ModelAssetDefinition } from './modelAssets';

const modelImages = import.meta.glob('../assets/generated/models/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export interface ModelShowcaseItem extends ModelAssetDefinition {
  image: string;
  motion: 'unit' | 'tower' | 'heavy';
}

function motionFor(asset: ModelAssetDefinition): ModelShowcaseItem['motion'] {
  if (asset.group === 'attack') return asset.id.includes('trebuchet') || asset.id === 'ram' ? 'heavy' : 'unit';
  if (asset.group === 'defense' || asset.group === 'structure') return asset.id.includes('cannon') || asset.id.includes('stone') ? 'heavy' : 'tower';
  return 'tower';
}

function resolveImage(asset: ModelAssetDefinition): string {
  const key = `../assets/generated/models/${asset.path}`;
  const image = modelImages[key];
  if (!image) {
    throw new Error(`Missing model asset image: ${asset.path}`);
  }
  return image;
}

export const MODEL_SHOWCASE: ModelShowcaseItem[] = MODEL_ASSETS.map(asset => ({
  ...asset,
  image: resolveImage(asset),
  motion: motionFor(asset),
}));
