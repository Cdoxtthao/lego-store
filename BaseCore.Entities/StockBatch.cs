using BaseCore.Entities;

public class StockBatch
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string BatchCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
    public int SupplierId { get; set; }
    public DateTime ImportDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "Active";
    public Product Product { get; set; } = null!;
    public User Supplier { get; set; } = null!;
}