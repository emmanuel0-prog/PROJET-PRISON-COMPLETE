import axios from "axios";

// =======================================
// 🌍 CONFIG API (PRODUCTION + DEV)
// =======================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://167.71.2.177:8000/api/";

// =======================================
// 🔥 API PRINCIPALE
// =======================================

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

        const response = await axios.post(
          `${API_BASE_URL}users/token/refresh/`,
          { refresh }
        );

        const newAccess = response.data.access;

        localStorage.setItem("access", newAccess);

        api.defaults.headers.Authorization = `Bearer ${newAccess}`;

        onRefreshed(newAccess);

        return api(originalRequest);

      } catch (err) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        window.location.href = "/login";
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
