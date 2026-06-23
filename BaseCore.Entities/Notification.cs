namespace BaseCore.Entities
{
    // Thông báo gửi tới người dùng (đơn hàng, khuyến mãi, sinh nhật, hệ thống)
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        // Loại thông báo: order | promotion | birthday | system
        public string Type { get; set; } = "system";

        // Liên kết đơn hàng (nếu có)
        public int? OrderId { get; set; }

        // Trạng thái đơn: Pending | Confirmed | Shipping | Delivered | Cancelled
        public string? Status { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        // Ảnh kèm theo (ảnh sản phẩm/đơn hàng)
        public string? ImageUrl { get; set; }

        // Lý do của admin (ví dụ khi hủy đơn)
        public string? Reason { get; set; }

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}
