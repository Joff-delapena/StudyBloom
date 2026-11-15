import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { generateQuiz } from '../src/services/localAi';
import { getGuides, getQuizSets, initializeDatabase, saveQuizSet } from '../src/services/storage';
import type { QuizSet, StudyGuide } from '../src/types';

export default function QuizScreen() {
  const { guideId } = useLocalSearchParams<{ guideId?: string }>();
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [quiz, setQuiz] = useState<QuizSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializeDatabase();
    const allGuides = getGuides();
    const selectedGuide = allGuides.find((item) => item.id === guideId) ?? allGuides[0] ?? null;
    setGuide(selectedGuide);

    if (selectedGuide) {
      const existing = getQuizSets(selectedGuide.id);
      if (existing.length === 0) {
        const nextQuiz = generateQuiz(selectedGuide, 5);
        saveQuizSet(nextQuiz, selectedGuide.id);
        setQuiz(nextQuiz);
      } else {
        setQuiz(existing[0]);
      }
    }
  }, [guideId]);

  if (!guide || !quiz) {
    return (
      <View style={styles.emptyState}><Text style={styles.emptyText}>Create a study guide to unlock your quiz.</Text></View>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const isComplete = currentIndex >= quiz.questions.length - 1 && showExplanation;

  const handleAnswer = (option: string) => {
    setSelected(option);
    setShowExplanation(true);

    if (option === currentQuestion.answer) {
      setScore((value) => value + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex === quiz.questions.length - 1) {
      setCurrentIndex(0);
      setSelected(null);
      setShowExplanation(false);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelected(null);
    setShowExplanation(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Practice quiz</Text>
      <Text style={styles.subtitle}>{guide.title}</Text>
      <Text style={styles.counter}>{currentIndex + 1}/{quiz.questions.length}</Text>

      <View style={styles.questionCard}>
        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>
        {currentQuestion.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              selected === option && option === currentQuestion.answer && styles.optionCorrect,
              selected === option && option !== currentQuestion.answer && styles.optionWrong,
            ]}
            onPress={() => !showExplanation && handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}

        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>Why this answer is correct</Text>
            <Text style={styles.explanation}>{currentQuestion.explanation}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={nextQuestion}>
          <Text style={styles.primaryButtonText}>{isComplete ? `Finish • score ${score}/${quiz.questions.length}` : 'Next question'}</Text>
        </TouchableOpacity>
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
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EEE8F4' },
  prompt: { color: '#40364E', fontSize: 20, fontWeight: '700', marginBottom: 18 },
  option: { backgroundColor: '#F8F4FF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE8F4' },
  optionText: { color: '#40364E', fontSize: 15 },
  optionCorrect: { backgroundColor: '#DFF7EC', borderColor: '#64C88B' },
  optionWrong: { backgroundColor: '#FCE7F3', borderColor: '#E89DBB' },
  explanationBox: { backgroundColor: '#F3EDFF', borderRadius: 12, padding: 12, marginTop: 12 },
  explanationTitle: { color: '#40364E', fontWeight: '700', marginBottom: 6 },
  explanation: { color: '#40364E', lineHeight: 20 },
  primaryButton: { backgroundColor: '#A78BFA', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
