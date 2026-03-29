namespace Fitly.API.Models;

public class PointsBalance
{
    public int Id { get; set; }
    public int ChibiId { get; set; }
    public int Balance { get; set; } = 0;
    public int TotalEarned { get; set; } = 0;
    public int TotalSpent { get; set; } = 0;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relations
    public Chibi Chibi { get; set; } = null!;
}
