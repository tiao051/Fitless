using Fitly.API.DTOs;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service for managing weekly workout plans
    /// </summary>
    public interface IWorkoutPlanService
    {
        /// <summary>
        /// Save or update a weekly workout plan for a user
        /// </summary>
        Task<GetWeeklyPlanResponse> SaveWeeklyPlanAsync(int userId, SaveWeeklyPlanRequest request);

        /// <summary>
        /// Get the current or specified week's workout plan
        /// </summary>
        Task<GetWeeklyPlanResponse?> GetWeeklyPlanAsync(int userId, DateTime? startDate = null);

        /// <summary>
        /// Get today's workout plan for a user
        /// </summary>
        Task<TodayPlanResponse> GetTodayPlanAsync(int userId);

        /// <summary>
        /// Complete a set during a workout
        /// </summary>
        Task<int> RecordWorkoutSetAsync(int plannedExerciseId, int setNumber, int actualReps, decimal actualWeight);
    }
}
