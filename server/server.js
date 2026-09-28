const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = Number(process.env.PORT || 3000);
const DEV_PASSWORD = process.env.DEVELOPER_PASSWORD || 'change_me_in_env';

const rooms = new Map();
const rateLimit = new Map();

function now() {
  return Date.now();
}

function sanitizeUsername(input) {
  const username = String(input || '').trim();
  if (username.length < 3 || username.length > 16) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(username)) return null;
  return username;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoomState(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    code: generateRoomCode(),
    name: 'The Yellow Hall',
    maxPlayers: 10,
    mode: 'NORMAL',
    difficulty: 'NORMAL',
    public: true,
    tutorial: true,
    seed: String(Math.floor(Math.random() * 1000000)),
    allowJoinAfterStart: false,
    status: 'WAITING',
    hostId: null,
    players: new Map(),
    world: {
      level: 0,
      objective: 'Find the exit',
      objectiveProgress: { found: 0, total: 1 },
      entityState: []
    },
    ...overrides
  };
}

function sanitizeRoomName(value) {
  const n = String(value || '').trim();
  return n.length > 0 ? n.slice(0, 40) : 'The Yellow Hall';
}

function roomSnapshot(room) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    maxPlayers: room.maxPlayers,
    mode: room.mode,
    difficulty: room.difficulty,
    public: room.public,
    tutorial: room.tutorial,
    seed: room.seed,
    status: room.status,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map((player) => ({
      id: player.id,
      username: player.username,
      state: player.state,
      ready: !!player.ready,
      host: player.id === room.hostId,
      health: player.health,
      stamina: player.stamina,
      sanity: player.sanity,
      battery: player.battery,
      level: player.level,
      ping: player.ping || 0
    })),
    world: room.world
  };
}

function broadcastRoom(room) {
  io.to(room.id).emit('roomState', roomSnapshot(room));
}

function broadcastPublicRooms() {
  const list = Array.from(rooms.values())
    .filter((room) => room.public && room.status !== 'PLAYING' && room.players.size < room.maxPlayers)
    .map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      players: room.players.size,
      maxPlayers: room.maxPlayers,
      level: room.world.level,
      mode: room.mode,
      host: room.hostId ? room.players.get(room.hostId)?.username || 'Host' : 'Host',
      status: room.status
    }));

  io.emit('publicRooms', list);
}

function rateLimitCheck(socket, action) {
  const key = `${socket.id}:${action}`;
  const nowMs = now();
  const bucket = rateLimit.get(key) || { count: 0, resetAt: nowMs + 1000 };

  if (nowMs > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = nowMs + 1000;
  }

  if (bucket.count >= 10) {
    return false;
  }

  bucket.count += 1;
  rateLimit.set(key, bucket);
  return true;
}

function ensurePlayerInRoom(socket, room) {
  const player = room.players.get(socket.data.playerId);
  if (!player) {
    socket.emit('error', { message: 'You are not in this room.' });
    return null;
  }
  return player;
}

function assignHost(room) {
  if (room.players.size === 0) {
    room.hostId = null;
    return;
  }

  const first = Array.from(room.players.values())[0];
  room.hostId = first.id;
}

function createEntityList(room) {
  const entities = [
    { id: 'smiler_1', type: 'SMILER', x: 12, y: 1.65, z: 8, state: 'IDLE' },
    { id: 'hound_1', type: 'HOUND', x: -12, y: 1.65, z: -8, state: 'PATROL' },
    { id: 'skin_1', type: 'SKIN_STEALER', x: 5, y: 1.65, z: -4, state: 'WANDER' }
  ];
  room.world.entityState = entities;
  return entities;
}

function spawnObjects(room) {
  room.world.objectives = [
    { id: 'key_1', type: 'KEY', x: 10, y: 0.5, z: 10, collected: false },
    { id: 'generator', type: 'GENERATOR', x: -10, y: 0.5, z: -10, activated: false },
    { id: 'exit', type: 'EXIT', x: 0, y: 0.5, z: 18, unlocked: false }
  ];
}

app.use(express.static(path.join(__dirname, '../client')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, devPasswordSet: !!process.env.DEVELOPER_PASSWORD });
});

io.on('connection', (socket) => {
  socket.data = {
    playerId: null,
    username: null,
    roomId: null,
    devVerified: false,
    devResetAt: 0,
    lastAuthAttempt: 0
  };

  socket.emit('serverInfo', {
    capability: 'ready',
    serverVersion: '1.0.0',
    greeting: 'Connected to Backrooms: Abyss'
  });

  socket.on('registerPlayer', ({ username }) => {
    const cleanName = sanitizeUsername(username);
    if (!cleanName) {
      socket.emit('error', { message: 'Invalid username. Use 3–16 letters, numbers, underscores, or hyphens.' });
      return;
    }

    socket.data.playerId = `p_${crypto.randomUUID()}`;
    socket.data.username = cleanName;
    socket.emit('registered', {
      playerId: socket.data.playerId,
      username: cleanName,
      devUsername: 'Azuliciado'
    });
  });

  socket.on('listPublicRooms', () => {
    broadcastPublicRooms();
  });

  socket.on('createRoom', ({ roomName, maxPlayers, mode, difficulty, publicRoom, tutorial, seed }) => {
    const username = socket.data.username;
    if (!username) {
      socket.emit('error', { message: 'A username is required before creating a room.' });
      return;
    }

    if (!rateLimitCheck(socket, 'createRoom')) {
      socket.emit('error', { message: 'Too many room creation attempts. Please wait a moment.' });
      return;
    }

    const room = createRoomState({
      id: crypto.randomUUID(),
      code: generateRoomCode(),
      name: sanitizeRoomName(roomName),
      maxPlayers: Number(maxPlayers) || 10,
      mode: String(mode || 'NORMAL').toUpperCase(),
      difficulty: String(difficulty || 'NORMAL').toUpperCase(),
      public: !!publicRoom,
      tutorial: !!tutorial,
      seed: String(seed || Math.floor(Math.random() * 1000000)),
      status: 'WAITING'
    });

    const player = {
      id: socket.data.playerId,
      username,
      socketId: socket.id,
      state: 'LOBBY',
      ready: false,
      health: 100,
      stamina: 100,
      sanity: 100,
      battery: 100,
      level: 0,
      x: 0,
      y: 1.7,
      z: 0,
      rotation: { x: 0, y: 0, z: 0 },
      flashlight: false,
      dev: !!socket.data.devVerified,
      ping: 0
    };

    room.players.set(player.id, player);
    room.hostId = player.id;
    rooms.set(room.id, room);

    socket.join(room.id);
    socket.data.roomId = room.id;

    broadcastPublicRooms();
    broadcastRoom(room);
    socket.emit('joinedRoom', { room: roomSnapshot(room), isHost: true });
  });

  socket.on('joinRoom', ({ roomId, roomCode }) => {
    const username = socket.data.username;
    if (!username) {
      socket.emit('error', { message: 'You need to register a username before joining.' });
      return;
    }

    if (!rateLimitCheck(socket, 'joinRoom')) {
      socket.emit('error', { message: 'Too many join attempts. Please wait a moment.' });
      return;
    }

    let room = null;
    if (roomId) room = rooms.get(roomId);
    if (!room && roomCode) {
      room = Array.from(rooms.values()).find((candidate) => candidate.code.toUpperCase() === String(roomCode).toUpperCase());
    }

    if (!room) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', { message: 'This room is full.' });
      return;
    }

    if (room.status !== 'WAITING' && !room.allowJoinAfterStart) {
      socket.emit('error', { message: 'This room is no longer accepting players.' });
      return;
    }

    const duplicate = Array.from(room.players.values()).some((player) => player.username.toLowerCase() === username.toLowerCase());
    if (duplicate) {
      socket.emit('error', { message: 'A player with that username is already in the room.' });
      return;
    }

    const player = {
      id: socket.data.playerId,
      username,
      socketId: socket.id,
      state: 'LOBBY',
      ready: false,
      health: 100,
      stamina: 100,
      sanity: 100,
      battery: 100,
      level: 0,
      x: 0,
      y: 1.7,
      z: 0,
      rotation: { x: 0, y: 0, z: 0 },
      flashlight: false,
      dev: !!socket.data.devVerified,
      ping: 0
    };

    room.players.set(player.id, player);
    socket.join(room.id);
    socket.data.roomId = room.id;

    if (!room.hostId) room.hostId = player.id;

    broadcastPublicRooms();
    broadcastRoom(room);
    socket.emit('joinedRoom', { room: roomSnapshot(room), isHost: room.hostId === player.id });
  });

  socket.on('toggleReady', ({ ready }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = ensurePlayerInRoom(socket, room);
    if (!player) return;
    player.ready = !!ready;
    player.state = 'READY';
    broadcastRoom(room);
  });

  socket.on('setRoomSettings', ({ maxPlayers, mode, difficulty, tutorial, publicRoom, allowJoinAfterStart }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = ensurePlayerInRoom(socket, room);
    if (!player || room.hostId !== player.id) {
      socket.emit('error', { message: 'Only the host can change room settings.' });
      return;
    }

    room.maxPlayers = Number(maxPlayers) || room.maxPlayers;
    room.mode = String(mode || room.mode).toUpperCase();
    room.difficulty = String(difficulty || room.difficulty).toUpperCase();
    room.tutorial = !!tutorial;
    room.public = !!publicRoom;
    room.allowJoinAfterStart = !!allowJoinAfterStart;
    broadcastPublicRooms();
    broadcastRoom(room);
  });

  socket.on('startGame', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = ensurePlayerInRoom(socket, room);
    if (!player || room.hostId !== player.id) {
      socket.emit('error', { message: 'Only the host can start the game.' });
      return;
    }

    room.status = 'PLAYING';
    room.world.level = 0;
    room.world.objective = 'Find the exit';
    room.world.objectiveProgress = { found: 0, total: 1 };
    createEntityList(room);
    spawnObjects(room);

    for (const p of room.players.values()) {
      p.state = 'PLAYING';
      p.health = 100;
      p.stamina = 100;
      p.sanity = 100;
      p.battery = 100;
    }

    io.to(room.id).emit('gameStart', {
      room: roomSnapshot(room),
      seed: room.seed,
      level: room.world.level,
      objective: room.world.objective
    });
    broadcastRoom(room);
  });

  socket.on('playerUpdate', ({ position, rotation, health, stamina, sanity, battery, flashlight, state }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = ensurePlayerInRoom(socket, room);
    if (!player) return;

    if (position) {
      player.x = position.x;
      player.y = position.y;
      player.z = position.z;
    }
    if (rotation) {
      player.rotation = rotation;
    }
    if (typeof health === 'number') player.health = health;
    if (typeof stamina === 'number') player.stamina = stamina;
    if (typeof sanity === 'number') player.sanity = sanity;
    if (typeof battery === 'number') player.battery = battery;
    if (typeof flashlight === 'boolean') player.flashlight = flashlight;
    if (state) player.state = state;

    socket.to(room.id).emit('remotePlayerUpdate', {
      id: player.id,
      username: player.username,
      position: { x: player.x, y: player.y, z: player.z },
      rotation: player.rotation,
      health: player.health,
      stamina: player.stamina,
      sanity: player.sanity,
      battery: player.battery,
      flashlight: player.flashlight,
      state: player.state
    });
  });

  socket.on('worldEvent', ({ type, text, x, y, z }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    socket.to(room.id).emit('worldEvent', { type, text, x, y, z });
  });

  socket.on('pingWorld', ({ type, text, x, y, z }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    io.to(room.id).emit('pingWorld', { type, text, x, y, z, owner: socket.data.playerId });
  });

  socket.on('chatMessage', ({ message }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    if (!rateLimitCheck(socket, 'chatMessage')) {
      socket.emit('error', { message: 'Please slow down your chat.');
      return;
    }
    const text = String(message || '').trim();
    if (!text) return;
    io.to(room.id).emit('chatMessage', {
      username: socket.data.username,
      text,
      id: socket.data.playerId
    });
  });

  socket.on('developerLogin', ({ password }) => {
    if (socket.data.username !== 'Azuliciado') {
      socket.emit('error', { message: 'Unauthorized developer access.' });
      return;
    }

    if (!rateLimitCheck(socket, 'developerLogin')) {
      socket.emit('error', { message: 'Too many developer login attempts. Please wait.' });
      return;
    }

    const provided = String(password || '');
    if (provided === DEV_PASSWORD && DEV_PASSWORD !== 'change_me_in_env') {
      socket.data.devVerified = true;
      socket.emit('developerVerified', { admin: true, username: socket.data.username });
      return;
    }

    socket.emit('error', { message: 'Invalid developer password.' });
    const attempts = (socket.data.devAttemptCount || 0) + 1;
    socket.data.devAttemptCount = attempts;
    if (attempts >= 5) {
      console.log(`Suspicious repeated developer login attempts from ${socket.id}`);
    }
  });

  socket.on('adminAction', ({ action, payload }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !socket.data.devVerified) {
      socket.emit('error', { message: 'Unauthorized.' });
      return;
    }

    switch (action) {
      case 'toggleGodMode':
        io.to(room.id).emit('adminActionResult', { action, result: 'God mode enabled for developer.' });
        break;
      case 'spawnEntity':
        room.world.entityState.push({
          id: payload?.id || `entity_${Date.now()}`,
          type: payload?.type || 'HOUND',
          x: payload?.x || 0,
          y: payload?.y || 1.5,
          z: payload?.z || 0,
          state: 'PATROL'
        });
        io.to(room.id).emit('entityUpdate', room.world.entityState);
        break;
      case 'changeLevel':
        room.world.level = Number(payload?.level ?? room.world.level);
        room.world.objective = 'Level transition';
        io.to(room.id).emit('levelChanged', { level: room.world.level });
        break;
      case 'resetObjectives':
        room.world.objective = 'Find the exit';
        room.world.objectiveProgress = { found: 0, total: 1 };
        io.to(room.id).emit('objectiveReset', room.world.objective);
        break;
      default:
        socket.emit('error', { message: 'Unauthorized.' });
        break;
    }
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = room.players.get(socket.data.playerId);
    if (!player) return;

    room.players.delete(socket.data.playerId);
    io.to(room.id).emit('playerLeft', { id: player.id, username: player.username });

    if (room.hostId === player.id) {
      assignHost(room);
      io.to(room.id).emit('hostChanged', { newHost: room.hostId });
    }

    if (room.players.size === 0) {
      rooms.delete(room.id);
      broadcastPublicRooms();
      return;
    }

    broadcastRoom(room);
    broadcastPublicRooms();
  });
});

server.listen(PORT, () => {
  console.log(`Backrooms: Abyss server running on http://localhost:${PORT}`);
});
