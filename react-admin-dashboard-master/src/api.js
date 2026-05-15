import axios from "axios";

// =======================================
// 🌍 CONFIG API (PRODUCTION + DEV)
// =======================================

// 🔥 URL DU BACKEND DJANGO
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://167.71.2.177:8000/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================================
// 🔐 INTERCEPTOR REQUEST
// =======================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =======================================
// 🔄 REFRESH TOKEN AUTO
// =======================================
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// =======================================
// ⚠️ RESPONSE INTERCEPTOR
// =======================================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // 🔴 TOKEN EXPIRÉ
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // 🔄 SI REFRESH DÉJÀ EN COURS
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refresh = localStorage.getItem("refresh");

        // 🔥 REFRESH TOKEN
        const response = await axios.post(
          `${API_BASE_URL}users/token/refresh/`,
          {
            refresh,
          }
        );

        const newAccess = response.data.access;

        // 💾 SAVE NEW TOKEN
        localStorage.setItem("access", newAccess);

        // 🔥 UPDATE HEADERS
        api.defaults.headers.Authorization = `Bearer ${newAccess}`;

        // 🔄 RELANCER LES REQUÊTES
        onRefreshed(newAccess);

        // 🔁 REJOUER REQUÊTE
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);

      } catch (err) {

        // ❌ SESSION EXPIRÉE
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        // 🔥 REDIRECTION LOGIN
        window.location.href = "http://167.71.2.177:5173/login";
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;