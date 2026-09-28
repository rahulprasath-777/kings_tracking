# ISRO — AI-Based 3D Satellite Virtual Camera Tracking System
### Coarse Alignment for Mobile Free Space Optical Communication (FSOC) Terminals

**Organization:** Indian Space Research Organisation (ISRO)  
**Theme:** Smart Automation / Software  
**Prototype Category:** Full-Stack Aerospace Simulation, Computer Vision & Digital Twin  

---

## 🛰️ 1. Project Overview

Free Space Optical Communication (FSOC) offers ultra-high bandwidth, low probability of intercept (LPI), and license-free optical data links for satellite-to-ground and satellite-to-satellite inter-satellite links (ISLs). However, due to the extremely narrow beam divergence of optical lasers (typically tens of microradians), establishing an optical link requires two stages:
1. **Coarse Alignment**: Wide-FOV optical tracking camera locates the target satellite, calculates angular line-of-sight deviation, and slews the mechanical gimbal until the satellite is aligned within the fine tracking cone (< 0.25°).
2. **Fine Tracking**: Fine Steering Mirrors (FSM) and quadrant photodetectors lock and maintain the beam.

This software prototype implements a **full closed-loop AI and virtual camera coarse tracking system** for ISRO mobile FSOC terminals.

---

## 📐 2. Closed-Loop Architecture

```
SPACE ENVIRONMENT (Earth, Starfield, Orbit Path)
                  ↓
       MOVING 3D SATELLITE (TARGET-SAT-01)
                  ↓
VIRTUAL PINHOLE CAMERA (10.0° HFOV × 7.5° VFOV)
                  ↓
  AI VISION TARGET DETECTION (Beacon & Contour Centroid)
                  ↓
     TARGET POSITION ESTIMATION (Image Plane: X_pix, Y_pix)
                  ↓
   2D KALMAN FILTER (Position & Velocity Smoothing / Prediction)
                  ↓
      PAN / TILT ANGULAR ERROR CALCULATION
                  ↓
   DUAL-AXIS PID CONTROLLER (Anti-windup, Deadband, Saturation)
                  ↓
     MECHANICAL 2-AXIS GIMBAL ROTATION (Pan/Yaw, Tilt/Pitch)
                  ↓
 CAMERA ROTATES VISIBLY IN 3D SPACE TOWARD SATELLITE
                  ↓
     CLOSED-LOOP ERROR CONVERGES TOWARDS ZERO (< 0.25°)
                  ↓
               LOCKED
```

---

## 🔬 3. Key Theoretical & Engineering Foundations

### A. Perspective Pinhole Projection Model
The virtual tracking camera uses realistic camera intrinsics:
- Resolution: $W = 640$, $H = 480$
- Horizontal FOV: $\text{HFOV} = 10.0^\circ$
- Vertical FOV: $\text{VFOV} = 7.5^\circ$
- Focal lengths:
  $$f_x = \frac{W}{2 \tan(\text{HFOV} / 2)}$$
  $$f_y = \frac{H}{2 \tan(\text{VFOV} / 2)}$$
- Principal point: $(c_x, c_y) = (W/2, H/2)$

3D world coordinates $\mathbf{P}_w$ are transformed into camera coordinates $\mathbf{P}_c = [X_c, Y_c, Z_c]^T$ using the gimbal yaw ($\psi$) and pitch ($\theta$):
$$x_{pix} = c_x + f_x \frac{X_c}{Z_c}, \quad y_{pix} = c_y - f_y \frac{Y_c}{Z_c}$$
$$\text{Pan Error} = \arctan\left(\frac{X_c}{Z_c}\right), \quad \text{Tilt Error} = \arctan\left(\frac{Y_c}{Z_c}\right)$$
$$\text{Total Angular Error} = \arccos(\hat{\mathbf{v}}_{\text{target}} \cdot \hat{\mathbf{v}}_{\text{boresight}})$$

### B. 2D Constant Velocity Kalman Filter
State vector: $\mathbf{x} = [x, y, v_x, v_y]^T$  
Measurement vector: $\mathbf{z} = [z_x, z_y]^T$  

- State Transition Matrix $\mathbf{F}$:
  $$\mathbf{F} = \begin{bmatrix} 1 & 0 & \Delta t & 0 \\ 0 & 1 & 0 & \Delta t \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$
- Predict step:
  $$\hat{\mathbf{x}}_{k|k-1} = \mathbf{F}\hat{\mathbf{x}}_{k-1|k-1}$$
  $$\mathbf{P}_{k|k-1} = \mathbf{F}\mathbf{P}_{k-1|k-1}\mathbf{F}^T + \mathbf{Q}$$
- Update step:
  $$\mathbf{y}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_{k|k-1}$$
  $$\mathbf{S}_k = \mathbf{H}\mathbf{P}_{k|k-1}\mathbf{H}^T + \mathbf{R}$$
  $$\mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}^T \mathbf{S}_k^{-1}$$
  $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + \mathbf{K}_k \mathbf{y}_k$$
- **Target Occlusion / Coasting**: When the satellite beacon is temporarily occluded by clouds, satellite body rotation, or sensor noise, the Kalman Filter switches to prediction-only mode, keeping the gimbal tracking smoothly along the expected trajectory until reacquisition.

### C. Dual-Axis PID Controller
Servos control pan (azimuth) and tilt (elevation):
$$u(t) = K_p e(t) + K_i \int_0^t e(\tau) d\tau + K_d \frac{de(t)}{dt}$$
- Clamped integral anti-windup prevents integrator saturation during high-speed slewing.
- Deadband threshold ($\pm 0.005^\circ$) eliminates high-frequency mechanical servo hunting.
- First-order derivative low-pass filter ($\tau = 0.02s$) attenuates sensor noise.

---

## 🚀 4. How to Run the Application

### Prerequisites:
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### Frontend (Simulation & Digital Twin Dashboard):
```bash
cd satellite-tracking
npm install
npm run dev
```
Open your browser to: **`http://localhost:5173`**

### Backend (Optional Python FastAPI Service):
```bash
cd satellite-tracking/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🎬 5. Automated 13-Phase SIH Evaluation Script

Click the **`RUN DEMO`** button in the top bar to run the autonomous presentation tour:

1. **Phase 1: Initial Misalignment** — Camera starts offset (Pan $50^\circ$, Tilt $-25^\circ$), target outside FOV.
2. **Phase 2: Orbital Transit** — TARGET-SAT-01 moves along its 3D elliptical trajectory.
3. **Phase 3: Autonomous Search** — Gimbal executes an Archimedean spiral search pattern across space.
4. **Phase 4: Satellite Detection** — Optical beacon enters camera FOV; AI vision detects target ($98.5\%$ confidence).
5. **Phase 5: Gimbal Acquisition** — State transitions to `ACQUIRING`; closed-loop PID slews gimbal toward target.
6. **Phase 6: Boresight Centering** — Target moves toward the center reticle crosshair in the Live Camera Feed.
7. **Phase 7: Continuous Tracking** — State becomes `TRACKING` with angular error dropping below $0.5^\circ$.
8. **Phase 8: Disturbance Injection** — Platform vibration ($45\%$) and camera jitter ($35\%$) introduced.
9. **Phase 9: Disturbance Rejection** — PID controller suppresses disturbance oscillations; system re-stabilizes.
10. **Phase 10: Occlusion Event** — Satellite signal dropped (`TARGET_LOST`).
11. **Phase 11: Kalman Coasting** — Kalman Filter maintains velocity prediction (`KALMAN: PREDICTING`).
12. **Phase 12: Reacquisition** — Satellite reappears; target locked immediately with zero overshoot.
13. **Phase 13: Terminal Lock Established** — System enters `LOCKED` state ($\text{Error} < 0.25^\circ$), green tracking ring displayed, optical communications channel established.

---

## 📊 6. Interactive Features for Judges

- **3D Digital Twin View**: Interactive 3D OrbitControls (Rotate, Pan, Zoom) to inspect the satellite and physical 2-axis gimbal assembly.
- **Visual Vector Rays**:
  - Cyan/Amber line: Camera optical boresight.
  - Green line: Line of sight to TARGET-SAT-01.
  - As alignment improves, the lines visibly converge and overlap!
- **Live Camera Feed**: 640×480 synthetic sensor feed with CV bounding box, reticle, raw measurements (red), Kalman filtered target (green diamond), and prediction marker (amber).
- **Disturbance Testing**: Sliders for Platform Vibration, Camera Jitter, Scintillation/Turbulence, Sensor Noise, and Optical Blur.
- **7 Pre-configured Scenarios**: One-click configuration for Normal Tracking, Fast Satellite (2.8x), High Vibration, Turbulence, Target Loss, Multiple Satellites, and Full Stress Test.
- **Telemetry Export**: One-click **`EXPORT CSV`** button downloads timestamped telemetry logs.

---

## 🛰️ 7. Target Satellite Model Specifications (TARGET-SAT-01)
- Main bus cuboid with thermal MLI gold and silver foil insulation.
- Dual 3-segment solar panel arrays with photovoltaic cell grid lines.
- High-Gain Antenna (HGA) parabolic reflector dish with feed horn.
- Free Space Optical Communication (FSOC) optical transmitter head.
- Emissive optical acquisition beacon ($45\text{m}$ radiance distance).
- 4x Reaction Control System (RCS) thruster quad clusters.
