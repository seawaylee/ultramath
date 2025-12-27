// Simple synth for game sounds using Web Audio API
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

export const playSound = (type: 'correct' | 'wrong' | 'click' | 'win' | 'start') => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
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

export const speakUltraman = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel previous speech to avoid queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; // Default to Chinese

  // Try to find a Chinese voice
  const voices = window.speechSynthesis.getVoices();
  
  // Priority: 
  // 1. Exact match for 'zh-CN'
  // 2. Any voice starting with 'zh'
  // 3. Fallback
  const preferredVoice = voices.find(v => v.lang === 'zh-CN') || 
                         voices.find(v => v.lang.startsWith('zh')) ||
                         voices.find(v => v.lang.includes('CN')); // Some browsers like Edge
                         
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Ultraman-ish effect: Slightly lower pitch, steady rate
  utterance.pitch = 0.8; 
  utterance.rate = 1.0; 
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};
