// src/components/ChatBubbleView.tsx
import React from 'react';

interface ChatBubbleViewProps {
  chatlogText: string;
}

interface Message {
  speaker: 'Customer' | 'Agent' | 'Unknown';
  text: string;
  timestamp?: string;
}

const ChatBubbleView: React.FC<ChatBubbleViewProps> = ({ chatlogText }) => {
  if (!chatlogText || typeof chatlogText !== 'string') {
    return <p className="text-sm text-muted-foreground">Chatlog not available.</p>;
  }

  const messages: Message[] = chatlogText
    .split('\n')
    .map((line) => line.trim())
    .filter(line => line.length > 0)
    .map((line) => {
      // Extract timestamp if it exists in format [HH:MM:SS] or (HH:MM) or similar
      let timestamp: string | undefined = undefined;
      const timestampMatch = line.match(/^[\[\(]([0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?)[\]\)]/);
      if (timestampMatch) {
        timestamp = timestampMatch[1];
        line = line.substring(timestampMatch[0].length).trim();
      }
      
      // Process different formats of speaker prefixes
      if (line.toLowerCase().startsWith('customer:')) {
        return { 
          speaker: 'Customer', 
          text: line.substring('customer:'.length).trim(),
          timestamp 
        };
      } else if (line.toLowerCase().startsWith('agent:')) {
        return { 
          speaker: 'Agent', 
          text: line.substring('agent:'.length).trim(),
          timestamp 
        };
      } else if (line.match(/^\s*Customer\s*[:-]/i)) {
        return { 
          speaker: 'Customer', 
          text: line.replace(/^\s*Customer\s*[:-]/i, '').trim(),
          timestamp 
        };
      } else if (line.match(/^\s*Agent\s*[:-]/i)) {
        return { 
          speaker: 'Agent', 
          text: line.replace(/^\s*Agent\s*[:-]/i, '').trim(),
          timestamp 
        };
      }
      
      // Handle lines without clear speaker
      return { speaker: 'Unknown', text: line, timestamp };
    });

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">Chatlog appears to be empty.</p>;
  }

  return (
    <div className="space-y-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 max-h-[400px] overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex flex-col ${
            msg.speaker === 'Agent' ? 'items-end' : 'items-start'
          }`}
        >
          <div className="mb-1 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {msg.speaker !== 'Unknown' && (
              <span>{msg.speaker}</span>
            )}
            {msg.timestamp && (
              <span className="ml-2">{msg.timestamp}</span>
            )}
          </div>
          <div
            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${
              msg.speaker === 'Agent'
                ? 'bg-purple-600 dark:bg-purple-700 text-white' // Agent bubble using purple to match theme
                : msg.speaker === 'Customer' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700' // Customer bubble
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50' // Unknown speaker
            }`}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {msg.speaker === 'Unknown' && (
              <p className="text-xs mb-1 font-medium text-amber-700 dark:text-amber-300">
                System Message
              </p>
            )}
            <p>{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatBubbleView;
