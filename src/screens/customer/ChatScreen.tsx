import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import { useAppDispatch, useAppSelector } from '../../store';
import { addMessage } from '../../store/slices/chatSlice';
import { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { threadId = 'thread-01', recipientName = 'Priya Sharma (Host)', bookingId = 'MYR-829431' } =
    route.params || {};

  const dispatch = useAppDispatch();
  const messages = useAppSelector(
    (state) => state.chat.messagesByThread[threadId] || []
  );

  const [inputMessage, setInputMessage] = useState('');

  const quickReplies = [
    'Where is the pickup location?',
    'What documents do I need?',
    'Can I extend the booking?',
    'Is Fastag available in the car?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      chatId: threadId,
      senderId: 'cust-curr',
      senderName: 'Gaurav',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: false,
    };

    dispatch(addMessage(newMsg));
    if (!textToSend) {
      setInputMessage('');
    }

    // Simulated host auto-reply
    setTimeout(() => {
      const hostReply: ChatMessage = {
        id: 'msg-host-' + Date.now(),
        chatId: threadId,
        senderId: 'host-103',
        senderName: recipientName,
        text: 'Got it! I am online and available. Let me know if you need anything else.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHost: true,
      };
      dispatch(addMessage(hostReply));
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={recipientName}
        subtitle={bookingId ? `Booking #${bookingId}` : undefined}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = !item.isHost;
            return (
              <View
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowMe : styles.messageRowOther,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.timestampText, isMe ? styles.timeMe : styles.timeOther]}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Quick Replies Carousel */}
        <View style={styles.quickRepliesContainer}>
          <FlatList
            data={quickReplies}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSendMessage(item)}
                style={styles.quickReplyChip}
              >
                <Text style={styles.quickReplyText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChangeText={setInputMessage}
            containerStyle={styles.inputContainer}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSendMessage()}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: colors.surface,
  },
  textOther: {
    color: colors.dark,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: colors.muted,
  },
  quickRepliesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  quickReplyChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickReplyText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
