namespace BaseCore.Entities
{
    // Thông tin con của người dùng — dùng để gửi mã giảm giá sinh nhật
    public class ChildProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Name { get; set; }
        public string? Gender { get; set; }      // Nam | Nữ | Khác
        public int? Age { get; set; }
        public DateTime? BirthDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
