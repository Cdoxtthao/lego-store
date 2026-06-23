namespace BaseCore.Entities
{
    // Mã giảm giá do Seller tạo
    public class Voucher
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;       // dòng code để user nhập nhận mã
        public string? Description { get; set; }
        public int DiscountPercent { get; set; }

        // Phạm vi: All (tổng thể) | Specific (danh mục/chủ đề/sản phẩm) | Birthday (sinh nhật)
        public string ScopeType { get; set; } = "All";

        // Với Specific: lưu danh sách id dạng "1,2,3" (có thể rỗng)
        public string? CategoryIds { get; set; }
        public string? ThemeIds { get; set; }
        public string? ProductIds { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;

        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
