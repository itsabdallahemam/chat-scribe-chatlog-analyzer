import Dexie, { Table } from 'dexie';

export interface ChatLog {
  id?: number;
  chatlog: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  timestamp: Date;
}

class ChatLogDatabase extends Dexie {
  chatLogs!: Table<ChatLog>;

  constructor() {
    super('ChatLogDatabase');
    this.version(1).stores({
      chatLogs: '++id, timestamp' // id is auto-incremented, timestamp is indexed
    });
  }
}

export const db = new ChatLogDatabase();

// Helper functions for database operations
export const saveChatLogs = async (chatLogs: Omit<ChatLog, 'id' | 'timestamp'>[]) => {
  const timestamp = new Date();
  const logsWithTimestamp = chatLogs.map(log => ({
    ...log,
    timestamp
  }));
  
  try {
    await db.chatLogs.bulkAdd(logsWithTimestamp);
    return true;
  } catch (error) {
    console.error('Error saving chat logs:', error);
    return false;
  }
};

export const getAllChatLogs = async () => {
  try {
    return await db.chatLogs.orderBy('timestamp').reverse().toArray();
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    return [];
  }
};

export const deleteChatLog = async (id: number) => {
  try {
    await db.chatLogs.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting chat log:', error);
    return false;
  }
};

export const deleteAllChatLogs = async () => {
  try {
    await db.chatLogs.clear();
    return true;
  } catch (error) {
    console.error('Error deleting chat logs:', error);
    return false;
  }
}; 