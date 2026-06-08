/**
 * AudioService - Procedural sound generation for game feedback.
 * Uses the Web Audio API to create retro/gamified chimes and buzzes
 * without requiring external sound file assets.
 */
class AudioService {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  // Ensure AudioContext is running (browsers suspend it until user interaction)
  async resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, vol = 0.1) {
    if (!this.initialized || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Envelope to prevent popping
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCorrect(streak = 1) {
    this.resume();
    // Escalate pitch based on streak (up to a cap)
    const capStreak = Math.min(streak, 10);
    const baseFreq = 400 + (capStreak * 40); // Pitch goes up 40Hz per streak
    
    // A quick upward double chime
    this.playTone(baseFreq, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(baseFreq * 1.25, 'sine', 0.15, 0.1), 100);
  }

  playWrong() {
    this.resume();
    // Low buzzer sound
    this.playTone(150, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.4, 0.1), 100);
  }

  playLevelUp() {
    this.resume();
    // Arpeggio
    const freqs = [400, 500, 600, 800];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.1, 0.05), i * 100);
    });
    setTimeout(() => this.playTone(1000, 'sine', 0.4, 0.1), 400);
  }

  playCombo() {
    this.resume();
    // Excited shimmer
    const freqs = [600, 800, 1000, 1200, 1600];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.08, 0.05), i * 50);
    });
  }
}

const audioService = new AudioService();
export default audioService;
