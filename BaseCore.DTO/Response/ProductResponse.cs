namespace BaseCore.DTO.Response
{
    public class ProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public string? CategoryName { get; set; }
        public string? Theme { get; set; }
        public string? AgeRange { get; set; }
        public int? PieceCount { get; set; }
        public string? SetNumber { get; set; }
        public bool IsFeatured { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public int SoldCount { get; set; }

        // Tính % giảm giá để hiện badge "Giảm 20%"
        public int? DiscountPercent => OldPrice.HasValue && OldPrice > 0
            ? (int)((1 - Price / OldPrice.Value) * 100)
            : null;
        public List<ProductImageResponse> Images { get; set; } = new();
    }
    public class ProductImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsMain { get; set; }
        public int SortOrder { get; set; }
    }
}