const audioManager = {
  context: null,
  master: null,
  sfxVolume: null,
  musicVolume: null,
  ambience: {},
  sfx: {},

  init() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Web Audio API not supported');
      return;
    }

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.context.destination);

      this.sfxVolume = this.context.createGain();
      this.sfxVolume.gain.value = 0.7;
      this.sfxVolume.connect(this.master);

      this.musicVolume = this.context.createGain();
      this.musicVolume.gain.value = 0.5;
      this.musicVolume.connect(this.master);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  },

  click() {
    if (!this.context) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.sfxVolume);
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  ambient(type) {
    if (!this.context) return;
    // Simple ambient buzz simulation
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.ambience);
    osc.frequency.value = 60 + Math.random() * 20;
    gain.gain.value = 0.1;
    osc.start(now);
    // Would be stopped later
  }
};

window.audioManager = audioManager;
