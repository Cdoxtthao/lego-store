namespace BaseCore.DTO.Request
{
    public class UpdateProductRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public decimal? OldPrice { get; set; }
        public int? StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int? CategoryId { get; set; }
        public string? Theme { get; set; }
        public string? AgeRange { get; set; }
        public int? PieceCount { get; set; }
        public string? SetNumber { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsActive { get; set; }
        public List<string>? Images { get; set; }
    }
}