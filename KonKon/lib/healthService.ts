import { Database } from './database.types';
import { supabase } from './supabase';

export type HealthRecord = Database['public']['Tables']['health_records']['Row'];
export type InsertHealthRecord = Database['public']['Tables']['health_records']['Insert'];
export type UpdateHealthRecord = Database['public']['Tables']['health_records']['Update'];

export type Medication = Database['public']['Tables']['medications']['Row'];
export type InsertMedication = Database['public']['Tables']['medications']['Insert'];

export type MedicationLog = Database['public']['Tables']['medication_logs']['Row'];
export type InsertMedicationLog = Database['public']['Tables']['medication_logs']['Insert'];

export type HealthCheckup = Database['public']['Tables']['health_checkups']['Row'];
export type InsertHealthCheckup = Database['public']['Tables']['health_checkups']['Insert'];

export type HealthGoal = Database['public']['Tables']['health_goals']['Row'];
export type InsertHealthGoal = Database['public']['Tables']['health_goals']['Insert'];

export type HealthAlert = Database['public']['Tables']['health_alerts']['Row'];

// 血壓數據接口
export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  measurementTime?: Date;
  measurementLocation?: string;
  deviceName?: string;
  hasSymptoms?: boolean;
  symptoms?: string[];
}

// 健康統計數據接口
export interface HealthStats {
  averageBP: {
    systolic: number;
    diastolic: number;
  };
  bloodPressureTrend: 'improving' | 'stable' | 'worsening';
  recentReadings: HealthRecord[];
  medicationAdherence: number; // 百分比
  nextCheckupDate?: Date;
  alerts: HealthAlert[];
}

// 血壓分類
export interface BloodPressureCategory {
  category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  label: string;
  color: string;
  description: string;
}

class HealthService {
  // 血壓相關方法

  /**
   * 記錄血壓數據
   */
  async recordBloodPressure(data: BloodPressureData, familyId?: string): Promise<HealthRecord> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const healthRecord: InsertHealthRecord = {
      user_id: user.id,
      family_id: familyId || null,
      record_type: 'blood_pressure',
      systolic_bp: data.systolic,
      diastolic_bp: data.diastolic,
      pulse: data.pulse || null,
      notes: data.notes || null,
      measurement_time: data.measurementTime?.toISOString() || new Date().toISOString(),
      measurement_location: data.measurementLocation || null,
      device_name: data.deviceName || null,
      has_symptoms: data.hasSymptoms || false,
      symptoms: data.symptoms || null,
    };

    const { data: record, error } = await supabase
      .from('health_records')
      .insert(healthRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`記錄血壓失敗: ${error.message}`);
    }

    return record;
  }

  /**
   * 獲取血壓記錄
   */
  async getBloodPressureRecords(
    userId?: string,
    limit = 30,
    startDate?: Date,
    endDate?: Date
  ): Promise<HealthRecord[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;

    let query = supabase
      .from('health_records')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('record_type', 'blood_pressure')
      .order('measurement_time', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('measurement_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('measurement_time', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`獲取血壓記錄失敗: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 獲取血壓分類
   */
  getBloodPressureCategory(systolic: number, diastolic: number): BloodPressureCategory {
    if (systolic >= 180 || diastolic >= 120) {
      return {
        category: 'crisis',
        label: '高血壓危象',
        color: '#FF0000',
        description: '需要立即就醫'
      };
    } else if (systolic >= 140 || diastolic >= 90) {
      return {
        category: 'stage2',
        label: '高血壓 2 期',
        color: '#FF6B35',
        description: '需要藥物治療'
      };
    } else if (systolic >= 130 || diastolic >= 80) {
      return {
        category: 'stage1',
        label: '高血壓 1 期',
        color: '#FFB347',
        description: '建議生活方式調整'
      };
    } else if (systolic >= 120) {
      return {
        category: 'elevated',
        label: '血壓偏高',
        color: '#FFE135',
        description: '需要注意控制'
      };
    } else {
      return {
        category: 'normal',
        label: '正常血壓',
        color: '#4CAF50',
        description: '維持健康生活方式'
      };
    }
  }

  /**
   * 計算血壓統計數據
   */
  async getBloodPressureStats(userId?: string, days = 30): Promise<HealthStats> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.getBloodPressureRecords(targetUserId, 100, startDate);

    if (records.length === 0) {
      return {
        averageBP: { systolic: 0, diastolic: 0 },
        bloodPressureTrend: 'stable',
        recentReadings: [],
        medicationAdherence: 0,
        alerts: []
      };
    }

    // 計算平均血壓
    const avgSystolic = records.reduce((sum, r) => sum + (r.systolic_bp || 0), 0) / records.length;
    const avgDiastolic = records.reduce((sum, r) => sum + (r.diastolic_bp || 0), 0) / records.length;

    // 分析血壓趨勢
    const recentHalf = records.slice(0, Math.floor(records.length / 2));
    const earlierHalf = records.slice(Math.floor(records.length / 2));

    const recentAvgSystolic = recentHalf.reduce((sum, r) => sum + (r.systolic_bp || 0), 0) / recentHalf.length;
    const earlierAvgSystolic = earlierHalf.reduce((sum, r) => sum + (r.systolic_bp || 0), 0) / earlierHalf.length;

    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    const difference = recentAvgSystolic - earlierAvgSystolic;

    if (difference > 5) {
      trend = 'worsening';
    } else if (difference < -5) {
      trend = 'improving';
    }

    // 獲取用藥依從性
    const medicationAdherence = await this.getMedicationAdherence(targetUserId, days);

    // 獲取警報
    const alerts = await this.getHealthAlerts(targetUserId);

    return {
      averageBP: {
        systolic: Math.round(avgSystolic),
        diastolic: Math.round(avgDiastolic)
      },
      bloodPressureTrend: trend,
      recentReadings: records.slice(0, 10),
      medicationAdherence,
      alerts
    };
  }

  // 用藥管理方法

  /**
   * 添加用藥記錄
   */
  async addMedication(medication: InsertMedication, familyId?: string): Promise<Medication> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const medicationData = {
      ...medication,
      user_id: user.id,
      family_id: familyId || null,
    };

    const { data, error } = await supabase
      .from('medications')
      .insert(medicationData)
      .select()
      .single();

    if (error) {
      throw new Error(`添加用藥記錄失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 記錄服藥狀況
   */
  async logMedicationTaken(
    medicationId: string,
    scheduledTime: Date,
    actualTime?: Date,
    status: 'taken' | 'missed' | 'skipped' | 'delayed' = 'taken',
    notes?: string
  ): Promise<MedicationLog> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const logData: InsertMedicationLog = {
      medication_id: medicationId,
      user_id: user.id,
      scheduled_time: scheduledTime.toISOString(),
      actual_time: actualTime?.toISOString() || null,
      status,
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('medication_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      throw new Error(`記錄服藥狀況失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 獲取用藥清單
   */
  async getMedications(userId?: string, activeOnly = true): Promise<Medication[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;

    let query = supabase
      .from('medications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`獲取用藥清單失敗: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 計算用藥依從性
   */
  async getMedicationAdherence(userId?: string, days = 30): Promise<number> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: logs, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('scheduled_time', startDate.toISOString());

    if (error || !logs || logs.length === 0) {
      return 0;
    }

    const takenCount = logs.filter(log => log.status === 'taken').length;
    return Math.round((takenCount / logs.length) * 100);
  }

  // 健康檢查方法

  /**
   * 添加健康檢查記錄
   */
  async addHealthCheckup(checkup: InsertHealthCheckup, familyId?: string): Promise<HealthCheckup> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const checkupData = {
      ...checkup,
      user_id: user.id,
      family_id: familyId || null,
    };

    const { data, error } = await supabase
      .from('health_checkups')
      .insert(checkupData)
      .select()
      .single();

    if (error) {
      throw new Error(`添加健康檢查記錄失敗: ${error.message}`);
    }

    return data;
  }

  /**
   * 獲取健康檢查記錄
   */
  async getHealthCheckups(userId?: string, limit = 10): Promise<HealthCheckup[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;

    const { data, error } = await supabase
      .from('health_checkups')
      .select('*')
      .eq('user_id', targetUserId)
      .order('checkup_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`獲取健康檢查記錄失敗: ${error.message}`);
    }

    return data || [];
  }

  // 健康警報方法

  /**
   * 獲取健康警報
   */
  async getHealthAlerts(userId?: string, unreadOnly = false): Promise<HealthAlert[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;

    let query = supabase
      .from('health_alerts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`獲取健康警報失敗: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 標記警報為已讀
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('health_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      throw new Error(`標記警報失敗: ${error.message}`);
    }
  }

  // 家庭健康分享方法

  /**
   * 設定健康數據分享權限
   */
  async setHealthSharingPermissions(
    sharedWithUserId: string,
    familyId: string,
    permissions: {
      canViewBloodPressure?: boolean;
      canViewWeight?: boolean;
      canViewMedications?: boolean;
      canViewCheckups?: boolean;
      canViewGoals?: boolean;
      emergencyContact?: boolean;
      canReceiveAlerts?: boolean;
    }
  ): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const { error } = await supabase
      .from('health_sharing_settings')
      .upsert({
        user_id: user.id,
        family_id: familyId,
        shared_with_user_id: sharedWithUserId,
        can_view_blood_pressure: permissions.canViewBloodPressure || false,
        can_view_weight: permissions.canViewWeight || false,
        can_view_medications: permissions.canViewMedications || false,
        can_view_checkups: permissions.canViewCheckups || false,
        can_view_goals: permissions.canViewGoals || false,
        emergency_contact: permissions.emergencyContact || false,
        can_receive_alerts: permissions.canReceiveAlerts || false,
      });

    if (error) {
      throw new Error(`設定分享權限失敗: ${error.message}`);
    }
  }

  // 健康報告生成

  /**
   * 生成健康報告
   */
  async generateHealthReport(userId?: string, days = 30): Promise<{
    period: string;
    bloodPressureStats: HealthStats;
    medicationSummary: {
      totalMedications: number;
      adherenceRate: number;
      missedDoses: number;
    };
    recommendations: string[];
    nextActions: string[];
  }> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;
    
    // 獲取血壓統計
    const bloodPressureStats = await this.getBloodPressureStats(targetUserId, days);
    
    // 獲取用藥信息
    const medications = await this.getMedications(targetUserId);
    const adherenceRate = await this.getMedicationAdherence(targetUserId, days);
    
    // 獲取錯過服藥次數
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: missedLogs } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('status', 'missed')
      .gte('scheduled_time', startDate.toISOString());

    // 生成建議
    const recommendations: string[] = [];
    const nextActions: string[] = [];

    // 血壓相關建議
    if (bloodPressureStats.averageBP.systolic >= 140) {
      recommendations.push('您的血壓偏高，建議定期監測並諮詢醫生');
      nextActions.push('預約心血管科門診');
    } else if (bloodPressureStats.averageBP.systolic >= 130) {
      recommendations.push('血壓略高於正常範圍，建議注意飲食和運動');
      nextActions.push('制定低鹽飲食計劃');
    }

    // 用藥依從性建議
    if (adherenceRate < 80) {
      recommendations.push('用藥依從性需要改善，建議設定用藥提醒');
      nextActions.push('設定更多用藥提醒時間');
    }

    // 血壓趨勢建議
    if (bloodPressureStats.bloodPressureTrend === 'worsening') {
      recommendations.push('血壓呈上升趨勢，建議加強自我管理');
      nextActions.push('增加血壓測量頻率');
    }

    return {
      period: `最近 ${days} 天`,
      bloodPressureStats,
      medicationSummary: {
        totalMedications: medications.length,
        adherenceRate,
        missedDoses: missedLogs?.length || 0,
      },
      recommendations,
      nextActions,
    };
  }

  /**
   * 獲取今日用藥提醒
   */
  async getTodayMedicationReminders(userId?: string): Promise<Array<{
    medication: Medication;
    reminderTimes: string[];
    takenTimes: Array<{
      time: string;
      status: 'taken' | 'missed' | 'skipped' | 'delayed';
    }>;
  }>> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('使用者未登入');
    }

    const targetUserId = userId || user.id;
    const today = new Date().toDateString();

    const medications = await this.getMedications(targetUserId, true);

    const result = [];

    for (const medication of medications) {
      // 獲取今日服藥記錄
      const { data: todayLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('medication_id', medication.id)
        .gte('scheduled_time', `${today}T00:00:00Z`)
        .lt('scheduled_time', `${today}T23:59:59Z`);

      const takenTimes = (todayLogs || []).map(log => ({
        time: new Date(log.scheduled_time).toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: log.status as 'taken' | 'missed' | 'skipped' | 'delayed'
      }));

      result.push({
        medication,
        reminderTimes: medication.reminder_times || [],
        takenTimes
      });
    }

    return result;
  }
}

export const healthService = new HealthService();
export default healthService; 