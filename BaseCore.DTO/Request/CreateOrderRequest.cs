namespace BaseCore.DTO.Request
{
    public class CreateOrderRequest
    {
        public string ShippingAddress { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
        public List<int>? SelectedItemIds { get; set; }

        // Phí vận chuyển (0 nếu đơn >= 500k)
        public int ShippingFee { get; set; } = 0;

        // Gói quà & thiệp chúc mừng
        public int GiftFee { get; set; } = 0;       // phụ phí gói quà (đồng)
        public string? GiftNote { get; set; }       // mô tả gói quà + lời chúc (để seller thấy)

        // Mã giảm giá áp dụng (server tự tính lại số tiền giảm)
        public string? VoucherCode { get; set; }
    }
}