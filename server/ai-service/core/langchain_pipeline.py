import os
import json
import asyncio
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from core.weaviate_client import search_legal_corpus

load_dotenv()

# ─── Initialize Groq LLM ──────────────────────────────────────
def get_llm(temperature: float = 0.3):
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=2048,
    )

# ─── Language Instructions ────────────────────────────────────
LANGUAGE_INSTRUCTIONS = {
    "ne": "तपाईंले आफ्नो उत्तर नेपाली भाषामा दिनुपर्छ। सरल र स्पष्ट भाषा प्रयोग गर्नुहोस्।",
    "hi": "आपको अपना उत्तर हिंदी भाषा में देना है। सरल और स्पष्ट भाषा का उपयोग करें।",
    "en": "You must respond in English. Use simple and clear language.",
}

# ─── Rate Limit Handler ───────────────────────────────────────
def is_rate_limit_error(e):
    return "rate_limit" in str(e).lower() or "429" in str(e) or "too many" in str(e).lower()

def rate_limit_response():
    return {
        "summary": "Our AI is currently busy due to high demand. Please wait 30 seconds and try again.",
        "rights": [],
        "next_steps": ["Please wait 30 seconds and retry your request."],
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

# ─── Document Summarization Pipeline ─────────────────────────
async def summarize_legal_document(
    extracted_text: str,
    language: str = "ne",
    category: str = None,
) -> dict:
    try:
        llm = get_llm(temperature=0.2)
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["ne"])

        relevant_laws = search_legal_corpus(
            query=extracted_text[:500],
            category=category,
            top_k=3,
        )

        laws_context = ""
        if relevant_laws:
            laws_context = "\n\nRelevant Nepal Laws:\n"
            for law in relevant_laws:
                laws_context += f"- {law['source']} {law['section']}: {law['content'][:300]}\n"

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

You MUST respond ONLY with valid JSON and absolutely nothing else. No explanation, no markdown, no backticks.
Use this exact format:
{{
    "summary": "plain language summary here",
    "rights": ["right 1", "right 2", "right 3"],
    "next_steps": ["step 1", "step 2", "step 3"],
    "risk_level": "Low",
    "category": "Civil",
    "laws_cited": ["Law 1 - Section X", "Law 2 - Section Y"]
}}"""

        # ── Retry up to 3 times on rate limit ──
        for attempt in range(3):
            try:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                result = extract_json(response.content)
                return result
            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 30
                        print(f"⚠️ Rate limit hit. Waiting {wait_time}s before retry {attempt + 2}/3...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print("❌ Rate limit exceeded after 3 attempts.")
                        return rate_limit_response()
                raise e

    except Exception as e:
        print(f"❌ summarize_legal_document error: {e}")
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
        llm = get_llm(temperature=0.3)
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["ne"])

        # Search English corpus first — cleaner text
        relevant_laws_en = search_legal_corpus(
            query=question,
            top_k=4,
        )

        # Also search with English translation of common Nepali terms
        relevant_laws = relevant_laws_en

        laws_context = "No specific laws found in database."
        laws_cited = []

        if relevant_laws:
            laws_context = "Relevant Nepal Laws from Legal Database:\n"
            for law in relevant_laws:
                laws_context += f"\n[{law['source']} — {law['section']}]\n{law['content'][:400]}\n"
                laws_cited.append(f"{law['source']} — {law['section']}")

        history_text = ""
        if history:
            history_text = "\nPrevious conversation:\n"
            for msg in history[-6:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.
You help everyday Nepali citizens understand their legal rights in simple language.

{lang_instruction}

IMPORTANT: Your response must use clean, simple, modern {
    "नेपाली भाषा (Devanagari script)" if language == "ne"
    else "Hindi भाषा" if language == "hi"
    else "English"
}. 
Do NOT copy garbled or corrupted text from the legal references. 
Use your own clean words to explain the concepts.

{history_text}

Based on the following Nepal legal references, answer the user's question:

{laws_context}

User Question: {question}

Rules:
- Always cite specific laws and sections
- Use simple conversational language that non-lawyers can understand
- Write clean proper {
    "नेपाली" if language == "ne"
    else "Hindi" if language == "hi" 
    else "English"
} — never copy corrupted text
- If you are unsure, say so clearly
- Always recommend consulting a lawyer for serious matters

You MUST respond ONLY with valid JSON and absolutely nothing else.
{{
    "answer": "your detailed answer here in clean proper language",
    "laws_cited": ["Law 1 — Section X", "Law 2 — Section Y"],
    "confidence": "high"
}}"""

        for attempt in range(3):
            try:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                result = extract_json(response.content)
                result["laws_cited"] = result.get("laws_cited", laws_cited)
                return result
            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 30
                        print(f"⚠️ Rate limit hit. Waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        return {
                            "answer": "हाम्रो AI अहिले व्यस्त छ। ३० सेकेन्ड पछि फेरि प्रयास गर्नुहोस्।",
                            "laws_cited": [],
                            "confidence": "low",
                        }
                raise e

    except Exception as e:
        print(f"❌ answer_legal_question error: {e}")
        return {
            "answer": "प्रश्न प्रक्रिया गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।",
            "laws_cited": [],
            "confidence": "low",
        }

# ─── Rights by Category Pipeline ─────────────────────────────
async def get_rights_by_category(
    category: str,
    language: str = "ne",
) -> dict:
    try:
        llm = get_llm(temperature=0.2)
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["ne"])

        relevant_laws = search_legal_corpus(
            query=f"{category} rights Nepal law",
            category=category,
            top_k=5,
        )

        laws_context = "No specific laws found."
        laws_cited = []

        if relevant_laws:
            laws_context = f"Nepal Laws related to {category}:\n"
            for law in relevant_laws:
                laws_context += f"\n[{law['source']} - {law['section']}]\n{law['content'][:400]}\n"
                laws_cited.append(f"{law['source']} - {law['section']}")

        prompt = f"""You are LegalSaathi, an expert AI legal assistant specializing in Nepal law.

{lang_instruction}

Based on Nepal law, explain the key rights of citizens in the category: {category.upper()}

{laws_context}

You MUST respond ONLY with valid JSON and absolutely nothing else. No explanation, no markdown, no backticks.
Use this exact format:
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
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                result = extract_json(response.content)
                result["laws_cited"] = result.get("laws_cited", laws_cited)
                return result
            except Exception as e:
                if is_rate_limit_error(e):
                    if attempt < 2:
                        wait_time = (attempt + 1) * 30
                        print(f"⚠️ Rate limit hit. Waiting {wait_time}s before retry {attempt + 2}/3...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        return {
                            "summary": "Our AI is currently busy. Please wait 30 seconds and try again.",
                            "rights": [],
                            "laws_cited": [],
                        }
                raise e

    except Exception as e:
        print(f"❌ get_rights_by_category error: {e}")
        if is_rate_limit_error(e):
            return {
                "summary": "Our AI is currently busy. Please wait 30 seconds and try again.",
                "rights": [],
                "laws_cited": [],
            }
        return {
            "summary": "Failed to fetch rights. Please try again.",
            "rights": [],
            "laws_cited": [],
        }