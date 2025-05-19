import { SyntheticChatLog } from './syntheticChatLogService';
import { ChatLogEvaluation } from './chatLogEvaluationService';

/**
 * Convert synthetic chat logs to evaluation format
 */
export const mapSyntheticToEvaluation = (syntheticLogs: SyntheticChatLog[]): ChatLogEvaluation[] => {
  return syntheticLogs.map(log => {
    // Parse metadata to get evaluation scores
    let coherence = 0, politeness = 0, relevance = 0, resolution = 0;
    try {
      if (log.metadata) {
        const metadata = JSON.parse(log.metadata);
        coherence = metadata.coherence || 0;
        politeness = metadata.politeness || 0;
        relevance = metadata.relevance || 0;
        resolution = metadata.resolution || 0;
      }
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }

    return {
      id: log.id,
      userId: log.userId,
      chatlog: log.chatlog,
      scenario: log.scenario,
      coherence,
      politeness,
      relevance,
      resolution,
      shift: log.shift,
      dateTime: log.startTime.toISOString(),
      model: log.metadata ? JSON.parse(log.metadata).modelId : undefined,
      status: 'Completed' as const
    };
  });
}; 