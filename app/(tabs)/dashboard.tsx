import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { generateFlashcards, generateQuiz, generateStudyGuide } from '../../src/services/localAi';
import { getDocuments, getFlashcards, getGuides, initializeDatabase } from '../../src/services/storage';
import type { DocumentRecord, StudyGuide } from '../../src/types';

export default function DashboardScreen() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [guides, setGuides] = useState<StudyGuide[]>([]);

  useEffect(() => {
    initializeDatabase();
    setDocuments(getDocuments());
    setGuides(getGuides());
  }, []);

  const totalFlashcards = guides.reduce((count, guide) => count + getFlashcards(guide.id).length, 0);
  const totalQuizzes = guides.reduce((count, guide) => count + (generateQuiz(guide, 3).questions.length > 0 ? 1 : 0), 0);
  const recentGuides = guides.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerRight}>
          <Image source={require('../../assets/dashboard-wordmark.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Your study companion</Text>
        <Text style={styles.heroText}>Upload lessons, build reviewers, and keep everything stored privately on this device.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/upload')}>
          <Text style={styles.primaryButtonText}>Quick upload</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Study guides</Text><Text style={styles.statValue}>{guides.length}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Lessons</Text><Text style={styles.statValue}>{documents.length}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Flashcards</Text><Text style={styles.statValue}>{totalFlashcards}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Quizzes</Text><Text style={styles.statValue}>{totalQuizzes}</Text></View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent study materials</Text>
        <Link href="/(tabs)/library" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>View all</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {recentGuides.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No guides yet</Text>
          <Text style={styles.emptyText}>Add a lesson and generate your first study guide to start learning.</Text>
        </View>
      ) : (
        recentGuides.map((guide) => (
          <TouchableOpacity key={guide.id} style={styles.materialCard} onPress={() => router.push({ pathname: '/study-guide', params: { guideId: guide.id } })}>
            <Text style={styles.materialTitle}>{guide.title}</Text>
            <Text style={styles.materialMeta}>{guide.topic || 'Lesson topic'} • {new Date(guide.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.materialOverview}>{guide.overview}</Text>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Continue studying</Text>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/flashcards')}>
          <Text style={styles.actionLabel}>Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/quiz')}>
          <Text style={styles.actionLabel}>Practice quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/assistant')}>
          <Text style={styles.actionLabel}>AI assistant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Model status</Text>
        <Text style={styles.statusText}>Offline model engine ready</Text>
        <Text style={styles.statusLabel}>Study materials stay on this device</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  content: { padding: 20, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerRight: { alignItems: 'center', gap: 6 },
  headerLogo: { width: 170, height: 58 },
  eyebrow: { color: '#8B6CCB', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#40364E', fontSize: 30, fontWeight: '700' },
  badge: { backgroundColor: '#EDE7FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  badgeText: { color: '#8B6CCB', fontWeight: '700' },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, marginBottom: 18, shadowColor: '#A78BFA', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  heroTitle: { color: '#40364E', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  heroText: { color: '#91899D', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  primaryButton: { backgroundColor: '#A78BFA', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#A78BFA', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  statLabel: { color: '#91899D', fontSize: 13 },
  statValue: { marginTop: 8, color: '#40364E', fontSize: 28, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  sectionTitle: { color: '#40364E', fontSize: 18, fontWeight: '700' },
  linkText: { color: '#8B6CCB', fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, marginBottom: 12 },
  emptyTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: '#91899D', lineHeight: 20 },
  materialCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8F4' },
  materialTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  materialMeta: { color: '#8B6CCB', fontSize: 12, marginBottom: 8 },
  materialOverview: { color: '#40364E', lineHeight: 20 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EEE8F4' },
  actionLabel: { color: '#40364E', fontWeight: '700' },
  statusCard: { backgroundColor: '#F3EDFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E7DFFF' },
  statusTitle: { color: '#40364E', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  statusText: { color: '#8B6CCB', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  statusLabel: { color: '#91899D', fontSize: 13 },
});
