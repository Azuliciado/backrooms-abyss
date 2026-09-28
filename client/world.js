function getGraphicsSettings(preset) {
  const settings = {
    POTATO: {
      renderDistance: 15,
      lightIntensity: 0.6,
      shadowQuality: 512,
      textureQuality: 0.5,
      particleCount: 20,
      postProcessing: false
    },
    REGULAR: {
      renderDistance: 35,
      lightIntensity: 0.9,
      shadowQuality: 1024,
      textureQuality: 1.0,
      particleCount: 80,
      postProcessing: true
    },
    'RTX / ULTRA': {
      renderDistance: 60,
      lightIntensity: 1.2,
      shadowQuality: 2048,
      textureQuality: 2.0,
      particleCount: 200,
      postProcessing: true
    }
  };
  return settings[preset] || settings.REGULAR;
}

function createBackroomsWorld(scene, preset = 'REGULAR') {
  const world = {
    light: new THREE.DirectionalLight(0xb0c4de, 1),
    ambientLight: null
  };

  world.light.position.set(10, 15, 10);
  world.light.castShadow = true;
  world.light.shadow.mapSize.width = 2048;
  world.light.shadow.mapSize.height = 2048;
  world.light.shadow.camera.left = -50;
  world.light.shadow.camera.right = 50;
  world.light.shadow.camera.top = 50;
  world.light.shadow.camera.bottom = -50;
  world.light.shadow.camera.far = 100;
  scene.add(world.light);

  // Create Level 0 - The Lobby
  createLevel0(scene, preset);

  return world;
}

function createLevel0(scene, preset) {
  const graphicsSettings = getGraphicsSettings(preset);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a8b6e,
    roughness: 0.9,
    metalness: 0.0
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Create repeating hallway structure
  for (let i = 0; i < 5; i++) {
    createHallwaySegment(scene, i * 15, graphicsSettings);
  }

  // Ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(100, 100);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a7a7a,
    roughness: 0.8,
    metalness: 0.1
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.y = 4;
  ceiling.rotation.x = Math.PI / 2;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Fluorescent lights
  for (let x = -40; x < 40; x += 5) {
    for (let z = -40; z < 40; z += 5) {
      createFluorescentLight(scene, x, 3.8, z);
    }
  }
}

function createHallwaySegment(scene, zOffset, graphicsSettings) {
  // Left wall
  const leftWallGeo = new THREE.BoxGeometry(1, 4, 15);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffeb99,
    roughness: 0.8,
    metalness: 0.0
  });
  const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
  leftWall.position.set(-5, 2, zOffset);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(leftWallGeo, wallMaterial);
  rightWall.position.set(5, 2, zOffset);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);
}

function createFluorescentLight(scene, x, y, z) {
  // Light source
  const light = new THREE.PointLight(0xb0c4de, 2, 15);
  light.position.set(x, y, z);
  light.castShadow = true;
  scene.add(light);

  // Visual fixture
  const fixtureGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.2
  });
  const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
  fixture.position.set(x, y, z);
  fixture.castShadow = true;
  scene.add(fixture);
}

window.createBackroomsWorld = createBackroomsWorld;
window.getGraphicsSettings = getGraphicsSettings;
