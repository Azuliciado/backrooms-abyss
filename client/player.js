class LocalPlayerController {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.position = new THREE.Vector3(0, 1.7, 8);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.speed = 5;
    this.sprintSpeed = 8;
    this.crouchSpeed = 2.5;
    this.currentSpeed = this.speed;
    this.isGrounded = true;
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false,
      flashlight: false
    };
    this.raycaster = new THREE.Raycaster();
    this.inventory = new InventoryManager();
  }

  setInput(input) {
    this.input = { ...this.input, ...input };
  }

  update(deltaTime) {
    const moveDirection = new THREE.Vector3();

    if (this.input.forward) moveDirection.z -= 1;
    if (this.input.backward) moveDirection.z += 1;
    if (this.input.left) moveDirection.x -= 1;
    if (this.input.right) moveDirection.x += 1;

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();

      if (this.input.sprint && window.appShouldSprint !== false) {
        this.currentSpeed = this.sprintSpeed;
      } else if (this.input.crouch) {
        this.currentSpeed = this.crouchSpeed;
      } else {
        this.currentSpeed = this.speed;
      }

      const worldDirection = new THREE.Vector3();
      worldDirection.x = Math.sin(this.yaw) * moveDirection.z + Math.cos(this.yaw) * moveDirection.x;
      worldDirection.z = Math.cos(this.yaw) * moveDirection.z - Math.sin(this.yaw) * moveDirection.x;

      this.position.add(worldDirection.multiplyScalar(this.currentSpeed * deltaTime));
    }

    this.velocity.y = Math.max(this.velocity.y - 9.8 * deltaTime, -20);
    this.position.y += this.velocity.y * deltaTime;

    if (this.position.y < 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    if (this.input.jump && this.isGrounded) {
      this.velocity.y = 5;
      this.isGrounded = false;
    }

    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  updateRotation(deltaX, deltaY, sensitivity = 0.003) {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
  }

  interact() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    // TODO: Check for interactable objects in the scene
  }
}

window.LocalPlayerController = LocalPlayerController;
