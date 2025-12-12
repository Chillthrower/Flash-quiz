export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  details: {
    questionId: string;
    isCorrect: boolean;
    userAnswerIndex: number;
  }[];
}

export interface ProcessedQuiz {
  title: string;
  questions: Question[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS'
}
