// Main game controller and initialization
const app = {
  settings: window.appSettings,
  username: '',
  currentLevel: 0,
  renderer: null,
  scene: null,
  camera: null,
  playerController: null,
  entityManager: null,
  world: null,
  remotePlayers: new Map(),
  pointerLocked: false,
  lastFrameTime: 0,
  deltaTime: 0,
  fps: 60,
  fpsCounter: 0,
  fpsDisplay: 0,
  fpsTime: 0,
  isPlaying: false,
  inLobby: false,
  playerStats: {
    health: 100,
    stamina: 100,
    sanity: 100,
    battery: 100
  },
  inputManager: null,
  pingUpdates: []
};

window.currentApp = app;
window.appSettings = window.appSettings || {};

function setupRenderer() {
  const canvas = document.getElementById('gameCanvas');
  app.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.shadowMap.enabled = true;
  app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  app.renderer.outputColorSpace = THREE.SRGBColorSpace;

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0x0a0d18);
  app.scene.fog = new THREE.Fog(0x1a1a22, 15, 45);

  app.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 120);
  app.camera.position.set(0, 1.7, 8);

  const ambientLight = new THREE.AmbientLight(0x9db3da, 0.9);
  app.scene.add(ambientLight);

  app.world = createBackroomsWorld(app.scene, app.settings.graphics || 'REGULAR');
  app.playerController = new LocalPlayerController(app.camera, app.scene);
  app.entityManager = new EntityManager(app.scene);
  app.inputManager = new InputManager();
  graphicsManager.init();
  audioManager.init();
  adminController.init();
  loadingManager.init();

  window.addEventListener('resize', () => {
    app.camera.aspect = window.innerWidth / window.innerHeight;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function updateLocalInput() {
  const movement = app.inputManager.getMovementVector();
  app.playerController.setInput({
    forward: movement.forward,
    backward: movement.backward,
    left: movement.left,
    right: movement.right,
    sprint: movement.sprint,
    crouch: movement.crouch,
    jump: movement.jump,
    flashlight: app.playerController.input.flashlight
  });
}

function updatePlayerStats(dt) {
  // Stamina recovery/drain
  if (app.inputManager.keys.ShiftLeft || app.inputManager.keys.ShiftRight) {
    app.playerStats.stamina = Math.max(0, app.playerStats.stamina - dt * 25);
  } else {
    app.playerStats.stamina = Math.min(100, app.playerStats.stamina + dt * 15);
  }

  // Battery drain when flashlight is on
  if (app.playerController.input.flashlight) {
    app.playerStats.battery = Math.max(0, app.playerStats.battery - dt * 8);
  }

  // Sanity effects in darkness
  if (app.world.light.intensity < 0.5) {
    app.playerStats.sanity = Math.max(0, app.playerStats.sanity - dt * 5);
  } else {
    app.playerStats.sanity = Math.min(100, app.playerStats.sanity + dt * 2);
  }

  // Clamp all values
  app.playerStats.health = Math.max(0, Math.min(100, app.playerStats.health));
  app.playerStats.stamina = Math.max(0, Math.min(100, app.playerStats.stamina));
  app.playerStats.sanity = Math.max(0, Math.min(100, app.playerStats.sanity));
  app.playerStats.battery = Math.max(0, Math.min(100, app.playerStats.battery));
}

function updateRemotePlayers() {
  const players = multiplayer.state.room ? multiplayer.state.room.players : [];
  const existing = new Set();

  players.forEach((player) => {
    if (!player || player.username === app.username) return;
    existing.add(player.id);

    let mesh = app.remotePlayers.get(player.id);
    if (!mesh) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x7ab7ff, emissive: 0x224477, metalness: 0.1 })
      );
      body.position.y = 1;
      body.castShadow = true;
      group.add(body);

      const label = document.createElement('div');
      label.textContent = player.username;
      label.style.cssText = `
        position: absolute;
        background: rgba(10, 16, 28, 0.9);
        padding: 4px 8px;
        border: 1px solid rgba(124, 157, 255, 0.7);
        border-radius: 8px;
        color: #fff;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
      `;
      document.body.appendChild(label);

      mesh = { group, label, body, player };
      app.scene.add(group);
      app.remotePlayers.set(player.id, mesh);
    }

    mesh.group.position.set(player.x || 0, 1.4, player.z || 0);
    mesh.body.rotation.y = player.rotation ? player.rotation.y || 0 : 0;

    const pos = mesh.group.position.clone();
    const projected = pos.clone().project(app.camera);
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    mesh.label.style.left = `${x}px`;
    mesh.label.style.top = `${y}px`;
  });

  app.remotePlayers.forEach((mesh, id) => {
    if (!existing.has(id)) {
      app.scene.remove(mesh.group);
      mesh.label.remove();
      app.remotePlayers.delete(id);
    }
  });
}

function updateHUD() {
  const health = Math.round(app.playerStats.health);
  const stamina = Math.round(app.playerStats.stamina);
  const sanity = Math.round(app.playerStats.sanity);
  const battery = Math.round(app.playerStats.battery);

  const obj = multiplayer.state.room ? multiplayer.state.room.world.objective : 'Find the exit';
  setHUDStats({ health, stamina, sanity, battery, objective: obj });
}

function updateDebugInfo() {
  if (adminController && adminController.updateDebugInfo) {
    adminController.updateDebugInfo(
      app.fpsDisplay,
      app.currentLevel,
      multiplayer.state.room?.seed || '--',
      multiplayer.state.room?.players?.length || 0,
      app.entityManager?.entities?.size || 0
    );
  }
}

function updatePingEffects(dt) {
  if (app.pingUpdates && app.pingUpdates.length > 0) {
    app.pingUpdates = app.pingUpdates.filter((item) => {
      item.update(dt);
      return app.scene.children.includes(item.ping);
    });
  }
}

function renderLoop(time) {
  const currentTime = time || 0;
  app.deltaTime = Math.min((currentTime - app.lastFrameTime) / 1000 || 0.016, 0.033);
  app.lastFrameTime = currentTime;

  // FPS calculation
  app.fpsCounter++;
  app.fpsTime += app.deltaTime;
  if (app.fpsTime >= 1) {
    app.fpsDisplay = app.fpsCounter;
    app.fpsCounter = 0;
    app.fpsTime = 0;
  }

  if (app.isPlaying) {
    updateLocalInput();
    app.playerController.update(app.deltaTime);
    updatePlayerStats(app.deltaTime);
    updateRemotePlayers();
    app.entityManager.update(app.deltaTime, multiplayer.state.room?.players || []);
    updatePingEffects(app.deltaTime);
    updateHUD();
    updateDebugInfo();

    // Send player update to server
    if (multiplayer.socket && multiplayer.connected) {
      multiplayer.sendPlayerUpdate({
        position: {
          x: app.playerController.position.x,
          y: app.playerController.position.y,
          z: app.playerController.position.z
        },
        rotation: {
          x: app.playerController.pitch,
          y: app.playerController.yaw,
          z: 0
        },
        health: app.playerStats.health,
        stamina: app.playerStats.stamina,
        sanity: app.playerStats.sanity,
        battery: app.playerStats.battery,
        flashlight: app.playerController.input.flashlight,
        state: 'PLAYING'
      });
    }
  }

  app.renderer.render(app.scene, app.camera);
  requestAnimationFrame(renderLoop);
}

function startPlaying() {
  app.isPlaying = true;
  app.inLobby = false;
  hideHUD();
  app.playerController.position.set(0, 1.7, 8);

  // Spawn initial entities
  if (app.entityManager) {
    app.entityManager.spawn('smiler_1', 'SMILER', 12, 1.65, 8);
    app.entityManager.spawn('hound_1', 'HOUND', -12, 1.65, -8);
    app.entityManager.spawn('skin_1', 'SKIN_STEALER', 5, 1.65, -4);
  }

  showHUD();
  document.body.requestPointerLock();
}

function bindMainMenuEvents() {
  const submitBtn = document.getElementById('submitUsername');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const input = document.getElementById('usernameInput');
      const value = (input.value || '').trim();

      const valid = /^[A-Za-z0-9_-]{3,16}$/.test(value);
      if (!valid) {
        showToast('Username must be 3–16 letters, numbers, underscores, or hyphens.');
        return;
      }

      app.username = value;
      app.settings.username = value;
      saveSettings(app.settings);

      multiplayer.connect();
      multiplayer.register(value);

      if (value === 'Azuliciado') {
        showDeveloperPrompt();
      } else {
        showMainMenu();
      }
    });
  }

  const devVerifyBtn = document.getElementById('developerVerify');
  if (devVerifyBtn) {
    devVerifyBtn.addEventListener('click', () => {
      const input = document.getElementById('developerPassword');
      multiplayer.developerLogin(input.value);
    });

    const devPassInput = document.getElementById('developerPassword');
    if (devPassInput) {
      devPassInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') devVerifyBtn.click();
      });
    }
  }

  const startTutorialBtn = document.getElementById('startTutorialBtn');
  if (startTutorialBtn) {
    startTutorialBtn.addEventListener('click', () => {
      if (window.tutorial) tutorial.start();
      app.isPlaying = true;
      showHUD();
      hideScreens();
    });
  }

  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      app.isPlaying = true;
      showHUD();
      hideScreens();
      startPlaying();
    });
  }

  const multiplayerBtn = document.getElementById('multiplayerBtn');
  if (multiplayerBtn) {
    multiplayerBtn.addEventListener('click', () => {
      showRoomBrowser();
      multiplayer.listPublicRooms();
    });
  }

  const createRoomBtn2 = document.getElementById('createRoomBtn2');
  if (createRoomBtn2) {
    createRoomBtn2.addEventListener('click', () => {
      const roomName = document.getElementById('roomName').value || 'The Yellow Hall';
      const maxPlayers = Number(document.getElementById('maxPlayers').value || 10);
      const mode = document.getElementById('modeSelect').value || 'NORMAL';
      const difficulty = document.getElementById('difficultySelect').value || 'NORMAL';
      const isPublic = document.getElementById('publicPrivate').value === 'PUBLIC';

      multiplayer.createRoom({
        roomName,
        maxPlayers,
        mode,
        difficulty,
        publicRoom: isPublic,
        tutorial: true,
        seed: String(Math.floor(Math.random() * 999999))
      });
    });
  }

  const joinCodeBtn = document.getElementById('joinCodeBtn');
  if (joinCodeBtn) {
    joinCodeBtn.addEventListener('click', () => {
      const code = (document.getElementById('joinCodeInput').value || '').trim();
      if (code) multiplayer.joinRoom('', code);
    });
  }

  const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
  if (refreshRoomsBtn) {
    refreshRoomsBtn.addEventListener('click', () => multiplayer.listPublicRooms());
  }

  const startGameBtn = document.getElementById('startGameBtn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => multiplayer.startGame());
  }

  const toggleReadyBtn = document.getElementById('toggleReadyBtn');
  if (toggleReadyBtn) {
    let readyState = false;
    toggleReadyBtn.addEventListener('click', () => {
      readyState = !readyState;
      multiplayer.toggleReady(readyState);
      toggleReadyBtn.textContent = readyState ? 'NOT READY' : 'READY';
    });
  }

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const msg = (chatInput.value || '').trim();
        if (msg) {
          multiplayer.sendChat(msg);
          chatInput.value = '';
          chatInput.classList.remove('visible');
        }
      }
    });
  }

  const adminPanelClose = document.getElementById('adminPanelClose');
  if (adminPanelClose) {
    adminPanelClose.addEventListener('click', hideAdminPanel);
  }
}

function init() {
  setupRenderer();
  bindMainMenuEvents();

  if (app.settings.username) {
    document.getElementById('usernameInput').value = app.settings.username;
  }

  showSetup();
  requestAnimationFrame(renderLoop);
}

window.addEventListener('beforeunload', () => {
  if (multiplayer.socket) multiplayer.socket.disconnect();
});

init();
