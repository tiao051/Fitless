namespace Fitly.API.Models
{
    public class Workout
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = null!; // e.g., "Chest Day", "Cardio Session"
        public DateTime WorkoutDate { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public User User { get; set; } = null!;
        public ICollection<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();
    }
}
