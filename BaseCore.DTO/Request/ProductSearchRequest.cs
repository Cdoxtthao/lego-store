namespace BaseCore.DTO.Request
{
    public class ProductSearchRequest
    {
        public string? Keyword { get; set; }       // tìm theo tên
        public int? CategoryId { get; set; }        // lọc theo danh mục
        public string? Theme { get; set; }          // lọc theo chủ đề
        public string? AgeRange { get; set; }       // lọc theo độ tuổi
        public decimal? MinPrice { get; set; }      // giá từ
        public decimal? MaxPrice { get; set; }      // giá đến
        public int? MinPieces { get; set; }         // số mảnh tối thiểu
        public bool? IsFeatured { get; set; }       // chỉ lấy sản phẩm nổi bật
        public string? SortBy { get; set; }         // price_asc, price_desc, newest
        public int Page { get; set; } = 1;          // trang hiện tại
        public int PageSize { get; set; } = 12;     // số item mỗi trang
    }
}