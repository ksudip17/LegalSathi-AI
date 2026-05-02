"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  FileText,
  MessageCircle,
  Shield,
  History,
  Upload,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getStoredUser,
  logoutUser,
  getUserDocuments,
  getMe,
} from "@/lib/api";

const quickActions = [
  {
    icon: Upload,
    title: "Analyze Document",
    desc: "Upload a legal document for AI analysis",
    href: "/analyze",
    badge: "Popular",
  },
  {
    icon: MessageCircle,
    title: "Ask a Question",
    desc: "Get answers to your legal questions",
    href: "/ask",
    badge: null,
  },
  {
    icon: Shield,
    title: "Know Your Rights",
    desc: "Explore rights by category",
    href: "/ask?mode=rights",
    badge: "New",
  },
  {
    icon: History,
    title: "View History",
    desc: "See all your past documents",
    href: "/history",
    badge: null,
  },
  {
  icon: Search,
  title: "Is This Legal?",
  desc: "Check if any situation is legal under Nepal law",
  href: "/legal-check",
  badge: "New ✨",
},
];

const riskColor = {
  Low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // ─── Load Dashboard ─────────────────────────────────────────
  const loadDashboard = async () => {
    try {
      // Step 1 — Handle Google OAuth cookie on first load
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "google") {
        const cookies = document.cookie.split(";");
        const userCookie = cookies.find((c) =>
          c.trim().startsWith("user_info=")
        );
        if (userCookie) {
          const value = decodeURIComponent(userCookie.split("=")[1]);
          const googleUser = JSON.parse(value);
          localStorage.setItem("user", JSON.stringify(googleUser));
          localStorage.setItem("token", "google_auth");
          setUser(googleUser);
          setLoading(false);
        }
        window.history.replaceState({}, "", "/dashboard");
      }

      // Step 2 — Show stored user immediately
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false);
      }

      // Step 3 — Fetch fresh data in background
      const [meData, docsData] = await Promise.all([
        getMe(),
        getUserDocuments({ limit: 3 }),
      ]);

      setUser(meData.user);
      localStorage.setItem("user", JSON.stringify(meData.user));
      setRecentDocs(docsData.documents || []);

    } catch (error) {
      console.error("Dashboard error:", error.message);
      if (
        error.message.includes("401") ||
        error.message.includes("token") ||
        error.message.includes("Access denied")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const init = async () => {
    try {
      // Step 1 — Handle Google OAuth cookie on first load
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "google") {
        const cookies = document.cookie.split(";");
        const userCookie = cookies.find((c) =>
          c.trim().startsWith("user_info=")
        );
        if (userCookie) {
          const value = decodeURIComponent(userCookie.split("=")[1]);
          const googleUser = JSON.parse(value);
          localStorage.setItem("user", JSON.stringify(googleUser));
          localStorage.setItem("token", "google_auth");
          setUser(googleUser);
          setLoading(false);
        }
        window.history.replaceState({}, "", "/dashboard");
      }

      // Step 2 — Show stored user immediately
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setLoading(false);
      }

      // Step 3 — Fetch fresh data in background
      const [meData, docsData] = await Promise.all([
        getMe(),
        getUserDocuments({ limit: 3 }),
      ]);

      setUser(meData.user);
      localStorage.setItem("user", JSON.stringify(meData.user));
      setRecentDocs(docsData.documents || []);

    } catch (error) {
      console.error("Dashboard error:", error.message);
      if (
        error.message.includes("401") ||
        error.message.includes("Access denied")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  init();
}, []);

  const stats = [
    {
      icon: FileText,
      label: "Documents Analyzed",
      value: user?.documentsAnalyzed || 0,
      color: "text-blue-500",
    },
    {
      icon: MessageCircle,
      label: "Questions Asked",
      value: user?.questionsAsked || 0,
      color: "text-green-500",
    },
    {
      icon: TrendingUp,
      label: "Rights Explored",
      value: "∞",
      color: "text-purple-500",
    },
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="text-primary w-6 h-6" />
            <span className="font-bold text-xl">LegalSaathi</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-8 h-8 rounded-full border border-border"
              />
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={logoutUser}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            What legal matter can we help you with today?
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg legal-gradient flex items-center justify-center">
                        <action.icon className="text-white w-5 h-5" />
                      </div>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {action.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Documents
            </h2>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Card className="border border-border">
            {recentDocs.length === 0 ? (
              <CardContent className="py-16 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No documents analyzed yet.</p>
                <Link href="/analyze">
                  <Button className="mt-4" size="sm">
                    Upload Your First Document
                  </Button>
                </Link>
              </CardContent>
            ) : (
              <CardContent className="pt-6 space-y-4">
                {recentDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {doc.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {doc.analysis?.category || "Other"}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.createdAt).toLocaleDateString("en-US")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${riskColor[doc.analysis?.riskLevel] || ""}`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}