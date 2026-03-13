using Microsoft.EntityFrameworkCore;
using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service for managing nutrition logs and food database.
    /// </summary>
    public class NutritionService : INutritionService
    {
        private readonly FitlyDbContext _context;

        public NutritionService(FitlyDbContext context)
        {
            _context = context;
        }

        #region Food Management

        /// <summary>
        /// Creates a new food entry in the food database.
        /// </summary>
        public async Task<FoodResponse> CreateFoodAsync(CreateFoodRequest request)
        {
            var food = new Food
            {
                Name = request.Name,
                Brand = request.Brand,
                FdcId = request.FdcId,
                IsGeneric = request.IsGeneric,
                CaloriesPer100g = request.CaloriesPer100g,
                ProteinPer100g = request.ProteinPer100g,
                CarbsPer100g = request.CarbsPer100g,
                FatPer100g = request.FatPer100g,
                FiberPer100g = request.FiberPer100g,
                ServingSize = request.ServingSize,
                ServingUnit = request.ServingUnit,
                ServingText = request.ServingText
            };

            _context.Foods.Add(food);
            await _context.SaveChangesAsync();

            return MapFoodToResponse(food);
        }

        /// <summary>
        /// Retrieves a specific food by ID.
        /// </summary>
        public async Task<FoodResponse?> GetFoodByIdAsync(int id)
        {
            var food = await _context.Foods.FindAsync(id);
            return food == null ? null : MapFoodToResponse(food);
        }

        /// <summary>
        /// Retrieves all foods in the database.
        /// </summary>
        public async Task<List<FoodResponse>> GetAllFoodsAsync()
        {
            return await _context.Foods
                .Select(f => MapFoodToResponse(f))
                .ToListAsync();
        }

        /// <summary>
        /// Searches foods by name (case-insensitive).
        /// </summary>
        public async Task<List<FoodResponse>> SearchFoodsAsync(string name)
        {
            return await _context.Foods
                .Where(f => f.Name.ToLower().Contains(name.ToLower()))
                .Select(f => MapFoodToResponse(f))
                .ToListAsync();
        }

        #endregion

        #region Nutrition Logging

        /// <summary>
        /// Logs a nutrition entry for a user.
        /// </summary>
        public async Task<NutritionLogResponse> LogNutritionAsync(int userId, CreateNutritionLogRequest request)
        {
            var food = await _context.Foods.FindAsync(request.FoodId);
            if (food == null)
                throw new InvalidOperationException($"Food with ID {request.FoodId} not found.");

            var nutritionLog = new NutritionLog
            {
                UserId = userId,
                FoodId = request.FoodId,
                Quantity = request.Quantity,
                Meal = request.Meal,
                LogDate = request.LogDate,
                CreatedAt = DateTime.UtcNow
            };

            _context.NutritionLogs.Add(nutritionLog);
            await _context.SaveChangesAsync();

            return MapNutritionLogToResponse(nutritionLog, food);
        }

        /// <summary>
        /// Retrieves all nutrition logs for a user.
        /// </summary>
        public async Task<List<NutritionLogResponse>> GetUserNutritionLogsAsync(int userId)
        {
            var logs = await _context.NutritionLogs
                .Where(n => n.UserId == userId)
                .Include(n => n.Food)
                .OrderByDescending(n => n.LogDate)
                .ToListAsync();

            return logs.Select(log => MapNutritionLogToResponse(log, log.Food)).ToList();
        }

        /// <summary>
        /// Retrieves daily nutrition summary for a specific date.
        /// </summary>
        public async Task<DailyNutritionSummaryResponse> GetDailyNutritionSummaryAsync(int userId, DateTime date)
        {
            // Normalize date to start of day
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

            var logs = await _context.NutritionLogs
                .Where(n => n.UserId == userId && n.LogDate >= startOfDay && n.LogDate <= endOfDay)
                .Include(n => n.Food)
                .OrderBy(n => n.LogDate)
                .ToListAsync();

            var summary = new DailyNutritionSummaryResponse
            {
                Date = startOfDay,
                Meals = new List<NutritionLogResponse>()
            };

            decimal totalCalories = 0;
            decimal totalProtein = 0;
            decimal totalCarbs = 0;
            decimal totalFat = 0;

            foreach (var log in logs)
            {
                var response = MapNutritionLogToResponse(log, log.Food);
                summary.Meals.Add(response);

                // Accumulate totals
                totalCalories += response.Nutrition.Calories;
                totalProtein += response.Nutrition.Protein;
                totalCarbs += response.Nutrition.Carbs;
                totalFat += response.Nutrition.Fat;
            }

            summary.TotalCalories = totalCalories;
            summary.TotalProtein = totalProtein;
            summary.TotalCarbs = totalCarbs;
            summary.TotalFat = totalFat;

            return summary;
        }

        /// <summary>
        /// Deletes a nutrition log entry.
        /// </summary>
        public async Task<bool> DeleteNutritionLogAsync(int id)
        {
            var log = await _context.NutritionLogs.FindAsync(id);
            if (log == null) return false;

            _context.NutritionLogs.Remove(log);
            await _context.SaveChangesAsync();

            return true;
        }

        #endregion

        #region Private Helpers

        /// <summary>
        /// Maps Food entity to FoodResponse DTO.
        /// </summary>
        private static FoodResponse MapFoodToResponse(Food food)
        {
            return new FoodResponse
            {
                Id = food.Id,
                Name = food.Name,
                Brand = food.Brand,
                FdcId = food.FdcId,
                IsGeneric = food.IsGeneric,
                CaloriesPer100g = food.CaloriesPer100g,
                ProteinPer100g = food.ProteinPer100g,
                CarbsPer100g = food.CarbsPer100g,
                FatPer100g = food.FatPer100g,
                FiberPer100g = food.FiberPer100g,
                ServingSize = food.ServingSize,
                ServingUnit = food.ServingUnit,
                ServingText = food.ServingText
            };
        }

        /// <summary>
        /// Maps NutritionLog entity to NutritionLogResponse DTO with calculated nutrition breakdown.
        /// </summary>
        private static NutritionLogResponse MapNutritionLogToResponse(NutritionLog log, Food food)
        {
            // Calculate actual nutrition for the logged quantity
            var nutritionBreakdown = CalculateNutritionBreakdown(food, log.Quantity);

            return new NutritionLogResponse
            {
                Id = log.Id,
                UserId = log.UserId,
                Food = MapFoodToResponse(food),
                Quantity = log.Quantity,
                Meal = log.Meal,
                LogDate = log.LogDate,
                Nutrition = nutritionBreakdown,
                CreatedAt = log.CreatedAt
            };
        }

        /// <summary>
        /// Calculates nutrition values for a given quantity of food.
        /// </summary>
        private static NutritionBreakdownResponse CalculateNutritionBreakdown(Food food, decimal quantity)
        {
            // Scale macros to the logged quantity (default macros are per 100g)
            var scale = quantity / 100m;

            return new NutritionBreakdownResponse
            {
                Calories = food.CaloriesPer100g * scale,
                Protein = food.ProteinPer100g * scale,
                Carbs = food.CarbsPer100g * scale,
                Fat = food.FatPer100g * scale
            };
        }

        /// <summary>
        /// Calculates total nutrition for a meal consisting of multiple food items.
        /// </summary>
        public async Task<MealNutritionResponse> CalculateMealNutritionAsync(CalculateMealNutritionRequest request)
        {
            var response = new MealNutritionResponse();
            var totalNutrition = new NutritionBreakdownResponse();

            foreach (var item in request.Items)
            {
                var food = await _context.Foods.FindAsync(item.FoodId);
                if (food == null)
                    throw new InvalidOperationException($"Food with ID {item.FoodId} not found.");

                var nutritionBreakdown = CalculateNutritionBreakdown(food, item.Quantity);
                
                response.Items.Add(new FoodPortionResponse
                {
                    FoodId = food.Id,
                    FoodName = food.Name,
                    Quantity = item.Quantity,
                    Nutrition = nutritionBreakdown
                });

                // Accumulate totals
                totalNutrition.Calories += nutritionBreakdown.Calories;
                totalNutrition.Protein += nutritionBreakdown.Protein;
                totalNutrition.Carbs += nutritionBreakdown.Carbs;
                totalNutrition.Fat += nutritionBreakdown.Fat;
            }

            response.TotalNutrition = totalNutrition;
            return response;
        }

        #endregion
    }
}
