import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // Original file info
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },

    fileType: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", "webp"],
      required: [true, "File type is required"],
    },

    fileSize: {
      type: Number, // in bytes
      required: true,
    },

    // Cloudinary storage
    cloudinaryUrl: {
      type: String,
      required: [true, "Cloudinary URL is required"],
    },

    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
    },

    // OCR extracted text
    extractedText: {
      type: String,
      default: "",
    },

    // AI Analysis Results
    analysis: {
      summary: {
        type: String,
        default: "",
      },

      rights: {
        type: [String],
        default: [],
      },

      nextSteps: {
        type: [String],
        default: [],
      },

      lawsCited: {
        type: [String],
        default: [],
      },

      riskLevel: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low",
      },

      category: {
  type: String,
  enum: ["Civil", "Criminal", "Labor", "Land", "Consumer", "Family", "Tax", "Property", "Constitutional", "Other"],
  default: "Other",
},
    },

    // Language of analysis output
    language: {
      type: String,
      enum: ["ne", "hi", "en"],
      default: "ne",
    },

    // Processing status
    status: {
      type: String,
      enum: ["uploaded", "processing", "analyzed", "failed"],
      default: "uploaded",
    },

    errorMessage: {
      type: String,
      default: null,
    },

    // Processing time in ms
    processingTime: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index for fast user document queries ────────────────────
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, status: 1 });

// ─── Virtual: file size in MB ─────────────────────────────────
documentSchema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / 1024 / 1024).toFixed(2) + " MB";
});

// ─── Instance method: public summary ─────────────────────────
documentSchema.methods.toSummaryJSON = function () {
  return {
    _id: this._id,
    originalName: this.originalName,
    fileType: this.fileType,
    fileSizeMB: this.fileSizeMB,
    cloudinaryUrl: this.cloudinaryUrl,
    analysis: this.analysis,
    language: this.language,
    status: this.status,
    processingTime: this.processingTime,
    createdAt: this.createdAt,
  };
};

const Document = mongoose.model("Document", documentSchema);

export default Document;