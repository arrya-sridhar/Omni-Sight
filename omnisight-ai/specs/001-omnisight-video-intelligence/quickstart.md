# Quickstart & Verification Guide: OmniSight AI

This guide describes how to run and verify the OmniSight AI multi-modal video intelligence system end-to-end in a local-first environment.

## Prerequisites

- **Python**: Version `3.11+`
- **Node.js**: Version `18+`
- **Package Managers**: `uv` or `pip` for Python, `npm` for frontend
- **Network State**: Fully offline (air-gapped) testing must pass.

---

## 1. Backend Setup & Run

### Environment Setup
Create a virtual environment and install the required dependencies:
```bash
# From repository root
cd backend
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Start Backend Service
Start the FastAPI backend server on port 8000:
```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000
```

---

## 2. Frontend Setup & Run

### Install Dependencies
Initialize and install required Node modules:
```bash
# From repository root
cd frontend
npm install
```

### Start Frontend Server
Launch the React development server:
```bash
npm run dev
```
Open a browser and navigate to the local address displayed (usually `http://localhost:5173`).

---

## 3. Automated Validation

Run the test suite offline to verify that no external network calls are made:
```bash
# From backend directory
pytest tests/
```

Expected outputs:
- Standard unit tests: Green (100% pass)
- Ingestion pipeline simulation: Green
- Cosine similarity matching: Green

---

## 4. Manual End-to-End Verification Scenarios

### Scenario 1: Video Upload & Key Frame Extraction
1. Open the OmniSight AI dashboard (`http://localhost:5173`).
2. Click **Upload Video** and select a sample MP4/MKV traffic or surveillance file.
3. Observe the progress bar transition from *Uploading* to *Processing* to *Indexed*.
4. Verify that the UI displays a gallery of extracted key frames representing distinct scene events, indicating that redundant frames were successfully skipped.

### Scenario 2: Zero-Shot Search Queries
1. On the search bar, type a natural language query representing an object or event in the video (e.g., `"white SUV moving to the left"` or `"person carrying a bag"`).
2. Click **Search**.
3. Verify that:
   - Results return in under 200ms.
   - Matching keyframe thumbnails are displayed with cosine similarity confidence scores.
   - Clicking a keyframe navigates to the exact timestamp in the video player.

### Scenario 3: Object Velocity Tracking
1. Navigate to the **Velocity Tracking** tab for the ingested video.
2. Verify that bounding boxes appear overlaid on the video player tracking moving vehicles/pedestrians with persistent IDs.
3. Verify that a graph or table lists the velocities (in pixels/second) of each object.
4. Set a speed threshold of `100 pixels/second` in the interface and check if speed alerts are highlighted.
