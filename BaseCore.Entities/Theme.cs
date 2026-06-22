namespace BaseCore.Entities
{
    public class Theme
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties — Theme có thể thuộc nhiều Category (quan hệ nhiều-nhiều)
        public ICollection<CategoryTheme> CategoryThemes { get; set; } = new List<CategoryTheme>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
