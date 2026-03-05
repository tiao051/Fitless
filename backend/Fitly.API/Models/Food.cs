namespace Fitly.API.Models
{
    public class Food
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; } // in grams
        public decimal CarbsPer100g { get; set; }
        public decimal FatPer100g { get; set; }

        // Relations
        public ICollection<NutritionLog> NutritionLogs { get; set; } = new List<NutritionLog>();
    }
}
