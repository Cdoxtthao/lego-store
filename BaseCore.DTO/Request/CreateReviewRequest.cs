namespace BaseCore.DTO.Request
{
    public class CreateReviewRequest
    {
        public int ProductId { get; set; }
        public int Rating { get; set; }    // 1-5
        public string? Comment { get; set; }
    }
}