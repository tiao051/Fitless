namespace Fitly.API.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public interface ICosmeticShopService
{
    Task<Result<CosmeticShopResponse>> GetCosmeticShopAsync(int userId, string? filter = null);
    Task<Result<PurchaseCosmeticResponse>> PurchaseCosmeticAsync(int userId, PurchaseCosmeticRequest request);
    Task<Result<List<CosmeticItemResponse>>> GetAvailableItemsAsync(string? category = null);
    Task<Result<List<UserCosmeticItemResponse>>> GetUserOwnedCosmetics(int userId, string? category = null);
}

public class CosmeticShopService(
    FitlyDbContext context,
    IPointsService pointsService) : ICosmeticShopService
{
    /// <summary>
    /// Get full cosmetic shop view: available items (purchasable) + owned items + current points
    /// </summary>
    public async Task<Result<CosmeticShopResponse>> GetCosmeticShopAsync(int userId, string? filter = null)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<CosmeticShopResponse>.Failure("Chibi not found");

        // Get available items (all items user can purchase, or default items)
        var availableQuery = context.CosmeticItems.AsNoTracking();
        if (!string.IsNullOrEmpty(filter))
            availableQuery = availableQuery.Where(ci => ci.Category == filter);

        var availableItems = await availableQuery
            .OrderBy(ci => ci.Category)
            .ThenBy(ci => ci.CostPoints)
            .ToListAsync();

        // Get user's owned items
        var ownedItems = await context.UserCosmeticItems
            .AsNoTracking()
            .Where(uci => uci.ChibiId == chibi.Id)
            .Include(uci => uci.CosmeticItem)
            .ToListAsync();

        // Get current points balance
        var balanceResult = await pointsService.GetPointsBalanceAsync(userId);
        if (!balanceResult.IsSuccess)
            return Result<CosmeticShopResponse>.Failure(balanceResult.Error ?? "Balance not found");

        var response = new CosmeticShopResponse
        {
            AvailableItems = availableItems.Select(MapToCosmeticResponse).ToList(),
            OwnedItems = ownedItems.Select(MapToUserCosmeticResponse).ToList(),
            CurrentBalance = balanceResult.Data!
        };

        return Result<CosmeticShopResponse>.Success(response);
    }

    /// <summary>
    /// Purchase a cosmetic item (deduct points, add to user's collection)
    /// </summary>
    public async Task<Result<PurchaseCosmeticResponse>> PurchaseCosmeticAsync(int userId, PurchaseCosmeticRequest request)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<PurchaseCosmeticResponse>.Failure("Chibi not found");

        // Get the cosmetic item
        var cosmeticItem = await context.CosmeticItems.FindAsync(request.CosmeticItemId);
        if (cosmeticItem == null)
            return Result<PurchaseCosmeticResponse>.Failure("Cosmetic item not found");

        // Check if user already owns this item (prevent duplicate purchase)
        var alreadyOwns = await context.UserCosmeticItems
            .AnyAsync(uci => uci.ChibiId == chibi.Id && uci.CosmeticItemId == request.CosmeticItemId);
        if (alreadyOwns)
            return Result<PurchaseCosmeticResponse>.Failure("You already own this item");

        // Get current balance
        var balanceResult = await pointsService.GetPointsBalanceAsync(userId);
        if (!balanceResult.IsSuccess)
            return Result<PurchaseCosmeticResponse>.Failure(balanceResult.Error ?? "Failed to get balance");

        if (balanceResult.Data!.Balance < cosmeticItem.CostPoints)
            return Result<PurchaseCosmeticResponse>.Failure("Insufficient points for purchase");

        // Deduct points (this creates transaction)
        var pointsResult = await pointsService.RemovePointsAsync(
            userId,
            "CosmeticPurchase",
            cosmeticItem.CostPoints,
            $"Purchased {cosmeticItem.Name}"
        );

        if (!pointsResult.IsSuccess)
            return Result<PurchaseCosmeticResponse>.Failure("Failed to deduct points");

        // Add cosmetic to user's collection
        var userCosmeticItem = new UserCosmeticItem
        {
            ChibiId = chibi.Id,
            CosmeticItemId = request.CosmeticItemId,
            IsEquipped = false,
            AcquiredAt = DateTime.UtcNow
        };

        context.UserCosmeticItems.Add(userCosmeticItem);
        await context.SaveChangesAsync();

        // Get updated balance
        var updatedBalanceResult = await pointsService.GetPointsBalanceAsync(userId);

        var response = new PurchaseCosmeticResponse
        {
            Success = true,
            NewItem = MapToUserCosmeticResponse(userCosmeticItem),
            UpdatedBalance = updatedBalanceResult.IsSuccess ? updatedBalanceResult.Data : new PointsBalanceResponse(),
            Transaction = pointsResult.Data
        };

        return Result<PurchaseCosmeticResponse>.Success(response);
    }

    /// <summary>
    /// Get all available cosmetic items (optionally filtered by category)
    /// </summary>
    public async Task<Result<List<CosmeticItemResponse>>> GetAvailableItemsAsync(string? category = null)
    {
        var query = context.CosmeticItems.AsNoTracking();
        
        if (!string.IsNullOrEmpty(category))
            query = query.Where(ci => ci.Category == category);

        var items = await query
            .OrderBy(ci => ci.Category)
            .ThenBy(ci => ci.CostPoints)
            .ToListAsync();

        return Result<List<CosmeticItemResponse>>.Success(
            items.Select(MapToCosmeticResponse).ToList()
        );
    }

    /// <summary>
    /// Get user's owned cosmetics (optionally filtered by category)
    /// </summary>
    public async Task<Result<List<UserCosmeticItemResponse>>> GetUserOwnedCosmetics(int userId, string? category = null)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<List<UserCosmeticItemResponse>>.Failure("Chibi not found");

        IQueryable<UserCosmeticItem> query = context.UserCosmeticItems
            .AsNoTracking()
            .Where(uci => uci.ChibiId == chibi.Id)
            .Include(uci => uci.CosmeticItem);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(uci => uci.CosmeticItem.Category == category);
        }

        var items = await query
            .OrderBy(uci => uci.CosmeticItem.Category)
            .ThenBy(uci => uci.AcquiredAt)
            .ToListAsync();

        return Result<List<UserCosmeticItemResponse>>.Success(
            items.Select(MapToUserCosmeticResponse).ToList()
        );
    }

    private CosmeticItemResponse MapToCosmeticResponse(CosmeticItem item)
    {
        return new CosmeticItemResponse
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Category = item.Category,
            ImageUrl = item.ImageUrl,
            CostPoints = item.CostPoints,
            IsDefault = item.IsDefault,
            Rarity = item.Rarity,
            CreatedAt = item.CreatedAt
        };
    }

    private UserCosmeticItemResponse MapToUserCosmeticResponse(UserCosmeticItem item)
    {
        return new UserCosmeticItemResponse
        {
            Id = item.Id,
            ChibiId = item.ChibiId,
            CosmeticItem = MapToCosmeticResponse(item.CosmeticItem),
            IsEquipped = item.IsEquipped,
            AcquiredAt = item.AcquiredAt
        };
    }
}
