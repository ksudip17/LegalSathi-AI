import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import httpx
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

# ─── Set Tesseract Path ───────────────────────────────────────
tesseract_cmd = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")
pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

# ─── Verify Tesseract Available ───────────────────────────────
def verify_tesseract():
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract version: {version}")
        return True
    except Exception as e:
        print(f"⚠️ Tesseract not available: {e}")
        return False

TESSERACT_AVAILABLE = verify_tesseract()

# ─── Extract Text from Image ──────────────────────────────────
def extract_text_from_image(image_path: str, language: str = "ne") -> str:
    if not TESSERACT_AVAILABLE:
        print("⚠️ Tesseract not available — skipping image OCR")
        return ""
    try:
        lang_map = {
            "ne": "nep+eng",
            "hi": "hin+eng",
            "en": "eng",
        }
        tess_lang = lang_map.get(language, "eng")

        image = Image.open(image_path)
        if image.mode != "RGB":
            image = image.convert("RGB")

        text = pytesseract.image_to_string(
            image,
            lang=tess_lang,
            config="--psm 6",
        )
        return text.strip()

    except Exception as e:
        print(f"❌ OCR image error: {e}")
        return ""

# ─── Extract Text from PDF ────────────────────────────────────
def extract_text_from_pdf(pdf_path: str, language: str = "ne") -> str:
    try:
        doc = fitz.open(pdf_path)
        full_text = ""

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")

            if text.strip():
                full_text += f"\n--- Page {page_num + 1} ---\n{text}"
            else:
                # Fallback to OCR for scanned pages
                if TESSERACT_AVAILABLE:
                    pix = page.get_pixmap(dpi=300)
                    with tempfile.NamedTemporaryFile(
                        suffix=".png", delete=False
                    ) as tmp:
                        pix.save(tmp.name)
                        ocr_text = extract_text_from_image(tmp.name, language)
                        full_text += f"\n--- Page {page_num + 1} (OCR) ---\n{ocr_text}"
                        os.unlink(tmp.name)
                else:
                    print(f"⚠️ Page {page_num + 1} has no text and Tesseract unavailable")

        doc.close()
        return full_text.strip()

    except Exception as e:
        print(f"❌ OCR PDF error: {e}")
        return ""

# ─── Extract Text from Cloudinary URL ────────────────────────
async def extract_text_from_url(
    cloudinary_url: str,
    file_type: str,
    language: str = "ne",
) -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(cloudinary_url)
            response.raise_for_status()

        suffix = f".{file_type}"
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False
        ) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        if file_type == "pdf":
            text = extract_text_from_pdf(tmp_path, language)
        else:
            text = extract_text_from_image(tmp_path, language)

        os.unlink(tmp_path)
        return text

    except httpx.HTTPError as e:
        print(f"❌ Failed to download file from Cloudinary: {e}")
        return ""

    except Exception as e:
        print(f"❌ extract_text_from_url error: {e}")
        return ""

# ─── Clean Extracted Text ─────────────────────────────────────
def clean_text(text: str) -> str:
    if not text:
        return ""
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    cleaned = "\n".join(lines)
    return cleaned