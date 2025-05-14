// src/components/ChatBubbleView.tsx
import React from 'react';

interface ChatBubbleViewProps {
  chatlogText: string;
}

interface Message {
  speaker: 'Customer' | 'Agent' | 'Unknown';
  text: string;
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
      if (line.toLowerCase().startsWith('customer:')) {
        return { speaker: 'Customer', text: line.substring('customer:'.length).trim() };
      } else if (line.toLowerCase().startsWith('agent:')) {
        return { speaker: 'Agent', text: line.substring('agent:'.length).trim() };
      }
      return { speaker: 'Unknown', text: line }; // Handle lines without clear speaker
    });

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">Chatlog appears to be empty.</p>;
  }

  return (
    <div className="space-y-3 p-2 bg-muted/30 rounded-md max-h-[400px] overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.speaker === 'Agent' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${
              msg.speaker === 'Agent'
                ? 'bg-app-blue text-white' // Agent bubble (your primary blue)
                : 'bg-card border' // Customer bubble (card background)
            }`}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {/* Optional: Show speaker label if needed, or rely on alignment
            <p className={`text-xs mb-0.5 ${msg.speaker === 'Agent' ? 'text-blue-200' : 'text-muted-foreground'}`}>
              {msg.speaker}
            </p> */}
            <p>{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatBubbleView;
