import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    refreshUser();
  }, []);

  const signin = async (credentials) => {
    const response = await api.post("/auth/signin", credentials);
    setUser(response.data.user);
    return response.data;
  };

  const signup = async (details) => {
    const response = await api.post("/auth/signup", details);
    return response.data;
  };

  const googleSignin = async (idToken) => {
    const response = await api.post("/auth/google", { idToken });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signin, signup, googleSignin, logout, refreshUser }}
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
