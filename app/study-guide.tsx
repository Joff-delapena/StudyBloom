import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getGuides } from '../src/services/storage';
import type { StudyGuide } from '../src/types';

export default function StudyGuideScreen() {
  const { guideId } = useLocalSearchParams<{ guideId?: string }>();
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [search, setSearch] = useState('');
  const [textSize, setTextSize] = useState(16);

  useEffect(() => {
    const nextGuide = getGuides().find((item) => item.id === guideId);
    setGuide(nextGuide ?? null);
  }, [guideId]);

  const visibleSections = useMemo(() => {
    if (!guide) {
      return [] as typeof guide extends null ? never[] : StudyGuide['sections'];
    }

    const value = search.trim().toLowerCase();
    if (!value) {
      return guide.sections;
    }

    return guide.sections.filter((section) => {
      const titleMatches = section.title.toLowerCase().includes(value);
      const bodyMatches = section.body.some((entry) => entry.toLowerCase().includes(value));
      return titleMatches || bodyMatches;
    });
  }, [guide, search]);

  if (!guide) {
    return (
      <View style={styles.emptyState}><Text style={styles.emptyText}>No study guide found.</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>{guide.topic || 'Lesson topic'}</Text>
      <Text style={[styles.title, { fontSize: textSize + 14 }]}>{guide.title}</Text>
      <Text style={[styles.overview, { fontSize: textSize }]}>{guide.overview}</Text>

      <View style={styles.toolbar}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search this reviewer" style={styles.searchInput} />
        <TouchableOpacity style={styles.scaleButton} onPress={() => setTextSize((current) => Math.min(22, current + 1))}>
          <Text style={styles.scaleButtonText}>A+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scaleButton} onPress={() => setTextSize((current) => Math.max(14, current - 1))}>
          <Text style={styles.scaleButtonText}>A-</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Learning objectives</Text>
        {guide.learningObjectives.map((item) => (
          <Text key={item} style={[styles.bullet, { fontSize: textSize }]}>{'• '}{item}</Text>
        ))}
      </View>

      {visibleSections.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.body.map((entry) => (
            <Text key={entry} style={[styles.paragraph, { fontSize: textSize }]}>{entry}</Text>
          ))}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick review</Text>
        {guide.quickReview.map((item) => (
          <Text key={item} style={[styles.bullet, { fontSize: textSize }]}>{'• '}{item}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Practice questions</Text>
        {guide.practiceQuestions.map((item, index) => (
          <Text key={item} style={[styles.bullet, { fontSize: textSize }]}>{index + 1}. {item}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Answer key</Text>
        {guide.answerKey.map((item, index) => (
          <Text key={item} style={[styles.bullet, { fontSize: textSize }]}>{index + 1}. {item}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  content: { padding: 20, paddingBottom: 120 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFAFF' },
  emptyText: { color: '#40364E', fontSize: 18, fontWeight: '700' },
  eyebrow: { color: '#8B6CCB', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 },
  title: { color: '#40364E', fontWeight: '700', marginBottom: 10 },
  overview: { color: '#40364E', lineHeight: 24, marginBottom: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE8F4', marginRight: 8 },
  scaleButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3EDFF', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  scaleButtonText: { color: '#8B6CCB', fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8F4' },
  sectionTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  paragraph: { color: '#40364E', lineHeight: 24, marginBottom: 8 },
  bullet: { color: '#40364E', lineHeight: 24, marginBottom: 6 },
});
