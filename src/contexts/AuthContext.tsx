import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

export type Role = 'agent' | 'team_leader' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  teamLeaderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  updateUser: (user: User) => void;
  isTeamLeader: boolean;
  isManager: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeamLeader = user?.role === 'team_leader';
  const isManager = user?.role === 'admin';
  const isAgent = user?.role === 'agent';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get<User>('/api/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: unknown) {
      if (isApiError(error)) {
        setError(error.response?.data?.message || 'Login failed');
      } else {
        setError('Login failed');
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: Role) => {
    try {
      setError(null);
      const response = await api.post<AuthResponse>('/api/auth/signup', { email, password, name, role });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: unknown) {
      if (isApiError(error)) {
        setError(error.response?.data?.message || 'Signup failed');
      } else {
        setError('Signup failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        signup, 
        logout, 
        error, 
        updateUser,
        isTeamLeader,
        isManager,
        isAgent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface ApiErrorResponse {
  response?: {
    data: {
      message: string;
    };
  };
}

function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ApiErrorResponse).response === 'object' &&
    (error as ApiErrorResponse).response !== null &&
    'data' in (error as ApiErrorResponse).response
  );
} 