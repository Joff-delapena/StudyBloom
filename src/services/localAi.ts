import type { Flashcard, QuizQuestion, QuizSet, ReviewerMode, StudyGuide } from '../types';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'among', 'because', 'been', 'before', 'being',
  'between', 'could', 'during', 'every', 'from', 'further', 'have', 'into', 'more',
  'over', 'should', 'some', 'such', 'their', 'there', 'these', 'those', 'under', 'very',
  'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your', 'study', 'lesson',
  'psychology', 'chapter', 'material', 'concept', 'topic', 'important', 'notes', 'theory',
  'theories', 'student', 'teacher', 'learning', 'understanding'
]);

const SKIP_TOKENS = new Set(['pdf', 'docx', 'pptx', 'txt', 'document', 'uploaded']);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function countKeywords(rawText: string): string[] {
  const clean = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter((entry) => {
    const word = entry.trim();
    return word.length > 4 && !STOP_WORDS.has(word) && !SKIP_TOKENS.has(word);
  });

  const map = new Map<string, number>();
  words.forEach((word) => {
    map.set(word, (map.get(word) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word]) => word);
}

function inferTopic(keywords: string[]): string {
  if (keywords.length === 0) {
    return 'Lesson topic';
  }

  return keywords
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' and ');
}

function buildOverview(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return 'This study guide summarizes the uploaded psychological lesson and organizes the most important ideas in a clear sequence.';
  }

  return sentences.slice(0, 2).join(' ');
}

function buildLearningObjectives(keywords: string[]): string[] {
  const objectiveBase = [
    'Identify the core idea behind the lesson.',
    'Explain major terms and definitions using clear examples.',
    'Compare and contrast the most relevant concepts.',
    'Apply the lesson to psychology study scenarios and exam questions.'
  ];

  if (keywords.length === 0) {
    return objectiveBase;
  }

  return objectiveBase.map((item, index) => {
    if (index === 0) {
      return `Recognize the role of ${keywords[0]} in the lesson.`;
    }
    if (index === 1) {
      return `Explain ${keywords.slice(0, 2).join(' and ')} in everyday language.`;
    }
    if (index === 2) {
      return `Compare ${keywords[1] ?? keywords[0]} with related concepts from the lesson.`;
    }
    return `Use ${keywords[0]} to answer application-style questions confidently.`;
  });
}

function buildSections(text: string, keywords: string[]): { title: string; body: string[] }[] {
  const themeWords = keywords.length > 0 ? keywords : ['core concepts', 'examples', 'memory'];
  const sentences = splitSentences(text);
  const anchor = sentences.length > 0 ? sentences[0] : 'The uploaded material highlights several important psychological ideas.';

  return [
    {
      title: 'Lesson Overview',
      body: [
        anchor,
        `The lesson emphasizes ${themeWords.slice(0, 3).join(', ')} and shows how they shape understanding in psychology.`,
      ],
    },
    {
      title: 'Key Concepts',
      body: [
        `A central idea is that ${themeWords[0] ?? 'psychological understanding'} helps organize information and supports accurate interpretation of behavior.`,
        `Another important concept involves linking theory to examples so the student can move from memory to application.`,
      ],
    },
    {
      title: 'Examples and Comparisons',
      body: [
        `Examples in the lesson help connect abstract terms with concrete situations and everyday behaviours.`,
        `When comparing related concepts, focus on differences in cause, effect, and interpretation before choosing an answer.`,
      ],
    },
    {
      title: 'Important Facts to Remember',
      body: [
        'Review the definitions before answering conceptual questions.',
        'Look for patterns, connections, and cause-and-effect relationships in the lesson.',
      ],
    },
  ];
}

function buildQuickReview(keywords: string[]): string[] {
  const terms = keywords.length > 0 ? keywords.slice(0, 4) : ['core ideas', 'definitions', 'examples', 'applications'];
  return [
    `Define ${terms[0]} in your own words.`,
    `List the main steps or theories related to ${terms[1] ?? terms[0]}.`,
    `Explain one example that connects ${terms[2] ?? terms[0]} to real-life behavior.`,
  ];
}

function buildPracticeQuestions(keywords: string[]): string[] {
  const terms = keywords.length > 0 ? keywords.slice(0, 4) : ['memory', 'behavior', 'theory', 'development'];
  return [
    `What is the main purpose of ${terms[0]} in this lesson?`,
    `Which idea best explains the connection between ${terms[1]} and ${terms[2]}?`,
    `Why is ${terms[3]} important when studying psychology?`,
  ];
}

function buildAnswerKey(keywords: string[]): string[] {
  const terms = keywords.length > 0 ? keywords.slice(0, 4) : ['memory', 'behavior', 'theory', 'development'];
  return [
    `The purpose of ${terms[0]} is to organize and explain the core concept clearly.`,
    `The stronger connection appears when comparing the role of ${terms[1]} with ${terms[2]} in context.`,
    `${terms[3]} matters because it helps the learner connect ideas to evidence and application.`,
  ];
}

export function generateStudyGuide(rawText: string, mode: ReviewerMode, title?: string): StudyGuide {
  const cleaned = normalizeText(rawText || 'No lesson content available yet.');
  const keywords = countKeywords(cleaned);
  const topic = inferTopic(keywords);
  const guideTitle = title || `${topic} Study Guide`;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: guideTitle,
    topic,
    mode,
    overview: buildOverview(cleaned),
    learningObjectives: buildLearningObjectives(keywords),
    keyTerms: keywords,
    sections: buildSections(cleaned, keywords),
    quickReview: buildQuickReview(keywords),
    practiceQuestions: buildPracticeQuestions(keywords),
    answerKey: buildAnswerKey(keywords),
    createdAt: new Date().toISOString(),
  };
}

export function generateFlashcards(guide: StudyGuide): Flashcard[] {
  const questions = guide.keyTerms.length > 0 ? guide.keyTerms : ['cognition', 'behavior', 'memory', 'learning'];
  return questions.slice(0, 5).map((term, index) => ({
    id: `${guide.id}-card-${index}`,
    question: `What is the meaning of ${term}?`,
    answer: 'It is a major concept from the lesson that helps explain the psychology topic in a clear and memorable way.',
    explanation: `This term appears in the uploaded lesson and is relevant to the topic of ${guide.topic}.`,
    difficulty: index % 3 === 0 ? 'Easy' : index % 2 === 0 ? 'Medium' : 'Hard',
  }));
}

export function generateQuiz(guide: StudyGuide, count = 5): QuizSet {
  const questions: QuizQuestion[] = Array.from({ length: Math.min(count, 5) }, (_, index) => ({
    id: `${guide.id}-quiz-${index}`,
    prompt: guide.practiceQuestions[index % guide.practiceQuestions.length] ?? 'What is the main focus of this lesson?',
    options: [
      'The major idea or concept being explained',
      'Only a background story unrelated to the lesson',
      'A random fact without evidence',
      'A question the student should skip',
    ],
    answer: 'The major idea or concept being explained',
    explanation: 'The lesson focuses on central concepts and how they connect to real psychology thinking.',
  }));

  return {
    id: `${guide.id}-quiz`,
    title: `${guide.title} Quiz`,
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function generateAssistantReply(context: string, prompt: string): string {
  const normalizedPrompt = prompt.toLowerCase();
  const keywords = countKeywords(context);
  const target = keywords.length > 0 ? keywords[0] : 'core concept';

  if (normalizedPrompt.includes('difference') || normalizedPrompt.includes('compare')) {
    return `The main difference to focus on is the relationship between the underlying concept and its practical application. In this lesson, ${target} connects the idea to evidence, examples, and behavior, which makes it easier to compare one explanation with another.`;
  }

  if (normalizedPrompt.includes('example')) {
    return `An example from this lesson is to connect ${target} to a real situation: imagine a student noticing how the same principle appears in everyday decisions, memory recall, and interpretation of behavior.`;
  }

  if (normalizedPrompt.includes('summarize')) {
    return `The lesson centers on ${target} and the way it helps explain important patterns in psychology. The main takeaway is that definitions, examples, and comparisons make the concept easier to remember and apply.`;
  }

  if (normalizedPrompt.includes('difficult') || normalizedPrompt.includes('explain')) {
    return 'A simple way to understand this is to break it into a definition, an example, and a connection to behavior. The lesson suggests that understanding the idea first makes the harder distinctions easier to follow.';
  }

  return `Based on the selected study guide, the most important idea is ${target}. Review the lesson summary, definitions, and examples first, then match your answer to the concept rather than to a memorized phrase.`;
}
