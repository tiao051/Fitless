using Fitly.API.DTOs;
using Fitly.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Fitly.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class WorkoutPlansController : ControllerBase
    {
        private readonly IWorkoutPlanService _workoutPlanService;
        private readonly ILogger<WorkoutPlansController> _logger;

        public WorkoutPlansController(IWorkoutPlanService workoutPlanService, ILogger<WorkoutPlansController> logger)
        {
            _workoutPlanService = workoutPlanService;
            _logger = logger;
        }

        /// <summary>
        /// Save or update a weekly workout plan
        /// POST /api/workoutplans
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<GetWeeklyPlanResponse>> SaveWeeklyPlan([FromBody] SaveWeeklyPlanRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user context");
                }

                var result = await _workoutPlanService.SaveWeeklyPlanAsync(userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving workout plan for user");
                return BadRequest(new { message = "Error saving workout plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Get current week's workout plan
        /// GET /api/workoutplans/current
        /// </summary>
        [HttpGet("current")]
        public async Task<ActionResult<GetWeeklyPlanResponse>> GetCurrentWeekPlan()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user context");
                }

                var result = await _workoutPlanService.GetWeeklyPlanAsync(userId);
                if (result == null)
                {
                    return NotFound(new { message = "No workout plan found for current week" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving workout plan");
                return BadRequest(new { message = "Error retrieving workout plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Get workout plan for a specific week
        /// GET /api/workoutplans/week?startDate=2025-01-13
        /// </summary>
        [HttpGet("week")]
        public async Task<ActionResult<GetWeeklyPlanResponse>> GetWeekPlan([FromQuery] DateTime startDate)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user context");
                }

                var result = await _workoutPlanService.GetWeeklyPlanAsync(userId, startDate);
                if (result == null)
                {
                    return NotFound(new { message = "No workout plan found for specified week" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving workout plan");
                return BadRequest(new { message = "Error retrieving workout plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Get today's workout plan
        /// GET /api/workoutplans/today
        /// </summary>
        [HttpGet("today")]
        public async Task<ActionResult<TodayPlanResponse>> GetTodayPlan()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user context");
                }

                var result = await _workoutPlanService.GetTodayPlanAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving today's workout plan");
                return BadRequest(new { message = "Error retrieving today's workout plan", error = ex.Message });
            }
        }

        /// <summary>
        /// Record a completed set during a workout
        /// POST /api/workoutplans/sets
        /// </summary>
        [HttpPost("sets")]
        public async Task<ActionResult<int>> RecordWorkoutSet([FromBody] RecordSetRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Invalid user context");
                }

                var result = await _workoutPlanService.RecordWorkoutSetAsync(
                    userId,
                    request.PlannedExerciseId,
                    request.SetNumber,
                    request.ActualReps,
                    request.ActualWeight
                );

                return Ok(new { workoutSetId = result });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording workout set");
                return BadRequest(new { message = "Error recording workout set", error = ex.Message });
            }
        }
    }

    /// <summary>
    /// Request model for recording a completed set
    /// </summary>
    public class RecordSetRequest
    {
        public int PlannedExerciseId { get; set; }
        public int SetNumber { get; set; }
        public int ActualReps { get; set; }
        public decimal ActualWeight { get; set; }
    }
}
