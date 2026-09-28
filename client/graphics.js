// Graphics configuration manager
const graphicsManager = {
  currentPreset: 'REGULAR',
  settings: {},

  init() {
    this.currentPreset = window.appSettings.graphics || 'REGULAR';
    this.applyPreset(this.currentPreset);
  },

  applyPreset(preset) {
    this.currentPreset = preset;
    this.settings = getGraphicsSettings(preset);

    if (app.renderer) {
      switch (preset) {
        case 'POTATO':
          app.renderer.setPixelRatio(0.5);
          app.renderer.shadowMap.enabled = false;
          break;
        case 'REGULAR':
          app.renderer.setPixelRatio(1);
          app.renderer.shadowMap.enabled = true;
          app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          break;
        case 'RTX / ULTRA':
          app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          app.renderer.shadowMap.enabled = true;
          app.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
          break;
      }
    }

    if (app.scene && app.scene.fog) {
      app.scene.fog.far = this.settings.renderDistance;
    }

    if (app.world && app.world.light) {
      app.world.light.intensity = this.settings.lightIntensity;
    }

    window.appSettings.graphics = preset;
    saveSettings(window.appSettings);
  },

  detectOptimal() {
    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = document.getElementById('gameCanvas');
    const width = canvas ? canvas.width : window.innerWidth;

    if (pixelRatio <= 1 && width <= 1366) return 'POTATO';
    if (pixelRatio <= 1.5 && width <= 1920) return 'REGULAR';
    return 'RTX / ULTRA';
  }
};

window.graphicsManager = graphicsManager;
