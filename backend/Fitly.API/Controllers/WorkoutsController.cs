using Microsoft.AspNetCore.Mvc;
using Fitly.API.DTOs;
using Fitly.API.Services;

namespace Fitly.API.Controllers
{
    [ApiController]
    [Route("api/users/{userId}/workouts")]
    public class WorkoutsController : ControllerBase
    {
        private readonly IWorkoutService _workoutService;

        public WorkoutsController(IWorkoutService workoutService)
        {
            _workoutService = workoutService;
        }

        /// <summary>
        /// Creates a new workout with sets for a user.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<WorkoutResponse>> CreateWorkout(int userId, CreateWorkoutRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Workout name is required." });

            if (!request.Sets.Any())
                return BadRequest(new { message = "At least one set is required." });

            try
            {
                var workout = await _workoutService.CreateWorkoutAsync(userId, request);
                return CreatedAtAction(nameof(GetWorkout), new { userId, id = workout.Id }, workout);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a specific workout with all its sets.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutResponse>> GetWorkout(int userId, int id)
        {
            var workout = await _workoutService.GetWorkoutByIdAsync(id);
            if (workout == null || workout.UserId != userId)
                return NotFound(new { message = $"Workout with ID {id} not found." });

            return Ok(workout);
        }

        /// <summary>
        /// Retrieves all workouts for a user.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<WorkoutResponse>>> GetUserWorkouts(int userId)
        {
            var workouts = await _workoutService.GetUserWorkoutsAsync(userId);
            return Ok(workouts);
        }

        /// <summary>
        /// Retrieves workouts for a user within a date range.
        /// </summary>
        [HttpGet("range")]
        public async Task<ActionResult<List<WorkoutResponse>>> GetUserWorkoutsByDateRange(
            int userId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (startDate > endDate)
                return BadRequest(new { message = "startDate must be before or equal to endDate." });

            var workouts = await _workoutService.GetUserWorkoutsAsync(userId, startDate, endDate);
            return Ok(workouts);
        }

        /// <summary>
        /// Deletes a workout and all its sets.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkout(int userId, int id)
        {
            var workout = await _workoutService.GetWorkoutByIdAsync(id);
            if (workout == null || workout.UserId != userId)
                return NotFound(new { message = $"Workout with ID {id} not found." });

            await _workoutService.DeleteWorkoutAsync(id);
            return NoContent();
        }
    }
}
