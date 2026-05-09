"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Scale,
  ArrowLeft,
  FileText,
  Search,
  Trash2,
  Eye,
  Clock,
  Filter,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getUserDocuments,
  deleteDocument,
  retryAnalysis,
  isAuthenticated,
  isTokenExpired,
  logoutUser,
} from "@/lib/api";

const CATEGORIES = ["All", "Civil", "Labor", "Land", "Consumer", "Criminal", "Family", "Other"];

const riskColor = {
  Low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const categoryColor = {
  Civil: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Labor: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Land: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Consumer: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Criminal: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Family: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

const statusColor = {
  analyzed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  processing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  uploaded: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

export default function HistoryPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    // Check localStorage token (works in production cross-domain)
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    loadDocuments();
  }, [activeCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await getUserDocuments({
        category: activeCategory === "All" ? undefined : activeCategory,
        limit: 20,
      });
      setDocuments(res.documents || []);
      setPagination(res.pagination || {});
    } catch (error) {
      if (error.message.includes("401")) {
        logoutUser();
        return;
      }
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter
  const filtered = documents.filter((doc) => {
    const matchSearch =
      search === "" ||
      doc.originalName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.analysis?.summary?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      toast.success("Document deleted.");
    } catch (error) {
      toast.error(error.message || "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      const res = await retryAnalysis(id);
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? res.document : doc))
      );
      toast.success("Document re-analyzed successfully!");
    } catch (error) {
      toast.error(error.message || "Retry failed. Please try again.");
    } finally {
      setRetryingId(null);
    }
  };

  const handleDownload = (doc) => {
    if (doc.cloudinaryUrl) {
      window.open(doc.cloudinaryUrl, "_blank");
    } else {
      toast.error("Download URL not available.");
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="LegalSaathi"
              width={28}
              height={28}
              unoptimized
              priority
              className="w-7 h-7"
            />
            <span className="font-bold text-xl">LegalSaathi</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document History</h1>
            <p className="text-muted-foreground mt-1">
              All your analyzed documents in one place
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {pagination.total || 0} Documents
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents or summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="py-20 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">
                {search ? "No documents match your search." : "No documents found."}
              </p>
              <Link href="/analyze">
                <Button className="mt-5" size="sm">
                  Upload New Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((doc) => (
              <Card
                key={doc._id}
                className="border border-border hover:border-primary/50 transition-all"
              >
                <CardContent className="pt-5 pb-4">

                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {doc.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {doc.analysis?.category && (
                            <Badge
                              className={`text-xs px-2 py-0 ${categoryColor[doc.analysis.category] || ""}`}
                            >
                              {doc.analysis.category}
                            </Badge>
                          )}
                          {doc.analysis?.riskLevel && (
                            <Badge
                              className={`text-xs px-2 py-0 ${riskColor[doc.analysis.riskLevel]}`}
                            >
                              Risk: {doc.analysis.riskLevel}
                            </Badge>
                          )}
                          <Badge
                            className={`text-xs px-2 py-0 ${statusColor[doc.status] || ""}`}
                          >
                            {doc.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.createdAt).toLocaleDateString("ne-NP")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {doc.fileSizeMB}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {doc.status === "analyzed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(expandedId === doc._id ? null : doc._id)
                          }
                          className="gap-1 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          {expandedId === doc._id ? "Hide" : "View"}
                        </Button>
                      )}
                      {doc.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(doc._id)}
                          disabled={retryingId === doc._id}
                          className="gap-1 text-xs text-yellow-600"
                        >
                          {retryingId === doc._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc._id)}
                        disabled={deletingId === doc._id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === doc._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Summary */}
                  {expandedId === doc._id && doc.analysis && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          📄 Summary
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {doc.analysis.summary}
                        </p>
                      </div>

                      {doc.analysis.rights?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            ⚖️ Your Rights
                          </p>
                          <ul className="space-y-1">
                            {doc.analysis.rights.map((right, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                {right}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {doc.analysis.lawsCited?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {doc.analysis.lawsCited.map((law, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              📚 {law}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}