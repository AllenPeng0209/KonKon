import { useState, useEffect, useCallback } from 'react';
import { 
  ChoreTaskService, 
  ChoreTemplateService, 
  ChoreStatsService,
  ChoreTaskWithDetails, 
  ChoreTemplate,
  ChoreStats,
  MemberChoreStats
} from '@/lib/choreService';
import { useFamily } from '@/contexts/FamilyContext';

export function useChores() {
  const { currentFamily, familyMembers } = useFamily();
  const [tasks, setTasks] = useState<ChoreTaskWithDetails[]>([]);
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [familyStats, setFamilyStats] = useState<ChoreStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberChoreStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入家務任務
  const loadTasks = useCallback(async () => {
    if (!currentFamily) {
      setTasks([]);
      return;
    }

    try {
      setError(null);
      const familyTasks = await ChoreTaskService.getByFamily(currentFamily.id);
      setTasks(familyTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('載入家務任務失敗');
    }
  }, [currentFamily]);

  // 載入家務模板
  const loadTemplates = useCallback(async () => {
    try {
      setError(null);
      const allTemplates = await ChoreTemplateService.getAll();
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('載入家務模板失敗');
    }
  }, []);

  // 載入統計數據
  const loadStats = useCallback(async () => {
    if (!currentFamily) {
      setFamilyStats(null);
      setMemberStats([]);
      return;
    }

    try {
      setError(null);
      const [fStats, ...mStats] = await Promise.all([
        ChoreStatsService.getFamilyStats(currentFamily.id),
        ...familyMembers.map(member => 
          ChoreStatsService.getMemberStats(member.id)
        )
      ]);
      
      setFamilyStats(fStats);
      setMemberStats(mStats);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('載入統計數據失敗');
    }
  }, [currentFamily, familyMembers]);

  // 載入所有數據
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadTemplates(),
        loadStats(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadTasks, loadTemplates, loadStats]);

  // 創建新家務任務
  const createTask = useCallback(async (taskData: Parameters<typeof ChoreTaskService.create>[0]) => {
    try {
      setError(null);
      const newTask = await ChoreTaskService.create(taskData);
      await loadTasks(); // 重新載入任務列表
      await loadStats(); // 更新統計數據
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('創建家務任務失敗');
      throw err;
    }
  }, [loadTasks, loadStats]);

  // 更新家務任務
  const updateTask = useCallback(async (taskId: string, updates: Parameters<typeof ChoreTaskService.update>[1]) => {
    try {
      setError(null);
      const updatedTask = await ChoreTaskService.update(taskId, updates);
      await loadTasks(); // 重新載入任務列表
      await loadStats(); // 更新統計數據
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('更新家務任務失敗');
      throw err;
    }
  }, [loadTasks, loadStats]);

  // 標記任務完成
  const completeTask = useCallback(async (
    taskId: string, 
    completedBy: string, 
    completionData: Parameters<typeof ChoreTaskService.markCompleted>[2]
  ) => {
    try {
      setError(null);
      const completion = await ChoreTaskService.markCompleted(taskId, completedBy, completionData);
      await loadTasks(); // 重新載入任務列表
      await loadStats(); // 更新統計數據
      return completion;
    } catch (err) {
      console.error('Error completing task:', err);
      setError('完成家務任務失敗');
      throw err;
    }
  }, [loadTasks, loadStats]);

  // 刪除家務任務
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      await ChoreTaskService.delete(taskId);
      await loadTasks(); // 重新載入任務列表
      await loadStats(); // 更新統計數據
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('刪除家務任務失敗');
      throw err;
    }
  }, [loadTasks, loadStats]);

  // 獲取成員的待處理任務
  const getMemberPendingTasks = useCallback((memberId: string) => {
    return tasks.filter(task => 
      task.assigned_to === memberId && 
      (task.status === 'pending' || task.status === 'in_progress')
    );
  }, [tasks]);

  // 獲取今日到期的任務
  const getTodayDueTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);

  // 獲取逾期任務
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      return new Date(task.due_date) < now;
    });
  }, [tasks]);

  // 獲取按分類分組的任務
  const getTasksByCategory = useCallback(() => {
    const categories = ['清潔', '烹飪', '購物', '照顧', '維修', '其他'];
    return categories.map(category => ({
      category,
      tasks: tasks.filter(task => task.category === category),
      completed: tasks.filter(task => task.category === category && task.status === 'completed').length,
      total: tasks.filter(task => task.category === category).length,
    })).filter(cat => cat.total > 0);
  }, [tasks]);

  // 自動載入數據
  useEffect(() => {
    if (currentFamily) {
      loadAllData();
    }
  }, [currentFamily, loadAllData]);

  return {
    // 數據
    tasks,
    templates,
    familyStats,
    memberStats,
    
    // 狀態
    isLoading,
    error,
    
    // 操作
    loadAllData,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    
    // 計算屬性
    getMemberPendingTasks,
    getTodayDueTasks,
    getOverdueTasks,
    getTasksByCategory,
  };
}