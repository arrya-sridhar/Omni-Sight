import os
import shutil
import uuid
import logging
import json
import cv2
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from src.adapters.sqlite_db import SQLiteDatabase
from src.adapters.sentence_transformer_clip import SentenceTransformerCLIP
from src.adapters.cv2_reader import CV2VideoReader
from src.adapters.yolo_tracker import YOLOTracker
from src.core.extractor import KeyFrameExtractor
from src.core.velocity import VelocityCalculator
from src.core.search import SearchService

logger = logging.getLogger("omnisight-routes")
router = APIRouter()

# Dependency providers with lazy loading for CLIP
db_instance = None
model_instance = None
tracker_instance = None
reader_instance = None

def get_db() -> SQLiteDatabase:
    global db_instance
    if db_instance is None:
        db_instance = SQLiteDatabase()
    return db_instance

def get_model() -> SentenceTransformerCLIP:
    global model_instance
    if model_instance is None:
        logger.info("Initializing SentenceTransformers CLIP model (clip-ViT-B-32)...")
        model_instance = SentenceTransformerCLIP()
    return model_instance

def get_tracker() -> YOLOTracker:
    global tracker_instance
    if tracker_instance is None:
        logger.info("Initializing YOLOv8 Tracker (yolov8n.pt)...")
        tracker_instance = YOLOTracker()
    return tracker_instance

def get_reader() -> CV2VideoReader:
    global reader_instance
    if reader_instance is None:
        reader_instance = CV2VideoReader()
    return reader_instance

def get_search_service(
    db: SQLiteDatabase = Depends(get_db), 
    model: SentenceTransformerCLIP = Depends(get_model)
) -> SearchService:
    return SearchService(db, model)


# Request and Response schemas
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    video_ids: Optional[List[str]] = Field(default=None, description="Optional list of video IDs to filter by")
    threshold: float = Field(default=0.2, ge=0.0, le=1.0, description="Cosine similarity threshold")
    limit: int = Field(default=10, ge=1, description="Max search results to return")

class SearchResultItem(BaseModel):
    video_id: str
    filename: str
    keyframe_id: str
    timestamp: float
    image_url: str
    score: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]


# ----------------- Background Video Processing Pipeline -----------------

def process_video_background(
    video_id: str, 
    filepath: str, 
    db_path: str,
    model_name: str,
    tracker_model: str
):
    """Executes the extraction and object tracking pipeline in a separate thread."""
    logger.info(f"Starting background processing for video {video_id} ({filepath})")
    
    # Instantiate clean adapters for this background thread
    db = SQLiteDatabase(db_path)
    reader = CV2VideoReader()
    
    video_record = db.get_video(video_id)
    if not video_record:
        logger.error(f"Video {video_id} not found in database for background processing")
        return
        
    try:
        # 1. Update status to processing and populate metadata
        metadata = reader.get_metadata(filepath)
        video_record.update({
            "status": "processing",
            "duration": metadata["duration"],
            "frame_rate": metadata["frame_rate"],
            "width": metadata["width"],
            "height": metadata["height"]
        })
        db.save_video(video_record)
        
        # Reuse global model instances to avoid loading multiple copies into memory
        model = get_model()
        tracker = get_tracker()
        extractor = KeyFrameExtractor(threshold=12.0)
        
        # Limit PyTorch threads to reduce memory footprint on Render
        import torch
        torch.set_num_threads(1)
        
        tracker.reset()
        extractor.reset()
        
        keyframes_dir = os.path.join(os.path.dirname(db_path), "keyframes")
        os.makedirs(keyframes_dir, exist_ok=True)
        
        # 2. Iterate frames sequentially (Decoupled extraction)
        logger.info("Entering frame processing loop...")
        frame_count = 0
        for frame_index, timestamp, frame in reader.read_frames(filepath):
            frame_count += 1
            # Run Object Tracking on every frame to maintain track IDs
            active_tracks = tracker.track_frame(frame, frame_index, timestamp)
            
            # Check if this frame is a Keyframe
            is_kf, diff = extractor.process_frame(frame, frame_index, timestamp)
            if is_kf:
                kf_id = str(uuid.uuid4())
                kf_img_path = os.path.join(keyframes_dir, f"{kf_id}.jpg")
                
                # Save frame image as JPEG file
                cv2.imwrite(kf_img_path, frame)
                
                # Generate zero-shot vector embedding
                embedding = model.get_image_embeddings([frame])[0]
                
                # Persist keyframe record
                logger.info(f"Saving keyframe: index={frame_index}, time={timestamp:.2f}, path={kf_img_path}")
                db.save_keyframe({
                    "id": kf_id,
                    "video_id": video_id,
                    "frame_index": frame_index,
                    "timestamp": timestamp,
                    "embedding": embedding,
                    "image_path": kf_img_path
                })
        logger.info(f"Finished frame processing loop. Total frames processed: {frame_count}")
                
        # 3. Compile final tracked trajectories
        compiled_tracks = VelocityCalculator.compile_history(tracker.tracker, video_id)
        db.save_tracked_objects(compiled_tracks)
        
        # 4. Finalize video record
        video_record["status"] = "completed"
        db.save_video(video_record)
        logger.info(f"Successfully finished background processing for video {video_id}")
        
    except Exception as e:
        logger.error(f"Failed background processing for video {video_id}: {str(e)}", exc_info=True)
        video_record["status"] = "failed"
        video_record["error_message"] = str(e)
        db.save_video(video_record)

# ----------------- Client-Side Keyframe Upload (Cloud Fast Path) -----------------

@router.post("/videos/upload/keyframes", status_code=status.HTTP_202_ACCEPTED)
async def upload_keyframes(
    background_tasks: BackgroundTasks,
    filename: str = Form(...),
    duration: float = Form(0.0),
    width: int = Form(0),
    height: int = Form(0),
    timestamps: str = Form("[]"),
    files: List[UploadFile] = File(...),
    db: SQLiteDatabase = Depends(get_db)
):
    """
    Receives pre-extracted keyframe images from the browser.
    Runs CLIP embedding only — no YOLO tracking (that requires the full video).
    This is the fast path for cloud deployments.
    """
    import datetime
    
    video_id = str(uuid.uuid4())
    keyframes_dir = os.path.join("data", "keyframes")
    os.makedirs(keyframes_dir, exist_ok=True)
    
    # Parse timestamps
    try:
        ts_list = json.loads(timestamps)
    except Exception:
        ts_list = [i * 1.0 for i in range(len(files))]
    
    # Create video record
    video_record = {
        "id": video_id,
        "filename": filename,
        "filepath": "",  # No video file stored for cloud uploads
        "duration": duration,
        "frame_rate": 1.0,
        "width": width,
        "height": height,
        "status": "processing",
        "created_at": datetime.datetime.now().isoformat()
    }
    db.save_video(video_record)
    
    # Read all file data eagerly (before background task, since UploadFile is not available later)
    files_data = []
    for f in files:
        data = await f.read()
        files_data.append((f.filename or f"keyframe_{len(files_data)}.jpg", data))
    
    # Process in background to return fast
    background_tasks.add_task(
        process_keyframes_background,
        video_id=video_id,
        files_data=files_data,
        ts_list=ts_list,
        db_path=db.db_path,
        keyframes_dir=keyframes_dir
    )
    
    return {
        "id": video_id,
        "filename": filename,
        "status": "processing"
    }


def process_keyframes_background(
    video_id: str,
    files_data: list,
    ts_list: list,
    db_path: str,
    keyframes_dir: str
):
    """Process pre-extracted keyframes: save images and compute CLIP embeddings."""
    import numpy as np
    
    logger.info(f"Processing {len(files_data)} client-extracted keyframes for video {video_id}")
    db = SQLiteDatabase(db_path)
    
    try:
        model = get_model()
        
        import torch
        torch.set_num_threads(1)
        
        for i, (fname, data) in enumerate(files_data):
            kf_id = str(uuid.uuid4())
            kf_img_path = os.path.join(keyframes_dir, f"{kf_id}.jpg")
            
            # Save keyframe image
            with open(kf_img_path, "wb") as f:
                f.write(data)
            
            # Decode for CLIP embedding
            np_arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is None:
                logger.warning(f"Failed to decode keyframe {i}")
                continue
            
            # Generate CLIP embedding
            embedding = model.get_image_embeddings([frame])[0]
            
            timestamp = ts_list[i] if i < len(ts_list) else float(i)
            
            db.save_keyframe({
                "id": kf_id,
                "video_id": video_id,
                "frame_index": i,
                "timestamp": timestamp,
                "embedding": embedding,
                "image_path": kf_img_path
            })
            logger.info(f"Saved keyframe {i+1}/{len(files_data)} at t={timestamp:.1f}s")
        
        # Mark video as completed
        video_record = db.get_video(video_id)
        if video_record:
            video_record["status"] = "completed"
            db.save_video(video_record)
        
        logger.info(f"Successfully processed all keyframes for video {video_id}")
        
    except Exception as e:
        logger.error(f"Failed keyframe processing for {video_id}: {str(e)}", exc_info=True)
        video_record = db.get_video(video_id)
        if video_record:
            video_record["status"] = "failed"
            video_record["error_message"] = str(e)
            db.save_video(video_record)

# ----------------- Chunked File Upload API -----------------

@router.post("/videos/upload/init", status_code=status.HTTP_200_OK)
async def upload_init():
    upload_id = str(uuid.uuid4())
    chunks_dir = os.path.join("uploads", f"{upload_id}_chunks")
    os.makedirs(chunks_dir, exist_ok=True)
    return {"upload_id": upload_id}

@router.post("/videos/upload/chunk", status_code=status.HTTP_200_OK)
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    file: UploadFile = File(...)
):
    chunks_dir = os.path.join("uploads", f"{upload_id}_chunks")
    os.makedirs(chunks_dir, exist_ok=True)
    
    # Write each chunk to its own numbered file (safe for parallel uploads)
    chunk_path = os.path.join(chunks_dir, f"{chunk_index:06d}")
    with open(chunk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"status": "ok", "chunk_index": chunk_index}

@router.post("/videos/upload/finalize", status_code=status.HTTP_202_ACCEPTED)
async def upload_finalize(
    background_tasks: BackgroundTasks,
    upload_id: str = Form(...),
    filename: str = Form(...),
    db: SQLiteDatabase = Depends(get_db)
):
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    chunks_dir = os.path.join(uploads_dir, f"{upload_id}_chunks")
    
    if not os.path.isdir(chunks_dir):
        raise HTTPException(status_code=404, detail="Upload chunks not found.")
    
    # Reassemble chunks in order into final file
    final_filepath = os.path.join(uploads_dir, f"{upload_id}_{filename}")
    chunk_files = sorted(os.listdir(chunks_dir))
    
    with open(final_filepath, "wb") as outfile:
        for cf in chunk_files:
            chunk_path = os.path.join(chunks_dir, cf)
            with open(chunk_path, "rb") as infile:
                shutil.copyfileobj(infile, outfile)
    
    # Clean up chunk directory
    shutil.rmtree(chunks_dir, ignore_errors=True)
    
    # Create initial pending video record
    import datetime
    video_record = {
        "id": upload_id,
        "filename": filename,
        "filepath": final_filepath,
        "duration": 0.0,
        "frame_rate": 0.0,
        "width": 0,
        "height": 0,
        "status": "pending",
        "created_at": datetime.datetime.now().isoformat()
    }
    db.save_video(video_record)
    
    # Trigger parallel background task thread
    background_tasks.add_task(
        process_video_background,
        video_id=upload_id,
        filepath=final_filepath,
        db_path=db.db_path,
        model_name="clip-ViT-B-32",
        tracker_model="yolov8n.pt"
    )
    
    return {
        "id": upload_id,
        "filename": filename,
        "status": "pending"
    }

# ----------------- Legacy HTTP Endpoints -----------------

@router.post("/videos/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: SQLiteDatabase = Depends(get_db)
):
    logger.info(f"Received file upload: {file.filename}")
    video_id = str(uuid.uuid4())
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    
    filepath = os.path.join(uploads_dir, f"{video_id}_{file.filename}")
    
    # Save uploaded file to disk
    logger.info(f"Saving file to disk: {filepath}")
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    logger.info(f"File saved to disk successfully.")
        
    # Create initial pending video record
    logger.info("Saving initial video record to DB")
    video_record = {
        "id": video_id,
        "filename": file.filename,
        "filepath": filepath,
        "duration": 0.0,
        "frame_rate": 0.0,
        "width": 0,
        "height": 0,
        "status": "pending"
    }
    # Add real timestamp
    import datetime
    video_record["created_at"] = datetime.datetime.now().isoformat()
    db.save_video(video_record)
    
    # Trigger parallel background task thread
    logger.info("Adding background task")
    background_tasks.add_task(
        process_video_background,
        video_id=video_id,
        filepath=filepath,
        db_path=db.db_path,
        model_name="clip-ViT-B-32",
        tracker_model="yolov8n.pt"
    )
    
    logger.info("Returning accepted response")
    
    return {
        "id": video_id,
        "filename": file.filename,
        "status": "pending"
    }

@router.get("/videos/{id}/source", status_code=status.HTTP_200_OK)
async def get_video_source(id: str, db: SQLiteDatabase = Depends(get_db)):
    video = db.get_video(id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        
    filepath = video["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source video file not found")
        
    return FileResponse(filepath, media_type="video/mp4")

@router.post("/search", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search_keyframes(
    req: SearchRequest, 
    search_service: SearchService = Depends(get_search_service)
):
    try:
        results = search_service.search(
            query=req.query,
            video_ids=req.video_ids,
            threshold=req.threshold,
            limit=req.limit
        )
        return SearchResponse(query=req.query, results=results)
    except Exception as e:
        logger.error(f"Search failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed due to internal error: {str(e)}"
        )

@router.get("/keyframes/{id}/image", status_code=status.HTTP_200_OK)
async def get_keyframe_image(id: str, db: SQLiteDatabase = Depends(get_db)):
    kf = db.get_keyframe(id)
    if not kf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Keyframe with ID {id} not found"
        )
        
    image_path = kf["image_path"]
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Keyframe image file at {image_path} does not exist"
        )
        
    return FileResponse(image_path, media_type="image/jpeg")

@router.get("/videos", status_code=status.HTTP_200_OK)
async def list_videos(db: SQLiteDatabase = Depends(get_db)):
    return db.list_videos()

@router.get("/videos/{id}", status_code=status.HTTP_200_OK)
async def get_video(id: str, db: SQLiteDatabase = Depends(get_db)):
    video = db.get_video(id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    return video

@router.get("/videos/{id}/tracks", status_code=status.HTTP_200_OK)
async def get_video_tracks(id: str, db: SQLiteDatabase = Depends(get_db)):
    tracks = db.get_tracked_objects(id)
    results = []
    for track in tracks:
        track_dict = dict(track)
        try:
            track_dict["trajectory"] = json.loads(track_dict["trajectory_json"])
        except Exception:
            track_dict["trajectory"] = []
        if "trajectory_json" in track_dict:
            del track_dict["trajectory_json"]
        results.append(track_dict)
    return results
