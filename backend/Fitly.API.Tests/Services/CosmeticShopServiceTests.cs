namespace Fitly.API.Tests.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.Services;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public class CosmeticShopServiceTests : IDisposable
{
    private readonly FitlyDbContext _context;
    private readonly CosmeticShopService _cosmeticService;
    private readonly PointsService _pointsService;

    public CosmeticShopServiceTests()
    {
        var options = new DbContextOptionsBuilder<FitlyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FitlyDbContext(options);
        _pointsService = new PointsService(_context);
        _cosmeticService = new CosmeticShopService(_context, _pointsService);
    }

    private async Task<Chibi> SetupChibiWithCosmetics(int userId)
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
            Balance = 500,
            TotalEarned = 500,
            TotalSpent = 0
        };
        _context.PointsBalances.Add(balance);

        // Add default cosmetics
        var cosmetics = new[]
        {
            new CosmeticItem { Id = "outfit_default", Name = "Default Outfit", Category = "Outfit", CostPoints = 0, IsDefault = true },
            new CosmeticItem { Id = "outfit_gym", Name = "Gym Fit", Category = "Outfit", CostPoints = 300, IsDefault = false, Rarity = "Uncommon" },
            new CosmeticItem { Id = "hair_blue", Name = "Blue Hair", Category = "HairColor", CostPoints = 200, IsDefault = false, Rarity = "Common" },
        };

        foreach (var cosmetic in cosmetics)
        {
            _context.CosmeticItems.Add(cosmetic);
        }

        await _context.SaveChangesAsync();
        return chibi;
    }

    [Fact]
    public async Task GetCosmeticShopAsync_ReturnsBothAvailableAndOwned()
    {
        // Arrange
        var chibi = await SetupChibiWithCosmetics(1);

        // Act
        var result = await _cosmeticService.GetCosmeticShopAsync(chibi.UserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.AvailableItems);
        Assert.Equal(500, result.Data.CurrentBalance.Balance);
    }

    [Fact]
    public async Task PurchaseCosmeticAsync_Success_DeductsPointsAndAddsItem()
    {
        // Arrange
        var chibi = await SetupChibiWithCosmetics(2);
        var request = new PurchaseCosmeticRequest { CosmeticItemId = "outfit_gym" };

        // Act
        var result = await _cosmeticService.PurchaseCosmeticAsync(chibi.UserId, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.True(result.Data.Success);
        Assert.NotNull(result.Data.NewItem);
        Assert.Equal(200, result.Data.UpdatedBalance?.Balance); // 500 - 300
    }

    [Fact]
    public async Task PurchaseCosmeticAsync_ReturnsFail_IfInsufficientPoints()
    {
        // Arrange
        var chibi = await SetupChibiWithCosmetics(3);
        var balance = await _context.PointsBalances.FirstAsync(pb => pb.ChibiId == chibi.Id);
        balance.Balance = 100; // Not enough for 300-point item
        await _context.SaveChangesAsync();

        var request = new PurchaseCosmeticRequest { CosmeticItemId = "outfit_gym" };

        // Act
        var result = await _cosmeticService.PurchaseCosmeticAsync(chibi.UserId, request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Insufficient points for purchase", result.Error);
    }

    [Fact]
    public async Task PurchaseCosmeticAsync_ReturnsFail_IfAlreadyOwned()
    {
        // Arrange
        var chibi = await SetupChibiWithCosmetics(4);

        // Purchase once
        var request1 = new PurchaseCosmeticRequest { CosmeticItemId = "outfit_gym" };
        await _cosmeticService.PurchaseCosmeticAsync(chibi.UserId, request1);

        // Act - Try to purchase same item again
        var result = await _cosmeticService.PurchaseCosmeticAsync(chibi.UserId, request1);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("You already own this item", result.Error);
    }

    [Fact]
    public async Task GetAvailableItemsAsync_FiltersbyCategory()
    {
        // Arrange
        await SetupChibiWithCosmetics(5);

        // Act
        var result = await _cosmeticService.GetAvailableItemsAsync("Outfit");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Data!.Count); // 2 outfit items
        Assert.All(result.Data, item => Assert.Equal("Outfit", item.Category));
    }

    [Fact]
    public async Task GetUserOwnedCosmetics_ReturnsOnlyUserOwnedItems()
    {
        // Arrange
        var chibi = await SetupChibiWithCosmetics(6);

        // Purchase item
        var purchase = new PurchaseCosmeticRequest { CosmeticItemId = "outfit_gym" };
        await _cosmeticService.PurchaseCosmeticAsync(chibi.UserId, purchase);

        // Act
        var result = await _cosmeticService.GetUserOwnedCosmetics(chibi.UserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEmpty(result.Data);
        Assert.All(result.Data, item => Assert.Equal("outfit_gym", item.CosmeticItem.Id));
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
