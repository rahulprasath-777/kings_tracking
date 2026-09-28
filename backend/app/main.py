import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .tracking.kalman import KalmanFilter2D
from .control.pid import PIDController
from .detection.detector import SatelliteDetector

app = FastAPI(
    title="ISRO FSOC Terminal Virtual Camera Tracking Backend",
    version="1.0.0",
    description="Backend service providing OpenCV vision detection, Kalman state estimation, and dual-axis PID gimbal control for satellite coarse alignment."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

kalman = KalmanFilter2D(process_noise=0.5, measurement_noise=2.0)
pan_pid = PIDController(kp=1.8, ki=0.04, kd=0.12)
tilt_pid = PIDController(kp=1.8, ki=0.04, kd=0.12)
detector = SatelliteDetector(mode="hsv")

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "system": "ISRO FSOC Virtual Camera Tracking Terminal",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "HEALTHY", "kalman": "INITIALIZED", "pid": "READY"}

@app.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
    """
    WebSocket endpoint for bidirectional real-time telemetry and gimbal control commands
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            # Extract client state
            msg_type = payload.get("type", "update")
            if msg_type == "tracking_step":
                pan_err = payload.get("pan_error", 0.0)
                tilt_err = payload.get("tilt_error", 0.0)
                dt = payload.get("dt", 0.016)

                # Compute control output
                cmd_pan_vel = pan_pid.compute(pan_err, dt)
                cmd_tilt_vel = tilt_pid.compute(tilt_err, dt)

                response = {
                    "type": "control_output",
                    "cmd_pan_vel": cmd_pan_vel,
                    "cmd_tilt_vel": cmd_tilt_vel,
                    "kalman_state": kalman.x.tolist()
                }
                await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        pass
