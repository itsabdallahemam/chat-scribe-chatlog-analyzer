import api from '../lib/axios';

export interface PerformanceMetrics {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  averageScore: number;
  totalEvaluations: number;
}

export const getUserPerformanceMetrics = async (userId?: string): Promise<PerformanceMetrics> => {
  try {
    // If userId is provided, fetch that user's metrics
    // Otherwise get the current user's metrics
    const endpoint = userId ? `/performance/agent/${userId}` : '/performance/me';
    console.log('Fetching performance metrics from:', endpoint);
    const response = await api.get<PerformanceMetrics>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    // Return default values if API call fails
    return {
      coherence: 0,
      politeness: 0,
      relevance: 0,
      resolution: 0,
      averageScore: 0,
      totalEvaluations: 0
    };
  }
};

// For development/testing, since we may not have a real backend yet
export const getMockPerformanceMetrics = (): PerformanceMetrics => {
  return {
    coherence: 4.2,
    politeness: 4.7,
    relevance: 3.9,
    resolution: 4.5,
    averageScore: 4.325,
    totalEvaluations: 42
  };
}; 