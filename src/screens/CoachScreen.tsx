import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing, fonts} from '../theme/typography';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import ChatBubble from '../components/ChatBubble';
import {useAppStore} from '../store/useAppStore';
import {useDayTotals, useTargets, useWaterToday} from '../hooks/useNutrition';
import {todayKey} from '../utils/date';
import {
  coachReply,
  isCoachAvailable,
  COACH_SUGGESTIONS,
  ChatTurn,
} from '../services/coach';

export const CoachScreen: React.FC = () => {
  const {theme} = useTheme();
  const chat = useAppStore(s => s.chat);
  const pushChat = useAppStore(s => s.pushChat);
  const updateChat = useAppStore(s => s.updateChat);
  const clearChat = useAppStore(s => s.clearChat);
  const profile = useAppStore(s => s.profile);
  const enableAI = useAppStore(s => s.settings.enableAICoach);

  const today = todayKey();
  const totals = useDayTotals(today);
  const targets = useTargets();
  const water = useWaterToday(today);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const stopRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    isCoachAvailable().then(v => setAiReady(v && enableAI));
  }, [enableAI]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 80);
    return () => clearTimeout(t);
  }, [chat]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setInput('');
    stopRef.current = false;

    pushChat({role: 'user', content});

    const history: ChatTurn[] = [
      ...chat
        .filter(m => m.role !== 'system')
        .map(m => ({role: m.role as 'user' | 'assistant', content: m.content})),
      {role: 'user', content},
    ];

    const assistantId = pushChat({role: 'assistant', content: '', pending: true});
    setBusy(true);

    try {
      const {text: reply} = await coachReply(
        history,
        {
          profile,
          targets,
          consumed: totals,
          waterMl: water,
        },
        {
          onToken: t => updateChat(assistantId, {content: t}),
          shouldStop: () => stopRef.current,
        },
      );
      updateChat(assistantId, {content: reply, pending: false});
    } catch {
      updateChat(assistantId, {
        content: 'Sorry, something went wrong. Please try again.',
        pending: false,
      });
    } finally {
      setBusy(false);
    }
  };

  const empty = chat.length === 0;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.bg}} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="robot-happy" size={24} color={theme.primary} />
        </View>
        <View style={{flex: 1, marginLeft: spacing.md}}>
          <Txt variant="h3">Nutri Coach</Txt>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: aiReady ? theme.success : theme.warning,
                marginRight: 5,
              }}
            />
            <Txt variant="caption" tone="muted">
              {aiReady === null
                ? 'Checking…'
                : aiReady
                ? 'On-device AI (SmolLM2)'
                : 'Smart tips mode'}
            </Txt>
          </View>
        </View>
        {!empty ? (
          <Pressable onPress={clearChat} hitSlop={8}>
            <Icon name="broom" size={22} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{padding: spacing.lg}}
          keyboardShouldPersistTaps="handled">
          {empty ? (
            <View style={{paddingTop: spacing.xl}}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                }}>
                <Icon name="robot-happy" size={38} color={theme.primary} />
              </View>
              <Txt variant="h2" center style={{marginTop: spacing.lg}}>
                Hi, I'm Nutri 🥗
              </Txt>
              <Txt tone="muted" center style={{marginTop: spacing.xs, marginBottom: spacing.xl}}>
                Ask me about meals, macros, hydration or habits. I know your
                goals and today's progress.
              </Txt>
              {COACH_SUGGESTIONS.map(s => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({pressed}) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.bgElevated,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    opacity: pressed ? 0.7 : 1,
                  })}>
                  <Icon name="message-text-outline" size={18} color={theme.primary} />
                  <Txt style={{marginLeft: spacing.md, flex: 1}}>{s}</Txt>
                  <Icon name="arrow-top-right" size={16} color={theme.textFaint} />
                </Pressable>
              ))}
            </View>
          ) : (
            chat
              .filter(m => m.role !== 'system')
              .map(m => <ChatBubble key={m.id} message={m} />)
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.bg,
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.bgSunken,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.lg,
              maxHeight: 120,
            }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask Nutri anything…"
              placeholderTextColor={theme.textFaint}
              multiline
              style={{color: theme.text, paddingVertical: spacing.md, ...fonts.body}}
            />
          </View>
          {busy ? (
            <Pressable
              onPress={() => (stopRef.current = true)}
              style={{
                marginLeft: spacing.sm,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.bgSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="stop" size={22} color={theme.danger} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim()}
              style={{
                marginLeft: spacing.sm,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: input.trim() ? theme.primary : theme.bgSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon
                name="send"
                size={20}
                color={input.trim() ? theme.textOnPrimary : theme.textFaint}
              />
            </Pressable>
          )}
        </View>
        {busy ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: spacing.sm,
            }}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Txt variant="caption" tone="muted" style={{marginLeft: 6}}>
              {aiReady ? 'Nutri is thinking on-device…' : 'Thinking…'}
            </Txt>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CoachScreen;
