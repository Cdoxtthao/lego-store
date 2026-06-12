using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Seller")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfWeek = now.AddDays(-(int)now.DayOfWeek);

            // Tổng sản phẩm
            var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
            var newProductsThisWeek = await _context.Products
                .CountAsync(p => p.CreatedAt >= startOfWeek);

            // Đơn hàng
            var totalOrders = await _context.Orders.CountAsync();
            var newOrdersToday = await _context.Orders
                .CountAsync(o => o.CreatedAt.Date == now.Date);
            var pendingOrders = await _context.Orders
                .CountAsync(o => o.Status == "Pending");

            // Người dùng
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
            var newUsersThisWeek = await _context.Users
                .CountAsync(u => u.CreatedAt >= startOfWeek);

            // Doanh thu
            var totalRevenue = await _context.Orders
                .Where(o => o.Status != "Cancelled")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            var revenueThisMonth = await _context.Orders
                .Where(o => o.Status != "Cancelled" && o.CreatedAt >= startOfMonth)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            var revenueLastMonth = await _context.Orders
                .Where(o => o.Status != "Cancelled"
                    && o.CreatedAt >= startOfMonth.AddMonths(-1)
                    && o.CreatedAt < startOfMonth)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            // % tăng trưởng doanh thu
            var revenueGrowth = revenueLastMonth > 0
                ? Math.Round((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100, 1)
                : 0;

            return Ok(new
            {
                totalProducts,
                newProductsThisWeek,
                totalOrders,
                newOrdersToday,
                pendingOrders,
                totalUsers,
                newUsersThisWeek,
                totalRevenue,
                revenueThisMonth,
                revenueGrowth,
            });
        }

        [HttpGet("revenue-chart")]
        public async Task<IActionResult> GetRevenueChart()
        {
            var now = DateTime.UtcNow;

            // Doanh thu 6 tháng gần nhất
            var data = new List<object>();
            for (int i = 5; i >= 0; i--)
            {
                var month = now.AddMonths(-i);
                var start = new DateTime(month.Year, month.Month, 1);
                var end = start.AddMonths(1);

                var revenue = await _context.Orders
                    .Where(o => o.Status != "Cancelled"
                        && o.CreatedAt >= start
                        && o.CreatedAt < end)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                var orderCount = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= start && o.CreatedAt < end);

                data.Add(new
                {
                    month = month.ToString("MM/yyyy"),
                    revenue,
                    orderCount,
                });
            }
            return Ok(data);
        }

        [HttpGet("order-status-chart")]
        public async Task<IActionResult> GetOrderStatusChart()
        {
            var pendingCount = await _context.Orders.CountAsync(o => o.Status == "Pending");
            var shippingCount = await _context.Orders.CountAsync(o => o.Status == "Confirmed" || o.Status == "Shipping");
            var deliveredCount = await _context.Orders.CountAsync(o => o.Status == "Delivered");
            var cancelledCount = await _context.Orders.CountAsync(o => o.Status == "Cancelled");

            var data = new List<object>
            {
                new { status = "Pending", count = pendingCount },
                new { status = "Confirmed", count = shippingCount },
                new { status = "Delivered", count = deliveredCount },
                new { status = "Cancelled", count = cancelledCount }
            };
            return Ok(data);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProducts()
        {
            var topProducts = await _context.OrderItems
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    productId = g.Key,
                    productName = g.First().Product.Name,
                    productImage = g.First().Product.ImageUrl,
                    totalSold = g.Sum(oi => oi.Quantity),
                    totalRevenue = g.Sum(oi => oi.Price * oi.Quantity),
                })
                .OrderByDescending(x => x.totalSold)
                .Take(5)
                .ToListAsync();

            return Ok(topProducts);
        }

        [HttpGet("recent-orders")]
        public async Task<IActionResult> GetRecentOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new
                {
                    id = o.Id,
                    customerName = o.User.FullName,
                    totalAmount = o.TotalAmount,
                    status = o.Status,
                    createdAt = o.CreatedAt,
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = new List<object>();

            // Đơn hàng mới trong 24h
            var newOrders = await _context.Orders
                .Include(o => o.User)
                .Where(o => o.CreatedAt >= DateTime.UtcNow.AddHours(-24))
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .ToListAsync();

            foreach (var order in newOrders)
            {
                notifications.Add(new
                {
                    id = $"order-{order.Id}",
                    type = "new_order",
                    title = "Đơn hàng mới",
                    message = $"{order.User.FullName} vừa đặt đơn #{order.Id}",
                    amount = order.TotalAmount,
                    createdAt = order.CreatedAt,
                    isRead = false,
                    link = "/admin/orders",
                });
            }

            // Đơn hàng chờ xử lý
            var pendingOrders = await _context.Orders
                .Include(o => o.User)
                .Where(o => o.Status == "Pending")
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .ToListAsync();

            foreach (var order in pendingOrders)
            {
                notifications.Add(new
                {
                    id = $"pending-{order.Id}",
                    type = "pending_order",
                    title = "Đơn chờ xác nhận",
                    message = $"Đơn #{order.Id} của {order.User.FullName} chờ xác nhận",
                    amount = order.TotalAmount,
                    createdAt = order.CreatedAt,
                    isRead = false,
                    link = "/admin/orders",
                });
            }

            // Sản phẩm sắp hết hàng
            var lowStockProducts = await _context.Products
                .Where(p => p.StockQuantity <= 5 && p.IsActive)
                .OrderBy(p => p.StockQuantity)
                .Take(5)
                .ToListAsync();

            foreach (var product in lowStockProducts)
            {
                notifications.Add(new
                {
                    id = $"stock-{product.Id}",
                    type = "low_stock",
                    title = "Sắp hết hàng",
                    message = $"{product.Name} chỉ còn {product.StockQuantity} sản phẩm",
                    amount = (decimal?)null,
                    createdAt = product.UpdatedAt ?? product.CreatedAt,
                    isRead = false,
                    link = "/admin/products",
                });
            }

            return Ok(notifications.OrderByDescending(n => ((dynamic)n).createdAt).Take(15));
        }
    }
}