namespace Fitly.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
        public ICollection<WorkoutPlan> WorkoutPlans { get; set; } = new List<WorkoutPlan>();
        public ICollection<NutritionLog> NutritionLogs { get; set; } = new List<NutritionLog>();
        public Chibi? Chibi { get; set; }
    }
}
