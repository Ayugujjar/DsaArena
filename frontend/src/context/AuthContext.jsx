import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authAPI.getMe();
        if (res.success) {
          setUser(res.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success) {
      setUser(res.user);
      return res;
    }
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.success) {
      setUser(res.user);
      return res;
    }
  };

  const logout = (invalidateSession = true) => {
    if (invalidateSession) {
      authAPI.logout().catch((error) => console.error('Failed to invalidate student session:', error));
    }
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
