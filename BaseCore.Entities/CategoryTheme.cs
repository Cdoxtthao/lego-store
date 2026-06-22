namespace BaseCore.Entities
{
    // Bảng nối Category <-> Theme (quan hệ nhiều-nhiều)
    // Một danh mục có thể có nhiều chủ đề, một chủ đề có thể thuộc nhiều danh mục
    public class CategoryTheme
    {
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public int ThemeId { get; set; }
        public Theme Theme { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
