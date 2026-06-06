using Microsoft.EntityFrameworkCore;

namespace BaseCore.Entities
{
    public class AppDbContext : DbContext
    {
        // Constructor nhận options từ Dependency Injection
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Mỗi DbSet = một bảng trong database
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<StockBatch> StockBatches { get; set; }
        public DbSet<ReturnItem> ReturnItems { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed dữ liệu mặc định cho Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin" },
                new Role { Id = 2, Name = "Supplier" },
                new Role { Id = 3, Name = "Seller" },
                new Role { Id = 4, Name = "Customer" }
            );

            // Cấu hình kiểu dữ liệu decimal cho SQL Server
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Product>()
                .Property(p => p.OldPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<CartItem>()
                .Property(c => c.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderItem>()
                .Property(o => o.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Setting>().HasData(
                new Setting { Id = 1, Key = "SiteName", Value = "BrickDo", Description = "Tên website", Group = "General" },
                new Setting { Id = 2, Key = "SiteEmail", Value = "support@brickdo.vn", Description = "Email liên hệ", Group = "General" },
                new Setting { Id = 3, Key = "SitePhone", Value = "1900xxxx", Description = "Số điện thoại", Group = "General" },
                new Setting { Id = 4, Key = "SiteAddress", Value = "123 Đường LEGO, TP.HCM", Description = "Địa chỉ", Group = "General" },
                new Setting { Id = 5, Key = "ShippingFee", Value = "30000", Description = "Phí vận chuyển mặc định", Group = "Shipping" },
                new Setting { Id = 6, Key = "FreeShippingMin", Value = "500000", Description = "Đơn tối thiểu miễn ship", Group = "Shipping" },
                new Setting { Id = 7, Key = "MaintenanceMode", Value = "false", Description = "Chế độ bảo trì", Group = "System" },
                new Setting { Id = 8, Key = "MaxOrderQuantity", Value = "10", Description = "Số lượng tối đa mỗi đơn", Group = "Order" },
                new Setting { Id = 9, Key = "AllowReviews", Value = "true", Description = "Cho phép đánh giá", Group = "Product" },
                new Setting { Id = 10, Key = "PointsPerOrder", Value = "100", Description = "Điểm thưởng mỗi đơn", Group = "Loyalty" }
            );

            //modelBuilder.Entity<Promotion>()
            //    .HasOne(p => p.User)
            //    .WithMany()
            //    .HasForeignKey(p => p.CreatedBy)
            //    .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StockBatch>()
                .HasOne(s => s.Supplier)
                .WithMany()
                .HasForeignKey(s => s.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StockBatch>()
                .HasOne(s => s.Product)
                .WithMany()
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                 .HasOne(r => r.Order)
                 .WithMany()
                 .HasForeignKey(r => r.OrderId)
                 .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReturnItem>()
                 .HasOne(r => r.Product)
                 .WithMany()
                 .HasForeignKey(r => r.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);

            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
                    {
                        property.SetColumnType("decimal(18,2)");
                    }
        }
    }
}