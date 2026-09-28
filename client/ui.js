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
    this.socket = io();
    this.bindEvents();
    this.connected = true;
    return this.socket;
  },

  bindEvents() {
    this.socket.on('connect', () => {
      showToast('Connected to server');
      this.connected = true;
      if (window.currentApp && window.currentApp.username) {
        this.socket.emit('registerPlayer', { username: window.currentApp.username });
      }
    });

    this.socket.on('registered', (payload) => {
      this.state.playerId = payload.playerId;
      this.state.username = payload.username;
      window.currentApp.username = payload.username;
      if (payload.username === 'Azuliciado') {
        showDeveloperPrompt();
      }
    });

    this.socket.on('roomState', (room) => {
      this.state.room = room;
      this.state.inRoom = !!room;
      this.state.isHost = room && room.hostId === this.state.playerId;
      renderLobby(room);
      renderRoomList(room);
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
      if (window.currentApp) {
        window.currentApp.currentLevel = level || 0;
        window.currentApp.startPlaying();
      }
      hideScreens();
      showHUD();
    });

    this.socket.on('playerLeft', (info) => {
      showToast(`${info.username} left the room`);
    });

    this.socket.on('hostChanged', ({ newHost }) => {
      showToast(`Host changed: ${newHost}`);
    });

    this.socket.on('error', ({ message }) => {
      showToast(message || 'An error occurred.');
    });

    this.socket.on('developerVerified', () => {
      this.state.devVerified = true;
      showToast('Developer verified');
      closeDeveloperPrompt();
    });

    this.socket.on('chatMessage', ({ username, text, id }) => {
      appendChat(username, text, id);
    });

    this.socket.on('worldEvent', ({ type, text, x, y, z }) => {
      showToast(text || type);
    });

    this.socket.on('pingWorld', ({ type, text, x, y, z, owner }) => {
      spawnPing(type, text, x, y, z, owner === this.state.playerId);
    });
  },

  register(username) {
    if (!this.socket) this.connect();
    this.socket.emit('registerPlayer', { username });
  },

  createRoom(settings) {
    this.socket.emit('createRoom', settings);
  },

  joinRoom(roomId, code) {
    this.socket.emit('joinRoom', { roomId, roomCode: code });
  },

  listPublicRooms() {
    this.socket.emit('listPublicRooms');
  },

  toggleReady(ready) {
    this.socket.emit('toggleReady', { ready });
  },

  startGame() {
    this.socket.emit('startGame');
  },

  sendPlayerUpdate(data) {
    if (!this.socket) return;
    this.socket.emit('playerUpdate', data);
  },

  sendChat(message) {
    if (!this.socket) return;
    this.socket.emit('chatMessage', { message });
  },

  developerLogin(password) {
    this.socket.emit('developerLogin', { password });
  },

  sendPing(type, text, x, y, z) {
    this.socket.emit('pingWorld', { type, text, x, y, z });
  }
};

window.multiplayer = multiplayer;
