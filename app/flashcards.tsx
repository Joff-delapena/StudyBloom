import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { generateFlashcards } from '../src/services/localAi';
import { getFlashcards, getGuides, initializeDatabase, saveFlashcards } from '../src/services/storage';
import type { Flashcard, StudyGuide } from '../src/types';

export default function FlashcardsScreen() {
  const { guideId } = useLocalSearchParams<{ guideId?: string }>();
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    initializeDatabase();
    const allGuides = getGuides();
    const selectedGuide = allGuides.find((item) => item.id === guideId) ?? allGuides[0] ?? null;
    setGuide(selectedGuide);

    if (selectedGuide) {
      const nextCards = getFlashcards(selectedGuide.id);
      if (nextCards.length === 0) {
        const generatedCards = generateFlashcards(selectedGuide);
        saveFlashcards(selectedGuide.id, generatedCards);
        setCards(generatedCards);
      } else {
        setCards(nextCards);
      }
    }
  }, [guideId]);

  if (!guide || cards.length === 0) {
    return (
      <View style={styles.emptyState}><Text style={styles.emptyText}>Generate a study guide before creating flashcards.</Text></View>
    );
  }

  const currentCard = cards[currentIndex % cards.length];

  const previousCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Flashcards</Text>
      <Text style={styles.subtitle}>{guide.title}</Text>
      <Text style={styles.counter}>{currentIndex + 1} / {cards.length}</Text>

      <TouchableOpacity style={styles.card} onPress={() => setFlipped((value) => !value)}>
        <Text style={styles.cardLabel}>{flipped ? 'Answer' : 'Question'}</Text>
        <Text style={styles.cardText}>{flipped ? currentCard.answer : currentCard.question}</Text>
        <Text style={styles.cardHint}>{flipped ? currentCard.explanation : 'Tap to flip card'}</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={previousCard}><Text style={styles.secondaryButtonText}>Previous</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={nextCard}><Text style={styles.secondaryButtonText}>Next</Text></TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.goodButton} onPress={() => setCurrentIndex((prev) => (prev + 1) % cards.length)}><Text style={styles.goodButtonText}>Know it</Text></TouchableOpacity>
        <TouchableOpacity style={styles.reviewButton} onPress={() => setCurrentIndex((prev) => (prev + 1) % cards.length)}><Text style={styles.reviewButtonText}>Review again</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  content: { padding: 20, paddingBottom: 120 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFAFF' },
  emptyText: { color: '#40364E', fontSize: 18, fontWeight: '700' },
  title: { color: '#40364E', fontSize: 30, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#91899D', fontSize: 16, marginBottom: 8 },
  counter: { color: '#8B6CCB', fontWeight: '700', marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, minHeight: 240, justifyContent: 'center', borderWidth: 1, borderColor: '#EEE8F4', shadowColor: '#A78BFA', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  cardLabel: { color: '#8B6CCB', fontWeight: '700', marginBottom: 12 },
  cardText: { color: '#40364E', fontSize: 24, fontWeight: '700', lineHeight: 32 },
  cardHint: { color: '#91899D', marginTop: 18 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  secondaryButton: { flex: 1, backgroundColor: '#F3EDFF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  secondaryButtonText: { color: '#40364E', fontWeight: '700' },
  goodButton: { flex: 1, backgroundColor: '#DFF7EC', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  goodButtonText: { color: '#1F7A4C', fontWeight: '700' },
  reviewButton: { flex: 1, backgroundColor: '#FCE7F3', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reviewButtonText: { color: '#C4608B', fontWeight: '700' },
});
