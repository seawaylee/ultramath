export enum Operation {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '×',
  DIVIDE = '÷'
}

export enum Difficulty {
  C = 'C', // Beginner
  B = 'B', // Intermediate
  A = 'A', // Advanced
  S = 'S'  // Ultra
}

export interface GameSettings {
  operations: Operation[];
  range: 10 | 20 | 50 | 100 | 1000;
  allowNegative: boolean;
  allowDecimals: boolean;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  num1: number;
  num2: number;
  operation: Operation;
  correctAnswer: number;
  userAnswer?: number; // User's input
  isCorrect?: boolean;
}

export interface GameResult {
  totalQuestions: number;
  correctCount: number;
  questions: Question[];
  feedbackMessage: string;
  ultramanMood: 'happy' | 'proud' | 'encouraging' | 'sad';
}
