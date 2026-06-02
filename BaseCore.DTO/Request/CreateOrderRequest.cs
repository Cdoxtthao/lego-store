namespace BaseCore.DTO.Request
{
    public class CreateOrderRequest
    {
        public string ShippingAddress { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
        // Lấy từ Cart của user, không cần gửi items
    }
}