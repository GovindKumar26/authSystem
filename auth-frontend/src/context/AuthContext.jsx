import { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { setupInterceptors } from "../api/axiosInterceptor";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(null);

  const getAccessToken = () => tokenRef.current;

  const updateAccessToken = (token) => {
    tokenRef.current = token;
    setAccessToken(token);
  };

  // -------------------------
  // Login
  // -------------------------
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    updateAccessToken(data.accessToken);
    setUser(data.user);

    return data;
  };

  // -------------------------
  // Register
  // -------------------------
  const register = async ({ name, email, password }) => {
    await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return login(email, password);
  };

  // -------------------------
  // Refresh Access Token
  // -------------------------
  const refreshToken = async () => {
    try {
      const { data } = await api.post("/auth/refresh");

      // setAccessToken(data.accessToken);
      updateAccessToken(data.accessToken);
      // api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

      return data.accessToken;
    } catch (err) {
      updateAccessToken(null);
      setUser(null);

      throw err;
    }
  };
  // -------------------------
  // Get Logged In User
  // -------------------------
  const getCurrentUser = async () => {
    try {
      const { data } = await api.get("/auth/me");

      setUser(data.user);
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  // -------------------------
  // Logout
  // -------------------------
  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { _skipAuth: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    updateAccessToken(null);
    setUser(null);
  };

  // -------------------------
  // Restore Session on Refresh
  // -------------------------
  useEffect(() => {
    setupInterceptors({
      getAccessToken,
      updateAccessToken,
      logout,
    });

    const restoreSession = async () => {
      try {
        await refreshToken();
        await getCurrentUser();
      } catch (_) {
        // User is not logged in
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        refreshToken,
        getCurrentUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
