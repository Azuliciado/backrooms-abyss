class InputManager {
  constructor() {
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.onKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.onKeyUp(e);
    });

    document.addEventListener('mousemove', (e) => {
      this.mouseDeltaX = e.movementX || 0;
      this.mouseDeltaY = e.movementY || 0;
    });
  }

  onKeyDown(e) {
    if (e.code === 'KeyF') {
      if (app.playerController) {
        app.playerController.input.flashlight = !app.playerController.input.flashlight;
        audioManager.click();
      }
    }

    if (e.code === 'Digit0' && app.username === 'Azuliciado' && multiplayer.state.devVerified) {
      showAdminPanel();
      e.preventDefault();
    }

    if (e.code === 'Escape') {
      if (document.pointerLockElement) document.exitPointerLock();
      hideAdminPanel();
    }

    if (e.key === 't' || e.key === 'T') {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.classList.toggle('visible');
        if (chatInput.classList.contains('visible')) chatInput.focus();
      }
    }

    if (e.key === 'p' || e.key === 'P') {
      if (app.playerController) {
        multiplayer.sendPing('ENTITY', 'ENTITY SPOTTED', app.playerController.position.x, app.playerController.position.y, app.playerController.position.z);
      }
    }
  }

  onKeyUp(e) {}

  getMovementVector() {
    return {
      forward: this.keys.KeyW,
      backward: this.keys.KeyS,
      left: this.keys.KeyA,
      right: this.keys.KeyD,
      sprint: this.keys.ShiftLeft || this.keys.ShiftRight,
      crouch: this.keys.ControlLeft || this.keys.ControlRight,
      jump: this.keys.Space
    };
  }
}

window.InputManager = InputManager;
