import cv2
import numpy as np

class SatelliteDetector:
    """
    Computer Vision Target Detector
    Supports:
    1. HSV optical beacon / laser spot color detection
    2. Contour extraction and centroid calculation
    3. Extensible hook for YOLOv8/ONNX model inference
    """
    def __init__(self, mode="hsv"):
        self.mode = mode
        # Green / Cyan beacon HSV threshold range
        self.lower_hsv = np.array([35, 80, 80])
        self.upper_hsv = np.array([95, 255, 255])

    def detect(self, frame_bgr):
        """
        Process frame and detect satellite target
        Returns:
            dict: { 'detected': bool, 'x': float, 'y': float, 'bbox': [x, y, w, h], 'confidence': float }
        """
        if frame_bgr is None:
            return {"detected": False, "x": 0, "y": 0, "bbox": None, "confidence": 0.0}

        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self.lower_hsv, self.upper_hsv)

        # Morphological opening to remove salt & pepper noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {"detected": False, "x": 0, "y": 0, "bbox": None, "confidence": 0.0}

        # Largest contour
        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)

        if area < 10:
            return {"detected": False, "x": 0, "y": 0, "bbox": None, "confidence": 0.0}

        M = cv2.moments(c)
        if M["m00"] == 0:
            return {"detected": False, "x": 0, "y": 0, "bbox": None, "confidence": 0.0}

        cx = float(M["m10"] / M["m00"])
        cy = float(M["m01"] / M["m00"])
        x, y, w, h = cv2.boundingRect(c)

        # Confidence heuristic from circularity & area
        perimeter = cv2.arcLength(c, True)
        circularity = 4 * np.pi * (area / (perimeter * perimeter)) if perimeter > 0 else 0
        confidence = min(99.5, max(60.0, circularity * 100))

        return {
            "detected": True,
            "x": cx,
            "y": cy,
            "bbox": [int(x), int(y), int(w), int(h)],
            "confidence": float(confidence)
        }
