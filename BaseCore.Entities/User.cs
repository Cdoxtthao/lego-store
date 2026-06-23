namespace BaseCore.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public int RoleId { get; set; } = 4; // mặc định Customer
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Sinh nhật: số lần đã chỉnh sửa thông tin con (chỉ cho sửa tối đa 3 lần trước khi nhận mã lần đầu)
        public int BirthdayEditCount { get; set; } = 0;
        // Đã nhận mã sinh nhật lần đầu hay chưa
        public bool BirthdayRewardReceived { get; set; } = false;

        // Navigation properties
        public Role Role { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<ChildProfile> Children { get; set; } = new List<ChildProfile>();
    }
}