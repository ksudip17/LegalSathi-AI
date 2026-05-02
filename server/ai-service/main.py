from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.legal_check import router as legal_check_router
import os

# Load environment variables
load_dotenv()

# Import routes
from routes.ocr import router as ocr_router
from routes.rag import router as rag_router
from routes.summarize import router as summarize_router

app = FastAPI(
    title="LegalSaathi AI Service",
    description="AI microservice for OCR, RAG, and legal document summarization",
    version="1.0.0",
)

@app.head("/")
async def head_root():
    return JSONResponse(content={})

# ─── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────
app.include_router(ocr_router, prefix="/ocr", tags=["OCR"])
app.include_router(rag_router, prefix="/rag", tags=["RAG"])
app.include_router(summarize_router, prefix="/summarize", tags=["Summarize"])
app.include_router(legal_check_router, prefix="/legal-check", tags=["Legal Check"])

# ─── Health Check ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "LegalSaathi AI Service is running 🇳🇵",
        "version": "1.0.0",
        "endpoints": {
            "ocr": "/ocr/extract",
            "rag_ask": "/rag/ask",
            "rag_rights": "/rag/rights",
            "rag_search": "/rag/search",
            "summarize": "/summarize",
        },
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}