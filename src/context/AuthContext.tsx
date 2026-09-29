import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // loading saat cek sesi

  // Cek sesi yang tersimpan saat aplikasi pertama kali dimuat
  useEffect(() => {
    const savedToken = localStorage.getItem('amt_erp_token');
    const savedUser = localStorage.getItem('amt_erp_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        // Set token ke axios interceptor
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch {
        // Data korup, hapus sesi lama
        localStorage.removeItem('amt_erp_token');
        localStorage.removeItem('amt_erp_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success && res.data.data) {
        const { token: jwtToken, user: loggedInUser } = res.data.data;
        setToken(jwtToken);
        setUser(loggedInUser);
        localStorage.setItem('amt_erp_token', jwtToken);
        localStorage.setItem('amt_erp_user', JSON.stringify(loggedInUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        return true;
      }
      return false;
    } catch (err: any) {
      // Lempar error agar halaman login bisa menampilkan pesan error spesifik
      const message = err?.response?.data?.message || 'Terjadi kesalahan pada server';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('amt_erp_token');
    localStorage.removeItem('amt_erp_user');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
