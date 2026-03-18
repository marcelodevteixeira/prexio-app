import { supabase } from './supabaseClient';
import { UserProfile, Badge, Mission, UserMission } from './types';

// Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
  }
}

async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.id,
      email: user?.email,
    },
    operationType,
    path
  }
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const POINTS = {
  SCAN_RECEIPT: 50,
  REGISTER_PRICE: 10,
  NEW_PRODUCT: 15,
  CHEAPER_PRICE: 30,
  CONFIRM_PRICE: 5,
  COMPLETE_LIST: 20,
};

export const LEVELS = [
  { name: 'Explorador', minPoints: 0 },
  { name: 'Caçador de Preços', minPoints: 500 },
  { name: 'Especialista em Economia', minPoints: 1500 },
  { name: 'Mestre dos Descontos', minPoints: 3500 },
  { name: 'Lenda da Economia', minPoints: 7000 },
];

export function getLevel(points: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i].name;
    }
  }
  return LEVELS[0].name;
}

export async function addPoints(userId: string, amount: number, reason: string) {
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (fetchError) {
    await handleSupabaseError(fetchError, OperationType.GET, `users/${userId}`);
    return null;
  }
  
  if (userData) {
    const newPoints = (userData.points_total || 0) + amount;
    const newLevel = getLevel(newPoints);
    
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points_total: newPoints,
          level: newLevel
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
    } catch (e) {
      await handleSupabaseError(e, OperationType.UPDATE, `users/${userId}`);
    }

    // Check missions
    await updateMissionProgress(userId, amount, reason);
    
    return { pointsEarned: amount, newTotal: newPoints, newLevel };
  }
  return null;
}

async function updateMissionProgress(userId: string, amount: number, reason: string) {
  const { data: userMissions, error: fetchError } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false);
    
  if (fetchError) {
    await handleSupabaseError(fetchError, OperationType.LIST, 'user_missions');
    return;
  }
  
  for (const missionData of userMissions || []) {
    const newProgress = missionData.progress + 1;
    
    const { data: missionDef } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionData.mission_id)
      .single();
      
    if (missionDef) {
      const isCompleted = newProgress >= missionDef.goal;
      
      try {
        const { error: updateError } = await supabase
          .from('user_missions')
          .update({
            progress: newProgress,
            completed: isCompleted,
            last_updated: new Date().toISOString()
          })
          .eq('id', missionData.id);
          
        if (updateError) throw updateError;
      } catch (e) {
        await handleSupabaseError(e, OperationType.UPDATE, `user_missions/${missionData.id}`);
      }

      if (isCompleted) {
        await addPoints(userId, missionDef.reward_points, `Missão concluída: ${missionDef.title}`);
      }
    }
  }
}

export async function checkAndAwardBadges(userId: string) {
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('points_total')
    .eq('id', userId)
    .single();
    
  if (fetchError || !userData) return;
  
  const points = userData.points_total || 0;

  // Example badge logic
  const badgesToAward = [];
  if (points >= 100) badgesToAward.push('b1'); // Iniciante
  if (points >= 1000) badgesToAward.push('b2'); // Explorador
  
  for (const badgeId of badgesToAward) {
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId);
      
    if (!existingBadge || existingBadge.length === 0) {
      try {
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badgeId,
            date_earned: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      } catch (e) {
        await handleSupabaseError(e, OperationType.CREATE, 'user_badges');
      }
    }
  }
}
