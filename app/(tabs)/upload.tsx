import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { REVIEWER_MODES } from '../../src/data/reviewerModes';
import { generateFlashcards, generateQuiz, generateStudyGuide } from '../../src/services/localAi';
import { deleteDocumentById, getDocuments, initializeDatabase, saveDocument, saveFlashcards, saveGuide, saveQuizSet } from '../../src/services/storage';
import type { DocumentRecord, ReviewerMode } from '../../src/types';

export default function UploadScreen() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [mode, setMode] = useState<ReviewerMode>('Detailed Reviewer');
  const [title, setTitle] = useState('');

  useEffect(() => {
    initializeDatabase();
    setDocuments(getDocuments());
  }, []);

  const refreshDocuments = () => setDocuments(getDocuments());

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
        ],
      });

      if (!result.assets || result.assets.length === 0) {
        return;
      }

      const savedDocs: DocumentRecord[] = [];
      const lessonDirectory = new Directory(Paths.document, 'lessons');
      lessonDirectory.create({ idempotent: true, intermediates: true });

      for (const asset of result.assets) {
        let extractedText = '';
        if (asset.name?.toLowerCase().endsWith('.txt')) {
          extractedText = await new File(asset.uri).text();
        }

        const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        const safeFileName = (asset.name ?? 'Lesson').replace(/[<>:"/\\|?*]/g, '_');
        const permanentFile = new File(lessonDirectory, `${id}-${safeFileName}`);
        await new File(asset.uri).copy(permanentFile);

        const doc: DocumentRecord = {
          id,
          fileName: asset.name ?? 'Lesson',
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size ?? 0,
          topic: '',
          fileUri: permanentFile.uri,
          text: extractedText,
          createdAt: new Date().toISOString(),
          status: extractedText.trim() ? 'ready' : 'failed',
        };

        saveDocument(doc);
        savedDocs.push(doc);
      }

      setDocuments(getDocuments());
      if (savedDocs.length > 0) {
        Alert.alert('Files saved locally', `${savedDocs.length} lesson file(s) were added to your StudyBloom library.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Could not save lesson', `The selected file was not saved to your library. ${message}`);
    }
  };

  const createGuideFromDocument = (document: DocumentRecord) => {
    if (!document.text.trim()) {
      Alert.alert('Lesson text unavailable', 'StudyBloom cannot extract text from this file yet. Please use a TXT file so the topic can be identified from its contents.');
      return;
    }

    const finalTitle = title.trim() || undefined;
    const guide = generateStudyGuide(document.text, mode, finalTitle);
    saveGuide(guide);
    saveFlashcards(guide.id, generateFlashcards(guide));
    saveQuizSet(generateQuiz(guide, 5), guide.id);
    router.push({ pathname: '/study-guide', params: { guideId: guide.id } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload lessons</Text>
      <Text style={styles.subtitle}>Choose lesson files stored on your device. Topics are inferred from extracted text; TXT extraction is currently supported.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reviewer mode</Text>
        <View style={styles.rowWrap}>
          {REVIEWER_MODES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.modeChip, item === mode && styles.modeChipActive]}
              onPress={() => setMode(item as ReviewerMode)}
            >
              <Text style={[styles.modeChipText, item === mode && styles.modeChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lesson title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Optional custom title" style={styles.input} />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={pickFiles}>
        <Text style={styles.primaryButtonText}>Select files</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Uploaded lessons</Text>
      {documents.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>No uploaded lessons yet. Use the picker above to add teaching materials.</Text></View>
      ) : (
        documents.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            <Text style={styles.docName}>{document.fileName}</Text>
            <Text style={styles.docMeta}>{(document.size / 1024).toFixed(1)} KB • {document.text.trim() ? 'Text ready' : 'Text extraction unavailable'}</Text>
            <Text style={styles.docExcerpt}>{document.text.trim() ? `${document.text.slice(0, 120)}...` : 'Topic inference requires readable lesson text. TXT files are supported.'}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => createGuideFromDocument(document)}>
                <Text style={styles.secondaryButtonText}>Generate guide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => { deleteDocumentById(document.id); refreshDocuments(); }}>
                <Text style={styles.dangerButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EEE8F4' },
  cardTitle: { color: '#40364E', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  modeChip: { backgroundColor: '#F8F4FF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  modeChipActive: { backgroundColor: '#A78BFA' },
  modeChipText: { color: '#40364E', fontWeight: '600' },
  modeChipTextActive: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: '#EEE8F4', borderRadius: 12, padding: 12, backgroundColor: '#FBFAFF', color: '#40364E' },
  primaryButton: { backgroundColor: '#A78BFA', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 18 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  sectionTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#EEE8F4' },
  emptyText: { color: '#91899D', lineHeight: 20 },
  documentCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8F4' },
  docName: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  docMeta: { color: '#8B6CCB', fontSize: 12, marginBottom: 8 },
  docExcerpt: { color: '#40364E', lineHeight: 20, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { flex: 1, backgroundColor: '#F3EDFF', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginRight: 8 },
  secondaryButtonText: { color: '#8B6CCB', fontWeight: '700' },
  dangerButton: { flex: 1, backgroundColor: '#FCE7F3', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  dangerButtonText: { color: '#C4608B', fontWeight: '700' },
});
