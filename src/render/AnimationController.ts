import * as THREE from 'three';

export enum EntityAnimState {
  IDLE = 'idle',
  WALK = 'walk',
  ATTACK = 'attack',
  DEATH = 'death',
  FROZEN = 'frozen',
}

export interface KeyframeTrack {
  /** 模型子节点名称 (model.getObjectByName) */
  target: string;
  property: 'position' | 'rotation' | 'scale';
  keys: { time: number; value: THREE.Vector3 }[];
}

export interface AnimationClip {
  name: string;
  duration: number; // 秒
  tracks: KeyframeTrack[];
  loop: boolean;
  /** 剪辑结束回调 (非循环时触发) */
  onComplete?: () => void;
}

/** 动画剪辑集 */
export type ClipSet = Partial<Record<EntityAnimState, AnimationClip>>;

/**
 * 动画状态机控制器。
 * 每个 3D 模型实例绑定一个控制器。
 */
export class AnimationController {
  private model: THREE.Group;
  private clips: ClipSet;
  private _currentState: EntityAnimState = EntityAnimState.IDLE;
  private currentClip: AnimationClip | null = null;
  private elapsed: number = 0;
  private onCompleteTriggered: boolean = false;

  constructor(model: THREE.Group, clips: ClipSet) {
    this.model = model;
    this.clips = clips;
  }

  get currentState(): EntityAnimState {
    return this._currentState;
  }

  /** 切换到新动画状态。同状态不重复切换（loop 的除外）。 */
  play(state: EntityAnimState): void {
    if (this._currentState === state && this.currentClip?.loop) return;
    if (this._currentState === state) return;

    const clip = this.clips[state];
    if (!clip) {
      console.warn(`[AnimCtrl] 无 "${state}" 剪辑，保持 ${this._currentState}`);
      return;
    }

    this._currentState = state;
    this.currentClip = clip;
    this.elapsed = 0;
    this.onCompleteTriggered = false;

    // 重置模型到基础姿态
    this.resetPose();
  }

  /**
   * 每帧更新动画。
   * @param dtSec 帧间隔秒数 (已乘游戏速度)
   */
  update(dtSec: number): void {
    if (!this.currentClip) return;

    this.elapsed += dtSec;
    const t = this.currentClip.loop
      ? this.elapsed % this.currentClip.duration
      : Math.min(this.elapsed, this.currentClip.duration);

    for (const track of this.currentClip.tracks) {
      this.applyTrack(track, t);
    }

    // 非循环剪辑完成回调
    if (
      !this.currentClip.loop &&
      !this.onCompleteTriggered &&
      this.elapsed >= this.currentClip.duration
    ) {
      this.onCompleteTriggered = true;
      this.currentClip.onComplete?.();
    }
  }

  /** 动画是否正在播放中 (未完成) */
  isPlaying(): boolean {
    if (!this.currentClip) return false;
    if (this.currentClip.loop) return true;
    return this.elapsed < this.currentClip.duration;
  }

  /** 重置所有可动子节点到初始姿态 */
  private resetPose(): void {
    if (!this.currentClip) return;
    const targets = new Set(this.currentClip.tracks.map(t => t.target));
    for (const name of targets) {
      const node = this.model.getObjectByName(name);
      if (node) {
        node.position.set(0, 0, 0);
        node.rotation.set(0, 0, 0);
        node.scale.set(1, 1, 1);
      }
    }
  }

  /** 对单个 track 插值并应用到子节点 */
  private applyTrack(track: KeyframeTrack, t: number): void {
    const node = this.model.getObjectByName(track.target);
    if (!node) return;

    if (track.keys.length === 0) return;
    if (track.keys.length === 1) {
      this.setValue(node, track.property, track.keys[0].value);
      return;
    }

    // 找到 t 所在的区间
    let i0 = 0;
    for (let i = track.keys.length - 2; i >= 0; i--) {
      if (track.keys[i].time <= t) {
        i0 = i;
        break;
      }
    }
    const i1 = i0 + 1;
    const k0 = track.keys[i0];
    const k1 = track.keys[i1];

    const localT = k1.time > k0.time
      ? (t - k0.time) / (k1.time - k0.time)
      : 0;
    const clamped = Math.max(0, Math.min(1, localT));
    const value = new THREE.Vector3().lerpVectors(k0.value, k1.value, clamped);
    this.setValue(node, track.property, value);
  }

  private setValue(
    node: THREE.Object3D,
    property: string,
    value: THREE.Vector3,
  ): void {
    switch (property) {
      case 'position':
        node.position.copy(value);
        break;
      case 'rotation':
        node.rotation.set(value.x, value.y, value.z);
        break;
      case 'scale':
        node.scale.copy(value);
        break;
    }
  }
}
