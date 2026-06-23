namespace BaseCore.DTO.Response
{
    public class OrderResponse
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemResponse> Items { get; set; } = new();
    }

    public class OrderItemResponse
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        private decimal? _subtotal;
        public decimal Subtotal 
        { 
            get => _subtotal ?? (Price * Quantity); 
            set => _subtotal = value; 
        }
        public bool IsReviewed { get; set; }
    }
}