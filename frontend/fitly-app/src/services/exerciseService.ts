import client from './apiClient';

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  bodySection: string;
  muscleGroup: string;
  equipment: string;
}

export interface CreateExercisePayload {
  name: string;
  bodySection: string;
  muscleGroup: string;
  equipment: string;
}

export const ExerciseService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    const response = await client.get('/exercises');
    return response.data;
  },

  createExercise: async (payload: CreateExercisePayload): Promise<Exercise> => {
    const response = await client.post('/exercises', payload);
    return response.data;
  },
};
