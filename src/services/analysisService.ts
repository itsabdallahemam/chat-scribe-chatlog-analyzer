import api from '@/lib/axios';
import { GeneratedChatlog, EvaluationResult } from '@/contexts/ChatlogContext';

export interface AnalysisResult {
  mistakes: string[];
  strengths: string[];
  areasForImprovement: string[];
  agentName: string;
  timestamp: string;
}

export interface RecommendationResult {
  insights: string[];
  recommendations: string[];
  bestPractices: string[];
  agentName: string;
  timestamp: string;
}

const ANALYSIS_PROMPT = `You are an expert customer service analyst. Analyze the following customer service chatlog and its evaluation results. Focus on identifying specific mistakes, strengths, and areas for improvement.

Chatlog:
{chatlog}

Evaluation Results:
- Coherence: {coherence}
- Politeness: {politeness}
- Relevance: {relevance}
- Resolution: {resolution}

Agent Name: {agentName}

Provide your analysis in the following JSON format:
{
  "mistakes": ["list of specific mistakes made in the conversation"],
  "strengths": ["list of positive aspects of the conversation"],
  "areasForImprovement": ["list of areas that need improvement"],
  "agentName": "{agentName}",
  "timestamp": "{timestamp}"
}`;

const RECOMMENDATION_PROMPT = `You are an expert customer service trainer. Based on the following analysis of a customer service chatlog, generate insights and recommendations for improvement.

Analysis:
{analysis}

Agent Name: {agentName}

Provide your recommendations in the following JSON format:
{
  "insights": ["key insights about the conversation"],
  "recommendations": ["specific actionable recommendations"],
  "bestPractices": ["relevant best practices to follow"],
  "agentName": "{agentName}",
  "timestamp": "{timestamp}"
}`;

export const analyzeChatlog = async (
  chatlog: GeneratedChatlog,
  evaluationResult: EvaluationResult,
  agentName: string
): Promise<AnalysisResult> => {
  try {
    const timestamp = new Date().toISOString();
    const prompt = ANALYSIS_PROMPT
      .replace('{chatlog}', chatlog.chatlog)
      .replace('{coherence}', evaluationResult.coherence.toString())
      .replace('{politeness}', evaluationResult.politeness.toString())
      .replace('{relevance}', evaluationResult.relevance.toString())
      .replace('{resolution}', evaluationResult.resolution.toString())
      .replace('{agentName}', agentName)
      .replace('{timestamp}', timestamp);

    const response = await api.post<AnalysisResult>('/api/analyze', {
      prompt,
      model: 'gemini-pro',
      temperature: 0.7,
      maxOutputTokens: 1024
    });

    if (!response.data || !response.data.mistakes || !response.data.strengths || !response.data.areasForImprovement) {
      throw new Error('Invalid analysis response format');
    }

    return {
      ...response.data,
      agentName,
      timestamp
    };
  } catch (error) {
    console.error('Error analyzing chatlog:', error);
    throw new Error('Failed to analyze chatlog');
  }
};

export const generateRecommendations = async (
  analysis: AnalysisResult
): Promise<RecommendationResult> => {
  try {
    const timestamp = new Date().toISOString();
    const prompt = RECOMMENDATION_PROMPT
      .replace('{analysis}', JSON.stringify(analysis, null, 2))
      .replace('{agentName}', analysis.agentName)
      .replace('{timestamp}', timestamp);

    const response = await api.post<RecommendationResult>('/api/recommend', {
      prompt,
      model: 'gemini-pro',
      temperature: 0.7,
      maxOutputTokens: 1024
    });

    if (!response.data || !response.data.insights || !response.data.recommendations || !response.data.bestPractices) {
      throw new Error('Invalid recommendations response format');
    }

    return {
      ...response.data,
      agentName: analysis.agentName,
      timestamp
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
};

// New function to process the complete pipeline
export const processChatlogPipeline = async (
  chatlog: GeneratedChatlog,
  evaluationResult: EvaluationResult,
  agentName: string
): Promise<{
  analysis: AnalysisResult;
  recommendations: RecommendationResult;
}> => {
  try {
    // Step 1: Analyze the chatlog
    const analysis = await analyzeChatlog(chatlog, evaluationResult, agentName);
    
    // Step 2: Generate recommendations based on the analysis
    const recommendations = await generateRecommendations(analysis);
    
    return {
      analysis,
      recommendations
    };
  } catch (error) {
    console.error('Error in chatlog processing pipeline:', error);
    throw new Error('Failed to process chatlog pipeline');
  }
}; 