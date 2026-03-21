import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { aiCoachService } from '../services/aiCoachService';
import { useFocusEffect } from '@react-navigation/native';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  'How much protein should I eat daily?',
  'Best exercises for weight loss?',
  'Healthy snack ideas?',
  'Tips for staying hydrated?',
  'How to build muscle effectively?',
  'What should I eat pre-workout?',
];

const AICoachScreen = () => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelInitializing, setModelInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingTargetRef = useRef('');
  const streamingDisplayedRef = useRef('');

  useEffect(() => {
    initializeModel();

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChatHistory();
    }, []),
  );

  const initializeModel = async () => {
    try {
      setModelInitializing(true);
      setInitError(null);
      await aiCoachService.initialize();
      setModelInitializing(false);
    } catch (error) {
      console.error('Failed to initialize model:', error);
      setInitError('Using offline mode with smart responses');
      setModelInitializing(false);
    }
  };

  const loadChatHistory = async () => {
    const history = await aiCoachService.getChatHistory();
    setMessages(history.filter(m => m.role !== 'system'));
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    setInput('');
    setLoading(true);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };
    const assistantTimestamp = Date.now() + 1;
    const assistantPlaceholder: Message = {
      role: 'assistant',
      content: '',
      timestamp: assistantTimestamp,
    };

    setMessages(prev => [...prev, userMessage, assistantPlaceholder]);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    streamingTargetRef.current = '';
    streamingDisplayedRef.current = '';

    const updateAssistantMessage = (nextContent: string) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.timestamp === assistantTimestamp
            ? { ...msg, content: nextContent }
            : msg,
        ),
      );
    };

    const startTypingLoop = () => {
      if (typingIntervalRef.current) {
        return;
      }

      typingIntervalRef.current = setInterval(() => {
        if (streamingDisplayedRef.current.length >= streamingTargetRef.current.length) {
          return;
        }

        const nextLength = streamingDisplayedRef.current.length + 1;
        const nextContent = streamingTargetRef.current.slice(0, nextLength);
        streamingDisplayedRef.current = nextContent;
        updateAssistantMessage(nextContent);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 12);
    };

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await aiCoachService.askCoachStream(textToSend, {
        onPartialText: (partialText: string) => {
          streamingTargetRef.current = partialText;
          startTypingLoop();
        },
      });

      streamingTargetRef.current = response;
      startTypingLoop();

      while (streamingDisplayedRef.current.length < streamingTargetRef.current.length) {
        await new Promise(resolve => setTimeout(resolve, 8));
      }

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error getting response:', error);
      const errorText = 'Sorry, I encountered an error. Please try again or rephrase your question.';
      streamingTargetRef.current = errorText;
      startTypingLoop();
      while (streamingDisplayedRef.current.length < streamingTargetRef.current.length) {
        await new Promise(resolve => setTimeout(resolve, 8));
      }
    } finally {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await aiCoachService.clearHistory();
            setMessages([]);
          },
        },
      ]
    );
  };

  if (modelInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>AI Coach 🧠</Text>
          <Text style={styles.headerSubtitle}>Your personal nutrition & fitness advisor</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading AI model...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.mutedText }]}>
            This may take a moment on first launch
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>AI Coach 🧠</Text>
            <Text style={styles.headerSubtitle}>
              {initError ? 'Offline Mode' : 'Powered by AI'}
            </Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {initError && (
          <Text style={styles.warningText}>ℹ️ {initError}</Text>
        )}
      </View>

      {/* Welcome / Quick Prompts */}
      {messages.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            👋 Hi! I'm your AI nutrition & fitness coach
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
            Ask me anything about diet, exercise, or healthy habits!
          </Text>
          <Text style={[styles.quickPromptsTitle, { color: colors.text }]}>
            Try asking:
          </Text>
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.promptChip, { backgroundColor: colors.surface }]}
                onPress={() => sendMessage(prompt)}>
                <Text style={[styles.promptText, { color: colors.text }]}>
                  💬 {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user'
                ? [styles.userMessage, { backgroundColor: colors.primary }]
                : [styles.assistantMessage, { backgroundColor: colors.card }],
            ]}>
            <Text
              style={[
                styles.messageText,
                { color: message.role === 'user' ? 'white' : colors.text },
              ]}>
              {message.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                { color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : colors.mutedText },
              ]}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <View style={[styles.messageBubble, styles.assistantMessage, { backgroundColor: colors.card }]}>
            <View style={styles.loadingDots}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingDotsText, { color: colors.mutedText }]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.mutedText}
          multiline
          maxLength={500}
          editable={!loading}
          onSubmitEditing={() => {
            if (input.trim() && !loading) {
              sendMessage();
            }
          }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: input.trim() && !loading ? colors.primary : colors.border },
          ]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}>
          <Text style={styles.sendButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingDotsText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  quickPromptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  quickPrompts: {
    gap: 10,
    width: '100%',
  },
  promptChip: {
    padding: 14,
    borderRadius: 12,
  },
  promptText: {
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
  },
});

export default AICoachScreen;
