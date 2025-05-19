import api from '../lib/axios';
import { getUserSyntheticChatLogs } from './syntheticChatLogService';

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
    // Get synthetic chat logs
    const syntheticLogs = await getUserSyntheticChatLogs();
    
    if (syntheticLogs.length === 0) {
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

    // Calculate metrics from synthetic logs
    let totalCoherence = 0;
    let totalPoliteness = 0;
    let totalRelevance = 0;
    let totalResolution = 0;
    let totalResponseTime = 0;

    syntheticLogs.forEach(log => {
      try {
        if (log.metadata) {
          const metadata = JSON.parse(log.metadata);
          totalCoherence += metadata.coherence || 0;
          totalPoliteness += metadata.politeness || 0;
          totalRelevance += metadata.relevance || 0;
          totalResolution += metadata.resolution || 0;
        }
        
        // Calculate response time in minutes
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        totalResponseTime += (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      } catch (error) {
        console.error('Error processing log metadata:', error);
      }
    });

    const totalLogs = syntheticLogs.length;
    const coherence = totalCoherence / totalLogs;
    const politeness = totalPoliteness / totalLogs;
    const relevance = totalRelevance / totalLogs;
    const resolution = totalResolution / totalLogs;
    const averageResponseTime = totalResponseTime / totalLogs;

    // Calculate weighted average score
    const averageScore = (
      (coherence * 0.25) + 
      (politeness * 0.2) + 
      (relevance * 0.25) + 
      (resolution * 0.3)
    );

    return {
      coherence,
      politeness,
      relevance,
      resolution,
      averageScore,
      totalEvaluations: totalLogs,
      totalConversations: totalLogs,
      averageResponseTime
    };
  } catch (error: any) {
    console.error('[PerformanceService] Error calculating performance metrics:', error);
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