import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import httpx
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

# Set tesseract command path
pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_CMD", "/usr/local/bin/tesseract"
)

# ─── Extract Text from Image ──────────────────────────────────
def extract_text_from_image(image_path: str, language: str = "ne") -> str:
    try:
        # Map our language codes to tesseract language codes
        lang_map = {
            "ne": "nep+eng",  # Nepali + English
            "hi": "hin+eng",  # Hindi + English
            "en": "eng",      # English only
        }
        tess_lang = lang_map.get(language, "nep+eng")

        image = Image.open(image_path)

        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")

        text = pytesseract.image_to_string(
            image,
            lang=tess_lang,
            config="--psm 6",  # Assume uniform block of text
        )

        return text.strip()

    except Exception as e:
        print(f"OCR image error: {e}")
        return ""

# ─── Extract Text from PDF ────────────────────────────────────
def extract_text_from_pdf(pdf_path: str, language: str = "ne") -> str:
    try:
        doc = fitz.open(pdf_path)
        full_text = ""

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Try direct text extraction first (faster)
            text = page.get_text("text")

            if text.strip():
                full_text += f"\n--- Page {page_num + 1} ---\n{text}"
            else:
                # Fallback to OCR if page has no selectable text (scanned PDF)
                pix = page.get_pixmap(dpi=300)

                with tempfile.NamedTemporaryFile(
                    suffix=".png", delete=False
                ) as tmp:
                    pix.save(tmp.name)
                    ocr_text = extract_text_from_image(tmp.name, language)
                    full_text += f"\n--- Page {page_num + 1} (OCR) ---\n{ocr_text}"
                    os.unlink(tmp.name)  # cleanup temp file

        doc.close()
        return full_text.strip()

    except Exception as e:
        print(f"OCR PDF error: {e}")
        return ""

# ─── Extract Text from Cloudinary URL ────────────────────────
async def extract_text_from_url(
    cloudinary_url: str,
    file_type: str,
    language: str = "ne",
) -> str:
    try:
        # Download file from Cloudinary
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(cloudinary_url)
            response.raise_for_status()

        # Save to temp file
        suffix = f".{file_type}"
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False
        ) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        # Extract text based on file type
        if file_type == "pdf":
            text = extract_text_from_pdf(tmp_path, language)
        else:
            # Image types: jpg, jpeg, png, webp
            text = extract_text_from_image(tmp_path, language)

        # Cleanup temp file
        os.unlink(tmp_path)

        return text

    except httpx.HTTPError as e:
        print(f"Failed to download file from Cloudinary: {e}")
        return ""

    except Exception as e:
        print(f"extract_text_from_url error: {e}")
        return ""

# ─── Clean Extracted Text ─────────────────────────────────────
def clean_text(text: str) -> str:
    if not text:
        return ""

    # Remove excessive whitespace
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]  # remove empty lines
    cleaned = "\n".join(lines)

    return cleaned