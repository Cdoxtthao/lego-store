using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using BaseCore.APIService.Hubs;
using BaseCore.APIService.Helpers;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BirthdayController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public BirthdayController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        public class ChildRequest
        {
            public string? Name { get; set; }
            public string? Gender { get; set; }
            public int? Age { get; set; }
            public DateTime? BirthDate { get; set; }
        }

        // GET api/birthday — thông tin sinh nhật của tôi
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();

            // Tự động kiểm tra và tạo mã quà sinh nhật cho các con của user nếu đến tháng sinh nhật
            await NotificationHelper.CheckBirthdayVouchersAsync(_context, _hubContext, userId);

            var user = await _context.Users.FindAsync(userId);
            var children = await _context.ChildProfiles
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Id)
                .Select(c => new { c.Id, c.Name, c.Gender, c.Age, c.BirthDate })
                .ToListAsync();

            return Ok(new
            {
                editCount = user?.BirthdayEditCount ?? 0,
                rewardReceived = user?.BirthdayRewardReceived ?? false,
                canEdit = (user?.BirthdayRewardReceived ?? false) || (user?.BirthdayEditCount ?? 0) < 3,
                children,
            });
        }

        // Kiểm tra quyền sửa: chỉ cho sửa tối đa 3 lần trước khi nhận mã lần đầu
        private bool CanEdit(User user) => user.BirthdayRewardReceived || user.BirthdayEditCount < 3;

        // POST api/birthday/children — thêm con
        [HttpPost("children")]
        public async Task<IActionResult> AddChild([FromBody] ChildRequest req)
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return Unauthorized();
            if (!CanEdit(user))
                return BadRequest(new { message = "Bạn đã sửa thông tin sinh nhật 3 lần. Không thể sửa thêm trước khi nhận mã đầu tiên." });

            _context.ChildProfiles.Add(new ChildProfile
            {
                UserId = user.Id,
                Name = req.Name,
                Gender = req.Gender,
                Age = req.Age,
                BirthDate = req.BirthDate,
                CreatedAt = DateTime.UtcNow,
            });
            user.BirthdayEditCount += 1;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã thêm", editCount = user.BirthdayEditCount });
        }

        // PUT api/birthday/children/{id} — sửa con
        [HttpPut("children/{id}")]
        public async Task<IActionResult> UpdateChild(int id, [FromBody] ChildRequest req)
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return Unauthorized();
            var child = await _context.ChildProfiles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);
            if (child == null) return NotFound();
            if (!CanEdit(user))
                return BadRequest(new { message = "Bạn đã sửa thông tin sinh nhật 3 lần. Không thể sửa thêm trước khi nhận mã đầu tiên." });

            child.Name = req.Name;
            child.Gender = req.Gender;
            child.Age = req.Age;
            child.BirthDate = req.BirthDate;
            user.BirthdayEditCount += 1;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã cập nhật", editCount = user.BirthdayEditCount });
        }

        // DELETE api/birthday/children/{id}
        [HttpDelete("children/{id}")]
        public async Task<IActionResult> DeleteChild(int id)
        {
            var userId = GetUserId();
            var child = await _context.ChildProfiles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (child == null) return NotFound();
            _context.ChildProfiles.Remove(child);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa" });
        }
    }
}
