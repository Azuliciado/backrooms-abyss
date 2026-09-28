// Settings and persistence
const defaultSettings = {
  username: '',
  graphics: 'REGULAR',
  audioVolume: 0.7,
  mouseSensitivity: 0.5,
  tutorialComplete: false,
  lastPlayedLevel: 0,
  controlsCustom: false
};

window.appSettings = {
  ...defaultSettings,
  ...JSON.parse(localStorage.getItem('backroomsAbyss') || '{}')
};

function saveSettings(settings) {
  localStorage.setItem('backroomsAbyss', JSON.stringify(settings));
  window.appSettings = settings;
}

function resetSettings() {
  saveSettings({ ...defaultSettings });
}

window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
