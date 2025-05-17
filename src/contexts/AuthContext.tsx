import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { User, AuthResponse } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  updateUser: (user: User) => void;
  setTestUser: (role: string) => void; // For testing different user roles
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider initialized, checking auth state...");
    checkAuth();
  }, []);

  // This function adds logging to help debug authentication issues
  const checkAuth = async () => {
    try {
      console.log("Checking auth token...");
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log("Token found, verifying user...");
        try {
          const response = await api.get<User>('/auth/me');
          console.log("User data received:", response.data);
          setUser(response.data);
          console.log("Auth state updated with user data");
        } catch (apiError) {
          console.error("API error during auth check:", apiError);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log("No token found, user not authenticated");
        setUser(null);
      }
    } catch (error) {
      console.error("Error during auth check:", error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      console.log("Auth loading complete");
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log(`Attempting login for email: ${email}`);
      setError(null);
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      const { token, user } = response.data;
      console.log("Login successful, user data:", user);
      localStorage.setItem('token', token);
      setUser(user);
      console.log(`User authenticated with role: ${user.role}`);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    try {
      console.log(`Attempting signup for email: ${email}, role: ${role}`);
      setError(null);
      const response = await api.post<AuthResponse>('/auth/signup', { email, password, name, role });
      const { token, user } = response.data;
      console.log("Signup successful, user data:", user);
      localStorage.setItem('token', token);
      setUser(user);
      console.log(`User created with role: ${user.role}`);
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.response?.data?.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      localStorage.removeItem('token');
      setUser(null);
      console.log("User logged out successfully");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    console.log("Updating user data:", updatedUser);
    setUser(updatedUser);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
    try {
      console.log("Changing password for user");
      setError(null);
      const response = await api.put<{message: string}>('/auth/change-password', { currentPassword, newPassword });
      console.log("Password changed successfully");
      return response.data.message;
    } catch (error: any) {
      console.error("Password change error:", error);
      const errorMsg = error.response?.data?.message || 'Password change failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // For testing different user roles without backend
  const setTestUser = (role: string) => {
    console.log(`Setting test user with role: ${role}`);
    const testUser: User = {
      id: 'test-user-id',
      email: `test-${role.toLowerCase()}@example.com`,
      fullName: `Test ${role}`,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('token', 'test-token');
    setUser(testUser);
    console.log("Test user set:", testUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      error, 
      updateUser,
      setTestUser,
      changePassword
    }}>
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