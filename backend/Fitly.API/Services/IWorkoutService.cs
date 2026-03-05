using Fitly.API.DTOs;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service interface for managing workouts.
    /// </summary>
    public interface IWorkoutService
    {
        Task<WorkoutResponse> CreateWorkoutAsync(int userId, CreateWorkoutRequest request);
        Task<WorkoutResponse?> GetWorkoutByIdAsync(int id);
        Task<List<WorkoutResponse>> GetUserWorkoutsAsync(int userId);
        Task<List<WorkoutResponse>> GetUserWorkoutsAsync(int userId, DateTime startDate, DateTime endDate);
        Task<bool> DeleteWorkoutAsync(int id);
    }
}
