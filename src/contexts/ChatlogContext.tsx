import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from "react";
import { saveChatLogs, getAllChatLogs, deleteChatLog, ChatLog } from "@/services/database";
import api from "@/lib/axios";
import { useAuth } from './AuthContext';
import { getUserChatLogEvaluations, saveChatLogEvaluations, deleteChatLogEvaluation, ChatLogEvaluation } from "@/services/chatLogEvaluationService";

export interface EvaluationResult {
  id?: number | string;
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  shift?: string;
  dateTime?: string;
  timestamp?: Date;
}

export interface GeneratedChatlog {
  id: string;
  chatlog: string;
  scenario: string;
  shift: string;
  dateTime: string;
  customerName: string;
  coherence?: number;
  politeness?: number;
  relevance?: number;
  resolution?: number;
  escalated?: boolean;
  evaluated: boolean;
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
  deleteChatLogById: (id: number | string) => Promise<void>;
  generatedData: GeneratedChatlog[];
  setGeneratedData: (data: GeneratedChatlog[]) => void;
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
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const stored = localStorage.getItem("selectedModel");
    return stored || '';
  });
  const [modelOptions, setModelOptions] = useState<{ display_name: string; id: string }[]>([]);
  const [promptTemplate, setPromptTemplate] = useState<string>(defaultPromptTemplate);
  const [rubricText, setRubricText] = useState<string>(defaultRubricText);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>('');
  const [testResponse, setTestResponse] = useState<string>('');
  const [generatedData, setGeneratedData] = useState<GeneratedChatlog[]>([]);
  const isLoadingRef = useRef<boolean>(false);

  // Load API key from session storage on mount
  useEffect(() => {
    try {
      const storedApiKey = sessionStorage.getItem("googleApiKey");
      console.log("[ChatlogContext] Attempting to load API key from session storage:", !!storedApiKey);
      if (storedApiKey) {
        setApiKey(storedApiKey);
        console.log("[ChatlogContext] API key loaded from session storage, length:", storedApiKey.length);
      } else {
        console.log("[ChatlogContext] No API key found in session storage");
      }
    } catch (error) {
      console.error("[ChatlogContext] Error loading API key from session storage:", error);
    }
  }, []);

  // Custom setter for API key that also saves to session storage
  const setApiKeyWithStorage = (key: string) => {
    console.log("[ChatlogContext] Setting new API key, length:", key?.length || 0);
    try {
      setApiKey(key);
      if (key) {
        sessionStorage.setItem("googleApiKey", key);
        console.log("[ChatlogContext] API key saved to session storage");
      } else {
        sessionStorage.removeItem("googleApiKey");
        console.log("[ChatlogContext] API key removed from session storage");
      }
    } catch (error) {
      console.error("[ChatlogContext] Error saving API key to session storage:", error);
    }
  };

  // Load saved chat logs from database on mount
  useEffect(() => {
    if (!isLoadingRef.current) {
      loadSavedChatLogs();
    }
  }, [user]);

  // Save evaluation results to database only when manually set (not from loadSavedChatLogs)
  useEffect(() => {
    if (evaluationResults.length > 0 && !isLoadingRef.current) {
      if (user) {
        // Logged in - save to server database
        const saveToServer = async () => {
          try {
            isLoadingRef.current = true;
            console.log('[Context] Saving evaluations to server database');
            await saveChatLogEvaluations(evaluationResults);
            isLoadingRef.current = false;
          } catch (err) {
            console.error('Error saving evaluations to server:', err);
            setError('Failed to save evaluations to server');
            isLoadingRef.current = false;
          }
        };
        saveToServer();
      } else {
        // Not logged in - save to local Dexie database
        isLoadingRef.current = true;
        saveChatLogs(evaluationResults);
        isLoadingRef.current = false;
      }
    }
  }, [evaluationResults, user]);

  const loadSavedChatLogs = async () => {
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      let savedLogs;
      
      if (user) {
        // Logged in - load from server database
        savedLogs = await getUserChatLogEvaluations();
      } else {
        // Not logged in - load from local Dexie database
        savedLogs = await getAllChatLogs();
      }
      
      // Only update if we have new data
      if (savedLogs.length > 0 && JSON.stringify(savedLogs) !== JSON.stringify(evaluationResults)) {
        console.log('[Context] loadSavedChatLogs fetched', savedLogs.length, 'logs');
        setEvaluationResults(savedLogs);
      } else if (savedLogs.length === 0 && evaluationResults.length > 0) {
        console.log('[Context] Clearing evaluation results as no logs found');
        setEvaluationResults([]);
      }
      
      isLoadingRef.current = false;
    } catch (error) {
      console.error('Error loading saved chat logs:', error);
      setError('Failed to load saved chat logs');
      isLoadingRef.current = false;
    }
  };

  const deleteChatLogById = async (id: number | string) => {
    try {
      let success = false;
      
      if (user) {
        // Logged in - delete from server database
        await deleteChatLogEvaluation(id as string);
        success = true;
      } else {
        // Not logged in - delete from local Dexie database
        success = await deleteChatLog(id as number);
      }
      
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
    if (selectedModel) localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  React.useEffect(() => {
    if (promptTemplate) localStorage.setItem("promptTemplate", promptTemplate);
  }, [promptTemplate]);

  React.useEffect(() => {
    if (rubricText) localStorage.setItem("rubricText", rubricText);
  }, [rubricText]);

  return (
    <ChatlogContext.Provider value={{
      apiKey,
      setApiKey: setApiKeyWithStorage,
      selectedModel,
      modelOptions,
      setSelectedModel,
      setModelOptions,
      promptTemplate,
      setPromptTemplate,
      rubricText,
      setRubricText,
      evaluationResults,
      setEvaluationResults,
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
      generatedData,
      setGeneratedData
    }}>
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
