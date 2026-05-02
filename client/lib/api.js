// ─── Base Configuration ───────────────────────────────────────
const NODE_API = process.env.NEXT_PUBLIC_NODE_API_URL || "http://localhost:5001/api";
const AI_API = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

// ─── Core Fetch Wrapper ───────────────────────────────────────
const apiFetch = async (url, options = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const defaultHeaders = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// ─── AUTH APIs ────────────────────────────────────────────────
export const registerUser = async ({ fullName, email, phone, password }) => {
  const data = await apiFetch(`${NODE_API}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ fullName, email, phone, password }),
  });
  if (data.token) localStorage.setItem("token", data.token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const loginUser = async ({ email, password }) => {
  const data = await apiFetch(`${NODE_API}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) localStorage.setItem("token", data.token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const logoutUser = async () => {
  try {
    await fetch(`${NODE_API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

export const getMe = async () => {
  return await apiFetch(`${NODE_API}/auth/me`);
};

export const updateProfile = async ({ fullName, phone, preferredLanguage }) => {
  return await apiFetch(`${NODE_API}/auth/profile`, {
    method: "PUT",
    body: JSON.stringify({ fullName, phone, preferredLanguage }),
  });
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  return await apiFetch(`${NODE_API}/auth/change-password`, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// ─── Google OAuth ─────────────────────────────────────────────
export const initiateGoogleLogin = () => {
  // Use full backend URL directly — not through Next.js API
  window.location.href = `${NODE_API}/auth/google`;
};

// ─── DOCUMENT APIs ────────────────────────────────────────────
export const analyzeDocument = async (formData) => {
  return await apiFetch(`${NODE_API}/documents/analyze`, {
    method: "POST",
    body: formData,
  });
};

export const getUserDocuments = async ({
  page = 1,
  limit = 10,
  category,
  status,
  search,
} = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (category) params.append("category", category);
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  return await apiFetch(`${NODE_API}/documents?${params}`);
};

export const getDocumentById = async (id) => {
  return await apiFetch(`${NODE_API}/documents/${id}`);
};

export const deleteDocument = async (id) => {
  return await apiFetch(`${NODE_API}/documents/${id}`, {
    method: "DELETE",
  });
};

export const retryAnalysis = async (id) => {
  return await apiFetch(`${NODE_API}/documents/${id}/retry`, {
    method: "POST",
  });
};

// ─── LEGAL APIs ───────────────────────────────────────────────
export const askLegalQuestion = async ({
  question,
  language = "ne",
  history = [],
}) => {
  return await apiFetch(`${NODE_API}/legal/ask`, {
    method: "POST",
    body: JSON.stringify({ question, language, history }),
  });
};

export const getRightsByCategory = async ({ category, language = "ne" }) => {
  return await apiFetch(`${NODE_API}/legal/rights`, {
    method: "POST",
    body: JSON.stringify({ category, language }),
  });
};

export const searchLegalCorpus = async ({
  query,
  language = "ne",
  topK = 5,
}) => {
  return await apiFetch(`${NODE_API}/legal/search`, {
    method: "POST",
    body: JSON.stringify({ query, language, top_k: topK }),
  });
};

export const getLegalCategories = async () => {
  return await apiFetch(`${NODE_API}/legal/categories`);
};

export const checkLegalStatement = async ({
  statement,
  language = "ne",
}) => {
  return await apiFetch(`${NODE_API}/legal/check`, {
    method: "POST",
    body: JSON.stringify({ statement, language }),
  });
};

// ─── UTILITY HELPERS ─────────────────────────────────────────
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("token")) return true;
  const cookies = document.cookie.split(";");
  return cookies.some((c) => c.trim().startsWith("token="));
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const localUser = localStorage.getItem("user");
    if (localUser) return JSON.parse(localUser);
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find((c) =>
      c.trim().startsWith("user_info=")
    );
    if (userCookie) {
      const value = decodeURIComponent(userCookie.split("=")[1]);
      return JSON.parse(value);
    }
    return null;
  } catch {
    return null;
  }
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const decodeToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const isTokenExpired = () => {
  const cookies = document.cookie.split(";");
  const hasTokenCookie = cookies.some((c) =>
    c.trim().startsWith("token=")
  );
  if (hasTokenCookie) return false;
  const decoded = decodeToken();
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};