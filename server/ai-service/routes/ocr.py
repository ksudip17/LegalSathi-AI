from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.ocr_engine import extract_text_from_url, clean_text

router = APIRouter()

# ─── Request Model ────────────────────────────────────────────
class OCRRequest(BaseModel):
    cloudinary_url: str
    file_type: str
    language: str = "ne"

# ─── Response Model ───────────────────────────────────────────
class OCRResponse(BaseModel):
    success: bool
    extracted_text: str
    character_count: int
    language: str

# ─── Extract Text Endpoint ────────────────────────────────────
@router.post("/extract", response_model=OCRResponse)
async def extract_text(request: OCRRequest):
    try:
        if request.file_type not in ["pdf", "jpg", "jpeg", "png", "webp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Supported: pdf, jpg, jpeg, png, webp",
            )

        # Extract text from Cloudinary URL
        raw_text = await extract_text_from_url(
            cloudinary_url=request.cloudinary_url,
            file_type=request.file_type,
            language=request.language,
        )

        # Clean extracted text
        cleaned_text = clean_text(raw_text)

        if not cleaned_text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from document. The file may be empty or unreadable.",
            )

        return OCRResponse(
            success=True,
            extracted_text=cleaned_text,
            character_count=len(cleaned_text),
            language=request.language,
        )

    except HTTPException:
        raise

    except Exception as e:
        print(f"OCR endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="OCR processing failed. Please try again.",
        )