namespace Fitly.API.Models
{
    /// <summary>
    /// Represents a weekly workout plan for a user.
    /// </summary>
    public class WorkoutPlan
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime StartDate { get; set; } // Monday of the week
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Relations
        public User User { get; set; } = null!;
        public ICollection<DayPlan> DayPlans { get; set; } = new List<DayPlan>();
    }

    /// <summary>
    /// Represents a single day's workout plan within a weekly plan.
    /// </summary>
    public class DayPlan
    {
        public int Id { get; set; }
        public int WorkoutPlanId { get; set; }
        public int DayOfWeek { get; set; } // 0 = Monday, 6 = Sunday
        public bool IsRestDay { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public WorkoutPlan WorkoutPlan { get; set; } = null!;
        public ICollection<PlannedExercise> PlannedExercises { get; set; } = new List<PlannedExercise>();
    }

    /// <summary>
    /// Represents an exercise planned for a specific day with target sets/reps/weight.
    /// </summary>
    public class PlannedExercise
    {
        public int Id { get; set; }
        public int DayPlanId { get; set; }
        public int ExerciseId { get; set; }
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
        public decimal TargetWeight { get; set; } // in kg
        public int OrderIndex { get; set; } // Order of exercise in the day
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public DayPlan DayPlan { get; set; } = null!;
        public Exercise Exercise { get; set; } = null!;
    }
}
