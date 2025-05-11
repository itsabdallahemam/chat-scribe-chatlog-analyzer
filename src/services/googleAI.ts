
// src/services/googleAI.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define the interface for the evaluation result
export interface EvaluationResult {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  chatlog: string;
  error?: string;
}

// Define the interface for raw evaluation result from API
export interface RawEvaluationResultFromAPI {
  original_chatlog: string;
  scores: {
    Coherence: number;
    Politeness: number;
    Relevance: number;
    Resolution: number;
  } | null;
  error: string | null;
  raw_response?: string | null;
}

// Constants for prompt engineering
const COHERENCE_PROMPT = `Assess the coherence of the following chatlog on a scale of 1 to 5 (1=incoherent, 5=very coherent).
  Coherence means the chatlog is well-structured, easy to follow, and makes sense.
  Provide ONLY the number representing the score.
  Chatlog:`;

const POLITENESS_PROMPT = `Evaluate the politeness of the following chatlog on a scale of 1 to 5 (1=impolite, 5=very polite).
  Politeness includes the agent's tone, respectfulness, and overall customer service manner.
  Provide ONLY the number representing the score.
  Chatlog:`;

const RELEVANCE_PROMPT = `Determine the relevance of the following chatlog on a scale of 1 to 5 (1=irrelevant, 5=very relevant).
  Relevance indicates how well the chatlog addresses the customer's query or issue.
  Provide ONLY the number representing the score.
  Chatlog:`;

const RESOLUTION_PROMPT = `Determine if the issue in the following chatlog was resolved (1=yes, 0=no).
  Resolution means the customer's problem was solved or their question was answered completely.
  Provide ONLY 1 or 0.
  Chatlog:`;

const MAX_CHATLOG_CHARS = 1000; // Maximum characters to send to the model

// Helper function to safely parse the model's response
const safeParse = (response: string): number => {
  try {
    const parsed = parseFloat(response);
    if (isNaN(parsed)) {
      console.warn(`Model returned NaN response: ${response}`);
      return NaN;
    }
    return parsed;
  } catch (error) {
    console.error(`Error parsing model response: ${response}`, error);
    return NaN;
  }
};

// GoogleAIClient class to encapsulate the API calls
class GoogleAIClient {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = modelName;
  }

  async generateContent(prompt: string): Promise<string | null> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = result.response;
      if (!response.text) {
        console.warn("No text in response:", response);
        return null;
      }
      return response.text;
    } catch (e: any) {
      console.error("Error in generateContent:", e);
      return null;
    }
  }

  async evaluateCoherence(chatlog: string): Promise<number> {
    const prompt = `${COHERENCE_PROMPT}\n${chatlog}`;
    const response = await this.generateContent(prompt);
    return response ? safeParse(response) : NaN;
  }

  async evaluatePoliteness(chatlog: string): Promise<number> {
    const prompt = `${POLITENESS_PROMPT}\n${chatlog}`;
    const response = await this.generateContent(prompt);
    return response ? safeParse(response) : NaN;
  }

  async evaluateRelevance(chatlog: string): Promise<number> {
    const prompt = `${RELEVANCE_PROMPT}\n${chatlog}`;
    const response = await this.generateContent(prompt);
    return response ? safeParse(response) : NaN;
  }

  async evaluateResolution(chatlog: string): Promise<number> {
    const prompt = `${RESOLUTION_PROMPT}\n${chatlog}`;
    const response = await this.generateContent(prompt);
    return response ? safeParse(response) : NaN;
  }
}

// Main function to evaluate the chatlog
export const evaluateChatlog = async (chatlog: string, apiKey: string, model: string): Promise<EvaluationResult> => {
  const client = new GoogleAIClient(apiKey, model);

  try {
    if (!apiKey) {
      console.error("Error: API Key is undefined");
      return {
        coherence: 0,
        politeness: 0,
        relevance: 0,
        resolution: 0,
        chatlog: "",
        error: "API Key is undefined"
      };
    }

    if (!chatlog || chatlog.trim().length === 0) {
      console.error("Error: Chatlog is undefined or empty");
      return {
        coherence: 0,
        politeness: 0,
        relevance: 0,
        resolution: 0,
        chatlog: "",
        error: "Empty or undefined chatlog"
      };
    }

    const shortenedChatlog = chatlog.length > MAX_CHATLOG_CHARS ? 
      chatlog.substring(0, MAX_CHATLOG_CHARS) + "... [truncated]" : 
      chatlog;

    const [coherence, politeness, relevance, resolution] = await Promise.all([
      client.evaluateCoherence(shortenedChatlog),
      client.evaluatePoliteness(shortenedChatlog),
      client.evaluateRelevance(shortenedChatlog),
      client.evaluateResolution(shortenedChatlog),
    ]);

    return {
      coherence: isNaN(coherence) ? 0 : coherence,
      politeness: isNaN(politeness) ? 0 : politeness,
      relevance: isNaN(relevance) ? 0 : relevance,
      resolution: isNaN(resolution) ? 0 : resolution,
      chatlog: chatlog,
      error: undefined,
    };
  } catch (error: any) {
    console.error("Error in evaluateChatlog:", error);
    return {
      coherence: 0,
      politeness: 0,
      relevance: 0,
      resolution: 0,
      chatlog: chatlog || "",
      error: error.message || "Evaluation failed",
    };
  }
};

// Function to evaluate a single chatlog (interface for HomePage.tsx)
export const evaluateSingleChatlog = async (
  apiKey: string, 
  model: string,
  promptTemplate: string,
  rubricText: string,
  chatlog: string
): Promise<RawEvaluationResultFromAPI> => {
  try {
    console.info(`Evaluating LIVE chatlog with model: ${model}`);
    
    // For now, using the same evaluation function
    const result = await evaluateChatlog(chatlog, apiKey, model);
    
    return {
      original_chatlog: chatlog,
      scores: {
        Coherence: result.coherence,
        Politeness: result.politeness,
        Relevance: result.relevance,
        Resolution: result.resolution
      },
      error: result.error || null,
      raw_response: null
    };
  } catch (error: any) {
    console.error("Error evaluating chatlog:", error);
    return {
      original_chatlog: chatlog,
      scores: null,
      error: `Failed to evaluate chatlog: ${error.message || "Unknown error"}`,
      raw_response: null
    };
  }
};

// Function to check API key validity
export const isValidApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    await genAI.getGenerativeModel({ model: 'gemini-1.0-pro' }).generateContent("test");
    return true;
  } catch (error) {
    console.error("API key check failed:", error);
    return false;
  }
};

// Function to list available models
export const listAvailableModels = async (apiKey: string): Promise<string[]> => {
  try {
    // The Google AI API doesn't have a direct method to list models
    // For now, we'll return a static list of commonly available models
    return [
      'models/gemini-1.0-pro',
      'models/gemini-1.5-pro',
      'models/gemma-3-27b-it'
    ];
  } catch (error) {
    console.error("Failed to list models:", error);
    return [];
  }
};

// Functions used by SettingsPage.tsx
export const fetchModels = async (apiKey: string): Promise<{id: string, display_name: string}[]> => {
  try {
    // Get model strings
    const modelStrings = await listAvailableModels(apiKey);
    
    // Convert to the format expected by SettingsPage
    return modelStrings.map(modelString => {
      const name = modelString.split('/').pop() || modelString;
      return {
        id: modelString,
        display_name: name
      };
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

export const testModel = async (apiKey: string, modelId: string, prompt: string): Promise<string> => {
  try {
    const client = new GoogleAIClient(apiKey, modelId);
    const response = await client.generateContent(prompt);
    return response || "No response from model";
  } catch (error: any) {
    console.error("Error testing model:", error);
    throw new Error(`Model test failed: ${error.message || "Unknown error"}`);
  }
};
