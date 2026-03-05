namespace Fitly.API.Models
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string MuscleGroup { get; set; } = null!; // e.g., "Chest", "Back", "Legs", "Shoulders"

        // Relations
        public ICollection<WorkoutSet> WorkoutSets { get; set; } = new List<WorkoutSet>();
    }
}
