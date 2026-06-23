using BaseCore.DTO.Request;
using BaseCore.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }


        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                if (result == null) return Unauthorized(new { message = "Email hoac mat khau khong dung" });
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Tài khoản bị khoá
                return StatusCode(403, new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            if (!result) return BadRequest(new { message = "Email da ton tai" });
            return Ok(new { message = "Dang ky thanh cong" });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);
            var result = await _authService.GetCurrentUserAsync(userId);
            if (result == null) return NotFound();
            return Ok(result);
        }
        
         
    }
}
