function spawnPing(type, text, x, y, z, isLocal = false) {
  const geometry = new THREE.SphereGeometry(0.3, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.8
  });
  const ping = new THREE.Mesh(geometry, material);
  ping.position.set(x, y || 1.5, z);
  app.scene.add(ping);

  let life = 2;
  const originalUpdate = (delta) => {
    life -= delta;
    if (life <= 0) {
      app.scene.remove(ping);
      return;
    }
    ping.scale.set(1 + (1 - life / 2) * 0.5, 1 + (1 - life / 2) * 0.5, 1 + (1 - life / 2) * 0.5);
    ping.material.opacity = life / 2;
  };

  app.pingUpdates = app.pingUpdates || [];
  app.pingUpdates.push({ ping, update: originalUpdate });

  showToast(`[!] ${text}`);
}

function createEffects() {
  const effects = {
    flashlightFlicker() {
      if (Math.random() > 0.95) {
        const intensity = 0.5 + Math.random() * 0.5;
        app.world.light.intensity = intensity;
      }
    },

    sanityDistortion() {
      if (app.playerSanity < 50) {
        const distortion = (100 - app.playerSanity) / 100;
        if (Math.random() > 1 - distortion * 0.1) {
          app.camera.position.x += (Math.random() - 0.5) * distortion * 0.05;
          app.camera.position.y += (Math.random() - 0.5) * distortion * 0.05;
        }
      }
    },

    darknessFog() {
      const dark = app.currentLevel > 0;
      if (dark && app.scene.fog) {
        app.scene.fog.far = Math.max(15, app.scene.fog.far - 0.1);
      }
    }
  };

  return effects;
}

window.spawnPing = spawnPing;
window.createEffects = createEffects;
