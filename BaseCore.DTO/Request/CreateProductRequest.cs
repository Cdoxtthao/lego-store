namespace BaseCore.DTO.Request
{
    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public string? Theme { get; set; }    // legacy cache
        public int? ThemeId { get; set; }     // FK tới bảng Themes
        public string? AgeRange { get; set; }
        public string? Highlights { get; set; }   // Đặc điểm nổi bật của sản phẩm
        public string? SetNumber { get; set; }
        public bool IsFeatured { get; set; } = false;
        public List<string>? Images { get; set; }
    }
}