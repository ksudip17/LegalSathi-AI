from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.ocr_engine import extract_text_from_url, clean_text, TESSERACT_AVAILABLE
from core.langchain_pipeline import summarize_legal_document
import httpx
import base64

router = APIRouter()

class SummarizeRequest(BaseModel):
    cloudinary_url: str
    file_type: str
    language: str = "ne"
    document_id: Optional[str] = None
    category: Optional[str] = None

@router.post("")
async def summarize_document(request: SummarizeRequest):
    try:
        if request.file_type not in ["pdf", "jpg", "jpeg", "png", "webp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Supported: pdf, jpg, jpeg, png, webp",
            )

        is_image = request.file_type in ["jpg", "jpeg", "png", "webp"]

        # For images without Tesseract — use vision-based extraction
        if is_image and not TESSERACT_AVAILABLE:
            print(f"📸 Image file detected — using vision extraction (no Tesseract)")
            cleaned_text = await extract_text_vision(request.cloudinary_url, request.file_type)
        else:
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

        print(f"✅ Extracted {len(cleaned_text)} characters.")
        print(f"🤖 Analyzing document with Groq...")

        result = await summarize_legal_document(
            extracted_text=cleaned_text,
            language=request.language,
            category=request.category,
        )

        print(f"✅ Analysis complete.")

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
        print(f"❌ Summarize endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Document summarization failed. Please try again.",
        )

# ─── Vision-based text extraction (no Tesseract needed) ───────
async def extract_text_vision(cloudinary_url: str, file_type: str) -> str:
    try:
        from groq import Groq
        import os

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": cloudinary_url,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract all text from this legal document image. Return only the extracted text, nothing else.",
                        },
                    ],
                }
            ],
            max_tokens=2048,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"❌ Vision extraction error: {e}")
        return ""
    try:
        from core.langchain_pipeline import get_llm
        from langchain_core.messages import HumanMessage

        # Download image
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(cloudinary_url)
            response.raise_for_status()

        # Convert to base64
        image_data = base64.b64encode(response.content).decode("utf-8")
        mime_type = f"image/{file_type}" if file_type != "jpg" else "image/jpeg"

        # Use Groq vision to extract text
        llm = get_llm(temperature=0.1)

        message = HumanMessage(
            content=[
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{image_data}"
                    },
                },
                {
                    "type": "text",
                    "text": "Extract all text from this legal document image. Return only the extracted text, nothing else."
                }
            ]
        )

        response = await llm.ainvoke([message])
        return response.content.strip()

    except Exception as e:
        print(f"❌ Vision extraction error: {e}")
        return ""