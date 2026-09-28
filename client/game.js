function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('visible'), 1800);
}

function setScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === id);
  });
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
}

function showHUD() {
  document.getElementById('gameHUD').classList.add('active');
}

function hideHUD() {
  document.getElementById('gameHUD').classList.remove('active');
}

function showMainMenu() {
  setScreen('menuScreen');
}

function showSetup() {
  setScreen('setupScreen');
}

function showDeveloperPrompt() {
  setScreen('developerScreen');
}

function closeDeveloperPrompt() {
  const screen = document.getElementById('developerScreen');
  if (screen) screen.classList.remove('active');
}

function showRoomBrowser() {
  setScreen('roomBrowserScreen');
  multiplayer.listPublicRooms();
}

function showLobby() {
  setScreen('lobbyScreen');
}

function renderPublicRooms(rooms) {
  const list = document.getElementById('roomList');
  if (!list) return;

  list.innerHTML = '';
  if (!rooms || rooms.length === 0) {
    list.innerHTML = '<div class="room-card">No public rooms available.</div>';
    return;
  }

  rooms.forEach((room) => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <div>
        <strong>${room.name}</strong><br>
        <span class="small">${room.players}/${room.maxPlayers} · ${room.mode} · ${room.status}</span>
      </div>
      <div>
        <button data-room-id="${room.id}">JOIN</button>
      </div>
    `;
    card.querySelector('button').onclick = () => multiplayer.joinRoom(room.id, '');
    list.appendChild(card);
  });
}

function renderLobby(room) {
  const list = document.getElementById('playerList');
  const roomNameEl = document.getElementById('lobbyRoomName');
  const codeEl = document.getElementById('lobbyCode');
  if (!room || !list) return;

  roomNameEl.textContent = room.name;
  codeEl.textContent = room.code;
  list.innerHTML = '';

  room.players.forEach((player) => {
    const li = document.createElement('li');
    const hostTag = player.host ? 'HOST' : 'PLAYER';
    li.innerHTML = `<span>${player.username}</span><span>${player.ready ? 'READY' : 'NOT READY'} · ${hostTag}</span>`;
    list.appendChild(li);
  });
}

function renderRoomList(room) {
  if (!room) return;
  const players = document.getElementById('lobbyPlayers');
  if (players) players.textContent = `${room.players.length}/${room.maxPlayers}`;
}

function appendChat(username, text, id) {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const row = document.createElement('div');
  row.innerHTML = `<strong>${username}</strong>: ${text}`;
  log.appendChild(row);
  while (log.children.length > 10) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
  log.classList.add('visible');
}

function showAdminPanel() {
  const panel = document.getElementById('adminPanel');
  if (panel) panel.classList.add('active');
}

function hideAdminPanel() {
  const panel = document.getElementById('adminPanel');
  if (panel) panel.classList.remove('active');
}

function setHUDStats(stats) {
  document.getElementById('hudHealth').textContent = `HP: ${stats.health}`;
  document.getElementById('hudStamina').textContent = `STAMINA: ${stats.stamina}`;
  document.getElementById('hudSanity').textContent = `SANITY: ${stats.sanity}`;
  document.getElementById('hudBattery').textContent = `BATTERY: ${stats.battery}`;
  document.getElementById('hudObjective').textContent = `OBJECTIVE: ${stats.objective}`;
}

window.showToast = showToast;
window.setScreen = setScreen;
window.showSetup = showSetup;
window.showMainMenu = showMainMenu;
window.showRoomBrowser = showRoomBrowser;
window.showLobby = showLobby;
window.showHUD = showHUD;
window.hideHUD = hideHUD;
window.showAdminPanel = showAdminPanel;
window.hideAdminPanel = hideAdminPanel;
