from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.weaviate_client import search_legal_corpus
from core.langchain_pipeline import get_llm, extract_json, is_rate_limit_error
from langchain_core.messages import HumanMessage
import asyncio

router = APIRouter()

# ─── Request Model ────────────────────────────────────────────
class LegalCheckRequest(BaseModel):
    statement: str
    language: str = "ne"
    user_id: Optional[str] = None

# ─── Language Instructions ────────────────────────────────────
LANGUAGE_INSTRUCTIONS = {
    "ne": "तपाईंले आफ्नो उत्तर नेपाली भाषामा दिनुपर्छ। सरल र स्पष्ट भाषा प्रयोग गर्नुहोस्।",
    "hi": "आपको अपना उत्तर हिंदी भाषा में देना है। सरल और स्पष्ट भाषा का उपयोग करें।",
    "en": "You must respond in English. Use simple and clear language.",
}

# ─── Legal Check Endpoint ─────────────────────────────────────
@router.post("/check")
async def check_legal_statement(request: LegalCheckRequest):
    try:
        if not request.statement.strip():
            raise HTTPException(
                status_code=400,
                detail="Statement cannot be empty."
            )

        if len(request.statement.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Statement is too short. Please describe the situation."
            )

        statement = request.statement.strip()
        language = request.language
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(
            language, LANGUAGE_INSTRUCTIONS["en"]
        )

        # Search Weaviate for relevant laws
        relevant_laws = search_legal_corpus(
            query=statement,
            top_k=5,
        )

        laws_context = "No specific laws found in database."
        laws_cited = []

        if relevant_laws:
            laws_context = "Relevant Nepal Laws:\n"
            for law in relevant_laws:
                laws_context += f"\n[{law['source']} — {law['section']}]\n{law['content'][:400]}\n"
                laws_cited.append(f"{law['source']} — {law['section']}")

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.
A citizen has described a situation and wants to know if it is legal or illegal under Nepal law.

{lang_instruction}

IMPORTANT RULES:
- Be direct and clear — answer LEGAL, ILLEGAL, or UNCLEAR
- Cite the exact law and section number
- Write in clean proper language — never copy garbled text
- Keep explanations simple — this is for everyday citizens
- Always recommend consulting a lawyer for serious matters

Relevant Nepal Laws from our database:
{laws_context}

Citizen's Statement: "{statement}"

Analyze this statement against Nepal law and respond ONLY with valid JSON:
{{
    "verdict": "ILLEGAL",
    "verdict_np": "गैरकानुनी",
    "confidence": "high",
    "short_reason": "One sentence explaining the verdict in simple terms",
    "detailed_explanation": "2-3 sentences with full explanation",
    "laws_violated": ["Law name — Section X: brief description"],
    "citizen_rights": ["Right 1 the citizen has", "Right 2", "Right 3"],
    "recommended_action": "What the citizen should do now — one clear actionable step",
    "severity": "high"
}}

Verdict must be exactly one of: LEGAL, ILLEGAL, UNCLEAR
Confidence must be exactly one of: high, medium, low
Severity must be exactly one of: low, medium, high, critical
"""

        llm = get_llm(temperature=0.1)  # low temperature for consistent verdicts

        for attempt in range(3):
            try:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                result = extract_json(response.content)

                return {
                    "success": True,
                    "statement": statement,
                    "verdict": result.get("verdict", "UNCLEAR"),
                    "verdict_np": result.get("verdict_np", ""),
                    "confidence": result.get("confidence", "medium"),
                    "short_reason": result.get("short_reason", ""),
                    "detailed_explanation": result.get("detailed_explanation", ""),
                    "laws_violated": result.get("laws_violated", laws_cited),
                    "citizen_rights": result.get("citizen_rights", []),
                    "recommended_action": result.get("recommended_action", ""),
                    "severity": result.get("severity", "medium"),
                    "language": language,
                }

            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 30
                        print(f"⚠️ Rate limit. Waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise HTTPException(
                            status_code=429,
                            detail="AI is busy. Please wait 30 seconds and try again."
                        )
                raise e

    except HTTPException:
        raise

    except Exception as e:
        print(f"❌ legal_check error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check legal statement. Please try again."
        )