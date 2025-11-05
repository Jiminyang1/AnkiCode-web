export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface Problem {
  id: string;
  leetcodeId: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  nextReview: string; // ISO date string
  reviewIntervalDays: number;
  userId: string;
}

export interface ProblemDetail {
  id: string;
  problemId: string;
  notes: string;
  lastReviewed: string; // ISO date string
}

export interface ProblemWithDetail extends Problem {
  problemDetails?: ProblemDetail[];
}

