import client from './apiClient';

export interface WorkoutSetItem {
  exerciseId: number;
  reps: number;
  weight: number;
}

export interface CreateWorkoutPayload {
  name: string;
  durationMinutes?: number;
  notes?: string;
  sets: WorkoutSetItem[];
}

export interface WorkoutResponse {
  id: number;
  userId: number;
  name: string;
  workoutDate: string;
  durationMinutes: number | null;
  notes: string | null;
  sets: Array<{
    id: number;
    setNumber: number;
    reps: number;
    weight: number;
    exercise: {
      id: number;
      name: string;
    };
  }>;
  createdAt: string;
}

export const WorkoutService = {
  createWorkout: async (userId: number, payload: CreateWorkoutPayload): Promise<WorkoutResponse> => {
    const response = await client.post(`/users/${userId}/workouts`, payload);
    return response.data;
  },

  getUserWorkoutsByDateRange: async (
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<WorkoutResponse[]> => {
    const response = await client.get(`/users/${userId}/workouts/range`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  deleteWorkout: async (userId: number, workoutId: number): Promise<void> => {
    await client.delete(`/users/${userId}/workouts/${workoutId}`);
  },
};