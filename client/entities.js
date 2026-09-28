class EntityManager {
  constructor(scene) {
    this.scene = scene;
    this.entities = new Map();
    this.entityMeshes = new Map();
  }

  spawn(id, type, x, y, z) {
    const entity = {
      id,
      type,
      x,
      y,
      z,
      state: 'IDLE',
      targetId: null,
      lastSeen: { x, y, z },
      stateTime: 0,
      velocity: { x: 0, z: 0 },
      health: type === 'HOUND' ? 40 : type === 'SMILER' ? 25 : 35
    };

    this.entities.set(id, entity);
    this.createMesh(entity);
    return entity;
  }

  createMesh(entity) {
    let geometry, material, mesh;

    if (entity.type === 'HOUND') {
      geometry = new THREE.BoxGeometry(1.2, 1.4, 2.2);
      material = new THREE.MeshStandardMaterial({ color: 0x440033, emissive: 0x660055, roughness: 0.8 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(entity.x, entity.y, entity.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
    } else if (entity.type === 'SMILER') {
      geometry = new THREE.SphereGeometry(0.8, 12, 12);
      material = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xffff00, emissiveIntensity: 0.3 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(entity.x, entity.y, entity.z);
      this.scene.add(mesh);
    } else if (entity.type === 'SKIN_STEALER') {
      geometry = new THREE.CapsuleGeometry(0.6, 1.8, 4, 8);
      material = new THREE.MeshStandardMaterial({ color: 0x885544, metalness: 0.2, roughness: 0.9 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(entity.x, entity.y, entity.z);
      this.scene.add(mesh);
    }

    this.entityMeshes.set(entity.id, mesh);
  }

  update(dt, players = []) {
    this.entities.forEach((entity) => {
      this.updateEntity(entity, dt, players);
      const mesh = this.entityMeshes.get(entity.id);
      if (mesh) {
        mesh.position.set(entity.x, entity.y, entity.z);
      }
    });
  }

  updateEntity(entity, dt, players) {
    entity.stateTime += dt;

    const closestPlayer = players.reduce((closest, p) => {
      if (!p) return closest;
      const dist = Math.hypot(p.x - entity.x, p.z - entity.z);
      if (!closest || dist < closest.distance) return { player: p, distance: dist };
      return closest;
    }, null);

    if (entity.type === 'HOUND') {
      this.updateHound(entity, dt, closestPlayer);
    } else if (entity.type === 'SMILER') {
      this.updateSmiler(entity, dt, closestPlayer);
    } else if (entity.type === 'SKIN_STEALER') {
      this.updateSkinStealer(entity, dt, closestPlayer);
    }
  }

  updateHound(entity, dt, closest) {
    const hearingRange = 15;
    const sightRange = 20;

    if (entity.state === 'IDLE') {
      if (entity.stateTime > 3) {
        entity.state = 'PATROL';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'PATROL') {
      entity.x += Math.sin(entity.stateTime * 0.3) * 0.05;
      entity.z += Math.cos(entity.stateTime * 0.3) * 0.05;

      if (closest && closest.distance < hearingRange) {
        entity.state = 'INVESTIGATE';
        entity.targetId = closest.player.id;
        entity.lastSeen = { x: closest.player.x, z: closest.player.z };
        entity.stateTime = 0;
      }
    } else if (entity.state === 'INVESTIGATE') {
      if (closest && closest.distance < sightRange) {
        entity.state = 'CHASE';
        entity.stateTime = 0;
      } else if (entity.stateTime > 5) {
        entity.state = 'PATROL';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'CHASE') {
      if (closest && closest.distance < sightRange) {
        const dx = closest.player.x - entity.x;
        const dz = closest.player.z - entity.z;
        const dist = Math.hypot(dx, dz);
        entity.x += (dx / dist) * 6 * dt;
        entity.z += (dz / dist) * 6 * dt;
      } else {
        entity.state = 'SEARCH';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'SEARCH') {
      if (entity.stateTime > 8) {
        entity.state = 'PATROL';
        entity.stateTime = 0;
      }
    }
  }

  updateSmiler(entity, dt, closest) {
    if (entity.state === 'IDLE') {
      if (entity.stateTime > 4) {
        entity.state = 'OBSERVE';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'OBSERVE') {
      if (closest && closest.distance < 25) {
        entity.state = 'INVESTIGATE';
        entity.stateTime = 0;
      } else if (entity.stateTime > 6) {
        entity.state = 'IDLE';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'INVESTIGATE') {
      if (closest && closest.distance < 12) {
        entity.state = 'CHASE';
        entity.stateTime = 0;
      } else if (entity.stateTime > 3) {
        entity.state = 'IDLE';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'CHASE') {
      if (closest && closest.distance < 18) {
        const dx = closest.player.x - entity.x;
        const dz = closest.player.z - entity.z;
        const dist = Math.hypot(dx, dz);
        entity.x += (dx / dist) * 4.5 * dt;
        entity.z += (dz / dist) * 4.5 * dt;
      } else {
        entity.state = 'RETREAT';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'RETREAT') {
      if (entity.stateTime > 5) {
        entity.state = 'IDLE';
        entity.stateTime = 0;
      }
    }
  }

  updateSkinStealer(entity, dt, closest) {
    if (entity.state === 'WANDER') {
      entity.x += Math.sin(entity.stateTime) * 0.03;
      entity.z += Math.cos(entity.stateTime * 0.7) * 0.03;

      if (closest && closest.distance < 22) {
        entity.state = 'INVESTIGATE';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'INVESTIGATE') {
      if (closest && closest.distance < 10) {
        entity.state = 'HOSTILE';
        entity.targetId = closest.player.id;
        entity.stateTime = 0;
      } else if (entity.stateTime > 4) {
        entity.state = 'WANDER';
        entity.stateTime = 0;
      }
    } else if (entity.state === 'HOSTILE') {
      if (closest && closest.distance < 16) {
        const dx = closest.player.x - entity.x;
        const dz = closest.player.z - entity.z;
        const dist = Math.hypot(dx, dz);
        entity.x += (dx / dist) * 5.2 * dt;
        entity.z += (dz / dist) * 5.2 * dt;
      } else {
        entity.state = 'WANDER';
        entity.stateTime = 0;
      }
    }
  }

  remove(id) {
    const mesh = this.entityMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.entityMeshes.delete(id);
    }
    this.entities.delete(id);
  }

  clear() {
    this.entities.forEach((entity) => this.remove(entity.id));
    this.entities.clear();
  }
}

window.EntityManager = EntityManager;
