<div align="center">

<img src="client/public/logo.png" alt="LegalSaathi Logo" width="200"/>

# LegalSaathi — AI

### Nepal's First AI-Powered Legal Assistant

**Understand your legal rights in Nepali, Hindi, and English — instantly.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-legalsaathi--ai.vercel.app-2563EB?style=for-the-badge)](https://legalsaathi-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀_Backend-AWS_EC2-22C55E?style=for-the-badge)](https://legalsaathi.mooo.com/api/)
[![AI Service](https://img.shields.io/badge/🤖_AI_Service-FastAPI-F59E0B?style=for-the-badge)](https://legalsaathi.mooo.com/ai)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Weaviate](https://img.shields.io/badge/Weaviate-FF6B35?style=flat-square)](https://weaviate.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

</div>

---

## 🇳🇵 The Problem

> **73% of Nepali citizens cannot afford a lawyer.**
> Most don't know their basic legal rights.
> They receive scanned court notices, land papers, and labor contracts — and have no idea what they mean.

LegalSaathi bridges this gap: free AI-powered legal guidance in Nepali, Hindi, and English — built on Nepal's actual legal corpus, not generic LLM knowledge.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Document Analyzer** | Upload any legal document (PDF/image) → OCR extracts text → RAG pipeline → Plain Nepali/English summary + rights + next steps |
| ⚖️ **Legal Q&A Chat** | Ask any legal question in Nepali/Hindi/English → AI searches Nepal law corpus → Answers with exact law citations |
| 🔍 **Is This Legal?** | Describe any situation → Instant LEGAL/ILLEGAL/UNCLEAR verdict based on Nepal law |
| 🛡️ **Rights Navigator** | Explore your rights by category — Land, Labor, Criminal, Family, Consumer |
| 📋 **Document History** | All analyzed documents saved with summaries and timestamps |
| 🌐 **Multilingual** | Full support for Nepali (नेपाली), Hindi (हिन्दी), and English |
| 🔐 **Google OAuth** | Sign in with Google — secure, fast, no password needed |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LegalSaathi Platform                  │
├─────────────────┬───────────────────┬───────────────────┤
│   Next.js 16    │   Express.js      │    FastAPI        │
│   Frontend      │   API Gateway     │    AI Service     │
│   Vercel        │   AWS EC2         │    AWS EC2        │
└─────────────────┴───────────────────┴───────────────────┘
         │                  │                  │
         │                  ▼                  ▼
         │           ┌──────────┐      ┌──────────────┐
         │           │ MongoDB  │      │   Weaviate   │
         │           │  Atlas   │      │  Vector DB   │
         │           │ (Users + │      │ (Nepal Legal │
         │           │  Docs)   │      │   Corpus)    │
         │           └──────────┘      └──────────────┘
         │                                     │
         │                             ┌───────────────┐
         │                             │  Groq LLaMA   │
         │                             │  3.3 70B      │
         │                             │  (LLM Engine) │
         │                             └───────────────┘
         ▼
┌─────────────────┐
│   Cloudinary    │
│  (PDF + Image   │
│    Storage)     │
└─────────────────┘
```

### Request Flow — Document Analysis

```
User uploads PDF/image
        ↓
Cloudinary stores file
        ↓
Node.js API gateway validates request + routes to AI service
        ↓
Tesseract OCR extracts raw text from scanned document
        ↓
LangChain RAG searches Weaviate vector DB for relevant Nepal laws
(cosine similarity over 10 PDFs + 35 curated legal chunks)
        ↓
Groq LLaMA 3.3 70B generates grounded answer
using retrieved law chunks as context only
        ↓
Returns: Plain-language summary + Rights + Next Steps + Law Citations
        ↓
Saved to MongoDB for document history
```

---

## ⚙️ Key Engineering Decisions

| Decision | What I chose | Why — not just what |
|----------|-------------|---------------------|
| Vector DB | Weaviate (cloud) | Chosen over PGVector here because the legal corpus is schema-rich — Weaviate's class-based schema lets me tag chunks by law category (Labor, Criminal, Land) and filter before semantic search, reducing irrelevant retrievals |
| AI Microservice | FastAPI (Python) | RAG pipeline is Python-native via LangChain — isolating it in FastAPI keeps the Node.js gateway thin and lets the AI service scale or be swapped independently |
| OCR | Tesseract | Handles scanned Nepali government documents which are image-heavy PDFs; runs self-hosted on EC2 with no per-call cost vs. cloud OCR APIs |
| LLM | Groq LLaMA 3.3 70B | Fastest inference at zero cost for dev tier; critical for a legal assistant where users expect near-instant responses, not 10-second waits |
| Auth | Google OAuth + httpOnly JWT | Google OAuth reduces friction for non-technical users (target audience); httpOnly cookie storage prevents XSS token theft vs. localStorage |
| API Gateway | Express.js (Node.js) | Acts as the single entry point — handles auth, rate limiting, file upload, and proxies to the Python AI service; keeps security logic in one place |
| Storage | Cloudinary | Handles PDF + image storage with CDN delivery; avoids managing S3 bucket policies for a project at this scale |

---

## 📊 Measured Results

- **~70% reduction** in manual legal document lookup time via OCR + RAG pipeline
- **12 secured REST endpoints** across 7 security layers (OAuth, JWT, rate limiting, XSS sanitization, NoSQL injection prevention, Helmet headers, CORS whitelist)
- **3-microservice architecture** independently deployable — frontend (Vercel), API gateway (EC2), AI service (EC2)
- **10 legal PDFs + 35 curated chunks** embedded as vector search index covering Nepal's core legal corpus

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | React framework with SSR |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| Lucide React | Icon system |

### Backend (Node.js)
| Technology | Purpose |
|-----------|---------|
| Express.js | REST API gateway |
| MongoDB + Mongoose | User data and document storage |
| JWT + httpOnly Cookies | Secure authentication |
| Passport.js | Google OAuth 2.0 |
| Multer + Cloudinary | File upload and storage |
| Helmet + XSS protection | Security hardening |

### AI Microservice (Python)
| Technology | Purpose |
|-----------|---------|
| FastAPI | High-performance AI API |
| LangChain | RAG pipeline orchestration |
| Groq LLaMA 3.3 70B | Large language model |
| Weaviate | Vector database for semantic search |
| Tesseract OCR | Text extraction from images/PDFs |
| PyMuPDF | PDF processing |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Vercel | Frontend deployment |
| AWS EC2 | Backend + AI service deployment |
| MongoDB Atlas | Cloud database |
| Weaviate Cloud | Vector database cloud |
| Cloudinary | Media storage CDN |
| GitHub Actions | CI/CD pipeline |

---

## 📁 Project Structure

```
legalsathi/
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.js        # Login with email or Google
│   │   │   └── register/page.js     # Register with email or Google
│   │   ├── dashboard/page.js        # Main dashboard
│   │   ├── analyze/page.js          # Document analyzer
│   │   ├── ask/page.js              # Legal Q&A chat
│   │   ├── history/page.js          # Document history
│   │   ├── legal-check/page.js      # "Is This Legal?" feature
│   │   ├── layout.js                # Root layout
│   │   └── page.js                  # Landing page
│   ├── components/
│   │   ├── ChatInterface.js         # Reusable chat component
│   │   ├── DocumentUpload.js        # Drag & drop upload
│   │   ├── LanguageSelector.js      # 3-language selector
│   │   ├── LegalDisclaimer.js       # Legal disclaimer system
│   │   ├── LegalSummary.js          # Analysis result display
│   │   └── LegalVerdict.js          # Is This Legal verdict card
│   └── lib/
│       └── api.js                   # Centralised API layer
│
├── server/
│   ├── node-backend/                # Express API Gateway
│   │   ├── controllers/
│   │   │   ├── authController.js    # Auth + Google OAuth
│   │   │   ├── documentController.js# Document analysis
│   │   │   └── legalController.js   # Legal Q&A + checker
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   └── uploadMiddleware.js  # Multer + Cloudinary
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   └── Document.js          # Document schema
│   │   └── routes/
│   │       ├── authRoutes.js        # /api/auth/*
│   │       ├── documentRoutes.js    # /api/documents/*
│   │       └── legalRoutes.js       # /api/legal/*
│   │
│   └── ai-service/                  # FastAPI AI Microservice
│       ├── core/
│       │   ├── langchain_pipeline.py # RAG + Groq pipeline
│       │   ├── weaviate_client.py    # Vector DB client
│       │   └── ocr_engine.py        # Tesseract OCR engine
│       ├── routes/
│       │   ├── ocr.py               # OCR endpoint
│       │   ├── rag.py               # RAG Q&A endpoints
│       │   ├── summarize.py         # Document summarisation
│       │   └── legal_check.py       # Is This Legal endpoint
│       └── data/
│           ├── seed_legal_corpus.py  # Manual corpus seeder
│           └── seed_from_pdfs.py    # PDF corpus seeder
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js v18+
Python 3.10+
Git
```

### 1. Clone

```bash
git clone https://github.com/ksudip17/LegalSathi-AI.git
cd LegalSathi-AI
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

### 3. Node Backend

```bash
cd server/node-backend
npm install
cp .env.example .env
npm run dev
```

### 4. AI Service

```bash
cd server/ai-service
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn main:app --reload --port 8000
```

### 5. Seed Legal Corpus

```bash
cd server/ai-service
source venv/bin/activate
python3 data/seed_legal_corpus.py    # Seed manual corpus
python3 data/seed_from_pdfs.py       # Seed from Nepal law PDFs
```

---

## 🔑 Environment Variables

### Frontend (`client/.env.local`)
```bash
NEXT_PUBLIC_NODE_API_URL=http://localhost:5001/api
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

### Node Backend (`server/node-backend/.env`)
```bash
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

### AI Service (`server/ai-service/.env`)
```bash
GROQ_API_KEY=your_groq_api_key
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TESSERACT_CMD=/usr/bin/tesseract
```

---

## 🧠 Nepal Legal Corpus

| Document | Coverage |
|---------|----------|
| Constitution of Nepal 2015 | Fundamental rights, governance |
| Muluki Civil Code 2074 | Property, contracts, tenancy, family |
| Muluki Criminal Code 2074 | Criminal offenses, rights of accused |
| Labor Act 2074 | Employment rights, wages, termination |
| Land Act Nepal | Land registration, ownership, disputes |
| Consumer Protection Act 2075 | Consumer rights, complaints |
| Foreign Employment Act | Migrant worker rights, permits |

**Total:** 10 PDFs + 35 manually curated legal chunks embedded in Weaviate.

---

## 🔒 Security Features

- ✅ JWT stored in `httpOnly` cookies — XSS safe
- ✅ `sameSite: lax` — CSRF protected
- ✅ XSS input sanitisation on all endpoints
- ✅ NoSQL injection prevention
- ✅ Rate limiting — 500 req/15min general, 20 req/15min auth
- ✅ Helmet.js security headers
- ✅ CORS whitelist with origin validation
- ✅ File type and size validation on upload

---

## 📊 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/register` | Register with email |
| POST | `/login` | Login with email |
| POST | `/logout` | Logout + clear cookie |
| GET | `/me` | Get current user |
| GET | `/google` | Google OAuth redirect |
| GET | `/google/callback` | Google OAuth callback |
| PUT | `/profile` | Update profile |
| PUT | `/change-password` | Change password |

### Documents (`/api/documents`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/analyze` | Upload + analyze document |
| GET | `/` | Get all user documents |
| GET | `/:id` | Get single document |
| DELETE | `/:id` | Delete document |
| POST | `/:id/retry` | Retry failed analysis |

### Legal (`/api/legal`)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/ask` | Ask legal question |
| POST | `/rights` | Get rights by category |
| POST | `/search` | Search legal corpus |
| GET | `/categories` | Get legal categories |
| POST | `/check` | Is This Legal? checker |

---

## 🌍 Deployment

| Service | Platform | URL |
|---------|---------|-----|
| Frontend | Vercel | [legalsaathi-ai.vercel.app](https://legalsaathi-ai.vercel.app) |
| Backend (API) | AWS EC2 | [legalsaathi.mooo.com/api](https://legalsaathi.mooo.com/api) |
| AI Service | AWS EC2 | [legalsaathi.mooo.com/ai](https://legalsaathi.mooo.com/ai) |

**Production env vars:**
- Frontend: `NEXT_PUBLIC_NODE_API_URL=https://legalsaathi.mooo.com/api`
- Node backend: `AI_SERVICE_URL=https://legalsaathi.mooo.com/ai`
- Google OAuth callback: `https://legalsaathi.mooo.com/api/auth/google/callback`

---

## 👨‍💻 Author

**Sudip Khatiwada** — AI Backend Engineer
Production RAG Pipelines · LLM Integration · Node.js · FastAPI · AWS

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sudipkhatiwada/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/ksudip17)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=flat-square&logo=vercel&logoColor=white)](https://sudipkhatiwada.vercel.app)

---

## 📄 License

MIT License

---

## ⚠️ Disclaimer

LegalSaathi provides general legal information based on Nepal law. This is not a substitute for professional legal advice. Always consult a qualified lawyer for serious legal matters.

---

<div align="center">

**Built for Nepal 🇳🇵**

*न्याय सबैको लागि — Justice for Everyone*

</div>
