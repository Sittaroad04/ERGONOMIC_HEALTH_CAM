import base64
import cv2
import numpy as np

try:
    import mediapipe as mp
except ImportError:  # Development fallback keeps the API runnable without native MediaPipe.
    mp = None


class PoseDetector:
    def __init__(self):
        self.pose = mp.solutions.pose.Pose(static_image_mode=False, model_complexity=0) if mp else None
        self.last_selected_side: str | None = None

    def detect(self, image_data: str | None, view: str = "side") -> dict[str, tuple[float, float]] | None:
        self.last_selected_side = None
        if not self.pose or not image_data:
            return None
        try:
            raw = base64.b64decode(image_data.split(",")[-1])
            frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
            result = self.pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if not result.pose_landmarks:
                return None
            points = result.pose_landmarks.landmark
            side_indices = {
                "left": {"ear": 7, "shoulder": 11, "elbow": 13, "wrist": 15, "hip": 23, "knee": 25, "ankle": 27},
                "right": {"ear": 8, "shoulder": 12, "elbow": 14, "wrist": 16, "hip": 24, "knee": 26, "ankle": 28},
            }
            if view == "back":
                back_indices = {
                    "left_shoulder": 11,
                    "right_shoulder": 12,
                    "left_elbow": 13,
                    "right_elbow": 14,
                    "left_wrist": 15,
                    "right_wrist": 16,
                    "left_hip": 23,
                    "right_hip": 24,
                }
                visible = [points[index].visibility for index in back_indices.values()]
                if sum(visible) / len(visible) < 0.1:
                    return None
                self.last_selected_side = "back"
                return {
                    name: (points[index].x, points[index].y)
                    for name, index in back_indices.items()
                    if points[index].visibility >= 0.1
                }
            visibility = {
                side: sum(points[index].visibility for index in indices.values()) / len(indices)
                for side, indices in side_indices.items()
            }
            selected = max(visibility, key=visibility.get)
            if visibility[selected] < 0.1:
                return None
            self.last_selected_side = selected
            return {
                name: (points[index].x, points[index].y)
                for name, index in side_indices[selected].items()
                if points[index].visibility >= 0.1
            }
        except (ValueError, IndexError, cv2.error):
            return None
