namespace Fitly.API.Services;

using Fitly.API.Data;
using Fitly.API.Models;
using Fitly.API.DTOs;
using Microsoft.EntityFrameworkCore;

public interface IChibiService
{
    Task<Result<ChibiResponse>> GenerateChibiAsync(int userId, GenerateChibiRequest request);
    Task<Result<ChibiResponse>> GetChibiAsync(int userId);
    Task<Result<ChibiResponse>> UpdateChibiAppearanceAsync(int userId, UpdateChibiAppearanceRequest request);
    Task<Result<ChibiResponse>> EvolveBodyLayerAsync(int userId);
}

public class ChibiService(FitlyDbContext context) : IChibiService
{
    /// <summary>
    /// Generate initial chibi during onboarding.
    /// Creates Chibi, PointsBalance with 0 points.
    /// </summary>
    public async Task<Result<ChibiResponse>> GenerateChibiAsync(int userId, GenerateChibiRequest request)
    {
        // Check if user exists
        var user = await context.Users.FindAsync(userId);
        if (user == null)
            return Result<ChibiResponse>.Failure("User not found");

        // Check if chibi already exists
        var existingChibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (existingChibi != null)
            return Result<ChibiResponse>.Failure("Chibi already exists for this user");

        // Create new chibi
        var chibi = new Chibi
        {
            UserId = userId,
            ShoulderWidth = request.ShoulderWidth,
            CoreDefinition = request.CoreDefinition,
            WaistSize = request.WaistSize,
            LegMuscle = request.LegMuscle,
            ArmMuscle = request.ArmMuscle,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Chibis.Add(chibi);
        await context.SaveChangesAsync();

        // Create PointsBalance
        var pointsBalance = new PointsBalance
        {
            ChibiId = chibi.Id,
            Balance = 0,
            TotalEarned = 0,
            TotalSpent = 0,
            UpdatedAt = DateTime.UtcNow
        };

        context.PointsBalances.Add(pointsBalance);
        await context.SaveChangesAsync();

        return Result<ChibiResponse>.Success(MapToChibiResponse(chibi));
    }

    /// <summary>
    /// Get chibi state (body layer + equipped cosmetics)
    /// </summary>
    public async Task<Result<ChibiResponse>> GetChibiAsync(int userId)
    {
        var chibi = await context.Chibis
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (chibi == null)
            return Result<ChibiResponse>.Failure("Chibi not found for user");

        // Load equipped cosmetics if needed
        var response = MapToChibiResponse(chibi);

        if (!string.IsNullOrEmpty(chibi.OutfitItemId))
        {
            var outfit = await context.CosmeticItems.FindAsync(chibi.OutfitItemId);
            if (outfit != null)
                response.EquippedOutfit = MapToCosmeticResponse(outfit);
        }

        return Result<ChibiResponse>.Success(response);
    }

    /// <summary>
    /// Update chibi appearance (equip cosmetics)
    /// </summary>
    public async Task<Result<ChibiResponse>> UpdateChibiAppearanceAsync(int userId, UpdateChibiAppearanceRequest request)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<ChibiResponse>.Failure("Chibi not found");

        // Validate that user owns these cosmetics (if not default)
        if (!string.IsNullOrEmpty(request.OutfitItemId))
        {
            var ownedOrDefault = await IsUserOwnsCosmeticAsync(chibi.Id, request.OutfitItemId);
            if (!ownedOrDefault)
                return Result<ChibiResponse>.Failure("User does not own this outfit item");
            chibi.OutfitItemId = request.OutfitItemId;
        }

        if (!string.IsNullOrEmpty(request.AccessoryItemId))
        {
            var ownedOrDefault = await IsUserOwnsCosmeticAsync(chibi.Id, request.AccessoryItemId);
            if (!ownedOrDefault)
                return Result<ChibiResponse>.Failure("User does not own this accessory");
            chibi.AccessoryItemId = request.AccessoryItemId;
        }

        if (!string.IsNullOrEmpty(request.HairColorId))
        {
            var ownedOrDefault = await IsUserOwnsCosmeticAsync(chibi.Id, request.HairColorId);
            if (!ownedOrDefault)
                return Result<ChibiResponse>.Failure("User does not own this hair color");
            chibi.HairColorId = request.HairColorId;
        }

        chibi.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return Result<ChibiResponse>.Success(MapToChibiResponse(chibi));
    }

    /// <summary>
    /// Evolve chibi body layer based on 2-week fitness trends.
    /// Called by background job or when user views chibi.
    /// </summary>
    public async Task<Result<ChibiResponse>> EvolveBodyLayerAsync(int userId)
    {
        var chibi = await context.Chibis.FirstOrDefaultAsync(c => c.UserId == userId);
        if (chibi == null)
            return Result<ChibiResponse>.Failure("Chibi not found");

        var twoWeeksAgo = DateTime.UtcNow.AddDays(-14);
        bool hasChanged = false;

        // Get nutrition data for last 2 weeks
        var nutritionLogs = await context.NutritionLogs
            .Where(nl => nl.UserId == userId && nl.LogDate >= twoWeeksAgo)
            .Include(nl => nl.Food)
            .ToListAsync();

        // Get workouts for last 2 weeks
        var workouts = await context.Workouts
            .Where(w => w.UserId == userId && w.WorkoutDate >= twoWeeksAgo)
            .Include(w => w.Sets)
            .ThenInclude(s => s.Exercise)
            .ToListAsync();
        
        // Filter to only workouts with completed sets
        workouts = workouts
            .Where(w => w.Sets.Any(s => s.IsCompleted))
            .ToList();

        // 1. **Shoulder evolution**: Track protein consistency
        var proteinDaysCount = GetDaysHittingProteinTarget(nutritionLogs, userId);
        if (proteinDaysCount >= 10) // Consistent protein over 2 weeks
        {
            if (chibi.ShoulderWidth < 100)
            {
                chibi.ShoulderWidth = Math.Min(100, chibi.ShoulderWidth + 3);
                hasChanged = true;
            }
        }

        // 2. **Core evolution**: Track training frequency
        var trainingDaysCount = workouts.Select(w => w.WorkoutDate.Date).Distinct().Count();
        if (trainingDaysCount >= 10) // Trained 10+ days
        {
            if (chibi.CoreDefinition < 100)
            {
                chibi.CoreDefinition = Math.Min(100, chibi.CoreDefinition + 3);
                hasChanged = true;
            }
        }

        // 3. **Waist evolution**: Track caloric deficit (simplified - count days under target)
        var deficitDaysCount = GetDaysInCalorieDeficit(nutritionLogs, userId);
        if (deficitDaysCount >= 10)
        {
            if (chibi.WaistSize > 0)
            {
                chibi.WaistSize = Math.Max(0, chibi.WaistSize - 3);
                hasChanged = true;
            }
        }

        // 4. **Leg muscle**: Track lower body volume
        var legVolume = CalculateMuscleGroupVolume(workouts, "Legs");
        if (legVolume > 5000) // Significant leg training volume
        {
            if (chibi.LegMuscle < 100)
            {
                chibi.LegMuscle = Math.Min(100, chibi.LegMuscle + 2);
                hasChanged = true;
            }
        }

        // 5. **Arm muscle**: Track upper body volume
        var armVolume = CalculateMuscleGroupVolume(workouts, "Shoulders") + 
                        CalculateMuscleGroupVolume(workouts, "Chest") +
                        CalculateMuscleGroupVolume(workouts, "Back");
        if (armVolume > 5000)
        {
            if (chibi.ArmMuscle < 100)
            {
                chibi.ArmMuscle = Math.Min(100, chibi.ArmMuscle + 2);
                hasChanged = true;
            }
        }

        if (hasChanged)
        {
            chibi.LastBodyUpdateAt = DateTime.UtcNow;
            chibi.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        return Result<ChibiResponse>.Success(MapToChibiResponse(chibi));
    }

    // ========== Helpers ==========

    private int GetDaysHittingProteinTarget(List<NutritionLog> logs, int userId)
    {
        // Group by date, calculate daily protein
        const decimal proteinTargetGrams = 150; // Example target
        
        var dailyProtein = logs
            .GroupBy(l => l.LogDate.Date)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(l => l.Food.ProteinPer100g * l.Quantity / 100)
            );

        return dailyProtein.Count(kv => kv.Value >= proteinTargetGrams);
    }

    private int GetDaysInCalorieDeficit(List<NutritionLog> logs, int userId)
    {
        const int calorieTargetPerDay = 2200; // Example maintenance
        
        var dailyCalories = logs
            .GroupBy(l => l.LogDate.Date)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(l => l.Food.CaloriesPer100g * l.Quantity / 100)
            );

        return dailyCalories.Count(kv => kv.Value < calorieTargetPerDay);
    }

    private decimal CalculateMuscleGroupVolume(List<Workout> workouts, string muscleGroup)
    {
        return workouts
            .SelectMany(w => w.Sets)
            .Where(s => s.IsCompleted && 
                        s.Exercise.MuscleGroup.Contains(muscleGroup))
            .Sum(s => (decimal)s.ActualReps * s.ActualWeight);
    }

    private async Task<bool> IsUserOwnsCosmeticAsync(int chibiId, string cosmeticItemId)
    {
        var cosmetic = await context.CosmeticItems.FindAsync(cosmeticItemId);
        if (cosmetic == null) return false;
        if (cosmetic.IsDefault) return true; // All users can equip defaults

        var owned = await context.UserCosmeticItems
            .AnyAsync(uci => uci.ChibiId == chibiId && uci.CosmeticItemId == cosmeticItemId);
        return owned;
    }

    private ChibiResponse MapToChibiResponse(Chibi chibi)
    {
        return new ChibiResponse
        {
            Id = chibi.Id,
            UserId = chibi.UserId,
            ShoulderWidth = chibi.ShoulderWidth,
            CoreDefinition = chibi.CoreDefinition,
            WaistSize = chibi.WaistSize,
            LegMuscle = chibi.LegMuscle,
            ArmMuscle = chibi.ArmMuscle,
            LastBodyUpdateAt = chibi.LastBodyUpdateAt,
            OutfitItemId = chibi.OutfitItemId,
            AccessoryItemId = chibi.AccessoryItemId,
            AuraEffectId = chibi.AuraEffectId,
            HairColorId = chibi.HairColorId,
            SkinToneId = chibi.SkinToneId,
            CreatedAt = chibi.CreatedAt,
            UpdatedAt = chibi.UpdatedAt
        };
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
}

public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }

    public static Result<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
}
