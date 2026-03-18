using Fitly.API.Data;
using Fitly.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Fitly.API.Services
{
    /// <summary>
    /// Seeder for populating the Exercise database with curated workout movements.
    /// </summary>
    public class ExerciseSeeder
    {
        private readonly FitlyDbContext _context;
        private readonly ILogger<ExerciseSeeder> _logger;

        public ExerciseSeeder(FitlyDbContext context, ILogger<ExerciseSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedExercisesAsync()
        {
            try
            {
                var seedItems = GetSeedItems();
                var existingExercises = await _context.Exercises.ToListAsync();
                var existingMap = existingExercises.ToDictionary(e => e.Name, StringComparer.OrdinalIgnoreCase);

                var inserted = 0;
                var updated = 0;

                foreach (var item in seedItems)
                {
                    if (existingMap.TryGetValue(item.Name, out var existing))
                    {
                        existing.BodySection = item.BodySection;
                        existing.MuscleGroup = item.MuscleGroup;
                        existing.Equipment = item.Equipment;
                        existing.Description = item.Description;
                        updated++;
                    }
                    else
                    {
                        _context.Exercises.Add(new Exercise
                        {
                            Name = item.Name,
                            BodySection = item.BodySection,
                            MuscleGroup = item.MuscleGroup,
                            Equipment = item.Equipment,
                            Description = item.Description
                        });
                        inserted++;
                    }
                }

                if (inserted == 0 && updated == 0)
                {
                    _logger.LogInformation("Exercises already seeded. Skipping exercise seed.");
                    return;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Exercise seed completed. Inserted: {Inserted}, Updated: {Updated}", inserted, updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding exercises");
                throw;
            }
        }

        private static List<ExerciseSeedItem> GetSeedItems() =>
        [
            new("Barbell Bench Press", "Upper", "Chest", "Barbell", "Lying on a flat bench, lower the barbell to mid-chest level and press it up until arms are fully extended."),
            new("Dumbbell Bench Press", "Upper", "Chest", "Dumbbells", "Lying on a flat bench, press the dumbbells upward while squeezing the chest muscles at the top."),
            new("Incline Barbell Press", "Upper", "Chest", "Barbell", "Perform a bench press on an inclined bench to target the upper pectoral muscles."),
            new("Incline Dumbbell Press", "Upper", "Chest", "Dumbbells", "Use dumbbells on an incline bench to develop the upper chest with a greater range of motion."),
            new("Decline Barbell Press", "Upper", "Chest", "Barbell", "Press the barbell on a decline bench to focus on the lower pectoral muscles."),
            new("Chest Fly", "Upper", "Chest", "Dumbbells", "Open arms wide in a controlled arc and squeeze them together to stretch and contract the chest fibers."),
            new("Cable Crossover", "Upper", "Chest", "Cable", "Pull cables from sides to the center of the chest to create definition and inner chest thickness."),
            new("Push-up", "Upper", "Chest", "Bodyweight", "A fundamental bodyweight exercise targeting the chest, shoulders, and triceps."),
            new("Dips", "Upper", "Chest", "Parallel Bars", "Lean forward while dipping on bars to focus the tension on the lower chest."),
            new("Pec Deck Machine", "Upper", "Chest", "Machine", "Use the machine to isolate the chest muscles through a guided fly motion."),
            new("Landmine Press", "Upper", "Chest", "Landmine", "Press a barbell anchored in a landmine attachment to target the upper chest and shoulders."),
            new("Dumbbell Pullover", "Upper", "Chest", "Dumbbell", "Lie across a bench and lower a dumbbell behind the head to stretch the chest and lats."),

            new("Deadlift", "Lower", "Back", "Barbell", "A compound movement involving lifting a loaded barbell from the ground to a standing position."),
            new("Pull-up", "Upper", "Back", "Pull-up Bar", "Pull your body up until the chin clears the bar to develop back width and lat strength."),
            new("Lat Pulldown", "Upper", "Back", "Machine", "Pull the bar down toward the upper chest to isolate the latissimus dorsi muscles."),
            new("Bent Over Row", "Upper", "Back", "Barbell", "Hinge forward and pull the barbell toward the abdomen to build back thickness."),
            new("One-Arm Dumbbell Row", "Upper", "Back", "Dumbbells", "Pull a dumbbell to the hip while supporting the body with the other hand to correct back imbalances."),
            new("Seated Cable Row", "Upper", "Back", "Cable", "Pull the handle toward the waist while seated to target the mid-back and rhomboids."),
            new("T-Bar Row", "Upper", "Back", "Barbell", "A heavy rowing variation using a T-bar station to build massive back volume."),
            new("Hyperextension", "Lower", "Back", "Bench", "Bend at the waist on a specialized bench to strengthen the lower back (erector spinae)."),
            new("Face Pull", "Upper", "Back", "Cable", "Pull the rope toward the face to strengthen the rear deltoids and upper back."),
            new("Straight Arm Pulldown", "Upper", "Back", "Cable", "Keep arms straight while pulling the bar down to isolate the lats."),
            new("Rack Pull", "Upper", "Back", "Barbell", "A partial range deadlift performed from knee height to focus on the upper back and traps."),
            new("Pendlay Row", "Upper", "Back", "Barbell", "A strict rowing variation where the barbell starts from the floor on every rep."),

            new("Overhead Press", "Upper", "Shoulders", "Barbell", "Press the barbell over the head while standing to build overall shoulder power."),
            new("Dumbbell Shoulder Press", "Upper", "Shoulders", "Dumbbells", "Seated or standing press using dumbbells for a more natural shoulder range of motion."),
            new("Lateral Raise", "Upper", "Shoulders", "Dumbbells", "Raise dumbbells to the sides to develop the width of the lateral deltoids."),
            new("Front Raise", "Upper", "Shoulders", "Dumbbells", "Lift dumbbells in front of the body to isolate the anterior deltoids."),
            new("Rear Delt Fly", "Upper", "Shoulders", "Dumbbells", "Bend over and raise weights to the sides to target the posterior deltoids."),
            new("Arnold Press", "Upper", "Shoulders", "Dumbbells", "A press variation with a wrist rotation to hit all three shoulder heads."),
            new("Upright Row", "Upper", "Shoulders", "Barbell", "Pull the barbell vertically toward the chin to target the shoulders and upper traps."),
            new("Shrugs", "Upper", "Shoulders", "Dumbbells", "Elevate the shoulders toward the ears to build the trapezius muscles."),
            new("Reverse Pec Deck", "Upper", "Shoulders", "Machine", "Use the machine to isolate the rear deltoids through a reverse fly motion."),
            new("Lu Raise", "Upper", "Shoulders", "Plates", "Raise light plates in a full arc from hips to overhead for mobility and side delt growth."),

            new("Barbell Squat", "Lower", "Legs", "Barbell", "The king of leg exercises, involving lowering the hips with a barbell on the shoulders."),
            new("Leg Press", "Lower", "Legs", "Machine", "Push a weighted platform away with the legs to focus on the quadriceps."),
            new("Lunges", "Lower", "Legs", "Dumbbells", "Step forward and lower the hips to target the quads, hamstrings, and glutes."),
            new("Leg Extension", "Lower", "Legs", "Machine", "Sit and extend the legs to isolate the quadriceps muscles."),
            new("Leg Curl", "Lower", "Legs", "Machine", "Curl the legs to isolate the hamstrings (back of the thighs)."),
            new("Romanian Deadlift", "Lower", "Legs", "Barbell", "Focus on the hamstring and glute stretch by lowering the bar while keeping legs relatively straight."),
            new("Bulgarian Split Squat", "Lower", "Legs", "Dumbbells", "A single-leg squat with the rear foot elevated on a bench for deep glute activation."),
            new("Hack Squat", "Lower", "Legs", "Machine", "A machine-based squat that stabilizes the spine and targets the lower quads."),
            new("Front Squat", "Lower", "Legs", "Barbell", "Squat with the barbell held in front on the shoulders to emphasize the quadriceps."),
            new("Box Squat", "Lower", "Legs", "Barbell", "Squat down until sitting on a box to build explosive power and correct form."),

            new("Hip Thrust", "Lower", "Glutes", "Barbell", "Drive the hips upward with a barbell across the lap to maximize glute growth."),
            new("Glute Bridge", "Lower", "Glutes", "Bodyweight", "Lie on the back and lift the hips to activate the glutes and core."),
            new("Cable Glute Kickback", "Lower", "Glutes", "Cable", "Kick the leg backward against cable resistance to isolate the gluteus maximus."),
            new("Abduction Machine", "Lower", "Glutes", "Machine", "Push the legs outward on a machine to target the gluteus medius."),
            new("Sumo Squat", "Lower", "Legs", "Dumbbell", "A wide-stance squat that emphasizes the inner thighs and glutes."),

            new("Standing Calf Raise", "Lower", "Calves", "Machine", "Raise the heels while standing to build the gastrocnemius muscles."),
            new("Seated Calf Raise", "Lower", "Calves", "Machine", "Perform calf raises while seated to target the deeper soleus muscle."),

            new("Barbell Bicep Curl", "Upper", "Arms", "Barbell", "Curl a barbell to build the overall mass of the biceps."),
            new("Dumbbell Bicep Curl", "Upper", "Arms", "Dumbbells", "Standard curl using dumbbells for individual arm focus."),
            new("Hammer Curl", "Upper", "Arms", "Dumbbells", "Curl with palms facing inward to target the brachialis and forearms."),
            new("Preacher Curl", "Upper", "Arms", "EZ-Bar", "Curl over a sloped bench to isolate the biceps by preventing momentum."),
            new("Concentration Curl", "Upper", "Arms", "Dumbbells", "Seated curl with the arm against the inner thigh to peak the biceps."),
            new("Spider Curl", "Upper", "Arms", "Barbell", "Curl while leaning forward on an incline bench to keep constant tension on the biceps."),
            new("Tricep Pushdown", "Upper", "Arms", "Cable", "Push a cable attachment down to isolate the triceps."),
            new("Skull Crusher", "Upper", "Arms", "EZ-Bar", "Lower a bar toward the forehead and extend upward to build triceps mass."),
            new("Overhead Tricep Extension", "Upper", "Arms", "Dumbbell", "Hold a dumbbell behind the head and extend arms upward."),
            new("Close Grip Bench Press", "Upper", "Arms", "Barbell", "Bench press with a narrow grip to emphasize the triceps."),

            new("Plank", "Core", "Abs", "Bodyweight", "Hold a rigid body position on elbows and toes to build core stability."),
            new("Crunches", "Core", "Abs", "Bodyweight", "A basic abdominal exercise focusing on the upper abs."),
            new("Hanging Leg Raise", "Core", "Abs", "Pull-up Bar", "Lift the legs while hanging to target the lower abdominal muscles."),
            new("Russian Twist", "Core", "Abs", "Dumbbell", "Rotate the torso side-to-side while seated to target the obliques."),
            new("Bicycle Crunch", "Core", "Abs", "Bodyweight", "A dynamic crunch involving a pedaling motion for full ab engagement."),
            new("Leg Raise", "Core", "Abs", "Bodyweight", "Lie on the back and lift straight legs to work the lower abs."),
            new("Mountain Climber", "Core", "Abs", "Bodyweight", "Perform a running motion in a plank position for core and cardio."),
            new("Ab Wheel Rollout", "Core", "Abs", "Ab Wheel", "Roll forward and back using an ab wheel to challenge core strength."),
            new("Side Plank", "Core", "Abs", "Bodyweight", "Hold a side-lying position on one elbow to isolate the obliques."),
            new("Woodchopper", "Core", "Abs", "Cable", "A rotational cable movement mimicking a chopping motion for the core."),
            new("Dead Bug", "Core", "Abs", "Bodyweight", "Slowly lower opposite arm and leg while lying on the back to stabilize the core."),
            new("V-Up", "Core", "Abs", "Bodyweight", "Simultaneously lift torso and legs to meet in a V-shape."),
            new("Flutter Kicks", "Core", "Abs", "Bodyweight", "Lie on the back and perform small, rapid leg kicks for lower ab endurance."),
            new("Dragon Flag", "Core", "Abs", "Bench", "An advanced core exercise where the entire body is lifted vertically on a bench."),

            new("Kettlebell Swing", "Lower", "Full Body", "Kettlebell", "Swing a kettlebell between the legs to the chest level for power and cardio."),
            new("Clean and Press", "Upper", "Full Body", "Barbell", "Lift the bar from floor to shoulders, then press overhead."),
            new("Burpee", "Full Body", "Full Body", "Bodyweight", "A full-body exercise combining a squat, push-up, and jump."),
            new("Turkish Get-up", "Full Body", "Full Body", "Kettlebell", "A complex movement rising from the floor to standing while holding a weight overhead."),
            new("Farmer's Walk", "Full Body", "Full Body", "Dumbbells", "Walk while holding heavy weights to build grip and core stability."),
            new("Medicine Ball Slam", "Full Body", "Full Body", "Medicine Ball", "Slam a ball into the ground with full force for explosive power."),
            new("Box Jump", "Lower", "Legs", "Box", "Jump onto a sturdy box to develop explosive leg power."),
            new("Wall Sit", "Lower", "Legs", "Wall", "Hold a squat position against a wall to build isometric quad strength."),
            new("Good Morning", "Lower", "Back/Legs", "Barbell", "Hinge forward with a barbell on shoulders to target the hamstrings and lower back."),
            new("Zottman Curl", "Upper", "Arms", "Dumbbells", "Bicep curl with palms up on the way up and palms down on the way down for forearm growth."),
            new("Battle Ropes", "Upper", "Arms/Core", "Ropes", "Create waves in heavy ropes for upper body conditioning and core strength."),
            new("Thruster", "Full Body", "Full Body", "Barbell", "A combined movement of a front squat and an overhead press.")
        ];

        private sealed record ExerciseSeedItem(
            string Name,
            string BodySection,
            string MuscleGroup,
            string Equipment,
            string Description
        );
    }
}
