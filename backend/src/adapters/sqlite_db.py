import sqlite3
import os
import json
from typing import List, Dict, Any, Optional
import numpy as np
from src.core.ports import Database

class SQLiteDatabase(Database):
    """SQLite implementation of the Database port."""
    
    def __init__(self, db_path: str = "data/omnisight.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._create_tables()
        
    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn
        
    def _create_tables(self) -> None:
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS videos (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    filepath TEXT NOT NULL,
                    duration REAL,
                    frame_rate REAL,
                    width INTEGER,
                    height INTEGER,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS keyframes (
                    id TEXT PRIMARY KEY,
                    video_id TEXT NOT NULL,
                    frame_index INTEGER NOT NULL,
                    timestamp REAL NOT NULL,
                    embedding BLOB NOT NULL,
                    image_path TEXT NOT NULL,
                    FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tracked_objects (
                    id TEXT PRIMARY KEY,
                    video_id TEXT NOT NULL,
                    track_id INTEGER NOT NULL,
                    label TEXT NOT NULL,
                    start_timestamp REAL NOT NULL,
                    end_timestamp REAL NOT NULL,
                    avg_velocity REAL NOT NULL,
                    peak_velocity REAL NOT NULL,
                    trajectory_json TEXT NOT NULL,
                    FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
                );
            """)
            conn.commit()

    def save_video(self, video: Dict[str, Any]) -> None:
        with self._get_connection() as conn:
            # Check if video already exists to avoid REPLACE delete triggers
            row = conn.execute("SELECT 1 FROM videos WHERE id = ?", (video["id"],)).fetchone()
            if row:
                conn.execute("""
                    UPDATE videos 
                    SET filename = :filename, filepath = :filepath, duration = :duration, 
                        frame_rate = :frame_rate, width = :width, height = :height, 
                        status = :status, created_at = :created_at
                    WHERE id = :id
                """, video)
            else:
                conn.execute("""
                    INSERT INTO videos (id, filename, filepath, duration, frame_rate, width, height, status, created_at)
                    VALUES (:id, :filename, :filepath, :duration, :frame_rate, :width, :height, :status, :created_at)
                """, video)
            conn.commit()

    def get_video(self, video_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
            return dict(row) if row else None

    def list_videos(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM videos ORDER BY created_at DESC").fetchall()
            return [dict(row) for row in rows]

    def save_keyframe(self, keyframe: Dict[str, Any]) -> None:
        # Serialize list of floats to float32 binary blob
        emb_list = keyframe["embedding"]
        emb_blob = np.array(emb_list, dtype=np.float32).tobytes()
        
        db_record = {
            "id": keyframe["id"],
            "video_id": keyframe["video_id"],
            "frame_index": keyframe["frame_index"],
            "timestamp": keyframe["timestamp"],
            "embedding": emb_blob,
            "image_path": keyframe["image_path"]
        }
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO keyframes (id, video_id, frame_index, timestamp, embedding, image_path)
                VALUES (:id, :video_id, :frame_index, :timestamp, :embedding, :image_path)
            """, db_record)
            conn.commit()

    def _deserialize_keyframe(self, row: sqlite3.Row) -> Dict[str, Any]:
        data = dict(row)
        # Deserialize float32 binary blob back to float list
        data["embedding"] = np.frombuffer(row["embedding"], dtype=np.float32).tolist()
        return data

    def get_keyframes(self, video_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM keyframes WHERE video_id = ? ORDER BY timestamp ASC", (video_id,)).fetchall()
            return [self._deserialize_keyframe(row) for row in rows]

    def get_all_keyframes(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM keyframes").fetchall()
            return [self._deserialize_keyframe(row) for row in rows]

    def get_keyframe(self, keyframe_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM keyframes WHERE id = ?", (keyframe_id,)).fetchone()
            return self._deserialize_keyframe(row) if row else None

    def save_tracked_objects(self, tracked_objects: List[Dict[str, Any]]) -> None:
        with self._get_connection() as conn:
            for obj in tracked_objects:
                conn.execute("""
                    INSERT OR REPLACE INTO tracked_objects (id, video_id, track_id, label, start_timestamp, end_timestamp, avg_velocity, peak_velocity, trajectory_json)
                    VALUES (:id, :video_id, :track_id, :label, :start_timestamp, :end_timestamp, :avg_velocity, :peak_velocity, :trajectory_json)
                """, obj)
            conn.commit()

    def get_tracked_objects(self, video_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM tracked_objects WHERE video_id = ?", (video_id,)).fetchall()
            return [dict(row) for row in rows]
