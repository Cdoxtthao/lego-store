using BaseCore.APIService.Hubs;
using BaseCore.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Helpers
{
    // Tập trung việc tạo + lưu + đẩy thông báo real-time tới người dùng
    public static class NotificationHelper
    {
        // Map trạng thái đơn -> (tiêu đề, nội dung)
        private static (string Title, string Message) MapOrder(int orderId, string status) => status switch
        {
            "Pending"   => ("Đặt hàng thành công", $"Đơn hàng #{orderId} của bạn đã được tạo và đang chờ xác nhận."),
            "Confirmed" => ("Đơn hàng đã được xác nhận", $"Đơn hàng #{orderId} đã được xác nhận và đang được chuẩn bị."),
            "Shipping"  => ("Đơn hàng đang được giao", $"Đơn hàng #{orderId} đang trên đường giao đến bạn."),
            "Delivered" => ("Đã nhận hàng", $"Đơn hàng #{orderId} đã giao thành công. Cảm ơn bạn!"),
            "Cancelled" => ("Đơn hàng đã bị hủy", $"Đơn hàng #{orderId} đã bị hủy."),
            _           => ("Cập nhật đơn hàng", $"Đơn hàng #{orderId} có cập nhật mới."),
        };

        // Lấy ảnh sản phẩm đầu tiên của đơn để hiển thị kèm thông báo
        private static async Task<string?> GetOrderImageAsync(AppDbContext ctx, int orderId)
        {
            return await ctx.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .Select(oi => oi.Product.ImageUrl)
                .FirstOrDefaultAsync();
        }

        // Tạo + lưu + đẩy thông báo đơn hàng cho 1 user
        public static async Task NotifyOrderAsync(
            AppDbContext ctx,
            IHubContext<ChatHub> hub,
            int userId,
            int orderId,
            string status,
            string? reason = null,
            string? imageUrl = null)
        {
            var (title, message) = MapOrder(orderId, status);
            imageUrl ??= await GetOrderImageAsync(ctx, orderId);

            var noti = new Notification
            {
                UserId = userId,
                Type = "order",
                OrderId = orderId,
                Status = status,
                Title = title,
                Message = message,
                ImageUrl = imageUrl,
                Reason = reason,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            };
            ctx.Notifications.Add(noti);
            await ctx.SaveChangesAsync();

            try
            {
                await hub.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", new
                {
                    id = noti.Id,
                    type = noti.Type,
                    orderId = noti.OrderId,
                    status = noti.Status,
                    title = noti.Title,
                    message = noti.Message,
                    imageUrl = noti.ImageUrl,
                    reason = noti.Reason,
                    isRead = noti.IsRead,
                    createdAt = noti.CreatedAt,
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error pushing notification: {ex.Message}");
            }
        }

        // Thông báo chung (khuyến mãi, sinh nhật, hệ thống...)
        public static async Task NotifyAsync(
            AppDbContext ctx,
            IHubContext<ChatHub> hub,
            int userId,
            string type,
            string title,
            string message,
            string? imageUrl = null,
            string? reason = null)
        {
            var noti = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                ImageUrl = imageUrl,
                Reason = reason,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            };
            ctx.Notifications.Add(noti);
            await ctx.SaveChangesAsync();

            try
            {
                await hub.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", new
                {
                    id = noti.Id,
                    type = noti.Type,
                    orderId = noti.OrderId,
                    status = noti.Status,
                    title = noti.Title,
                    message = noti.Message,
                    imageUrl = noti.ImageUrl,
                    reason = noti.Reason,
                    isRead = noti.IsRead,
                    createdAt = noti.CreatedAt,
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error pushing notification: {ex.Message}");
            }
        }

        // Tự động kiểm tra và gửi quà sinh nhật cho con của người dùng nếu gần đến ngày sinh nhật trong vòng 30 ngày
        public static async Task CheckBirthdayVouchersAsync(AppDbContext ctx, IHubContext<ChatHub> hub, int userId)
        {
            var user = await ctx.Users.Include(u => u.Children).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.Children.Any()) return;

            var today = DateTime.UtcNow.Date;
            bool changed = false;

            foreach (var child in user.Children)
            {
                if (child.BirthDate == null) continue;

                var birthDate = child.BirthDate.Value.Date;
                var bdayThisYear = new DateTime(today.Year, birthDate.Month, birthDate.Day);
                var nextBday = bdayThisYear;
                if (bdayThisYear < today)
                {
                    nextBday = bdayThisYear.AddYears(1);
                }

                var daysToBday = (nextBday - today).TotalDays;
                if (daysToBday >= 0 && daysToBday <= 33) // trước sinh nhật 1 tháng + 3 ngày để kịp xử lý
                {
                    var targetYear = nextBday.Year;
                    var voucherCode = $"HPBD_{user.Id}_{child.Id}_{targetYear}";

                    var alreadyExists = await ctx.Vouchers.AnyAsync(v => v.Code == voucherCode);
                    if (!alreadyExists)
                    {
                        var voucher = new Voucher
                        {
                            Code = voucherCode,
                            Description = $"Mã giảm giá mừng sinh nhật bé {child.Name}",
                            DiscountPercent = 20,
                            ScopeType = "Birthday",
                            StartDate = DateTime.UtcNow,
                            EndDate = nextBday.AddDays(15), // Có hiệu lực đến 15 ngày sau sinh nhật
                            IsActive = true,
                            CreatedBy = user.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                        ctx.Vouchers.Add(voucher);
                        await ctx.SaveChangesAsync();

                        var userVoucher = new UserVoucher
                        {
                            UserId = user.Id,
                            VoucherId = voucher.Id,
                            IsUsed = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        ctx.UserVouchers.Add(userVoucher);

                        var noti = new Notification
                        {
                            UserId = user.Id,
                            Type = "promotion",
                            Title = $"Quà sinh nhật cho bé {child.Name} 🎁",
                            Message = $"Chúc mừng sinh nhật bé {child.Name}! 3TL-Store gửi tặng bạn mã giảm giá 20%: {voucherCode} (HSD đến {voucher.EndDate:dd/MM/yyyy}).",
                            ImageUrl = null,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        ctx.Notifications.Add(noti);
                        user.BirthdayRewardReceived = true;
                        changed = true;

                        await ctx.SaveChangesAsync();

                        try
                        {
                            await hub.Clients.Group($"User_{user.Id}").SendAsync("ReceiveNotification", new
                            {
                                id = noti.Id,
                                type = noti.Type,
                                title = noti.Title,
                                message = noti.Message,
                                isRead = noti.IsRead,
                                createdAt = noti.CreatedAt
                            });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error pushing SignalR notification: {ex.Message}");
                        }
                    }
                }
            }

            if (changed)
            {
                await ctx.SaveChangesAsync();
            }
        }
    }
}

