using BaseCore.Repository.Interfaces;
using BaseCore.DTO.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using BaseCore.APIService.Hubs;
using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepository _orderRepo;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly AppDbContext _context;

        public OrdersController(IOrderRepository orderRepo, IHubContext<ChatHub> hubContext, AppDbContext context)
        {
            _orderRepo = orderRepo;
            _hubContext = hubContext;
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET api/orders — Admin/Seller xem tất cả
        [Authorize(Roles = "Admin,Seller")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            var (items, total) = await _orderRepo.GetAllAsync(page, pageSize, status);
            var response = items.Select(o => new OrderResponse
            {
                Id = o.Id,
                CustomerName = o.User.FullName,
                TotalAmount = o.TotalAmount,
                ShippingAddress = o.ShippingAddress,
                Status = o.Status,
                PaymentStatus = o.PaymentStatus,
                PaymentMethod = o.PaymentMethod,
                Note = o.Note,
                CreatedAt = o.CreatedAt,
                Items = o.OrderItems.Select(oi => new OrderItemResponse
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImage = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    //Subtotal = oi.Price * oi.Quantity,
                }).ToList(),
            });

            return Ok(new PagedResponse<OrderResponse>
            {
                Items = response,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            });
        }

        // GET api/orders/my — User xem đơn của mình
        [HttpGet("my")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserId();
            var orders = (await _orderRepo.GetByUserIdAsync(userId)).ToList();

            // 1. Lấy tất cả review của user này
            var userReviews = await _context.Reviews
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync<Review>();

            // 2. Nhóm review theo ProductId và đếm tổng số lượng review đã gửi
            var reviewCounts = userReviews
                .GroupBy(r => r.ProductId)
                .ToDictionary(g => g.Key, g => g.Count());

            // 3. Lấy danh sách các OrderItem của tất cả đơn hàng Delivered của user,
            // sắp xếp theo thời gian tạo đơn hàng tăng dần (cũ nhất trước)
            var deliveredOrderItems = orders
                .Where(o => o.Status == "Delivered")
                .OrderBy(o => o.CreatedAt)
                .SelectMany(o => o.OrderItems.Select(oi => new { OrderId = o.Id, oi.ProductId }))
                .ToList();

            // 4. Map tuần tự: 1 review tương ứng với 1 lần mua hàng, ưu tiên đơn hàng cũ hơn
            var reviewedItems = new HashSet<(int OrderId, int ProductId)>();
            var assignedCounts = new Dictionary<int, int>();

            foreach (var item in deliveredOrderItems)
            {
                var totalReviews = reviewCounts.GetValueOrDefault(item.ProductId, 0);
                var assigned = assignedCounts.GetValueOrDefault(item.ProductId, 0);
                if (assigned < totalReviews)
                {
                    reviewedItems.Add((item.OrderId, item.ProductId));
                    assignedCounts[item.ProductId] = assigned + 1;
                }
            }

            var response = orders.Select(o => new OrderResponse
            {
                Id = o.Id,
                CustomerName = o.User?.FullName ?? "",
                TotalAmount = o.TotalAmount,
                ShippingAddress = o.ShippingAddress,
                Status = o.Status,
                PaymentStatus = o.PaymentStatus,
                PaymentMethod = o.PaymentMethod,
                CreatedAt = o.CreatedAt,
                Items = o.OrderItems.Select(oi => new OrderItemResponse
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImage = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    IsReviewed = reviewedItems.Contains((o.Id, oi.ProductId))
                }).ToList(),
            });
            return Ok(response);
        }

        // PUT api/orders/{id}/status — Admin/Seller cập nhật trạng thái
        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var order = await _orderRepo.GetByIdAsync(id);
            if (order == null) return NotFound();

            if (order.Status == "Delivered" || order.Status == "Cancelled")
            {
                return BadRequest(new { message = "Đơn hàng đã hoàn thành hoặc đã hủy, không thể thay đổi trạng thái nữa." });
            }

            if (order.Status != "Pending")
            {
                return BadRequest(new { message = "Đơn hàng đã được xử lý và không ở trạng thái Chờ xác nhận." });
            }

            if (status != "Confirmed" && status != "Shipping" && status != "Cancelled")
            {
                return BadRequest(new { message = "Admin chỉ có thể Xác nhận hoặc Hủy đơn hàng." });
            }

            await _orderRepo.UpdateStatusAsync(id, status);

            try
            {
                await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = status });
                await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = status });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending SignalR notification: {ex.Message}");
            }

            return Ok(new { message = "Cập nhật thành công" });
        }

        // PUT api/orders/{id}/receive — User xác nhận đã nhận hàng
        [HttpPut("{id}/receive")]
        public async Task<IActionResult> ReceiveOrder(int id)
        {
            var userId = GetUserId();
            var order = await _orderRepo.GetByIdAsync(id);

            if (order == null) return NotFound();

            if (order.UserId != userId)
                return Forbid();

            if (order.Status != "Confirmed" && order.Status != "Shipping")
            {
                return BadRequest(new { message = "Chỉ có thể xác nhận đã nhận hàng khi đơn hàng đã xác nhận hoặc đang giao." });
            }

            await _orderRepo.UpdateStatusAsync(id, "Delivered");

            try
            {
                await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = "Delivered" });
                await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = "Delivered" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending SignalR notification: {ex.Message}");
            }

            return Ok(new { message = "Xác nhận đã nhận hàng thành công" });
        }

        // PUT api/orders/{id}/cancel — User tự hủy đơn
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = GetUserId();
            var order = await _orderRepo.GetByIdAsync(id);

            if (order == null) return NotFound();

            // Chỉ cho hủy đơn của chính mình
            if (order.UserId != userId && !User.IsInRole("Admin") && !User.IsInRole("Seller"))
                return Forbid();

            // Chỉ hủy được khi đang Pending
            if (order.Status != "Pending")
                return BadRequest(new { message = "Không thể hủy đơn hàng đã được xác nhận hoặc đã hủy." });

            await _orderRepo.UpdateStatusAsync(id, "Cancelled");

            try
            {
                await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = "Cancelled" });
                await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderStatusUpdate", new { orderId = id, status = "Cancelled" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending SignalR notification: {ex.Message}");
            }

            return Ok(new { message = "Hủy đơn hàng thành công" });
        }
    }
}