import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Search, BarChart, Loader2, Trash2, Sparkles, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getUserChatLogEvaluations, deleteAllChatLogEvaluations, deleteChatLogEvaluation } from '@/services/chatLogEvaluationService';
import { getUserSyntheticChatLogs, deleteAllSyntheticChatLogs, deleteSyntheticChatLog } from '@/services/syntheticChatLogService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getRandomEgyptianName } from '@/utils/egyptianNames';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isAgent: boolean;
  agentName?: string;
  customerName?: string;
}

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  scenario: string;
  chatlog: string;
  metrics: {
    coherence: number;
    politeness: number;
    relevance: number;
    resolution: number;
  };
  unread?: boolean;
  type: 'uploaded' | 'generated';
}

const ConversationsTab: React.FC = () => {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [conversationType, setConversationType] = useState<'all' | 'uploaded' | 'generated'>('all');

  // Parse chatlog text into messages
  const parseChatlog = (chatlogText: string, customerName: string): Message[] => {
    if (!chatlogText) return [];
    
    const lines = chatlogText.split('\n').filter(line => line.trim() !== '');
    const messages: Message[] = [];
    
    // Updated regex to better handle both agent and customer timestamps
    const messageRegex = /^\[(\d{2}:\d{2}:\d{2})\]\s*((?:Agent\s+([^:]+)|Customer)):\s*(.*)$/;
    let agentName = '';
    
    lines.forEach((line, index) => {
      const match = line.match(messageRegex);
      if (match) {
        const [_, timestamp, sender, possibleAgentName, content] = match;
        const isAgent = sender.toLowerCase().includes('agent');
        
        // Update agent name if this is an agent message
        if (isAgent && possibleAgentName) {
          agentName = possibleAgentName.trim();
        }
        
        messages.push({
          id: `${index}`,
          timestamp: `[${timestamp}]`,
          content: content.trim(),
          isAgent,
          agentName: isAgent ? agentName : undefined,
          customerName: !isAgent ? customerName : undefined
        });
      }
    });
    
    return messages;
  };

  // Load conversations from both sources
  const loadConversations = async () => {
    setLoading(true);
    try {
      // Load uploaded conversations
      const evaluations = await getUserChatLogEvaluations();
      const uploadedLogs: Conversation[] = evaluations.map(evaluation => {
        const customerName = getRandomEgyptianName();
        const messages = parseChatlog(evaluation.chatlog, customerName);
        const lastMessage = messages[messages.length - 1]?.content || '';

        return {
          id: evaluation.id || `${Date.now()}`,
          customerName,
          lastMessage,
          timestamp: evaluation.dateTime ? format(parseISO(evaluation.dateTime), 'h:mm a') : format(new Date(), 'h:mm a'),
          scenario: evaluation.scenario,
          chatlog: evaluation.chatlog,
          metrics: {
            coherence: evaluation.coherence,
            politeness: evaluation.politeness,
            relevance: evaluation.relevance,
            resolution: evaluation.resolution
          },
          type: 'uploaded'
        };
      });

      // Load generated conversations
      const syntheticLogs = await getUserSyntheticChatLogs();
      const generatedLogs: Conversation[] = syntheticLogs.map(log => {
        const customerName = getRandomEgyptianName();
        const messages = parseChatlog(log.chatlog, customerName);
        const lastMessage = messages[messages.length - 1]?.content || '';

        // Parse metadata to get metrics
        let metrics = {
          coherence: 0,
          politeness: 0,
          relevance: 0,
          resolution: 0
        };
        try {
          if (log.metadata) {
            const metadata = JSON.parse(log.metadata);
            metrics = {
              coherence: metadata.coherence || 0,
              politeness: metadata.politeness || 0,
              relevance: metadata.relevance || 0,
              resolution: metadata.resolution || 0
            };
          }
        } catch (error) {
          console.error('Error parsing metadata:', error);
        }

        return {
          id: log.id || `${Date.now()}`,
          customerName,
          lastMessage,
          timestamp: log.startTime ? format(new Date(log.startTime), 'h:mm a') : format(new Date(), 'h:mm a'),
          scenario: log.scenario,
          chatlog: log.chatlog,
          metrics,
          type: 'generated'
        };
      });

      setConversations([...uploadedLogs, ...generatedLogs]);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete all conversations
  const handleDeleteAll = async () => {
    try {
      await Promise.all([
        deleteAllChatLogEvaluations(),
        deleteAllSyntheticChatLogs()
      ]);
      setConversations([]);
      setSelectedConversation(null);
      setShowDeleteAllDialog(false);
      toast({
        title: "Success",
        description: "All conversations have been deleted.",
      });
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversations. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Delete single conversation
  const handleDeleteConversation = async (id: string, type: 'uploaded' | 'generated') => {
    try {
      if (type === 'uploaded') {
        await deleteChatLogEvaluation(id);
      } else {
        await deleteSyntheticChatLog(id);
      }
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (selectedConversation === id) {
        setSelectedConversation(null);
      }
      toast({
        title: "Success",
        description: "Conversation has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Update messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (conversation) {
        const parsedMessages = parseChatlog(conversation.chatlog, conversation.customerName);
        setMessages(parsedMessages);
      }
    }
  }, [selectedConversation, conversations]);

  // Filter conversations based on search query and type
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      conversationType === 'all' || 
      conversation.type === conversationType;

    return matchesSearch && matchesType;
  });

  // Add new function to handle right-click
  const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault();
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.zIndex = '1000';
    contextMenu.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] animate-in fade-in';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-200';
    deleteButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete Conversation</span>
    `;
    
    deleteButton.onclick = () => {
      handleDeleteConversation(conversation.id, conversation.type);
      document.body.removeChild(contextMenu);
    };
    
    // Add hover effect
    deleteButton.onmouseenter = () => {
      deleteButton.classList.add('bg-red-50', 'dark:bg-red-900/10');
    };
    deleteButton.onmouseleave = () => {
      deleteButton.classList.remove('bg-red-50', 'dark:bg-red-900/10');
    };
    
    // Close menu when clicking outside
    const closeMenu = (e: MouseEvent) => {
      if (!contextMenu.contains(e.target as Node)) {
        contextMenu.classList.remove('animate-in');
        contextMenu.classList.add('animate-out', 'fade-out');
        setTimeout(() => {
          if (document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
          }
        }, 150);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    // Ensure menu stays within viewport
    const rect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (e.clientX + rect.width > viewportWidth) {
      contextMenu.style.left = `${viewportWidth - rect.width - 5}px`;
    }
    if (e.clientY + rect.height > viewportHeight) {
      contextMenu.style.top = `${viewportHeight - rect.height - 5}px`;
    }
    
    contextMenu.appendChild(deleteButton);
    document.body.appendChild(contextMenu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-[#f5f7fa] dark:bg-[#161925] p-6">
      <Card className="h-full border border-gray-200 dark:border-gray-800">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs value={conversationType} onValueChange={(value) => setConversationType(value as 'all' | 'uploaded' | 'generated')} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="uploaded" className="text-xs">
                    <FileUp className="h-3 w-3 mr-1" />
                    Uploaded
                  </TabsTrigger>
                  <TabsTrigger value="generated" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generated
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={conversations.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All Conversations
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      onContextMenu={(e) => handleContextMenu(e, conversation)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50",
                        selectedConversation === conversation.id && "bg-gray-100 dark:bg-gray-800/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {conversation.customerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {conversation.customerName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {conversation.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {conversation.type === 'generated' ? (
                                <Sparkles className="h-3 w-3 mr-1" />
                              ) : (
                                <FileUp className="h-3 w-3 mr-1" />
                              )}
                              {conversation.type}
                            </Badge>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {conversations.find(c => c.id === selectedConversation)?.customerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-sm">
                          {conversations.find(c => c.id === selectedConversation)?.customerName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {conversations.find(c => c.id === selectedConversation)?.scenario}
                        </p>
                      </div>
                    </div>
                    <BarChart className="h-4 w-4 text-gray-500" />
                  </div>
                  {/* Metrics */}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-[#8884d8]/10 text-[#8884d8]">
                      Coherence: {Math.round((conversations.find(c => c.id === selectedConversation)?.metrics?.coherence || 0) * 20)}%
                    </Badge>
                    <Badge variant="outline" className="bg-[#247BA0]/10 text-[#247BA0]">
                      Politeness: {Math.round((conversations.find(c => c.id === selectedConversation)?.metrics?.politeness || 0) * 20)}%
                    </Badge>
                    <Badge variant="outline" className="bg-[#22c55e]/10 text-[#22c55e]">
                      Relevance: {Math.round((conversations.find(c => c.id === selectedConversation)?.metrics?.relevance || 0) * 20)}%
                    </Badge>
                    <Badge variant="outline" className="bg-[#FF80B5]/10 text-[#FF80B5]">
                      Resolution: {Math.round((conversations.find(c => c.id === selectedConversation)?.metrics?.resolution || 0) * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.isAgent ? "justify-end" : "justify-start"
                        )}
                      >
                        {!message.isAgent && (
                          <div className="flex flex-col items-center gap-1.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        
                        <div className={cn(
                          "flex flex-col",
                          message.isAgent ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "text-xs text-gray-500 mb-1 flex items-center gap-2",
                            message.isAgent ? "justify-end" : "justify-start"
                          )}>
                            {message.isAgent 
                              ? <span>Agent {message.agentName}</span>
                              : <span>{message.customerName}</span>
                            }
                            <span className="text-gray-400">{message.timestamp}</span>
                          </div>
                          <div className={cn(
                            "group relative max-w-[80%] rounded-lg px-4 py-2.5",
                            message.isAgent
                              ? "bg-[#f1f5fd] dark:bg-[#1e2b4a] text-[#252A3A] dark:text-gray-200 rounded-tr-none"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-tl-none shadow-sm"
                          )}>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content.replace(/^\[.*?\]\s*(?:Agent\s+[^:]+|Customer):\s*/, '')}
                            </div>
                          </div>
                          
                          <div className={cn(
                            "text-xs text-gray-500 mt-1 flex items-center gap-2",
                            message.isAgent ? "justify-end pl-12" : "justify-start pr-12"
                          )}>
                            <div className="flex items-center gap-1">
                              {message.isAgent && (
                                <button 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  onClick={() => navigator.clipboard.writeText(message.content.replace(/^\[.*?\]\s*(?:Agent\s+[^:]+|Customer):\s*/, ''))}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {message.isAgent && (
                          <div className="flex flex-col items-center gap-1.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to view details
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationsTab; 