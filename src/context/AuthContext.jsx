import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cctv_auth_token');
    const savedUser = localStorage.getItem('cctv_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token with /api/auth/me
        api.get('/auth/me')
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem('cctv_user', JSON.stringify(res.data.user));
          })
          .catch(() => {
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('cctv_auth_token', token);
    localStorage.setItem('cctv_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('cctv_auth_token');
    localStorage.removeItem('cctv_user');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'Admin';
  const isOperator = () => user?.role === 'Admin' || user?.role === 'Operator';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isOperator }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
