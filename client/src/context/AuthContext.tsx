import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import api from "../api";

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  designation: string;
  department: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  email?: string;
  employeeId?: number | null;
  employee?: Employee | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateEmail: (email: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  changePassword: async () => false,
  updateEmail: async () => false,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || document.cookie.includes("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await api.get("/auth/me");
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
    if (response.data?.success) {
      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);
    } else {
      throw new Error(response.data?.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem("token");
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await api.put("/auth/me/password", { currentPassword, newPassword });
      return res.data?.success === true;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const updateEmail = async (email: string): Promise<boolean> => {
    try {
      const res = await api.put("/auth/me/email", { email });
      if (res.data?.success) {
        setUser((prev) => (prev ? { ...prev, email } : prev));
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || "Failed to update email");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, updateEmail, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
