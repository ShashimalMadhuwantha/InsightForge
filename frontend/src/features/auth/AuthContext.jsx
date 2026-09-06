import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const accessToken = localStorage.getItem('insightforge_access_token');
    const refreshToken = localStorage.getItem('insightforge_refresh_token');

    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    try {
      if (accessToken) {
        const res = await authService.getMe();
        setUser(res.data.user);
        setTenant(res.data.tenant);
      }
    } catch {
      // Attempt refresh if access token expired
      if (refreshToken) {
        try {
          const refreshRes = await authService.refresh(refreshToken);
          localStorage.setItem('insightforge_access_token', refreshRes.data.accessToken);
          localStorage.setItem('insightforge_refresh_token', refreshRes.data.refreshToken);
          const userRes = await authService.getMe();
          setUser(userRes.data.user);
          setTenant(userRes.data.tenant);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: loggedInUser, tenant: loggedInTenant, tokens } = res.data;

    localStorage.setItem('insightforge_access_token', tokens.accessToken);
    localStorage.setItem('insightforge_refresh_token', tokens.refreshToken);

    setUser(loggedInUser);
    setTenant(loggedInTenant);
    return res.data;
  };

  const signup = async (formData) => {
    const res = await authService.signup(formData);
    const { user: newUser, tenant: newTenant, tokens } = res.data;

    localStorage.setItem('insightforge_access_token', tokens.accessToken);
    localStorage.setItem('insightforge_refresh_token', tokens.refreshToken);

    setUser(newUser);
    setTenant(newTenant);
    return res.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('insightforge_refresh_token');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('insightforge_access_token');
      localStorage.removeItem('insightforge_refresh_token');
      setUser(null);
      setTenant(null);
    }
  };

  const updateTenantState = (newTenantData) => {
    setTenant((prev) => ({ ...prev, ...newTenantData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateTenantState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
