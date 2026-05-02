from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.ocr_engine import extract_text_from_url, clean_text
from core.langchain_pipeline import summarize_legal_document

router = APIRouter()

# ─── Request Model ────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    cloudinary_url: str
    file_type: str
    language: str = "ne"
    document_id: Optional[str] = None
    category: Optional[str] = None

# ─── Summarize Endpoint ───────────────────────────────────────
@router.post("")
async def summarize_document(request: SummarizeRequest):
    try:
        # Validate file type
        if request.file_type not in ["pdf", "jpg", "jpeg", "png", "webp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Supported: pdf, jpg, jpeg, png, webp",
            )

        # Step 1 — OCR: Extract text from Cloudinary URL
        print(f"📄 Extracting text from {request.file_type} document...")
        raw_text = await extract_text_from_url(
            cloudinary_url=request.cloudinary_url,
            file_type=request.file_type,
            language=request.language,
        )

        cleaned_text = clean_text(raw_text)

        if not cleaned_text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from document. The file may be empty or unreadable.",
            )

        print(f"Extracted {len(cleaned_text)} characters.")

        # Step 2 — RAG + Gemini: Summarize and analyze
        print(f"🤖 Analyzing document with Gemini...")
        result = await summarize_legal_document(
            extracted_text=cleaned_text,
            language=request.language,
            category=request.category,
        )

        print(f"Analysis complete.")

        return {
            "success": True,
            "document_id": request.document_id,
            "extracted_text": cleaned_text,
            "summary": result.get("summary", ""),
            "rights": result.get("rights", []),
            "next_steps": result.get("next_steps", []),
            "laws_cited": result.get("laws_cited", []),
            "risk_level": result.get("risk_level", "Low"),
            "category": result.get("category", "Other"),
            "language": request.language,
            "character_count": len(cleaned_text),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Summarize endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Document summarization failed. Please try again.",
        )