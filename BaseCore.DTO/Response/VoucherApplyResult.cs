namespace BaseCore.DTO.Response
{
    public class VoucherApplyResult
    {
        public bool Valid { get; set; }
        public int Discount { get; set; }        // số tiền giảm (đồng)
        public int VoucherId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
