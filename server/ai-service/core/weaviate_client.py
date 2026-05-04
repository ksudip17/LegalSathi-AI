import weaviate
from weaviate.auth import AuthApiKey
from weaviate.classes.config import Configure, Property, DataType
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Connect to Weaviate Cloud ────────────────────────────────
def get_weaviate_client():
    client = weaviate.connect_to_weaviate_cloud(
        cluster_url=os.getenv("WEAVIATE_URL"),
        auth_credentials=AuthApiKey(os.getenv("WEAVIATE_API_KEY")),
    )
    return client

# ─── Collection Name ──────────────────────────────────────────
LEGAL_COLLECTION = "LegalDocument"

# ─── Create Collection If Not Exists ─────────────────────────
def setup_weaviate_schema():
    client = get_weaviate_client()

    try:
        # Check if collection already exists
        existing = client.collections.list_all()
        if LEGAL_COLLECTION in existing:
            print(f"Weaviate collection '{LEGAL_COLLECTION}' already exists.")
            return

        # Create the collection
        client.collections.create(
            name=LEGAL_COLLECTION,
            vectorizer_config=Configure.Vectorizer.text2vec_weaviate(),
            properties=[
                Property(
                    name="content",
                    data_type=DataType.TEXT,
                    description="The legal document text content",
                ),
                Property(
                    name="source",
                    data_type=DataType.TEXT,
                    description="Source law name e.g. Muluki Civil Code 2074",
                ),
                Property(
                    name="section",
                    data_type=DataType.TEXT,
                    description="Section or article number",
                ),
                Property(
                    name="category",
                    data_type=DataType.TEXT,
                    description="Legal category: land, labor, criminal, family, consumer, civil",
                ),
                Property(
                    name="language",
                    data_type=DataType.TEXT,
                    description="Language of content: ne, hi, en",
                ),
                Property(
                    name="country",
                    data_type=DataType.TEXT,
                    description="Country: nepal or india",
                ),
            ],
        )
        print(f"Weaviate collection '{LEGAL_COLLECTION}' created successfully.")

    except Exception as e:
        print(f"Weaviate schema setup error: {e}")
        raise e

    finally:
        client.close()

# ─── Search Legal Corpus ──────────────────────────────────────
def search_legal_corpus(query: str, category: str = None, top_k: int = 5):
    try:
        client = get_weaviate_client()
        collection = client.collections.get(LEGAL_COLLECTION)

        filters = None
        if category:
            from weaviate.classes.query import Filter
            filters = Filter.by_property("category").equal(category)

        results = collection.query.near_text(
            query=query,
            limit=top_k,
            filters=filters,
            return_properties=["content", "source", "section", "category", "language"],
        )

        formatted = []
        for obj in results.objects:
            formatted.append({
                "content": obj.properties.get("content", ""),
                "source": obj.properties.get("source", ""),
                "section": obj.properties.get("section", ""),
                "category": obj.properties.get("category", ""),
                "language": obj.properties.get("language", "en"),
            })

        client.close()
        return formatted

    except Exception as e:
        print(f"❌ Weaviate search error: {e}")
        # Return empty list — don't crash the whole pipeline
        return []
    client = get_weaviate_client()

    try:
        collection = client.collections.get(LEGAL_COLLECTION)

        # Build filters
        filters = None
        if category:
            from weaviate.classes.query import Filter
            filters = Filter.by_property("category").equal(category)

        # Perform semantic search
        results = collection.query.near_text(
            query=query,
            limit=top_k,
            filters=filters,
            return_properties=["content", "source", "section", "category", "language"],
        )

        # Format results
        formatted = []
        for obj in results.objects:
            formatted.append({
                "content": obj.properties.get("content", ""),
                "source": obj.properties.get("source", ""),
                "section": obj.properties.get("section", ""),
                "category": obj.properties.get("category", ""),
                "language": obj.properties.get("language", "en"),
            })

        return formatted

    except Exception as e:
        print(f"Weaviate search error: {e}")
        return []

    finally:
        client.close()

# ─── Insert Legal Document ────────────────────────────────────
def insert_legal_document(
    content: str,
    source: str,
    section: str,
    category: str,
    language: str = "en",
    country: str = "nepal",
):
    client = get_weaviate_client()

    try:
        collection = client.collections.get(LEGAL_COLLECTION)
        uuid = collection.data.insert({
            "content": content,
            "source": source,
            "section": section,
            "category": category,
            "language": language,
            "country": country,
        })
        return str(uuid)

    except Exception as e:
        print(f"Weaviate insert error: {e}")
        raise e

    finally:
        client.close()

# ─── Batch Insert Legal Documents ────────────────────────────
def batch_insert_legal_documents(documents: list):
    client = get_weaviate_client()

    try:
        collection = client.collections.get(LEGAL_COLLECTION)

        with collection.batch.dynamic() as batch:
            for doc in documents:
                batch.add_object({
                    "content": doc.get("content", ""),
                    "source": doc.get("source", ""),
                    "section": doc.get("section", ""),
                    "category": doc.get("category", ""),
                    "language": doc.get("language", "en"),
                    "country": doc.get("country", "nepal"),
                })

        print(f"Batch inserted {len(documents)} legal documents.")

    except Exception as e:
        print(f"Weaviate batch insert error: {e}")
        raise e

    finally:
        client.close()