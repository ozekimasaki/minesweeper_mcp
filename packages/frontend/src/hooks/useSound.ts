import { useCallback, useRef, useEffect, useState } from 'react';

// ============================================
// 型定義
// ============================================

type SoundType = 
  | 'click'      // セルクリック
  | 'reveal'     // セル開封
  | 'flag'       // フラグ設置
  | 'unflag'     // フラグ解除
  | 'explode'    // 爆発（敗北）
  | 'win'        // 勝利ファンファーレ
  | 'newGame';   // 新規ゲーム開始

interface UseSoundOptions {
  enabled?: boolean;
  volume?: number;
}

interface UseSoundReturn {
  playSound: (type: SoundType) => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  isEnabled: boolean;
  volume: number;
}

// ============================================
// 効果音データ（Base64エンコード）
// Web Audio APIで生成したシンプルな8ビット風サウンド
// ============================================

// シンプルなビープ音を生成する関数
function createBeepSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'square'
): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// 複数のビープを連続再生（メロディ）
function createMelody(
  audioContext: AudioContext,
  notes: Array<{ freq: number; duration: number; delay: number }>,
  type: OscillatorType = 'square'
): void {
  notes.forEach(({ freq, duration, delay }) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
    
    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + duration);
  });
}

// ノイズを生成（爆発音用）
function createNoise(audioContext: AudioContext, duration: number): void {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  noiseSource.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + duration);
  
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  noiseSource.start(audioContext.currentTime);
  noiseSource.stop(audioContext.currentTime + duration);
}

// ============================================
// メインフック
// ============================================

/**
 * マインスイーパー用効果音フック
 * Web Audio APIを使用して8ビット風のサウンドを生成・再生
 */
export function useSound(options: UseSoundOptions = {}): UseSoundReturn {
  const { enabled: initialEnabled = true, volume: initialVolume = 0.5 } = options;
  
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [volume, setVolumeState] = useState(initialVolume);
  const audioContextRef = useRef<AudioContext | null>(null);

  // AudioContextの初期化（遅延初期化）
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // 効果音再生
  const playSound = useCallback((type: SoundType) => {
    if (!isEnabled) return;
    
    try {
      const ctx = getAudioContext();
      
      // AudioContextがサスペンド状態の場合は再開
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      switch (type) {
        case 'click':
          // 軽いクリック音
          createBeepSound(ctx, 800, 0.05, 'square');
          break;
          
        case 'reveal':
          // セル開封音（軽い「ポン」）
          createBeepSound(ctx, 600, 0.08, 'sine');
          break;
          
        case 'flag':
          // フラグ設置音（高い「ピッ」）
          createBeepSound(ctx, 1200, 0.1, 'square');
          break;
          
        case 'unflag':
          // フラグ解除音（低い「ポッ」）
          createBeepSound(ctx, 400, 0.08, 'square');
          break;
          
        case 'explode':
          // 爆発音（ノイズ + 低音）
          createNoise(ctx, 0.3);
          createBeepSound(ctx, 100, 0.3, 'sawtooth');
          break;
          
        case 'win':
          // 勝利ファンファーレ（メロディ）
          createMelody(ctx, [
            { freq: 523, duration: 0.15, delay: 0 },      // C5
            { freq: 659, duration: 0.15, delay: 0.15 },   // E5
            { freq: 784, duration: 0.15, delay: 0.30 },   // G5
            { freq: 1047, duration: 0.4, delay: 0.45 },   // C6
          ], 'square');
          break;
          
        case 'newGame':
          // 新規ゲーム開始音
          createMelody(ctx, [
            { freq: 440, duration: 0.1, delay: 0 },
            { freq: 554, duration: 0.1, delay: 0.1 },
            { freq: 659, duration: 0.15, delay: 0.2 },
          ], 'square');
          break;
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [isEnabled, getAudioContext]);

  // 有効/無効切り替え
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  // 音量設定
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    setEnabled,
    setVolume,
    isEnabled,
    volume,
  };
}


