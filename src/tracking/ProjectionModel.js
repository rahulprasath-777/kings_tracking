import * as THREE from 'three';

/**
 * Pinhole Camera Perspective Projection Model & Gimbal Kinematics
 * 
 * Camera Specification:
 * - Resolution: 640 x 480
 * - Horizontal FOV: 10.0 deg
 * - Vertical FOV: 7.5 deg
 */
export class ProjectionModel {
  constructor({
    width = 640,
    height = 480,
    hfovDeg = 10.0,
    vfovDeg = 7.5
  } = {}) {
    this.width = width;
    this.height = height;
    this.hfovDeg = hfovDeg;
    this.vfovDeg = vfovDeg;

    this.hfovRad = (hfovDeg * Math.PI) / 180;
    this.vfovRad = (vfovDeg * Math.PI) / 180;

    // Intrinsic matrix parameters
    this.fx = width / (2 * Math.tan(this.hfovRad / 2));
    this.fy = height / (2 * Math.tan(this.vfovRad / 2));
    this.cx = width / 2;
    this.cy = height / 2;

    this._tempV = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._camForward = new THREE.Vector3();
    this._camRight = new THREE.Vector3();
    this._camUp = new THREE.Vector3();
    this._toTarget = new THREE.Vector3();
  }

  /**
   * Project a 3D target in world space into the virtual camera image coordinates
   * @param {THREE.Vector3} targetWorldPos 
   * @param {THREE.Vector3} cameraWorldPos 
   * @param {number} panYawDeg Current Pan angle (deg)
   * @param {number} tiltPitchDeg Current Tilt angle (deg)
   */
  project(targetWorldPos, cameraWorldPos, panYawDeg, tiltPitchDeg) {
    // Relative vector from camera to target
    this._toTarget.subVectors(targetWorldPos, cameraWorldPos);
    const distance = this._toTarget.length();

    // Gimbal camera orientation vectors:
    // Yaw rotates around Y (Pan)
    // Pitch rotates around local X (Tilt)
    const yawRad = (panYawDeg * Math.PI) / 180;
    const pitchRad = (tiltPitchDeg * Math.PI) / 180;

    // Forward direction of camera in world space
    // Standard spherical mapping:
    // +Z forward when yaw=0, pitch=0
    // yaw rotates about +Y (right/left)
    // pitch rotates up/down
    const cosPitch = Math.cos(pitchRad);
    const sinPitch = Math.sin(pitchRad);
    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);

    // Forward vector: [sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch)]
    this._camForward.set(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    ).normalize();

    // Right vector (perpendicular to Y in horizontal plane)
    this._camRight.set(Math.cos(yawRad), 0, -Math.sin(yawRad)).normalize();

    // Up vector (camForward x camRight in right-handed camera space: +Y is Up)
    this._camUp.crossVectors(this._camForward, this._camRight).normalize();

    // Project target vector onto camera local axes
    // localZ = forward (optical axis)
    // localX = right (horizontal image axis)
    // localY = up (vertical image axis)
    const localZ = this._toTarget.dot(this._camForward);
    const localX = this._toTarget.dot(this._camRight);
    const localY = this._toTarget.dot(this._camUp);

    // Angular errors in camera coordinate frame (in degrees)
    // Pan error: angle between optical axis and target projected onto horizontal plane
    // Tilt error: angle between optical axis and target projected onto vertical plane
    const panErrorDeg = (Math.atan2(localX, localZ) * 180) / Math.PI;
    const tiltErrorDeg = (Math.atan2(localY, localZ) * 180) / Math.PI;

    // Direct 3D spherical angular error
    const normTarget = this._toTarget.clone().normalize();
    const dotProduct = Math.max(-1, Math.min(1, normTarget.dot(this._camForward)));
    const totalAngularErrorDeg = (Math.acos(dotProduct) * 180) / Math.PI;

    // Check if behind camera
    const isFront = localZ > 0.1;

    let pixelX = this.cx;
    let pixelY = this.cy;
    let inFOV = false;

    if (isFront) {
      // Pinhole camera projection:
      // x_pix = cx + fx * (localX / localZ)
      // y_pix = cy - fy * (localY / localZ)  (invert Y because screen Y goes downwards)
      pixelX = this.cx + this.fx * (localX / localZ);
      pixelY = this.cy - this.fy * (localY / localZ);

      // In FOV check
      inFOV = (
        pixelX >= 0 && pixelX <= this.width &&
        pixelY >= 0 && pixelY <= this.height &&
        Math.abs(panErrorDeg) <= this.hfovDeg / 2 &&
        Math.abs(tiltErrorDeg) <= this.vfovDeg / 2
      );
    }

    return {
      distance,
      localX,
      localY,
      localZ,
      isFront,
      pixelX,
      pixelY,
      inFOV,
      panErrorDeg,
      tiltErrorDeg,
      totalAngularErrorDeg,
      camForward: this._camForward.clone(),
      toTargetVector: this._toTarget.clone().normalize()
    };
  }
}
