using Microsoft.EntityFrameworkCore;
using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service for managing workouts and workout sets.
    /// </summary>
    public class WorkoutService : IWorkoutService
    {
        private readonly FitlyDbContext _context;

        public WorkoutService(FitlyDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new workout with its associated sets.
        /// </summary>
        public async Task<WorkoutResponse> CreateWorkoutAsync(int userId, CreateWorkoutRequest request)
        {
            var workout = new Workout
            {
                UserId = userId,
                Name = request.Name,
                WorkoutDate = DateTime.UtcNow,
                DurationMinutes = request.DurationMinutes,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Workouts.Add(workout);
            await _context.SaveChangesAsync();

            // Add workout sets
            int setNumber = 1;
            foreach (var setRequest in request.Sets)
            {
                var exercise = await _context.Exercises.FindAsync(setRequest.ExerciseId);
                if (exercise == null)
                    throw new InvalidOperationException($"Exercise with ID {setRequest.ExerciseId} not found.");

                var set = new WorkoutSet
                {
                    WorkoutId = workout.Id,
                    ExerciseId = setRequest.ExerciseId,
                    ActualReps = setRequest.Reps,
                    ActualWeight = setRequest.Weight,
                    SetNumber = setNumber++,
                    IsCompleted = true
                };

                _context.WorkoutSets.Add(set);
            }

            await _context.SaveChangesAsync();

            return await MapToResponseAsync(workout);
        }

        /// <summary>
        /// Retrieves a specific workout with all its sets.
        /// </summary>
        public async Task<WorkoutResponse?> GetWorkoutByIdAsync(int id)
        {
            var workout = await _context.Workouts
                .Include(w => w.Sets)
                .ThenInclude(s => s.Exercise)
                .FirstOrDefaultAsync(w => w.Id == id);

            return workout == null ? null : await MapToResponseAsync(workout);
        }

        /// <summary>
        /// Retrieves all workouts for a specific user.
        /// </summary>
        public async Task<List<WorkoutResponse>> GetUserWorkoutsAsync(int userId)
        {
            var workouts = await _context.Workouts
                .Where(w => w.UserId == userId)
                .Include(w => w.Sets)
                .ThenInclude(s => s.Exercise)
                .OrderByDescending(w => w.WorkoutDate)
                .ToListAsync();

            var responses = new List<WorkoutResponse>();
            foreach (var workout in workouts)
            {
                responses.Add(await MapToResponseAsync(workout));
            }

            return responses;
        }

        /// <summary>
        /// Retrieves user workouts within a date range.
        /// </summary>
        public async Task<List<WorkoutResponse>> GetUserWorkoutsAsync(int userId, DateTime startDate, DateTime endDate)
        {
            var workouts = await _context.Workouts
                .Where(w => w.UserId == userId && w.WorkoutDate >= startDate && w.WorkoutDate <= endDate)
                .Include(w => w.Sets)
                .ThenInclude(s => s.Exercise)
                .OrderByDescending(w => w.WorkoutDate)
                .ToListAsync();

            var responses = new List<WorkoutResponse>();
            foreach (var workout in workouts)
            {
                responses.Add(await MapToResponseAsync(workout));
            }

            return responses;
        }

        /// <summary>
        /// Deletes a workout and all associated sets.
        /// </summary>
        public async Task<bool> DeleteWorkoutAsync(int id)
        {
            var workout = await _context.Workouts.FindAsync(id);
            if (workout == null) return false;

            _context.Workouts.Remove(workout);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Maps Workout entity to WorkoutResponse DTO with all sets and exercise details.
        /// </summary>
        private async Task<WorkoutResponse> MapToResponseAsync(Workout workout)
        {
            // Ensure sets and exercises are loaded
            await _context.Entry(workout).Collection(w => w.Sets).LoadAsync();

            var response = new WorkoutResponse
            {
                Id = workout.Id,
                UserId = workout.UserId,
                Name = workout.Name,
                WorkoutDate = workout.WorkoutDate,
                DurationMinutes = workout.DurationMinutes,
                Notes = workout.Notes,
                CreatedAt = workout.CreatedAt,
                Sets = new List<WorkoutSetResponse>()
            };

            foreach (var set in workout.Sets.OrderBy(s => s.SetNumber))
            {
                var exercise = await _context.Exercises.FindAsync(set.ExerciseId);
                if (exercise != null)
                {
                    response.Sets.Add(new WorkoutSetResponse
                    {
                        Id = set.Id,
                        SetNumber = set.SetNumber,
                        Exercise = new ExerciseResponse
                        {
                            Id = exercise.Id,
                            Name = exercise.Name,
                            Description = exercise.Description,
                            MuscleGroup = exercise.MuscleGroup
                        },
                        Reps = set.ActualReps,
                        Weight = set.ActualWeight
                    });
                }
            }

            return response;
        }
    }
}
