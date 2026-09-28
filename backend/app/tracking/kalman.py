import numpy as np

class KalmanFilter2D:
    """
    2D Constant Velocity Kalman Filter
    State: [x, y, vx, vy]^T
    Measurement: [x, y]^T
    """
    def __init__(self, process_noise=0.5, measurement_noise=2.0):
        self.q = process_noise
        self.r = measurement_noise
        self.x = np.zeros(4)
        self.P = np.eye(4) * 10.0
        self.initialized = False
        self.predict_count = 0

    def init(self, x, y):
        self.x = np.array([x, y, 0.0, 0.0])
        self.P = np.diag([1.0, 1.0, 10.0, 10.0])
        self.initialized = True
        self.predict_count = 0

    def predict(self, dt=0.016):
        if not self.initialized:
            return self.x

        F = np.array([
            [1.0, 0.0, dt,  0.0],
            [0.0, 1.0, 0.0, dt ],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ])

        dt2 = dt * dt
        dt3 = (dt2 * dt) / 2.0
        dt4 = (dt2 * dt2) / 4.0
        q = self.q

        Q = np.array([
            [dt4 * q, 0.0,     dt3 * q, 0.0    ],
            [0.0,     dt4 * q, 0.0,     dt3 * q],
            [dt3 * q, 0.0,     dt2 * q, 0.0    ],
            [0.0,     dt3 * q, 0.0,     dt2 * q]
        ])

        self.x = F @ self.x
        self.P = F @ self.P @ F.T + Q
        self.predict_count += 1
        return self.x

    def update(self, zx, zy):
        if not self.initialized:
            self.init(zx, zy)
            return self.x

        z = np.array([zx, zy])
        H = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ])
        R = np.eye(2) * self.r

        y = z - (H @ self.x)
        S = H @ self.P @ H.T + R
        K = self.P @ H.T @ np.linalg.inv(S)

        self.x = self.x + K @ y
        I = np.eye(4)
        self.P = (I - K @ H) @ self.P
        self.predict_count = 0
        return self.x
