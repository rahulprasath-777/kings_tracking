/**
 * 2D Constant Velocity Kalman Filter
 * State vector: [x, y, vx, vy]^T
 * Measurement vector: [z_x, z_y]^T
 * 
 * Used for smoothing target measurements and predicting position during signal loss.
 */
export class KalmanFilter2D {
  constructor({
    processNoise = 0.5,
    measurementNoise = 2.0,
    errorCovariance = 10.0
  } = {}) {
    this.q = processNoise;
    this.r = measurementNoise;

    // State: [x, y, vx, vy]
    this.x = [0, 0, 0, 0];

    // State covariance matrix (4x4)
    this.P = [
      [errorCovariance, 0, 0, 0],
      [0, errorCovariance, 0, 0],
      [0, 0, errorCovariance, 0],
      [0, 0, 0, errorCovariance]
    ];

    this.initialized = false;
    this.predictOnlyCount = 0;
  }

  init(x, y) {
    this.x = [x, y, 0, 0];
    this.P = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 10, 0],
      [0, 0, 0, 10]
    ];
    this.initialized = true;
    this.predictOnlyCount = 0;
  }

  /**
   * Predict step
   * @param {number} dt Time step in seconds
   */
  predict(dt = 0.016) {
    if (!this.initialized) return { x: 0, y: 0, vx: 0, vy: 0 };

    // State transition matrix F:
    // [1, 0, dt, 0 ]
    // [0, 1, 0,  dt]
    // [0, 0, 1,  0 ]
    // [0, 0, 0,  1 ]
    const x = this.x[0] + this.x[2] * dt;
    const y = this.x[1] + this.x[3] * dt;
    const vx = this.x[2];
    const vy = this.x[3];
    this.x = [x, y, vx, vy];

    // Process noise covariance Q (discrete approximation)
    const dt2 = dt * dt;
    const dt3 = (dt2 * dt) / 2;
    const dt4 = (dt2 * dt2) / 4;
    const q = this.q;

    // P = F * P * F^T + Q
    const p = this.P;
    const p00 = p[0][0] + dt * (p[2][0] + p[0][2] + dt * p[2][2]) + dt4 * q;
    const p01 = p[0][1] + dt * (p[2][1] + p[0][3] + dt * p[2][3]);
    const p02 = p[0][2] + dt * p[2][2] + dt3 * q;
    const p03 = p[0][3] + dt * p[2][3];

    const p10 = p[1][0] + dt * (p[3][0] + p[1][2] + dt * p[3][2]);
    const p11 = p[1][1] + dt * (p[3][1] + p[1][3] + dt * p[3][3]) + dt4 * q;
    const p12 = p[1][2] + dt * p[3][2];
    const p13 = p[1][3] + dt * p[3][3] + dt3 * q;

    const p20 = p[2][0] + dt * p[2][2] + dt3 * q;
    const p21 = p[2][1] + dt * p[2][3];
    const p22 = p[2][2] + dt2 * q;
    const p23 = p[2][3];

    const p30 = p[3][0] + dt * p[3][2];
    const p31 = p[3][1] + dt * p[3][3] + dt3 * q;
    const p32 = p[3][2];
    const p33 = p[3][3] + dt2 * q;

    this.P = [
      [p00, p01, p02, p03],
      [p10, p11, p12, p13],
      [p20, p21, p22, p23],
      [p30, p31, p32, p33]
    ];

    this.predictOnlyCount++;
    return { x: this.x[0], y: this.x[1], vx: this.x[2], vy: this.x[3] };
  }

  /**
   * Measurement update step
   * @param {number} zx Measured pixel X
   * @param {number} zy Measured pixel Y
   */
  update(zx, zy) {
    if (!this.initialized) {
      this.init(zx, zy);
      return { x: zx, y: zy, vx: 0, vy: 0 };
    }

    // Measurement residual (innovation) y = z - H*x
    // H = [ [1, 0, 0, 0], [0, 1, 0, 0] ]
    const y0 = zx - this.x[0];
    const y1 = zy - this.x[1];

    // Residual covariance S = H * P * H^T + R
    const r = this.r;
    const s00 = this.P[0][0] + r;
    const s01 = this.P[0][1];
    const s10 = this.P[1][0];
    const s11 = this.P[1][1] + r;

    // Inverse of 2x2 matrix S
    const det = s00 * s11 - s01 * s10;
    if (Math.abs(det) < 1e-9) return { x: this.x[0], y: this.x[1], vx: this.x[2], vy: this.x[3] };

    const invS00 = s11 / det;
    const invS01 = -s01 / det;
    const invS10 = -s10 / det;
    const invS11 = s00 / det;

    // Kalman gain K = P * H^T * inv(S)
    const k00 = this.P[0][0] * invS00 + this.P[0][1] * invS10;
    const k01 = this.P[0][0] * invS01 + this.P[0][1] * invS11;

    const k10 = this.P[1][0] * invS00 + this.P[1][1] * invS10;
    const k11 = this.P[1][0] * invS01 + this.P[1][1] * invS11;

    const k20 = this.P[2][0] * invS00 + this.P[2][1] * invS10;
    const k21 = this.P[2][0] * invS01 + this.P[2][1] * invS11;

    const k30 = this.P[3][0] * invS00 + this.P[3][1] * invS10;
    const k31 = this.P[3][0] * invS01 + this.P[3][1] * invS11;

    // Updated state estimate: x = x + K * y
    this.x[0] += k00 * y0 + k01 * y1;
    this.x[1] += k10 * y0 + k11 * y1;
    this.x[2] += k20 * y0 + k21 * y1;
    this.x[3] += k30 * y0 + k31 * y1;

    // Updated covariance: P = (I - K * H) * P
    // Using Joseph form or standard update for stability
    const I_KH00 = 1 - k00;
    const I_KH01 = -k01;
    const I_KH10 = -k10;
    const I_KH11 = 1 - k11;
    const I_KH20 = -k20;
    const I_KH21 = -k21;
    const I_KH30 = -k30;
    const I_KH31 = -k31;

    const p = this.P;
    this.P = [
      [
        I_KH00 * p[0][0] + I_KH01 * p[1][0],
        I_KH00 * p[0][1] + I_KH01 * p[1][1],
        I_KH00 * p[0][2] + I_KH01 * p[1][2],
        I_KH00 * p[0][3] + I_KH01 * p[1][3]
      ],
      [
        I_KH10 * p[0][0] + I_KH11 * p[1][0],
        I_KH10 * p[0][1] + I_KH11 * p[1][1],
        I_KH10 * p[0][2] + I_KH11 * p[1][2],
        I_KH10 * p[0][3] + I_KH11 * p[1][3]
      ],
      [
        I_KH20 * p[0][0] + I_KH21 * p[1][0] + p[2][0],
        I_KH20 * p[0][1] + I_KH21 * p[1][1] + p[2][1],
        I_KH20 * p[0][2] + I_KH21 * p[1][2] + p[2][2],
        I_KH20 * p[0][3] + I_KH21 * p[1][3] + p[2][3]
      ],
      [
        I_KH30 * p[0][0] + I_KH31 * p[1][0] + p[3][0],
        I_KH30 * p[0][1] + I_KH31 * p[1][1] + p[3][1],
        I_KH30 * p[0][2] + I_KH31 * p[1][2] + p[3][2],
        I_KH30 * p[0][3] + I_KH31 * p[1][3] + p[3][3]
      ]
    ];

    this.predictOnlyCount = 0;
    return { x: this.x[0], y: this.x[1], vx: this.x[2], vy: this.x[3] };
  }

  getState() {
    return {
      x: this.x[0],
      y: this.x[1],
      vx: this.x[2],
      vy: this.x[3],
      isPredictingOnly: this.predictOnlyCount > 0
    };
  }

  reset() {
    this.initialized = false;
    this.predictOnlyCount = 0;
    this.x = [0, 0, 0, 0];
  }
}
