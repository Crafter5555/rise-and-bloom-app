export interface MorningQuizData {
  date: string;
  sleepQuality: number;
  sleepHours: number;
  mood: string;
  mainFocus: string;
  dailyGoals: string[];
  gratitude: string;
  completedAt: string;
}

export interface EveningQuizData {
  date: string;
  overallMood: number;
  energyLevel: number;
  completedGoals: string[];
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  improvements: string;
  otherThoughts: string;
  tomorrowPriority: string;
  completedAt: string;
}

export interface QuizEntry {
  morning?: MorningQuizData;
  evening?: EveningQuizData;
}

const QUIZ_STORAGE_KEY = 'quiz_entries';

export const getQuizEntries = (): Record<string, QuizEntry> => {
  try {
    const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveQuizEntries = (entries: Record<string, QuizEntry>) => {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(entries));
};

export const getTodayDateKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const hasCompletedMorningQuiz = (date: string = getTodayDateKey()): boolean => {
  const entries = getQuizEntries();
  return !!entries[date]?.morning;
};

export const hasCompletedEveningQuiz = (date: string = getTodayDateKey()): boolean => {
  const entries = getQuizEntries();
  return !!entries[date]?.evening;
};

export const saveMorningQuiz = (data: Omit<MorningQuizData, 'date' | 'completedAt'>) => {
  const entries = getQuizEntries();
  const dateKey = getTodayDateKey();
  
  if (!entries[dateKey]) {
    entries[dateKey] = {};
  }
  
  entries[dateKey].morning = {
    ...data,
    date: dateKey,
    completedAt: new Date().toISOString(),
  };
  
  saveQuizEntries(entries);
};

export const saveEveningQuiz = (data: Omit<EveningQuizData, 'date' | 'completedAt'>) => {
  const entries = getQuizEntries();
  const dateKey = getTodayDateKey();
  
  if (!entries[dateKey]) {
    entries[dateKey] = {};
  }
  
  entries[dateKey].evening = {
    ...data,
    date: dateKey,
    completedAt: new Date().toISOString(),
  };
  
  saveQuizEntries(entries);
};

export const getRecentQuizEntries = (limit: number = 7): Array<{ date: string; entry: QuizEntry }> => {
  const entries = getQuizEntries();
  return Object.entries(entries)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([date, entry]) => ({ date, entry }));
};