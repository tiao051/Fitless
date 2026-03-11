using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Fitly.API.DTOs;
using Fitly.API.Services;

namespace Fitly.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExercisesController : ControllerBase
    {
        private readonly IExerciseService _exerciseService;

        public ExercisesController(IExerciseService exerciseService)
        {
            _exerciseService = exerciseService;
        }

        /// <summary>
        /// Retrieves all available exercises.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ExerciseResponse>>> GetAllExercises()
        {
            var exercises = await _exerciseService.GetAllExercisesAsync();
            return Ok(exercises);
        }

        /// <summary>
        /// Retrieves a specific exercise by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ExerciseResponse>> GetExercise(int id)
        {
            var exercise = await _exerciseService.GetExerciseByIdAsync(id);
            if (exercise == null)
                return NotFound(new { message = $"Exercise with ID {id} not found." });

            return Ok(exercise);
        }

        /// <summary>
        /// Creates a new exercise.
        /// </summary>
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ExerciseResponse>> CreateExercise(CreateExerciseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.MuscleGroup))
                return BadRequest(new { message = "Name and MuscleGroup are required." });

            var exercise = await _exerciseService.CreateExerciseAsync(request);
            return CreatedAtAction(nameof(GetExercise), new { id = exercise.Id }, exercise);
        }

        /// <summary>
        /// Updates an existing exercise.
        /// </summary>
        [Authorize]
        [HttpPut("{id}")]
        public async Task<ActionResult<ExerciseResponse>> UpdateExercise(int id, CreateExerciseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.MuscleGroup))
                return BadRequest(new { message = "Name and MuscleGroup are required." });

            var exercise = await _exerciseService.UpdateExerciseAsync(id, request);
            if (exercise == null)
                return NotFound(new { message = $"Exercise with ID {id} not found." });

            return Ok(exercise);
        }

        /// <summary>
        /// Deletes an exercise.
        /// </summary>
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExercise(int id)
        {
            var success = await _exerciseService.DeleteExerciseAsync(id);
            if (!success)
                return NotFound(new { message = $"Exercise with ID {id} not found." });

            return NoContent();
        }
    }
}
