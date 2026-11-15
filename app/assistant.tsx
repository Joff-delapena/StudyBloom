import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { generateAssistantReply } from '../src/services/localAi';
import { getGuides } from '../src/services/storage';
import type { AssistantMessage, StudyGuide } from '../src/types';

const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    kind: 'assistant',
    text: 'Ask me to explain a concept, compare ideas, summarize a section, or generate more practice questions.',
  },
];

export default function AssistantScreen() {
  const { guideId } = useLocalSearchParams<{ guideId?: string }>();
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [input, setInput] = useState('');

  useEffect(() => {
    const allGuides = getGuides();
    const selectedGuide = allGuides.find((item) => item.id === guideId) ?? allGuides[0] ?? null;
    setGuide(selectedGuide);
  }, [guideId]);

  const sendMessage = () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `${Date.now()}`,
      kind: 'user',
      text: input.trim(),
    };

    const context = guide ? guide.overview + ' ' + guide.sections.map((section) => section.body.join(' ')).join(' ') : 'No lesson selected yet.';
    const response: AssistantMessage = {
      id: `${Date.now()}-assistant`,
      kind: 'assistant',
      text: generateAssistantReply(context, input.trim()),
    };

    setMessages((current) => [...current, userMessage, response]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline study assistant</Text>
        <Text style={styles.subtitle}>{guide ? guide.title : 'No active guide selected'}</Text>
      </View>

      <ScrollView style={styles.messageList} contentContainerStyle={styles.messageListContent}>
        {messages.map((message) => (
          <View key={message.id} style={[styles.bubble, message.kind === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.bubbleText, message.kind === 'user' && styles.userBubbleText]}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about the lesson..."
          multiline
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { color: '#40364E', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#91899D', marginTop: 6 },
  messageList: { flex: 1 },
  messageListContent: { padding: 20, paddingBottom: 24 },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 12 },
  assistantBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE8F4' },
  userBubble: { backgroundColor: '#A78BFA', alignSelf: 'flex-end' },
  bubbleText: { color: '#40364E', lineHeight: 22 },
  userBubbleText: { color: '#FFFFFF' },
  inputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#EEE8F4', backgroundColor: '#FFFFFF' },
  input: { flex: 1, borderWidth: 1, borderColor: '#EEE8F4', borderRadius: 12, padding: 12, backgroundColor: '#FBFAFF', color: '#40364E', maxHeight: 120 },
  sendButton: { backgroundColor: '#8B6CCB', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center', marginLeft: 8 },
  sendButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
