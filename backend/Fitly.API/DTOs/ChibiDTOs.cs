namespace Fitly.API.DTOs;

using System.ComponentModel.DataAnnotations;

// Get Chibi Response - Full chibi state
public class ChibiResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    
    // Body layer
    public int ShoulderWidth { get; set; }
    public int CoreDefinition { get; set; }
    public int WaistSize { get; set; }
    public int LegMuscle { get; set; }
    public int ArmMuscle { get; set; }
    public DateTime LastBodyUpdateAt { get; set; }
    
    // Cosmetics equipped
    public string? OutfitItemId { get; set; }
    public string? AccessoryItemId { get; set; }
    public string? AuraEffectId { get; set; }
    public string? HairColorId { get; set; }
    public string? SkinToneId { get; set; }
    
    // Cosmetic details (if needed by frontend)
    public CosmeticItemResponse? EquippedOutfit { get; set; }
    public CosmeticItemResponse? EquippedAccessory { get; set; }
    public CosmeticItemResponse? EquippedAura { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Create Initial Chibi (during onboarding)
public class GenerateChibiRequest
{
    [Range(0, 100, ErrorMessage = "ShoulderWidth must be between 0 and 100")]
    public int ShoulderWidth { get; set; } = 50;
    
    [Range(0, 100, ErrorMessage = "CoreDefinition must be between 0 and 100")]
    public int CoreDefinition { get; set; } = 50;
    
    [Range(0, 100, ErrorMessage = "WaistSize must be between 0 and 100")]
    public int WaistSize { get; set; } = 50;
    
    [Range(0, 100, ErrorMessage = "LegMuscle must be between 0 and 100")]
    public int LegMuscle { get; set; } = 50;
    
    [Range(0, 100, ErrorMessage = "ArmMuscle must be between 0 and 100")]
    public int ArmMuscle { get; set; } = 50;
}

// Update Chibi Appearance (equip cosmetics)
public class UpdateChibiAppearanceRequest
{
    [StringLength(100)]
    public string? OutfitItemId { get; set; }
    
    [StringLength(100)]
    public string? AccessoryItemId { get; set; }
    
    [StringLength(100)]
    public string? AuraEffectId { get; set; }
    
    [StringLength(100)]
    public string? HairColorId { get; set; }
    
    [StringLength(100)]
    public string? SkinToneId { get; set; }
}

// Points Balance Response
public class PointsBalanceResponse
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    public int Balance { get; set; }
    public int TotalEarned { get; set; }
    public int TotalSpent { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Points Transaction Response
public class PointsTransactionResponse
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    public string TransactionType { get; set; } = null!;
    public int Points { get; set; }
    public string? Description { get; set; }
    public string? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Cosmetic Item Response
public class CosmeticItemResponse
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Category { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int CostPoints { get; set; }
    public bool IsDefault { get; set; }
    public string? Rarity { get; set; }
    public DateTime CreatedAt { get; set; }
}

// User's owned cosmetics response
public class UserCosmeticItemResponse
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    public CosmeticItemResponse CosmeticItem { get; set; } = null!;
    public bool IsEquipped { get; set; }
    public DateTime AcquiredAt { get; set; }
}

// List user's owned cosmetics by category
public class CosmeticShopResponse
{
    public List<CosmeticItemResponse> AvailableItems { get; set; } = new();
    public List<UserCosmeticItemResponse> OwnedItems { get; set; } = new();
    public PointsBalanceResponse CurrentBalance { get; set; } = null!;
}

// Purchase cosmetic request
public class PurchaseCosmeticRequest
{
    [Required(ErrorMessage = "CosmeticItemId is required")]
    [StringLength(100, ErrorMessage = "CosmeticItemId must not exceed 100 characters")]
    public string CosmeticItemId { get; set; } = null!;
}

// Purchase cosmetic response
public class PurchaseCosmeticResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public UserCosmeticItemResponse? NewItem { get; set; }
    public PointsBalanceResponse? UpdatedBalance { get; set; }
    public PointsTransactionResponse? Transaction { get; set; }
}
