import logging
import time
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as api_router

# Configure logging structure
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("omnisight-main")

app = FastAPI(
    title="OmniSight AI API",
    description="Multi-modal video intelligence system with keyframe extraction, tracking, and zero-shot search.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 5173 and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global logging & performance middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"Request completed: {request.method} {request.url.path} - Status: {response.status_code} - In {process_time:.2f}ms")
        return response
    except Exception as exc:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"Request failed: {request.method} {request.url.path} - Exception: {str(exc)} - In {process_time:.2f}ms")
        raise exc

# Global error exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again later."}
    )

# Baseline Healthcheck Endpoint
@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "omnisight-ai"
    }

# Include API routes
from src.api.ai_routes import router as ai_router
app.include_router(api_router, prefix="/api")
app.include_router(ai_router, prefix="/api/ai")
