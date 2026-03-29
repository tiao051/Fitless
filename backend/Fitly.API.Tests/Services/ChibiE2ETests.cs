namespace Fitly.API.Tests.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.Services;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// E2E Integration Test: Points & Cosmetic Shop flow
/// Scenario: User earns points through activities → purchases cosmetics
/// </summary>
public class ChibiE2ETests : IDisposable
{
    private readonly FitlyDbContext _context;
    private readonly PointsService _pointsService;
    private readonly CosmeticShopService _cosmeticService;

    public ChibiE2ETests()
    {
        var options = new DbContextOptionsBuilder<FitlyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FitlyDbContext(options);
        _pointsService = new PointsService(_context);
        _cosmeticService = new CosmeticShopService(_context, _pointsService);
    }

    [Fact]
    public async Task E2E_UserJourney_EarnPoints_PurchaseCosmetics()
    {
        // ========== STEP 1: USER SETUP ==========
        var user = new User
        {
            Id = 1,
            Email = "athlete@fitly.com",
            FirstName = "John",
            LastName = "Doe",
            PasswordHash = "hashed_password"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create chibi & points balance
        var chibi = new Chibi { UserId = user.Id };
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

        // ========== STEP 2: COSMETIC SHOP SETUP ==========
        var cosmetics = new[]
        {
            new CosmeticItem
            {
                Id = "outfit_gym_black",
                Name = "Black Gym Outfit",
                Category = "Outfit",
                CostPoints = 300,
                IsDefault = false,
                Rarity = "Uncommon"
            },
            new CosmeticItem
            {
                Id = "hair_blue",
                Name = "Blue Hair",
                Category = "HairColor",
                CostPoints = 200,
                IsDefault = false,
                Rarity = "Common"
            },
            new CosmeticItem
            {
                Id = "outfit_default",
                Name = "Default Outfit",
                Category = "Outfit",
                CostPoints = 0,
                IsDefault = true
            }
        };

        foreach (var cosmetic in cosmetics)
        {
            _context.CosmeticItems.Add(cosmetic);
        }
        await _context.SaveChangesAsync();

        // ========== STEP 3: USER EARNS POINTS ==========
        // Day 1: Workout
        var workoutResult = await _pointsService.AddPointsAsync(
            user.Id,
            "WorkoutCompleted",
            50,
            "Completed chest workout"
        );
        Assert.True(workoutResult.IsSuccess);

        // Day 1: Hit nutrition target
        var nutritionResult = await _pointsService.AddPointsAsync(
            user.Id,
            "NutritionTarget",
            30,
            "Hit daily protein target"
        );
        Assert.True(nutritionResult.IsSuccess);

        // Day 7: 7-day streak bonus
        var streakResult = await _pointsService.AddPointsAsync(
            user.Id,
            "StreakBonus",
            200,
            "Completed 7-day streak"
        );
        Assert.True(streakResult.IsSuccess);

        // Total: 50 + 30 + 200 = 280 points
        var balanceCheck = await _pointsService.GetPointsBalanceAsync(user.Id);
        Assert.Equal(280, balanceCheck.Data!.Balance);
        Assert.Equal(280, balanceCheck.Data.TotalEarned);

        // ========== STEP 4: CHECK SHOP BEFORE PURCHASE ==========
        var shopBefore = await _cosmeticService.GetCosmeticShopAsync(user.Id);
        Assert.True(shopBefore.IsSuccess);
        var availableCount = shopBefore.Data!.AvailableItems.Count;
        Assert.True(availableCount >= 3);
        Assert.Equal(0, shopBefore.Data.OwnedItems.Count);

        // ========== STEP 5: ATTEMPT PURCHASE (INSUFFICIENT FUNDS) ==========
        // Try to buy outfit (costs 300, but only have 280)
        var failPurchase = new PurchaseCosmeticRequest { CosmeticItemId = "outfit_gym_black" };
        var purchaseFail = await _cosmeticService.PurchaseCosmeticAsync(user.Id, failPurchase);
        Assert.False(purchaseFail.IsSuccess);
        Assert.Equal("Insufficient points for purchase", purchaseFail.Error);

        // ========== STEP 6: EARN MORE POINTS & RETRY ==========
        await _pointsService.AddPointsAsync(user.Id, "WorkoutCompleted", 50);
        // Now: 280 + 50 = 330 points

        var purchaseSuccess = await _cosmeticService.PurchaseCosmeticAsync(user.Id, failPurchase);
        Assert.True(purchaseSuccess.IsSuccess);
        Assert.NotNull(purchaseSuccess.Data?.NewItem);
        Assert.Equal(30, purchaseSuccess.Data.UpdatedBalance?.Balance); // 330 - 300

        // ========== STEP 7: PURCHASE CHEAPER ITEM ==========
        var cheapItem = new PurchaseCosmeticRequest { CosmeticItemId = "hair_blue" };
        var cheapPurchase = await _cosmeticService.PurchaseCosmeticAsync(user.Id, cheapItem);
        // Should fail: 30 < 200
        Assert.False(cheapPurchase.IsSuccess);

        // Earn more
        await _pointsService.AddPointsAsync(user.Id, "PersonalRecord", 100, "New bench press PR");
        // Now: 30 + 100 = 130... still not enough for 200
        
        await _pointsService.AddPointsAsync(user.Id, "StreakBonus", 200, "Another 7-day");
        // Now: 130 + 200 = 330

        var cheapSuccess = await _cosmeticService.PurchaseCosmeticAsync(user.Id, cheapItem);
        Assert.True(cheapSuccess.IsSuccess);
        Assert.Equal(130, cheapSuccess.Data!.UpdatedBalance?.Balance); // 330 - 200

        // ========== STEP 8: VERIFY FINAL STATE ==========
        var finalShop = await _cosmeticService.GetCosmeticShopAsync(user.Id);
        Assert.Equal(2, finalShop.Data!.OwnedItems.Count); // outfit + hair
        Assert.Equal(130, finalShop.Data.CurrentBalance.Balance);
        Assert.Equal(630, finalShop.Data.CurrentBalance.TotalEarned); // 50+30+200+50+100+200
        Assert.Equal(500, finalShop.Data.CurrentBalance.TotalSpent); // 300+200

        // ========== STEP 9: VERIFY TRANSACTION HISTORY ==========
        var history = await _pointsService.GetPointsHistoryAsync(user.Id, limit: 100);
        Assert.True(history.IsSuccess);
        var cosmeticPurchases = history.Data!.Where(t => t.TransactionType == "CosmeticPurchase").ToList();
        Assert.Equal(2, cosmeticPurchases.Count);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
