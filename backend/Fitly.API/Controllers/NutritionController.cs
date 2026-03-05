using Microsoft.AspNetCore.Mvc;
using Fitly.API.DTOs;
using Fitly.API.Services;

namespace Fitly.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NutritionController : ControllerBase
    {
        private readonly INutritionService _nutritionService;

        public NutritionController(INutritionService nutritionService)
        {
            _nutritionService = nutritionService;
        }

        #region Food Management Endpoints

        /// <summary>
        /// Retrieves all foods in the database.
        /// </summary>
        [HttpGet("foods")]
        public async Task<ActionResult<List<FoodResponse>>> GetAllFoods()
        {
            var foods = await _nutritionService.GetAllFoodsAsync();
            return Ok(foods);
        }

        /// <summary>
        /// Searches foods by name.
        /// </summary>
        [HttpGet("foods/search")]
        public async Task<ActionResult<List<FoodResponse>>> SearchFoods([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Search query is required." });

            var foods = await _nutritionService.SearchFoodsAsync(name);
            return Ok(foods);
        }

        /// <summary>
        /// Retrieves a specific food by ID.
        /// </summary>
        [HttpGet("foods/{id}")]
        public async Task<ActionResult<FoodResponse>> GetFood(int id)
        {
            var food = await _nutritionService.GetFoodByIdAsync(id);
            if (food == null)
                return NotFound(new { message = $"Food with ID {id} not found." });

            return Ok(food);
        }

        /// <summary>
        /// Creates a new food entry.
        /// </summary>
        [HttpPost("foods")]
        public async Task<ActionResult<FoodResponse>> CreateFood(CreateFoodRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Food name is required." });

            if (request.CaloriesPer100g < 0 || request.ProteinPer100g < 0 || 
                request.CarbsPer100g < 0 || request.FatPer100g < 0)
            {
                return BadRequest(new { message = "Nutritional values cannot be negative." });
            }

            var food = await _nutritionService.CreateFoodAsync(request);
            return CreatedAtAction(nameof(GetFood), new { id = food.Id }, food);
        }

        #endregion

        #region Nutrition Logging Endpoints

        /// <summary>
        /// Logs a nutrition entry for a user.
        /// </summary>
        [HttpPost("logs/{userId}")]
        public async Task<ActionResult<NutritionLogResponse>> LogNutrition(int userId, CreateNutritionLogRequest request)
        {
            if (request.Quantity <= 0)
                return BadRequest(new { message = "Quantity must be greater than zero." });

            try
            {
                var log = await _nutritionService.LogNutritionAsync(userId, request);
                return CreatedAtAction(nameof(GetUserNutritionLogs), new { userId }, log);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves all nutrition logs for a user.
        /// </summary>
        [HttpGet("logs/{userId}")]
        public async Task<ActionResult<List<NutritionLogResponse>>> GetUserNutritionLogs(int userId)
        {
            var logs = await _nutritionService.GetUserNutritionLogsAsync(userId);
            return Ok(logs);
        }

        /// <summary>
        /// Retrieves daily nutrition summary for a specific date.
        /// </summary>
        [HttpGet("summary/{userId}")]
        public async Task<ActionResult<DailyNutritionSummaryResponse>> GetDailySummary(int userId, [FromQuery] DateTime date)
        {
            var summary = await _nutritionService.GetDailyNutritionSummaryAsync(userId, date);
            return Ok(summary);
        }

        /// <summary>
        /// Deletes a nutrition log entry.
        /// </summary>
        [HttpDelete("logs/{id}")]
        public async Task<IActionResult> DeleteNutritionLog(int id)
        {
            var success = await _nutritionService.DeleteNutritionLogAsync(id);
            if (!success)
                return NotFound(new { message = $"Nutrition log with ID {id} not found." });

            return NoContent();
        }

        #endregion
    }
}
