export interface Review {
  id: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number; // Overall 1-5
  categories: {
    vehicleCondition: number;
    hostBehaviour: number;
    pickupExperience: number;
    valueForMoney: number;
  };
  comment: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscount?: number;
  minBookingAmount: number;
  validTill: string;
  badgeText: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'earnings' | 'vehicle' | 'system';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isHost: boolean;
}

export interface ChatThread {
  id: string;
  bookingId?: string;
  vehicleName: string;
  otherParticipantName: string;
  otherParticipantRole: 'CUSTOMER' | 'HOST';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: 'Booking' | 'Payment' | 'Vehicle Issue' | 'Host Dispute' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
}
