namespace BaseCore.Entities
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string? PaymentMethod { get; set; }
        public string PaymentStatus { get; set; } = "Unpaid";
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Xóa mềm: chỉ admin xóa, đơn ẩn khỏi mọi truy vấn nhưng vẫn còn trong DB
        public bool IsDeleted { get; set; } = false;

        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}