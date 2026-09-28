# BACKROOMS: ABYSS

A complete browser-based 3D multiplayer survival horror game with a local tutorial, room system, and developer/admin controls.

## Requirements

- Node.js 18+
- Modern Chrome/Chromium browser
- Local or hosted server capable of WebSockets

## Install

1. Install Node.js.
2. In the project root, run:

```bash
npm install
```

## Configure environment

Copy `.env.example` to `.env` and set the server values:

```bash
cp .env.example .env
```

Example:

```env
PORT=3000
DEVELOPER_PASSWORD=your_secure_password_here
```

Do not commit the real developer password. Keep it only in your local `.env` file or secure deployment environment.

## Start the server

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## How to play

### Main menu

- Enter a username
- Optional developer login if username is exactly `Azuliciado`
- Start the tutorial or go to multiplayer

### Create a room

1. Select Multiplayer
2. Create room or join a public room
3. Share the room code for private matches

### Join a room

- Public rooms are listed by the server
- Private rooms use a six-character room code
- The host starts the match when ready

## Developer login

If the entering username is `Azuliciado`, the client will prompt for a developer password. The password is checked server-side against `DEVELOPER_PASSWORD` from the environment. The browser never gets the real password.

## Deploying

This project requires a Node.js server with WebSockets. For production, deploy to a host that supports Node.js and WebSockets, such as:

- Render
- Railway
- Heroku
- DigitalOcean App Platform
- VPS with Node.js

Use HTTPS/WSS in production.

## Troubleshooting

### WebGL issues

- Update Chrome
- Check hardware acceleration is enabled
- Lower graphics preset to POTATO
- If the browser fails to render, open `chrome://settings/` and ensure acceleration is supported

### WebSocket failures

- Check the server is running
- Verify the browser can reach the server URL
- Ensure the backend accepts WebSocket connections
- Confirm the port in `.env` matches the client URL

## Notes

- Basic single-player tutorial runs locally even if the multiplayer server is unavailable
- Multiplayer requires a reachable Node.js backend
- Local settings are saved in `localStorage` only for non-sensitive settings
