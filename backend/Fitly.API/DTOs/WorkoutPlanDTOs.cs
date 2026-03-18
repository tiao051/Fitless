namespace Fitly.API.DTOs
{
    /// <summary>
    /// Request to save a weekly workout plan
    /// </summary>
    public class SaveWeeklyPlanRequest
    {
        public DateTime StartDate { get; set; } // Monday of the week
        public List<DayPlanDTO> DayPlans { get; set; } = new();
    }

    /// <summary>
    /// DTO for a day plan
    /// </summary>
    public class DayPlanDTO
    {
        public int DayOfWeek { get; set; } // 0 = Monday, 6 = Sunday
        public bool IsRestDay { get; set; }
        public List<PlannedExerciseDTO> PlannedExercises { get; set; } = new();
    }

    /// <summary>
    /// DTO for a planned exercise
    /// </summary>
    public class PlannedExerciseDTO
    {
        public int ExerciseId { get; set; }
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
        public decimal TargetWeight { get; set; }
        public int OrderIndex { get; set; }
    }

    /// <summary>
    /// Response containing the weekly workout plan
    /// </summary>
    public class GetWeeklyPlanResponse
    {
        public int WorkoutPlanId { get; set; }
        public DateTime StartDate { get; set; }
        public List<DayPlanResponse> DayPlans { get; set; } = new();
    }

    /// <summary>
    /// Response for a day plan with exercise details
    /// </summary>
    public class DayPlanResponse
    {
        public int DayOfWeek { get; set; }
        public bool IsRestDay { get; set; }
        public List<PlannedExerciseResponse> PlannedExercises { get; set; } = new();
    }

    /// <summary>
    /// Response for a planned exercise with exercise details
    /// </summary>
    public class PlannedExerciseResponse
    {
        public int PlannedExerciseId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = null!;
        public string MuscleGroup { get; set; } = null!;
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
        public decimal TargetWeight { get; set; }
        public int OrderIndex { get; set; }
    }

    /// <summary>
    /// Response for today's workout plan
    /// </summary>
    public class TodayPlanResponse
    {
        public bool IsRestDay { get; set; }
        public DateTime Date { get; set; }
        public List<PlannedExerciseResponse> PlannedExercises { get; set; } = new();
    }
}
