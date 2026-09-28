const STORAGE_KEY = 'backrooms-abyss-settings';

const defaultSettings = {
  username: '',
  graphics: 'REGULAR',
  sound: 0.7,
  masterVolume: 0.7,
  sensitivity: 0.002,
  fov: 75,
  tutorialComplete: false,
  accessibility: {
    reducedEffects: false,
    uiScale: 1,
    highContrast: false
  }
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings, accessibility: { ...defaultSettings.accessibility } };
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      accessibility: {
        ...defaultSettings.accessibility,
        ...(parsed.accessibility || {})
      }
    };
  } catch (error) {
    return { ...defaultSettings, accessibility: { ...defaultSettings.accessibility } };
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getGraphicsSettings(graphics) {
  const map = {
    POTATO: {
      shadows: false,
      fog: 0.03,
      particles: false,
      post: false,
      lightIntensity: 0.8,
      renderDistance: 18,
      quality: 'POTATO'
    },
    REGULAR: {
      shadows: true,
      fog: 0.05,
      particles: true,
      post: false,
      lightIntensity: 1.2,
      renderDistance: 26,
      quality: 'REGULAR'
    },
    'RTX / ULTRA': {
      shadows: true,
      fog: 0.08,
      particles: true,
      post: true,
      lightIntensity: 1.5,
      renderDistance: 32,
      quality: 'RTX / ULTRA'
    }
  };

  return map[graphics] || map.REGULAR;
}

window.appSettings = loadSettings();
