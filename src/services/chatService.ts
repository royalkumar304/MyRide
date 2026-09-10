import { ChatMessage, ChatThread } from '../types';
import { ApiResponse } from './api';
import { mockChatService } from './mock/mockChatService';

export const chatService = {
  async getThreads(): Promise<ApiResponse<ChatThread[]>> {
    return mockChatService.getThreads();
  },

  async getMessages(threadId: string): Promise<ApiResponse<ChatMessage[]>> {
    return mockChatService.getMessages(threadId);
  },

  async sendMessage(
    threadId: string,
    text: string,
    senderName: string,
    isHost: boolean
  ): Promise<ApiResponse<ChatMessage>> {
    return mockChatService.sendMessage(threadId, text, senderName, isHost);
  },
};
