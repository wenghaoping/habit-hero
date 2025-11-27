import { AppData, DEFAULT_HABITS, DEFAULT_REWARDS, Transaction, PendingTask, Habit, Reward } from '../types';

// 动态地址：优先使用 VITE_API_BASE；未设置则走相对路径（由 Vite 代理到后端）
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

const getDefaultSettings = () => ({
  childName: '宝贝',
  parentPin: '0000',
  totalPoints: 0,
  avatar: null,
  habits: DEFAULT_HABITS,
  rewards: DEFAULT_REWARDS,
  pendingTasks: [],
});

// Load everything from server
export const loadData = async (): Promise<AppData> => {
  try {
    const res = await fetch(`${API_BASE}/api/data`);
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    // Ensure transactions sorted new->old
    return {
      ...data,
      transactions: Array.isArray(data.transactions)
        ? data.transactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    } as AppData;
  } catch (error) {
    console.error('Failed to load from server:', error);
    return { ...getDefaultSettings(), transactions: [] };
  }
};

// Save ONLY the settings
export const saveSettings = async (data: {
  childName: string,
  parentPin: string,
  totalPoints: number,
  avatar: string | null,
  habits: Habit[],
  rewards: Reward[],
  pendingTasks: PendingTask[],
}): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

// Add a SINGLE transaction
export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/api/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!res.ok) throw new Error('Failed to save transaction');
  } catch (e) {
    console.error('Error saving transaction', e);
  }
};

// Bulk Add Transactions
export const bulkAddTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/api/bulk-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactions),
    });
    if (!res.ok) throw new Error('Failed to bulk save transactions');
  } catch (e) {
    console.error('Error bulk saving transactions', e);
    throw e;
  }
};

// --- File System Helpers ---

export const exportDataToFile = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/export`);
    if (!res.ok) throw new Error('Failed to export');
    const data = await res.json();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `习惯小英雄数据备份-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed', e);
  }
};

export const importDataFromFile = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (event.target?.result) {
          const data = JSON.parse(event.target.result as string);
          if (data && typeof data.totalPoints === 'number') {
            const res = await fetch(`${API_BASE}/api/import`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Import failed');
            resolve(data as AppData);
          } else {
            reject(new Error('无效的数据文件格式'));
          }
        }
      } catch (e) {
        reject(new Error('文件解析或导入失败'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Reset all data on server (requires admin password)
export const resetAllData = async (password: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/api/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to reset');
  }
};
