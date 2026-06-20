/// <summary>
/// Đề nghị gửi hàng từ Supplier gửi lên Admin để phê duyệt.
/// Sau khi Admin duyệt, Admin sẽ tạo biên lai tương ứng.
/// </summary>
public class SupplierProposal
{
    public int Id { get; set; }

    /// <summary>Mã đề nghị tự sinh, dạng PRP-YYYYMMDD-XXXX</summary>
    public string ProposalCode { get; set; } = string.Empty;

    /// <summary>ID của Supplier (User có role Supplier) tạo đề nghị</summary>
    public int SupplierId { get; set; }

    /// <summary>ID sản phẩm muốn cung ứng</summary>
    public int ProductId { get; set; }

    /// <summary>Số lượng đề nghị gửi</summary>
    public int ProposedQuantity { get; set; }

    /// <summary>Đơn giá đề xuất (giá nhập sỉ từ Supplier)</summary>
    public decimal ProposedUnitPrice { get; set; }

    /// <summary>
    /// Trạng thái xử lý:
    /// - Pending  : Supplier vừa gửi, chờ Admin xem xét
    /// - Approved : Admin chấp nhận đề nghị (sẽ tạo biên lai sau khi nhận hàng)
    /// - Rejected : Admin từ chối đề nghị
    /// - Completed: Admin đã tạo biên lai và nhập kho thành công
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>Ghi chú của Supplier khi tạo đề nghị</summary>
    public string? SupplierNote { get; set; }

    /// <summary>Ghi chú của Admin khi xử lý đề nghị (lý do chấp nhận / từ chối)</summary>
    public string? AdminNote { get; set; }

    /// <summary>Ngày dự kiến giao hàng (Supplier tự điền)</summary>
    public DateTime? EstimatedDelivery { get; set; }

    /// <summary>Ngày Supplier tạo đề nghị</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Ngày Admin xử lý đề nghị</summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>ID biên lai được tạo từ đề nghị này (nếu Completed)</summary>
    public int? ReceiptId { get; set; }

    // Navigation
    public BaseCore.Entities.User Supplier { get; set; } = null!;
    public BaseCore.Entities.Product Product { get; set; } = null!;
    public SupplierReceipt? Receipt { get; set; }
}
