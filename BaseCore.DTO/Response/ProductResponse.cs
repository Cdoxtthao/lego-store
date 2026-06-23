namespace BaseCore.DTO.Response
{
    public class ProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public decimal ImportPrice { get; set; }   // giá nhập bình quân (cho seller/admin)
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? Theme { get; set; }       // Tên chủ đề
        public int? ThemeId { get; set; }         // ID chủ đề
        public string? AgeRange { get; set; }
        public string? Gender { get; set; }
        public string? Highlights { get; set; }   // Đặc điểm nổi bật của sản phẩm
        public string? SetNumber { get; set; }
        public bool IsFeatured { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public int SoldCount { get; set; }
        public List<ProductImageResponse> Images { get; set; } = new();


        // Tính % giảm giá để hiện badge "Giảm 20%"
        private int? _discountPercent;
        public int? DiscountPercent
        {
            get => _discountPercent ?? (OldPrice.HasValue && OldPrice > 0
                ? (int)((1 - Price / OldPrice.Value) * 100)
                : null);
            set => _discountPercent = value;
        }

    }
    public class ProductImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsMain { get; set; }
        public int SortOrder { get; set; }
    }
}