using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Fitly.API.Services
{
    /// <summary>
    /// Implementation of WorkoutPlan service for managing weekly workout plans
    /// </summary>
    public class WorkoutPlanService : IWorkoutPlanService
    {
        private readonly FitlyDbContext _context;

        public WorkoutPlanService(FitlyDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Save or update a weekly workout plan for a user
        /// </summary>
        public async Task<GetWeeklyPlanResponse> SaveWeeklyPlanAsync(int userId, SaveWeeklyPlanRequest request)
        {
            // Normalize start date to Monday
            var startDate = NormalizeToMonday(request.StartDate);

            // Check if plan already exists for this week
            var existingPlan = await _context.WorkoutPlans
                .Where(wp => wp.UserId == userId && wp.StartDate == startDate)
                .Include(wp => wp.DayPlans)
                .ThenInclude(dp => dp.PlannedExercises)
                .FirstOrDefaultAsync();

            WorkoutPlan plan;
            if (existingPlan != null)
            {
                // Update existing plan
                plan = existingPlan;
                _context.DayPlans.RemoveRange(plan.DayPlans); // Clear and rebuild days
                _context.SaveChanges();
            }
            else
            {
                // Create new plan
                plan = new WorkoutPlan
                {
                    UserId = userId,
                    StartDate = startDate,
                    CreatedAt = DateTime.UtcNow
                };
                _context.WorkoutPlans.Add(plan);
                _context.SaveChanges();
            }

            // Add day plans
            foreach (var dayDto in request.DayPlans)
            {
                var dayPlan = new DayPlan
                {
                    WorkoutPlanId = plan.Id,
                    DayOfWeek = dayDto.DayOfWeek,
                    IsRestDay = dayDto.IsRestDay,
                    CreatedAt = DateTime.UtcNow
                };
                _context.DayPlans.Add(dayPlan);
                _context.SaveChanges();

                // Add exercises for this day
                if (!dayDto.IsRestDay)
                {
                    foreach (var exerciseDto in dayDto.PlannedExercises)
                    {
                        var plannedExercise = new PlannedExercise
                        {
                            DayPlanId = dayPlan.Id,
                            ExerciseId = exerciseDto.ExerciseId,
                            TargetSets = exerciseDto.TargetSets,
                            TargetReps = exerciseDto.TargetReps,
                            TargetWeight = exerciseDto.TargetWeight,
                            OrderIndex = exerciseDto.OrderIndex,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.PlannedExercises.Add(plannedExercise);
                    }
                    _context.SaveChanges();
                }
            }

            // Return the saved plan as response
            return await GetWeeklyPlanResponseAsync(plan.Id);
        }

        /// <summary>
        /// Get the current or specified week's workout plan
        /// </summary>
        public async Task<GetWeeklyPlanResponse?> GetWeeklyPlanAsync(int userId, DateTime? startDate = null)
        {
            var normalizedDate = startDate.HasValue ? NormalizeToMonday(startDate.Value) : NormalizeToMonday(DateTime.UtcNow);

            var plan = await _context.WorkoutPlans
                .Where(wp => wp.UserId == userId && wp.StartDate == normalizedDate)
                .FirstOrDefaultAsync();

            if (plan == null)
                return null;

            return await GetWeeklyPlanResponseAsync(plan.Id);
        }

        /// <summary>
        /// Get today's workout plan for a user
        /// </summary>
        public async Task<TodayPlanResponse> GetTodayPlanAsync(int userId)
        {
            var today = DateTime.UtcNow;
            var dayOfWeek = GetDayOfWeekIndex(today);
            var startOfWeek = NormalizeToMonday(today);

            var plan = await _context.WorkoutPlans
                .Where(wp => wp.UserId == userId && wp.StartDate == startOfWeek)
                .Include(wp => wp.DayPlans)
                .ThenInclude(dp => dp.PlannedExercises)
                .ThenInclude(pe => pe.Exercise)
                .FirstOrDefaultAsync();

            if (plan == null)
            {
                return new TodayPlanResponse
                {
                    IsRestDay = true,
                    Date = today,
                    PlannedExercises = new()
                };
            }

            var dayPlan = plan.DayPlans.FirstOrDefault(dp => dp.DayOfWeek == dayOfWeek);
            if (dayPlan == null)
            {
                return new TodayPlanResponse
                {
                    IsRestDay = true,
                    Date = today,
                    PlannedExercises = new()
                };
            }

            var exercisesResponse = dayPlan.PlannedExercises
                .OrderBy(pe => pe.OrderIndex)
                .Select(pe => new PlannedExerciseResponse
                {
                    PlannedExerciseId = pe.Id,
                    ExerciseId = pe.ExerciseId,
                    ExerciseName = pe.Exercise.Name,
                    MuscleGroup = pe.Exercise.MuscleGroup,
                    TargetSets = pe.TargetSets,
                    TargetReps = pe.TargetReps,
                    TargetWeight = pe.TargetWeight,
                    OrderIndex = pe.OrderIndex
                })
                .ToList();

            return new TodayPlanResponse
            {
                IsRestDay = dayPlan.IsRestDay,
                Date = today,
                PlannedExercises = exercisesResponse
            };
        }

        /// <summary>
        /// Complete a set during a workout (records actual performance)
        /// </summary>
        public async Task<int> RecordWorkoutSetAsync(int userId, int plannedExerciseId, int setNumber, int actualReps, decimal actualWeight)
        {
            var plannedExercise = await _context.PlannedExercises
                .Where(pe => pe.Id == plannedExerciseId)
                .Include(pe => pe.DayPlan)
                .ThenInclude(dp => dp.WorkoutPlan)
                .FirstOrDefaultAsync();

            if (plannedExercise == null)
                throw new InvalidOperationException("Planned exercise not found");

            if (plannedExercise.DayPlan.WorkoutPlan.UserId != userId)
                throw new InvalidOperationException("Planned exercise does not belong to current user");

            var todayUtc = DateTime.UtcNow.Date;
            var tomorrowUtc = todayUtc.AddDays(1);

            var workout = await _context.Workouts
                .FirstOrDefaultAsync(w =>
                    w.UserId == userId &&
                    w.WorkoutDate >= todayUtc &&
                    w.WorkoutDate < tomorrowUtc &&
                    w.Name == "Today Plan Log");

            if (workout == null)
            {
                workout = new Workout
                {
                    UserId = userId,
                    Name = "Today Plan Log",
                    WorkoutDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Workouts.Add(workout);
                await _context.SaveChangesAsync();
            }

            var workoutSet = new WorkoutSet
            {
                WorkoutId = workout.Id,
                ExerciseId = plannedExercise.ExerciseId,
                ActualReps = actualReps,
                ActualWeight = actualWeight,
                TargetReps = plannedExercise.TargetReps,
                TargetWeight = plannedExercise.TargetWeight,
                SetNumber = setNumber,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            };

            _context.WorkoutSets.Add(workoutSet);
            await _context.SaveChangesAsync();

            return workoutSet.Id;
        }

        /// <summary>
        /// Helper: Get response object for a workout plan
        /// </summary>
        private async Task<GetWeeklyPlanResponse> GetWeeklyPlanResponseAsync(int workoutPlanId)
        {
            var plan = await _context.WorkoutPlans
                .Where(wp => wp.Id == workoutPlanId)
                .Include(wp => wp.DayPlans)
                .ThenInclude(dp => dp.PlannedExercises)
                .ThenInclude(pe => pe.Exercise)
                .FirstOrDefaultAsync();

            if (plan == null)
                throw new InvalidOperationException("Workout plan not found");

            var dayPlans = plan.DayPlans
                .OrderBy(dp => dp.DayOfWeek)
                .Select(dp => new DayPlanResponse
                {
                    DayOfWeek = dp.DayOfWeek,
                    IsRestDay = dp.IsRestDay,
                    PlannedExercises = dp.PlannedExercises
                        .OrderBy(pe => pe.OrderIndex)
                        .Select(pe => new PlannedExerciseResponse
                        {
                            PlannedExerciseId = pe.Id,
                            ExerciseId = pe.ExerciseId,
                            ExerciseName = pe.Exercise.Name,
                            MuscleGroup = pe.Exercise.MuscleGroup,
                            TargetSets = pe.TargetSets,
                            TargetReps = pe.TargetReps,
                            TargetWeight = pe.TargetWeight,
                            OrderIndex = pe.OrderIndex
                        })
                        .ToList()
                })
                .ToList();

            return new GetWeeklyPlanResponse
            {
                WorkoutPlanId = plan.Id,
                StartDate = plan.StartDate,
                DayPlans = dayPlans
            };
        }

        /// <summary>
        /// Helper: Convert any date to Monday of that week (UTC)
        /// </summary>
        private static DateTime NormalizeToMonday(DateTime date)
        {
            var dayOfWeek = (int)date.DayOfWeek;
            var daysToMonday = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so we need 6 days back
            return date.AddDays(-daysToMonday).Date;
        }

        /// <summary>
        /// Helper: Get day of week index (0 = Monday, 6 = Sunday)
        /// </summary>
        private static int GetDayOfWeekIndex(DateTime date)
        {
            var dayOfWeek = (int)date.DayOfWeek;
            return dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
        }
    }
}
