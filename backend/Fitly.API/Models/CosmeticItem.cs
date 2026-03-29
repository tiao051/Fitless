namespace Fitly.API.Models;

public class CosmeticItem
{
    public string Id { get; set; } = null!; // e.g., "outfit_gym_black", "hair_blue"
    
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Category { get; set; } = null!; // "Outfit", "Accessory", "AuraEffect", "HairColor", "SkinTone"
    public string? ImageUrl { get; set; }
    
    public int CostPoints { get; set; } // 200-500 range
    public bool IsDefault { get; set; } = false; // All users start with default items
    
    public string? Rarity { get; set; } = "Common"; // Common, Uncommon, Rare, Epic, Legendary
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Relations
    public ICollection<UserCosmeticItem> UserOwners { get; set; } = new List<UserCosmeticItem>();
}
