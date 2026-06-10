import * as THREE from 'three';
import { MapDefinition } from '../types/game';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Castle } from '../entities/Castle';
import { IsoWorld } from '../engine/IsoWorld';
import { ModelFactory } from './ProceduralModels';
import { AnimationController, EntityAnimState } from './AnimationController';
import { getEnemyClips, getTowerClips, getCastleClips } from './AnimationClips';
import { Camera3D } from './Camera3D';

type EntityKey = Tower | Enemy | Bullet;

interface DyingEntry {
  model: THREE.Group;
  controller: AnimationController;
}

export class Web3DRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private camera3D: Camera3D;
  private root = new THREE.Group();
  private mapGroup = new THREE.Group();
  private entityGroup = new THREE.Group();
  // 模型映射
  private towerModels = new Map<Tower, THREE.Group>();
  private enemyModels = new Map<Enemy, THREE.Group>();
  private bulletModels = new Map<Bullet, THREE.Group>();
  private castleModel: THREE.Group | null = null;
  // 动画控制器
  private animControllers = new Map<EntityKey, AnimationController>();
  private dyingModels: DyingEntry[] = [];
  // 时间
  private lastTime: number = performance.now();
  // 地图参数
  private map: MapDefinition;
  private isoWorld: IsoWorld;
  private tileW = 1.15;
  private tileD = 1.15;

  constructor(container: HTMLElement, map: MapDefinition, isoWorld: IsoWorld) {
    this.map = map;
    this.isoWorld = isoWorld;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101714);
    this.camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth || 1100, container.clientHeight || 800);
    this.renderer.domElement.className = 'web3d-canvas';
    container.prepend(this.renderer.domElement);

    this.scene.add(this.root);
    this.root.add(this.mapGroup);
    this.root.add(this.entityGroup);

    // 3D 轨道摄像机
    this.camera3D = new Camera3D(this.camera, this.renderer.domElement);

    this.addLights();
    this.resize(container.clientWidth || 1100, container.clientHeight || 800);
    this.buildFromMap(map);
  }

  buildFromMap(map: MapDefinition) {
    this.map = map;
    this.mapGroup.clear();
    this.clearAllEntities();
    this.castleModel = null;

    const pathSet = new Set<string>();
    for (const path of map.paths) {
      for (const pt of path) pathSet.add(`${pt.r},${pt.c}`);
    }
    const wallSet = new Set(map.wallGrids.map(p => `${p.r},${p.c}`));
    const terrain = new Map((map.terrain ?? []).map(t => [`${t.r},${t.c}`, t.type]));

    const terrainTypes: string[] = ['mountain', 'tree', 'grass', 'river'];

    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        const key = `${r},${c}`;
        const type = key === `${map.castleGrid.r},${map.castleGrid.c}` ? 'castle'
          : wallSet.has(key) ? 'wall'
          : pathSet.has(key) ? 'path'
          : terrain.get(key) ?? 'buildable';
        const pos = this.gridTo3D(r, c);

        if (terrainTypes.includes(type)) {
          // 使用程序化地形模型
          const seed = r * 1000 + c;
          const tile = ModelFactory.createTerrainTile(type as any, seed);
          const height = (tile.userData as any).height ?? 0.12;
          tile.position.set(pos.x, pos.y + height / 2, pos.z);
          this.mapGroup.add(tile);
        } else {
          const tile = this.createTile(type);
          const height = (tile.userData as any).height ?? 0.12;
          tile.position.set(pos.x, pos.y + height / 2, pos.z);
          this.mapGroup.add(tile);
        }
      }
    }

    this.centerMap();
  }

  sync(towers: Tower[], enemies: Enemy[], bullets: Bullet[], castle: Castle | null) {
    const now = performance.now();
    const dtSec = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // ── 1. 清理已不存在的实体模型 ──────────────────────────
    this.cleanStale(towers, enemies, bullets);

    // ── 2. 死亡动画处理 ────────────────────────────────────
    this.updateDying(dtSec);

    // ── 3. 同步敌兵 ────────────────────────────────────────
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue; // 交给死亡动画
      this.syncEnemy(enemy);
    }

    // ── 4. 同步塔 ──────────────────────────────────────────
    for (const tower of towers) {
      this.syncTower(tower);
    }

    // ── 5. 同步子弹 ────────────────────────────────────────
    for (const bullet of bullets) {
      this.syncBullet(bullet);
    }

    // ── 6. 同步城堡 ────────────────────────────────────────
    if (castle && !this.castleModel) {
      this.castleModel = ModelFactory.createCastle();
      this.entityGroup.add(this.castleModel);
      const clips = getCastleClips();
      if (clips[EntityAnimState.IDLE]) {
        const ctrl = new AnimationController(this.castleModel, clips);
        ctrl.play(EntityAnimState.IDLE);
        this.animControllers.set(castle as any, ctrl);
      }
    }
    if (castle && this.castleModel) {
      const pos = this.gridTo3D(castle.gridR, castle.gridC, 0.4);
      this.castleModel.position.set(pos.x, pos.y, pos.z);
      // castle damaged visual: scale body down based on HP ratio
      const bodyNode = this.castleModel.getObjectByName('body');
      if (bodyNode) {
        const hpRatio = castle.hp / Math.max(1, castle.maxHp);
        const s = 0.9 + hpRatio * 0.1;
        bodyNode.scale.set(1, s, 1);
      }
    }

    // ── 7. 更新所有动画 ────────────────────────────────────
    for (const [, ctrl] of this.animControllers) {
      if (ctrl.isPlaying()) {
        ctrl.update(dtSec);
      }
    }

    this.render();
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    const aspect = width / Math.max(1, height);
    const baseH = Math.max(18, Math.max(this.map.rows, this.map.cols) * 0.92);
    const zoom = this.camera3D.currentZoom;
    const viewH = baseH / zoom;
    const viewW = viewH * aspect;
    this.camera.left = -viewW / 2;
    this.camera.right = viewW / 2;
    this.camera.top = viewH / 2;
    this.camera.bottom = -viewH / 2;
    this.camera.updateProjectionMatrix();
    this.camera3D.syncFromCamera();
  }

  destroy() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ── 私有方法 ─────────────────────────────────────────────

  private syncEnemy(enemy: Enemy) {
    let model = this.enemyModels.get(enemy);
    let ctrl = this.animControllers.get(enemy);

    if (!model) {
      model = ModelFactory.createEnemy(enemy.t);
      this.entityGroup.add(model);
      this.enemyModels.set(enemy, model);

      ctrl = new AnimationController(model, getEnemyClips(enemy.t));
      ctrl.play(EntityAnimState.IDLE);
      this.animControllers.set(enemy, ctrl);
    }

    // 位置
    const grid = this.isoWorld.worldToGrid(enemy.x, enemy.y);
    const pos = this.gridTo3D(grid.r, grid.c, 0.38);
    model.position.set(pos.x, pos.y, pos.z);

    // 模型朝向移动方向
    if (enemy.worldPath && enemy.pi < enemy.worldPath.length - 1) {
      const next = enemy.worldPath[enemy.pi + 1];
      const dx = next.x - enemy.x;
      const dy = next.y - enemy.y;
      model.rotation.y = Math.atan2(dx, dy);
    }

    // 动画状态驱动
    if (ctrl) {
      if (enemy.frozen > 0 && ctrl.currentState !== EntityAnimState.FROZEN) {
        ctrl.play(EntityAnimState.FROZEN);
        this.setFrozenTint(model, true);
      } else if (enemy.frozen <= 0 && ctrl.currentState === EntityAnimState.FROZEN) {
        this.setFrozenTint(model, false);
        ctrl.play(EntityAnimState.WALK);
      } else if (enemy.frozen <= 0 && ctrl.currentState !== EntityAnimState.WALK) {
        ctrl.play(EntityAnimState.WALK);
      }
    }
  }

  private syncTower(tower: Tower) {
    let model = this.towerModels.get(tower);
    let ctrl = this.animControllers.get(tower);

    if (!model) {
      model = ModelFactory.createTower(tower.type, tower.level);
      this.entityGroup.add(model);
      this.towerModels.set(tower, model);

      ctrl = new AnimationController(model, getTowerClips(tower.type));
      ctrl.play(EntityAnimState.IDLE);
      this.animControllers.set(tower, ctrl);
    }

    // 位置
    const pos = this.gridTo3D(tower.r, tower.c, 0.4);
    model.position.set(pos.x, pos.y, pos.z);

    // 攻击动画
    if (tower.justFired && ctrl) {
      ctrl.play(EntityAnimState.ATTACK);
      // 攻击结束后回到 IDLE
      const attackClip = (ctrl as any).clips?.[EntityAnimState.ATTACK];
      if (attackClip && !attackClip.loop) {
        const orig = attackClip.onComplete;
        attackClip.onComplete = () => {
          // 升级后的模型可能变了，这里安全处理
          ctrl?.play(EntityAnimState.IDLE);
          attackClip.onComplete = orig;
        };
      }
      tower.justFired = false;
    }
  }

  private syncBullet(bullet: Bullet) {
    let model = this.bulletModels.get(bullet);

    if (!model) {
      model = ModelFactory.createBullet(bullet.type);
      this.entityGroup.add(model);
      this.bulletModels.set(bullet, model);
    }

    // 位置
    const grid = this.isoWorld.worldToGrid(bullet.x, bullet.y);
    const pos = this.gridTo3D(grid.r, grid.c, 0.65);
    model.position.set(pos.x, pos.y, pos.z);

    // 子弹朝向目标
    if (bullet.target) {
      model.rotation.z = Math.atan2(
        bullet.target.y - bullet.y,
        bullet.target.x - bullet.x,
      ) - Math.PI / 2;
    }
  }

  /** 清理不存在的实体，转移到死亡动画 */
  private cleanStale(towers: Tower[], enemies: Enemy[], bullets: Bullet[]) {
    // 塔
    for (const [tower, model] of this.towerModels) {
      if (!towers.includes(tower)) {
        this.entityGroup.remove(model);
        this.towerModels.delete(tower);
        this.animControllers.delete(tower);
      }
    }

    // 敌兵 → 播放死亡动画
    for (const [enemy, model] of this.enemyModels) {
      if (!enemies.includes(enemy) || enemy.hp <= 0) {
        const ctrl = this.animControllers.get(enemy);
        this.enemyModels.delete(enemy);
        this.animControllers.delete(enemy);

        if (ctrl && enemy.hp <= 0) {
          ctrl.play(EntityAnimState.DEATH);
          this.dyingModels.push({ model, controller: ctrl });
        } else {
          this.entityGroup.remove(model);
        }
      }
    }

    // 子弹
    for (const [bullet, model] of this.bulletModels) {
      if (!bullets.includes(bullet)) {
        this.entityGroup.remove(model);
        this.bulletModels.delete(bullet);
      }
    }
  }

  /** 更新死亡动画，完成后移除模型 */
  private updateDying(dtSec: number) {
    for (let i = this.dyingModels.length - 1; i >= 0; i--) {
      const entry = this.dyingModels[i];
      entry.controller.update(dtSec);

      if (!entry.controller.isPlaying()) {
        this.entityGroup.remove(entry.model);
        this.dyingModels.splice(i, 1);
      }
    }
  }

  /** 冰冻色调 */
  private setFrozenTint(model: THREE.Group, frozen: boolean) {
    model.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !('color' in mat)) return;
      if (frozen) {
        if (!(mat as any)._origColor) (mat as any)._origColor = mat.color.getHex();
        mat.color.setHex(0x7ec8f8);
        if (mat.emissive) mat.emissive.setHex(0x114466);
        mat.emissiveIntensity = 0.3;
      } else if ((mat as any)._origColor) {
        mat.color.setHex((mat as any)._origColor);
        if (mat.emissive) mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }

  private clearAllEntities() {
    for (const model of this.towerModels.values()) this.entityGroup.remove(model);
    for (const model of this.enemyModels.values()) this.entityGroup.remove(model);
    for (const model of this.bulletModels.values()) this.entityGroup.remove(model);
    for (const entry of this.dyingModels) this.entityGroup.remove(entry.model);
    if (this.castleModel) this.entityGroup.remove(this.castleModel);

    this.towerModels.clear();
    this.enemyModels.clear();
    this.bulletModels.clear();
    this.animControllers.clear();
    this.dyingModels = [];
    this.castleModel = null;
  }

  private createTile(type: string): THREE.Mesh {
    const color = this.tileColor(type);
    const height = type === 'wall' ? 0.36 : type === 'mountain' ? 0.62 : type === 'tree' ? 0.24 : 0.12;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(this.tileW, height, this.tileD),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 }),
    );
    (mesh.userData as any).height = height;
    return mesh;
  }

  private gridTo3D(r: number, c: number, y: number = 0): THREE.Vector3 {
    return new THREE.Vector3(c * this.tileW, y, r * this.tileD);
  }

  private centerMap() {
    const center = this.gridTo3D((this.map.rows - 1) / 2, (this.map.cols - 1) / 2, 0);
    const span = Math.max(this.map.rows, this.map.cols) * 0.58;
    this.camera3D.setTarget(center.x, 0, center.z);
    this.camera3D.reset(span * Math.sqrt(2));
  }

  private render() {
    // 每帧根据 zoom 调整 ortho frustum
    const aspect = this.renderer.domElement.clientWidth / Math.max(1, this.renderer.domElement.clientHeight);
    const baseH = Math.max(18, Math.max(this.map.rows, this.map.cols) * 0.92);
    const zoom = Math.max(0.1, this.camera3D.currentZoom);
    const viewH = baseH / zoom;
    const viewW = viewH * aspect;
    this.camera.left = -viewW / 2;
    this.camera.right = viewW / 2;
    this.camera.top = viewH / 2;
    this.camera.bottom = -viewH / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  private addLights() {
    // 降低环境光，增强 3D 几何体的立体感
    this.scene.add(new THREE.AmbientLight(0xd7e6da, 0.7));
    const key = new THREE.DirectionalLight(0xffe0a8, 1.8);
    key.position.set(6, 10, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.6);
    fill.position.set(-3, 4, -2);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0x80c8ff, 0.5);
    rim.position.set(-8, 6, -5);
    this.scene.add(rim);
  }

  private tileColor(type: string): number {
    if (type === 'path') return 0x4a3a2c;
    if (type === 'castle') return 0x665346;
    if (type === 'wall') return 0x5b5146;
    if (type === 'mountain') return 0x516052;
    if (type === 'tree') return 0x244c34;
    if (type === 'river') return 0x23506b;
    if (type === 'grass') return 0x2f6942;
    return 0x263126;
  }
}
