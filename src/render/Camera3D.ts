import * as THREE from 'three';

/**
 * 轻量 3D 轨道摄像机控制器 (orthographic camera)
 * - 滚轮缩放
 * - 右键拖拽绕地图中心旋转
 * - 中键拖拽平移
 */
export class Camera3D {
  camera: THREE.OrthographicCamera;
  private domElement: HTMLElement;
  private target = new THREE.Vector3();
  private spherical = { theta: Math.PI / 4, phi: THREE.MathUtils.degToRad(52), radius: 10 };
  private panOffset = new THREE.Vector2();

  minZoom = 0.3;
  maxZoom = 3.0;
  minPolar = THREE.MathUtils.degToRad(18);
  maxPolar = THREE.MathUtils.degToRad(78);

  private zoom = 1.0;
  private dragging = false;
  private button = -1;
  private dragStart = new THREE.Vector2();
  private sphericalStart = { theta: 0, phi: 0, radius: 0 };
  private panStart = new THREE.Vector2();
  private _enabled = true;

  constructor(camera: THREE.OrthographicCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.bindEvents();
    // 从相机初始位置反推球坐标
    this.syncFromCamera();
  }

  get enabled() { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; }

  setTarget(x: number, y: number, z: number) {
    this.target.set(x, y, z);
  }

  /** 重新从摄像机位置计算内部状态 */
  syncFromCamera() {
    const offset = new THREE.Vector3().copy(this.camera.position).sub(this.target);
    const r = offset.length();
    if (r > 0.001) {
      this.spherical.theta = Math.atan2(offset.x, offset.z);
      this.spherical.phi = Math.acos(THREE.MathUtils.clamp(offset.y / r, -1, 1));
      this.spherical.radius = r;
    }
    this.panOffset.set(0, 0);
  }

  /** 重置到默认俯视视角 */
  reset(baseRadius: number) {
    this.spherical.theta = Math.PI / 4;
    this.spherical.phi = THREE.MathUtils.degToRad(52);
    this.spherical.radius = baseRadius;
    this.zoom = 1.0;
    this.panOffset.set(0, 0);
    this.updateCamera();
  }

  updateCamera() {
    const sinPhi = Math.sin(this.spherical.phi);
    const pos = new THREE.Vector3(
      this.spherical.radius * sinPhi * Math.sin(this.spherical.theta),
      this.spherical.radius * Math.cos(this.spherical.phi),
      this.spherical.radius * sinPhi * Math.cos(this.spherical.theta),
    );

    this.camera.position.copy(pos).add(this.target);
    this.camera.position.x += this.panOffset.x;
    this.camera.position.z += this.panOffset.y;
    this.camera.lookAt(
      this.target.x + this.panOffset.x,
      this.target.y,
      this.target.z + this.panOffset.y,
    );
  }

  // ── 事件 ──────────────────────────────────────────────

  private bindEvents() {
    const el = this.domElement;
    el.addEventListener('wheel', (e) => {
      if (!this._enabled) return;
      e.preventDefault();
      const f = e.deltaY > 0 ? 0.92 : 1.08;
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * f));
    }, { passive: false });

    el.addEventListener('mousedown', (e) => {
      if (!this._enabled || e.button === 0) return;
      this.dragging = true;
      this.button = e.button;
      this.dragStart.set(e.clientX, e.clientY);
      if (e.button === 2) {
        this.sphericalStart.theta = this.spherical.theta;
        this.sphericalStart.phi = this.spherical.phi;
        this.sphericalStart.radius = this.spherical.radius;
      } else if (e.button === 1) {
        this.panStart.copy(this.panOffset);
      }
    });

    el.addEventListener('mousemove', (e) => {
      if (!this._enabled || !this.dragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (this.button === 2) {
        this.spherical.theta = this.sphericalStart.theta - dx * 0.005;
        this.spherical.phi = THREE.MathUtils.clamp(
          this.sphericalStart.phi - dy * 0.005, this.minPolar, this.maxPolar,
        );
      } else if (this.button === 1) {
        const ps = 0.015 * this.spherical.radius;
        this.panOffset.x = this.panStart.x - dx * ps;
        this.panOffset.y = this.panStart.y + dy * ps;
      }
      this.updateCamera();
    });

    const end = () => { this.dragging = false; this.button = -1; };
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get currentZoom(): number { return this.zoom; }
  get currentPan(): THREE.Vector2 { return this.panOffset.clone(); }
}
