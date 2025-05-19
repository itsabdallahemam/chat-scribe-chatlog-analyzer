export type Role = 'Manager' | 'Team Leader' | 'Agent';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  team?: Team;
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

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leader: User;
  agents: User[];
  createdAt: string;
  updatedAt: string;
}