export type TransactionType = 'earn' | 'spend' | 'adjust';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // ISO string
}

export interface Habit {
  id: string;
  name: string;
  points: number;
  emoji: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  emoji: string; // 兼容旧数据
  image?: string; // 新增：奖励图片（data URL 或远程 URL）
}

export interface PendingTask {
  id: string;
  habitId: string;
  habitName: string;
  points: number;
  emoji: string;
  timestamp: string;
}

export interface AppData {
  childName: string; // New field
  parentPin: string; // New field
  totalPoints: number;
  avatar?: string | null;
  transactions: Transaction[];
  habits: Habit[];
  rewards: Reward[];
  pendingTasks: PendingTask[];
}

export const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: '打扫房间', points: 10, emoji: '🧹' },
  { id: '2', name: '完成作业', points: 15, emoji: '📚' },
  { id: '3', name: '认真刷牙', points: 5, emoji: '🦷' },
  { id: '4', name: '吃蔬菜', points: 5, emoji: '🥦' },
];

export const DEFAULT_REWARDS: Reward[] = [
  { id: '1', name: '看电视30分钟', cost: 50, emoji: '📺' },
  { id: '2', name: '吃冰淇淋', cost: 100, emoji: '🍦' },
  { id: '3', name: '买新玩具', cost: 500, emoji: '🧸' },
];