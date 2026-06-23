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
            var isSeller = User.IsInRole("Seller");
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Tổng sản phẩm
            var totalProducts = await _context.Products.CountAsync(p => p.IsActive);

            // Đơn hàng
            var totalOrders = await _context.Orders.CountAsync();
            var pendingOrders = await _context.Orders
                .CountAsync(o => o.Status == "Pending");
            var cancelledOrders = await _context.Orders
                .CountAsync(o => o.Status == "Cancelled");
            var deliveredOrders = await _context.Orders
                .CountAsync(o => o.Status == "Delivered");

            // Biên lai đang chờ (Lọc theo Seller nếu là Seller)
            var receiptsQuery = _context.SupplierReceipts.AsQueryable();
            if (isSeller && int.TryParse(userIdStr, out int sellerIdVal))
            {
                receiptsQuery = receiptsQuery.Where(r => r.SellerId == sellerIdVal);
            }
            var pendingReceipts = await receiptsQuery
                .CountAsync(r => r.Status == "Pending" || r.Status == "PendingSupplier" || r.Status == "PendingSeller");

            // Tin nhắn chờ (số lượng người nhắn có tin chưa đọc)
            var waitingMessages = await _context.Messages
                .Where(m => m.IsFromUser && !m.IsRead)
                .Select(m => m.UserId)
                .Distinct()
                .CountAsync();

            // Tính lãi (doanh thu tính bằng đồng dựa theo lãi = giá bán - giá nhập)
            var totalProfit = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .Where(oi => oi.Order.Status != "Cancelled" && oi.Order.Status != "Returned")
                .SumAsync(oi => (decimal?)(oi.Price - oi.Product.ImportPrice) * oi.Quantity) ?? 0;

            // Trừ tiền biên lai nhập kho đã xác nhận — trừ TOÀN BỘ cho cả Admin và Seller
            // để doanh thu hai bên LUÔN GIỐNG NHAU (theo dõi thống nhất).
            var totalConfirmedReceiptsCost = await _context.SupplierReceipts
                .Where(r => r.Status == "Confirmed")
                .SumAsync(r => (decimal?)r.TotalAmount) ?? 0;
            totalProfit -= totalConfirmedReceiptsCost;

            return Ok(new
            {
                totalProducts,
                totalOrders,
                pendingOrders,
                cancelledOrders,
                deliveredOrders,
                pendingReceipts,
                waitingMessages,
                totalProfit,
            });
        }

        [HttpGet("revenue-chart")]
        public async Task<IActionResult> GetRevenueChart()
        {
            // Doanh thu 7 ngày gần nhất
            var data = new List<object>();
            var today = DateTime.UtcNow.Date;
            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var start = date;
                var end = date.AddDays(1);

                var revenue = await _context.Orders
                    .Where(o => o.Status != "Cancelled" && o.Status != "Returned"
                        && o.CreatedAt >= start
                        && o.CreatedAt < end)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                data.Add(new
                {
                    date = date.ToString("dd/MM"),
                    revenue,
                });
            }
            return Ok(data);
        }

        [HttpGet("revenue-details")]
        public async Task<IActionResult> GetRevenueDetails()
        {
            // Chi tiết doanh thu âm dương/vào ra từng sản phẩm
            var details = await _context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Status != "Cancelled" && oi.Order.Status != "Returned")
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    productId = g.Key,
                    productName = g.First().Product.Name,
                    productImage = g.First().Product.ImageUrl,
                    quantity = g.Sum(oi => oi.Quantity),
                    averagePrice = g.Average(oi => oi.Price),
                    importPrice = g.First().Product.ImportPrice,
                    profit = g.Sum(oi => (oi.Price - oi.Product.ImportPrice) * oi.Quantity)
                })
                .OrderByDescending(x => x.profit)
                .ToListAsync();

            return Ok(details);
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
            // Lấy theo doanh thu cao nhất trở xuống dựa theo đơn xác nhận thành công
            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Status != "Cancelled" && oi.Order.Status != "Returned")
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    productId = g.Key,
                    productName = g.First().Product.Name,
                    productImage = g.First().Product.ImageUrl,
                    totalSold = g.Sum(oi => oi.Quantity),
                    totalRevenue = g.Sum(oi => oi.Price * oi.Quantity),
                })
                .OrderByDescending(x => x.totalRevenue)
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
                    revenue = o.Status == "Cancelled" ? 0 
                            : (o.Status == "Returned" || o.Status == "Refunded") ? -o.TotalAmount 
                            : o.TotalAmount,
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