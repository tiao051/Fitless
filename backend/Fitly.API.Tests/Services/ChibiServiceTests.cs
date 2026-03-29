namespace Fitly.API.Tests.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.Services;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public class ChibiServiceTests : IDisposable
{
    private readonly FitlyDbContext _context;
    private readonly ChibiService _service;

    public ChibiServiceTests()
    {
        var options = new DbContextOptionsBuilder<FitlyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FitlyDbContext(options);
        _service = new ChibiService(_context);
    }

    [Fact]
    public async Task GenerateChibiAsync_CreatesNewChibi_WithDefaultBodyValues()
    {
        // Arrange
        var user = new User { Id = 1, Email = "test@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new GenerateChibiRequest
        {
            ShoulderWidth = 55,
            CoreDefinition = 60,
            WaistSize = 50,
            LegMuscle = 50,
            ArmMuscle = 50
        };

        // Act
        var result = await _service.GenerateChibiAsync(user.Id, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(55, result.Data.ShoulderWidth);
        Assert.Equal(60, result.Data.CoreDefinition);
        
        // Verify PointsBalance created
        var balance = await _context.PointsBalances
            .FirstOrDefaultAsync(pb => pb.ChibiId == result.Data.Id);
        Assert.NotNull(balance);
        Assert.Equal(0, balance.Balance);
    }

    [Fact]
    public async Task GenerateChibiAsync_ReturnsFail_IfUserNotFound()
    {
        // Arrange
        var nonExistentUserId = 999;
        var request = new GenerateChibiRequest();

        // Act
        var result = await _service.GenerateChibiAsync(nonExistentUserId, request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("User not found", result.Error);
    }

    [Fact]
    public async Task GenerateChibiAsync_ReturnsFail_IfChibiAlreadyExists()
    {
        // Arrange
        var user = new User { Id = 1, Email = "test@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request1 = new GenerateChibiRequest();
        await _service.GenerateChibiAsync(user.Id, request1);

        // Act - try to generate again
        var result = await _service.GenerateChibiAsync(user.Id, request1);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Chibi already exists for this user", result.Error);
    }

    [Fact]
    public async Task GetChibiAsync_ReturnsChibibody_WithEquippedCosmetics()
    {
        // Arrange
        var user = new User { Id = 2, Email = "test2@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new GenerateChibiRequest { ShoulderWidth = 70 };
        await _service.GenerateChibiAsync(user.Id, request);

        // Act
        var result = await _service.GetChibiAsync(user.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(70, result.Data.ShoulderWidth);
    }

    [Fact]
    public async Task UpdateChibiAppearanceAsync_UpdatesEquippedCosmetics()
    {
        // Arrange
        var user = new User { Id = 3, Email = "test3@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new GenerateChibiRequest();
        await _service.GenerateChibiAsync(user.Id, request);

        // Add default cosmetic item
        var cosmetic = new CosmeticItem
        {
            Id = "outfit_default",
            Name = "Default Outfit",
            Category = "Outfit",
            CostPoints = 0,
            IsDefault = true
        };
        _context.CosmeticItems.Add(cosmetic);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateChibiAppearanceRequest { OutfitItemId = "outfit_default" };

        // Act
        var result = await _service.UpdateChibiAppearanceAsync(user.Id, updateRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("outfit_default", result.Data?.OutfitItemId);
    }

    [Fact]
    public async Task EvolveBodyLayerAsync_IncreasesShoulderWidth_WhenProteinConsistent()
    {
        // Arrange - Setup user, chibi, and nutrition logs
        var user = new User { Id = 4, Email = "test4@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new GenerateChibiRequest { ShoulderWidth = 50 };
        var chibiResult = await _service.GenerateChibiAsync(user.Id, request);
        var chibiId = chibiResult.Data!.Id;

        // Add food with high protein
        var food = new Food
        {
            Id = 1,
            Name = "Chicken Breast",
            Brand = "Generic",
            CaloriesPer100g = 165,
            ProteinPer100g = 31,
            CarbsPer100g = 0,
            FatPer100g = 3.6m,
            FiberPer100g = 0,
            ServingSize = 100,
            ServingUnit = "g",
            IsGeneric = true
        };
        _context.Foods.Add(food);
        await _context.SaveChangesAsync();

        // Add 11 nutrition logs hitting protein target (150g+)
        var today = DateTime.UtcNow;
        for (int i = 0; i < 11; i++)
        {
            var log = new NutritionLog
            {
                UserId = user.Id,
                FoodId = food.Id,
                Quantity = 500, // 500g * 31g protein per 100g = 155g protein
                LogDate = today.AddDays(-i)
            };
            _context.NutritionLogs.Add(log);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.EvolveBodyLayerAsync(user.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Data!.ShoulderWidth > 50, "ShoulderWidth should increase");
    }

    [Fact]
    public async Task EvolveBodyLayerAsync_IncreasesCoreDefinition_WithTrainingFrequency()
    {
        // Arrange
        var user = new User { Id = 5, Email = "test5@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var chibiReq = new GenerateChibiRequest { CoreDefinition = 50 };
        await _service.GenerateChibiAsync(user.Id, chibiReq);

        var exercise = new Exercise
        {
            Id = 1,
            Name = "Bench Press",
            BodySection = "Upper",
            MuscleGroup = "Chest",
            Equipment = "Barbell"
        };
        _context.Exercises.Add(exercise);
        await _context.SaveChangesAsync();

        // Add 11 workouts over 2 weeks
        var today = DateTime.UtcNow;
        for (int i = 0; i < 11; i++)
        {
            var workout = new Workout
            {
                UserId = user.Id,
                Name = $"Workout {i}",
                WorkoutDate = today.AddDays(-i)
            };
            _context.Workouts.Add(workout);
            await _context.SaveChangesAsync();

            var set = new WorkoutSet
            {
                WorkoutId = workout.Id,
                ExerciseId = exercise.Id,
                ActualReps = 10,
                ActualWeight = 185,
                IsCompleted = true
            };
            _context.WorkoutSets.Add(set);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.EvolveBodyLayerAsync(user.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Data!.CoreDefinition > 50, "CoreDefinition should increase");
    }

    [Fact]
    public async Task EvolveBodyLayerAsync_DecreaseWaistSize_WhenInCalorieDeficit()
    {
        // Arrange
        var user = new User { Id = 6, Email = "test6@test.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var chibiReq = new GenerateChibiRequest { WaistSize = 50 };
        await _service.GenerateChibiAsync(user.Id, chibiReq);

        var food = new Food
        {
            Id = 2,
            Name = "Broccoli",
            Brand = "Generic",
            CaloriesPer100g = 34,
            ProteinPer100g = 2.8m,
            CarbsPer100g = 7,
            FatPer100g = 0.4m,
            FiberPer100g = 2.4m,
            ServingSize = 100,
            ServingUnit = "g",
            IsGeneric = true
        };
        _context.Foods.Add(food);
        await _context.SaveChangesAsync();

        // Add 11 low-calorie logs
        var today = DateTime.UtcNow;
        for (int i = 0; i < 11; i++)
        {
            var log = new NutritionLog
            {
                UserId = user.Id,
                FoodId = food.Id,
                Quantity = 300, // 300g * 34 cal per 100g = 102 cal - well below 2200 target
                LogDate = today.AddDays(-i)
            };
            _context.NutritionLogs.Add(log);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.EvolveBodyLayerAsync(user.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Data!.WaistSize < 50, "WaistSize should decrease");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
