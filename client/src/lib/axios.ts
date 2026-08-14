import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Firebase ID token to every request safely
api.interceptors.request.use(async (config) => {
  try {
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Could not retrieve Firebase token:", err);
  }
  return config;
});

export default api;
