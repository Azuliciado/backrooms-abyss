const multiplayer = {
  socket: null,
  connected: false,
  state: {
    playerId: null,
    username: null,
    room: null,
    inRoom: false,
    isHost: false,
    players: new Map(),
    readyState: false,
    devVerified: false
  },

  connect() {
    if (this.socket) return this.socket;
    try {
      this.socket = io();
      this.bindEvents();
      this.connected = true;
      return this.socket;
    } catch (error) {
      console.error('Failed to connect:', error);
      showToast('Failed to connect to server. Check if the backend is running.');
      return null;
    }
  },

  bindEvents() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      showToast('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
      showToast('Disconnected from server');
    });

    this.socket.on('serverInfo', (info) => {
      console.log('Server info:', info);
    });

    this.socket.on('registered', (payload) => {
      this.state.playerId = payload.playerId;
      this.state.username = payload.username;
      window.currentApp.username = payload.username;
      console.log('Player registered:', payload);
      if (payload.username === 'Azuliciado') {
        showDeveloperPrompt();
      }
    });

    this.socket.on('roomState', (room) => {
      this.state.room = room;
      this.state.inRoom = !!room;
      this.state.isHost = room && room.hostId === this.state.playerId;
      renderLobby(room);
    });

    this.socket.on('publicRooms', (rooms) => {
      renderPublicRooms(rooms);
    });

    this.socket.on('joinedRoom', ({ room, isHost }) => {
      this.state.room = room;
      this.state.inRoom = true;
      this.state.isHost = isHost;
      showLobby();
      renderLobby(room);
    });

    this.socket.on('gameStart', ({ room, level }) => {
      this.state.room = room;
      if (app) {
        app.currentLevel = level || 0;
        app.startPlaying();
      }
      hideScreens();
      showHUD();
    });

    this.socket.on('playerLeft', (info) => {
      showToast(`${info.username} left the room`);
    });

    this.socket.on('hostChanged', ({ newHost }) => {
      showToast('Host changed');
    });

    this.socket.on('error', ({ message }) => {
      showToast(message || 'An error occurred');
    });

    this.socket.on('developerVerified', () => {
      this.state.devVerified = true;
      showToast('Developer verified!');
      closeDeveloperPrompt();
    });

    this.socket.on('chatMessage', ({ username, text }) => {
      appendChat(username, text);
    });

    this.socket.on('remotePlayerUpdate', (update) => {
      // Handle remote player updates
    });

    this.socket.on('entityUpdate', (entities) => {
      if (app.entityManager && entities) {
        entities.forEach((entity) => {
          if (!app.entityManager.entities.has(entity.id)) {
            app.entityManager.spawn(entity.id, entity.type, entity.x, entity.y, entity.z);
          }
        });
      }
    });

    this.socket.on('levelChanged', ({ level }) => {
      app.currentLevel = level;
      showToast(`Changed to Level ${level}`);
    });

    this.socket.on('objectiveReset', (objective) => {
      showToast(`Objective: ${objective}`);
    });
  },

  register(username) {
    if (!this.socket) this.connect();
    this.socket.emit('registerPlayer', { username });
  },

  createRoom(settings) {
    if (this.socket) {
      this.socket.emit('createRoom', settings);
    }
  },

  joinRoom(roomId, code) {
    if (this.socket) {
      this.socket.emit('joinRoom', { roomId, roomCode: code });
    }
  },

  listPublicRooms() {
    if (this.socket) {
      this.socket.emit('listPublicRooms');
    }
  },

  toggleReady(ready) {
    if (this.socket) {
      this.socket.emit('toggleReady', { ready });
    }
  },

  startGame() {
    if (this.socket) {
      this.socket.emit('startGame');
    }
  },

  sendPlayerUpdate(data) {
    if (this.socket) {
      this.socket.emit('playerUpdate', data);
    }
  },

  sendChat(message) {
    if (this.socket) {
      this.socket.emit('chatMessage', { message });
    }
  },

  developerLogin(password) {
    if (this.socket) {
      this.socket.emit('developerLogin', { password });
    }
  },

  sendPing(type, text, x, y, z) {
    if (this.socket) {
      this.socket.emit('pingWorld', { type, text, x, y, z });
    }
  }
};

window.multiplayer = multiplayer;
