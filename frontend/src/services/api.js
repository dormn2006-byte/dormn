import axios from "axios";

const API_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:8000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

// CRITICAL FIX: The IMAGE_BASE_URL must match the API_URL exactly.
// Do NOT remove "/api" because your server.js is serving images at /api/uploads 
export const IMAGE_BASE_URL = API_URL;
  
// Add token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// Handle expired / invalid token responses automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || "";
      const isTokenIssue =
        msg.includes("Invalid or expired token") ||
        msg.includes("Not authorized") ||
        msg.includes("jwt expired");
      if (isTokenIssue) {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } catch {}
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dormn_session_expired", { detail: msg }));
          const currentPath = window.location.pathname;
          // Avoid redirect loop if already on auth page
          if (!currentPath.startsWith("/auth")) {
            const redirectUrl = encodeURIComponent(currentPath + window.location.search);
            window.location.href = `/auth?redirect=${redirectUrl}&expired=true`;
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;