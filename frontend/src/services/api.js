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

export default API;