namespace Fitly.API.DTOs
{
    /// <summary>
    /// Request DTO for creating a new workout.
    /// </summary>
    public class CreateWorkoutRequest
    {
        public string Name { get; set; } = null!;
        public int? DurationMinutes { get; set; }
        public string? Notes { get; set; }
        public List<CreateWorkoutSetRequest> Sets { get; set; } = new();
    }

    /// <summary>
    /// Request DTO for a single set within a workout.
    /// </summary>
    public class CreateWorkoutSetRequest
    {
        public int ExerciseId { get; set; }
        public int Reps { get; set; }
        public decimal Weight { get; set; } // in kg
    }

    /// <summary>
    /// Response DTO for workout data including all sets.
    /// </summary>
    public class WorkoutResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public DateTime WorkoutDate { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Notes { get; set; }
        public List<WorkoutSetResponse> Sets { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for a single workout set with exercise details.
    /// </summary>
    public class WorkoutSetResponse
    {
        public int Id { get; set; }
        public int SetNumber { get; set; }
        public ExerciseResponse Exercise { get; set; } = null!;
        public int Reps { get; set; }
        public decimal Weight { get; set; }
    }
}
