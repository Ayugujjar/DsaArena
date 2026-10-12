import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await adminAuthAPI.getMe();
        if (res.success) {
          setAdmin(res.admin);
        }
      } catch {
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const login = async (email, password) => {
    const res = await adminAuthAPI.login({ email, password });
    if (res.success) {
      setAdmin(res.admin);
      return res;
    }
  };

  const logout = () => {
    adminAuthAPI.logout().catch((error) => console.error('Failed to invalidate admin session:', error));
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: !!admin,
        isSuperAdmin: admin?.role === 'Super Admin',
        isAdminOrAbove: admin?.role === 'Super Admin' || admin?.role === 'Admin',
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
