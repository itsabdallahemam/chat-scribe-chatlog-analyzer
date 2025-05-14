// src/services/googleAI.ts

// Helper function to create a Google AI API client
const createGoogleAIClient = (apiKey: string) => {
  // Validate API key
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required for Google AI client");
  }

  const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"; // Using v1beta

  // Helper to ensure modelId is correctly formatted
  const formatModelIdForApi = (modelId: string): string => {
    return modelId.startsWith("models/") ? modelId : `models/${modelId}`;
  };

  const clientMethods = {
    fetchModels: async (): Promise<{ display_name: string; id: string }[]> => {
      try {
        console.log("Fetching LIVE models from Google AI API with key:", apiKey ? "******" : "NOT SET");
        const response = await fetch(`${API_BASE_URL}/models?key=${apiKey}`);

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();

        if (!data.models || !Array.isArray(data.models)) {
            throw new Error("Invalid response structure from fetchModels API: 'models' array not found.");
        }

        // Filter for relevant models
        return data.models
          .filter((m: any) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            (m.name?.toLowerCase().includes("gemini") || m.name?.toLowerCase().includes("gemma")) &&
            (m.name?.toLowerCase().includes("instruct") || m.name?.toLowerCase().includes("it") ||
             m.name?.toLowerCase().includes("pro") || m.name?.toLowerCase().includes("flash") ||
             m.name?.toLowerCase().includes("ultra")) &&
            (!m.name?.toLowerCase().includes("code") && !m.name?.toLowerCase().includes("vision") && !m.name?.toLowerCase().includes("embedding"))
          )
          .map((m: any) => ({
            display_name: m.displayName || m.name, // Use displayName if available
            id: m.name, // This is the full model resource name like "models/gemini-1.5-pro-latest"
          }));
      } catch (error) {
        console.error("Error fetching models:", error);
        throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    testModel: async (modelId: string, prompt: string): Promise<string> => {
      try {
        if (!modelId || modelId.trim() === "") throw new Error("Model ID is required for testing");
        if (!prompt || prompt.trim() === "") throw new Error("Prompt is required for testing");

        const formattedModelId = formatModelIdForApi(modelId);
        console.log(`Testing LIVE model ${formattedModelId} with prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);

        const response = await fetch(`${API_BASE_URL}/${formattedModelId}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { // Basic config for testing
              temperature: 0.4,
              maxOutputTokens: 256 // Keep low for quick test
            }
          })
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
          console.error("Invalid response structure from testModel API:", data);
          throw new Error("Invalid response structure from model test API. Check console for details.");
        }
        return data.candidates[0].content.parts[0].text;

      } catch (error) {
        console.error("Error testing model:", error);
        throw new Error(`Failed to test model: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    evaluateChatlog: async (
      modelId: string,
      promptTemplate: string,
      rubricText: string,
      chatlogText: string
    ): Promise<{ original_chatlog: string; scores: any | null; error: string | null; raw_response: string | null }> => {
      let rawResponseText: string | null = null;
      try {
        if (!modelId || modelId.trim() === "") throw new Error("Model ID is required for evaluation");

        const fullPrompt = promptTemplate
          .replace("{chatlog_text}", chatlogText)
          .replace("{rubric_text}", rubricText);

        const formattedModelId = formatModelIdForApi(modelId);
        console.log(`Evaluating LIVE chatlog with model: ${formattedModelId}`);

        const response = await fetch(`${API_BASE_URL}/${formattedModelId}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { // Config for evaluation - low temp for consistency
              temperature: 0.2,
              maxOutputTokens: 250 // Enough for a JSON object with 4 scores
            }
          })
        });

        rawResponseText = await response.text(); // Get raw text for debugging in case of errors

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText} - ${rawResponseText}`);
        }
        const data = JSON.parse(rawResponseText); // Parse after checking response.ok

        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
          console.error("Invalid response structure from evaluation API:", data);
          throw new Error("Invalid response structure from evaluation API. Check console for details.");
        }
        const llmOutputText = data.candidates[0].content.parts[0].text;

        // Parse the JSON response from the LLM's output text
        try {
          const jsonMatch = llmOutputText.match(/{[\s\S]*}/); // Try to find a JSON object
          if (!jsonMatch) {
            console.error("No JSON object found in LLM response:", llmOutputText);
            throw new Error("No JSON object found in LLM response");
          }
          const jsonStr = jsonMatch[0];
          const result = JSON.parse(jsonStr);

          // Validate that all required fields are present and have valid values
          const coherence = parseInt(result.Coherence);
          const politeness = parseInt(result.Politeness);
          const relevance = parseInt(result.Relevance);
          const resolution = parseInt(result.Resolution);

          if (isNaN(coherence) || coherence < 1 || coherence > 5) throw new Error(`Invalid Coherence value: ${result.Coherence}`);
          if (isNaN(politeness) || politeness < 1 || politeness > 5) throw new Error(`Invalid Politeness value: ${result.Politeness}`);
          if (isNaN(relevance) || relevance < 1 || relevance > 5) throw new Error(`Invalid Relevance value: ${result.Relevance}`);
          if (isNaN(resolution) || (resolution !== 0 && resolution !== 1)) throw new Error(`Invalid Resolution value: ${result.Resolution}`);

          return {
            original_chatlog: chatlogText,
            scores: { Coherence: coherence, Politeness: politeness, Relevance: relevance, Resolution: resolution },
            error: null,
            raw_response: llmOutputText
          };
        } catch (parseError: any) {
          console.error("Failed to parse LLM response JSON:", parseError, "Raw LLM output:", llmOutputText);
          return {
            original_chatlog: chatlogText,
            scores: null,
            error: `Failed to parse LLM response JSON: ${parseError.message}`,
            raw_response: llmOutputText
          };
        }
      } catch (error: any) {
        console.error("Error evaluating chatlog:", error);
        return {
            original_chatlog: chatlogText,
            scores: null,
            error: `Failed to evaluate chatlog: ${error.message}`,
            raw_response: rawResponseText // Include raw response if available even on API error
        };
      }
    },
  };

  const evaluateChatlogs = async (
    modelId: string,
    promptTemplate: string,
    rubricText: string,
    chatlogs: string[]
  ): Promise<any[]> => { // Added Promise<any[]> for return type
    const results = [];
    console.log(`Starting batch evaluation of ${chatlogs.length} chatlogs with ${modelId}`);
    for (const chatlog of chatlogs) {
      // Correctly calls evaluateChatlog from the clientMethods object
      const result = await clientMethods.evaluateChatlog(
        modelId,
        promptTemplate,
        rubricText,
        chatlog || "" // Ensure chatlog is never undefined
      );
      results.push(result);
    }
    console.log(`Finished batch evaluation for ${modelId}. Processed ${results.length} results.`);
    return results;
  };

  return {
    ...clientMethods,
    evaluateChatlogs
  };
};


// Public API exports
export const fetchModels = async (apiKey: string) => {
  const client = createGoogleAIClient(apiKey);
  return client.fetchModels();
};

export const testModel = async (apiKey: string, modelId: string, prompt: string) => {
  const client = createGoogleAIClient(apiKey);
  return client.testModel(modelId, prompt);
};

// Renamed to avoid potential conflict if client.evaluateChatlog is preferred elsewhere
export const evaluateSingleChatlog = async (
  apiKey: string,
  modelId: string,
  promptTemplate: string,
  rubricText: string,
  chatlogText: string
) => {
  const client = createGoogleAIClient(apiKey);
  return client.evaluateChatlog(modelId, promptTemplate, rubricText, chatlogText);
};

export const evaluateChatlogs = async (
  apiKey: string,
  modelId: string,
  promptTemplate: string,
  rubricText: string,
  chatlogs: string[]
) => {
  const client = createGoogleAIClient(apiKey);
  return client.evaluateChatlogs(modelId, promptTemplate, rubricText, chatlogs);
};