import Document from "../models/Document.js";
import User from "../models/User.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import axios from "axios";

// ─── AI Service URL (no trailing slash) ──────────────────────
const AI_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

// ─── Category Sanitizer ───────────────────────────────────────
const validCategories = [
  "Civil", "Criminal", "Labor", "Land",
  "Consumer", "Family", "Tax", "Property",
  "Constitutional", "Other",
];

const sanitizeCategory = (cat) => {
  return validCategories.includes(cat) ? cat : "Other";
};

// ─── Analyze Document ─────────────────────────────────────────
export const analyzeDocument = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please provide a document.",
      });
    }

    const { language = "ne" } = req.body;
    const { originalname, mimetype, size, path, filename } = req.file;

    const fileTypeMap = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const fileType = fileTypeMap[mimetype] || "pdf";

    const document = await Document.create({
      user: req.user._id,
      originalName: originalname,
      fileType,
      fileSize: size,
      cloudinaryUrl: path,
      cloudinaryPublicId: filename,
      language,
      status: "processing",
    });

    try {
      const aiResponse = await axios.post(
        `${AI_URL}/summarize`,
        {
          cloudinary_url: path,
          file_type: fileType,
          language,
          document_id: document._id.toString(),
        },
        { timeout: 300000 } // 5 minutes for Render free tier
      );

      const {
        summary,
        rights,
        next_steps,
        laws_cited,
        risk_level,
        category,
        extracted_text,
      } = aiResponse.data;

      document.extractedText = extracted_text || "";
      document.analysis = {
        summary: summary || "",
        rights: rights || [],
        nextSteps: next_steps || [],
        lawsCited: laws_cited || [],
        riskLevel: risk_level || "Low",
        category: sanitizeCategory(category),
      };
      document.status = "analyzed";
      document.processingTime = Date.now() - startTime;
      await document.save();

      await User.findByIdAndUpdate(req.user._id, {
        $inc: { documentsAnalyzed: 1 },
      });

      return res.status(200).json({
        success: true,
        message: "Document analyzed successfully.",
        document: document.toSummaryJSON(),
      });

    } catch (aiError) {
      // Cleanup Cloudinary on AI failure
      if (document.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(
            document.cloudinaryPublicId,
            fileType === "pdf" ? "raw" : "image"
          );
          console.log("🧹 Cleaned up Cloudinary file after AI failure.");
        } catch (cleanupError) {
          console.error(`❌ Cloudinary cleanup failed: ${cleanupError.message}`);
        }
      }

      document.status = "failed";
      document.errorMessage = aiError.message || "AI analysis failed.";
      document.processingTime = Date.now() - startTime;
      await document.save();

      console.error(`❌ AI Service error: ${aiError.message}`);

      return res.status(502).json({
        success: false,
        message: "Document uploaded but AI analysis failed. Please try again.",
        documentId: document._id,
      });
    }

  } catch (error) {
    console.error(`❌ analyzeDocument error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Document analysis failed. Please try again.",
    });
  }
};

// ─── Get All User Documents ───────────────────────────────────
export const getUserDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, status, search } = req.query;

    const filter = { user: req.user._id };
    if (category) filter["analysis.category"] = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { "analysis.summary": { $regex: search, $options: "i" } },
      ];
    }

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-extractedText"),
      Document.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      documents: documents.map((doc) => doc.toSummaryJSON()),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (error) {
    console.error(`❌ getUserDocuments error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents.",
    });
  }
};

// ─── Get Single Document ──────────────────────────────────────
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    return res.status(200).json({
      success: true,
      document: document.toSummaryJSON(),
    });

  } catch (error) {
    console.error(`❌ getDocumentById error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document.",
    });
  }
};

// ─── Delete Document ──────────────────────────────────────────
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (document.cloudinaryPublicId) {
      await deleteFromCloudinary(
        document.cloudinaryPublicId,
        document.fileType === "pdf" ? "raw" : "image"
      );
    }

    await document.deleteOne();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { documentsAnalyzed: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
    });

  } catch (error) {
    console.error(`❌ deleteDocument error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to delete document.",
    });
  }
};

// ─── Retry Failed Analysis ────────────────────────────────────
export const retryAnalysis = async (req, res) => {
  const startTime = Date.now();

  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (document.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Only failed documents can be retried.",
      });
    }

    document.status = "processing";
    document.errorMessage = null;
    await document.save();

    const aiResponse = await axios.post(
      `${AI_URL}/summarize`,
      {
        cloudinary_url: document.cloudinaryUrl,
        file_type: document.fileType,
        language: document.language,
        document_id: document._id.toString(),
      },
      { timeout: 300000 }
    );

    const {
      summary,
      rights,
      next_steps,
      laws_cited,
      risk_level,
      category,
      extracted_text,
    } = aiResponse.data;

    document.extractedText = extracted_text || "";
    document.analysis = {
      summary: summary || "",
      rights: rights || [],
      nextSteps: next_steps || [],
      lawsCited: laws_cited || [],
      riskLevel: risk_level || "Low",
      category: sanitizeCategory(category),
    };
    document.status = "analyzed";
    document.processingTime = Date.now() - startTime;
    document.errorMessage = null;
    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document re-analyzed successfully.",
      document: document.toSummaryJSON(),
    });

  } catch (error) {
    console.error(`❌ retryAnalysis error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Retry failed. Please try again later.",
    });
  }
};