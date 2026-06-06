using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private string GetUserRole() =>
            Context.User!.FindFirst(ClaimTypes.Role)?.Value ?? "";

        // User gửi tin nhắn
        public async Task SendMessage(string content)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            // Lưu vào DB
            var message = new Message
            {
                UserId = userId,
                Content = content,
                IsFromUser = true,
                CreatedAt = DateTime.UtcNow,
            };
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Gửi cho user
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                content = message.Content,
                isFromUser = true,
                userName = user?.FullName,
                userId,
                createdAt = message.CreatedAt,
            });

            // Gửi cho tất cả Admin đang online
            await Clients.Group("Admins").SendAsync("ReceiveUserMessage", new
            {
                id = message.Id,
                content = message.Content,
                isFromUser = true,
                userName = user?.FullName,
                userId,
                createdAt = message.CreatedAt,
            });
        }

        // Admin reply tin nhắn
        public async Task ReplyMessage(int targetUserId, string content)
        {
            var adminId = GetUserId();
            var admin = await _context.Users.FindAsync(adminId);

            // Lưu vào DB
            var message = new Message
            {
                UserId = targetUserId,
                Content = content,
                IsFromUser = false,
                CreatedAt = DateTime.UtcNow,
            };
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Gửi cho user target
            await Clients.Group($"User_{targetUserId}").SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                content = message.Content,
                isFromUser = false,
                userName = admin?.FullName,
                userId = targetUserId,
                createdAt = message.CreatedAt,
            });

            // Gửi lại cho tất cả Admin
            await Clients.Group("Admins").SendAsync("ReceiveUserMessage", new
            {
                id = message.Id,
                content = message.Content,
                isFromUser = false,
                userName = admin?.FullName,
                userId = targetUserId,
                createdAt = message.CreatedAt,
            });
        }

        // Đánh dấu đã đọc
        public async Task MarkAsRead(int userId)
        {
            var messages = await _context.Messages
                .Where(m => m.UserId == userId && m.IsFromUser && !m.IsRead)
                .ToListAsync();

            messages.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();
        }

        public override async Task OnConnectedAsync()
        {
            var role = GetUserRole();
            var userId = GetUserId();

            if (role == "Admin" || role == "Seller")
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var role = GetUserRole();
            if (role == "Admin" || role == "Seller")
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");

            await base.OnDisconnectedAsync(exception);
        }
    }
}