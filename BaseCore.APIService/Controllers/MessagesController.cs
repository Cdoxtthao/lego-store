using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MessagesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // User lấy lịch sử chat của mình
        [HttpGet("my")]
        public async Task<IActionResult> GetMyMessages()
        {
            var messages = await _context.Messages
                .Where(m => m.UserId == GetUserId())
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.IsFromUser,
                    m.IsRead,
                    m.CreatedAt,
                })
                .ToListAsync();

            return Ok(messages);
        }

        // Admin lấy danh sách conversations
        [Authorize(Roles = "Admin,Seller")]
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var conversations = await _context.Messages
                .Include(m => m.User)
                .GroupBy(m => m.UserId)
                .Select(g => new
                {
                    userId = g.Key,
                    userName = g.First().User.FullName,
                    userEmail = g.First().User.Email,
                    avatarUrl = g.First().User.AvatarUrl,
                    lastMessage = g.OrderByDescending(m => m.CreatedAt).First().Content,
                    lastTime = g.OrderByDescending(m => m.CreatedAt).First().CreatedAt,
                    unreadCount = g.Count(m => m.IsFromUser && !m.IsRead),
                    isFromUser = g.OrderByDescending(m => m.CreatedAt).First().IsFromUser,
                })
                .OrderByDescending(c => c.lastTime)
                .ToListAsync();

            return Ok(conversations);
        }

        // Admin lấy lịch sử chat với 1 user
        [Authorize(Roles = "Admin,Seller")]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserMessages(int userId)
        {
            // Đánh dấu đã đọc
            var unread = await _context.Messages
                .Where(m => m.UserId == userId && m.IsFromUser && !m.IsRead)
                .ToListAsync();
            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();

            var messages = await _context.Messages
                .Where(m => m.UserId == userId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.IsFromUser,
                    m.IsRead,
                    m.CreatedAt,
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}