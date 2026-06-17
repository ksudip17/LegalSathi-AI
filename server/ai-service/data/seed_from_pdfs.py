import fitz  # PyMuPDF
import re
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.weaviate_client import batch_insert_legal_documents

# ─── Extract Text from PDF ────────────────────────────────────
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            full_text += f"\n{text}"
    doc.close()
    return full_text

def is_garbled_nepali(text: str) -> bool:
    """Detect if Nepali text is garbled from old font encoding."""
    # Garbled text has lots of these characters mixed incorrectly
    garbled_indicators = ["ङ्ग", "अम", "बिो", "ाँ", "फााँ"]
    count = sum(1 for indicator in garbled_indicators if indicator in text)
    return count >= 2

def clean_extracted_text(text: str) -> str:
    """Remove garbled lines from extracted text."""
    if not text:
        return ""
    lines = text.split("\n")
    clean_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip lines with too many garbled characters
        if is_garbled_nepali(line) and len(line) < 200:
            continue
        clean_lines.append(line)
    return "\n".join(clean_lines)

# ─── Chunk Text by Section ────────────────────────────────────
def chunk_by_section(text, chunk_size=600, overlap=80):
    # Match English and Nepali section/article markers
    section_pattern = r'(Article\s+\d+[\.\d]*|Section\s+\d+[\.\d]*|धारा\s+\d+[\.\d]*|दफा\s+\d+[\.\d]*|अनुच्छेद\s+\d+[\.\d]*|Schedule\s+\d+|अनुसूची\s+\d+)'

    parts = re.split(section_pattern, text)

    chunks = []
    current_chunk = ""
    current_section = "General"

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Check if this part is a section header
        if re.match(section_pattern, part):
            current_section = part
            continue

        combined = f"{current_section}: {part}"

        if len(current_chunk) + len(combined) < chunk_size:
            current_chunk += " " + combined
        else:
            if len(current_chunk.strip()) > 80:
                chunks.append({
                    "content": current_chunk.strip(),
                    "section": current_section,
                })
            # Start new chunk with overlap
            current_chunk = current_chunk[-overlap:] + " " + combined

    # Add last remaining chunk
    if current_chunk.strip() and len(current_chunk.strip()) > 80:
        chunks.append({
            "content": current_chunk.strip(),
            "section": current_section,
        })

    return chunks

# ─── Seed Single PDF ──────────────────────────────────────────
def seed_pdf(pdf_path, source_name, category, language="en", country="nepal"):
    print(f"\n Processing: {source_name}")
    print(f"   Path: {pdf_path}")

    if not os.path.exists(pdf_path):
        print(f"     File not found — skipping.")
        return 0

    text = extract_text_from_pdf(pdf_path)
    text = clean_extracted_text(text)

    if not text.strip():
        print(f"     No text extracted — PDF may be scanned/image-based.")
        return 0

    print(f"    Extracted {len(text):,} characters")

    chunks = chunk_by_section(text)
    print(f"    Split into {len(chunks)} chunks")

    if not chunks:
        print(f"     No chunks generated — skipping.")
        return 0

    documents = []
    for chunk in chunks:
        content = chunk["content"].strip()
        if len(content) < 80:
            continue
        documents.append({
            "content": content,
            "source": source_name,
            "section": chunk["section"],
            "category": category,
            "language": language,
            "country": country,
        })

    if documents:
        # Batch in groups of 50 to avoid Weaviate timeout
        batch_size = 50
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            batch_insert_legal_documents(batch)
            print(f"    Inserted batch {i // batch_size + 1} ({len(batch)} chunks)")

    print(f"    Total seeded: {len(documents)} chunks from '{source_name}'")
    return len(documents)

# ─── Main Seeder ──────────────────────────────────────────────
if __name__ == "__main__":
    base_path = "data/legal_corpus"

    legal_pdfs = [
        # ── Constitution of Nepal ──────────────────────────
        {
            "path": f"{base_path}/constitution_nepal_english.pdf",
            "source": "Constitution of Nepal 2015",
            "category": "civil",
            "language": "en",
        },
        {
            "path": f"{base_path}/constitution_nepal_nepali.pdf",
            "source": "नेपालको संविधान २०७२",
            "category": "civil",
            "language": "ne",
        },

        # ── Muluki Civil Code ──────────────────────────────
        {
            "path": f"{base_path}/muluki_civil_code_english.pdf",
            "source": "Muluki Civil Code 2074",
            "category": "civil",
            "language": "en",
        },
        {
            "path": f"{base_path}/muluki_civil_code_nepali.pdf",
            "source": "मुलुकी देवानी संहिता २०७४",
            "category": "civil",
            "language": "ne",
        },

        # ── Muluki Criminal Code ───────────────────────────
        {
            "path": f"{base_path}/muluki_criminal_code_english.pdf",
            "source": "Muluki Criminal Code 2074",
            "category": "criminal",
            "language": "en",
        },
        {
            "path": f"{base_path}/muluki_criminal_code_nepali.pdf",
            "source": "मुलुकी फौजदारी संहिता २०७४",
            "category": "criminal",
            "language": "ne",
        },

        # ── Labour Act ─────────────────────────────────────
        {
            "path": f"{base_path}/labour_act_english.pdf",
            "source": "Labor Act 2074",
            "category": "labor",
            "language": "en",
        },
        {
            "path": f"{base_path}/labour_act_nepali.pdf",
            "source": "श्रम ऐन २०७४",
            "category": "labor",
            "language": "ne",
        },

        # ── Land Act ───────────────────────────────────────
        {
            "path": f"{base_path}/land_act-english.pdf",
            "source": "Land Act Nepal",
            "category": "land",
            "language": "en",
        },
        {
            "path": f"{base_path}/land_act_nepali.pdf",
            "source": "जग्गा ऐन नेपाल",
            "category": "land",
            "language": "ne",
        },
    ]

    print(" Starting full Nepal legal corpus seeding...")
    print(f" Total PDFs to process: {len(legal_pdfs)}")
    print("=" * 60)

    total_chunks = 0
    for pdf in legal_pdfs:
        count = seed_pdf(
            pdf_path=pdf["path"],
            source_name=pdf["source"],
            category=pdf["category"],
            language=pdf["language"],
        )
        total_chunks += count

    print("\n" + "=" * 60)
    print(f" Seeding complete!")
    print(f" Total chunks seeded: {total_chunks:,}")
    print(f" LegalSaathi full legal corpus is ready!")