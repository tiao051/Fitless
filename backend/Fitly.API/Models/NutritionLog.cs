namespace Fitly.API.Models
{
    public class NutritionLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int FoodId { get; set; }
        public decimal Quantity { get; set; } // in grams
        public DateTime LogDate { get; set; }
        public string? Meal { get; set; } // "Breakfast", "Lunch", "Dinner", "Snack"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public User User { get; set; } = null!;
        public Food Food { get; set; } = null!;
    }
}
