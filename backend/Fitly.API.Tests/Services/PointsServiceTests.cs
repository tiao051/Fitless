namespace Fitly.API.Tests.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.Services;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public class PointsServiceTests : IDisposable
{
    private readonly FitlyDbContext _context;
    private readonly PointsService _pointsService;

    public PointsServiceTests()
    {
        var options = new DbContextOptionsBuilder<FitlyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FitlyDbContext(options);
        _pointsService = new PointsService(_context);
    }

    private async Task<Chibi> SetupChibiWithPoints(int userId)
    {
        var user = new User
        {
            Id = userId,
            Email = $"test{userId}@test.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var chibi = new Chibi { UserId = userId };
        _context.Chibis.Add(chibi);
        await _context.SaveChangesAsync();

        var balance = new PointsBalance
        {
            ChibiId = chibi.Id,
            Balance = 0,
            TotalEarned = 0,
            TotalSpent = 0
        };
        _context.PointsBalances.Add(balance);
        await _context.SaveChangesAsync();

        return chibi;
    }

    [Fact]
    public async Task AddPointsAsync_IncreasesBalance_AndTracksTransaction()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(1);
        int pointsToAdd = 50;

        // Act
        var result = await _pointsService.AddPointsAsync(
            chibi.UserId,
            "WorkoutCompleted",
            pointsToAdd,
            "Completed chest workout"
        );

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(50, result.Data.Points);

        // Verify balance updated
        var balance = await _context.PointsBalances
            .FirstOrDefaultAsync(pb => pb.ChibiId == chibi.Id);
        Assert.NotNull(balance);
        Assert.Equal(50, balance.Balance);
        Assert.Equal(50, balance.TotalEarned);
    }

    [Fact]
    public async Task RemovePointsAsync_DecreasesBalance_WhenSufficientPoints()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(2);
        
        // Add initial points
        await _pointsService.AddPointsAsync(chibi.UserId, "StreakBonus", 200, "7-day streak");

        // Act - Try to spend
        var result = await _pointsService.RemovePointsAsync(
            chibi.UserId,
            "CosmeticPurchase",
            150,
            "Purchased outfit"
        );

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(-150, result.Data?.Points); // Transactions show negative for spending

        var balance = await _context.PointsBalances
            .FirstOrDefaultAsync(pb => pb.ChibiId == chibi.Id);
        Assert.Equal(50, balance.Balance); // 200 - 150 = 50
        Assert.Equal(150, balance.TotalSpent);
    }

    [Fact]
    public async Task RemovePointsAsync_ReturnsFail_IfInsufficientPoints()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(3);
        await _pointsService.AddPointsAsync(chibi.UserId, "WorkoutCompleted", 50);

        // Act - Try to spend more than available
        var result = await _pointsService.RemovePointsAsync(
            chibi.UserId,
            "CosmeticPurchase",
            100
        );

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Insufficient points", result.Error);
    }

    [Fact]
    public async Task GetPointsBalanceAsync_ReturnsCurrentBalance()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(4);
        await _pointsService.AddPointsAsync(chibi.UserId, "WorkoutCompleted", 100);
        await _pointsService.AddPointsAsync(chibi.UserId, "NutritionTarget", 50);

        // Act
        var result = await _pointsService.GetPointsBalanceAsync(chibi.UserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(150, result.Data.Balance);
        Assert.Equal(150, result.Data.TotalEarned);
        Assert.Equal(0, result.Data.TotalSpent);
    }

    [Fact]
    public async Task GetPointsHistoryAsync_ReturnsTransactionsOrderedByDateDesc()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(5);
        
        await _pointsService.AddPointsAsync(chibi.UserId, "WorkoutCompleted", 50);
        await Task.Delay(10); // Ensure different timestamps
        await _pointsService.AddPointsAsync(chibi.UserId, "NutritionTarget", 30);
        await Task.Delay(10);
        await _pointsService.AddPointsAsync(chibi.UserId, "StreakBonus", 200);

        // Act
        var result = await _pointsService.GetPointsHistoryAsync(chibi.UserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(3, result.Data.Count);
        Assert.Equal(200, result.Data[0].Points); // Most recent first
        Assert.Equal(30, result.Data[1].Points);
        Assert.Equal(50, result.Data[2].Points);
    }

    [Fact]
    public async Task GetPointsHistoryAsync_ReturnsLimitedResults()
    {
        // Arrange
        var chibi = await SetupChibiWithPoints(6);
        
        for (int i = 0; i < 10; i++)
        {
            await _pointsService.AddPointsAsync(chibi.UserId, "WorkoutCompleted", 50);
        }

        // Act
        var result = await _pointsService.GetPointsHistoryAsync(chibi.UserId, limit: 5);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(5, result.Data!.Count);
    }

    [Fact]
    public async Task PointsTransaction_ReturnsFail_IfChibiNotFound()
    {
        // Act
        var result = await _pointsService.AddPointsAsync(999, "WorkoutCompleted", 50);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Chibi not found for user", result.Error);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
