using BaseCore.DTO.Response;
using BaseCore.Repository.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        public UsersController(IUserRepository userRepo)
        {
            _userRepo = userRepo;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var user = await _userRepo.GetByIdAsync(GetUserId());
            if (user == null) return NotFound();
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                address = user.Address,
                avatarUrl = user.AvatarUrl,
                roleName = user.Role.Name,
                createdAt = user.CreatedAt,
            });
        }

        // PUT api/users/me
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
        {
            var user = await _userRepo.GetByIdAsync(GetUserId());
            if (user == null) return NotFound();

            user.FullName = request.FullName ?? user.FullName;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            user.Address = request.Address ?? user.Address;
            user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;

            await _userRepo.UpdateAsync(user);
            return Ok(new { message = "Cập nhật thành công" });
        }

        // PUT api/users/me/password
        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var user = await _userRepo.GetByIdAsync(GetUserId());
            if (user == null) return NotFound();

            // Kiểm tra mật khẩu cũ
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                return BadRequest(new { message = "Mật khẩu cũ không đúng" });

            if (request.NewPassword.Length < 6)
                return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _userRepo.UpdateAsync(user);
            return Ok(new { message = "Đổi mật khẩu thành công" });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? keyword = null)
                {
                    var users = await _userRepo.GetAllAsync(page, pageSize, keyword);
                    var total = await _userRepo.GetTotalCountAsync(keyword);
                    var response = users.Select(u => new
                    {
                        id = u.Id,
                        fullName = u.FullName,
                        email = u.Email,
                        phoneNumber = u.PhoneNumber,
                        address = u.Address,
                        roleName = u.Role.Name,
                        roleId = u.RoleId,
                        isActive = u.IsActive,
                        createdAt = u.CreatedAt,
                        avatarUrl = u.AvatarUrl,
                    });
                    return Ok(new { items = response, totalCount = total });
                }

                [Authorize(Roles = "Admin")]
                [HttpPut("{id}/role")]
                public async Task<IActionResult> UpdateRole(int id, [FromBody] int roleId)
                {
                    var user = await _userRepo.GetByIdAsync(id);
                    if (user == null) return NotFound();
                    user.RoleId = roleId;
                    await _userRepo.UpdateAsync(user);
                    return Ok(new { message = "Cập nhật vai trò thành công" });
                }

    }
}