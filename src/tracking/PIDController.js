/**
 * PID Controller for Pan and Tilt Gimbal Servos
 * 
 * Features:
 * - Proportional, Integral, Derivative control
 * - Integral anti-windup clamping
 * - Error deadband to prevent hunting/jitter
 * - Output velocity saturation limits
 * - Derivative low-pass filter to reject measurement noise
 */
export class PIDController {
  constructor({
    kp = 1.5,
    ki = 0.05,
    kd = 0.10,
    outputMin = -30.0, // degrees per second
    outputMax = 30.0,
    integralMin = -10.0,
    integralMax = 10.0,
    deadband = 0.005, // degrees
    derivativeFilterTau = 0.02 // seconds
  } = {}) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
    this.integralMin = integralMin;
    this.integralMax = integralMax;
    this.deadband = deadband;
    this.derivativeFilterTau = derivativeFilterTau;

    this.integral = 0;
    this.prevError = 0;
    this.filteredDerivative = 0;
    this.firstRun = true;
  }

  setGains(kp, ki, kd) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
  }

  /**
   * Compute control output given current error
   * @param {number} error Setpoint - Process Variable (degrees)
   * @param {number} dt Delta time (seconds)
   * @returns {number} Commanded angular velocity or delta rotation (deg/s)
   */
  compute(error, dt) {
    if (dt <= 0 || isNaN(dt)) return 0;

    // Apply deadband
    if (Math.abs(error) < this.deadband) {
      error = 0;
    }

    // Proportional term
    const pTerm = this.kp * error;

    // Integral term with anti-windup clamping
    this.integral += error * dt;
    if (this.integral > this.integralMax) this.integral = this.integralMax;
    if (this.integral < this.integralMin) this.integral = this.integralMin;
    const iTerm = this.ki * this.integral;

    // Derivative term with low-pass filtering
    let dTerm = 0;
    if (!this.firstRun) {
      const rawDerivative = (error - this.prevError) / dt;
      const alpha = dt / (this.derivativeFilterTau + dt);
      this.filteredDerivative = alpha * rawDerivative + (1 - alpha) * this.filteredDerivative;
      dTerm = this.kd * this.filteredDerivative;
    } else {
      this.firstRun = false;
    }

    this.prevError = error;

    // Raw PID output
    let output = pTerm + iTerm + dTerm;

    // Output saturation limit
    if (output > this.outputMax) output = this.outputMax;
    if (output < this.outputMin) output = this.outputMin;

    return output;
  }

  reset() {
    this.integral = 0;
    this.prevError = 0;
    this.filteredDerivative = 0;
    this.firstRun = true;
  }
}
