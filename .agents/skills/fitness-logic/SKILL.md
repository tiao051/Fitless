---
name: fitness-logic
description: "Use when: calculating fitness metrics (volume, macros, body metrics), implementing workout analytics, defining domain rules. Covers: calorie calculations, set aggregations, streak logic, nutrition summaries. All calculations must be backend-only (server-side authority). Refer to `.github/project-brief.md` for principles."
---

# Fitly Fitness Logic & Domain Rules

## Overview

All fitness calculations and business logic are **backend-only**. The frontend is a consumer; it never duplicates calculations.

---

## Core Calculations (Backend Authority)

### 1. Workout Volume

**Formula**: `Reps × Weight` per set, then sum across session

```csharp
// In WorkoutService.CalculateTotalVolume()
public decimal CalculateTotalVolume(List<WorkoutSet> sets)
{
    return sets
        .Where(s => s.IsCompleted && s.ActualReps.HasValue && s.ActualWeight.HasValue)
        .Sum(s => s.ActualReps.Value * s.ActualWeight.Value);
}
```

**Example**:
- Set 1: 10 reps × 185 lbs = 1,850
- Set 2: 8 reps × 185 lbs = 1,480
- Set 3: 6 reps × 185 lbs = 1,110
- **Total Volume** = 4,440 lbs

**Frontend Usage**:
- API endpoint returns pre-calculated volume
- Frontend displays only; never recalculates

---

### 2. Macro Totals (Daily Nutrition)

**Formula**: Aggregate all `NutritionLog` entries for a user on a given date

```csharp
// In NutritionService.GetDailySummary()
public async Task<NutritionSummary> GetDailySummary(string userId, DateTime date)
{
    var logs = await _context.NutritionLogs
        .Where(l => l.UserId == userId && l.LogDate.Date == date.Date)
        .Include(l => l.Food)
        .ToListAsync();

    return new NutritionSummary
    {
        TotalCalories = logs.Sum(l => l.Food.CaloriesPer100g * l.Quantity / 100),
        TotalProtein = logs.Sum(l => l.Food.ProteinPer100g * l.Quantity / 100),
        TotalCarbs = logs.Sum(l => l.Food.CarbsPer100g * l.Quantity / 100),
        TotalFat = logs.Sum(l => l.Food.FatPer100g * l.Quantity / 100),
        TotalFiber = logs.Sum(l => l.Food.FiberPer100g * l.Quantity / 100),
        FoodCount = logs.Count,
    };
}
```

**Field Definitions** (from Food entity):
- `CaloriesPer100g`: kcal per 100g of food
- `ProteinPer100g`: grams per 100g
- `CarbsPer100g`: grams per 100g
- `FatPer100g`: grams per 100g
- `FiberPer100g`: grams per 100g

**Example**:
- Breakfast: 300g Chicken (31g protein per 100g) = 93g protein
- Lunch: 200g Rice (3g carbs per 100g) = 6g carbs
- **Daily Total**: 99g protein, 6g carbs, ...

**Constraints**:
- `Quantity` must be ≥ 0
- Quantities in grams
- Validation on NutritionLog DTO

---

### 3. Streak Calculation

**Definition**: Consecutive days with ≥1 completed workout

**Algorithm**:
```csharp
public async Task<int> GetStreakDays(string userId)
{
    var today = DateTime.UtcNow.Date;
    var workouts = await _context.Workouts
        .Where(w => w.UserId == userId && w.WorkoutDate <= today)
        .OrderByDescending(w => w.WorkoutDate.Date)
        .ToListAsync();

    int streak = 0;
    var currentDate = today;

    foreach (var workout in workouts.DistinctBy(w => w.WorkoutDate.Date))
    {
        if (workout.WorkoutDate.Date == currentDate)
        {
            streak++;
            currentDate = currentDate.AddDays(-1);
        }
        else
        {
            break; // Streak broken
        }
    }

    return streak;
}
```

**Edge Cases**:
- If no workout today, streak breaks (even if last workout was yesterday)
- Only counts completed workouts (IsCompleted = true)
- Distinct by date (only 1 workout per day counts)

---

### 4. Body Metrics

**Metrics Tracked** (Future feature):
- Weight (lbs/kg)
- BMI = Weight (kg) / (Height (m))²
- Body Fat % (manual entry or wearable sync)
- Measurements (chest, waist, thigh, etc.)

**Calculation**:
```csharp
public decimal CalculateBMI(decimal weightKg, decimal heightM)
{
    if (heightM <= 0) throw new ArgumentException("Height must be positive");
    return Math.Round(weightKg / (heightM * heightM), 1);
}
```

---

## Domain Entities & Constraints

### Exercise
```csharp
public class Exercise
{
    public string Id { get; set; }
    public string Name { get; set; }           // e.g., "Bench Press"
    public string BodySection { get; set; }    // "Chest", "Back", "Legs", etc.
    public string MuscleGroup { get; set; }    // "Pectorals", "Quadriceps", etc.
    public string Equipment { get; set; }      // "Barbell", "Dumbbell", "Machine", etc.
    public bool IsActive { get; set; }         // Soft delete
}
```

**Constraints**:
- Name is unique (case-insensitive)
- BodySection must be from approved list (validate in DTO)

---

### Workout & WorkoutSet
```csharp
public class Workout
{
    public string Id { get; set; }
    public string UserId { get; set; }         // FK to User
    public string Name { get; set; }           // e.g., "Chest & Triceps"
    public DateTime WorkoutDate { get; set; }  // When workout occurred
    public int DurationMinutes { get; set; }   // Total duration
    public string? Notes { get; set; }         // User notes
    public List<WorkoutSet> Sets { get; set; } // Individual sets
    public DateTime CreatedAt { get; set; }
}

public class WorkoutSet
{
    public string Id { get; set; }
    public string WorkoutId { get; set; }      // FK to Workout
    public string ExerciseId { get; set; }     // FK to Exercise
    public int SetNumber { get; set; }         // Order within workout
    
    // Planned (from WorkoutPlan)
    public int? TargetReps { get; set; }
    public decimal? TargetWeight { get; set; }
    
    // Actual (completed)
    public int? ActualReps { get; set; }
    public decimal? ActualWeight { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

**Business Rules**:
- Reps/Weight must be ≥ 0 if set
- Only one "active" (incomplete) workout per user at a time
- SetNumber must be sequential (1, 2, 3, ...) within workout
- ActualReps/Weight can only be set if IsCompleted = true

---

### WorkoutPlan & DayPlan
```csharp
public class WorkoutPlan
{
    public string Id { get; set; }
    public string UserId { get; set; }         // FK to User
    public DateTime StartDate { get; set; }    // Monday of plan week
    public List<DayPlan> DayPlans { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DayPlan
{
    public string Id { get; set; }
    public string WorkoutPlanId { get; set; }  // FK to WorkoutPlan
    public int DayOfWeek { get; set; }         // 0=Monday, 1=Tuesday, ..., 6=Sunday
    public bool IsRestDay { get; set; }
    public string? DayType { get; set; }       // e.g., "Chest & Triceps", "Leg Day"
    public string? PlanName { get; set; }
    public string? CustomPlanLabel { get; set; }
    public List<PlannedExercise> PlannedExercises { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PlannedExercise
{
    public string Id { get; set; }
    public string DayPlanId { get; set; }      // FK to DayPlan
    public string ExerciseId { get; set; }     // FK to Exercise
    public int TargetSets { get; set; }        // Number of sets planned
    public int TargetReps { get; set; }        // Reps per set
    public decimal TargetWeight { get; set; }  // Weight per set
    public int OrderIndex { get; set; }        // Order within day
}
```

**Business Rules**:
- StartDate is always the Monday of the plan week
- DayOfWeek: 0-6 (Monday-Sunday)
- PlannedExercises ordered by OrderIndex (0, 1, 2, ...)
- Only one active plan per user (current week)

---

### Nutrition Entities
```csharp
public class Food
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string? Brand { get; set; }
    public string? FdcId { get; set; }         // External ID (USDA FDC)
    
    // Per 100g nutritional values
    public decimal CaloriesPer100g { get; set; }
    public decimal ProteinPer100g { get; set; }
    public decimal CarbsPer100g { get; set; }
    public decimal FatPer100g { get; set; }
    public decimal FiberPer100g { get; set; }
    
    // Serving info
    public decimal? ServingSizeGrams { get; set; }
    public string? ServingUnit { get; set; }  // "cup", "tbsp", etc.
    public string? ServingText { get; set; }  // e.g., "1 cup (200g)"
    
    public DateTime CreatedAt { get; set; }
}

public class NutritionLog
{
    public string Id { get; set; }
    public string UserId { get; set; }         // FK to User
    public string FoodId { get; set; }         // FK to Food
    public decimal Quantity { get; set; }      // In grams
    public DateTime LogDate { get; set; }
    public string Meal { get; set; }           // "breakfast", "lunch", "dinner", "snack"
    public DateTime CreatedAt { get; set; }
}
```

**Constraints**:
- Quantity must be > 0
- Meal must be from enum: breakfast, lunch, dinner, snack
- CaloriesPer100g and macros must be ≥ 0

---

## API Aggregation Patterns

### Daily Nutrition Summary Endpoint
```
GET /api/nutrition/summary/{userId}?date=2026-03-27
Response:
{
  "date": "2026-03-27",
  "totalCalories": 2150,
  "totalProtein": 150,
  "totalCarbs": 220,
  "totalFat": 75,
  "totalFiber": 25,
  "meals": {
    "breakfast": [...],
    "lunch": [...],
    "dinner": [...],
    "snack": [...]
  }
}
```

### Leaderboard Endpoint (Future)
```
GET /api/leaderboard?sortBy=streak&limit=10
Response:
[
  {
    "userId": "user-1",
    "username": "John",
    "streakDays": 45,
    "volume": 50000,
    "pointsThisWeek": 1200
  },
  ...
]
```

---

## Validation Rules

### Frontend (for UX feedback ONLY)
- Reps: 1-100
- Weight: 0.5-500 lbs
- Quantity: 0.1-5000g
- **Backend validates authoritative**

### Backend (enforcement)
- All constraints in DTOs (FluentValidation or Data Annotations)
- Reject invalid input with 400 Bad Request
- Log validation failures for debugging

---

## Performance Considerations

| Calculation | Frequency | Optimization |
|-----------|-----------|-------------|
| Daily macro summary | Per screen load | SQL aggregation (not client-side) |
| Streak | Per profile view | Cache for 1 hour or invalidate on new workout |
| Volume per workout | Per workout complete | Calculated once, stored with sets |
| Leaderboard | Per feed load (future) | Materialized view or daily batch job |

---

## Testing Examples

### Volume Calculation Test
```csharp
[Fact]
public void CalculateTotalVolume_SumsSetsCorrectly()
{
    var sets = new List<WorkoutSet>
    {
        new() { ActualReps = 10, ActualWeight = 185, IsCompleted = true },
        new() { ActualReps = 8, ActualWeight = 185, IsCompleted = true },
        new() { ActualReps = 6, ActualWeight = 185, IsCompleted = true },
    };

    var volume = _service.CalculateTotalVolume(sets);

    Assert.Equal(4440, volume);
}

[Fact]
public void CalculateTotalVolume_IgnoresIncompleteOrNullSets()
{
    var sets = new List<WorkoutSet>
    {
        new() { ActualReps = 10, ActualWeight = 185, IsCompleted = true },
        new() { ActualReps = null, ActualWeight = 185, IsCompleted = true },
        new() { ActualReps = 8, ActualWeight = 185, IsCompleted = false },
    };

    var volume = _service.CalculateTotalVolume(sets);

    Assert.Equal(1850, volume); // Only first set
}
```

### Macro Summary Test
```csharp
[Fact]
public async Task GetDailySummary_AggregatesLogsCorrectly()
{
    // Arrange: Create 2 logs for same day
    var logs = new List<NutritionLog>
    {
        new() { FoodId = "chicken-id", Quantity = 300 }, // 93g protein
        new() { FoodId = "rice-id", Quantity = 200 },   // 6g carbs
    };

    // Act
    var summary = await _service.GetDailySummary(userId, date);

    // Assert
    Assert.Equal(99, summary.TotalProtein);
    Assert.Equal(6, summary.TotalCarbs);
}
```

---

## Reference

- Refer to `.github/project-brief.md` for core principles (DRY, SOLID, TDD)
- Refer to `backend-expert` skill for implementation patterns
- Refer to `mobile-expert` skill for frontend consumption patterns
