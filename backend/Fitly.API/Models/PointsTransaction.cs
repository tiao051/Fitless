namespace Fitly.API.Models;

public class PointsTransaction
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    
    public string TransactionType { get; set; } = null!; // "WorkoutCompleted", "NutritionTarget", "StreakBonus", "PersonalRecord", "CosmeticPurchase"
    public int Points { get; set; }
    public string? Description { get; set; }
    public string? RelatedEntityId { get; set; } // e.g., CosmeticItem.Id for purchases
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Relations
    public Chibi Chibi { get; set; } = null!;
}
