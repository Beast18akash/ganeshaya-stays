import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckStarted = useRef(false);

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      return response.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthRoute || sessionCheckStarted.current) return undefined;

    const timeoutId = setTimeout(() => {
      if (!sessionCheckStarted.current) {
        sessionCheckStarted.current = true;
        void refreshUser();
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isAuthRoute]);

  const signin = async (credentials) => {
    const response = await api.post("/auth/signin", credentials);
    sessionCheckStarted.current = true;
    setUser(response.data.user);
    setLoading(false);
    return response.data;
  };

  const signup = async (details) => {
    const response = await api.post("/auth/signup", details);
    return response.data;
  };

  const googleSignin = async (idToken) => {
    const response = await api.post("/auth/google", { idToken });
    sessionCheckStarted.current = true;
    setUser(response.data.user);
    setLoading(false);
    return response.data;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading: isAuthRoute ? false : loading, signin, signup, googleSignin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
