using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;
using Fitly.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Fitly.API.Tests.Services
{
    public class WorkoutServiceTests
    {
        private readonly FitlyDbContext _dbContext;
        private readonly WorkoutService _workoutService;

        public WorkoutServiceTests()
        {
            var options = new DbContextOptionsBuilder<FitlyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new FitlyDbContext(options);
            _workoutService = new WorkoutService(_dbContext);
        }

        private async Task SeedData()
        {
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                PasswordHash = "hash",
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var exercises = new List<Exercise>
            {
                new Exercise { Id = 1, Name = "Bench Press", BodySection = "Upper", MuscleGroup = "Chest", Equipment = "Barbell" },
                new Exercise { Id = 2, Name = "Squats", BodySection = "Lower", MuscleGroup = "Legs", Equipment = "Barbell" }
            };

            await _dbContext.Users.AddAsync(user);
            await _dbContext.Exercises.AddRangeAsync(exercises);
            await _dbContext.SaveChangesAsync();
        }

        [Fact]
        public async Task CreateWorkoutAsync_WithValidRequest_CreatesWorkout()
        {
            // Arrange
            await SeedData();

            var createRequest = new CreateWorkoutRequest
            {
                Name = "Chest Day",
                DurationMinutes = 60,
                Notes = "Great workout",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 1, Reps = 10, Weight = 100 },
                    new CreateWorkoutSetRequest { ExerciseId = 1, Reps = 8, Weight = 110 }
                }
            };

            // Act
            var result = await _workoutService.CreateWorkoutAsync(1, createRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Chest Day", result.Name);
            Assert.Equal(1, result.UserId);
            Assert.Equal(2, result.Sets.Count);
            Assert.NotEqual(0, result.Id);
        }

        [Fact]
        public async Task GetWorkoutByIdAsync_WithValidId_ReturnsWorkout()
        {
            // Arrange
            await SeedData();

            var createRequest = new CreateWorkoutRequest
            {
                Name = "Leg Day",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 2, Reps = 12, Weight = 150 }
                }
            };

            var workout = await _workoutService.CreateWorkoutAsync(1, createRequest);

            // Act
            var result = await _workoutService.GetWorkoutByIdAsync(workout.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Leg Day", result.Name);
            Assert.Single(result.Sets);
        }

        [Fact]
        public async Task GetWorkoutByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _workoutService.GetWorkoutByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetUserWorkoutsAsync_ReturnsAllUserWorkouts()
        {
            // Arrange
            await SeedData();

            var createRequest1 = new CreateWorkoutRequest
            {
                Name = "Workout 1",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 1, Reps = 10, Weight = 100 }
                }
            };

            var createRequest2 = new CreateWorkoutRequest
            {
                Name = "Workout 2",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 2, Reps = 12, Weight = 150 }
                }
            };

            await _workoutService.CreateWorkoutAsync(1, createRequest1);
            await _workoutService.CreateWorkoutAsync(1, createRequest2);

            // Act
            var result = await _workoutService.GetUserWorkoutsAsync(1);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, w => w.Name == "Workout 1");
            Assert.Contains(result, w => w.Name == "Workout 2");
        }

        [Fact]
        public async Task GetUserWorkoutsAsync_WithDateRange_ReturnsFilteredWorkouts()
        {
            // Arrange
            await SeedData();

            var today = DateTime.UtcNow.Date;
            var startDate = today;
            var endDate = today.AddDays(1);

            var createRequest = new CreateWorkoutRequest
            {
                Name = "Dated Workout",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 1, Reps = 10, Weight = 100 }
                }
            };

            await _workoutService.CreateWorkoutAsync(1, createRequest);

            // Act
            var result = await _workoutService.GetUserWorkoutsAsync(1, startDate, endDate);

            // Assert
            Assert.NotEmpty(result);
        }

        [Fact]
        public async Task DeleteWorkoutAsync_WithValidId_DeletesWorkout()
        {
            // Arrange
            await SeedData();

            var createRequest = new CreateWorkoutRequest
            {
                Name = "Workout to Delete",
                Sets = new List<CreateWorkoutSetRequest>
                {
                    new CreateWorkoutSetRequest { ExerciseId = 1, Reps = 10, Weight = 100 }
                }
            };

            var workout = await _workoutService.CreateWorkoutAsync(1, createRequest);

            // Act
            var result = await _workoutService.DeleteWorkoutAsync(workout.Id);

            // Assert
            Assert.True(result);
            var deletedWorkout = await _workoutService.GetWorkoutByIdAsync(workout.Id);
            Assert.Null(deletedWorkout);
        }

        [Fact]
        public async Task DeleteWorkoutAsync_WithInvalidId_ReturnsFalse()
        {
            // Act
            var result = await _workoutService.DeleteWorkoutAsync(999);

            // Assert
            Assert.False(result);
        }
    }
}
