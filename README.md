# BACKROOMS: ABYSS

A complete, fully-functional 3D multiplayer Backrooms horror game built with Three.js, Node.js, and Socket.IO.

## Overview

Backrooms: Abyss is a genuine, playable multiplayer horror game that runs in any modern Chromium/Chrome browser. Players can:

- Create or join private/public rooms
- Explore procedurally-inspired Backrooms environments
- Encounter AI entities and environmental hazards
- Manage health, stamina, sanity, and inventory
- Complete objectives and progress through levels
- Communicate with other players in real-time
- Experience synchronized gameplay across the network

## Key Features

✓ **Real Multiplayer**: Up to 10 players per room via WebSocket (Socket.IO)
✓ **3D Graphics**: Three.js powered with dynamic lighting and shadows
✓ **Developer Mode**: Verified admin account with god mode, no-clip, AI control, and debugging tools
✓ **Optimized**: Supports Chromebooks and low-end PCs with selectable graphics presets
✓ **Complete Systems**: Inventory, player stats, authentication, room management, tutorial
✓ **Security**: Server-side validation, rate limiting, anti-cheat measures
✓ **Interactive Tutorial**: Hands-on first-time player experience
✓ **Persistent Settings**: Client-side localStorage for non-sensitive settings

## Quick Start

### Prerequisites

- Node.js 14+
- npm or yarn
- Chrome/Chromium browser (or any WebSocket-capable browser)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Azuliciado/backrooms-abyss.git
   cd backrooms-abyss
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your developer password:
   ```
   DEV_PASSWORD=your_very_secure_password
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   The server will listen on `http://localhost:3000`

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Gameplay

### First Time

1. Enter a 3-16 character username (letters, numbers, underscore, hyphen)
2. Select graphics preset (POTATO / REGULAR / RTX / AUTO)
3. Adjust audio settings
4. View control layout
5. Complete the interactive tutorial

### Main Menu

- **PLAY**: Single-player gameplay
- **MULTIPLAYER**: Create or join multiplayer rooms
- **CREATE ROOM**: Start a new room with custom settings
- **JOIN ROOM**: Enter a room code to join
- **PUBLIC ROOMS**: Browse and join public game sessions
- **TUTORIAL**: Revisit the tutorial at any time
- **SETTINGS / GRAPHICS / CONTROLS**: Customize your experience

### Developer Mode

To access developer mode:

1. On the username screen, enter exactly: `Azuliciado`
2. Click "CONTINUE"
3. The "DEVELOPER LOGIN" screen appears
4. Enter the password from your `.env` file
5. Click "VERIFY"
6. Developer features are now active

#### Developer Controls

Press **0** to open the admin panel. Available features:

**Player Management:**
- List players with stats
- Teleport to/from players
- Heal, revive, restore resources
- Manage inventory
- Spectate players
- Kick from room

**Player Powers:**
- God Mode (invincibility)
- Infinite stamina
- Infinite battery
- Infinite sanity
- No-Clip (walk through walls)
- Speed/jump modifiers

**Entity Control:**
- Spawn/remove AI entities
- Freeze/unfreeze AI
- Set AI behavior (hostile/passive)
- Make entities ignore you or target specific players

**World Control:**
- Change level
- Teleport to coordinates
- Regenerate map sections
- Spawn events
- Toggle lights
- Trigger blackouts

**Debug Info:**
- FPS, ping, player count
- Entity count, draw calls
- Server tick rate
- Network statistics

## Game Mechanics

### Player Stats

- **Health (HP)**: Damaged by entities and hazards. Reach 0 to be incapacitated.
- **Stamina**: Consumed by sprinting. Recharges when standing still.
- **Sanity**: Decreases when encountering entities or in darkness. Low sanity causes visual/audio distortions.
- **Battery**: Powers your flashlight. Depletes in the dark.

### Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Mouse | Look around |
| Shift | Sprint (consumes stamina) |
| Ctrl | Crouch (slows movement) |
| Space | Jump |
| F | Toggle flashlight |
| E | Interact with objects |
| Chat | Type to chat with room players |
| 0 | Open admin panel (dev only) |

### Objectives

Each level has objectives (e.g., "Find the exit", "Locate the anomaly", etc.). Completing objectives progress the player through levels.

## Project Structure

```
backrooms-abyss/
├── client/
│   ├── index.html         # Main HTML document
│   ├── style.css          # Styling and UI layout
│   ├── game.js            # Game loop and initialization
│   ├── ui.js              # UI rendering functions
│   ├── player.js          # Player controller and inventory
│   ├── world.js           # World generation and level design
│   ├── audio.js           # Audio playback and effects
│   ├── settings.js        # Settings persistence (localStorage)
│   ├── inventory.js       # Inventory management
│   ├── maps/              # Level data files
│   ├── textures/          # Texture assets
│   ├── audio/             # Sound effect and music files
│   └── models/            # 3D model assets
│
├── server/
│   ├── server.js          # Main server (Express + Socket.IO)
│   ├── config.js          # Server configuration
│   └── README.md          # Server documentation
│
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## API Reference

### Socket.IO Events (Client → Server)

#### Authentication
- `registerPlayer`: Register with a username
- `developerLogin`: Verify developer password

#### Room Management
- `createRoom`: Create a new room with settings
- `joinRoom`: Join an existing room by ID or code
- `listPublicRooms`: Request list of public rooms
- `toggleReady`: Toggle ready status in lobby
- `startGame`: Start the game (host only)

#### Gameplay
- `playerUpdate`: Send position, rotation, animation state
- `chatMessage`: Send a chat message to room
- `pingWorld`: Send a world ping for alerts

### Socket.IO Events (Server → Client)

#### Room
- `roomState`: Updated room state (players, settings)
- `gameStart`: Game has started
- `playerLeft`: A player left the room
- `hostChanged`: Host role transferred
- `publicRooms`: List of public rooms

#### Gameplay
- `playerUpdate`: Other player's position/rotation
- `chatMessage`: Chat message from another player
- `worldEvent`: Environmental event occurred

#### Errors
- `error`: Error message

## Graphics Presets

### POTATO
- Render distance: 15 units
- Low shadow quality (512px)
- Minimal particles (20)
- No post-processing
- Best for Chromebooks and very low-end hardware

### REGULAR (Default)
- Render distance: 35 units
- Medium shadow quality (1024px)
- Moderate particles (80)
- Basic post-processing enabled
- Good for most PCs

### RTX / ULTRA
- Render distance: 60 units
- High shadow quality (2048px)
- High particle count (200)
- Full post-processing with effects
- Best for high-end PCs

## Security Considerations

### Developer Authentication

- **Never hardcode passwords** in client code
- **Use environment variables** for sensitive secrets
- **Never send passwords back to the client**
- **Rate-limit login attempts** (5 attempts, then cooldown)
- **Log all authentication attempts** server-side
- **Use secure session management** for admin actions

### Player Validation

- All player input validated server-side
- Room capacity enforced
- Usernames sanitized and length-checked
- Positions validated for realism (no teleporting beyond bounds)
- Chat messages filtered for profanity (optional)

### Anti-Cheat

- Player positions validated for plausibility
- Speed checks prevent impossible movement
- Inventory changes verified server-side
- Admin actions logged for audit trails
- Suspicious behavior flagged for review

## Deployment

### Local Testing

```bash
npm install
npm start
```

Then open `http://localhost:3000`

### Production Deployment

#### Option 1: Heroku

```bash
heroku login
heroku create backrooms-abyss
heroku config:set DEV_PASSWORD=your_password
git push heroku main
heroku open
```

#### Option 2: DigitalOcean / VPS

```bash
# SSH into server
ssh root@your_vps_ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/Azuliciado/backrooms-abyss.git
cd backrooms-abyss

# Install and run
npm install
echo "DEV_PASSWORD=your_password" > .env
npm start

# Use PM2 to keep it running
sudo npm install -g pm2
pm2 start server/server.js --name "backrooms"
pm2 startup
pm2 save
```

#### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t backrooms-abyss .
docker run -e DEV_PASSWORD=your_password -p 3000:3000 backrooms-abyss
```

## Performance Tips

- **Use POTATO preset on Chromebooks** for best performance
- **Lower render distance** if FPS drops below 30
- **Disable post-processing** for older browsers
- **Reduce player count** in busy rooms
- **Monitor server logs** for performance bottlenecks

## Troubleshooting

### Game won't start

1. Ensure Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Check `.env` file exists with valid `DEV_PASSWORD`
4. Check port 3000 is not in use: `lsof -i :3000`

### Can't join multiplayer

1. Verify server is running: `npm start`
2. Check browser console (F12) for errors
3. Ensure valid room code format (6 alphanumeric characters)
4. Check room isn't full (max 10 players)

### Lag or stuttering

1. Switch to lower graphics preset
2. Reduce render distance
3. Close other browser tabs
4. Check server CPU/RAM usage
5. Restart browser

### Developer login not working

1. Ensure username is exactly `Azuliciado` (case-sensitive)
2. Check `.env` file for correct `DEV_PASSWORD`
3. Check server logs for rate-limiting message
4. Wait 5 minutes if too many failed attempts

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Credits

- **Three.js**: 3D graphics library
- **Socket.IO**: Real-time communication
- **Express.js**: Web framework
- **Node.js**: Server runtime

## Support

For issues, feature requests, or questions:

- GitHub Issues: https://github.com/Azuliciado/backrooms-abyss/issues
- Discord: [Coming soon]
- Email: adriancolonmartinez2011@gmail.com

---

**BACKROOMS: ABYSS**  
*You are not supposed to be here.*
