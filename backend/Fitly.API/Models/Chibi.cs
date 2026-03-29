namespace Fitly.API.Models;

public class Chibi
{
    public int Id { get; set; }
    public int UserId { get; set; }
    
    // Body layer - auto-evolves based on fitness data
    public int ShoulderWidth { get; set; } = 50; // 0-100 scale
    public int CoreDefinition { get; set; } = 50;
    public int WaistSize { get; set; } = 50;
    public int LegMuscle { get; set; } = 50;
    public int ArmMuscle { get; set; } = 50;
    
    // When body layer was last updated
    public DateTime LastBodyUpdateAt { get; set; } = DateTime.UtcNow;
    
    // Cosmetics owned by user (selected)
    public string? OutfitItemId { get; set; }
    public string? AccessoryItemId { get; set; }
    public string? AuraEffectId { get; set; }
    public string? HairColorId { get; set; }
    public string? SkinToneId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relations
    public User User { get; set; } = null!;
    public PointsBalance? PointsBalance { get; set; }
    public ICollection<UserCosmeticItem> OwnedCosmetics { get; set; } = new List<UserCosmeticItem>();
    public ICollection<PointsTransaction> PointsTransactions { get; set; } = new List<PointsTransaction>();
}
