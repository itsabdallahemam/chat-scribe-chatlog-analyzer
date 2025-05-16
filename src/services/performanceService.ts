import api from '../lib/axios';

export interface PerformanceMetrics {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  averageScore: number;
  totalEvaluations: number;
  totalConversations: number;
  averageResponseTime: number;
}

export const getUserPerformanceMetrics = async (userId?: string): Promise<PerformanceMetrics> => {
  try {
    // If userId is provided, fetch that user's metrics
    // Otherwise get the current user's metrics
    const endpoint = userId ? `/performance/agent/${userId}` : '/performance/me';
    console.log('[PerformanceService] Fetching performance metrics from:', endpoint);
    
    // Add request info logging
    const token = localStorage.getItem('token');
    console.log('[PerformanceService] Authorization header present:', !!token);
    
    const response = await api.get<PerformanceMetrics>(endpoint);
    console.log('[PerformanceService] API response status:', response.status);
    console.log('[PerformanceService] API response data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[PerformanceService] Error fetching performance metrics:', error);
    console.log('[PerformanceService] Error details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Check if this is a 404 (no data found)
    if (error.response?.status === 404 && error.response?.data?.message === 'No evaluations found for this user') {
      console.log('[PerformanceService] No evaluations found for user - this is expected for new users');
    }
    
    // Return default values if API call fails
    return {
      coherence: 0,
      politeness: 0,
      relevance: 0,
      resolution: 0,
      averageScore: 0,
      totalEvaluations: 0,
      totalConversations: 0,
      averageResponseTime: 0
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
    totalEvaluations: 42,
    totalConversations: 74,
    averageResponseTime: 2.5
  };
}; 