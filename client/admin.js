class AdminController {
  constructor() {
    this.panel = document.getElementById('adminPanel');
    this.playerTable = null;
    this.selectedPlayer = null;
    this.selectedEntity = null;
    this.godMode = false;
    this.noClip = false;
    this.aiIgnore = false;
  }

  init() {
    if (!this.panel) return;
    this.setupPanelUI();
    this.bindEvents();
  }

  setupPanelUI() {
    const tabsHTML = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0;">
        <button class="admin-tab" data-tab="players">PLAYERS</button>
        <button class="admin-tab" data-tab="entities">ENTITIES</button>
        <button class="admin-tab" data-tab="world">WORLD</button>
        <button class="admin-tab" data-tab="debug">DEBUG</button>
      </div>
    `;

    const playersTab = `
      <div class="admin-tab-content" data-tab="players" style="display: block;">
        <h3>Player Management</h3>
        <div id="adminPlayerList" style="max-height: 300px; overflow-y: auto; background: rgba(10, 15, 24, 0.7); border: 1px solid rgba(100, 130, 200, 0.3); border-radius: 8px; padding: 8px;"></div>
        <div style="margin-top: 12px;">
          <button data-action="heal">HEAL SELECTED</button>
          <button data-action="revive">REVIVE SELECTED</button>
          <button data-action="godmode">GOD MODE</button>
          <button data-action="noclip">NO CLIP</button>
          <button data-action="aiignore">AI IGNORE</button>
        </div>
      </div>
    `;

    const entitiesTab = `
      <div class="admin-tab-content" data-tab="entities" style="display: none;">
        <h3>Entity Control</h3>
        <div id="adminEntityList" style="max-height: 300px; overflow-y: auto; background: rgba(10, 15, 24, 0.7); border: 1px solid rgba(100, 130, 200, 0.3); border-radius: 8px; padding: 8px;"></div>
        <div style="margin-top: 12px;">
          <input id="spawnEntityType" placeholder="Entity type (HOUND, SMILER)" />
          <input id="spawnEntityX" placeholder="X" type="number" />
          <input id="spawnEntityZ" placeholder="Z" type="number" />
          <button data-action="spawn-entity">SPAWN ENTITY</button>
          <button data-action="remove-entity">REMOVE SELECTED</button>
          <button data-action="freeze-ai">FREEZE AI</button>
          <button data-action="target-player">TARGET PLAYER</button>
        </div>
      </div>
    `;

    const worldTab = `
      <div class="admin-tab-content" data-tab="world" style="display: none;">
        <h3>World Control</h3>
        <div style="display: grid; gap: 8px;">
          <select id="adminLevelSelect">
            <option value="0">Level 0 - The Lobby</option>
            <option value="1">Level 1 - Habitable Zone</option>
            <option value="2">Level 2 - Industrial Abyss</option>
          </select>
          <button data-action="change-level">CHANGE LEVEL</button>
          <button data-action="reset-objectives">RESET OBJECTIVES</button>
          <button data-action="trigger-event">TRIGGER EVENT</button>
          <button data-action="toggle-lights">TOGGLE LIGHTS</button>
        </div>
      </div>
    `;

    const debugTab = `
      <div class="admin-tab-content" data-tab="debug" style="display: none;">
        <h3>Debug Info</h3>
        <div id="debugInfo" style="font-size: 11px; background: rgba(5, 10, 20, 0.8); padding: 8px; border-radius: 6px; font-family: monospace;">
          <div>FPS: <span id="debugFPS">60</span></div>
          <div>Players: <span id="debugPlayers">0</span></div>
          <div>Entities: <span id="debugEntities">0</span></div>
          <div>Level: <span id="debugLevel">0</span></div>
          <div>Seed: <span id="debugSeed">--</span></div>
        </div>
      </div>
    `;

    const contentHTML = this.panel.innerHTML;
    this.panel.innerHTML = tabsHTML + playersTab + entitiesTab + worldTab + debugTab + contentHTML;
  }

  bindEvents() {
    document.querySelectorAll('.admin-tab').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.admin-tab-content').forEach((content) => {
          content.style.display = content.dataset.tab === tab ? 'block' : 'none';
        });
      });
    });

    this.panel.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => this.handleAction(e.target.dataset.action));
    });
  }

  updatePlayerList(players) {
    const list = document.getElementById('adminPlayerList');
    if (!list) return;
    list.innerHTML = '';
    players.forEach((player) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding: 6px; border-bottom: 1px solid rgba(80, 100, 150, 0.2); cursor: pointer; transition: background 0.2s;';
      row.onmouseover = () => (row.style.background = 'rgba(80, 120, 200, 0.15)');
      row.onmouseout = () => (row.style.background = 'transparent');
      row.innerHTML = `<strong>${player.username}</strong> | HP: ${player.health} | Lvl: ${player.level}`;
      row.onclick = () => (this.selectedPlayer = player);
      list.appendChild(row);
    });
  }

  updateEntityList(entities) {
    const list = document.getElementById('adminEntityList');
    if (!list) return;
    list.innerHTML = '';
    entities.forEach((entity) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding: 6px; border-bottom: 1px solid rgba(80, 100, 150, 0.2); cursor: pointer;';
      row.innerHTML = `<strong>${entity.type}</strong> | State: ${entity.state} | Pos: (${entity.x.toFixed(1)}, ${entity.z.toFixed(1)})`;
      row.onclick = () => (this.selectedEntity = entity);
      list.appendChild(row);
    });
  }

  updateDebugInfo(fps, level, seed, playerCount, entityCount) {
    const fpsEl = document.getElementById('debugFPS');
    const playersEl = document.getElementById('debugPlayers');
    const entitiesEl = document.getElementById('debugEntities');
    const levelEl = document.getElementById('debugLevel');
    const seedEl = document.getElementById('debugSeed');

    if (fpsEl) fpsEl.textContent = fps;
    if (playersEl) playersEl.textContent = playerCount;
    if (entitiesEl) entitiesEl.textContent = entityCount;
    if (levelEl) levelEl.textContent = level;
    if (seedEl) seedEl.textContent = seed;
  }

  handleAction(action) {
    switch (action) {
      case 'godmode':
        this.godMode = !this.godMode;
        showToast(`God mode: ${this.godMode ? 'ON' : 'OFF'}`);
        multiplayer.socket.emit('adminAction', { action: 'toggleGodMode', payload: { enabled: this.godMode } });
        break;
      case 'noclip':
        this.noClip = !this.noClip;
        showToast(`No clip: ${this.noClip ? 'ON' : 'OFF'}`);
        break;
      case 'aiignore':
        this.aiIgnore = !this.aiIgnore;
        showToast(`AI Ignore Me: ${this.aiIgnore ? 'ON' : 'OFF'}`);
        break;
      case 'heal':
        if (this.selectedPlayer) showToast(`Healed ${this.selectedPlayer.username}`);
        break;
      case 'spawn-entity':
        const type = document.getElementById('spawnEntityType').value || 'HOUND';
        const x = Number(document.getElementById('spawnEntityX').value || 0);
        const z = Number(document.getElementById('spawnEntityZ').value || 0);
        multiplayer.socket.emit('adminAction', { action: 'spawnEntity', payload: { type, x, z, id: `entity_${Date.now()}` } });
        showToast(`Spawned ${type}`);
        break;
      case 'change-level':
        const level = Number(document.getElementById('adminLevelSelect').value || 0);
        multiplayer.socket.emit('adminAction', { action: 'changeLevel', payload: { level } });
        showToast(`Changed to Level ${level}`);
        break;
      case 'reset-objectives':
        multiplayer.socket.emit('adminAction', { action: 'resetObjectives' });
        showToast('Objectives reset');
        break;
      default:
        showToast(`Action: ${action}`);
    }
  }
}

window.adminController = new AdminController();
