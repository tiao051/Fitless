namespace Fitly.API.Models
{
    /// <summary>
    /// Represents a set within a completed workout, tracking actual performance.
    /// </summary>
    public class WorkoutSet
    {
        public int Id { get; set; }
        public int WorkoutId { get; set; }
        public int ExerciseId { get; set; }
        
        // Actual completed values
        public int ActualReps { get; set; }
        public decimal ActualWeight { get; set; } // in kg
        
        // Target values (optional, can be populated from plan)
        public int? TargetReps { get; set; }
        public decimal? TargetWeight { get; set; }
        
        public int SetNumber { get; set; } // 1st set, 2nd set, etc.
        public bool IsCompleted { get; set; }
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public Workout Workout { get; set; } = null!;
        public Exercise Exercise { get; set; } = null!;
    }
}

