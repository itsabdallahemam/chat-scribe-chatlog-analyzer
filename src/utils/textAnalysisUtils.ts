// Interface for evaluation result items from the context
export interface EvaluationResultItem {
  id?: number;
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  originalIndex?: number;
  shift?: string;
  dateTime?: string;
  timestamp?: Date;
}

// Common English stopwords that should be excluded from analysis
const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
  // Add chat-specific common words that aren't meaningful
  'hello', 'hi', 'hey', 'thanks', 'thank', 'please', 'would', 'could', 'like', 'help',
  'need', 'want', 'get', 'know', 'also', 'ok', 'okay', 'yes', 'no', 'sure', 'well',
  // Add role-specific words per user request
  'customer', 'agent', 'user', 'support', 'service', 'representative'
]);

// Interface for word frequency data
export interface WordFrequency {
  text: string;
  value: number;
}

// Interface for the complete keyword analysis result
export interface KeywordAnalysisResult {
  resolvedKeywords: WordFrequency[];
  unresolvedKeywords: WordFrequency[]; 
  commonKeywords: WordFrequency[];
  differentiatingKeywords: WordFrequency[];
}

/**
 * Extracts keywords from a text, removing stopwords and keeping only meaningful terms
 */
const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  
  // Convert to lowercase and replace non-alphanumeric chars with spaces
  const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words and filter out stopwords and short words
  const words = cleanedText.split(/\s+/).filter(word => 
    word.length > 2 && !STOPWORDS.has(word)
  );
  
  return words;
};

/**
 * Counts frequency of each keyword in an array of words
 */
const countKeywordFrequency = (words: string[]): Map<string, number> => {
  const frequencyMap = new Map<string, number>();
  
  words.forEach(word => {
    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
  });
  
  return frequencyMap;
};

/**
 * Converts a frequency map to sorted array of WordFrequency objects
 */
const convertToWordFrequencyArray = (
  frequencyMap: Map<string, number>, 
  limit: number = 100
): WordFrequency[] => {
  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
    .slice(0, limit) // Take top 'limit' entries
    .map(([text, value]) => ({ text, value }));
};

/**
 * Calculate keywords that appear significantly more in one set vs another
 */
const calculateDifferentiatingKeywords = (
  map1: Map<string, number>, 
  map2: Map<string, number>,
  totalWordsMap1: number,
  totalWordsMap2: number,
  limit: number = 50
): WordFrequency[] => {
  const differenceMap = new Map<string, number>();
  
  // Combine all unique words from both maps
  const allWords = new Set([...map1.keys(), ...map2.keys()]);
  
  allWords.forEach(word => {
    // Get normalized frequencies (as percentage of total words)
    const freq1 = (map1.get(word) || 0) / totalWordsMap1;
    const freq2 = (map2.get(word) || 0) / totalWordsMap2;
    
    // Calculate difference score (can be positive or negative)
    // Using a ratio-based approach with a log transform to avoid division by zero
    // A high positive value means the word is more common in map1, negative means more common in map2
    const difference = Math.log((freq1 + 0.0001) / (freq2 + 0.0001));
    
    // Only keep words with significant differences
    if (Math.abs(difference) > 0.5) {
      differenceMap.set(word, difference);
    }
  });
  
  // Convert to array and sort by absolute difference (descending)
  return Array.from(differenceMap.entries())
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit)
    .map(([text, value]) => ({ 
      text, 
      value: Math.abs(value) * 10 // Scale for visualization
    }));
};

/**
 * Analyzes keywords from evaluation results, separating resolved vs unresolved chats
 */
export const analyzeKeywords = (
  evaluationResults: EvaluationResultItem[]
): KeywordAnalysisResult => {
  // Split chats by resolution status
  const resolvedChats = evaluationResults.filter(item => item.resolution === 1);
  const unresolvedChats = evaluationResults.filter(item => item.resolution === 0);
  
  // Extract all keywords from each group
  const resolvedWords: string[] = resolvedChats.flatMap(item => extractKeywords(item.chatlog));
  const unresolvedWords: string[] = unresolvedChats.flatMap(item => extractKeywords(item.chatlog));
  
  // Count word frequencies
  const resolvedFrequencyMap = countKeywordFrequency(resolvedWords);
  const unresolvedFrequencyMap = countKeywordFrequency(unresolvedWords);
  
  // Find words common to both categories by finding intersection of keys
  const commonWordsMap = new Map<string, number>();
  resolvedFrequencyMap.forEach((value, key) => {
    if (unresolvedFrequencyMap.has(key)) {
      // Average the frequency between resolved and unresolved
      commonWordsMap.set(key, (value + (unresolvedFrequencyMap.get(key) || 0)) / 2);
    }
  });
  
  // Calculate differentiating keywords
  const differentiatingKeywords = calculateDifferentiatingKeywords(
    resolvedFrequencyMap, 
    unresolvedFrequencyMap,
    resolvedWords.length,
    unresolvedWords.length
  );
  
  // Convert to arrays for return
  return {
    resolvedKeywords: convertToWordFrequencyArray(resolvedFrequencyMap),
    unresolvedKeywords: convertToWordFrequencyArray(unresolvedFrequencyMap),
    commonKeywords: convertToWordFrequencyArray(commonWordsMap),
    differentiatingKeywords
  };
};

/**
 * Calculates BLEU score between two chatlogs to check for similarity
 * Uses a simplified version of BLEU that focuses on n-gram overlap
 */
export const calculateBLEUScore = (chatlog1: string, chatlog2: string): number => {
  if (!chatlog1 || !chatlog2) return 0;

  // Normalize and tokenize the chatlogs
  const normalize = (text: string) => {
    return text.toLowerCase()
      .replace(/[\[\(\]:\d\)]/g, '') // Remove timestamps and special characters
      .replace(/agent:|customer:/gi, '') // Remove speaker labels
      .trim()
      .split(/\s+/); // Split into words
  };

  const tokens1 = normalize(chatlog1);
  const tokens2 = normalize(chatlog2);

  // Calculate n-gram overlap for n=1,2,3,4
  const calculateNGramOverlap = (n: number): number => {
    if (tokens1.length < n || tokens2.length < n) return 0;

    const getNGrams = (tokens: string[], n: number) => {
      const ngrams = new Set<string>();
      for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.add(tokens.slice(i, i + n).join(' '));
      }
      return ngrams;
    };

    const ngrams1 = getNGrams(tokens1, n);
    const ngrams2 = getNGrams(tokens2, n);
    
    let matches = 0;
    for (const ngram of ngrams1) {
      if (ngrams2.has(ngram)) matches++;
    }

    return matches / Math.max(ngrams1.size, ngrams2.size);
  };

  // Calculate BLEU score with weights for different n-grams
  const weights = [0.4, 0.3, 0.2, 0.1]; // Weights for 1-gram to 4-gram
  const scores = [1, 2, 3, 4].map(n => calculateNGramOverlap(n));
  
  // Weighted average of n-gram scores
  const bleuScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
  
  return bleuScore;
}; 