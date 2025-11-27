import React, { useState, useEffect, useMemo } from 'react';
import { Coins, Trophy, User, Lock, ArrowRight, Sparkles, Plus, Trash2, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, Clock, History, Star, Home, Gift, Save, Download, Upload, Settings, Zap, ArrowLeft, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { AppData, Habit, Reward, Transaction, PendingTask } from './types';
import { loadData, saveSettings, saveTransaction, exportDataToFile, importDataFromFile, bulkAddTransactions, resetAllData } from './services/storageService';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { safeId } from './services/id';

// --- Helpers ---
const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const ITEMS_PER_PAGE = 20;

// --- Sub-Components ---

const StatCard: React.FC<{ label: string, value: string | number, color: string, icon?: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className={`bg-white p-4 rounded-3xl shadow-cartoon border-[3px] border-black flex flex-col items-center justify-center gap-1 relative overflow-hidden group hover:scale-105 transition-transform`}>
    <div className={`absolute inset-0 opacity-10 ${color}`}></div>
    <span className="text-slate-500 text-xs font-black uppercase tracking-wider mt-2 relative z-10">{label}</span>
    <div className="flex items-center gap-2 relative z-10">
      {icon}
      <span className="text-3xl font-black">{value}</span>
    </div>
  </div>
);

const TransactionItem: React.FC<{ item: Transaction }> = ({ item }) => (
  <div className="flex justify-between items-center p-3 bg-white rounded-2xl border-[3px] border-black shadow-cartoon-sm mb-3 hover:translate-x-1 transition-transform">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl border-2 border-black ${item.type === 'earn' ? 'bg-success/20 text-green-700' : 'bg-secondary/20 text-pink-700'}`}>
        {item.type === 'earn' ? <CheckCircle2 size={20} strokeWidth={3} /> : <Coins size={20} strokeWidth={3} />}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-slate-800">{item.description}</span>
        <span className="text-xs text-slate-500 font-bold">{new Date(item.date).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
    <span className={`font-black text-lg ${item.type === 'earn' ? 'text-green-600' : 'text-pink-600'}`}>
      {item.type === 'earn' ? '+' : '-'}{item.amount}
    </span>
  </div>
);

const HistoryTab: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    // Derived stats
    const totalEarned = useMemo(() => transactions.filter(t => t.type === 'earn').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
    const totalSpent = useMemo(() => transactions.filter(t => t.type === 'spend').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const paginatedData = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-50 p-4 rounded-[2rem] border-[3px] border-black shadow-cartoon text-center">
                     <p className="text-slate-500 font-bold text-sm mb-1">累计获得</p>
                     <p className="text-3xl font-black text-green-600">+{totalEarned}</p>
                 </div>
                 <div className="bg-pink-50 p-4 rounded-[2rem] border-[3px] border-black shadow-cartoon text-center">
                     <p className="text-slate-500 font-bold text-sm mb-1">累计消费</p>
                     <p className="text-3xl font-black text-pink-600">-{totalSpent}</p>
                 </div>
             </div>

             <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                        <History size={24} /> 历史明细 ({transactions.length})
                    </h3>
                </div>
                
                {transactions.length === 0 ? (
                    <p className="text-slate-400 text-center py-10 font-bold">暂无活动记录</p>
                ) : (
                    <>
                        <div className="space-y-3">
                            {paginatedData.map(t => <TransactionItem key={t.id} item={t} />)}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t-2 border-slate-100">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft /> 上一页
                                </Button>
                                <span className="font-bold text-slate-500">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    下一页 <ChevronRight />
                                </Button>
                            </div>
                        )}
                    </>
                )}
             </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<'landing' | 'kid' | 'parent'>('landing');
  const [parentActiveTab, setParentActiveTab] = useState<'overview' | 'habits' | 'rewards' | 'history' | 'settings'>('overview');
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmHabit, setConfirmHabit] = useState<Habit | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [isSpendConfirmOpen, setIsSpendConfirmOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [ackReset, setAckReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize Data (Async from IndexedDB)
  useEffect(() => {
    const init = async () => {
        const loaded = await loadData();
        setData(loaded);
    };
    init();
  }, []);

  // helper to sync config changes to DB
  const persistSettings = (newData: AppData) => {
      saveSettings({
          childName: newData.childName,
          parentPin: newData.parentPin,
          totalPoints: newData.totalPoints,
          avatar: newData.avatar ?? null,
          habits: newData.habits,
          rewards: newData.rewards,
          pendingTasks: newData.pendingTasks
      });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Performance Optimization: Cache today's completed tasks
  const completedHabitsToday = useMemo(() => {
    if (!data) return new Set<string>();
    const today = new Date();
    const set = new Set<string>();

    // 1. Pending tasks are considered "done" for the kid view
    data.pendingTasks.forEach(t => {
        if(isSameDay(new Date(t.timestamp), today)) set.add(t.habitId);
    });

    // 2. Approved transactions
    // To allow O(1) lookups for the kid view, we scan recent history.
    // Optimization: Only scan until we find a date earlier than today.
    for (const t of data.transactions) {
        const tDate = new Date(t.date);
        if (!isSameDay(tDate, today)) {
             // Since transactions are sorted new->old, we can stop once we hit yesterday
             if (tDate < today) break; 
        } else {
             if (t.type === 'earn') {
                 // Match description to habit name (Simple text match)
                 // In V3 we might want to store habitId in transaction metadata
                 const matchedHabit = data.habits.find(h => h.name === t.description);
                 if (matchedHabit) set.add(matchedHabit.id);
             }
        }
    }
    return set;
  }, [data?.pendingTasks, data?.transactions, data?.habits]);

  const isTaskCompletedToday = (habitId: string) => {
    return completedHabitsToday.has(habitId);
  };

  // Kid Requesting a Task
  const handleRequestTask = (habit: Habit) => {
    const newPending: PendingTask = {
      id: safeId(),
      habitId: habit.id,
      habitName: habit.name,
      points: habit.points,
      emoji: habit.emoji,
      timestamp: new Date().toISOString()
    };

    setData(prev => {
        if (!prev) return null;
        const next = {
            ...prev,
            pendingTasks: [...prev.pendingTasks, newPending]
        };
        persistSettings(next); // Save Pending
        return next;
    });

    showToast(`太棒了！"${habit.name}" 完成啦！`, 'success');
  };

  // Parent Approving Task
  const handleApproveTask = async (task: PendingTask) => {
    const newTransaction: Transaction = {
      id: safeId(),
      type: 'earn',
      amount: task.points,
      description: task.habitName,
      date: new Date().toISOString(),
    };

    // Save to DB (Incremental)
    await saveTransaction(newTransaction);

    setData(prev => {
        if (!prev) return null;
        const next = {
            ...prev,
            totalPoints: prev.totalPoints + task.points,
            transactions: [newTransaction, ...prev.transactions],
            pendingTasks: prev.pendingTasks.filter(t => t.id !== task.id)
        };
        persistSettings(next); // Save Config (Points & Pending list)
        return next;
    });

    showToast(`已批准: ${task.habitName}`, 'success');
  };

  // Parent Rejecting Task
  const handleRejectTask = (taskId: string) => {
    setData(prev => {
        if (!prev) return null;
        const next = {
            ...prev,
            pendingTasks: prev.pendingTasks.filter(t => t.id !== taskId)
        };
        persistSettings(next); // Save Config
        return next;
    });
    showToast('任务已退回', 'info');
  };

  // Spending Points
  const handleSpend = async (reward: Reward) => {
    if (!data) return;
    if (data.totalPoints < reward.cost) {
      showToast("积分不够哦，继续加油！", 'error');
      return;
    }

    const newTransaction: Transaction = {
      id: safeId(),
      type: 'spend',
      amount: reward.cost,
      description: reward.name,
      date: new Date().toISOString(),
    };

    // Save to DB (Incremental)
    await saveTransaction(newTransaction);

    setData(prev => {
        if(!prev) return null;
        const next = {
            ...prev,
            totalPoints: prev.totalPoints - reward.cost,
            transactions: [newTransaction, ...prev.transactions]
        };
        persistSettings(next); // Save Config (Points)
        return next;
    });

    showToast(`成功兑换: ${reward.name}!`, 'success');
  };

  const addHabit = (habit: Habit) => {
    setData(prev => {
        if(!prev) return null;
        const next = { ...prev, habits: [...prev.habits, habit] };
        persistSettings(next);
        return next;
    });
  };

  const removeHabit = (id: string) => {
    setData(prev => {
        if(!prev) return null;
        const next = { ...prev, habits: prev.habits.filter(h => h.id !== id) };
        persistSettings(next);
        return next;
    });
  };

  const addReward = (reward: Reward) => {
    setData(prev => {
        if(!prev) return null;
        const next = { ...prev, rewards: [...prev.rewards, reward] };
        persistSettings(next);
        return next;
    });
  };

  const removeReward = (id: string) => {
    setData(prev => {
        if(!prev) return null;
        const next = { ...prev, rewards: prev.rewards.filter(r => r.id !== id) };
        persistSettings(next);
        return next;
    });
  };

  // Reset all data (Developer tool)
  const handleResetAll = async () => {
    if (resetPassword !== 'admin' || !ackReset) {
      showToast('请勾选确认并输入管理员密码', 'error');
      return;
    }
    setIsResetting(true);
    try {
      await resetAllData(resetPassword);
      const loaded = await loadData();
      setData(loaded);
      showToast('已清空所有数据', 'success');
      setIsResetModalOpen(false);
      setResetPassword('');
      setAckReset(false);
    } catch (e) {
      showToast('清空失败，请检查服务端日志', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // --- Views ---

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-accent rounded-full border-[3px] border-black opacity-60 animate-bounce-slow -z-10"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-primary rounded-lg rotate-12 border-[3px] border-black opacity-60 animate-wiggle -z-10"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-secondary rounded-full border-[3px] border-black opacity-60 animate-pulse -z-10"></div>
      
      <div className="absolute top-10 right-1/2 translate-x-1/2 -z-10 opacity-80">
          <svg width="200" height="120" viewBox="0 0 200 120" fill="#E0F2FE" stroke="black" strokeWidth="3">
             <path d="M20,80 Q0,80 0,60 Q0,30 30,30 Q40,10 70,10 Q100,0 130,20 Q160,10 180,40 Q200,50 200,80 Q200,110 170,110 L30,110 Q10,110 20,80 Z" />
          </svg>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border-[4px] border-black shadow-cartoon-lg w-full max-w-sm text-center transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="bg-gradient-to-br from-primary to-violet-500 w-28 h-28 rounded-full border-[4px] border-black flex items-center justify-center mx-auto mb-6 shadow-cartoon relative -top-12">
            <Trophy size={56} strokeWidth={2.5} className="text-white drop-shadow-md" />
            <div className="absolute -right-2 top-0 bg-accent p-2 rounded-full border-2 border-black animate-bounce">
                <Star size={20} fill="black" className="text-black" />
            </div>
        </div>
        
        <div className="-mt-8 mb-8">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm mb-2">习惯小英雄</h1>
            <p className="text-slate-500 font-bold text-lg">今天也是棒棒的一天！</p>
        </div>
        
        <div className="space-y-5">
          <Button 
            onClick={() => setView('kid')} 
            size="xl" 
            variant="accent"
            className="w-full justify-between group"
          >
            <span className="flex items-center gap-3">
               <User strokeWidth={3} /> {data?.childName || '我是小朋友'}
            </span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
          </Button>

          <Button 
            onClick={() => setShowPinModal(true)} 
            variant="secondary" 
            size="lg" 
            className="w-full justify-between group rounded-[2rem]"
          >
            <span className="flex items-center gap-3">
               <Lock size={20} strokeWidth={3} /> 家长入口
            </span>
            <div className="bg-slate-100 p-1 rounded-full border-2 border-black group-hover:bg-slate-200">
                <ArrowRight size={16} strokeWidth={3} />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderKidDashboard = () => {
    if (!data) return null;
    const visibleHabits = data.habits.filter(h => !isTaskCompletedToday(h.id));
    const isAllDone = visibleHabits.length === 0 && data.habits.length > 0;

    return (
    <div className="min-h-screen pb-24 bg-sky-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      {/* Prominent Hero Header */}
      <div className="bg-primary pt-8 pb-10 px-4 rounded-b-[3rem] border-b-[4px] border-black shadow-cartoon relative overflow-hidden">
          <button onClick={() => setView('landing')} className="absolute top-6 left-6 p-2 bg-black/10 rounded-full text-white/80 hover:bg-black/20 hover:text-white transition">
             <Home size={28} strokeWidth={3} />
          </button>

          {/* Background Decorations */}
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-[-20px] w-24 h-24 bg-accent/20 rounded-full blur-xl"></div>

          <div className="flex flex-col items-center justify-center relative z-10 gap-4 mt-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl border-2 border-black shadow-cartoon overflow-hidden bg-white flex items-center justify-center">
                 {data.avatar ? (
                   <img src={data.avatar} alt="头像" className="w-full h-full object-cover" />
                 ) : (
                   <User className="text-slate-400" />
                 )}
              </div>
              <div className="bg-white px-8 py-3 rounded-full border-[3px] border-black shadow-cartoon-lg transform -rotate-2">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">{data.childName}</h1>
              </div>
              
              <div className="bg-accent px-10 py-5 rounded-[2.5rem] border-[4px] border-black shadow-cartoon-lg flex items-center gap-4 transform rotate-1 hover:scale-105 transition-transform duration-300 cursor-default">
                  <div className="bg-white p-3 rounded-full border-[3px] border-black">
                      <Coins size={36} className="text-yellow-500 fill-yellow-500" strokeWidth={3}/>
                  </div>
                  <div className="flex flex-col items-start">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest opacity-60">当前积分</span>
                      <span className="text-6xl font-black text-slate-900 leading-none">{data.totalPoints}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="p-4 space-y-8 max-w-2xl mx-auto mt-6">
        
        {data.pendingTasks.length > 0 && (
          <div className="bg-white p-4 rounded-3xl border-[3px] border-black shadow-cartoon-sm flex items-center gap-4 animate-bounce-slow mx-2 relative">
             <div className="absolute -left-2 -top-2 bg-red-400 text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-black font-black z-10">
                {data.pendingTasks.length}
             </div>
             <div className="bg-blue-100 p-3 rounded-2xl border-2 border-black">
                <Clock className="text-blue-600" size={24} strokeWidth={3} />
             </div>
             <div className="flex-1">
               <p className="font-black text-slate-800 text-lg">等待爸爸妈妈确认...</p>
               <div className="flex gap-1 mt-1 overflow-x-auto">
                 {data.pendingTasks.slice(0, 5).map(t => (
                    <span key={t.id} className="text-xl bg-slate-100 rounded-lg p-1 border border-slate-300">{t.emoji}</span>
                 ))}
               </div>
             </div>
          </div>
        )}

        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="bg-success text-slate-900 p-2 rounded-xl border-[3px] border-black shadow-cartoon-sm transform -rotate-3">
                <CheckCircle2 size={28} strokeWidth={3} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">今日任务</h2>
          </div>
          
          {isAllDone ? (
              <div className="bg-white p-8 rounded-[2.5rem] border-[4px] border-black shadow-cartoon text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-yellow-50 opacity-50 pattern-grid-lg"></div>
                 <div className="relative z-10">
                    <div className="text-8xl mb-4 animate-bounce">🎉</div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">哇！太厉害了！</h3>
                    <p className="text-slate-500 font-bold text-lg">今天的任务全部完成啦！</p>
                 </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {visibleHabits.map(habit => (
            <button
            key={habit.id}
            onClick={() => { setConfirmHabit(habit); setIsConfirmOpen(true); }}
            className="bg-white p-5 rounded-[2rem] border-[3px] border-black shadow-cartoon transition-all hover:-translate-y-2 hover:shadow-cartoon-lg hover:bg-green-50 active:translate-y-0 active:scale-95 flex items-center justify-between group relative overflow-hidden"
            >
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-green-100 rounded-full opacity-50 z-0"></div>
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <span className="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{habit.emoji}</span>
                        <div className="text-left">
                           <span className="font-black text-xl text-slate-800 block">{habit.name}</span>
                           <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 mt-1 inline-block">点击完成</span>
                        </div>
                    </div>
                    <div className="bg-success text-slate-900 font-black text-xl w-14 h-14 rounded-full border-[3px] border-black flex items-center justify-center shadow-sm relative z-10 group-hover:rotate-12 transition-transform">
                        +{habit.points}
                    </div>
                    </button>
                ))}
              </div>
          )}
        </section>

        {/* Confirm Completion Modal */}
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="确认提交任务">
          {confirmHabit ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 border-2 border-black rounded-2xl flex items-center justify-center text-4xl">
                  {confirmHabit.emoji}
                </div>
                <div>
                  <p className="font-black text-xl text-slate-800">{confirmHabit.name}</p>
                  <p className="text-sm text-slate-600 font-bold">完成后将提交给家长审核，积分：+{confirmHabit.points}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>取消</Button>
                <Button variant="success" onClick={() => { if (confirmHabit) { handleRequestTask(confirmHabit); } setIsConfirmOpen(false); setConfirmHabit(null); }}>确认完成</Button>
              </div>
            </div>
          ) : (
            <div className="text-slate-600">请选择一个任务</div>
          )}
        </Modal>

        {/* Confirm Spend Modal */}
        <Modal isOpen={isSpendConfirmOpen} onClose={() => setIsSpendConfirmOpen(false)} title="确认兑换奖励">
          {confirmReward ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 border-2 border-black rounded-2xl flex items-center justify-center text-4xl overflow-hidden">
                  {confirmReward.image ? (
                    <img src={confirmReward.image} alt={confirmReward.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{confirmReward.emoji}</span>
                  )}
                </div>
                <div>
                  <p className="font-black text-xl text-slate-800">{confirmReward.name}</p>
                  <p className="text-sm text-slate-600 font-bold">将扣除积分：-{confirmReward.cost}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setIsSpendConfirmOpen(false)}>取消</Button>
                <Button variant="danger" onClick={() => { if (confirmReward) { handleSpend(confirmReward); } setIsSpendConfirmOpen(false); setConfirmReward(null); }}>确认兑换</Button>
              </div>
            </div>
          ) : (
            <div className="text-slate-600">请选择一个奖励</div>
          )}
        </Modal>

        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="bg-secondary text-white p-2 rounded-xl border-[3px] border-black shadow-cartoon-sm transform rotate-2">
                <Gift size={28} strokeWidth={3} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">兑换奖励</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data.rewards.map(reward => {
              const canAfford = data.totalPoints >= reward.cost;
              return (
                <button
                  key={reward.id}
                  disabled={!canAfford}
                  onClick={() => { setConfirmReward(reward); setIsSpendConfirmOpen(true); }}
                  className={`p-5 rounded-[2rem] border-[3px] border-black transition-all flex items-center justify-between group text-left relative overflow-hidden
                    ${canAfford 
                      ? 'bg-white shadow-cartoon hover:-translate-y-2 hover:shadow-cartoon-lg hover:bg-pink-50 active:scale-95' 
                      : 'bg-slate-100 opacity-60 cursor-not-allowed shadow-none grayscale'}`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center text-4xl shadow-sm group-hover:rotate-6 transition-transform overflow-hidden">
                        {reward.image ? (
                          <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{reward.emoji}</span>
                        )}
                    </div>
                    <div>
                         <span className="font-black text-xl text-slate-800 block">{reward.name}</span>
                         {canAfford ? (
                            <span className="text-pink-500 font-bold text-sm">可以兑换!</span>
                         ) : (
                            <div className="h-2 w-20 bg-slate-200 rounded-full mt-2 border border-slate-300 overflow-hidden">
                                <div className="h-full bg-slate-400" style={{width: `${(data.totalPoints / reward.cost) * 100}%`}}></div>
                            </div>
                         )}
                    </div>
                  </div>
                  <span className={`font-black text-lg px-3 py-1.5 rounded-xl border-[3px] border-black relative z-10 
                    ${canAfford ? 'bg-secondary text-white transform -rotate-6' : 'bg-slate-300 text-slate-500'}`}>
                    -{reward.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  )};

  const ParentDashboard: React.FC<{ activeTab: 'overview' | 'habits' | 'rewards' | 'history' | 'settings', onChangeTab: (t: 'overview' | 'habits' | 'rewards' | 'history' | 'settings') => void }> = ({ activeTab, onChangeTab }) => {
    if (!data) return null;
    const [isTabDrawerOpen, setIsTabDrawerOpen] = useState(false);

    // 移除切换标签时的自动滚动，避免页面上滑影响体验
    
    // AI 模块已移除

    // New Item Inputs
    const [newItemName, setNewItemName] = useState('');
    const [newItemValue, setNewItemValue] = useState('');
    const [newItemEmoji, setNewItemEmoji] = useState('⭐');
    const [newItemImage, setNewItemImage] = useState<string | null>(null);

    // Settings Inputs
    const [editChildName, setEditChildName] = useState(data.childName);
    const [editPin, setEditPin] = useState(data.parentPin);
    const [editAvatar, setEditAvatar] = useState<string | null>(data.avatar ?? null);

    // Sync settings inputs when server data changes (e.g., after reset/import)
    useEffect(() => {
      setEditChildName(data.childName);
      setEditPin(data.parentPin);
      setEditAvatar(data.avatar ?? null);
    }, [data.childName, data.parentPin]);
    
    // Testing state
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual points adjustment state
    const [manualAmount, setManualAmount] = useState<string>('');
    const [manualReason, setManualReason] = useState<string>('');
    const [isImageReading, setIsImageReading] = useState<boolean>(false);
    const [isAvatarReading, setIsAvatarReading] = useState<boolean>(false);

    const handleManualAward = async () => {
      const amt = parseInt(manualAmount, 10);
      if (isNaN(amt) || amt <= 0) {
        showToast('请输入有效的正整数积分', 'error');
        return;
      }
      const newTransaction: Transaction = {
        id: safeId(),
        type: 'earn',
        amount: amt,
        description: manualReason ? `手动发放: ${manualReason}` : '手动发放',
        date: new Date().toISOString(),
      };
      await saveTransaction(newTransaction);
      setData(prev => {
        if (!prev) return null;
        const next = {
          ...prev,
          totalPoints: prev.totalPoints + amt,
          transactions: [newTransaction, ...prev.transactions],
        };
        persistSettings(next);
        return next;
      });
      setManualAmount('');
      setManualReason('');
      showToast(`已发放 ${amt} 积分`, 'success');
    };

    const handleManualDeduct = async () => {
      const amt = parseInt(manualAmount, 10);
      if (isNaN(amt) || amt <= 0) {
        showToast('请输入有效的正整数积分', 'error');
        return;
      }
      if (data.totalPoints < amt) {
        showToast('当前积分不足，无法扣除', 'error');
        return;
      }
      const newTransaction: Transaction = {
        id: safeId(),
        type: 'spend',
        amount: amt,
        description: manualReason ? `手动扣除: ${manualReason}` : '手动扣除',
        date: new Date().toISOString(),
      };
      await saveTransaction(newTransaction);
      setData(prev => {
        if (!prev) return null;
        const next = {
          ...prev,
          totalPoints: prev.totalPoints - amt,
          transactions: [newTransaction, ...prev.transactions],
        };
        persistSettings(next);
        return next;
      });
      setManualAmount('');
      setManualReason('');
      showToast(`已扣除 ${amt} 积分`, 'success');
    };

    // 已移除 AI 任务生成函数

    const handleAddItem = (type: 'habit' | 'reward') => {
        if(!newItemName || !newItemValue) return;
        
        const val = parseInt(newItemValue);
        if(isNaN(val)) return;

        if(type === 'habit') {
            addHabit({ id: safeId(), name: newItemName, points: val, emoji: newItemEmoji });
        } else {
            addReward({ id: safeId(), name: newItemName, cost: val, emoji: newItemEmoji, image: newItemImage ?? undefined });
        }
        
        setNewItemName('');
        setNewItemValue('');
        setNewItemImage(null);
        showToast(`已添加 ${type === 'habit' ? '任务' : '奖励'}!`);
    };

    const handleBulkInsert = async () => {
        setIsGenerating(true);
        try {
            const mockData: Transaction[] = [];
            const now = Date.now();
            const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;
            
            for(let i=0; i<10000; i++) {
                const isEarn = Math.random() > 0.4; // 60% earn
                mockData.push({
                    id: safeId(),
                    type: isEarn ? 'earn' : 'spend',
                    amount: Math.floor(Math.random() * 50) + 5,
                    description: isEarn ? `模拟任务 ${i}` : `模拟消费 ${i}`,
                    date: new Date(now - Math.random() * ONE_YEAR).toISOString()
                });
            }
            
            await bulkAddTransactions(mockData);
            
            // Reload
            const newData = await loadData();
            setData(newData);
            showToast("成功插入 10,000 条测试数据");
        } catch (e) {
            showToast("插入失败", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSettings = () => {
        if (editPin.length !== 4) {
            showToast("密码必须是4位数字", 'error');
            return;
        }
        setData(prev => {
            if (!prev) return null;
            const next = {
                ...prev,
                childName: editChildName,
                parentPin: editPin,
                avatar: editAvatar ?? null
            };
            persistSettings(next);
            return next;
        });
        showToast("基础设置已保存！");
    };

    return (
      <div className="h-screen overflow-y-auto overscroll-y-none bg-indigo-50/50" style={{ overflowAnchor: 'none', paddingTop: 'calc(env(safe-area-inset-top) + 6rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
        <header className="bg-slate-800 border-b-[4px] border-black px-6 py-4 flex justify-between items-center fixed top-0 left-0 right-0 z-30 shadow-lg text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3">
             <div className="bg-slate-700 p-2 rounded-xl border-2 border-slate-500"><Lock size={18} /></div>
             <h1 className="font-bold text-xl tracking-tight">家长控制台</h1>
             <Button variant="ghost" size="sm" onClick={() => setIsTabDrawerOpen(true)} className="ml-2 bg-slate-700/50 hover:bg-slate-700 text-white border-2 border-slate-600 flex items-center gap-1">
               更多 <ChevronRight size={16} />
             </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView('landing')} className="text-white hover:bg-slate-700 hover:text-white border-2 border-transparent">退出</Button>
        </header>

        {/* 左侧抽屉导航 */}
        <div className="fixed inset-0 z-30 pointer-events-none">
          {/* 遮罩层，仅在打开时可点击 */}
          {isTabDrawerOpen && (
            <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={() => setIsTabDrawerOpen(false)}></div>
          )}
          <aside className={`absolute top-0 left-0 h-full w-72 max-w-[80vw] bg-white border-r-[3px] border-black shadow-cartoon transition-transform duration-300 pointer-events-auto ${isTabDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b-[3px] border-black flex items-center justify-between">
              <span className="font-black text-slate-800">导航</span>
              <Button variant="ghost" size="sm" onClick={() => setIsTabDrawerOpen(false)} className="text-slate-600 hover:bg-slate-100">关闭</Button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { id: 'overview', label: '总览 & 审核' }, 
                { id: 'habits', label: '任务管理' }, 
                { id: 'rewards', label: '奖励管理' },
                { id: 'history', label: '历史记录' },
                { id: 'settings', label: '设置 & 备份' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { onChangeTab(tab.id as any); setIsTabDrawerOpen(false); }}
                  className={`px-4 py-3 rounded-xl font-black text-sm transition-all border-[3px] border-black text-left ${activeTab === tab.id ? 'bg-accent text-slate-900 shadow-cartoon' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>
        </div>

        {/* 底部导航栏（App 风格） */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-[4px] border-black shadow-cartoon-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-5xl mx-auto px-4 py-2">
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'overview', label: '总览', icon: <Home size={20} strokeWidth={3} /> },
                { id: 'habits', label: '任务', icon: <CheckCircle2 size={20} strokeWidth={3} /> },
                { id: 'rewards', label: '奖励', icon: <Gift size={20} strokeWidth={3} /> },
                { id: 'history', label: '历史', icon: <History size={20} strokeWidth={3} /> },
                { id: 'settings', label: '设置', icon: <Settings size={20} strokeWidth={3} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-2xl border-[3px] font-black transition-all ${activeTab === tab.id ? 'bg-accent text-slate-900 border-black shadow-cartoon' : 'bg-white text-slate-600 border-black hover:bg-slate-50'}`}
                >
                  <span className="flex items-center justify-center w-7 h-7">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* 顶部标签栏已移除，使用左上角“更多”抽屉导航 */}

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="当前积分" value={data.totalPoints} color="bg-primary" icon={<Coins className="text-primary" />} />
                        <StatCard label="待审核" value={data.pendingTasks.length} color="bg-yellow-400" icon={<AlertCircle className="text-yellow-600" />} />
                        <StatCard label="活跃任务" value={data.habits.length} color="bg-success" icon={<CheckCircle2 className="text-success" />} />
                        <StatCard label="历史记录" value={data.transactions.length} color="bg-slate-400" icon={<History className="text-slate-500" />} />
                    </div>
                    
                    {/* Pending Approvals */}
                    <div className="bg-yellow-50 p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                            <Clock size={100} />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="bg-yellow-400 p-2 rounded-xl border-2 border-black text-black"><AlertCircle size={24} strokeWidth={3} /></div>
                            <h3 className="font-black text-2xl text-slate-800">待审核任务 <span className="text-slate-500 text-lg ml-2">({data.pendingTasks.length})</span></h3>
                        </div>
                        
                        {data.pendingTasks.length === 0 ? (
                            <div className="text-slate-400 font-bold bg-white/60 p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                                <Sparkles className="mx-auto mb-2 opacity-50" />
                                暂时没有待审核的任务，孩子正在努力中！
                            </div>
                        ) : (
                            <div className="grid gap-4 relative z-10">
                                {data.pendingTasks.map(task => (
                                    <div key={task.id} className="bg-white p-5 rounded-2xl border-[3px] border-black shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="w-16 h-16 bg-slate-50 border-2 border-black rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                                                {task.emoji}
                                            </div>
                                            <div>
                                                <p className="font-black text-xl text-slate-800">{task.habitName}</p>
                                                <p className="text-sm text-slate-500 font-bold flex items-center gap-1">
                                                    <Clock size={14} /> {new Date(task.timestamp).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                            <span className="ml-auto sm:ml-4 bg-indigo-100 text-indigo-700 font-black px-3 py-1 rounded-lg border border-indigo-200">+{task.points}</span>
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <Button 
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRejectTask(task.id)}
                                                className="flex-1 sm:flex-none justify-center"
                                                title="拒绝"
                                            >
                                                <ThumbsDown size={20} strokeWidth={3} />
                                            </Button>
                                            <Button 
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleApproveTask(task)}
                                                className="flex-1 sm:flex-none justify-center"
                                                title="批准"
                                            >
                                                <span className="mr-2">确认完成</span>
                                                <ThumbsUp size={20} strokeWidth={3} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manual Points Adjustment */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-6 text-xl flex items-center gap-2">
                          <Coins size={24} /> 直接积分调整
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <input 
                            type="number"
                            value={manualAmount}
                            onChange={e => setManualAmount(e.target.value)}
                            placeholder="积分数量（正整数）"
                            className="w-40 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black font-bold bg-slate-50"
                          />
                          <input 
                            type="text"
                            value={manualReason}
                            onChange={e => setManualReason(e.target.value)}
                            placeholder="备注（可选，如奖励理由）"
                            className="flex-1 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black font-bold bg-slate-50"
                          />
                          <div className="flex gap-3 w-full sm:w-auto">
                            <Button onClick={handleManualAward} variant="secondary" className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white border-black">发放积分</Button>
                            <Button onClick={handleManualDeduct} variant="secondary" className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white border-black">扣除积分</Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-bold">操作会记录到历史记录中，类型分别为获得和消费。</p>
                    </div>
                </div>
            )}

            {activeTab === 'history' && <HistoryTab transactions={data.transactions} />}

            {activeTab === 'habits' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* AI 任务助手已移除 */}

                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-6 text-xl">添加自定义任务</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input 
                                value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                placeholder="任务名称 (例如: 遛狗)"
                                className="flex-1 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black focus:ring-0 font-bold bg-slate-50 transition-colors"
                            />
                            <div className="flex gap-3">
                                <input 
                                    type="number" value={newItemValue} onChange={e => setNewItemValue(e.target.value)}
                                    placeholder="分数"
                                    className="w-24 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black focus:ring-0 font-bold bg-slate-50"
                                />
                                <input 
                                    value={newItemEmoji} onChange={e => setNewItemEmoji(e.target.value)}
                                    className="w-20 p-4 rounded-2xl border-2 border-slate-200 text-center text-xl cursor-pointer focus:border-black focus:outline-none bg-slate-50"
                                    title="输入一个Emoji"
                                />
                                <Button onClick={() => handleAddItem('habit')} variant="success" className="aspect-square flex items-center justify-center p-0 w-16"><Plus size={28} strokeWidth={4}/></Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.habits.map(habit => (
                            <div key={habit.id} className="bg-white p-5 rounded-2xl border-[3px] border-black shadow-sm flex justify-between items-center group hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-sky-50 border-2 border-black rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                        {habit.emoji}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-lg">{habit.name}</p>
                                        <p className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded inline-block mt-1">奖励 {habit.points} 分</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeHabit(habit.id)}
                                    className="text-slate-300 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={22} strokeWidth={2.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'rewards' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                     <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-6 text-xl">添加自定义奖励</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input 
                                value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                placeholder="奖励名称 (例如: 周末看电影)"
                                className="flex-1 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black focus:ring-0 font-bold bg-slate-50 transition-colors"
                            />
                            <div className="flex gap-3 items-center">
                                <input 
                                    type="number" value={newItemValue} onChange={e => setNewItemValue(e.target.value)}
                                    placeholder="花费"
                                    className="w-24 p-4 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-black focus:ring-0 font-bold bg-slate-50"
                                />
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-slate-500">奖励图片</span>
                                  <input 
                                    id="rewardImageInput" 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) { setNewItemImage(null); return; }
                                      const reader = new FileReader();
                                      setIsImageReading(true);
                                      reader.onload = () => {
                                        const result = reader.result as string;
                                        const img = new Image();
                                        img.onload = () => {
                                          const maxDim = 800;
                                          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                                          const canvas = document.createElement('canvas');
                                          canvas.width = Math.round(img.width * scale);
                                          canvas.height = Math.round(img.height * scale);
                                          const ctx = canvas.getContext('2d');
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                            const compressed = canvas.toDataURL('image/jpeg', 0.85);
                                            setNewItemImage(compressed);
                                          } else {
                                            setNewItemImage(result);
                                          }
                                          setIsImageReading(false);
                                        };
                                        img.onerror = () => { setNewItemImage(result); setIsImageReading(false); };
                                        img.src = result;
                                      };
                                      reader.onerror = () => {
                                        setIsImageReading(false);
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                  <label 
                                    htmlFor="rewardImageInput" 
                                    className="px-4 py-2 rounded-2xl border-2 border-black bg-white hover:bg-slate-50 cursor-pointer font-bold shadow-cartoon-sm"
                                  >选择图片</label>
                                </div>
                                {newItemImage && (
                                  <img src={newItemImage} alt="预览" className="w-16 h-16 object-cover rounded-2xl border-2 border-black" />
                                )}
                                <Button 
                                  onClick={() => handleAddItem('reward')} 
                                  disabled={isImageReading}
                                  variant="secondary" 
                                  className={`aspect-square flex items-center justify-center p-0 w-16 border-black text-white ${isImageReading ? 'bg-slate-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
                                ><Plus size={28} strokeWidth={4}/></Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.rewards.map(reward => (
                            <div key={reward.id} className="bg-white p-5 rounded-2xl border-[3px] border-black shadow-sm flex justify-between items-center group hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-pink-50 border-2 border-black rounded-2xl flex items-center justify-center text-3xl shadow-sm overflow-hidden">
                                        {reward.image ? (
                                          <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span>{reward.emoji}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-lg">{reward.name}</p>
                                        <p className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded inline-block mt-1">花费 {reward.cost} 分</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeReward(reward.id)}
                                    className="text-slate-300 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={22} strokeWidth={2.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    
                    {/* Basic Info Settings */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-6 text-xl flex items-center gap-2">
                             <Settings size={24}/> 基础设置
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">小朋友名字</label>
                                <input 
                                    value={editChildName}
                                    onChange={e => setEditChildName(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">家长密码 (4位数字)</label>
                                <input 
                                    value={editPin}
                                    onChange={e => {
                                        const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                        setEditPin(v);
                                    }}
                                    type="text"
                                    className="w-full p-4 rounded-2xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black text-lg tracking-widest"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-500 mb-2">小朋友头像</label>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                                    {editAvatar && (
                                      <img src={editAvatar} alt="预览" className="w-16 h-16 object-cover rounded-2xl border-2 border-black" />
                                    )}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <input 
                                        id="avatarImageInput"
                                        type="file" 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) { setEditAvatar(null); return; }
                                          const reader = new FileReader();
                                          setIsAvatarReading(true);
                                          reader.onload = () => {
                                            const result = reader.result as string;
                                            const img = new Image();
                                            img.onload = () => {
                                              const maxDim = 800;
                                              const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                                              const canvas = document.createElement('canvas');
                                              canvas.width = Math.round(img.width * scale);
                                              canvas.height = Math.round(img.height * scale);
                                              const ctx = canvas.getContext('2d');
                                              if (ctx) {
                                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                const compressed = canvas.toDataURL('image/jpeg', 0.85);
                                                setEditAvatar(compressed);
                                              } else {
                                                setEditAvatar(result);
                                              }
                                              setIsAvatarReading(false);
                                            };
                                            img.onerror = () => { setEditAvatar(result); setIsAvatarReading(false); };
                                            img.src = result;
                                          };
                                          reader.onerror = () => {
                                            setIsAvatarReading(false);
                                          };
                                          reader.readAsDataURL(file);
                                        }}
                                      />
                                      <label 
                                        htmlFor="avatarImageInput" 
                                        className="px-4 py-2 rounded-2xl border-2 border-black bg-white hover:bg-slate-50 cursor-pointer font-bold shadow-cartoon-sm"
                                      >选择图片</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSaveSettings} variant="primary" disabled={isAvatarReading}>保存修改</Button>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
                             <Save size={24}/> 数据备份与恢复
                        </h3>
                        <p className="text-slate-500 font-bold mb-6">
                            将数据导出为文件保存到本地，或者从文件恢复数据。
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={() => exportDataToFile()} variant="secondary" className="flex-1 py-4">
                                <Download className="mr-2" size={20} strokeWidth={3} />
                                导出数据 (JSON)
                            </Button>
                            
                            <div className="relative flex-1">
                                <input 
                                    type="file" 
                                    accept=".json"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if(file) {
                                            try {
                                                const imported = await importDataFromFile(file);
                                                setData(imported);
                                                // Sync settings inputs
                                                setEditChildName(imported.childName || '宝贝');
                                                setEditPin(imported.parentPin || '0000');
                                                showToast("数据恢复成功！");
                                            } catch(err) {
                                                showToast("文件格式错误", "error");
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Button variant="primary" className="w-full py-4 h-full">
                                    <Upload className="mr-2" size={20} strokeWidth={3} />
                                    导入数据 (JSON)
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
                             <Zap size={24} className="text-orange-500 fill-orange-500"/> 开发者选项
                        </h3>
                        <p className="text-slate-500 font-bold mb-6">
                             性能测试工具
                        </p>
                        <Button 
                            onClick={handleBulkInsert} 
                            disabled={isGenerating}
                            variant="danger" 
                            className="w-full py-4 bg-orange-400 hover:bg-orange-500"
                        >
                            {isGenerating ? '生成中...' : '生成 10,000 条测试数据'}
                        </Button>
                    </div>

                    {/* Developer Tool: Reset All Data */}
                    <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border-[3px] border-black shadow-cartoon">
                        <h3 className="font-black text-slate-800 mb-4 text-xl flex items-center gap-2">
                            <AlertCircle size={24} className="text-red-600"/> 开发者工具：清空所有数据
                        </h3>
                        <p className="text-slate-600 font-bold mb-4">该操作将删除所有积分、习惯、奖励、待审批任务和历史记录。不可恢复，请谨慎操作。</p>
                        <Button 
                          onClick={() => setIsResetModalOpen(true)}
                          variant="danger" 
                          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white border-black"
                        >
                          清空所有数据
                        </Button>
                    </div>
                    
                    <div className="bg-indigo-50 p-6 rounded-[2rem] border-[3px] border-black/10 text-center">
                        <p className="text-indigo-300 font-bold text-sm">Habit Hero v2.1 • Data stored in IndexedDB</p>
                    </div>
                </div>
            )}
        </div>

        {/* AI 模块已移除 */}

        {/* Reset Confirm Modal */}
        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="危险操作：清空所有数据">
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">该操作将清空服务端数据库中的所有数据，不可恢复。请确认并输入管理员密码以继续。</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={ackReset} onChange={e => setAckReset(e.target.checked)} />
              <span className="text-sm font-bold text-slate-600">我已了解此操作不可恢复，并确认继续</span>
            </label>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2">管理员密码</label>
              <input 
                type="password" 
                value={resetPassword} 
                onChange={e => setResetPassword(e.target.value)}
                placeholder="请输入：admin"
                className="w-full p-3 rounded-xl border-[3px] border-slate-200 focus:border-black focus:outline-none font-black"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setIsResetModalOpen(false)} variant="secondary">取消</Button>
              <Button onClick={handleResetAll} disabled={isResetting || !ackReset || !resetPassword} variant="danger" className="bg-red-500 hover:bg-red-600">
                {isResetting ? '正在清空...' : '确认清空'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  if (!data) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-slate-400 gap-4">
         <div className="w-16 h-16 border-4 border-slate-300 border-t-primary rounded-full animate-spin"></div>
         <span className="font-bold">加载数据中...</span>
      </div>
  );

  return (
    <>
      {view === 'landing' && renderLanding()}
      {view === 'kid' && renderKidDashboard()}
      {view === 'parent' && <ParentDashboard activeTab={parentActiveTab} onChangeTab={(t) => setParentActiveTab(t)} />}

      {/* Pin Modal */}
      <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title="家长验证">
        <div className="text-center">
            <p className="mb-6 text-slate-600 font-bold text-lg">输入密码进入管理后台</p>
            <div className="flex justify-center gap-2 mb-8">
                <input 
                    type="password" 
                    maxLength={4}
                    placeholder="0000"
                    className="text-center text-4xl tracking-[0.5em] font-black w-48 border-b-4 border-slate-300 focus:border-black focus:outline-none bg-transparent py-2 placeholder:text-slate-200"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />
            </div>
            <Button 
                onClick={() => {
                    const correctPin = data?.parentPin || '0000';
                    if(pin === correctPin) {
                        setPin('');
                        setShowPinModal(false);
                        setView('parent');
                    } else {
                        showToast('密码错误', 'error');
                        setPin('');
                    }
                }} 
                className="w-full text-lg"
            >
                进入后台
            </Button>
            <p className="mt-4 text-xs text-slate-400 font-bold">默认密码: 0000</p>
        </div>
      </Modal>

      {/* Global Toast */}
      {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl border-[3px] border-black shadow-cartoon-lg z-50 animate-in slide-in-from-top-4 fade-in duration-300 font-black flex items-center gap-3 text-lg min-w-[300px] justify-center
            ${toast.type === 'success' ? 'bg-success text-slate-900' : 
              toast.type === 'info' ? 'bg-blue-400 text-white' : 'bg-red-400 text-white'}`}>
             {toast.type === 'success' ? <Sparkles size={24} className="text-white fill-white animate-spin-slow" /> : <AlertCircle size={24} />}
             {toast.message}
          </div>
      )}
    </>
  );
}