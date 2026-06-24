namespace BaseCore.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        // Giá nhập bình quân gia quyền (cập nhật mỗi khi nhập biên lai) — dùng tính lãi
        public decimal ImportPrice { get; set; } = 0;
        public int StockQuantity { get; set; } = 0;
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public string? Theme { get; set; }   // Tên chủ đề (legacy / cache)
        public int? ThemeId { get; set; }    // FK tới bảng Themes
        public string? AgeRange { get; set; }
        public string? Gender { get; set; } = "Khác";    // Nam | Nữ | Khác
        public string? Highlights { get; set; }   // Đặc điểm nổi bật của sản phẩm
        public string? SetNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public int SoldCount { get; set; } = 0;
        public int DiscountPercent { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Category Category { get; set; } = null!;
        public Theme? ThemeNav { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}