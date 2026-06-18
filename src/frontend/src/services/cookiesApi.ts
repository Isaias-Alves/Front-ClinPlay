import axios from "axios";

export const apiComCookies = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://clinplay-api.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default apiComCookies;
