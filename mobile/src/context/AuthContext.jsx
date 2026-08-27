import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('klaso_token');
        const savedUser = await AsyncStorage.getItem('klaso_user');
        
        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
        
        if (savedToken) {
          api.get('/auth/me')
            .then((userData) => {
              setUser(userData);
              AsyncStorage.setItem('klaso_user', JSON.stringify(userData));
            })
            .catch(() => {
              logout();
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const loginUser = async (authData) => {
    try {
      await AsyncStorage.setItem('klaso_token', authData.access_token);
      await AsyncStorage.setItem('klaso_user', JSON.stringify(authData.user));
      setToken(authData.access_token);
      setUser(authData.user);
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('klaso_token');
      await AsyncStorage.removeItem('klaso_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth data', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
