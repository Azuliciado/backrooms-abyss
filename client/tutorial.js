class TutorialManager {
  constructor() {
    this.currentStep = 0;
    this.steps = [
      { action: 'movement', prompt: 'Use WASD to move forward' },
      { action: 'camera', prompt: 'Use mouse to look around' },
      { action: 'sprint', prompt: 'Hold SHIFT to sprint' },
      { action: 'crouch', prompt: 'Press CTRL to crouch' },
      { action: 'jump', prompt: 'Press SPACE to jump' },
      { action: 'flashlight', prompt: 'Press F to toggle flashlight' },
      { action: 'battery', prompt: 'Find a battery to recharge your flashlight' },
      { action: 'stamina', prompt: 'Stamina decreases when you sprint' },
      { action: 'item_pickup', prompt: 'Press E to pick up items' },
      { action: 'objective', prompt: 'Follow the objective markers' },
      { action: 'interaction', prompt: 'Press E to interact with objects' },
      { action: 'doors', prompt: 'Some doors require keys to open' },
      { action: 'sanity', prompt: 'Sanity decreases in darkness and near entities' },
      { action: 'entity_warning', prompt: 'Not all things in the Backrooms are human' },
      { action: 'multiplayer', prompt: 'You can play with other players in multiplayer rooms' },
      { action: 'exit', prompt: 'Find the exit to escape this level' }
    ];
    this.completed = false;
    this.skipped = false;
  }

  start() {
    this.currentStep = 0;
    this.completed = false;
    this.skipped = false;
    this.showStep();
  }

  showStep() {
    if (this.currentStep >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[this.currentStep];
    showToast(step.prompt);
  }

  nextStep() {
    this.currentStep++;
    this.showStep();
  }

  skip() {
    this.skipped = true;
    this.complete();
  }

  complete() {
    this.completed = true;
    appSettings.tutorialComplete = true;
    saveSettings(appSettings);
    showToast('Tutorial complete! Welcome to the Abyss.');
    showMainMenu();
  }
}

window.TutorialManager = TutorialManager;
window.tutorial = new TutorialManager();
