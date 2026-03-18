using Microsoft.EntityFrameworkCore;
using Fitly.API.Models;

namespace Fitly.API.Data
{
    public class FitlyDbContext : DbContext
    {
        public FitlyDbContext(DbContextOptions<FitlyDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<Workout> Workouts { get; set; }
        public DbSet<WorkoutSet> WorkoutSets { get; set; }
        public DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        public DbSet<DayPlan> DayPlans { get; set; }
        public DbSet<PlannedExercise> PlannedExercises { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<NutritionLog> NutritionLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Exercise
            modelBuilder.Entity<Exercise>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.MuscleGroup).IsRequired().HasMaxLength(100);
            });

            // Workout
            modelBuilder.Entity<Workout>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Workouts)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WorkoutSet
            modelBuilder.Entity<WorkoutSet>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ActualWeight).HasPrecision(10, 2);
                entity.Property(e => e.TargetWeight).HasPrecision(10, 2);
                entity.HasOne(e => e.Workout)
                    .WithMany(w => w.Sets)
                    .HasForeignKey(e => e.WorkoutId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Exercise)
                    .WithMany(ex => ex.WorkoutSets)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WorkoutPlan
            modelBuilder.Entity<WorkoutPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StartDate).IsRequired();
                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutPlans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.DayPlans)
                    .WithOne(d => d.WorkoutPlan)
                    .HasForeignKey(d => d.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // DayPlan
            modelBuilder.Entity<DayPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DayOfWeek).IsRequired();
                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.DayPlans)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.PlannedExercises)
                    .WithOne(pe => pe.DayPlan)
                    .HasForeignKey(pe => pe.DayPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // PlannedExercise
            modelBuilder.Entity<PlannedExercise>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TargetReps).IsRequired();
                entity.Property(e => e.TargetSets).IsRequired();
                entity.Property(e => e.TargetWeight).HasPrecision(10, 2);
                entity.HasOne(e => e.DayPlan)
                    .WithMany(dp => dp.PlannedExercises)
                    .HasForeignKey(e => e.DayPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Exercise)
                    .WithMany()
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Food
            modelBuilder.Entity<Food>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Brand).HasMaxLength(100);
                entity.Property(e => e.ServingUnit).HasMaxLength(20);
                entity.Property(e => e.ServingText).HasMaxLength(100);
                
                // Precision for nutritional values
                entity.Property(e => e.CaloriesPer100g).HasPrecision(10, 2);
                entity.Property(e => e.ProteinPer100g).HasPrecision(10, 2);
                entity.Property(e => e.CarbsPer100g).HasPrecision(10, 2);
                entity.Property(e => e.FatPer100g).HasPrecision(10, 2);
                entity.Property(e => e.FiberPer100g).HasPrecision(10, 2);
                entity.Property(e => e.ServingSize).HasPrecision(10, 2);
                
                // Indexes for search and filtering
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.Brand);
                entity.HasIndex(e => e.IsGeneric);
            });

            // NutritionLog
            modelBuilder.Entity<NutritionLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(10, 2);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.NutritionLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Food)
                    .WithMany(f => f.NutritionLogs)
                    .HasForeignKey(e => e.FoodId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
