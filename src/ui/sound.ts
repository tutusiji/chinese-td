import { gameStore } from '../store/GameStore';

let audioCtx: AudioContext | null = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 播放五声音阶拨弦音（模拟古筝等中式弹拨乐器）
function playPluck(frequency: number, duration: number = 0.5, delay: number = 0, volume: number = 0.3) {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);
  
  // 弹拨包络：瞬时击弦，然后指数衰减
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
  
  // 滤波包络
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, audioCtx.currentTime + delay);
  filter.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + delay + duration * 0.7);
  
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration + 0.05);
}

// 1. 放置塔：双音和弦（宫-徵，即 C-G 音程，清脆古雅）
export function playPlaceSound() {
  const E5 = 659.25;
  const A5 = 880.00;
  playPluck(E5, 0.35, 0, 0.25);
  playPluck(A5, 0.4, 0.06, 0.2);
}

// 2. 升级塔：上行五声音阶三连音（宫-商-角）
export function playUpgradeSound() {
  const G5 = 783.99;
  const A5 = 880.00;
  const C6 = 1046.50;
  playPluck(G5, 0.3, 0, 0.25);
  playPluck(A5, 0.3, 0.05, 0.23);
  playPluck(C6, 0.45, 0.1, 0.2);
}

// 3. 拆除/卖出塔：下行双音（模拟弦音滑落）
export function playSellSound() {
  const A5 = 880.00;
  const E5 = 659.25;
  playPluck(A5, 0.25, 0, 0.2);
  playPluck(E5, 0.3, 0.06, 0.2);
}

// 4. 金币增加（击杀敌兵）：清脆的金币碰撞双音
export function playCoinSound() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.04); // E6
  
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 0.2);
  osc2.stop(audioCtx.currentTime + 0.2);
}

// 5. 箭塔发射：嗖
export function playArrowShoot() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.11);
}

// 6. 炮塔发射：轰
export function playCannonShoot() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.22);
  
  gain.gain.setValueAtTime(0.24, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.23);
}

// 7. 冰塔发射：魔法结冰
export function playIceShoot() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.12);
  
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.13);
}

// 8. 大本营受损
export function playHurtSound() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(45, audioCtx.currentTime + 0.18);
  
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.19);
}

// 9. 战役胜利（大捷）：五声大调欢快琶音
export function playVictorySound() {
  const C5 = 523.25;
  const E5 = 659.25;
  const G5 = 783.99;
  const A5 = 880.00;
  const C6 = 1046.50;
  
  playPluck(C5, 0.4, 0, 0.25);
  playPluck(E5, 0.4, 0.08, 0.25);
  playPluck(G5, 0.4, 0.16, 0.25);
  playPluck(A5, 0.4, 0.24, 0.25);
  playPluck(C6, 0.8, 0.32, 0.3);
}

// 10. 战役失败（城破）：下沉悲伤的低频滑音
export function playDefeatSound() {
  if (!gameStore.soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(55, audioCtx.currentTime + 0.8);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.85);
}
