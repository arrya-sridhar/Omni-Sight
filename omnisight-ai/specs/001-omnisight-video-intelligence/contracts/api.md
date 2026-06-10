# API Contract: OmniSight AI

This document defines the HTTP API endpoints exposed by the Python/FastAPI backend core.

## 1. Video Management

### Ingest Video File
Starts the local parallel pipeline for keyframe extraction, object detection, and velocity tracking.
* **Method**: `POST`
* **Path**: `/api/videos/upload`
* **Request Format**: `multipart/form-data`
* **Request Parameters**:
  * `file`: Binary file (MP4, MKV, etc.)
* **Response Status**: `202 Accepted`
* **Response Body**:
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "filename": "highway_traffic.mp4",
    "status": "pending",
    "created_at": "2026-06-10T14:31:00Z"
  }
  ```

### List Videos
Retrieves all processed or processing videos.
* **Method**: `GET`
* **Path**: `/api/videos`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "filename": "highway_traffic.mp4",
      "filepath": "/app/data/videos/highway_traffic.mp4",
      "duration": 120.5,
      "frame_rate": 30.0,
      "width": 1920,
      "height": 1080,
      "status": "completed",
      "created_at": "2026-06-10T14:31:00Z"
    }
  ]
  ```

### Get Video Details
Retrieves details and state of a single video.
* **Method**: `GET`
* **Path**: `/api/videos/{id}`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "filename": "highway_traffic.mp4",
    "filepath": "/app/data/videos/highway_traffic.mp4",
    "duration": 120.5,
    "frame_rate": 30.0,
    "width": 1920,
    "height": 1080,
    "status": "completed",
    "created_at": "2026-06-10T14:31:00Z"
  }
  ```

---

## 2. Zero-Shot Natural Language Search

### Query Keyframes
Search for matching frames across videos using natural language.
* **Method**: `POST`
* **Path**: `/api/search`
* **Request Body**:
  ```json
  {
    "query": "red sports car speeding",
    "video_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    "threshold": 0.25,
    "limit": 10
  }
  ```
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "query": "red sports car speeding",
    "results": [
      {
        "video_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "filename": "highway_traffic.mp4",
        "keyframe_id": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
        "timestamp": 45.2,
        "image_url": "/api/keyframes/8fa85f64-5717-4562-b3fc-2c963f66afa9/image",
        "score": 0.82
      }
    ]
  }
  ```

### Get Keyframe Image
Retrieves the raw binary JPEG image for a keyframe.
* **Method**: `GET`
* **Path**: `/api/keyframes/{id}/image`
* **Response Status**: `200 OK`
* **Headers**:
  * `Content-Type`: `image/jpeg`
* **Response Body**: Binary image data

---

## 3. Object Velocity Tracking

### Get Video Tracks
Retrieves all tracked objects, their trajectories, and velocity stats for a specific video.
* **Method**: `GET`
* **Path**: `/api/videos/{id}/tracks`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "id": "bfd85f64-5717-4562-b3fc-2c963f66afa8",
      "video_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "track_id": 1,
      "label": "car",
      "start_timestamp": 42.0,
      "end_timestamp": 48.5,
      "avg_velocity": 450.2,
      "peak_velocity": 520.1,
      "trajectory": [
        {
          "frame_index": 1260,
          "timestamp": 42.0,
          "bbox": [100, 200, 50, 40],
          "velocity": 430.0
        }
      ]
    }
  ]
  ```
