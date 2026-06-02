namespace BaseCore.DTO.Response
{
    public class PagedResponse<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }     // tổng số bản ghi
        public int Page { get; set; }           // trang hiện tại
        public int PageSize { get; set; }       // số item mỗi trang
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPrevious => Page > 1;
        public bool HasNext => Page < TotalPages;
    }
}