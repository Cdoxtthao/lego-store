namespace BaseCore.Entities
{
    // Bài viết "Góc sáng tạo" — blog chia sẻ cảm nhận của người dùng
    public class CreativePost
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public User User { get; set; } = null!;
    }
}
