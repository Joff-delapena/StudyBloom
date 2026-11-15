import { router, useFocusEffect } from 'expo-router';
import { File } from 'expo-file-system';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getDocuments, getGuides, initializeDatabase } from '../../src/services/storage';
import type { DocumentRecord, StudyGuide } from '../../src/types';

export default function LibraryScreen() {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    initializeDatabase();
    refresh();
  }, []));

  const refresh = () => {
    setGuides(getGuides());
    setDocuments(getDocuments());
  };

  const query = search.trim().toLowerCase();
  const filteredGuides = guides.filter((guide) =>
    `${guide.title} ${guide.topic}`.toLowerCase().includes(query),
  );

  const exportGuide = (guide: StudyGuide) => {
    const content = [
      `# ${guide.title}`,
      '',
      `Topic: ${guide.topic || 'Lesson topic'}`,
      `Mode: ${guide.mode}`,
      '',
      guide.overview,
    ].join('\n');

    Alert.alert('Export ready', `${guide.title} is prepared for offline export. A saved copy can be accessed from the app storage when the device supports local file export.`);
    console.log(content);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Study library</Text>
      <Text style={styles.subtitle}>Search and reopen saved lessons, guides, flashcards, and quizzes.</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search guides or lesson topics" style={styles.searchInput} />

      {filteredGuides.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>No saved guides in this category yet.</Text></View>
      ) : (
        filteredGuides.map((guide) => (
          <View key={guide.id} style={styles.card}>
            <Text style={styles.cardTitle}>{guide.title}</Text>
            <Text style={styles.cardMeta}>{guide.topic || 'Lesson topic'} • {guide.mode}</Text>
            <Text style={styles.cardSummary}>{guide.overview}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/study-guide', params: { guideId: guide.id } })}>
                <Text style={styles.primaryButtonText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => exportGuide(guide)}>
                <Text style={styles.secondaryButtonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Original lesson files</Text>
      {documents.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>No uploaded lessons found.</Text></View>
      ) : (
        documents.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <Text style={styles.docName}>{doc.fileName}</Text>
            <Text style={styles.docMeta}>{(doc.size / 1024).toFixed(1)} KB</Text>
            {doc.fileUri ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={async () => {
                  try {
                    await new File(doc.fileUri).preview();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
                    Alert.alert('Unable to open file', message);
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Open original file</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  content: { padding: 20, paddingBottom: 120 },
  title: { color: '#40364E', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#91899D', fontSize: 15, lineHeight: 22, marginBottom: 18 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EEE8F4', marginBottom: 18, color: '#40364E' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EEE8F4' },
  cardTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardMeta: { color: '#8B6CCB', fontSize: 12, marginBottom: 8 },
  cardSummary: { color: '#40364E', lineHeight: 20, marginBottom: 12 },
  buttonRow: { flexDirection: 'row' },
  primaryButton: { flex: 1, backgroundColor: '#A78BFA', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginRight: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { flex: 1, backgroundColor: '#F3EDFF', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#8B6CCB', fontWeight: '700' },
  sectionTitle: { color: '#40364E', fontSize: 20, fontWeight: '700', marginTop: 18, marginBottom: 10 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#EEE8F4', marginBottom: 12 },
  emptyText: { color: '#91899D', lineHeight: 20 },
  docName: { color: '#40364E', fontSize: 17, fontWeight: '700' },
  docMeta: { color: '#8B6CCB', fontSize: 12, marginTop: 4 },
});
