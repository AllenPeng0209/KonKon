import { supabase } from './supabase';
import type { Database } from './database.types';

// 類型定義
export type ChoreTemplate = Database['public']['Tables']['chore_templates']['Row'];
export type ChoreTemplateInsert = Database['public']['Tables']['chore_templates']['Insert'];
export type ChoreTask = Database['public']['Tables']['chore_tasks']['Row'];
export type ChoreTaskInsert = Database['public']['Tables']['chore_tasks']['Insert'];
export type ChoreTaskUpdate = Database['public']['Tables']['chore_tasks']['Update'];
export type ChoreCompletion = Database['public']['Tables']['chore_completions']['Row'];
export type ChoreSkill = Database['public']['Tables']['chore_skills']['Row'];
export type ChorePoint = Database['public']['Tables']['chore_points']['Row'];
export type ChoreReward = Database['public']['Tables']['chore_rewards']['Row'];
export type ChoreAssignmentRule = Database['public']['Tables']['chore_assignment_rules']['Row'];

export interface ChoreTaskWithDetails extends ChoreTask {
  assigned_member?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  template?: ChoreTemplate;
  completion?: ChoreCompletion;
}

export interface ChoreStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalPoints: number;
  completionRate: number;
  avgCompletionTime: number;
}

export interface MemberChoreStats extends ChoreStats {
  memberId: string;
  memberName: string;
  skillLevels: { [category: string]: number };
  recentCompletions: ChoreCompletion[];
}

// 家務模板相關服務
export class ChoreTemplateService {
  static async getAll(): Promise<ChoreTemplate[]> {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getByCategory(category: string): Promise<ChoreTemplate[]> {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async create(template: ChoreTemplateInsert): Promise<ChoreTemplate> {
    const { data, error } = await supabase
      .from('chore_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<ChoreTemplateInsert>): Promise<ChoreTemplate> {
    const { data, error } = await supabase
      .from('chore_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('chore_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// 家務任務相關服務
export class ChoreTaskService {
  static async getByFamily(familyId: string): Promise<ChoreTaskWithDetails[]> {
    const { data, error } = await supabase
      .from('chore_tasks')
      .select(`
        *,
        assigned_member:family_members!assigned_to(id, name, avatar_url),
        template:chore_templates(*)
      `)
      .eq('family_id', familyId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByMember(memberId: string): Promise<ChoreTaskWithDetails[]> {
    const { data, error } = await supabase
      .from('chore_tasks')
      .select(`
        *,
        assigned_member:family_members!assigned_to(id, name, avatar_url),
        template:chore_templates(*)
      `)
      .eq('assigned_to', memberId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTasksForDateRange(
    familyId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ChoreTaskWithDetails[]> {
    const { data, error } = await supabase
      .from('chore_tasks')
      .select(`
        *,
        assigned_member:family_members!assigned_to(id, name, avatar_url),
        template:chore_templates(*)
      `)
      .eq('family_id', familyId)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async create(task: ChoreTaskInsert): Promise<ChoreTask> {
    const { data, error } = await supabase
      .from('chore_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: ChoreTaskUpdate): Promise<ChoreTask> {
    const { data, error } = await supabase
      .from('chore_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markCompleted(
    taskId: string, 
    completedBy: string, 
    completionData: {
      notes?: string;
      timeTaken?: number;
      photoUrls?: string[];
      qualityRating?: number;
    }
  ): Promise<ChoreCompletion> {
    // 開始事務
    const { data: completion, error: completionError } = await supabase
      .from('chore_completions')
      .insert({
        task_id: taskId,
        completed_by: completedBy,
        completion_time: new Date().toISOString(),
        quality_rating: completionData.qualityRating,
        time_taken: completionData.timeTaken,
        notes: completionData.notes,
        photo_urls: completionData.photoUrls,
        points_earned: 10 // 基礎積分，可根據難度調整
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // 更新任務狀態
    const { error: taskUpdateError } = await supabase
      .from('chore_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_duration: completionData.timeTaken,
        notes: completionData.notes,
        photo_urls: completionData.photoUrls
      })
      .eq('id', taskId);

    if (taskUpdateError) throw taskUpdateError;

    // 添加積分記錄
    const { error: pointsError } = await supabase
      .from('chore_points')
      .insert({
        member_id: completedBy,
        task_id: taskId,
        points: completion.points_earned || 10,
        point_type: 'earned',
        reason: '完成家務任務'
      });

    if (pointsError) throw pointsError;

    return completion;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('chore_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// 家務統計服務
export class ChoreStatsService {
  static async getFamilyStats(familyId: string): Promise<ChoreStats> {
    const { data: tasks, error } = await supabase
      .from('chore_tasks')
      .select('status, actual_duration, points_reward')
      .eq('family_id', familyId);

    if (error) throw error;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
    
    const totalPoints = tasks?.reduce((sum, t) => sum + (t.points_reward || 0), 0) || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const completedTasksWithTime = tasks?.filter(t => t.status === 'completed' && t.actual_duration) || [];
    const avgCompletionTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((sum, t) => sum + (t.actual_duration || 0), 0) / completedTasksWithTime.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalPoints,
      completionRate,
      avgCompletionTime
    };
  }

  static async getMemberStats(memberId: string): Promise<MemberChoreStats> {
    // 獲取成員基本任務統計
    const { data: tasks, error: tasksError } = await supabase
      .from('chore_tasks')
      .select('status, actual_duration, points_reward')
      .eq('assigned_to', memberId);

    if (tasksError) throw tasksError;

    // 獲取成員信息
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('name')
      .eq('id', memberId)
      .single();

    if (memberError) throw memberError;

    // 獲取技能等級
    const { data: skills, error: skillsError } = await supabase
      .from('chore_skills')
      .select('category, skill_level')
      .eq('member_id', memberId);

    if (skillsError) throw skillsError;

    // 獲取最近完成記錄
    const { data: recentCompletions, error: completionsError } = await supabase
      .from('chore_completions')
      .select('*')
      .eq('completed_by', memberId)
      .order('completion_time', { ascending: false })
      .limit(10);

    if (completionsError) throw completionsError;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
    
    const totalPoints = tasks?.reduce((sum, t) => sum + (t.points_reward || 0), 0) || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const completedTasksWithTime = tasks?.filter(t => t.status === 'completed' && t.actual_duration) || [];
    const avgCompletionTime = completedTasksWithTime.length > 0 
      ? completedTasksWithTime.reduce((sum, t) => sum + (t.actual_duration || 0), 0) / completedTasksWithTime.length
      : 0;

    const skillLevels = skills?.reduce((acc, skill) => {
      acc[skill.category] = skill.skill_level;
      return acc;
    }, {} as { [category: string]: number }) || {};

    return {
      memberId,
      memberName: member?.name || '',
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalPoints,
      completionRate,
      avgCompletionTime,
      skillLevels,
      recentCompletions: recentCompletions || []
    };
  }
}

// 家務技能服務
export class ChoreSkillService {
  static async getMemberSkills(memberId: string): Promise<ChoreSkill[]> {
    const { data, error } = await supabase
      .from('chore_skills')
      .select('*')
      .eq('member_id', memberId);

    if (error) throw error;
    return data || [];
  }

  static async updateSkill(
    memberId: string, 
    category: string, 
    experienceGained: number
  ): Promise<ChoreSkill> {
    // 首先嘗試獲取現有技能
    const { data: existingSkill } = await supabase
      .from('chore_skills')
      .select('*')
      .eq('member_id', memberId)
      .eq('category', category)
      .single();

    if (existingSkill) {
      // 更新現有技能
      const newExperience = existingSkill.experience_points + experienceGained;
      const newLevel = Math.min(5, Math.floor(newExperience / 100) + 1); // 每100經驗值升一級

      const { data, error } = await supabase
        .from('chore_skills')
        .update({
          skill_level: newLevel,
          experience_points: newExperience,
          last_updated: new Date().toISOString()
        })
        .eq('member_id', memberId)
        .eq('category', category)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // 創建新技能記錄
      const newLevel = Math.min(5, Math.floor(experienceGained / 100) + 1);
      
      const { data, error } = await supabase
        .from('chore_skills')
        .insert({
          member_id: memberId,
          category,
          skill_level: newLevel,
          experience_points: experienceGained
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
}

// 家務積分服務
export class ChorePointService {
  static async getMemberPoints(memberId: string): Promise<number> {
    const { data, error } = await supabase
      .from('chore_points')
      .select('points, point_type')
      .eq('member_id', memberId);

    if (error) throw error;

    const totalPoints = data?.reduce((sum, point) => {
      return point.point_type === 'redeemed' || point.point_type === 'penalty'
        ? sum - Math.abs(point.points)
        : sum + point.points;
    }, 0) || 0;

    return Math.max(0, totalPoints);
  }

  static async getMemberPointHistory(memberId: string): Promise<ChorePoint[]> {
    const { data, error } = await supabase
      .from('chore_points')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addPoints(
    memberId: string,
    points: number,
    pointType: 'earned' | 'bonus' | 'penalty' | 'redeemed',
    reason: string,
    taskId?: string
  ): Promise<ChorePoint> {
    const { data, error } = await supabase
      .from('chore_points')
      .insert({
        member_id: memberId,
        points,
        point_type: pointType,
        reason,
        task_id: taskId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// 家務獎勵服務
export class ChoreRewardService {
  static async getFamilyRewards(familyId: string): Promise<ChoreReward[]> {
    const { data, error } = await supabase
      .from('chore_rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('active', true)
      .order('points_cost', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async redeemReward(memberId: string, rewardId: string): Promise<void> {
    // 獲取獎勵信息
    const { data: reward, error: rewardError } = await supabase
      .from('chore_rewards')
      .select('points_cost')
      .eq('id', rewardId)
      .single();

    if (rewardError) throw rewardError;

    // 檢查積分是否足夠
    const currentPoints = await ChorePointService.getMemberPoints(memberId);
    if (currentPoints < reward.points_cost) {
      throw new Error('積分不足');
    }

    // 創建兌換記錄
    const { error: redemptionError } = await supabase
      .from('chore_reward_redemptions')
      .insert({
        member_id: memberId,
        reward_id: rewardId,
        points_used: reward.points_cost
      });

    if (redemptionError) throw redemptionError;

    // 扣除積分
    await ChorePointService.addPoints(
      memberId,
      reward.points_cost,
      'redeemed',
      '兌換獎勵'
    );
  }
}