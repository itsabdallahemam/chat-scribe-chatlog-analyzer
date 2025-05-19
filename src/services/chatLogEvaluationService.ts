import api from '../lib/axios';
import { getUserSyntheticChatLogs } from './syntheticChatLogService';
import { mapSyntheticToEvaluation } from './evaluationMapperService';

export interface ChatLogEvaluation {
  id?: string;
  userId?: string;
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  shift?: string;
  dateTime?: string;
  createdAt?: string;
  updatedAt?: string;
  model?: string;
  status?: 'Completed' | 'In Progress' | 'Failed';
  feedback?: string;
}

/**
 * Get all chat log evaluations for the current authenticated user
 */
export const getUserChatLogEvaluations = async (): Promise<ChatLogEvaluation[]> => {
  try {
    // Get synthetic chat logs and convert them to evaluation format
    const syntheticLogs = await getUserSyntheticChatLogs();
    return mapSyntheticToEvaluation(syntheticLogs);
  } catch (error) {
    console.error('Error fetching chat log evaluations:', error);
    throw error;
  }
};

/**
 * Get all chat log evaluations for a specific user by user ID
 * This is used by team leaders to view agent evaluations
 */
export const getAgentChatLogEvaluations = async (userId: string): Promise<ChatLogEvaluation[]> => {
  try {
    // For now, we'll use the same synthetic data for all agents
    const syntheticLogs = await getUserSyntheticChatLogs();
    return mapSyntheticToEvaluation(syntheticLogs);
  } catch (error) {
    console.error(`Error fetching chat log evaluations for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Save multiple chat log evaluations for the current authenticated user
 * This will replace all existing evaluations
 */
export const saveChatLogEvaluations = async (
  evaluations: Omit<ChatLogEvaluation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
): Promise<ChatLogEvaluation[]> => {
  try {
    const response = await api.post<ChatLogEvaluation[]>('/chat-log-evaluations', evaluations);
    return response.data;
  } catch (error) {
    console.error('Error saving chat log evaluations:', error);
    throw error;
  }
};

/**
 * Delete a chat log evaluation for the current authenticated user
 */
export const deleteChatLogEvaluation = async (
  id: string
): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`/chat-log-evaluations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat log evaluation:', error);
    throw error;
  }
};

/**
 * Delete all chat log evaluations for the current authenticated user
 */
export const deleteAllChatLogEvaluations = async (): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>('/chat-log-evaluations');
    return response.data;
  } catch (error) {
    console.error('Error deleting all chat log evaluations:', error);
    throw error;
  }
}; 