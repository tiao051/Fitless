namespace Fitly.API.DTOs
{
    /// <summary>
    /// Request DTO for creating or updating an exercise.
    /// </summary>
    public class CreateExerciseRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string MuscleGroup { get; set; } = null!;
    }

    /// <summary>
    /// Response DTO for exercise data.
    /// </summary>
    public class ExerciseResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string MuscleGroup { get; set; } = null!;
    }
}
