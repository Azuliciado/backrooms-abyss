const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

// Game state
const gameState = {
  players: new Map(),
  rooms: new Map(),
  nextRoomId: 1,
  nextPlayerId: 1
};

// Developer security
const DEVELOPER_PASSWORD = process.env.DEV_PASSWORD || 'change_me_in_env';
const MAX_LOGIN_ATTEMPTS = 5;
const failedAttempts = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  socket.on('registerPlayer', (payload) => {
    const { username } = payload;
    if (!username || username.length < 3 || username.length > 16) {
      socket.emit('error', { message: 'Invalid username length' });
      return;
    }

    const playerId = `player_${gameState.nextPlayerId++}`;
    const player = {
      id: playerId,
      username,
      socketId: socket.id,
      room: null,
      ready: false,
      devVerified: username === 'Azuliciado' ? false : null,
      position: { x: 0, y: 1.7, z: 8 },
      rotation: { x: 0, y: 0 },
      health: 100,
      stamina: 100,
      sanity: 100,
      battery: 100
    };

    gameState.players.set(playerId, player);
    socket.userId = playerId;
    socket.username = username;

    socket.emit('registered', {
      playerId,
      username
    });

    console.log(`[+] Player registered: ${username} (${playerId})`);
  });

  socket.on('developerLogin', (payload) => {
    const { password } = payload;
    const player = gameState.players.get(socket.userId);

    if (!player || player.username !== 'Azuliciado') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const attemptKey = socket.id;
    const attempts = failedAttempts.get(attemptKey) || 0;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      socket.emit('error', { message: 'Too many failed attempts. Try again later.' });
      return;
    }

    if (password === DEVELOPER_PASSWORD) {
      player.devVerified = true;
      failedAttempts.delete(attemptKey);
      socket.emit('developerVerified', {});
      console.log(`[!] Developer verified: ${player.username}`);
    } else {
      failedAttempts.set(attemptKey, attempts + 1);
      socket.emit('error', { message: 'Invalid developer password' });
      console.log(`[!] Failed dev login attempt for ${socket.id}`);
    }
  });

  socket.on('createRoom', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player) return;

    const {
      name = 'Untitled Room',
      maxPlayers = 10,
      mode = 'NORMAL',
      difficulty = 'NORMAL',
      isPublic = true,
      worldSeed = Math.random()
    } = payload;

    const roomId = `room_${gameState.nextRoomId++}`;
    const roomCode = generateRoomCode();
    const room = {
      id: roomId,
      code: roomCode,
      name,
      hostId: player.id,
      maxPlayers,
      mode,
      difficulty,
      isPublic,
      worldSeed,
      players: [player.id],
      status: 'WAITING',
      level: 0,
      createdAt: Date.now()
    };

    gameState.rooms.set(roomId, room);
    player.room = roomId;
    socket.join(roomId);

    io.to(roomId).emit('roomState', serializeRoom(room, gameState.players));
    io.emit('publicRooms', getPublicRooms());

    console.log(`[+] Room created: ${name} (${roomId}) with code ${roomCode}`);
  });

  socket.on('joinRoom', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player) return;

    const { roomId, roomCode } = payload;
    let room = null;

    if (roomCode) {
      for (const [, r] of gameState.rooms) {
        if (r.code === roomCode) {
          room = r;
          break;
        }
      }
    } else if (roomId) {
      room = gameState.rooms.get(roomId);
    }

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    player.room = room.id;
    if (!room.players.includes(player.id)) {
      room.players.push(player.id);
    }
    socket.join(room.id);

    io.to(room.id).emit('roomState', serializeRoom(room, gameState.players));
    io.emit('publicRooms', getPublicRooms());

    console.log(`[+] Player ${player.username} joined room ${room.name}`);
  });

  socket.on('listPublicRooms', () => {
    socket.emit('publicRooms', getPublicRooms());
  });

  socket.on('toggleReady', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player || !player.room) return;

    player.ready = payload.ready || false;
    const room = gameState.rooms.get(player.room);
    if (room) {
      io.to(room.id).emit('roomState', serializeRoom(room, gameState.players));
    }
  });

  socket.on('startGame', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player || !player.room) return;

    const room = gameState.rooms.get(player.room);
    if (!room || room.hostId !== player.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    room.status = 'PLAYING';
    io.to(room.id).emit('gameStart', {
      room: serializeRoom(room, gameState.players),
      level: room.level
    });

    console.log(`[+] Game started in room ${room.name}`);
  });

  socket.on('playerUpdate', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player) return;

    Object.assign(player, payload);

    if (player.room) {
      socket.to(player.room).emit('playerUpdate', {
        playerId: player.id,
        position: player.position,
        rotation: player.rotation,
        animation: payload.animation
      });
    }
  });

  socket.on('chatMessage', (payload) => {
    const player = gameState.players.get(socket.userId);
    if (!player || !player.room) return;

    const room = gameState.rooms.get(player.room);
    if (!room) return;

    io.to(room.id).emit('chatMessage', {
      username: player.username,
      text: payload.message || '',
      id: player.id,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.userId);
    if (player && player.room) {
      const room = gameState.rooms.get(player.room);
      if (room) {
        room.players = room.players.filter(id => id !== player.id);
        if (room.players.length === 0) {
          gameState.rooms.delete(room.id);
          console.log(`[-] Room deleted: ${room.name} (no players)`);
        } else if (room.hostId === player.id) {
          room.hostId = room.players[0];
          io.to(room.id).emit('hostChanged', { newHost: gameState.players.get(room.hostId).username });
        } else {
          io.to(room.id).emit('playerLeft', { username: player.username });
        }
      }
    }
    gameState.players.delete(socket.userId);
    console.log(`[-] Player disconnected: ${socket.username || socket.id}`);
  });
});

// Helper functions
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function serializeRoom(room, players) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    mode: room.mode,
    difficulty: room.difficulty,
    isPublic: room.isPublic,
    status: room.status,
    level: room.level,
    players: room.players.map(id => {
      const p = players.get(id);
      return p ? {
        id: p.id,
        username: p.username,
        ready: p.ready,
        host: room.hostId === p.id
      } : null;
    }).filter(Boolean)
  };
}

function getPublicRooms() {
  return Array.from(gameState.rooms.values())
    .filter(room => room.isPublic && room.status === 'WAITING')
    .map(room => ({
      id: room.id,
      name: room.name,
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      mode: room.mode,
      status: room.status,
      difficulty: room.difficulty
    }));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/stats', (req, res) => {
  res.json({
    players: gameState.players.size,
    rooms: gameState.rooms.size,
    uptime: Math.floor(process.uptime())
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[*] Backrooms: Abyss server listening on port ${PORT}`);
});
