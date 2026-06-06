using BaseCore.Repository.Interfaces;
using BaseCore.DTO.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepository _orderRepo;
        public OrdersController(IOrderRepository orderRepo)
        {
            _orderRepo = orderRepo;
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
            var orders = await _orderRepo.GetByUserIdAsync(GetUserId());
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
                    //Subtotal = oi.Price * oi.Quantity,
                }).ToList(),
            });
            return Ok(response);
        }

        // PUT api/orders/{id}/status — Admin/Seller cập nhật trạng thái
        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)

        {
            await _orderRepo.UpdateStatusAsync(id, status);
            return Ok(new { message = "Cập nhật thành công" });
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

            // Chỉ hủy được khi đang Pending hoặc Confirmed
            if (order.Status != "Pending" && order.Status != "Confirmed")
                return BadRequest(new { message = "Không thể hủy đơn hàng đang giao hoặc đã giao" });

            await _orderRepo.UpdateStatusAsync(id, "Cancelled");
            return Ok(new { message = "Hủy đơn hàng thành công" });
        }
    }
}