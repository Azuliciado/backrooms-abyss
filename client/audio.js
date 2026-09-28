const audioManager = {
  context: null,
  masterGain: null,
  initialized: false,
  enabled: true,

  init() {
    if (this.initialized) return;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.2;
    this.masterGain.connect(this.context.destination);
    this.initialized = true;
  },

  setMasterVolume(volume) {
    if (!this.masterGain) return;
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  },

  beep(frequency = 440, duration = 0.08, type = 'sine', gainValue = 0.04) {
    if (!this.enabled || !this.context || !this.masterGain) return;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gainValue;
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
  },

  click() {
    this.beep(720, 0.05, 'square', 0.03);
  },

  pickup() {
    this.beep(980, 0.06, 'triangle', 0.05);
  },

  alert() {
    this.beep(200, 0.2, 'sawtooth', 0.04);
  }
};

window.audioManager = audioManager;
