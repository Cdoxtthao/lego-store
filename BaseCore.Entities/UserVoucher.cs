namespace BaseCore.Entities
{
    // Mã giảm giá mà một người dùng đang sở hữu (nhập mã hoặc được tặng/sinh nhật)
    public class UserVoucher
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int VoucherId { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Voucher Voucher { get; set; } = null!;
    }
}
