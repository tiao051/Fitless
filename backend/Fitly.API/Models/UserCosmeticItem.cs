namespace Fitly.API.Models;

public class UserCosmeticItem
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    public string CosmeticItemId { get; set; } = null!;
    
    public bool IsEquipped { get; set; } = false;
    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;
    
    // Relations
    public Chibi Chibi { get; set; } = null!;
    public CosmeticItem CosmeticItem { get; set; } = null!;
}
