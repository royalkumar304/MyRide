import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, ChatThread } from '../../types';

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messagesByThread: Record<string, ChatMessage[]>;
  isLoading: boolean;
}

const initialState: ChatState = {
  threads: [
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
  ],
  activeThreadId: 'thread-01',
  messagesByThread: {
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
  },
  isLoading: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveThreadId: (state, action: PayloadAction<string>) => {
      state.activeThreadId = action.payload;
      const thread = state.threads.find(t => t.id === action.payload);
      if (thread) {
        thread.unreadCount = 0;
      }
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { chatId } = action.payload;
      if (!state.messagesByThread[chatId]) {
        state.messagesByThread[chatId] = [];
      }
      state.messagesByThread[chatId].push(action.payload);

      // Update last message in thread
      const thread = state.threads.find(t => t.id === chatId);
      if (thread) {
        thread.lastMessage = action.payload.text;
        thread.lastMessageTime = action.payload.timestamp;
      }
    },
  },
});

export const { setActiveThreadId, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
