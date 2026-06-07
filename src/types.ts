export interface CustomQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface Lesson {
  id: number;           // 1 to 30
  day: number;          // 1 to 30
  title: string;        // e.g. "Хичээл 1"
  theme: string;        // e.g. "Сонсох & Дүрэм"
  listeningUrl: string; // YouTube video link/embed
  vocabQuestions: CustomQuestion[]; // Shine ug test
  grammarQuestions: CustomQuestion[]; // Durem test
}

export interface UserProgress {
  completedDays: number[]; // Completed day numbers (e.g. [1, 2])
}
