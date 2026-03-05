using Fitly.API.DTOs;
using Fitly.API.Models;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service interface for managing exercises.
    /// </summary>
    public interface IExerciseService
    {
        Task<List<ExerciseResponse>> GetAllExercisesAsync();
        Task<ExerciseResponse?> GetExerciseByIdAsync(int id);
        Task<ExerciseResponse> CreateExerciseAsync(CreateExerciseRequest request);
        Task<ExerciseResponse?> UpdateExerciseAsync(int id, CreateExerciseRequest request);
        Task<bool> DeleteExerciseAsync(int id);
    }
}
