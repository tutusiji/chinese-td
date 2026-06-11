import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { MaterialCategory } from '../config/materials';
import { ModelFactory } from '../render/ProceduralModels';
import { EnemyType, TowerType, TerrainType } from '../types/game';

const API = '/api';

interface MaterialRecord {
  id: string; name: string; category: string; level: string; source: string;
  prompt: string; description: string; entityType?: string;
  imageUrl?: string; modelUrl?: string; skeletonActions?: string[];
  createdAt: number; updatedAt: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  enemy: '敌方单位', tower: '防御塔', terrain: '地形',
  resource: '资源', structure: '结构', ui: 'UI元素',
};
const LEVEL_LABELS: Record<string, string> = { basic: '初级', intermediate: '中级', advanced: '高级' };
const SOURCE_LABELS: Record<string, string> = { procedural: '程序化几何体', 'ai-2d': 'AI生成-2D', 'ai-3d': 'AI生成-3D' };

interface MiniPreview {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  model: THREE.Group; canvas: HTMLCanvasElement; animId: number;
  isDragging: boolean; dragPrev: { x: number; y: number }; rotY: number; rotX: number;
}

export class MaterialManager {
  private activeCategory: MaterialCategory = 'enemy';
  private previews = new Map<string, MiniPreview>();
  private modal: HTMLDivElement | null = null;
  /** 每个物料独立的轮询定时器 */
  private cardPollers = new Map<string, ReturnType<typeof setInterval>>();

  open() {
    if (this.modal) { this.modal.classList.remove('hidden'); this.renderContent(); return; }
    this.createModal();
    this.renderContent();
  }

  close() {
    this.modal?.classList.add('hidden');
    this.disposeAllPreviews();
    this.stopAllCardPollers();
  }

  // ── 弹窗 ──────────────────────────────────────────────

  private createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'material-manager-modal';
    this.modal.className = 'material-manager-modal';
    this.modal.innerHTML = `
      <div class="mm-overlay"></div>
      <div class="mm-shell">
        <header class="mm-header">
          <h2>📦 物料管理</h2>
          <div class="mm-header-actions">
            <button id="mm-reset-btn" class="mm-btn mm-btn-warn">重置预设</button>
            <button id="mm-close-btn" class="mm-btn">关闭</button>
          </div>
        </header>
        <div class="mm-body">
          <nav class="mm-nav" id="mm-nav"></nav>
          <main class="mm-content" id="mm-content"></main>
        </div>
      </div>`;
    document.body.appendChild(this.modal);
    this.modal.querySelector('#mm-close-btn')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#mm-reset-btn')?.addEventListener('click', async () => {
      if (!confirm('确定重置所有物料？')) return;
      await fetch(`${API}/materials/reset`, { method: 'POST' });
      this.renderContent();
    });
  }

  // ── 渲染 ──────────────────────────────────────────────

  private async renderContent() {
    if (!this.modal) return;
    const nav = this.modal.querySelector('#mm-nav')!;
    nav.innerHTML = '';
    for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
      const tab = document.createElement('button');
      tab.className = `mm-nav-tab ${cat === this.activeCategory ? 'active' : ''}`;
      tab.textContent = label;
      tab.addEventListener('click', () => { this.activeCategory = cat as MaterialCategory; this.renderContent(); });
      nav.appendChild(tab);
    }

    // 活跃任务导航
    await this.updateNavJobCount();

    const content = this.modal.querySelector('#mm-content')!;
    content.innerHTML = '';
    this.disposeAllPreviews();

    let entries: MaterialRecord[] = [];
    try {
      entries = await fetch(`${API}/materials/category/${this.activeCategory}`).then(r => r.json());
    } catch { content.innerHTML = '<p class="mm-empty">无法连接服务端</p>'; return; }

    if (entries.length === 0) { content.innerHTML = '<p class="mm-empty">暂无物料</p>'; return; }
    for (const entry of entries) {
      content.appendChild(await this.createCard(entry));
    }
  }

  private async createCard(entry: MaterialRecord): Promise<HTMLElement> {
    const card = document.createElement('div');
    card.className = 'mm-card';
    card.innerHTML = `
      <div class="mm-card-preview" id="preview-${entry.id}"></div>
      <div class="mm-card-info">
        <div class="mm-card-header">
          <span class="mm-card-name">${entry.name}</span>
          <span class="mm-card-level mm-level-${entry.level}">${LEVEL_LABELS[entry.level] || entry.level}</span>
        </div>
        <span class="mm-card-source">${SOURCE_LABELS[entry.source] || entry.source}</span>
        <p class="mm-card-desc">${entry.description}</p>
        ${entry.skeletonActions?.length ? `<div class="mm-card-actions">${entry.skeletonActions.map(a => `<span class="mm-action-tag">${a}</span>`).join('')}</div>` : ''}
        <div class="mm-card-prompt">
          <input type="text" class="mm-prompt-input" value="${this.esc(entry.prompt)}" id="prompt-${entry.id}">
        </div>
        <div class="mm-card-buttons">
          <button class="mm-btn mm-btn-gen" data-action="gen2d" data-id="${entry.id}">🎨 2D</button>
          <button class="mm-btn mm-btn-gen" data-action="gen3d" data-id="${entry.id}">🧊 3D</button>
          <button class="mm-btn mm-btn-danger" data-action="delete" data-id="${entry.id}">删除</button>
        </div>
        <div class="mm-card-status" id="status-${entry.id}"></div>
      </div>`;

    // 任务状态 — 如果有活跃任务，启动独立轮询
    try {
      const activeJobs = await fetch(`${API}/jobs/active`).then(r => r.json());
      const active = activeJobs.find((j: any) => j.materialId === entry.id);
      if (active) {
        card.querySelector('.mm-card-status')!.textContent = `⏳ 生成中... (${active.status})`;
        this.startCardPoll(entry.id);
      } else {
        const completed = await fetch(`${API}/jobs/completed?materialId=${entry.id}`).then(r => r.json());
        if (completed && completed.status === 'completed' && entry.source === 'ai-3d') {
          card.querySelector('.mm-card-status')!.textContent = '✅ 3D模型已就绪';
        }
      }
    } catch {}

    card.querySelectorAll('.mm-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = (btn as HTMLElement).dataset.action!;
        const id = (btn as HTMLElement).dataset.id!;
        if (action === 'gen2d' || action === 'gen3d') await this.regenerate(id, action === 'gen3d');
        else if (action === 'delete') await this.deleteMaterial(id);
      });
    });

    setTimeout(() => this.attachPreview(entry), 50);
    return card;
  }

  // ── 预览 ──────────────────────────────────────────────

  private attachPreview(entry: MaterialRecord) {
    const el = document.getElementById(`preview-${entry.id}`);
    if (!el) return;

    if (entry.modelUrl && entry.source === 'ai-3d') {
      this.createMini3DFromURL(el, entry.modelUrl);
      return;
    }
    if (entry.entityType) this.createMini3D(el, entry);
  }

  private createMini3DFromURL(el: HTMLElement, url: string) {
    const { canvas, renderer, scene, camera, model } = this.setupMiniScene(el);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      model.add(gltf.scene); this.fitModel(model);
    }, undefined, () => {
      model.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xcc4444 })));
    });
    this.previews.set(url, this.startPreviewLoop(canvas, renderer, scene, camera, model));
  }

  private createMini3D(el: HTMLElement, entry: MaterialRecord) {
    const { canvas, renderer, scene, camera, model } = this.setupMiniScene(el);
    try { model.add(this.buildModel(entry)); } catch {}
    this.previews.set(entry.id, this.startPreviewLoop(canvas, renderer, scene, camera, model));
  }

  private setupMiniScene(el: HTMLElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 160; canvas.height = 160; canvas.className = 'mm-preview-3d';
    el.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(160, 160); renderer.setPixelRatio(1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(1.2, 0.8, 1.5); camera.lookAt(0, 0.3, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(2, 3, 2); scene.add(key);
    const model = new THREE.Group(); scene.add(model);
    return { canvas, renderer, scene, camera, model };
  }

  private startPreviewLoop(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer,
    scene: THREE.Scene, camera: THREE.PerspectiveCamera, model: THREE.Group): MiniPreview {
    const p: MiniPreview = { renderer, scene, camera, model, canvas, animId: 0,
      isDragging: false, dragPrev: { x: 0, y: 0 }, rotY: 0, rotX: 0 };
    canvas.addEventListener('mousedown', (ev) => { p.isDragging = true; p.dragPrev = { x: ev.clientX, y: ev.clientY }; });
    const onMove = (ev: MouseEvent) => {
      if (!p.isDragging || this.modal?.classList.contains('hidden')) return;
      p.rotY += (ev.clientX - p.dragPrev.x) * 0.01;
      p.rotX = THREE.MathUtils.clamp(p.rotX + (ev.clientY - p.dragPrev.y) * 0.01, -1.2, 1.2);
      p.dragPrev = { x: ev.clientX, y: ev.clientY };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', () => { p.isDragging = false; });
    const animate = () => {
      if (this.modal?.classList.contains('hidden')) { cancelAnimationFrame(p.animId); return; }
      p.animId = requestAnimationFrame(animate);
      model.rotation.set(p.rotX, p.rotY, 0);
      renderer.render(scene, camera);
    };
    animate();
    return p;
  }

  private fitModel(model: THREE.Group) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const s = 0.6 / maxDim; model.scale.setScalar(s);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * s, -center.y * s + 0.2, -center.z * s);
    }
  }

  private buildModel(entry: MaterialRecord): THREE.Group {
    const et = entry.entityType;
    if (!et) return new THREE.Group();
    if (['mountain','tree','grass','river'].includes(et)) return ModelFactory.createTerrainTile(et as TerrainType, 42);
    if (['sword','spear','horse'].includes(et)) return ModelFactory.createEnemy(et as EnemyType);
    if (['arrow','cannon','ice'].includes(et)) {
      const lv = entry.level === 'advanced' ? 3 : entry.level === 'intermediate' ? 2 : 1;
      return ModelFactory.createTower(et as TowerType, lv);
    }
    if (et === 'castle') {
      const lv = entry.level === 'advanced' ? 3 : entry.level === 'intermediate' ? 2 : 1;
      return ModelFactory.createCastle(lv);
    }
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x888888 })));
    return g;
  }

  // ── 操作 ──────────────────────────────────────────────

  private async regenerate(id: string, is3D: boolean) {
    const statusEl = document.getElementById(`status-${id}`);
    const input = document.getElementById(`prompt-${id}`) as HTMLInputElement;
    const prompt = input?.value || '';

    if (is3D) {
      if (statusEl) statusEl.textContent = '⏳ 提交3D任务...';
      try {
        const res = await fetch(`${API}/jobs/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId: id, prompt, backend: 'hunyuan' }),
        }).then(r => r.json());
        if (res.success) {
          if (statusEl) statusEl.textContent = `✅ 已提交 (${(res.jobId || '').slice(-8)})，后台生成中...`;
          this.startCardPoll(id);
        } else {
          if (statusEl) statusEl.textContent = `❌ ${res.error || '提交失败'}`;
        }
      } catch (err: any) {
        if (statusEl) statusEl.textContent = `❌ ${err.message}`;
      }
    } else {
      if (statusEl) statusEl.textContent = '🎨 生成2D中...';
      try {
        // 先试 images/generations
        let res = await fetch(`${API}/proxy/2d/images`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: 'nano-banana-2' }),
        }).then(r => r.json());
        let imgUrl = res?.data?.[0]?.url || res?.data?.[0]?.b64_json;
        if (!imgUrl) {
          // 回退 chat/completions
          res = await fetch(`${API}/proxy/2d/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model: 'nano-banana-2' }),
          }).then(r => r.json());
          const content = res?.choices?.[0]?.message?.content || '';
          const m = content.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|webp)/i);
          imgUrl = m ? m[0] : '';
        }
        if (imgUrl) {
          await fetch(`${API}/materials/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, prompt, imageUrl: imgUrl, source: 'ai-2d' }),
          });
          if (statusEl) statusEl.textContent = '✅ 2D图片已生成!';
          this.renderContent();
        } else {
          if (statusEl) statusEl.textContent = '❌ 生成失败';
        }
      } catch (err: any) {
        if (statusEl) statusEl.textContent = `❌ ${err.message}`;
      }
    }
  }

  private async deleteMaterial(id: string) {
    const res = await fetch(`${API}/materials/${id}`);
    const entry = await res.json();
    if (entry.source === 'procedural') { alert('程序化几何体不可删除'); return; }
    if (!confirm(`删除 "${entry.name}"？`)) return;
    await fetch(`${API}/materials/${id}`, { method: 'DELETE' });
    this.renderContent();
  }

  /** 为单个卡片启动轮询 — 只关心这一个物料的任务状态 */
  private startCardPoll(materialId: string) {
    if (this.cardPollers.has(materialId)) return; // 已在该物料轮询

    const statusEl = document.getElementById(`status-${materialId}`);

    const timer = setInterval(async () => {
      // 弹窗已关闭 → 停止
      if (this.modal?.classList.contains('hidden')) {
        this.stopCardPoll(materialId);
        return;
      }

      try {
        const completed: any = await fetch(`${API}/jobs/completed?materialId=${materialId}`).then(r => r.json());
        if (completed && completed.status === 'completed') {
          // 任务完成 → 替换这一张卡片
          if (statusEl) statusEl.textContent = '✅ 3D模型已就绪';
          this.stopCardPoll(materialId);
          const content = this.modal?.querySelector('#mm-content');
          const previewEl = document.getElementById(`preview-${materialId}`);
          const oldCard = previewEl?.parentElement;
          if (oldCard && content) {
            try {
              const entry = await fetch(`${API}/materials/${materialId}`).then(r => r.json());
              const newCard = await this.createCard(entry);
              content.replaceChild(newCard, oldCard);
            } catch {}
          }
        } else if (completed && completed.status === 'failed') {
          if (statusEl) statusEl.textContent = `❌ ${completed.error || '生成失败'}`;
          this.stopCardPoll(materialId);
        } else {
          // 还在处理中 → 更新状态文字
          if (statusEl) statusEl.textContent = '⏳ 生成中...';
          // 也更新导航栏中的计数
          this.updateNavJobCount();
        }
      } catch {
        // 服务端暂时不可用，静默等待
      }
    }, 5000);

    this.cardPollers.set(materialId, timer);
  }

  private stopCardPoll(materialId: string) {
    const timer = this.cardPollers.get(materialId);
    if (timer) { clearInterval(timer); this.cardPollers.delete(materialId); }
  }

  private stopAllCardPollers() {
    for (const [, timer] of this.cardPollers) clearInterval(timer);
    this.cardPollers.clear();
  }

  /** 更新导航栏任务计数 (轻量 DOM) */
  private async updateNavJobCount() {
    const nav = this.modal?.querySelector('#mm-nav');
    if (!nav) return;
    try {
      const activeJobs: any[] = await fetch(`${API}/jobs/active`).then(r => r.json());
      const existing = nav.querySelector('.mm-jobs-section');
      if (existing) existing.remove();
      if (activeJobs.length > 0) {
        const sec = document.createElement('div');
        sec.className = 'mm-jobs-section';
        sec.innerHTML = `<h4>⏳ 生成中 (${activeJobs.length})</h4>`;
        for (const j of activeJobs) {
          const item = document.createElement('div');
          item.className = 'mm-job-item';
          item.textContent = `${j.materialId} — ${j.status}`;
          sec.appendChild(item);
        }
        nav.appendChild(sec);
      }
    } catch {}
  }

  private disposeAllPreviews() {
    for (const [, p] of this.previews) { cancelAnimationFrame(p.animId); p.renderer.dispose(); }
    this.previews.clear();
  }

  private esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
}

export const materialManager = new MaterialManager();
