import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
  username: string;
}

interface Profile {
  id: number;
  user: User;
  display_name: string;
  handicap_index: string;
  ghin_id: string | null;
  profile_picture: string | null;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  date_of_birth: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileIncomplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const userResponse = await api.get('/auth/me/');
      setUser(userResponse.data);

      try {
        const profileResponse = await api.get('/auth/me/profile/');
        setProfile(profileResponse.data);
        const isIncomplete = !profileResponse.data.display_name || profileResponse.data.display_name.trim() === '';
        setProfileIncomplete(isIncomplete);
      } catch (profileError) {
        console.warn('Profile not found, user may need to complete profile setup');
        setProfile(null);
        setProfileIncomplete(true);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    await refreshUser();
  };

  const register = async (email: string, password: string, password2: string) => {
    await api.post('/auth/register/', { email, password, password2 });
    await login(email, password);
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    const response = await api.put('/auth/me/profile/', data);
    setProfile(response.data);
  };

  const value = {
    user,
    profile,
    loading,
    profileIncomplete,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
