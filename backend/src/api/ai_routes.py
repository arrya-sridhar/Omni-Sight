import httpx
import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

logger = logging.getLogger("omnisight-ai-routes")
router = APIRouter()

class AIChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    use_online: bool = False
    api_key: Optional[str] = ""

class AIChatResponse(BaseModel):
    reply: str
    provider: str

@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(req: AIChatRequest):
    try:
        if req.use_online:
            # Simple BYOK approach using Gemini API as an example, or standard OpenAI
            # We'll use Gemini REST API if the key looks like Gemini (just random chars)
            # or we can use OpenAI if they specify. Let's default to OpenAI for simplicity
            if not req.api_key:
                raise HTTPException(status_code=400, detail="API key required for Online BYOK mode.")
            
            # Here we assume a Gemini API structure just as a generic example
            # or OpenAI structure
            # Let's try OpenAI standard
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {req.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": "You are a helpful AI assistant for OmniSight Video Intelligence."},
                            {"role": "user", "content": req.query}
                        ]
                    },
                    timeout=15.0
                )
                if resp.status_code != 200:
                    raise Exception(f"Online API Error: {resp.text}")
                
                data = resp.json()
                reply = data["choices"][0]["message"]["content"]
                return AIChatResponse(reply=reply, provider="online_byok")
        else:
            # Local Ollama
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "llama3",  # or any default local model
                        "prompt": f"You are OmniSight AI Video Assistant. User asks: {req.query}",
                        "stream": False
                    },
                    timeout=30.0
                )
                if resp.status_code != 200:
                    raise Exception(f"Ollama Error: {resp.text}")
                
                data = resp.json()
                return AIChatResponse(reply=data["response"], provider="local_ollama")

    except Exception as e:
        logger.error(f"AI Chat failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Service error: {str(e)}"
        )
