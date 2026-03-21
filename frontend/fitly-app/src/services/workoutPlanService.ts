import client from './apiClient';

export interface PlannedExerciseResponse {
  plannedExerciseId: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  orderIndex: number;
}

export interface DayPlanResponse {
  dayOfWeek: number;
  isRestDay: boolean;
  dayType?: 'unset' | 'training' | 'rest' | 'cardio' | 'custom';
  planName?: string;
  customPlanLabel?: string;
  plannedExercises: PlannedExerciseResponse[];
}

export interface GetWeeklyPlanResponse {
  workoutPlanId: number;
  startDate: string;
  dayPlans: DayPlanResponse[];
}

export interface TodayPlanResponse {
  isRestDay: boolean;
  date: string;
  plannedExercises: PlannedExerciseResponse[];
}

export interface SaveWeeklyPlanRequest {
  startDate: string;
  dayPlans: Array<{
    dayOfWeek: number;
    isRestDay: boolean;
    dayType?: 'unset' | 'training' | 'rest' | 'cardio' | 'custom';
    planName?: string;
    customPlanLabel?: string;
    plannedExercises: Array<{
      exerciseId: number;
      targetSets: number;
      targetReps: number;
      targetWeight: number;
      orderIndex: number;
    }>;
  }>;
}

export interface RecordWorkoutSetRequest {
  plannedExerciseId: number;
  setNumber: number;
  actualReps: number;
  actualWeight: number;
  notes?: string;
}

const getMondayIsoDate = (baseDate = new Date()): string => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysToMonday);
  return date.toISOString();
};

const isNotFound = (error: any): boolean => error?.response?.status === 404;

export const WorkoutPlanService = {
  getCurrentMondayIso: (): string => getMondayIsoDate(),

  getCurrentWeeklyPlan: async (): Promise<GetWeeklyPlanResponse | null> => {
    try {
      const response = await client.get('/workoutplans/current');
      return response.data;
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  },

  saveWeeklyPlan: async (payload: SaveWeeklyPlanRequest): Promise<GetWeeklyPlanResponse> => {
    const response = await client.post('/workoutplans', payload);
    return response.data;
  },

  getTodayPlan: async (): Promise<TodayPlanResponse> => {
    const response = await client.get('/workoutplans/today');
    return response.data;
  },

  recordWorkoutSet: async (payload: RecordWorkoutSetRequest): Promise<number> => {
    const response = await client.post('/workoutplans/sets', payload);
    return response.data?.workoutSetId;
  },
};