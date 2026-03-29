namespace Fitly.API.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public interface IPointsService
{
    Task<Result<PointsTransactionResponse>> AddPointsAsync(int userId, string transactionType, int points, string? description = null);
    Task<Result<PointsTransactionResponse>> RemovePointsAsync(int userId, string transactionType, int points, string? description = null);
    Task<Result<PointsBalanceResponse>> GetPointsBalanceAsync(int userId);
    Task<Result<List<PointsTransactionResponse>>> GetPointsHistoryAsync(int userId, int limit = 50);
}

public class PointsService(FitlyDbContext context) : IPointsService
{
    /// <summary>
    /// Add points to user (earning: workouts, nutrition, streaks, PRs)
    /// </summary>
    public async Task<Result<PointsTransactionResponse>> AddPointsAsync(
        int userId, 
        string transactionType, 
        int points, 
        string? description = null)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<PointsTransactionResponse>.Failure("Chibi not found for user");

        var balance = await context.PointsBalances.FirstOrDefaultAsync(pb => pb.ChibiId == chibi.Id);
        if (balance == null)
            return Result<PointsTransactionResponse>.Failure("Points balance not found");

        balance.Balance += points;
        balance.TotalEarned += points;
        balance.UpdatedAt = DateTime.UtcNow;

        var transaction = new PointsTransaction
        {
            ChibiId = chibi.Id,
            TransactionType = transactionType,
            Points = points,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        context.PointsTransactions.Add(transaction);
        context.PointsBalances.Update(balance);
        await context.SaveChangesAsync();

        return Result<PointsTransactionResponse>.Success(MapTransactionResponse(transaction));
    }

    /// <summary>
    /// Remove points from user (spending: cosmetic purchases)
    /// </summary>
    public async Task<Result<PointsTransactionResponse>> RemovePointsAsync(
        int userId, 
        string transactionType, 
        int points, 
        string? description = null)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<PointsTransactionResponse>.Failure("Chibi not found for user");

        var balance = await context.PointsBalances.FirstOrDefaultAsync(pb => pb.ChibiId == chibi.Id);
        if (balance == null)
            return Result<PointsTransactionResponse>.Failure("Points balance not found");

        if (balance.Balance < points)
            return Result<PointsTransactionResponse>.Failure("Insufficient points");

        balance.Balance -= points;
        balance.TotalSpent += points;
        balance.UpdatedAt = DateTime.UtcNow;

        var transaction = new PointsTransaction
        {
            ChibiId = chibi.Id,
            TransactionType = transactionType,
            Points = -points, // Negative for spending
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        context.PointsTransactions.Add(transaction);
        context.PointsBalances.Update(balance);
        await context.SaveChangesAsync();

        return Result<PointsTransactionResponse>.Success(MapTransactionResponse(transaction));
    }

    /// <summary>
    /// Get current points balance
    /// </summary>
    public async Task<Result<PointsBalanceResponse>> GetPointsBalanceAsync(int userId)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<PointsBalanceResponse>.Failure("Chibi not found");

        var balance = await context.PointsBalances
            .AsNoTracking()
            .FirstOrDefaultAsync(pb => pb.ChibiId == chibi.Id);

        if (balance == null)
            return Result<PointsBalanceResponse>.Failure("Points balance not found");

        return Result<PointsBalanceResponse>.Success(MapBalanceResponse(balance));
    }

    /// <summary>
    /// Get transaction history (recent activities)
    /// </summary>
    public async Task<Result<List<PointsTransactionResponse>>> GetPointsHistoryAsync(int userId, int limit = 50)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<List<PointsTransactionResponse>>.Failure("Chibi not found");

        var transactions = await context.PointsTransactions
            .AsNoTracking()
            .Where(pt => pt.ChibiId == chibi.Id)
            .OrderByDescending(pt => pt.CreatedAt)
            .Take(limit)
            .ToListAsync();

        var responses = transactions.Select(MapTransactionResponse).ToList();
        return Result<List<PointsTransactionResponse>>.Success(responses);
    }

    private PointsBalanceResponse MapBalanceResponse(PointsBalance balance)
    {
        return new PointsBalanceResponse
        {
            Id = balance.Id,
            ChibiId = balance.ChibiId,
            Balance = balance.Balance,
            TotalEarned = balance.TotalEarned,
            TotalSpent = balance.TotalSpent,
            UpdatedAt = balance.UpdatedAt
        };
    }

    private PointsTransactionResponse MapTransactionResponse(PointsTransaction transaction)
    {
        return new PointsTransactionResponse
        {
            Id = transaction.Id,
            ChibiId = transaction.ChibiId,
            TransactionType = transaction.TransactionType,
            Points = transaction.Points,
            Description = transaction.Description,
            RelatedEntityId = transaction.RelatedEntityId,
            CreatedAt = transaction.CreatedAt
        };
    }
}
