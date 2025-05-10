
import { useChatlog } from "@/contexts/ChatlogContext";

// This is a client-side mock of the Google AI API interaction
// In a real app with a backend, this would make actual API calls
// For this demo, we'll simulate the model responses

export const fetchModels = async (apiKey: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }
  
  // Mock response for API models
  return [
    { display_name: "Gemini 1.5 Pro", id: "models/gemini-1.5-pro" },
    { display_name: "Gemini 1.5 Flash", id: "models/gemini-1.5-flash" },
    { display_name: "Gemma 7B IT", id: "models/gemma-7b-it" },
    { display_name: "Gemma 3 27B Instruct", id: "models/gemma-3-27b-it" },
    { display_name: "Gemini 2.5 Pro Preview", id: "models/gemini-2.5-pro-preview" },
  ];
};

export const testModel = async (apiKey: string, modelId: string, prompt: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }

  if (!modelId || modelId.trim() === "") {
    throw new Error("Model ID is required");
  }

  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt is required");
  }

  // Return a mock response based on the model ID and prompt
  return JSON.stringify({
    status: `Test successful for ${modelId}`,
    sample_response: `This is a placeholder test response from the selected model for prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`
  }, null, 2);
};

export const evaluateChatlog = async (
  apiKey: string,
  modelId: string,
  promptTemplate: string,
  rubricText: string,
  chatlogText: string
) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }

  if (!modelId || modelId.trim() === "") {
    throw new Error("Model ID is required");
  }

  // Construct the full prompt by replacing placeholders
  const fullPrompt = promptTemplate
    .replace("{chatlog_text}", chatlogText)
    .replace("{rubric_text}", rubricText);

  console.log("Evaluating chatlog with model:", modelId);
  
  // Generate mock scores for the chatlog evaluation
  // In a real implementation, this would call the actual Google AI API
  const coherence = Math.floor(Math.random() * 5) + 1;
  const politeness = Math.floor(Math.random() * 5) + 1;
  const relevance = Math.floor(Math.random() * 5) + 1;
  const resolution = Math.random() > 0.3 ? 1 : 0; // 70% chance of resolution=1

  return {
    chatlog: chatlogText.substring(0, 100) + (chatlogText.length > 100 ? "..." : ""),
    coherence,
    politeness,
    relevance,
    resolution
  };
};

export const evaluateChatlogs = async (
  apiKey: string,
  modelId: string,
  promptTemplate: string,
  rubricText: string,
  chatlogs: string[]
) => {
  // Process each chatlog
  const results = [];

  for (const chatlog of chatlogs) {
    try {
      const result = await evaluateChatlog(
        apiKey,
        modelId,
        promptTemplate,
        rubricText,
        chatlog
      );
      results.push(result);
    } catch (error) {
      console.error("Error evaluating chatlog:", error);
      // Add a placeholder result with error indication
      results.push({
        chatlog: chatlog.substring(0, 50) + "...",
        coherence: 0,
        politeness: 0,
        relevance: 0,
        resolution: 0,
        error: true
      });
    }
  }

  return results;
};
