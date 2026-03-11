using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;
using Fitly.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Fitly.API.Tests.Services
{
    public class ExerciseServiceTests
    {
        private readonly FitlyDbContext _dbContext;
        private readonly ExerciseService _exerciseService;

        public ExerciseServiceTests()
        {
            var options = new DbContextOptionsBuilder<FitlyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new FitlyDbContext(options);
            _exerciseService = new ExerciseService(_dbContext);
        }

        [Fact]
        public async Task GetAllExercisesAsync_WithNoExercises_ReturnsEmptyList()
        {
            // Act
            var result = await _exerciseService.GetAllExercisesAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllExercisesAsync_WithExercises_ReturnsAllExercises()
        {
            // Arrange
            var exercises = new List<Exercise>
            {
                new Exercise { Id = 1, Name = "Bench Press", MuscleGroup = "Chest", Description = "Push movement" },
                new Exercise { Id = 2, Name = "Squats", MuscleGroup = "Legs", Description = "Leg compound" },
                new Exercise { Id = 3, Name = "Deadlifts", MuscleGroup = "Back", Description = "Back compound" }
            };

            await _dbContext.Exercises.AddRangeAsync(exercises);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _exerciseService.GetAllExercisesAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Contains(result, e => e.Name == "Bench Press");
            Assert.Contains(result, e => e.Name == "Squats");
        }

        [Fact]
        public async Task GetExerciseByIdAsync_WithValidId_ReturnsExercise()
        {
            // Arrange
            var exercise = new Exercise
            {
                Id = 1,
                Name = "Bench Press",
                MuscleGroup = "Chest",
                Description = "Push movement"
            };

            await _dbContext.Exercises.AddAsync(exercise);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _exerciseService.GetExerciseByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Bench Press", result.Name);
            Assert.Equal("Chest", result.MuscleGroup);
        }

        [Fact]
        public async Task GetExerciseByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _exerciseService.GetExerciseByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateExerciseAsync_WithValidRequest_CreatesAndReturnsExercise()
        {
            // Arrange
            var request = new CreateExerciseRequest
            {
                Name = "Squat",
                MuscleGroup = "Legs",
                Description = "Compound leg movement"
            };

            // Act
            var result = await _exerciseService.CreateExerciseAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Squat", result.Name);
            Assert.Equal("Legs", result.MuscleGroup);
            Assert.NotEqual(0, result.Id);

            // Verify it was saved to the database
            var savedExercise = await _dbContext.Exercises.FindAsync(result.Id);
            Assert.NotNull(savedExercise);
        }

        [Fact]
        public async Task UpdateExerciseAsync_WithValidId_UpdatesExercise()
        {
            // Arrange
            var exercise = new Exercise
            {
                Id = 1,
                Name = "Old Name",
                MuscleGroup = "Chest"
            };

            await _dbContext.Exercises.AddAsync(exercise);
            await _dbContext.SaveChangesAsync();

            var updateRequest = new CreateExerciseRequest
            {
                Name = "New Name",
                MuscleGroup = "Back",
                Description = "Updated description"
            };

            // Act
            var result = await _exerciseService.UpdateExerciseAsync(1, updateRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            Assert.Equal("Back", result.MuscleGroup);
        }

        [Fact]
        public async Task UpdateExerciseAsync_WithInvalidId_ReturnsNull()
        {
            // Arrange
            var updateRequest = new CreateExerciseRequest
            {
                Name = "New Name",
                MuscleGroup = "Chest"
            };

            // Act
            var result = await _exerciseService.UpdateExerciseAsync(999, updateRequest);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteExerciseAsync_WithValidId_DeletesExercise()
        {
            // Arrange
            var exercise = new Exercise
            {
                Id = 1,
                Name = "Bench Press",
                MuscleGroup = "Chest"
            };

            await _dbContext.Exercises.AddAsync(exercise);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _exerciseService.DeleteExerciseAsync(1);

            // Assert
            Assert.True(result);
            var deletedExercise = await _dbContext.Exercises.FindAsync(1);
            Assert.Null(deletedExercise);
        }

        [Fact]
        public async Task DeleteExerciseAsync_WithInvalidId_ReturnsFalse()
        {
            // Act
            var result = await _exerciseService.DeleteExerciseAsync(999);

            // Assert
            Assert.False(result);
        }
    }
}
