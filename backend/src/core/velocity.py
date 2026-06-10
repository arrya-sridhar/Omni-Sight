import uuid
import numpy as np
import json
from typing import List, Dict, Any, Tuple

class CentroidTracker:
    """Core tracking service matching centroids across video frames and computing velocities."""
    
    def __init__(self, max_disappeared: int = 5, max_distance: float = 100.0):
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
        self.next_track_id = 1
        
        # Track states: track_id -> values
        self.objects: Dict[int, Tuple[float, float]] = {} # track_id -> (cx, cy)
        self.disappeared: Dict[int, int] = {} # track_id -> frames_missed
        self.labels: Dict[int, str] = {} # track_id -> label
        self.last_timestamps: Dict[int, float] = {} # track_id -> last_timestamp
        
        # Trajectories for historical log: track_id -> list of details
        self.trajectories: Dict[int, List[Dict[str, Any]]] = {}
        self.peak_velocities: Dict[int, float] = {}
        self.velocities: Dict[int, List[float]] = {}
        
    def _register(self, centroid: Tuple[float, float], label: str, timestamp: float, bbox: List[float], frame_index: int):
        track_id = self.next_track_id
        self.objects[track_id] = centroid
        self.disappeared[track_id] = 0
        self.labels[track_id] = label
        self.last_timestamps[track_id] = timestamp
        self.next_track_id += 1
        
        self.trajectories[track_id] = [{
            "frame_index": frame_index,
            "timestamp": timestamp,
            "bbox": bbox,
            "velocity": 0.0
        }]
        self.peak_velocities[track_id] = 0.0
        self.velocities[track_id] = [0.0]
        return track_id

    def _deregister(self, track_id: int):
        del self.objects[track_id]
        del self.disappeared[track_id]
        del self.labels[track_id]
        del self.last_timestamps[track_id]

    def update(self, rects: List[Dict[str, Any]], frame_index: int, timestamp: float) -> List[Dict[str, Any]]:
        """
        rects is list of dicts: {"bbox": [x, y, w, h], "label": str, "confidence": float}
        Returns list of active tracks in the current frame:
          {"track_id": int, "label": str, "bbox": [x, y, w, h], "velocity": float}
        """
        if not rects:
            # All active objects disappeared in this frame
            for track_id in list(self.objects.keys()):
                self.disappeared[track_id] += 1
                if self.disappeared[track_id] > self.max_disappeared:
                    self._deregister(track_id)
            return []

        # Convert bboxes to centroids
        input_centroids = np.zeros((len(rects), 2), dtype="float32")
        for i, rect in enumerate(rects):
            x, y, w, h = rect["bbox"]
            input_centroids[i] = (x + w / 2.0, y + h / 2.0)

        # If no objects are currently tracked, register all input centroids
        if len(self.objects) == 0:
            for i in range(len(input_centroids)):
                self._register(
                    centroid=tuple(input_centroids[i]),
                    label=rects[i]["label"],
                    timestamp=timestamp,
                    bbox=rects[i]["bbox"],
                    frame_index=frame_index
                )
        else:
            # Grab track IDs and corresponding centroids
            track_ids = list(self.objects.keys())
            object_centroids = np.array(list(self.objects.values()))

            # Compute pairwise Euclidean distances
            D = np.linalg.norm(object_centroids[:, np.newaxis] - input_centroids, axis=2)

            # Sort rows by smallest distance, then cols
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for row, col in zip(rows, cols):
                if row in used_rows or col in used_cols:
                    continue

                # Ignore match if distance is too far
                if D[row, col] > self.max_distance:
                    continue

                track_id = track_ids[row]
                new_centroid = tuple(input_centroids[col])
                old_centroid = self.objects[track_id]
                
                # Calculate velocity
                dt = timestamp - self.last_timestamps[track_id]
                if dt <= 0:
                    velocity = 0.0
                else:
                    displacement = np.linalg.norm(np.array(new_centroid) - np.array(old_centroid))
                    velocity = float(displacement / dt)
                
                self.objects[track_id] = new_centroid
                self.disappeared[track_id] = 0
                self.last_timestamps[track_id] = timestamp
                
                # Record trajectory and velocity stats
                self.velocities[track_id].append(velocity)
                if velocity > self.peak_velocities[track_id]:
                    self.peak_velocities[track_id] = velocity
                    
                self.trajectories[track_id].append({
                    "frame_index": frame_index,
                    "timestamp": timestamp,
                    "bbox": rects[col]["bbox"],
                    "velocity": velocity
                })

                used_rows.add(row)
                used_cols.add(col)

            # Deregister or increment disappeared count for unmatched objects
            unused_rows = set(range(len(object_centroids))).difference(used_rows)
            for row in unused_rows:
                track_id = track_ids[row]
                self.disappeared[track_id] += 1
                if self.disappeared[track_id] > self.max_disappeared:
                    self._deregister(track_id)

            # Register unmatched new objects
            unused_cols = set(range(len(input_centroids))).difference(used_cols)
            for col in unused_cols:
                self._register(
                    centroid=tuple(input_centroids[col]),
                    label=rects[col]["label"],
                    timestamp=timestamp,
                    bbox=rects[col]["bbox"],
                    frame_index=frame_index
                )

        # Build list of active tracks in this frame
        active_tracks = []
        for track_id in self.objects.keys():
            last_traj = self.trajectories[track_id][-1]
            active_tracks.append({
                "track_id": track_id,
                "label": self.labels[track_id],
                "bbox": last_traj["bbox"],
                "velocity": last_traj["velocity"]
            })
        return active_tracks

class VelocityCalculator:
    """Helper to structure tracked objects history for database saving."""
    @staticmethod
    def compile_history(tracker: CentroidTracker, video_id: str) -> List[Dict[str, Any]]:
        compiled = []
        for track_id in tracker.trajectories.keys():
            # If the object disappeared, it might have been deregistered from self.objects,
            # but its trajectory remains in tracker.trajectories.
            traj = tracker.trajectories[track_id]
            vels = tracker.velocities[track_id]
            avg_vel = float(np.mean(vels)) if vels else 0.0
            peak_vel = tracker.peak_velocities[track_id]
            
            compiled.append({
                "id": str(uuid.uuid4()),
                "video_id": video_id,
                "track_id": track_id,
                "label": tracker.labels.get(track_id, "unknown"),
                "start_timestamp": traj[0]["timestamp"],
                "end_timestamp": traj[-1]["timestamp"],
                "avg_velocity": avg_vel,
                "peak_velocity": peak_vel,
                "trajectory_json": json.dumps(traj)
            })
        return compiled
