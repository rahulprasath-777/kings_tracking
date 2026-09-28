/**
 * Autonomous Search Patterns for Target Acquisition
 * 
 * Supports:
 * 1. Spiral Scan: Archimedean spiral expanding outwards from nominal search center
 * 2. Raster Scan: Systematic serpentine pan-tilt sweeping
 */
export class SearchPatternGenerator {
  constructor({
    type = 'spiral', // 'spiral' | 'raster'
    centerPan = 0,
    centerTilt = 0,
    panRange = 60, // ±30 deg
    tiltRange = 30, // ±15 deg
    speed = 1.0
  } = {}) {
    this.type = type;
    this.centerPan = centerPan;
    this.centerTilt = centerTilt;
    this.panRange = panRange;
    this.tiltRange = tiltRange;
    this.speed = speed;

    this.time = 0;
    this.rasterRow = 0;
    this.rasterCol = 0;
    this.rasterDirection = 1;
  }

  setCenter(pan, tilt) {
    this.centerPan = pan;
    this.centerTilt = tilt;
  }

  reset() {
    this.time = 0;
    this.rasterRow = 0;
    this.rasterCol = 0;
    this.rasterDirection = 1;
  }

  /**
   * Calculate search offset at current time
   * @param {number} dt Delta time in seconds
   * @returns {{ targetPan: number, targetTilt: number }}
   */
  update(dt) {
    this.time += dt * this.speed;

    if (this.type === 'spiral') {
      // Archimedean spiral: r = a * theta
      // Pan = r * cos(theta), Tilt = r * sin(theta) * aspect
      const omega = 1.5; // angular speed (rad/s)
      const theta = this.time * omega;
      const maxRadius = this.panRange / 2;
      const expansionRate = 2.0; // deg per radian
      const radius = Math.min(maxRadius, (expansionRate * theta) % maxRadius);

      const dPan = radius * Math.cos(theta);
      const dTilt = (radius * (this.tiltRange / this.panRange)) * Math.sin(theta);

      return {
        targetPan: this.centerPan + dPan,
        targetTilt: this.centerTilt + dTilt
      };
    } else {
      // Raster (Serpentine) scan
      const sweepPeriod = 4.0; // seconds per horizontal sweep
      const numRows = 6;

      const cycle = this.time / sweepPeriod;
      const currentRow = Math.floor(cycle) % numRows;
      const frac = (this.time % sweepPeriod) / sweepPeriod;

      // Ping-pong horizontal sweep
      const isEvenRow = (currentRow % 2 === 0);
      const horizontalFrac = isEvenRow ? frac : (1 - frac);
      const dPan = (horizontalFrac - 0.5) * this.panRange;
      const dTilt = ((currentRow / (numRows - 1)) - 0.5) * this.tiltRange;

      return {
        targetPan: this.centerPan + dPan,
        targetTilt: this.centerTilt + dTilt
      };
    }
  }
}
