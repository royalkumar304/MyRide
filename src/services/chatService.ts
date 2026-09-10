import { ChatMessage, ChatThread } from '../types';
import { mockApiCall, ApiResponse } from './api';

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-01',
    bookingId: 'MYR-829431',
    vehicleName: 'Hyundai i20 Sportz',
    otherParticipantName: 'Priya Sharma (Host)',
    otherParticipantRole: 'HOST',
    lastMessage: 'Ji, car is completely ready. I have kept the keys with security guard at Gomti Nagar.',
    lastMessageTime: '10:45 AM',
    unreadCount: 1,
  },
  {
    id: 'thread-02',
    bookingId: 'MYR-491028',
    vehicleName: 'Honda Activa 6G',
    otherParticipantName: 'Rahul Verma (Host)',
    otherParticipantRole: 'HOST',
    lastMessage: 'Thank you for returning the scooter on time!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'thread-01': [
    {
      id: 'msg-1',
      chatId: 'thread-01',
      senderId: 'cust-curr',
      senderName: 'Gaurav',
      text: 'Namaste Priya ji! Where exactly is the pickup point in Gomti Nagar?',
      timestamp: '10:30 AM',
      isHost: false,
    },
    {
      id: 'msg-2',
      chatId: 'thread-01',
      senderId: 'host-103',
      senderName: 'Priya Sharma',
      text: 'Namaste Gaurav! Near Manoj Pandey Chauraha, Gomti Nagar. Tower B.',
      timestamp: '10:35 AM',
      isHost: true,
    },
    {
      id: 'msg-3',
      chatId: 'thread-01',
      senderId: 'host-103',
      senderName: 'Priya Sharma',
      text: 'Ji, car is completely ready. I have kept the keys with security guard at Gomti Nagar.',
      timestamp: '10:45 AM',
      isHost: true,
    },
  ],
};

export const chatService = {
  async getThreads(): Promise<ApiResponse<ChatThread[]>> {
    return mockApiCall(INITIAL_THREADS, 200);
  },

  async getMessages(threadId: string): Promise<ApiResponse<ChatMessage[]>> {
    return mockApiCall(INITIAL_MESSAGES[threadId] || [], 200);
  },

  async sendMessage(threadId: string, text: string, senderName: string, isHost: boolean): Promise<ApiResponse<ChatMessage>> {
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      chatId: threadId,
      senderId: isHost ? 'host-curr' : 'cust-curr',
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost,
    };
    if (!INITIAL_MESSAGES[threadId]) {
      INITIAL_MESSAGES[threadId] = [];
    }
    INITIAL_MESSAGES[threadId].push(newMsg);
    return mockApiCall(newMsg, 150);
  },
};
