/// <summary>
/// Biên lai giao hàng từ Supplier lên Admin.
/// Admin tạo biên lai khi nhận hàng, Supplier xem và xác nhận.
/// </summary>
public class SupplierReceipt
{
    public int Id { get; set; }

    /// <summary>Mã biên lai tự sinh, dạng RC-YYYYMMDD-XXXX</summary>
    public string ReceiptCode { get; set; } = string.Empty;

    /// <summary>ID của Supplier (User có role Supplier)</summary>
    public int SupplierId { get; set; }

    /// <summary>ID sản phẩm giao</summary>
    public int ProductId { get; set; }

    /// <summary>Số lượng giao thực tế</summary>
    public int Quantity { get; set; }

    /// <summary>Đơn giá nhập thỏa thuận</summary>
    public decimal UnitPrice { get; set; }

    /// <summary>Tổng giá trị biên lai = Quantity * UnitPrice</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Trạng thái xử lý:
    /// - Pending   : Admin tạo, chờ Supplier xem và xác nhận
    /// - Confirmed : Supplier đã xác nhận, kho đã được cập nhật
    /// - Disputed  : Supplier khiếu nại sai lệch, Admin cần xem xét lại
    /// - Resolved  : Admin đã giải quyết khiếu nại
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>Ghi chú từ Admin khi tạo biên lai</summary>
    public string? AdminNote { get; set; }

    /// <summary>Ghi chú phản hồi từ Supplier</summary>
    public string? SupplierNote { get; set; }

    /// <summary>Ngày Admin tạo biên lai</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Ngày Supplier xác nhận / phản hồi</summary>
    public DateTime? ProcessedAt { get; set; }

    // Navigation
    public BaseCore.Entities.User Supplier { get; set; } = null!;
    public BaseCore.Entities.Product Product { get; set; } = null!;
}
