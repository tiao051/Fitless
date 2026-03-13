using Fitly.API.DTOs;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service interface for managing nutrition logs and food database.
    /// </summary>
    public interface INutritionService
    {
        // Food management
        Task<FoodResponse> CreateFoodAsync(CreateFoodRequest request);
        Task<FoodResponse?> GetFoodByIdAsync(int id);
        Task<List<FoodResponse>> GetAllFoodsAsync();
        Task<List<FoodResponse>> SearchFoodsAsync(string name);

        // Nutrition logging
        Task<NutritionLogResponse> LogNutritionAsync(int userId, CreateNutritionLogRequest request);
        Task<List<NutritionLogResponse>> GetUserNutritionLogsAsync(int userId);
        Task<DailyNutritionSummaryResponse> GetDailyNutritionSummaryAsync(int userId, DateTime date);
        Task<bool> DeleteNutritionLogAsync(int id);

        // Meal calculation
        Task<MealNutritionResponse> CalculateMealNutritionAsync(CalculateMealNutritionRequest request);
    }
}
