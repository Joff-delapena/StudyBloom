export type ReviewerMode =
  | 'Short Reviewer'
  | 'Detailed Reviewer'
  | 'Exam-Focused Reviewer'
  | 'Beginner-Friendly Reviewer';

export type DocumentRecord = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  topic: string;
  fileUri: string;
  createdAt: string;
  text: string;
  status: 'ready' | 'processing' | 'failed';
};

export type StudyGuideSection = {
  title: string;
  body: string[];
};

export type StudyGuide = {
  id: string;
  title: string;
  topic: string;
  mode: ReviewerMode;
  overview: string;
  learningObjectives: string[];
  keyTerms: string[];
  sections: StudyGuideSection[];
  quickReview: string[];
  practiceQuestions: string[];
  answerKey: string[];
  createdAt: string;
};

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type QuizSet = {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
};

export type AssistantMessage = {
  id: string;
  kind: 'user' | 'assistant';
  text: string;
};
