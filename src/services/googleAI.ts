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

    testModel: async (modelId: string, prompt: string, temperature = 0.4, maxOutputTokens = 256): Promise<string> => {
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
              temperature: temperature,
              maxOutputTokens: maxOutputTokens
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
      let retryCount = 0;
      const MAX_RETRIES = 3;
      
      const attemptEvaluation = async (): Promise<{ original_chatlog: string; scores: any | null; error: string | null; raw_response: string | null }> => {
        try {
          if (!modelId || modelId.trim() === "") throw new Error("Model ID is required for evaluation");
  
          const fullPrompt = promptTemplate
            .replace("{chatlog_text}", chatlogText)
            .replace("{rubric_text}", rubricText);
  
          const formattedModelId = formatModelIdForApi(modelId);
          console.log(`Evaluating LIVE chatlog with model: ${formattedModelId} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
          // Improve error handling and add additional logging
          console.log(`Sending API request to: ${API_BASE_URL}/${formattedModelId}:generateContent`);
          console.log(`API Key present: ${!!apiKey}, Key length: ${apiKey.length}, First/last chars: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
          
          const requestBody = {
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { // Config for evaluation - low temp for consistency
              temperature: 0.2,
              maxOutputTokens: 250 // Enough for a JSON object with 4 scores
            }
          };
          
          console.log("Request body:", JSON.stringify(requestBody).substring(0, 200) + "...");
  
          const response = await fetch(`${API_BASE_URL}/${formattedModelId}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
  
          rawResponseText = await response.text(); // Get raw text for debugging in case of errors
          console.log("Raw response status:", response.status);
          console.log("Raw response text (first 200 chars):", rawResponseText.substring(0, 200) + "...");
  
          if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            console.error("Full error response:", rawResponseText);
            throw new Error(`API error: ${response.status} ${response.statusText} - ${rawResponseText}`);
          }
          
          try {
            const data = JSON.parse(rawResponseText); // Parse after checking response.ok
  
            if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
              console.error("Invalid response structure from evaluation API:", data);
              throw new Error("Invalid response structure from evaluation API. Check console for details.");
            }
            const llmOutputText = data.candidates[0].content.parts[0].text;
            console.log("LLM output text:", llmOutputText);
  
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
          } catch (jsonParseError) {
            console.error("Failed to parse API response as JSON:", jsonParseError);
            throw new Error(`Failed to parse API response as JSON: ${jsonParseError}`);
          }
        } catch (error: any) {
          console.error(`Error evaluating chatlog (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
          
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            console.log(`Retrying evaluation (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            
            // Add exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return attemptEvaluation();
          }
          
          return {
            original_chatlog: chatlogText,
            scores: null,
            error: `Failed to evaluate chatlog: ${error.message}`,
            raw_response: rawResponseText // Include raw response if available even on API error
          };
        }
      };
      
      return attemptEvaluation();
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

export const testModel = async (apiKey: string, modelId: string, prompt: string, temperature = 0.4, maxOutputTokens = 256) => {
  const client = createGoogleAIClient(apiKey);
  return client.testModel(modelId, prompt, temperature, maxOutputTokens);
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

// Keep track of recently used names globally
let recentlyUsedNames: string[] = [];
let nameUsageCount: { [key: string]: number } = {};

// Function to get a name that hasn't been used recently
const getRotatedName = (allNames: string[], minGap: number = 7, maxGap: number = 30): string => {
  // Filter out recently used names
  const availableNames = allNames.filter(name => !recentlyUsedNames.includes(name));
  
  // If we've used all names or need to allow revisits
  if (availableNames.length === 0) {
    // Find names that haven't been used too frequently
    const eligibleNames = allNames.filter(name => 
      !nameUsageCount[name] || nameUsageCount[name] < 2
    );
    
    if (eligibleNames.length > 0) {
      const randomName = eligibleNames[Math.floor(Math.random() * eligibleNames.length)];
      recentlyUsedNames = [randomName, ...recentlyUsedNames].slice(0, minGap);
      nameUsageCount[randomName] = (nameUsageCount[randomName] || 0) + 1;
      return randomName;
    }
    
    // Reset tracking if all names have been used multiple times
    if (recentlyUsedNames.length >= maxGap) {
      recentlyUsedNames = [];
      nameUsageCount = {};
    }
    
    // Pick any name if we must
    const randomName = allNames[Math.floor(Math.random() * allNames.length)];
    recentlyUsedNames = [randomName, ...recentlyUsedNames].slice(0, minGap);
    nameUsageCount[randomName] = (nameUsageCount[randomName] || 0) + 1;
    return randomName;
  }
  
  // Use a new name
  const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
  recentlyUsedNames = [randomName, ...recentlyUsedNames].slice(0, minGap);
  nameUsageCount[randomName] = (nameUsageCount[randomName] || 0) + 1;
  return randomName;
};

// Function to generate synthetic chatlog data
export const generateSyntheticChatlog = async (
  apiKey: string,
  modelId: string,
  agentName: string,
  scenario: string,
  behaviorPattern: string,
  minTurns: number,
  maxTurns: number
): Promise<{ chatlog: string; customerName: string }> => {
  const client = createGoogleAIClient(apiKey);
  
  // Define quality variations based on behavior patterns
  const qualityGuidelines: Record<string, string> = {
    'starts-strong-then-declines': 'Start with high coherence, politeness and relevance, then gradually decline in quality as the conversation progresses.',
    'starts-weak-then-improves': 'Start with low coherence, politeness and relevance, then gradually improve in quality as the conversation progresses.',
    'consistently-strong': 'Maintain high coherence, politeness and relevance throughout the entire conversation.',
    'consistently-poor': 'Maintain low coherence, politeness and relevance throughout the entire conversation.',
    'fluctuating-performance': 'Fluctuate between high and low quality responses throughout the conversation.'
  };

  const qualityGuideline = qualityGuidelines[behaviorPattern] || qualityGuidelines['consistently-strong'];
  
  // Get a random Egyptian name from the CSV file with rotation logic
  let randomName = "Unknown Customer";
  try {
    const fs = require('fs');
    const path = require('path');
    const csvPath = path.resolve(__dirname, '../../resources/customer names/egyptian_names.csv');
    console.log('Attempting to read CSV file from:', csvPath);
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1).filter(line => line.trim()); // Skip header row and empty lines
    if (lines.length > 0) {
      const allNames = lines.map(line => {
        const [firstName, lastName, fullName] = line.split(',');
        return fullName ? fullName.trim() : `${firstName.trim()} ${lastName.trim()}`;
      });
      randomName = getRotatedName(allNames);
    } else {
      console.error('No valid names found in the CSV file');
    }
  } catch (error) {
    console.error('Error reading Egyptian names CSV file:', error);
    // Fallback to a default Egyptian name if file reading fails
    const fallbackNames = [
      "Omar Khaled",
      "Rana Ali",
      "Ahmed Saad",
      "Nada Selim",
      "Ibrahim Hassan"
    ];
    randomName = getRotatedName(fallbackNames);
  }
  
  // Create prompt for generating synthetic chatlog
  const prompt = `Generate a realistic, complete customer service chatlog transcript between a customer and an agent.

The customer's name is: ${randomName}

Scenario: ${scenario}

**CRITICAL INSTRUCTION:** The chatlog MUST contain between ${minTurns} and ${maxTurns} total turns (a turn is one message from either the customer or the agent). **DO NOT exceed ${maxTurns} turns.**

**Quality Guideline:** Structure the conversation so that it reflects the following quality profile: "${qualityGuideline}"

Further Instructions:
1. Start by outputting "CUSTOMER_NAME: ${randomName}" on the first line
2. Then start the actual chat transcript on the next line
3. Ensure the conversation content aligns with the chosen quality guideline above
4. Include a timestamp before each message in the format [HH:MM:SS]
5. For agent messages, use the format "[HH:MM:SS] Agent ${agentName}: Message"
6. For customer messages, use the format "[HH:MM:SS] Customer: Message"
7. Add some realistic pauses between timestamps (30 seconds to 3 minutes between messages)
8. Occasionally add profanity from either the customer or agent for realism (but don't overdo it)
9. Do not include any introductory text, summaries, or explanations outside the chatlog itself
10. End the conversation naturally, either with resolution, escalation, or customer leaving
11. Do not include any commentary or explanations outside the chat messages

Generate the chatlog now, strictly adhering to the ${minTurns}-${maxTurns} turn limit and the specified quality guideline:`;

  try {
    // Using the enhanced testModel function with higher token limit for longer conversations
    const response = await testModel(apiKey, modelId, prompt, 0.7, 2048);
    
    // Extract customer name and chatlog
    const lines = response.split('\n');
    const customerNameMatch = lines[0].match(/CUSTOMER_NAME: (.+)/);
    const customerName = customerNameMatch ? customerNameMatch[1] : randomName;
    const chatlog = lines.slice(1).join('\n');

    return { chatlog, customerName };
  } catch (error) {
    console.error("Error generating synthetic chatlog:", error);
    throw new Error(`Failed to generate synthetic chatlog: ${error instanceof Error ? error.message : String(error)}`);
  }
};