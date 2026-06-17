import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

print(" Using direct Groq SDK — langchain_pipeline v3")

# ─── Direct Groq Client ───────────────────────────────────────
def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─── Sync Groq Call ───────────────────────────────────────────
def groq_complete(prompt: str, temperature: float = 0.3) -> str:
    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048,
        temperature=temperature,
    )
    return response.choices[0].message.content.strip()

# ─── Async Groq Call ──────────────────────────────────────────
async def groq_complete_async(prompt: str, temperature: float = 0.3) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: groq_complete(prompt, temperature)
    )

# ─── Language Instructions ────────────────────────────────────
LANGUAGE_INSTRUCTIONS = {
    "ne": "तपाईंले आफ्नो उत्तर नेपाली भाषामा दिनुपर्छ। सरल र स्पष्ट भाषा प्रयोग गर्नुहोस्।",
    "hi": "आपको अपना उत्तर हिंदी भाषा में देना है। सरल और स्पष्ट भाषा का उपयोग करें।",
    "en": "You must respond in English. Use simple and clear language.",
}

# ─── Rate Limit Check ─────────────────────────────────────────
def is_rate_limit_error(e):
    return (
        "rate_limit" in str(e).lower()
        or "429" in str(e)
        or "too many" in str(e).lower()
    )

def rate_limit_response():
    return {
        "summary": "Our AI is currently busy. Please wait 30 seconds and try again.",
        "rights": [],
        "next_steps": ["Please wait 30 seconds and retry."],
        "risk_level": "Low",
        "category": "Other",
        "laws_cited": [],
    }

# ─── JSON Extractor ───────────────────────────────────────────
def extract_json(content: str) -> dict:
    content = content.strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    if start != -1 and end > start:
        content = content[start:end]
    return json.loads(content)

# ─── Safe Weaviate Search ─────────────────────────────────────
def safe_search_laws(query: str, category: str = None, top_k: int = 3) -> str:
    try:
        from core.weaviate_client import search_legal_corpus
        relevant_laws = search_legal_corpus(
            query=query,
            category=category,
            top_k=top_k,
        )
        if not relevant_laws:
            return ""
        laws_context = "\n\nRelevant Nepal Laws:\n"
        for law in relevant_laws:
            laws_context += f"- {law['source']} {law['section']}: {law['content'][:300]}\n"
        return laws_context
    except Exception as e:
        print(f" Weaviate unavailable — continuing without legal context: {e}")
        return ""

# ─── Document Summarization Pipeline ─────────────────────────
async def summarize_legal_document(
    extracted_text: str,
    language: str = "ne",
    category: str = None,
) -> dict:
    try:
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(
            language, LANGUAGE_INSTRUCTIONS["ne"]
        )

        # Try to get laws — won't crash if Weaviate is down
        laws_context = safe_search_laws(
            query=extracted_text[:500],
            category=category,
            top_k=3,
        )

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.

{lang_instruction}

Analyze the following legal document and provide:
1. A plain-language SUMMARY of what this document is about
2. The KEY RIGHTS of the person involved
3. RECOMMENDED NEXT STEPS they should take
4. RISK LEVEL: Low, Medium, or High
5. CATEGORY: Civil, Criminal, Labor, Land, Consumer, Family, or Other
6. LAWS CITED that apply to this document

{laws_context}

DOCUMENT TEXT:
{extracted_text[:3000]}

You MUST respond ONLY with valid JSON. No explanation, no markdown, no backticks.
{{
    "summary": "plain language summary here",
    "rights": ["right 1", "right 2", "right 3"],
    "next_steps": ["step 1", "step 2", "step 3"],
    "risk_level": "Low",
    "category": "Civil",
    "laws_cited": ["Law 1 - Section X", "Law 2 - Section Y"]
}}"""

        for attempt in range(3):
            try:
                print(f" Calling Groq API — attempt {attempt + 1}...")
                content = await groq_complete_async(prompt, temperature=0.2)
                print(f" Groq response received — {len(content)} chars")
                result = extract_json(content)
                print(f" JSON parsed successfully")
                return result
            except Exception as e:
                print(f" Attempt {attempt + 1} failed: {e}")
                if is_rate_limit_error(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 30
                        print(f" Rate limit. Waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    return rate_limit_response()
                raise e

    except Exception as e:
        print(f" summarize_legal_document error: {e}")
        if is_rate_limit_error(e):
            return rate_limit_response()
        return {
            "summary": "Document analysis failed. Please try again.",
            "rights": [],
            "next_steps": [],
            "risk_level": "Low",
            "category": "Other",
            "laws_cited": [],
        }

# ─── Legal Q&A RAG Pipeline ───────────────────────────────────
async def answer_legal_question(
    question: str,
    language: str = "ne",
    history: list = [],
) -> dict:
    try:
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(
            language, LANGUAGE_INSTRUCTIONS["ne"]
        )

        laws_context = "No specific laws found in database."
        laws_cited = []

        try:
            from core.weaviate_client import search_legal_corpus
            relevant_laws = search_legal_corpus(query=question, top_k=5)
            if relevant_laws:
                laws_context = "Relevant Nepal Laws:\n"
                for law in relevant_laws:
                    laws_context += f"\n[{law['source']} - {law['section']}]\n{law['content'][:400]}\n"
                    laws_cited.append(f"{law['source']} - {law['section']}")
        except Exception as e:
            print(f" Weaviate unavailable for Q&A: {e}")

        history_text = ""
        if history:
            history_text = "\nPrevious conversation:\n"
            for msg in history[-6:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.

{lang_instruction}

IMPORTANT: Write in clean proper language. Do NOT copy garbled text.

{history_text}

{laws_context}

User Question: {question}

Rules:
- Cite specific laws and sections
- Use simple language for non-lawyers
- Recommend consulting a lawyer for serious matters

Respond ONLY with valid JSON:
{{
    "answer": "your detailed answer in clean proper language",
    "laws_cited": ["Law 1 - Section X", "Law 2 - Section Y"],
    "confidence": "high"
}}"""

        for attempt in range(3):
            try:
                print(f" Calling Groq for Q&A — attempt {attempt + 1}...")
                content = await groq_complete_async(prompt, temperature=0.3)
                result = extract_json(content)
                result["laws_cited"] = result.get("laws_cited", laws_cited)
                return result
            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        await asyncio.sleep((attempt + 1) * 30)
                        continue
                    return {
                        "answer": "हाम्रो AI अहिले व्यस्त छ। ३० सेकेन्ड पछि फेरि प्रयास गर्नुहोस्।",
                        "laws_cited": [],
                        "confidence": "low",
                    }
                raise e

    except Exception as e:
        print(f" answer_legal_question error: {e}")
        return {
            "answer": "Failed to process your question. Please try again.",
            "laws_cited": [],
            "confidence": "low",
        }

# ─── Rights by Category Pipeline ─────────────────────────────
async def get_rights_by_category(
    category: str,
    language: str = "ne",
) -> dict:
    try:
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(
            language, LANGUAGE_INSTRUCTIONS["ne"]
        )

        laws_context = "No specific laws found."
        laws_cited = []

        try:
            from core.weaviate_client import search_legal_corpus
            relevant_laws = search_legal_corpus(
                query=f"{category} rights Nepal law",
                category=category,
                top_k=5,
            )
            if relevant_laws:
                laws_context = f"Nepal Laws related to {category}:\n"
                for law in relevant_laws:
                    laws_context += f"\n[{law['source']} - {law['section']}]\n{law['content'][:400]}\n"
                    laws_cited.append(f"{law['source']} - {law['section']}")
        except Exception as e:
            print(f" Weaviate unavailable for rights: {e}")

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.

{lang_instruction}

Explain the key rights of citizens in: {category.upper()}

{laws_context}

Respond ONLY with valid JSON:
{{
    "summary": "brief overview of this legal area",
    "rights": [
        "right 1 with explanation",
        "right 2 with explanation",
        "right 3 with explanation",
        "right 4 with explanation",
        "right 5 with explanation"
    ],
    "laws_cited": ["Law 1 - Section X", "Law 2 - Section Y"]
}}"""

        for attempt in range(3):
            try:
                content = await groq_complete_async(prompt, temperature=0.2)
                result = extract_json(content)
                result["laws_cited"] = result.get("laws_cited", laws_cited)
                return result
            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        await asyncio.sleep((attempt + 1) * 30)
                        continue
                    return {
                        "summary": "AI is busy. Please wait 30 seconds.",
                        "rights": [],
                        "laws_cited": [],
                    }
                raise e

    except Exception as e:
        print(f" get_rights_by_category error: {e}")
        return {
            "summary": "Failed to fetch rights. Please try again.",
            "rights": [],
            "laws_cited": [],
        }