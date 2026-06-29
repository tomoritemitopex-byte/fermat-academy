export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  xp: number;
  streak: number;
  last_active_at: string;
  created_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  youtube_url: string;
  pdf_url: string;
  admin_id: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  name: string;
  icon: string;
  type: string;
  earned: boolean;
}

export interface ArtifactItem {
  type: string;
  name: string;
  icon: string;
  unlocked: boolean;
  active: boolean;
}

export interface ArtifactPair {
  pairName: string;
  items: ArtifactItem[];
}

export interface FlaggedQA {
  id: number;
  user_id: number | null;
  lesson_id: number;
  question: string;
  answer: string;
  resolved: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  artifact_types: string[];
}

export interface AdminData {
  lessons: Lesson[];
  flaggedCount: number;
  totalStudents: number;
  totalLessons: number;
}

export interface LessonDetailData {
  lesson: Lesson;
  userXP: number;
  artifacts: { artifact_type: string; unlocked: boolean; active: boolean }[];
}
