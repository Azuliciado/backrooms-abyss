class LoadingManager {
  constructor() {
    this.isLoading = false;
    this.progress = 0;
    this.screen = null;
    this.bar = null;
  }

  init() {
    const loadingHTML = `
      <div id="loadingScreen" class="screen">
        <div class="panel">
          <div class="title">BACKROOMS: ABYSS</div>
          <div class="subtitle">LOADING...</div>
          <div style="margin-top: 20px;">
            <div style="background: rgba(50, 80, 140, 0.4); border: 1px solid rgba(120, 150, 200, 0.6); border-radius: 8px; height: 24px; overflow: hidden;">
              <div id="loadingBar" style="background: linear-gradient(90deg, #5a8aff, #7ab3ff); height: 100%; width: 0%; transition: width 0.2s ease;"></div>
            </div>
            <div id="loadingText" style="margin-top: 12px; text-align: center; font-size: 12px; opacity: 0.8;">Loading world...</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loadingHTML);
    this.screen = document.getElementById('loadingScreen');
    this.bar = document.getElementById('loadingBar');
  }

  show(text = 'Loading...') {
    if (!this.screen) this.init();
    this.screen.classList.add('active');
    this.isLoading = true;
    this.progress = 0;
    this.updateText(text);
  }

  setProgress(percent) {
    this.progress = Math.max(0, Math.min(100, percent));
    if (this.bar) {
      this.bar.style.width = `${this.progress}%`;
    }
  }

  updateText(text) {
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.textContent = text;
  }

  hide() {
    if (this.screen) this.screen.classList.remove('active');
    this.isLoading = false;
    this.progress = 0;
  }
}

window.LoadingManager = LoadingManager;
window.loadingManager = new LoadingManager();
