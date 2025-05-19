import api from '../lib/axios';

export interface SyntheticChatLog {
  id?: string;
  userId?: string;
  agentName: string;
  shift: string;
  scenario: string;
  chatlog: string;
  escalated: boolean;
  customerSatisfaction?: number;
  performanceTrajectory: string;
  startTime: Date;
  endTime: Date;
  metadata?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
}

/**
 * Get all synthetic chat logs for the current authenticated user
 */
export const getUserSyntheticChatLogs = async (): Promise<SyntheticChatLog[]> => {
  try {
    const response = await api.get<SyntheticChatLog[]>('/synthetic-chat-logs');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching synthetic chat logs:', error);
    // Check for specific error types
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to access these chat logs.');
    } else if (error.response?.status === 404) {
      throw new Error('No chat logs found.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to load chat logs. Please try again.');
    }
  }
};

/**
 * Save multiple synthetic chat logs for the current authenticated user
 */
export const saveSyntheticChatLogs = async (
  chatLogs: Omit<SyntheticChatLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
): Promise<SyntheticChatLog[]> => {
  try {
    const response = await api.post<SyntheticChatLog[]>('/synthetic-chat-logs', chatLogs);
    return response.data;
  } catch (error: any) {
    console.error('Error saving synthetic chat logs:', error);
    // Check for specific error types
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to save chat logs.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to save chat logs. Please try again.');
    }
  }
};

/**
 * Delete a synthetic chat log
 */
export const deleteSyntheticChatLog = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`/synthetic-chat-logs/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting synthetic chat log:', error);
    // Check for specific error types
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this chat log.');
    } else if (error.response?.status === 404) {
      throw new Error('Chat log not found.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to delete chat log. Please try again.');
    }
  }
};

/**
 * Delete all synthetic chat logs for the current authenticated user
 */
export const deleteAllSyntheticChatLogs = async (): Promise<void> => {
  try {
    await api.delete('/synthetic-chat-logs');
  } catch (error: any) {
    console.error('Error deleting all synthetic chat logs:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete chat logs');
  }
}; 