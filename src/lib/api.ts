import axios from 'axios';

/* =======================
   ADMIN API (unchanged)
======================= */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/admin`,
  withCredentials: true,
});

/* =======================
   MOBILE API (new)
======================= */
export const mobileApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/mobile`,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest.url || "";

    const isRefreshEndpoint = url.includes("/auth/refresh-token");
    const isLogoutEndpoint = url.includes("/auth/logout");

    if (isRefreshEndpoint || isLogoutEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      const userInfo = localStorage.getItem('user_info');

      if (!userInfo) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh-token', {});
        
        isRefreshing = false;
        processQueue(null, 'token');

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        localStorage.removeItem('user_info');

        if (
          window.location.pathname !== '/' &&
          !window.location.pathname.includes('/login')
        ) {
          window.location.href = '/';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/* 🔥 OPTIONAL: if you want same interceptor for mobile also */
mobileApi.interceptors.response = api.interceptors.response;

export default api;
