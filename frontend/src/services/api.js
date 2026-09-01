import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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