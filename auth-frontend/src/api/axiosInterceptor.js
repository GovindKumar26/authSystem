import api from "./axios";

let refreshPromise = null;

export function setupInterceptors({
  getAccessToken,
  updateAccessToken,
  logout,
}) {
  // Attach JWT to every request
  api.interceptors.request.use((config) => {
    if (config._skipAuth) {
      return config;
    }

    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // Handle expired access token
  api.interceptors.response.use(
    (response) => response,

    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest?._retry &&
        !originalRequest?._skipAuth &&
        originalRequest?.url !== "/auth/refresh"
      ) {
        originalRequest._retry = true;

        try {
          // Prevent multiple refresh requests
          if (!refreshPromise) {
            refreshPromise = api
              .post("/auth/refresh", {}, { _skipAuth: true })
              .then((res) => {
                updateAccessToken(res.data.accessToken);
                return res.data.accessToken;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }

          const newToken = await refreshPromise;

          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return api(originalRequest);
        } catch (err) {
          await logout();
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    },
  );
}
