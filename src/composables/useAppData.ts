import { ref, computed } from 'vue';
import { AppData, Habit, Reward, Transaction, PendingTask, Deduction } from '../../types';
import { loadData, saveSettings, saveTransaction } from '../../services/storageService';
import { safeId } from '../../services/id';

// 全局共享状态
const globalData = ref<AppData | null>(null);
const globalLoading = ref(true);

export function useAppData() {
  const data = globalData;
  const loading = globalLoading;

  const init = async () => {
    loading.value = true;
    try {
      const loaded = await loadData();
      // 确保 deductions 字段存在
      if (!loaded.deductions) {
        loaded.deductions = [];
      }
      data.value = loaded;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      loading.value = false;
    }
  };

  const persistSettings = (newData: AppData) => {
    saveSettings({
      childName: newData.childName,
      parentPin: newData.parentPin,
      totalPoints: newData.totalPoints,
      avatar: newData.avatar ?? null,
      habits: newData.habits,
      rewards: newData.rewards,
      pendingTasks: newData.pendingTasks,
      deductions: newData.deductions || [],
    });
  };

  const updateData = (updater: (prev: AppData) => AppData) => {
    if (!data.value) return;
    const next = updater(data.value);
    data.value = next;
    persistSettings(next);
  };

  // Helper to check if a habit is completed today
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const completedHabitsToday = computed(() => {
    if (!data.value) return new Set<string>();
    const today = new Date();
    const set = new Set<string>();

    // 1. Pending tasks are considered "done" for the kid view
    data.value.pendingTasks.forEach((t) => {
      if (isSameDay(new Date(t.timestamp), today)) set.add(t.habitId);
    });

    // 2. Approved transactions
    for (const t of data.value.transactions) {
      const tDate = new Date(t.date);
      if (!isSameDay(tDate, today)) {
        if (tDate < today) break;
      } else {
        if (t.type === 'earn') {
          const matchedHabit = data.value.habits.find((h) => h.name === t.description);
          if (matchedHabit) set.add(matchedHabit.id);
        }
      }
    }
    return set;
  });

  const isTaskCompletedToday = (habitId: string) => {
    return completedHabitsToday.value.has(habitId);
  };

  const handleRequestTask = (habit: Habit) => {
    const newPending: PendingTask = {
      id: safeId(),
      habitId: habit.id,
      habitName: habit.name,
      points: habit.points,
      emoji: habit.emoji,
      timestamp: new Date().toISOString(),
    };

    updateData((prev) => ({
      ...prev,
      pendingTasks: [...prev.pendingTasks, newPending],
    }));
  };

  const handleApproveTask = async (task: PendingTask) => {
    const newTransaction: Transaction = {
      id: safeId(),
      type: 'earn',
      amount: task.points,
      description: task.habitName,
      date: new Date().toISOString(),
    };

    await saveTransaction(newTransaction);

    updateData((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints + task.points,
      transactions: [newTransaction, ...prev.transactions],
      pendingTasks: prev.pendingTasks.filter((t) => t.id !== task.id),
    }));
  };

  const handleRejectTask = (taskId: string) => {
    updateData((prev) => ({
      ...prev,
      pendingTasks: prev.pendingTasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleSpend = async (reward: Reward) => {
    if (!data.value) return;
    if (data.value.totalPoints < reward.cost) {
      throw new Error('积分不够哦，继续加油！');
    }

    const newTransaction: Transaction = {
      id: safeId(),
      type: 'spend',
      amount: reward.cost,
      description: reward.name,
      date: new Date().toISOString(),
    };

    await saveTransaction(newTransaction);

    updateData((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints - reward.cost,
      transactions: [newTransaction, ...prev.transactions],
    }));
  };

  const addHabit = (habit: Habit) => {
    updateData((prev) => ({
      ...prev,
      habits: [...prev.habits, habit],
    }));
  };

  const removeHabit = (id: string) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  };

  const updateHabit = (id: string, updatedHabit: Partial<Habit>) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...updatedHabit } : h)),
    }));
  };

  const addReward = (reward: Reward) => {
    updateData((prev) => ({
      ...prev,
      rewards: [...prev.rewards, reward],
    }));
  };

  const removeReward = (id: string) => {
    updateData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((r) => r.id !== id),
    }));
  };

  const updateReward = (id: string, updatedReward: Partial<Reward>) => {
    updateData((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r) => (r.id === id ? { ...r, ...updatedReward } : r)),
    }));
  };

  const addDeduction = (deduction: Deduction) => {
    updateData((prev) => ({
      ...prev,
      deductions: [...(prev.deductions || []), deduction],
    }));
  };

  const removeDeduction = (id: string) => {
    updateData((prev) => ({
      ...prev,
      deductions: (prev.deductions || []).filter((d) => d.id !== id),
    }));
  };

  const updateDeduction = (id: string, updatedDeduction: Partial<Deduction>) => {
    updateData((prev) => ({
      ...prev,
      deductions: (prev.deductions || []).map((d) => (d.id === id ? { ...d, ...updatedDeduction } : d)),
    }));
  };

  const handleQuickDeduct = async (deduction: Deduction) => {
    if (!data.value) return;
    if (data.value.totalPoints < deduction.points) {
      throw new Error('积分不够哦，无法扣除');
    }

    const newTransaction: Transaction = {
      id: safeId(),
      type: 'spend',
      amount: deduction.points,
      description: deduction.name,
      date: new Date().toISOString(),
    };

    await saveTransaction(newTransaction);

    updateData((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints - deduction.points,
      transactions: [newTransaction, ...prev.transactions],
    }));
  };

  return {
    data,
    loading,
    init,
    updateData,
    isTaskCompletedToday,
    handleRequestTask,
    handleApproveTask,
    handleRejectTask,
    handleSpend,
    addHabit,
    removeHabit,
    updateHabit,
    addReward,
    removeReward,
    updateReward,
    addDeduction,
    removeDeduction,
    updateDeduction,
    handleQuickDeduct,
  };
}

