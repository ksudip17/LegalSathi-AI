from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.langchain_pipeline import (
    answer_legal_question,
    get_rights_by_category,
)
from core.weaviate_client import search_legal_corpus

router = APIRouter()

# ─── Request Models ───────────────────────────────────────────
class AskRequest(BaseModel):
    question: str
    language: str = "ne"
    history: list = []
    user_id: Optional[str] = None

class RightsRequest(BaseModel):
    category: str
    language: str = "ne"
    user_id: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    language: str = "ne"
    top_k: int = 5

# ─── Ask Legal Question ───────────────────────────────────────
@router.post("/ask")
async def ask_question(request: AskRequest):
    try:
        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty.",
            )

        if len(request.question.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Question is too short. Please be more specific.",
            )

        result = await answer_legal_question(
            question=request.question.strip(),
            language=request.language,
            history=request.history,
        )

        return {
            "success": True,
            "question": request.question.strip(),
            "answer": result.get("answer", ""),
            "laws_cited": result.get("laws_cited", []),
            "confidence": result.get("confidence", "medium"),
            "language": request.language,
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"RAG ask error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process question. Please try again.",
        )

# ─── Get Rights by Category ───────────────────────────────────
@router.post("/rights")
async def rights_by_category(request: RightsRequest):
    try:
        valid_categories = [
            "land", "labor", "criminal",
            "family", "consumer", "civil",
        ]

        if request.category.lower() not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Choose from: {', '.join(valid_categories)}",
            )

        result = await get_rights_by_category(
            category=request.category.lower(),
            language=request.language,
        )

        return {
            "success": True,
            "category": request.category,
            "language": request.language,
            "summary": result.get("summary", ""),
            "rights": result.get("rights", []),
            "laws_cited": result.get("laws_cited", []),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"RAG rights error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch rights. Please try again.",
        )

# ─── Search Legal Corpus ──────────────────────────────────────
@router.post("/search")
async def search_corpus(request: SearchRequest):
    try:
        if not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Search query cannot be empty.",
            )

        # Cap results at 10
        top_k = min(request.top_k, 10)

        results = search_legal_corpus(
            query=request.query.strip(),
            top_k=top_k,
        )

        return {
            "success": True,
            "query": request.query.strip(),
            "results": results,
            "count": len(results),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"RAG search error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Search failed. Please try again.",
        )