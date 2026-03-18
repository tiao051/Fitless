using Microsoft.EntityFrameworkCore;
using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;

namespace Fitly.API.Services
{
    /// <summary>
    /// Service for managing exercises (CRUD operations).
    /// </summary>
    public class ExerciseService : IExerciseService
    {
        private readonly FitlyDbContext _context;

        public ExerciseService(FitlyDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all exercises from the database.
        /// </summary>
        public async Task<List<ExerciseResponse>> GetAllExercisesAsync()
        {
            return await _context.Exercises
                .Select(e => MapToResponse(e))
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves a single exercise by ID.
        /// </summary>
        public async Task<ExerciseResponse?> GetExerciseByIdAsync(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            return exercise == null ? null : MapToResponse(exercise);
        }

        /// <summary>
        /// Creates a new exercise in the database.
        /// </summary>
        public async Task<ExerciseResponse> CreateExerciseAsync(CreateExerciseRequest request)
        {
            var exercise = new Exercise
            {
                Name = request.Name,
                Description = request.Description,
                BodySection = request.BodySection,
                MuscleGroup = request.MuscleGroup,
                Equipment = request.Equipment
            };

            _context.Exercises.Add(exercise);
            await _context.SaveChangesAsync();

            return MapToResponse(exercise);
        }

        /// <summary>
        /// Updates an existing exercise.
        /// </summary>
        public async Task<ExerciseResponse?> UpdateExerciseAsync(int id, CreateExerciseRequest request)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null) return null;

            exercise.Name = request.Name;
            exercise.Description = request.Description;
            exercise.BodySection = request.BodySection;
            exercise.MuscleGroup = request.MuscleGroup;
            exercise.Equipment = request.Equipment;

            _context.Exercises.Update(exercise);
            await _context.SaveChangesAsync();

            return MapToResponse(exercise);
        }

        /// <summary>
        /// Deletes an exercise by ID.
        /// </summary>
        public async Task<bool> DeleteExerciseAsync(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null) return false;

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Maps Exercise entity to ExerciseResponse DTO.
        /// </summary>
        private static ExerciseResponse MapToResponse(Exercise exercise)
        {
            return new ExerciseResponse
            {
                Id = exercise.Id,
                Name = exercise.Name,
                Description = exercise.Description,
                BodySection = exercise.BodySection,
                MuscleGroup = exercise.MuscleGroup,
                Equipment = exercise.Equipment
            };
        }
    }
}
