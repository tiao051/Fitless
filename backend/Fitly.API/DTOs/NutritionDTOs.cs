namespace Fitly.API.DTOs
{
    /// <summary>
    /// Request DTO for logging a food/meal.
    /// </summary>
    public class CreateNutritionLogRequest
    {
        public int FoodId { get; set; }
        public decimal Quantity { get; set; } // in grams
        public string? Meal { get; set; } // e.g., "Breakfast", "Lunch"
        public DateTime LogDate { get; set; }
    }

    /// <summary>
    /// Response DTO for nutrition log entry with food details.
    /// </summary>
    public class NutritionLogResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public FoodResponse Food { get; set; } = null!;
        public decimal Quantity { get; set; }
        public string? Meal { get; set; }
        public DateTime LogDate { get; set; }
        public NutritionBreakdownResponse Nutrition { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Request DTO for creating or updating food in the database.
    /// </summary>
    public class CreateFoodRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; }
        public decimal CarbsPer100g { get; set; }
        public decimal FatPer100g { get; set; }
    }

    /// <summary>
    /// Response DTO for food data.
    /// </summary>
    public class FoodResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; }
        public decimal CarbsPer100g { get; set; }
        public decimal FatPer100g { get; set; }
    }

    /// <summary>
    /// Calculated nutrition breakdown for a logged meal quantity.
    /// </summary>
    public class NutritionBreakdownResponse
    {
        public decimal Calories { get; set; }
        public decimal Protein { get; set; }
        public decimal Carbs { get; set; }
        public decimal Fat { get; set; }
    }

    /// <summary>
    /// Daily nutrition summary.
    /// </summary>
    public class DailyNutritionSummaryResponse
    {
        public DateTime Date { get; set; }
        public decimal TotalCalories { get; set; }
        public decimal TotalProtein { get; set; }
        public decimal TotalCarbs { get; set; }
        public decimal TotalFat { get; set; }
        public List<NutritionLogResponse> Meals { get; set; } = new();
    }
}
