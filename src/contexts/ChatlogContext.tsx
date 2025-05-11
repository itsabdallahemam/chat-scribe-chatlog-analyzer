import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { saveChatLogs, getAllChatLogs, deleteChatLog, ChatLog } from "@/services/database";

interface EvaluationResult {
  id?: number;
  chatlog: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
}

interface ChatlogContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  modelOptions: { display_name: string; id: string }[];
  setSelectedModel: (model: string) => void;
  setModelOptions: (options: { display_name: string; id: string }[]) => void;
  promptTemplate: string;
  setPromptTemplate: (template: string) => void;
  rubricText: string;
  setRubricText: (text: string) => void;
  evaluationResults: EvaluationResult[];
  setEvaluationResults: (results: EvaluationResult[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  testPrompt: string;
  setTestPrompt: (prompt: string) => void;
  testResponse: string;
  setTestResponse: (response: string) => void;
  loadSavedChatLogs: () => Promise<void>;
  deleteChatLogById: (id: number) => Promise<void>;
}

const defaultPromptTemplate = `Your task is to evaluate the following customer service chatlog:
Chatlog:
{chatlog_text}

Use the provided rubric for your evaluation:
{rubric_text}

Provide your evaluation STRICTLY as a single JSON object with keys "Coherence" (integer 1-5), "Politeness" (integer 1-5), "Relevance" (integer 1-5), and "Resolution" (integer 0 or 1).
Output ONLY the JSON object.
Evaluation JSON:`;

const defaultRubricText = `Coherence (1-5):
1: Completely disjointed, impossible to follow the conversation.
2: Significant gaps in logic or conversation flow.
3: Some minor disconnects but generally comprehensible.
4: Clear and logical conversation flow with minimal issues.
5: Perfectly coherent conversation with clear relationship between all messages.

Politeness (1-5):
1: Rude, unprofessional, or inappropriate language used.
2: Curt, dismissive or lacking basic courtesy.
3: Neutral tone, neither notably polite nor impolite.
4: Professional, courteous language used consistently.
5: Exceptionally polite, goes above and beyond in courtesy.

Relevance (1-5):
1: Completely off-topic or irrelevant to the customer's needs.
2: Minimally addresses customer needs but mostly misses the point.
3: Somewhat relevant but fails to fully address the customer's question.
4: Mostly relevant and addresses the core customer inquiry.
5: Perfectly relevant, directly and completely addresses the customer's question.

Resolution (0 or 1):
0: The customer's issue or query was not resolved by the end of the conversation.
1: The customer's issue or query was clearly resolved by the end of the conversation.`;

const ChatlogContext = createContext<ChatlogContextType | undefined>(undefined);

export const ChatlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load stored values from localStorage if available
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("apiKey") || "");
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem("selectedModel") || "");
  const [modelOptions, setModelOptions] = useState<{ display_name: string; id: string }[]>([]);
  const [promptTemplate, setPromptTemplate] = useState<string>(
    localStorage.getItem("promptTemplate") || defaultPromptTemplate
  );
  const [rubricText, setRubricText] = useState<string>(
    localStorage.getItem("rubricText") || defaultRubricText
  );
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>("");
  const [testResponse, setTestResponse] = useState<string>("");

  // Load saved chat logs from database on mount
  useEffect(() => {
    loadSavedChatLogs();
  }, []);

  // Save evaluation results to database whenever they change
  useEffect(() => {
    if (evaluationResults.length > 0) {
      saveChatLogs(evaluationResults);
    }
  }, [evaluationResults]);

  const loadSavedChatLogs = async () => {
    try {
      const savedLogs = await getAllChatLogs();
      console.log('[Context] loadSavedChatLogs fetched', savedLogs.length, 'logs:', savedLogs);
      if (savedLogs.length > 0) {
        setEvaluationResults(savedLogs);
        console.log('[Context] setEvaluationResults called with', savedLogs.length, 'logs');
      } else {
        setEvaluationResults([]);
        console.log('[Context] setEvaluationResults called with 0 logs (empty array)');
      }
    } catch (error) {
      console.error('Error loading saved chat logs:', error);
      setError('Failed to load saved chat logs');
    }
  };

  const deleteChatLogById = async (id: number) => {
    try {
      const success = await deleteChatLog(id);
      if (success) {
        // Update the local state by removing the deleted chat log
        setEvaluationResults(prevResults => prevResults.filter(result => result.id !== id));
      } else {
        setError('Failed to delete chat log');
      }
    } catch (error) {
      console.error('Error deleting chat log:', error);
      setError('Failed to delete chat log');
    }
  };

  // Update localStorage when values change
  React.useEffect(() => {
    if (apiKey) localStorage.setItem("apiKey", apiKey);
  }, [apiKey]);

  React.useEffect(() => {
    if (selectedModel) localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  React.useEffect(() => {
    if (promptTemplate) localStorage.setItem("promptTemplate", promptTemplate);
  }, [promptTemplate]);

  React.useEffect(() => {
    if (rubricText) localStorage.setItem("rubricText", rubricText);
  }, [rubricText]);

  // Wrap setEvaluationResults to log changes
  const setEvaluationResultsWithLog = async (results: EvaluationResult[]) => {
    console.log('[Context] setEvaluationResultsWithLog called with', results.length, 'logs:', results);
    try {
      // Clear existing results and save new ones
      setEvaluationResults([]); // Clear existing results first
      
      // Save to database
      if (results.length > 0) {
        await saveChatLogs(results);
        console.log('[Context] Successfully saved', results.length, 'logs to database');
      }
      
      // Then update state with new results
      setEvaluationResults(results);
      console.log('[Context] Updated state with', results.length, 'logs');
    } catch (error) {
      console.error('[Context] Error saving evaluation results:', error);
      setError('Failed to save evaluation results');
    }
  };

  return (
    <ChatlogContext.Provider
      value={{
        apiKey,
        setApiKey,
        selectedModel,
        setSelectedModel,
        modelOptions,
        setModelOptions,
        promptTemplate,
        setPromptTemplate,
        rubricText,
        setRubricText,
        evaluationResults,
        setEvaluationResults: setEvaluationResultsWithLog,
        isLoading,
        setIsLoading,
        error,
        setError,
        testPrompt,
        setTestPrompt,
        testResponse,
        setTestResponse,
        loadSavedChatLogs,
        deleteChatLogById,
      }}
    >
      {children}
    </ChatlogContext.Provider>
  );
};

export const useChatlog = (): ChatlogContextType => {
  const context = useContext(ChatlogContext);
  if (context === undefined) {
    throw new Error("useChatlog must be used within a ChatlogProvider");
  }
  return context;
};
