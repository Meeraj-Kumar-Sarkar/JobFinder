import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, type User } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email?: string; password?: string; idToken?: string }) => Promise<User>;
  register: (data: Record<string, any>) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("jobportal_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("jobportal_token");
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Validate token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("jobportal_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("jobportal_user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Token is invalid
        localStorage.removeItem("jobportal_token");
        localStorage.removeItem("jobportal_user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email?: string; password?: string; idToken?: string }) => {
    const res = await authApi.login(credentials);
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem("jobportal_token", receivedToken);
    localStorage.setItem("jobportal_user", JSON.stringify(receivedUser));

    return receivedUser;
  };

  const register = async (data: Record<string, any>) => {
    const res = await authApi.register(data);
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem("jobportal_token", receivedToken);
    localStorage.setItem("jobportal_user", JSON.stringify(receivedUser));

    return receivedUser;
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem("jobportal_token");
    localStorage.removeItem("jobportal_user");
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("jobportal_user", JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
