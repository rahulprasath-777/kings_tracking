class PIDController:
    """
    PID Controller for Azimuth and Elevation Servos
    Includes integral anti-windup clamping and deadband.
    """
    def __init__(self, kp=1.8, ki=0.04, kd=0.12, output_min=-40.0, output_max=40.0, deadband=0.01):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.output_min = output_min
        self.output_max = output_max
        self.deadband = deadband
        self.integral = 0.0
        self.prev_error = 0.0
        self.first_run = True

    def compute(self, error, dt):
        if dt <= 0:
            return 0.0

        if abs(error) < self.deadband:
            error = 0.0

        p_term = self.kp * error

        # Anti-windup
        self.integral += error * dt
        self.integral = max(-10.0, min(10.0, self.integral))
        i_term = self.ki * self.integral

        if not self.first_run:
            d_term = self.kd * ((error - self.prev_error) / dt)
        else:
            d_term = 0.0
            self.first_run = False

        self.prev_error = error
        output = p_term + i_term + d_term
        return max(self.output_min, min(self.output_max, output))

    def reset(self):
        self.integral = 0.0
        self.prev_error = 0.0
        self.first_run = True
