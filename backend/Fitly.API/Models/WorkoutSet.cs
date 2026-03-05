namespace Fitly.API.Models
{
    public class WorkoutSet
    {
        public int Id { get; set; }
        public int WorkoutId { get; set; }
        public int ExerciseId { get; set; }
        public int Reps { get; set; }
        public decimal Weight { get; set; } // in kg
        public int SetNumber { get; set; } // 1st set, 2nd set, etc.
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public Workout Workout { get; set; } = null!;
        public Exercise Exercise { get; set; } = null!;
    }
}
