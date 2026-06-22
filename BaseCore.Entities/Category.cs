namespace BaseCore.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties — EF Core dùng để JOIN bảng
        public ICollection<Product> Products { get; set; } = new List<Product>();
        // Một Category có thể có nhiều Theme (quan hệ nhiều-nhiều qua CategoryTheme)
        public ICollection<CategoryTheme> CategoryThemes { get; set; } = new List<CategoryTheme>();
    }
}