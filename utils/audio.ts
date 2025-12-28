// Simple synth for game sounds using Web Audio API
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;
let audioContextInitialized = false;

// Initialize audio context on first user interaction
export const initAudioContext = () => {
  if (!audioContextInitialized) {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn('Audio context resume failed:', e));
    }
    audioContextInitialized = true;
  }
};

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

export const playSound = (type: 'correct' | 'wrong' | 'click' | 'win' | 'start') => {
  try {
    initAudioContext();
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn('Audio context resume failed:', e));
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'correct':
        // Ding! (High pitch sine)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'wrong':
        // Buzz (Low saw)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'click':
        // Click (Short blip)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'win':
        // Fanfare-ish sequence
        const playNote = (freq: number, time: number, dur: number) => {
           const o = ctx.createOscillator();
           const g = ctx.createGain();
           o.connect(g);
           g.connect(ctx.destination);
           o.type = 'square';
           o.frequency.value = freq;
           g.gain.setValueAtTime(0.1, time);
           g.gain.exponentialRampToValueAtTime(0.01, time + dur);
           o.start(time);
           o.stop(time + dur);
        };
        playNote(400, now, 0.2);
        playNote(500, now + 0.2, 0.2);
        playNote(600, now + 0.4, 0.2);
        playNote(800, now + 0.6, 0.6);
        break;
        
      case 'start':
        // Swish
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// 缓存语音列表，避免重复加载
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// 加载语音列表（需要在用户交互后调用）
const loadVoices = () => {
  if (voicesLoaded && cachedVoices.length > 0) {
    return cachedVoices;
  }
  
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesLoaded = true;
      return voices;
    }
  } catch (e) {
    console.warn('Failed to load voices:', e);
  }
  
  return [];
};

// 监听语音列表加载事件（某些浏览器需要）
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Chrome/Edge 需要等待 voiceschanged 事件
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
    };
  }
  
  // 尝试立即加载（某些浏览器支持）
  loadVoices();
}

export const speakUltraman = (text: string) => {
  // 检查 API 支持
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported');
    return;
  }

  try {
    // 取消之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // Default to Chinese

    // 获取语音列表（优先使用缓存的）
    const voices = loadVoices();
    
    // Priority: 
    // 1. Exact match for 'zh-CN'
    // 2. Any voice starting with 'zh'
    // 3. Any voice containing 'CN' or 'Chinese'
    // 4. Fallback to default
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => v.lang === 'zh-CN') || 
                             voices.find(v => v.lang.startsWith('zh')) ||
                             voices.find(v => v.lang.includes('CN')) ||
                             voices.find(v => v.name.toLowerCase().includes('chinese'));
                             
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Ultraman-ish effect: Slightly lower pitch, steady rate
    utterance.pitch = 0.8; 
    utterance.rate = 1.0; 
    utterance.volume = 1.0;

    // 添加错误处理
    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event);
    };

    // 在用户交互上下文中直接调用
    // 对于微信浏览器，必须在用户事件处理函数中同步调用
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Failed to speak:', e);
  }
};

// 预加载语音列表（在用户首次交互时调用）
export const initSpeechSynthesis = () => {
  if (!('speechSynthesis' in window)) return;
  
  // 触发语音列表加载
  loadVoices();
  
  // 某些浏览器需要触发一次 getVoices 才能加载
  try {
    window.speechSynthesis.getVoices();
  } catch (e) {
    console.warn('Failed to init speech synthesis:', e);
  }
};
