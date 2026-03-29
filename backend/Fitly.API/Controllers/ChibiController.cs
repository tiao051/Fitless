namespace Fitly.API.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Fitly.API.Services;
using Fitly.API.DTOs;
using System.Security.Claims;

[ApiController]
[Route("api/chibi")]
[Authorize]
public class ChibiController(
    IChibiService chibiService,
    IPointsService pointsService,
    ICosmeticShopService cosmeticShopService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    /// <summary>
    /// Generate initial chibi during onboarding
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(ChibiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateChib([FromBody] GenerateChibiRequest request)
    {
        var result = await chibiService.GenerateChibiAsync(UserId, request);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get current chibi state
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ChibiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChibi()
    {
        var result = await chibiService.GetChibiAsync(UserId);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Update chibi appearance (equip cosmetics)
    /// </summary>
    [HttpPut("appearance")]
    [ProducesResponseType(typeof(ChibiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAppearance([FromBody] UpdateChibiAppearanceRequest request)
    {
        var result = await chibiService.UpdateChibiAppearanceAsync(UserId, request);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Evolve chibi body layer based on 2-week fitness trends
    /// </summary>
    [HttpPost("evolve")]
    [ProducesResponseType(typeof(ChibiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EvolveBody()
    {
        var result = await chibiService.EvolveBodyLayerAsync(UserId);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get current points balance
    /// </summary>
    [HttpGet("points/balance")]
    [ProducesResponseType(typeof(PointsBalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPointsBalance()
    {
        var result = await pointsService.GetPointsBalanceAsync(UserId);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get points transaction history
    /// </summary>
    [HttpGet("points/history")]
    [ProducesResponseType(typeof(IEnumerable<PointsTransactionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPointsHistory([FromQuery] int limit = 50)
    {
        var result = await pointsService.GetPointsHistoryAsync(UserId, limit);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get cosmetic shop (available + owned items + balance)
    /// </summary>
    [HttpGet("cosmetics/shop")]
    [ProducesResponseType(typeof(CosmeticShopResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCosmeticShop([FromQuery] string? category = null)
    {
        var result = await cosmeticShopService.GetCosmeticShopAsync(UserId, category);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get available cosmetic items
    /// </summary>
    [HttpGet("cosmetics/available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CosmeticItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableCosmetics([FromQuery] string? category = null)
    {
        var result = await cosmeticShopService.GetAvailableItemsAsync(category);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Get user's owned cosmetics
    /// </summary>
    [HttpGet("cosmetics/owned")]
    [ProducesResponseType(typeof(IEnumerable<UserCosmeticItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOwnedCosmetics([FromQuery] string? category = null)
    {
        var result = await cosmeticShopService.GetUserOwnedCosmetics(UserId, category);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Data);
    }

    /// <summary>
    /// Purchase cosmetic item
    /// </summary>
    [HttpPost("cosmetics/purchase")]
    [ProducesResponseType(typeof(PurchaseCosmeticResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PurchaseCosmetic([FromBody] PurchaseCosmeticRequest request)
    {
        var result = await cosmeticShopService.PurchaseCosmeticAsync(UserId, request);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }
}
