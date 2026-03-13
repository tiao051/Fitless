namespace Fitly.API.Models
{
    public class Food
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Brand { get; set; } // e.g., "Generic", "Goya", "KFC"
        public long? FdcId { get; set; } // FoodData Central ID
        public bool IsGeneric { get; set; } // True if generic/master food, false if branded
        
        // Nutrition per 100g
        public decimal CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; } // in grams
        public decimal CarbsPer100g { get; set; }
        public decimal FatPer100g { get; set; }
        public decimal FiberPer100g { get; set; } // in grams
        
        // Serving size info
        public decimal? ServingSize { get; set; } // numeric value (e.g., 56.33)
        public string? ServingUnit { get; set; } // unit (e.g., "g", "oz", "cup")
        public string? ServingText { get; set; } // human-readable (e.g., "2 oz", "1/2 cup")

        // Relations
        public ICollection<NutritionLog> NutritionLogs { get; set; } = new List<NutritionLog>();
    }
}
