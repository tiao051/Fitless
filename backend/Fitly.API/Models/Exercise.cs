namespace Fitly.API.Models
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string BodySection { get; set; } = null!; // e.g., Upper, Lower, Core, Full Body
        public string MuscleGroup { get; set; } = null!; // e.g., "Chest", "Back", "Legs", "Shoulders"
        public string Equipment { get; set; } = null!; // e.g., Barbell, Dumbbells, Machine

        // Relations
        public ICollection<WorkoutSet> WorkoutSets { get; set; } = new List<WorkoutSet>();
    }
}
