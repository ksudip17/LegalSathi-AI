import axios from "axios";
import User from "../models/User.js";

// ─── AI Service URL (no trailing slash) ──────────────────────
const AI_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

// ─── Ask Legal Question ───────────────────────────────────────
export const askLegalQuestion = async (req, res) => {
  try {
    const { question, language = "ne", history = [] } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    if (question.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Question is too short. Please be more specific.",
      });
    }

    const aiResponse = await axios.post(
      `${AI_URL}/rag/ask`,
      {
        question: question.trim(),
        language,
        history: history.slice(-10),
        user_id: req.user._id.toString(),
      },
      { timeout: 30000 }
    );

    const { answer, laws_cited, sources, confidence } = aiResponse.data;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsAsked: 1 },
    });

    return res.status(200).json({
      success: true,
      question: question.trim(),
      answer,
      lawsCited: laws_cited || [],
      sources: sources || [],
      confidence: confidence || null,
      language,
    });

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "AI service timed out. Please try again.",
      });
    }
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable.",
      });
    }
    console.error(`❌ askLegalQuestion error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to process your question. Please try again.",
    });
  }
};

// ─── Get Rights By Category ───────────────────────────────────
export const getRightsByCategory = async (req, res) => {
  try {
    const { category, language = "ne" } = req.body;

    const validCategories = [
      "land", "labor", "criminal",
      "family", "consumer", "civil",
    ];

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Choose from: ${validCategories.join(", ")}`,
      });
    }

    const aiResponse = await axios.post(
      `${AI_URL}/rag/rights`,
      {
        category: category.toLowerCase(),
        language,
        user_id: req.user._id.toString(),
      },
      { timeout: 30000 }
    );

    const { rights, laws_cited, summary } = aiResponse.data;

    return res.status(200).json({
      success: true,
      category,
      language,
      summary,
      rights: rights || [],
      lawsCited: laws_cited || [],
    });

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "AI service timed out. Please try again.",
      });
    }
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable.",
      });
    }
    console.error(`❌ getRightsByCategory error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rights. Please try again.",
    });
  }
};

// ─── Search Legal Corpus ──────────────────────────────────────
export const searchLegalCorpus = async (req, res) => {
  try {
    const { query, language = "ne", topK = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    const aiResponse = await axios.post(
      `${AI_URL}/rag/search`,
      {
        query: query.trim(),
        language,
        top_k: Math.min(topK, 10),
      },
      { timeout: 15000 }
    );

    const { results } = aiResponse.data;

    return res.status(200).json({
      success: true,
      query,
      results: results || [],
    });

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "Search timed out. Please try again.",
      });
    }
    console.error(`❌ searchLegalCorpus error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Search failed. Please try again.",
    });
  }
};

// ─── Get Legal Categories ─────────────────────────────────────
let categoriesCache = null;

export const getLegalCategories = async (req, res) => {
  try {
    if (categoriesCache) {
      return res.status(200).json({
        success: true,
        categories: categoriesCache,
      });
    }

    const categories = [
      {
        id: "land",
        label: { ne: "जग्गा तथा सम्पत्ति", hi: "भूमि और संपत्ति", en: "Land & Property" },
        icon: "🏔️",
        laws: ["Land Act Nepal", "Muluki Civil Code 2074 — Part 4"],
      },
      {
        id: "labor",
        label: { ne: "श्रम तथा रोजगार", hi: "श्रम और रोजगार", en: "Labor & Employment" },
        icon: "👷",
        laws: ["Labor Act 2074", "Foreign Employment Act Nepal"],
      },
      {
        id: "criminal",
        label: { ne: "फौजदारी", hi: "आपराधिक", en: "Criminal" },
        icon: "⚖️",
        laws: ["Muluki Criminal Code 2074", "Criminal Procedure Code"],
      },
      {
        id: "family",
        label: { ne: "परिवार तथा विवाह", hi: "परिवार और विवाह", en: "Family & Marriage" },
        icon: "👨‍👩‍👧",
        laws: ["Muluki Civil Code 2074 — Part 2", "Children's Act Nepal"],
      },
      {
        id: "consumer",
        label: { ne: "उपभोक्ता संरक्षण", hi: "उपभोक्ता संरक्षण", en: "Consumer Protection" },
        icon: "🛒",
        laws: ["Consumer Protection Act Nepal 2075"],
      },
      {
        id: "civil",
        label: { ne: "देवानी", hi: "नागरिक", en: "Civil" },
        icon: "📜",
        laws: ["Muluki Civil Code 2074", "Civil Procedure Code"],
      },
    ];

    categoriesCache = categories;

    return res.status(200).json({
      success: true,
      categories,
    });

  } catch (error) {
    console.error(`❌ getLegalCategories error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

// ─── Is This Legal? ───────────────────────────────────────────
export const checkLegalStatement = async (req, res) => {
  try {
    const { statement, language = "ne" } = req.body;

    if (!statement || statement.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Statement is required.",
      });
    }

    if (statement.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Statement is too short.",
      });
    }

    if (statement.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Statement is too long. Keep it under 500 characters.",
      });
    }

    const aiResponse = await axios.post(
      `${AI_URL}/legal-check/check`,
      {
        statement: statement.trim(),
        language,
        user_id: req.user._id.toString(),
      },
      { timeout: 30000 }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { questionsAsked: 1 },
    });

    return res.status(200).json({
      success: true,
      ...aiResponse.data,
    });

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "AI service timed out. Please try again.",
      });
    }
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable.",
      });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI is busy. Please wait 30 seconds and try again.",
      });
    }
    console.error(`❌ checkLegalStatement error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to check statement. Please try again.",
    });
  }
};