function createBackroomsWorld(scene, graphicsPreset = 'REGULAR') {
  const world = new THREE.Group();
  scene.add(world);

  const materialWall = new THREE.MeshStandardMaterial({
    color: 0xd9c76b,
    roughness: 1,
    metalness: 0.1
  });

  const materialFloor = new THREE.MeshStandardMaterial({
    color: 0xb9a75d,
    roughness: 1,
    metalness: 0.05
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 120), materialFloor);
  floor.position.y = -0.5;
  world.add(floor);

  const wallHeight = 5;
  const hallwayWidth = 8;

  const wallData = [
    { x: 0, y: wallHeight / 2, z: -24, w: 60, h: wallHeight, d: 1 },
    { x: 0, y: wallHeight / 2, z: 24, w: 60, h: wallHeight, d: 1 },
    { x: -24, y: wallHeight / 2, z: 0, w: 1, h: wallHeight, d: 60 },
    { x: 24, y: wallHeight / 2, z: 0, w: 1, h: wallHeight, d: 60 },
    { x: 0, y: wallHeight / 2, z: 0, w: 12, h: wallHeight, d: 40 }
  ];

  wallData.forEach((wallDef) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(wallDef.w, wallDef.h, wallDef.d),
      materialWall
    );
    wall.position.set(wallDef.x, wallDef.y, wallDef.z);
    world.add(wall);
  });

  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f3c7, emissive: 0xffef9e, emissiveIntensity: 0.8 });
  for (let x = -18; x <= 18; x += 6) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), lightMaterial);
    light.position.set(x, 4.5, 0);
    world.add(light);
  }

  const ceilingLight = new THREE.PointLight(0xf8e7a5, 0.9, 30, 2);
  ceilingLight.position.set(0, 4.2, 0);
  world.add(ceilingLight);

  const fogColor = new THREE.Color(0x1a1a22);
  scene.fog = new THREE.Fog(fogColor, 10, 45);

  const props = new THREE.Group();
  for (let i = 0; i < 24; i++) {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xb7a35a, roughness: 1 })
    );
    column.position.set((Math.random() - 0.5) * 30, 1.5, (Math.random() - 0.5) * 30);
    props.add(column);
  }
  world.add(props);

  const exitFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.5 })
  );
  exitFrame.position.set(0, 1.5, 18.4);
  world.add(exitFrame);

  const exitDoor = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x2a3037, roughness: 0.8 })
  );
  exitDoor.position.set(0, 1.5, 18.7);
  world.add(exitDoor);

  return {
    group: world,
    props,
    exit: exitDoor,
    light: ceilingLight
  };
}

window.createBackroomsWorld = createBackroomsWorld;
