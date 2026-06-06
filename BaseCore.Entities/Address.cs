namespace BaseCore.Entities
{
    public class Address
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = null!;

        // Helper
        public string FullAddress =>
            $"{StreetAddress}, {Ward}, {District}, {Province}";
    }
}