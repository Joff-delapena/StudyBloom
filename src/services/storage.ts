import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';

import type { DocumentRecord, Flashcard, QuizSet, StudyGuide } from '../types';

const db = SQLite.openDatabaseSync('studybloom.db');

export function initializeDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id TEXT PRIMARY KEY,
      fileName TEXT,
      mimeType TEXT,
      size INTEGER,
      topic TEXT,
      fileUri TEXT,
      createdAt TEXT,
      text TEXT,
      status TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS study_guides (
      id TEXT PRIMARY KEY,
      title TEXT,
      topic TEXT,
      mode TEXT,
      overview TEXT,
      learningObjectives TEXT,
      keyTerms TEXT,
      sections TEXT,
      quickReview TEXT,
      practiceQuestions TEXT,
      answerKey TEXT,
      createdAt TEXT
    );
  `);

  const documentColumns = db.getAllSync('PRAGMA table_info(uploaded_documents);') as Array<{ name: string }>;
  if (!documentColumns.some((column) => column.name === 'topic')) {
    db.execSync('ALTER TABLE uploaded_documents ADD COLUMN topic TEXT;');
  }
  if (!documentColumns.some((column) => column.name === 'fileUri')) {
    db.execSync('ALTER TABLE uploaded_documents ADD COLUMN fileUri TEXT;');
  }

  const guideColumns = db.getAllSync('PRAGMA table_info(study_guides);') as Array<{ name: string }>;
  if (!guideColumns.some((column) => column.name === 'topic')) {
    db.execSync('ALTER TABLE study_guides ADD COLUMN topic TEXT;');
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      guideId TEXT,
      question TEXT,
      answer TEXT,
      explanation TEXT,
      difficulty TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS quiz_sets (
      id TEXT PRIMARY KEY,
      title TEXT,
      guideId TEXT,
      questions TEXT,
      createdAt TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function saveDocument(document: DocumentRecord): void {
  db.runSync(
    `INSERT OR REPLACE INTO uploaded_documents (id, fileName, mimeType, size, topic, fileUri, createdAt, text, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      document.id,
      document.fileName,
      document.mimeType,
      document.size,
      document.topic,
      document.fileUri,
      document.createdAt,
      document.text,
      document.status,
    ],
  );
}

export function getDocuments(): DocumentRecord[] {
  const rows = db.getAllSync('SELECT * FROM uploaded_documents ORDER BY createdAt DESC;') as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const storedText = String(row.text ?? '');
    const text = /^(Uploaded lecture:|Text file uploaded:|Unable to read text directly from)/i.test(storedText)
      ? ''
      : storedText;

    return {
      id: String(row.id ?? ''),
      fileName: String(row.fileName ?? 'Untitled file'),
      mimeType: String(row.mimeType ?? 'application/octet-stream'),
      size: Number(row.size ?? 0),
      topic: String(row.topic ?? ''),
      fileUri: String(row.fileUri ?? ''),
      createdAt: String(row.createdAt ?? new Date().toISOString()),
      text,
      status: text.trim() ? 'ready' : 'failed',
    };
  });
}

export function deleteDocumentById(id: string): void {
  const row = db.getFirstSync('SELECT fileUri FROM uploaded_documents WHERE id = ?;', [id]) as { fileUri?: string } | null;
  if (row?.fileUri) {
    const file = new File(row.fileUri);
    if (file.exists) {
      file.delete();
    }
  }
  db.runSync('DELETE FROM uploaded_documents WHERE id = ?;', [id]);
}

export function saveGuide(guide: StudyGuide): void {
  db.runSync(
    `INSERT OR REPLACE INTO study_guides (id, title, topic, mode, overview, learningObjectives, keyTerms, sections, quickReview, practiceQuestions, answerKey, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      guide.id,
      guide.title,
      guide.topic,
      guide.mode,
      guide.overview,
      JSON.stringify(guide.learningObjectives),
      JSON.stringify(guide.keyTerms),
      JSON.stringify(guide.sections),
      JSON.stringify(guide.quickReview),
      JSON.stringify(guide.practiceQuestions),
      JSON.stringify(guide.answerKey),
      guide.createdAt,
    ],
  );
}

export function getGuides(): StudyGuide[] {
  const rows = db.getAllSync('SELECT * FROM study_guides ORDER BY createdAt DESC;') as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    title: String(row.title ?? 'Study Guide'),
    topic: String(row.topic ?? ''),
    mode: String(row.mode ?? 'Detailed Reviewer') as StudyGuide['mode'],
    overview: String(row.overview ?? ''),
    learningObjectives: JSON.parse(String(row.learningObjectives ?? '[]')) as string[],
    keyTerms: JSON.parse(String(row.keyTerms ?? '[]')) as string[],
    sections: JSON.parse(String(row.sections ?? '[]')) as StudyGuide['sections'],
    quickReview: JSON.parse(String(row.quickReview ?? '[]')) as string[],
    practiceQuestions: JSON.parse(String(row.practiceQuestions ?? '[]')) as string[],
    answerKey: JSON.parse(String(row.answerKey ?? '[]')) as string[],
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  }));
}

export function saveFlashcards(guideId: string, cards: Flashcard[]): void {
  cards.forEach((card) => {
    db.runSync(
      `INSERT OR REPLACE INTO flashcards (id, guideId, question, answer, explanation, difficulty)
        VALUES (?, ?, ?, ?, ?, ?);`,
      [card.id, guideId, card.question, card.answer, card.explanation, card.difficulty],
    );
  });
}

export function getFlashcards(guideId: string): Flashcard[] {
  const rows = db.getAllSync('SELECT * FROM flashcards WHERE guideId = ? ORDER BY id;', [guideId]) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    question: String(row.question ?? ''),
    answer: String(row.answer ?? ''),
    explanation: String(row.explanation ?? ''),
    difficulty: String(row.difficulty ?? 'Easy') as Flashcard['difficulty'],
  }));
}

export function saveQuizSet(quiz: QuizSet, guideId: string): void {
  db.runSync(
    `INSERT OR REPLACE INTO quiz_sets (id, title, guideId, questions, createdAt)
      VALUES (?, ?, ?, ?, ?);`,
    [quiz.id, quiz.title, guideId, JSON.stringify(quiz.questions), quiz.createdAt],
  );
}

export function getQuizSets(guideId: string): QuizSet[] {
  const rows = db.getAllSync('SELECT * FROM quiz_sets WHERE guideId = ? ORDER BY createdAt DESC;', [guideId]) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    title: String(row.title ?? 'Quiz'),
    questions: JSON.parse(String(row.questions ?? '[]')) as QuizSet['questions'],
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  }));
}

export function saveSetting(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', [key, value]);
}

export function getSetting(key: string): string | null {
  const row = db.getFirstSync('SELECT value FROM app_settings WHERE key = ?;', [key]) as Record<string, unknown> | null;
  return row ? String(row.value ?? null) : null;
}

export function clearStudyData(): void {
  const rows = db.getAllSync('SELECT fileUri FROM uploaded_documents WHERE fileUri IS NOT NULL;') as Array<{ fileUri: string }>;
  rows.forEach(({ fileUri }) => {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
    }
  });
  db.runSync('DELETE FROM uploaded_documents;');
  db.runSync('DELETE FROM study_guides;');
  db.runSync('DELETE FROM flashcards;');
  db.runSync('DELETE FROM quiz_sets;');
}
