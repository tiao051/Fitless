import client from './apiClient';

export interface Food {
  id: number;
  name: string;
  brand: string | null;
  isGeneric: boolean;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSize: number | null;
  servingUnit: string | null;
  servingText: string | null;
}

export interface NutritionBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionLog {
  id: number;
  userId: number;
  food: Food;
  quantity: number;
  meal: string;
  logDate: string;
  nutrition: NutritionBreakdown;
  createdAt: string;
}

export interface DailyNutritionSummary {
  date: string;
  meals: NutritionLog[];
  totalNutrition: NutritionBreakdown;
}

export interface MealNutritionResponse {
  items: Array<{
    foodId: number;
    foodName: string;
    quantity: number;
    nutrition: NutritionBreakdown;
  }>;
  totalNutrition: NutritionBreakdown;
}

export const NutritionService = {
  // Food Management
  getAllFoods: async (): Promise<Food[]> => {
    const response = await client.get('/nutrition/foods');
    return response.data;
  },

  searchFoods: async (name: string): Promise<Food[]> => {
    const response = await client.get('/nutrition/foods/search', {
      params: { name },
    });
    return response.data;
  },

  getFoodById: async (id: number): Promise<Food> => {
    const response = await client.get(`/nutrition/foods/${id}`);
    return response.data;
  },

  // Nutrition Logging
  logNutrition: async (
    userId: number,
    foodId: number,
    quantity: number,
    meal: string,
    logDate: string
  ): Promise<NutritionLog> => {
    const response = await client.post(`/nutrition/logs/${userId}`, {
      foodId,
      quantity,
      meal,
      logDate,
    });
    return response.data;
  },

  getUserNutritionLogs: async (userId: number): Promise<NutritionLog[]> => {
    const response = await client.get(`/nutrition/logs/${userId}`);
    return response.data;
  },

  getDailySummary: async (userId: number, date: string): Promise<DailyNutritionSummary> => {
    const response = await client.get(`/nutrition/summary/${userId}`, {
      params: { date },
    });
    return response.data;
  },

  deleteNutritionLog: async (logId: number): Promise<void> => {
    await client.delete(`/nutrition/logs/${logId}`);
  },

  // Meal Calculation
  calculateMealNutrition: async (
    items: Array<{ foodId: number; quantity: number }>
  ): Promise<MealNutritionResponse> => {
    const response = await client.post('/nutrition/calculate-meal', { items });
    return response.data;
  },
};
