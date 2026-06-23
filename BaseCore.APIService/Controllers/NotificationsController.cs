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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public NotificationsController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET api/notifications/my — danh sách thông báo của tôi (mới nhất trước)
        [HttpGet("my")]
        public async Task<IActionResult> GetMy([FromQuery] int take = 50)
        {
            var userId = GetUserId();

            // Tự động kiểm tra và tạo mã quà sinh nhật cho các con của user nếu đến tháng sinh nhật
            await NotificationHelper.CheckBirthdayVouchersAsync(_context, _hubContext, userId);

            if (take <= 0 || take > 200) take = 50;


            var items = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .Select(n => new
                {
                    id = n.Id,
                    type = n.Type,
                    orderId = n.OrderId,
                    status = n.Status,
                    title = n.Title,
                    message = n.Message,
                    imageUrl = n.ImageUrl,
                    reason = n.Reason,
                    isRead = n.IsRead,
                    createdAt = n.CreatedAt,
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var userId = GetUserId();
            var count = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
            return Ok(new { count });
        }

        // PUT api/notifications/{id}/read — đánh dấu đã đọc 1 thông báo
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId = GetUserId();
            var noti = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (noti == null) return NotFound();
            noti.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đọc" });
        }

        // PUT api/notifications/read-all — đánh dấu tất cả đã đọc
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId = GetUserId();
            var list = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();
            foreach (var n in list) n.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đọc tất cả", updated = list.Count });
        }

        // DELETE api/notifications/{id} — xóa 1 thông báo
        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var userId = GetUserId();
            var noti = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (noti == null) return NotFound();
            _context.Notifications.Remove(noti);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa" });
        }

        // DELETE api/notifications — xóa tất cả thông báo của tôi
        [HttpDelete]
        public async Task<IActionResult> Clear()
        {
            var userId = GetUserId();
            var list = await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();
            _context.Notifications.RemoveRange(list);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa tất cả" });
        }
    }
}
