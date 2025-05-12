export interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
}

export interface UserFeature {
  id: string;
  userId: string;
  featureName: string;
  featureValue: string;
  createdAt: string;
  updatedAt: string;
} 