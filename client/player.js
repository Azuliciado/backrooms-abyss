class LocalPlayerController {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.position = new THREE.Vector3(0, 1.7, 10);
    this.velocity = new THREE.Vector3();
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
    this.pitch = 0;
    this.yaw = 0;
    this.isGrounded = true;
    this.speed = 5;
    this.sprintSpeed = 8.2;
    this.crouchSpeed = 2.5;
    this.height = 1.7;
  }

  setInput(inputState) {
    this.input = { ...this.input, ...inputState };
  }

  update(dt) {
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (this.input.forward) moveDir.add(forward);
    if (this.input.backward) moveDir.sub(forward);
    if (this.input.right) moveDir.add(right);
    if (this.input.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const isSprinting = this.input.sprint && this.input.forward;
    const speed = isSprinting ? this.sprintSpeed : this.crouchSpeed;
    const target = moveDir.multiplyScalar(speed);
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, target.x, 0.12);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, target.z, 0.12);
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    this.position.x = THREE.MathUtils.clamp(this.position.x, -20, 20);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -20, 20);

    this.camera.position.set(this.position.x, this.position.y, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  applyMouseLook(deltaX, deltaY) {
    this.yaw -= deltaX * 0.0018;
    this.pitch -= deltaY * 0.0015;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.55, 1.55);
  }
}

window.LocalPlayerController = LocalPlayerController;
