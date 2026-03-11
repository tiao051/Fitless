using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;
using Fitly.API.Services;
using Microsoft.EntityFrameworkCore;

namespace Fitly.API.Tests.Services
{
    public class NutritionServiceTests
    {
        private readonly FitlyDbContext _dbContext;
        private readonly NutritionService _nutritionService;

        public NutritionServiceTests()
        {
            var options = new DbContextOptionsBuilder<FitlyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new FitlyDbContext(options);
            _nutritionService = new NutritionService(_dbContext);
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

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();
        }

        [Fact]
        public async Task GetAllFoodsAsync_WithNoFoods_ReturnsEmptyList()
        {
            // Act
            var result = await _nutritionService.GetAllFoodsAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllFoodsAsync_ReturnsFoods()
        {
            // Arrange
            var foods = new List<Food>
            {
                new Food { Id = 1, Name = "Chicken Breast", CaloriesPer100g = 165, ProteinPer100g = 31, CarbsPer100g = 0, FatPer100g = 3.6m },
                new Food { Id = 2, Name = "Brown Rice", CaloriesPer100g = 111, ProteinPer100g = 2.6m, CarbsPer100g = 23, FatPer100g = 0.9m }
            };

            await _dbContext.Foods.AddRangeAsync(foods);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _nutritionService.GetAllFoodsAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, f => f.Name == "Chicken Breast");
        }

        [Fact]
        public async Task GetFoodByIdAsync_WithValidId_ReturnsFood()
        {
            // Arrange
            var food = new Food
            {
                Id = 1,
                Name = "Chicken Breast",
                CaloriesPer100g = 165,
                ProteinPer100g = 31,
                CarbsPer100g = 0,
                FatPer100g = 3.6m
            };

            await _dbContext.Foods.AddAsync(food);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _nutritionService.GetFoodByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Chicken Breast", result.Name);
            Assert.Equal(165m, result.CaloriesPer100g);
        }

        [Fact]
        public async Task GetFoodByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _nutritionService.GetFoodByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task SearchFoodsAsync_WithValidName_ReturnsFoods()
        {
            // Arrange
            var foods = new List<Food>
            {
                new Food { Id = 1, Name = "Chicken Breast", CaloriesPer100g = 165, ProteinPer100g = 31, CarbsPer100g = 0, FatPer100g = 3.6m },
                new Food { Id = 2, Name = "Chicken Thigh", CaloriesPer100g = 209, ProteinPer100g = 26, CarbsPer100g = 0, FatPer100g = 11 },
                new Food { Id = 3, Name = "Brown Rice", CaloriesPer100g = 111, ProteinPer100g = 2.6m, CarbsPer100g = 23, FatPer100g = 0.9m }
            };

            await _dbContext.Foods.AddRangeAsync(foods);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _nutritionService.SearchFoodsAsync("Chicken");

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, f => Assert.Contains("Chicken", f.Name));
        }

        [Fact]
        public async Task CreateFoodAsync_WithValidRequest_CreatesFood()
        {
            // Arrange
            var createRequest = new CreateFoodRequest
            {
                Name = "Salmon",
                CaloriesPer100g = 208,
                ProteinPer100g = 20,
                CarbsPer100g = 0,
                FatPer100g = 13,
                Description = "Rich in omega-3s"
            };

            // Act
            var result = await _nutritionService.CreateFoodAsync(createRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Salmon", result.Name);
            Assert.Equal(208m, result.CaloriesPer100g);
        }

        [Fact]
        public async Task LogNutritionAsync_WithValidRequest_LogsNutrition()
        {
            // Arrange
            await SeedData();

            var food = new Food
            {
                Id = 1,
                Name = "Chicken Breast",
                CaloriesPer100g = 165,
                ProteinPer100g = 31,
                CarbsPer100g = 0,
                FatPer100g = 3.6m
            };

            await _dbContext.Foods.AddAsync(food);
            await _dbContext.SaveChangesAsync();

            var logRequest = new CreateNutritionLogRequest
            {
                FoodId = 1,
                Quantity = 150 // 150 grams
            };

            // Act
            var result = await _nutritionService.LogNutritionAsync(1, logRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.UserId);
            Assert.NotNull(result.Food);
            Assert.Equal(150m, result.Quantity);
        }

        [Fact]
        public async Task GetUserNutritionLogsAsync_ReturnsAllLogs()
        {
            // Arrange
            await SeedData();

            var food = new Food
            {
                Id = 1,
                Name = "Chicken Breast",
                CaloriesPer100g = 165,
                ProteinPer100g = 31,
                CarbsPer100g = 0,
                FatPer100g = 3.6m
            };

            await _dbContext.Foods.AddAsync(food);
            await _dbContext.SaveChangesAsync();

            var logRequest1 = new CreateNutritionLogRequest { FoodId = 1, Quantity = 150 };
            var logRequest2 = new CreateNutritionLogRequest { FoodId = 1, Quantity = 200 };

            await _nutritionService.LogNutritionAsync(1, logRequest1);
            await _nutritionService.LogNutritionAsync(1, logRequest2);

            // Act
            var result = await _nutritionService.GetUserNutritionLogsAsync(1);

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task DeleteNutritionLogAsync_WithValidId_DeletesLog()
        {
            // Arrange
            await SeedData();

            var food = new Food
            {
                Id = 1,
                Name = "Chicken Breast",
                CaloriesPer100g = 165,
                ProteinPer100g = 31,
                CarbsPer100g = 0,
                FatPer100g = 3.6m
            };

            await _dbContext.Foods.AddAsync(food);
            await _dbContext.SaveChangesAsync();

            var logRequest = new CreateNutritionLogRequest { FoodId = 1, Quantity = 150 };
            var log = await _nutritionService.LogNutritionAsync(1, logRequest);

            // Act
            var result = await _nutritionService.DeleteNutritionLogAsync(log.Id);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task DeleteNutritionLogAsync_WithInvalidId_ReturnsFalse()
        {
            // Act
            var result = await _nutritionService.DeleteNutritionLogAsync(999);

            // Assert
            Assert.False(result);
        }
    }
}
